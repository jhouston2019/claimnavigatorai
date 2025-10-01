// /lib/generatorHandler.js
// Client-side version of the generator handler

import { saveGeneratedDoc } from './documents.js';

// Example: assume you already have an API route or Netlify function that
// generates the raw HTML (letter) from OpenAI. This handler stitches it together.
export async function handleGenerateAndSave({
  docType,
  lang,
  inputJson,
}) {
  try {
    // 1. Call your AI generator function/endpoint
    const aiRes = await fetch('/.netlify/functions/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, lang, inputJson }),
    });
    const { html } = await aiRes.json();
    if (!html) throw new Error('No AI output received');

    // 2. Convert HTML to PDF + DOCX
    // (Option A: do this client-side; Option B: move conversion to Netlify function for reliability)
    const pdfBlob = await htmlToPdf(html);
    const docxBlob = await htmlToDocx(html);

    // 3. Save document in Supabase
    await saveGeneratedDoc({
      docType,
      lang,
      inputJson,
      htmlExcerpt: html.slice(0, 200), // first 200 chars
      pdfBlob,
      docxBlob,
    });

    return { ok: true };
  } catch (err) {
    console.error('Generation failed:', err);
    throw err;
  }
}

// --- Helper Converters ---
async function htmlToPdf(html) {
  // Lazy-load the library so it only runs in browser
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.html(html, { x: 10, y: 10 });
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

async function htmlToDocx(html) {
  // Simple HTML → DOCX converter using html-docx-js
  const { default: HTMLtoDOCX } = await import('html-docx-js/dist/html-docx');
  const buffer = HTMLtoDOCX(html);
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
