const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const PDFDocument = require("pdfkit");

// Initialize Supabase with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Supabase initialization error:", error.message);
}

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error("OpenAI initialization error:", error.message);
}

exports.handler = async (event) => {
  try {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database configuration error" })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OpenAI configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI service configuration error" })
      };
    }

    // Validate HTTP method
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request format" })
      };
    }

    const { userEmail, formData, language = 'en' } = requestData;

    // Validate required fields
    if (!userEmail || !formData) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "User email and form data are required" })
      };
    }

    console.log(`Generating appeal for user: ${userEmail}`);

    // Check if user has active appeal
    const { data: entitlement, error: entError } = await supabase
      .from("entitlements")
      .select("appeals")
      .eq("email", userEmail)
      .single();

    if (entError && entError.code !== "PGRST116") {
      console.error("Error fetching user appeals:", entError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Database error" })
      };
    }

    const appeals = entitlement?.appeals || [];
    const activeAppeal = appeals.find(appeal => appeal.status === 'active' && !appeal.used);

    if (!activeAppeal) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "No active appeal found. Please purchase an appeal first." })
      };
    }

    // Generate appeal letter using OpenAI
    const appealLetter = await generateAppealLetter(formData, language);

    // Create documents
    const { pdfBuffer, docxBuffer } = await createDocuments(appealLetter, formData);

    // Upload to Supabase storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pdfFileName = `appeal-${activeAppeal.appeal_id}-${timestamp}.pdf`;
    const docxFileName = `appeal-${activeAppeal.appeal_id}-${timestamp}.docx`;

    const { data: pdfData, error: pdfError } = await supabase.storage
      .from('appeal-documents')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    const { data: docxData, error: docxError } = await supabase.storage
      .from('appeal-documents')
      .upload(docxFileName, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false
      });

    if (pdfError || docxError) {
      console.error("Error uploading documents:", { pdfError, docxError });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Failed to save documents" })
      };
    }

    // Generate signed URLs for download
    const { data: pdfUrl } = supabase.storage
      .from('appeal-documents')
      .createSignedUrl(pdfFileName, 3600); // 1 hour expiry

    const { data: docxUrl } = supabase.storage
      .from('appeal-documents')
      .createSignedUrl(docxFileName, 3600); // 1 hour expiry

    // Mark appeal as used
    const updatedAppeals = appeals.map(appeal => 
      appeal.appeal_id === activeAppeal.appeal_id 
        ? { ...appeal, used: true, used_at: new Date().toISOString() }
        : appeal
    );

    const { error: updateError } = await supabase
      .from("entitlements")
      .update({ appeals: updatedAppeals })
      .eq("email", userEmail);

    if (updateError) {
      console.error("Error updating appeal status:", updateError);
    }

    console.log(`Appeal generated successfully for user: ${userEmail}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        appealId: activeAppeal.appeal_id,
        pdfUrl: pdfUrl?.signedUrl,
        docxUrl: docxUrl?.signedUrl,
        preview: appealLetter.substring(0, 500) + "..."
      })
    };

  } catch (err) {
    console.error("Generate appeal error:", {
      message: err.message,
      stack: err.stack
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { 
          details: err.message,
          stack: err.stack 
        })
      })
    };
  }
};

async function generateAppealLetter(formData, language) {
  const languagePrompts = {
    en: "Generate a professional appeal letter in English",
    es: "Generate a professional appeal letter in Spanish",
    fr: "Generate a professional appeal letter in French",
    pt: "Generate a professional appeal letter in Portuguese"
  };

  const toneInstructions = {
    cooperative: "Use a cooperative, professional tone that seeks resolution",
    firm: "Use a firm, assertive tone that demands fair treatment",
    legalistic: "Use a formal, legal tone with precise language and references"
  };

  const appealTypeInstructions = {
    internal: "This is for an internal review with the insurance company",
    external: "This is for an external review with a third-party organization",
    arbitration: "This is for arbitration proceedings",
    litigation: "This is for litigation preparation"
  };

  const prompt = `
${languagePrompts[language] || languagePrompts.en}

Policyholder: ${formData.policyholderName}
Policy Number: ${formData.policyNumber}
Insurer: ${formData.insurer}
Claim Number: ${formData.claimNumber}
Date of Loss: ${formData.dateOfLoss}
Date of Denial: ${formData.dateOfDenial}
Appeal Type: ${formData.appealType}
Denial Reason: ${formData.denialReason}
Additional Notes: ${formData.additionalNotes || 'None'}

Instructions:
- ${appealTypeInstructions[formData.appealType] || appealTypeInstructions.internal}
- ${toneInstructions[formData.tone] || toneInstructions.cooperative}
- Include specific references to policy terms and coverage
- Address the denial reason directly with counterarguments
- Include relevant legal precedents or regulations
- Maintain professional formatting
- Include a clear call to action
- Keep the letter concise but comprehensive

Generate a complete, professional appeal letter that addresses the denial and requests reconsideration.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional insurance appeal specialist. Generate high-quality, legally sound appeal letters that maximize the chances of claim approval."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate appeal letter");
  }
}

async function createDocuments(appealLetter, formData) {
  // Create DOCX document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "APPEAL LETTER",
              bold: true,
              size: 32
            })
          ],
          heading: HeadingLevel.TITLE
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Policyholder: ${formData.policyholderName}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Policy Number: ${formData.policyNumber}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Insurer: ${formData.insurer}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Claim Number: ${formData.claimNumber}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date of Loss: ${formData.dateOfLoss}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date of Denial: ${formData.dateOfDenial}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: appealLetter,
              size: 24
            })
          ]
        })
      ]
    }]
  });

  const docxBuffer = await Packer.toBuffer(doc);

  // Create PDF document
  const pdfDoc = new PDFDocument();
  const pdfChunks = [];
  
  pdfDoc.on('data', chunk => pdfChunks.push(chunk));
  
  const pdfPromise = new Promise((resolve) => {
    pdfDoc.on('end', () => resolve(Buffer.concat(pdfChunks)));
  });

  pdfDoc.fontSize(16).text('APPEAL LETTER', { align: 'center' });
  pdfDoc.moveDown();
  pdfDoc.fontSize(12).text(`Policyholder: ${formData.policyholderName}`);
  pdfDoc.text(`Policy Number: ${formData.policyNumber}`);
  pdfDoc.text(`Insurer: ${formData.insurer}`);
  pdfDoc.text(`Claim Number: ${formData.claimNumber}`);
  pdfDoc.text(`Date of Loss: ${formData.dateOfLoss}`);
  pdfDoc.text(`Date of Denial: ${formData.dateOfDenial}`);
  pdfDoc.moveDown();
  pdfDoc.text(appealLetter);
  
  pdfDoc.end();

  const pdfBuffer = await pdfPromise;

  return { pdfBuffer, docxBuffer };
}
