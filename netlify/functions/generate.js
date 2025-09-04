const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

exports.handler = async (event, context) => {
  try {
    const user = context.clientContext && context.clientContext.user;
    if (!user) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { fileName, fileType, fileBase64, uploadedText } = JSON.parse(event.body || '{}');

    let extractedText = uploadedText || '';

    if (!extractedText && fileBase64 && fileType) {
      const buffer = Buffer.from(fileBase64, 'base64');
      if (fileType === 'application/pdf' || (fileName || '').toLowerCase().endsWith('.pdf')) {
        const result = await pdfParse(buffer);
        extractedText = result.text || '';
      } else if (fileType.startsWith('image/') || /(png|jpe?g)$/i.test(fileName || '')) {
        const { data } = await Tesseract.recognize(buffer, 'eng');
        extractedText = data && data.text ? data.text : '';
      } else if (fileType === 'text/plain' || (fileName || '').toLowerCase().endsWith('.txt')) {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No readable content found in upload' }) };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI claims response assistant. Analyze insurer communications and draft a professional response.

Rules:
1) Extract and summarize key issues.
2) Identify leverage points.
3) Draft a polished, persuasive response letter applicable to the uploaded document.
4) Close with a strong professional call to action.
5) Do not provide legal advice.`
        },
        {
          role: "user",
          content: extractedText
        }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output: response.choices[0].message.content })
    };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: error.message }) };
  }
};
