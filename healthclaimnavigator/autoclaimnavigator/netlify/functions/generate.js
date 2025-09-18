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
          content: `You are a senior insurance claims professional and legal strategist with 25+ years of experience. Your expertise is in analyzing complex insurance correspondence and drafting powerful, persuasive response letters that maximize claim settlements.

CRITICAL REQUIREMENTS:
- Analyze the uploaded document with expert-level insight
- Extract all key issues, arguments, and leverage points
- Draft a polished, professional, and strategically powerful response
- Use precise legal and insurance terminology appropriately
- Structure the response with clear headings and logical flow
- Include specific policy references and legal precedents
- End with a strong, actionable call to action

PROFESSIONAL STANDARDS:
- Write in an authoritative tone that commands respect
- Address every point raised by the insurer comprehensively
- Use persuasive language that builds a strong case for coverage
- Ensure the response is ready to send without additional editing
- Maintain a firm but professional stance protecting policyholder rights
- Include strategic positioning for maximum settlement potential

FORMAT REQUIREMENTS:
- Professional letter format with proper structure
- Clear subject line referencing the original correspondence
- Organized sections with descriptive headings
- Bullet points for key arguments and evidence
- Strong conclusion with specific next steps and deadlines
- Professional signature block

⚠️ IMPORTANT: Do not provide legal advice — only AI-assisted professional drafting. Every output must be final, polished, and ready to send.`
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
