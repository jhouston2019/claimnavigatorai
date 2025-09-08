const OpenAI = require("openai");
const { getBlob } = require("@netlify/blobs");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");

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
    let extractedText = "";
    let fileType = "";
    let fileName = "";

    // Check if this is a multipart form upload
    if (event.headers['content-type'] && event.headers['content-type'].includes('multipart/form-data')) {
      // Parse multipart form data manually for Netlify Functions
      const boundary = event.headers['content-type'].split('boundary=')[1];
      const body = Buffer.from(event.body, 'base64');
      
      // Simple multipart parsing for file uploads
      const parts = body.toString().split('--' + boundary);
      
      for (const part of parts) {
        if (part.includes('Content-Disposition: form-data; name="document"')) {
          // Extract file content
          const fileStart = part.indexOf('\r\n\r\n') + 4;
          const fileEnd = part.lastIndexOf('\r\n');
          const fileContent = part.substring(fileStart, fileEnd);
          
          // Extract filename from headers
          const filenameMatch = part.match(/filename="([^"]+)"/);
          fileName = filenameMatch ? filenameMatch[1] : 'uploaded-file';
          
          // Determine file type from filename extension
          const extension = fileName.split('.').pop().toLowerCase();
          if (extension === 'pdf') {
            fileType = 'application/pdf';
            try {
              const pdfBuffer = Buffer.from(fileContent, 'binary');
              const pdfData = await pdfParse(pdfBuffer);
              extractedText = pdfData.text;
            } catch (pdfError) {
              console.error('PDF parsing error:', pdfError);
              extractedText = "Error: Could not parse PDF content";
            }
          } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
            fileType = `image/${extension}`;
            try {
              const imageBuffer = Buffer.from(fileContent, 'binary');
              const result = await Tesseract.recognize(imageBuffer, 'eng', {
                logger: m => console.log(m)
              });
              extractedText = result.data.text;
            } catch (ocrError) {
              console.error('OCR error:', ocrError);
              extractedText = "Error: Could not perform OCR on image";
            }
          } else if (['txt', 'doc', 'docx'].includes(extension)) {
            fileType = 'text/plain';
            extractedText = fileContent;
          } else {
            return {
              statusCode: 400,
              body: JSON.stringify({ error: "Unsupported file type. Please upload PDF, image, or text document." })
            };
          }
          break;
        }
      }
    } else {
      // Handle JSON payload (text input)
      const { content, documentType = "text" } = JSON.parse(event.body);
      extractedText = content || "";
      fileType = documentType;
      fileName = "text-input";
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No content found in document or text input" })
      };
    }

    // Check user credits before processing
    const creditsStore = getBlob('credits');
    const userCredits = await creditsStore.get(context.clientContext.user.sub);
    
    if (!userCredits || userCredits.credits < 1) {
      return {
        statusCode: 402,
        body: JSON.stringify({ error: "Insufficient credits. Please purchase more credits to continue." })
      };
    }

    // Generate AI response
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI claims response assistant specializing in insurance claim documentation. Your role is to analyze uploaded insurer emails, denial letters, and other carrier or claim correspondences.

          Your task is to:
          1. Extract and summarize key issues from the document
          2. Identify leverage points and potential arguments
          3. Draft a polished, professional, persuasive, and powerful response letter
          4. Ensure the response is directly applicable to the uploaded document
          5. Include relevant legal references and precedents when appropriate
          6. Close with a strong professional call to action
          7. Format the response in a clear, structured manner

          Document Type: ${fileType}
          File Name: ${fileName}

          ⚠️ IMPORTANT: Do not provide legal advice — only AI-assisted drafting. Every output must be final, polished, and ready to send. Focus on factual analysis and persuasive argumentation.`
        },
        {
          role: "user",
          content: `Please analyze this ${fileType} document and generate a professional response:\n\n${extractedText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiResponse = response.choices[0].message.content;

    // Store the response in Netlify Blobs
    const responsesStore = getBlob('responses');
    const responseId = `${context.clientContext.user.sub}-${Date.now()}`;
    
    await responsesStore.set(responseId, JSON.stringify({
      userId: context.clientContext.user.sub,
      originalDocument: {
        type: fileType,
        name: fileName,
        content: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '')
      },
      aiResponse: aiResponse,
      timestamp: new Date().toISOString(),
      model: "gpt-4o-mini",
      tokens: response.usage?.total_tokens || 0
    }));

    // Deduct credits
    const newCredits = userCredits.credits - 1;
    await creditsStore.set(context.clientContext.user.sub, {
      ...userCredits,
      credits: newCredits,
      lastUsed: new Date().toISOString()
    });

    // Store usage analytics
    const analyticsStore = getBlob('analytics');
    await analyticsStore.set(`usage-${context.clientContext.user.sub}-${Date.now()}`, JSON.stringify({
      userId: context.clientContext.user.sub,
      action: 'AI_RESPONSE_GENERATION',
      documentType: fileType,
      documentName: fileName,
      tokensUsed: response.usage?.total_tokens || 0,
      creditsDeducted: 1,
      timestamp: new Date().toISOString()
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        output: aiResponse,
        documentInfo: {
          type: fileType,
          name: fileName,
          contentLength: extractedText.length
        },
        usage: {
          creditsRemaining: newCredits,
          tokensUsed: response.usage?.total_tokens || 0
        },
        responseId: responseId
      })
    };

  } catch (error) {
    console.error('AI generate response error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate AI response" })
    };
  }
};
