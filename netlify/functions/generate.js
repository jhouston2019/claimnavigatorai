const OpenAI = require('openai');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs').promises;
const { getStore } = require("@netlify/blobs");

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map();

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Check authentication - Netlify Identity provides user context
  const user = context.clientContext?.user;
  if (!user) {
    return { 
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized - Please login' })
    };
  }

  const userEmail = user.email;
  const userId = user.sub;

  // Rate limiting check - max 10 requests per hour per user
  const now = Date.now();
  const userRateKey = `rate_${userId}`;
  const userRateData = rateLimitMap.get(userRateKey) || { count: 0, resetTime: now + 3600000 };
  
  if (userRateData.resetTime < now) {
    userRateData.count = 0;
    userRateData.resetTime = now + 3600000;
  }
  
  if (userRateData.count >= 10) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ 
        error: 'Too many requests. Please wait before generating more responses.',
        resetTime: new Date(userRateData.resetTime).toISOString()
      })
    };
  }

  try {
    const { text, language = 'en' } = JSON.parse(event.body);
    
    if (!text || text.trim().length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide insurer letter text (minimum 10 characters)' })
      };
    }

    // CHECK CREDITS FROM DATABASE
    const userStore = getStore("users");
    const purchaseStore = getStore("purchases");
    
    const userData = await userStore.getJSON(userEmail);
    
    if (!userData || !userData.purchases || userData.purchases.length === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'No active subscription found. Please purchase credits first.',
          credits: 0
        })
      };
    }

    // Calculate available credits
    let totalCredits = 0;
    let creditsUsed = 0;
    
    for (const sessionId of userData.purchases) {
      const purchase = await purchaseStore.getJSON(sessionId);
      if (purchase) {
        totalCredits += purchase.aiCredits || 0;
        creditsUsed += purchase.creditsUsed || 0;
      }
    }
    
    const availableCredits = totalCredits - creditsUsed;
    
    if (availableCredits <= 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'No credits remaining. Please purchase additional responses.',
          credits: 0,
          purchaseUrl: '/pricing'
        })
      };
    }

    // Update rate limit
    userRateData.count++;
    rateLimitMap.set(userRateKey, userRateData);

    // System prompts for different languages
    const systemPrompts = {
      en: `You are an expert insurance claim assistant specializing in creating professional responses to insurance company correspondence. 
      
Your task is to analyze the insurer's letter and generate a comprehensive, professional response that:
1. Acknowledges receipt of their correspondence
2. Addresses each point raised systematically
3. Requests any missing information or documentation
4. Asserts the policyholder's rights appropriately
5. Maintains a professional but firm tone
6. Includes relevant policy provisions and regulations where applicable
7. Requests specific timelines for response
8. Documents everything for the claim record

Format the response as a formal business letter with proper date, addressing, and signature blocks.`,
      
      es: `Eres un asistente experto en reclamos de seguros especializado en crear respuestas profesionales a la correspondencia de las compañías de seguros.

Tu tarea es analizar la carta del asegurador y generar una respuesta integral y profesional que:
1. Confirme la recepción de su correspondencia
2. Aborde cada punto planteado sistemáticamente
3. Solicite cualquier información o documentación faltante
4. Afirme los derechos del asegurado apropiadamente
5. Mantenga un tono profesional pero firme
6. Incluya disposiciones de póliza y regulaciones relevantes cuando sea aplicable
7. Solicite plazos específicos para la respuesta
8. Documente todo para el registro del reclamo

Formatea la respuesta como una carta comercial formal con fecha, dirección y bloques de firma adecuados.`
    };

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompts[language] || systemPrompts.en
        },
        {
          role: "user",
          content: `Please analyze this insurance company letter and generate a professional response:\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `response_${userId}_${timestamp}`;

    // Initialize retry mechanism
    let pdfBuffer, docxBuffer;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Create PDF
        const pdfPath = `/tmp/${filename}.pdf`;
        await createPDF(responseText, pdfPath);
        
        // Create DOCX
        const docxPath = `/tmp/${filename}.docx`;
        await createDOCX(responseText, docxPath);

        // Read files into memory
        pdfBuffer = await fs.readFile(pdfPath);
        docxBuffer = await fs.readFile(docxPath);

        // Clean up temp files
        await fs.unlink(pdfPath).catch(() => {});
        await fs.unlink(docxPath).catch(() => {});
        
        break; // Success, exit retry loop
        
      } catch (fileError) {
        retryCount++;
        console.error(`File generation attempt ${retryCount} failed:`, fileError);
        
        if (retryCount >= maxRetries) {
          // Don't charge credit if file generation failed
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Failed to generate documents. Please try again. Your credits were not deducted.',
              credits: availableCredits,
              text: responseText // Still provide the text even if files failed
            })
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Store files in Netlify Blobs
    const store = getStore("documents");
    await store.set(`${filename}.pdf`, pdfBuffer);
    await store.set(`${filename}.docx`, docxBuffer);

    // DEDUCT CREDIT FROM DATABASE
    // Find the oldest purchase with available credits
    for (const sessionId of userData.purchases) {
      const purchase = await purchaseStore.getJSON(sessionId);
      if (purchase && (purchase.creditsUsed || 0) < (purchase.aiCredits || 0)) {
        purchase.creditsUsed = (purchase.creditsUsed || 0) + 1;
        purchase.lastUsed = new Date().toISOString();
        await purchaseStore.setJSON(sessionId, purchase);
        break;
      }
    }

    // Log usage for tracking
    console.log(`AI Response generated for user: ${userEmail}, credits remaining: ${availableCredits - 1}`);

    // Store generation record for recovery purposes
    const generationStore = getStore("generations");
    await generationStore.setJSON(`${userId}_${timestamp}`, {
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
      filename,
      language,
      inputLength: text.length,
      outputLength: responseText.length,
      creditsCharged: 1
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        text: responseText,
        pdf: `/.netlify/functions/download?file=${filename}.pdf`,
        docx: `/.netlify/functions/download?file=${filename}.docx`,
        creditsRemaining: availableCredits - 1,
        message: 'Response generated successfully',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Generation error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Service temporarily unavailable. Please try again later.',
          code: 'QUOTA_EXCEEDED'
        })
      };
    }
    
    if (error.code === 'invalid_api_key') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration error. Please contact support.',
          code: 'CONFIG_ERROR'
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate response. Please try again.',
        message: error.message,
        code: 'GENERATION_ERROR'
      })
    };
  }
};

// Helper function to create PDF
async function createPDF(text, filepath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      fs.writeFile(filepath, pdfBuffer)
        .then(resolve)
        .catch(reject);
    });
    
    // Add header
    doc.fontSize(12)
       .text(new Date().toLocaleDateString(), 50, 50)
       .moveDown();
    
    // Add content
    doc.fontSize(11)
       .text(text, {
         align: 'left',
         lineGap: 2
       });
    
    doc.end();
  });
}

// Helper function to create DOCX
async function createDOCX(text, filepath) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: new Date().toLocaleDateString(),
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '',
              break: 1
            })
          ]
        }),
        ...text.split('\n').map(line => 
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22
              })
            ]
          })
        )
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filepath, buffer);
}