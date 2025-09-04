const OpenAI = require("openai");
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { getStore } = require('@netlify/blobs');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  try {
    const user = context.clientContext && context.clientContext.user;
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const { uploadedText, fileBase64, fileType, sessionId } = JSON.parse(event.body || '{}');

    let inputText = uploadedText || '';

    if (!inputText && fileBase64 && fileType) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const mime = String(fileType).toLowerCase();
      if (mime.includes('pdf')) {
        const parsed = await pdfParse(buffer);
        inputText = parsed.text || '';
      } else if (mime.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });
        inputText = text || '';
      }
    }

    if (!inputText) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No input content provided' }) };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI claims response assistant. Your role is to analyze uploaded insurer emails, denial letters, and other carrier or claim correspondences. 

          Your task is to:
          1. Extract and summarize key issues.
          2. Identify leverage points.
          3. Draft a polished, professional, persuasive, powerful response letter.
          4. Ensure the response is directly applicable to the uploaded document.
          5. Close with a strong professional call to action.

          ⚠️ Do not provide legal advice — only AI-assisted drafting. Every output must be final, polished, and ready to send.`
        },
        {
          role: "user",
          content: inputText
        }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    // Deduct one credit if possible
    try {
      const userEmail = user.email;
      const userStore = getStore('users');
      const purchasesStore = getStore('purchases');
      const userData = await userStore.getJSON(userEmail);
      if (userData && Array.isArray(userData.purchases) && userData.purchases.length > 0) {
        for (let i = userData.purchases.length - 1; i >= 0; i -= 1) {
          const pid = userData.purchases[i];
          const purchase = await purchasesStore.getJSON(pid);
          if (!purchase) continue;
          const total = purchase.aiCredits || 0;
          const used = purchase.creditsUsed || 0;
          if (used < total) {
            purchase.creditsUsed = used + 1;
            purchase.lastUsed = new Date().toISOString();
            await purchasesStore.setJSON(pid, purchase);
            break;
          }
        }
      }
    } catch (e) {
      console.error('Credit deduction failed:', e);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ output: response.choices[0].message.content })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
