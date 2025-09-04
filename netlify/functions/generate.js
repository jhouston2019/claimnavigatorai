const OpenAI = require("openai");
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
const { getStore } = require("@netlify/blobs");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Auth required
  const user = context.clientContext?.user;
  if (!user) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized - Please login' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const language = (body.language || 'en').toLowerCase();
    let promptText = (body.text || '').toString();

    // Optional uploaded file parsing
    const fileBase64 = body.fileBase64;
    const fileMime = (body.fileMime || '').toLowerCase();
    if (!promptText && fileBase64 && fileMime) {
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      if (fileMime === 'application/pdf') {
        const parsed = await pdfParse(fileBuffer);
        promptText = parsed.text || '';
      } else if (fileMime === 'text/plain') {
        promptText = fileBuffer.toString('utf8');
      } else if (fileMime === 'image/jpeg' || fileMime === 'image/png') {
        const ocr = await Tesseract.recognize(fileBuffer, 'eng');
        promptText = ocr.data?.text || '';
      }
    }

    if (!promptText || promptText.length < 50) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Please provide at least 50 characters of text or a valid document to parse.' }) };
    }

    // Check and deduct one credit
    const { availableCredits, chosenPurchaseId } = await getAndReserveCredit(user.email);
    if (availableCredits <= 0 || !chosenPurchaseId) {
      return { statusCode: 402, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No credits remaining. Please purchase more.' }) };
    }

    // Build messages
    const systemMessage = language === 'es'
      ? 'Eres un asistente de respuestas de reclamaciones. Analiza documentos del asegurador y redacta una respuesta profesional, persuasiva y aplicable. No des asesoría legal.'
      : 'You are an AI claims response assistant. Analyze insurer correspondence and draft a professional, persuasive, directly applicable response. Do not provide legal advice.';

    const userMessage = promptText;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    const aiText = (completion.choices?.[0]?.message?.content || '').trim();

    // Generate PDF and DOCX buffers
    const pdfBuffer = await generatePdf(aiText);
    const docxBuffer = await generateDocx(aiText);

    // Store in Netlify Blobs and return signed links
    const documents = getStore('documents');
    const timestamp = Date.now();
    const safeEmail = user.email.replace(/[^a-z0-9-_@.]+/gi, '-');
    const pdfName = `${safeEmail}_${timestamp}.pdf`;
    const docxName = `${safeEmail}_${timestamp}.docx`;
    await documents.set(pdfName, pdfBuffer);
    await documents.set(docxName, docxBuffer);

    const pdfUrl = `/.netlify/functions/download?file=${encodeURIComponent(pdfName)}`;
    const docxUrl = `/.netlify/functions/download?file=${encodeURIComponent(docxName)}`;

    // Compute remaining credits after deduction
    const remaining = await computeRemainingCredits(user.email);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: aiText,
        pdf: pdfUrl,
        docx: docxUrl,
        creditsRemaining: remaining
      })
    };
  } catch (error) {
    console.error('generate error:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Generation failed', message: error.message }) };
  }
};

async function generatePdf(text) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(16).text('ClaimNavigatorAI — AI Response', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(text, { align: 'left' });
    doc.end();
  });
}

async function generateDocx(text) {
  const paragraphs = [];
  paragraphs.push(new Paragraph({ text: 'ClaimNavigatorAI — AI Response', heading: HeadingLevel.HEADING_1 }));
  paragraphs.push(new Paragraph(''));
  for (const line of text.split(/\r?\n/)) {
    paragraphs.push(new Paragraph(line));
  }
  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  return await Packer.toBuffer(doc);
}

async function getAndReserveCredit(email) {
  const users = getStore('users');
  const purchases = getStore('purchases');
  const userData = await users.getJSON(email);
  if (!userData || !Array.isArray(userData.purchases) || userData.purchases.length === 0) {
    return { availableCredits: 0 };
  }
  let total = 0;
  let used = 0;
  let selected = null;
  for (const sessionId of userData.purchases) {
    const record = await purchases.getJSON(sessionId);
    if (!record) continue;
    const credits = record.aiCredits || 0;
    const consumed = record.creditsUsed || 0;
    total += credits;
    used += consumed;
    if (!selected && consumed < credits) {
      selected = sessionId;
    }
  }
  const available = total - used;
  if (available <= 0 || !selected) return { availableCredits: 0 };

  // Deduct 1 credit from selected purchase
  const chosen = await purchases.getJSON(selected);
  chosen.creditsUsed = (chosen.creditsUsed || 0) + 1;
  chosen.lastUsed = new Date().toISOString();
  await purchases.setJSON(selected, chosen);
  return { availableCredits: available - 1, chosenPurchaseId: selected };
}

async function computeRemainingCredits(email) {
  const users = getStore('users');
  const purchases = getStore('purchases');
  const userData = await users.getJSON(email);
  if (!userData || !Array.isArray(userData.purchases)) return 0;
  let total = 0;
  let used = 0;
  for (const sessionId of userData.purchases) {
    const record = await purchases.getJSON(sessionId);
    if (!record) continue;
    total += record.aiCredits || 0;
    used += record.creditsUsed || 0;
  }
  return Math.max(0, total - used);
}
