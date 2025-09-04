const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

exports.handler = async (event, context) => {
  // Require Netlify Identity auth
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { text, language, fileBase64, fileType, fileName } = body;

    let extractedText = '';

    if (fileBase64 && fileType) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const mime = (fileType || '').toLowerCase();

      if (mime.includes('pdf') || (fileName || '').toLowerCase().endsWith('.pdf')) {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      } else if (mime.includes('png') || mime.includes('jpg') || mime.includes('jpeg') || /(\.png|\.jpe?g)$/i.test(fileName || '')) {
        const ocr = await Tesseract.recognize(buffer, (language === 'es' ? 'spa' : 'eng'));
        extractedText = ocr.data && ocr.data.text ? ocr.data.text : '';
      } else if (mime.includes('text') || /(\.txt)$/i.test(fileName || '')) {
        extractedText = buffer.toString('utf8');
      } else {
        extractedText = '';
      }
    }

    const uploadedText = (text && text.trim().length > 0) ? text : extractedText || '';

    if (!uploadedText || uploadedText.length < 20) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No readable content found in upload or text too short.' }) };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI claims response assistant. Analyze insurer correspondence and draft a professional response. 

          Tasks:
          1) Summarize key issues
          2) Identify leverage points
          3) Draft a polished, persuasive response tailored to the document
          4) Close with a strong call to action
          5) Avoid legal advice.

          Output in ${language === 'es' ? 'Spanish' : 'English'}.`
        },
        {
          role: "user",
          content: uploadedText
        }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    // Note: Existing app expects fields: text, pdf, docx, creditsRemaining
    const generated = response.choices[0].message.content;

    // Build export endpoints (client will call with POST including content/format)
    const pdfEndpoint = '/.netlify/functions/export-document';
    const docxEndpoint = '/.netlify/functions/export-document';

    // Calculate updated credits (decrement one from available if present)
    let creditsRemaining = 0;
    try {
      const { getStore } = require('@netlify/blobs');
      const userEmail = user.email;
      const userStore = getStore('users');
      const purchaseStore = getStore('purchases');
      const userData = await userStore.getJSON(userEmail);
      if (userData) {
        let totalCredits = 0;
        let creditsUsed = 0;
        for (const sessionId of userData.purchases || []) {
          const purchase = await purchaseStore.getJSON(sessionId);
          if (purchase) {
            totalCredits += purchase.aiCredits || 0;
            creditsUsed += purchase.creditsUsed || 0;
          }
        }
        creditsRemaining = Math.max(0, totalCredits - creditsUsed - 1);
        // Mark one credit used on the most recent purchase with remaining credits
        for (const sessionId of (userData.purchases || []).slice().reverse()) {
          const purchase = await purchaseStore.getJSON(sessionId);
          if (!purchase) continue;
          const available = (purchase.aiCredits || 0) - (purchase.creditsUsed || 0);
          if (available > 0) {
            purchase.creditsUsed = (purchase.creditsUsed || 0) + 1;
            purchase.lastUsed = new Date().toISOString();
            await purchaseStore.setJSON(sessionId, purchase);
            break;
          }
        }
      }
    } catch (_) {}

    return {
      statusCode: 200,
      body: JSON.stringify({ text: generated, creditsRemaining, pdf: pdfEndpoint, docx: docxEndpoint })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
