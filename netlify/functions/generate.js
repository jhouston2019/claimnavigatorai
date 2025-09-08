const OpenAI = require("openai");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // Verify Netlify Identity authentication
  if (!context.clientContext?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
    };
  }

  try {
    const { uploadedText, fileType, fileBuffer } = JSON.parse(event.body);
    
    let extractedText = uploadedText;

    // If fileBuffer is provided and fileType is specified, parse the document
    if (fileBuffer && fileType) {
      try {
        if (fileType === 'pdf') {
          // Parse PDF using pdf-parse
          const pdfData = await pdfParse(Buffer.from(fileBuffer, 'base64'));
          extractedText = pdfData.text;
        } else if (['jpg', 'jpeg', 'png'].includes(fileType.toLowerCase())) {
          // OCR images using tesseract.js
          const worker = await createWorker('eng');
          const { data: { text } } = await worker.recognize(Buffer.from(fileBuffer, 'base64'));
          await worker.terminate();
          extractedText = text;
        } else if (fileType === 'txt') {
          // Direct decode for text files
          extractedText = Buffer.from(fileBuffer, 'base64').toString('utf-8');
        }
        // For other file types, use the provided uploadedText
      } catch (parseError) {
        console.error('Document parsing error:', parseError);
        // Fall back to uploadedText if parsing fails
      }
    }

    if (!extractedText || extractedText.trim() === '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No text content could be extracted from the document" })
      };
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
          content: extractedText
        }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ output: response.choices[0].message.content })
    };
  } catch (error) {
    console.error('Generate response error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
