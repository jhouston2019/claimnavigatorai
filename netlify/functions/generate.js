const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');

exports.handler = async (event, context) => {
  try {
    const user = context.clientContext?.user;
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized - Please login' }) };
    }

    const body = JSON.parse(event.body || '{}');
    // Support both legacy 'uploadedText' and new 'text' or 'file' inputs
    let extractedText = body.uploadedText || body.text || '';

    if (!extractedText && body.file && body.fileType) {
      const base64 = body.file.includes(',') ? body.file.split(',').pop() : body.file;
      const fileBuffer = Buffer.from(base64, 'base64');
      const type = String(body.fileType).toLowerCase();

      if (type.includes('pdf') || (body.fileName && body.fileName.toLowerCase().endsWith('.pdf'))) {
        const parsed = await pdf(fileBuffer);
        extractedText = parsed.text || '';
      } else if (type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
        const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
        extractedText = text || '';
      } else if (type.includes('text') || (body.fileName && body.fileName.toLowerCase().endsWith('.txt'))) {
        extractedText = fileBuffer.toString('utf-8');
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No input text provided' }) };
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
        { role: "user", content: extractedText }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ output: response.choices[0].message.content })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
