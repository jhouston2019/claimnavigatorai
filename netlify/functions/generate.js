const OpenAI = require("openai");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const mammoth = require("mammoth");
const { getStore } = require("@netlify/blobs");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const headers = { ...corsHeaders(), 'Content-Type': 'application/json' };

  // Require auth via Netlify Identity
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const uploadedText = body.uploadedText;
    const fileBase64 = body.fileBase64;
    const fileType = (body.fileType || '').toLowerCase();
    const fileName = body.fileName || '';
    const language = body.language === 'es' ? 'spa' : 'eng';

    // Check credits first
    const hasCredit = await ensureAndConsumeCredit(user.email);
    if (!hasCredit) {
      return { statusCode: 402, headers, body: JSON.stringify({ error: 'Insufficient credits' }) };
    }

    // Extract text
    let extractedText = '';
    if (uploadedText && String(uploadedText).trim().length > 0) {
      extractedText = String(uploadedText);
    } else if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
        const data = await pdfParse(buffer);
        extractedText = data.text || '';
      } else if (/(docx)$/i.test(fileName) || fileType.includes('word')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } else if (/image\//.test(fileType) || /(png|jpg|jpeg|webp|tif|tiff)$/i.test(fileName)) {
        const { data: { text } } = await Tesseract.recognize(buffer, language);
        extractedText = text || '';
      }
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unable to extract sufficient text from input' }) };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: extractedText }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    const output = response.choices[0].message.content;

    // Persist response for user history
    const responsesStore = getStore('responses');
    const key = `${user.email}/${Date.now()}_${safeKey(fileName || 'input')}.json`;
    await responsesStore.setJSON(key, {
      createdAt: new Date().toISOString(),
      email: user.email,
      fileName: fileName || null,
      fileType: fileType || null,
      language,
      inputPreview: extractedText.slice(0, 2000),
      output
    });

    return { statusCode: 200, headers, body: JSON.stringify({ output }) };
  } catch (error) {
    console.error('generate error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to generate', message: error.message }) };
  }
};

function systemPrompt() {
  return (
    "You are an AI claims response assistant. Your role is to analyze uploaded insurer emails, denial letters, and other carrier or claim correspondences.\n\n" +
    "Your task is to: 1) Extract and summarize key issues. 2) Identify leverage points. 3) Draft a polished, professional, persuasive, powerful response letter. 4) Ensure the response is directly applicable to the uploaded document. 5) Close with a strong professional call to action.\n\n" +
    "Do not provide legal advice — only AI-assisted drafting. Every output must be final, polished, and ready to send."
  );
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function safeKey(name) {
  return String(name).replace(/[^a-z0-9-_\.]/gi, '_');
}

async function ensureAndConsumeCredit(email) {
  // Load user purchases and decrement one credit from the first available purchase
  const userStore = getStore('users');
  const purchaseStore = getStore('purchases');

  const userData = await userStore.getJSON(email);
  if (!userData || !Array.isArray(userData.purchases) || userData.purchases.length === 0) return false;

  for (const sessionId of userData.purchases) {
    const purchase = await purchaseStore.getJSON(sessionId);
    if (!purchase) continue;
    const total = Number(purchase.aiCredits || 0);
    const used = Number(purchase.creditsUsed || 0);
    if (total > used) {
      purchase.creditsUsed = used + 1;
      purchase.lastUsed = new Date().toISOString();
      await purchaseStore.setJSON(sessionId, purchase);
      return true;
    }
  }
  return false;
}

