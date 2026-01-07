/**
 * FNOL Submit Function
 * Generates FNOL PDF, sends emails, and integrates with compliance systems
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Send email using SendGrid or similar service
 */
async function sendFnolEmail(to, cc, bcc, subject, body, pdfBuffer, pdfFilename) {
  // Check for SendGrid API key
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: to,
        cc: cc,
        bcc: bcc,
        from: process.env.FNOL_EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@Claim Navigator.com',
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        attachments: pdfBuffer ? [{
          content: pdfBuffer.toString('base64'),
          filename: pdfFilename,
          type: 'application/pdf',
          disposition: 'attachment'
        }] : []
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('SendGrid email error:', error);
      throw error;
    }
  }

  // Fallback: Log email (for development)
  console.log('Email would be sent:', { to, subject, hasAttachment: !!pdfBuffer });
  return { success: true, note: 'Email service not configured, logged only' };
}

/**
 * Generate FNOL PDF
 */
async function generateFNOLPDF(fnolPayload) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = 750;
  const margin = 50;
  const lineHeight = 16;
  const sectionSpacing = 20;

  // Title
  page.drawText('FIRST NOTICE OF LOSS (FNOL)', {
    x: margin,
    y: yPosition,
    size: 20,
    font: titleFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= 30;

  // Date
  const submissionDate = new Date(fnolPayload.timestamps.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  page.drawText(`Submitted: ${submissionDate}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });
  yPosition -= sectionSpacing * 2;

  // Section 1: Policyholder Information
  page.drawText('POLICYHOLDER INFORMATION', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= lineHeight * 1.5;

  const policyholder = fnolPayload.policyholder;
  page.drawText(`Name: ${policyholder.name}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Email: ${policyholder.email}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Phone: ${policyholder.phone}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Address: ${policyholder.address}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= sectionSpacing;

  // Section 2: Policy Information
  if (yPosition < 100) {
    const newPage = pdfDoc.addPage([612, 792]);
    yPosition = 750;
  }

  page.drawText('POLICY INFORMATION', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= lineHeight * 1.5;

  const policy = fnolPayload.policy;
  page.drawText(`Policy Number: ${policy.policyNumber}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Insurance Carrier: ${policy.carrier}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= sectionSpacing;

  // Section 3: Property & Loss Information
  if (yPosition < 100) {
    const newPage = pdfDoc.addPage([612, 792]);
    yPosition = 750;
  }

  page.drawText('PROPERTY & LOSS INFORMATION', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= lineHeight * 1.5;

  const property = fnolPayload.property;
  const loss = fnolPayload.loss;
  page.drawText(`Property Address: ${property.address}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Type of Loss: ${loss.type}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Date of Loss: ${loss.date}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Time of Loss: ${loss.time}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Emergency Work Performed: ${loss.emergencyWork ? 'Yes' : 'No'}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  if (loss.emergencyNotes) {
    const notesLines = wrapText(loss.emergencyNotes, 500, font, 12);
    notesLines.forEach(line => {
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }
      page.drawText(`Emergency Work Details: ${line}`, { x: margin, y: yPosition, size: 12, font: font });
      yPosition -= lineHeight;
    });
  }
  yPosition -= sectionSpacing;

  // Section 4: Damage & Impact Details
  if (yPosition < 100) {
    const newPage = pdfDoc.addPage([612, 792]);
    yPosition = 750;
  }

  page.drawText('DAMAGE & IMPACT DETAILS', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= lineHeight * 1.5;

  const damage = fnolPayload.damage;
  const impact = fnolPayload.impact;
  page.drawText(`Estimated Severity: ${damage.severity}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Areas Affected: ${damage.areasAffected.join(', ') || 'None specified'}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Property Habitable: ${impact.habitable ? 'Yes' : 'No'}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Injuries: ${impact.injuries ? 'Yes' : 'No'}`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight * 1.5;

  // Description (may be long)
  const descLines = wrapText(damage.description, 500, font, 12);
  page.drawText('Description of Damage:', { x: margin, y: yPosition, size: 12, font: boldFont });
  yPosition -= lineHeight;
  descLines.forEach(line => {
    if (yPosition < 100) {
      const newPage = pdfDoc.addPage([612, 792]);
      yPosition = 750;
    }
    page.drawText(line, { x: margin, y: yPosition, size: 12, font: font });
    yPosition -= lineHeight;
  });
  yPosition -= sectionSpacing;

  // Section 5: Evidence Summary
  if (yPosition < 100) {
    const newPage = pdfDoc.addPage([612, 792]);
    yPosition = 750;
  }

  page.drawText('EVIDENCE SUMMARY', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= lineHeight * 1.5;

  const evidenceFiles = fnolPayload.evidenceFiles || {};
  page.drawText(`Photos: ${evidenceFiles.photos?.length || 0} file(s)`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Reports: ${evidenceFiles.reports?.length || 0} file(s)`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= lineHeight;
  page.drawText(`Estimates: ${evidenceFiles.estimates?.length || 0} file(s)`, { x: margin, y: yPosition, size: 12, font: font });
  yPosition -= sectionSpacing;

  // Footer
  const footerY = 50;
  page.drawText('Generated by Claim Navigator', {
    x: margin,
    y: footerY,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Wrap text to fit width
 */
function wrapText(text, maxWidth, font, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Get carrier email from insurer directory
 */
async function getCarrierEmail(carrierName) {
  try {
    // Try to load from insurers.json (would need to be accessible)
    // For now, return null and let the function handle it
    return null;
  } catch (error) {
    console.warn('Could not load carrier email:', error);
    return null;
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get user ID
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    const supabase = getSupabaseClient();
    
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch (err) {
        console.warn('Auth check failed:', err.message);
      }
    }

    // Parse request body
    const fnolPayload = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!fnolPayload.policyholder?.name || !fnolPayload.policyholder?.email || !fnolPayload.policy?.carrier) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate FNOL ID
    const fnolId = `FNOL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Generate PDF
    const pdfBuffer = await generateFNOLPDF(fnolPayload);
    const pdfFilename = `FNOL-${fnolPayload.policy.policyNumber}-${fnolId}.pdf`;

    // Save PDF to Supabase Storage
    let pdfUrl = null;
    if (supabase && userId) {
      try {
        const storagePath = `${userId}/fnol/${fnolId}/${pdfFilename}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('generated-docs')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('generated-docs')
            .getPublicUrl(storagePath);
          pdfUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.warn('Failed to save PDF to storage:', error);
      }
    }

    // Send emails
    const policyholderEmail = fnolPayload.policyholder.email;
    const carrierEmail = await getCarrierEmail(fnolPayload.policy.carrier);
    
    const emailSubject = `First Notice of Loss - Policy ${fnolPayload.policy.policyNumber} - ${fnolPayload.loss.type}`;
    const emailBody = `
First Notice of Loss Submission

Policy Number: ${fnolPayload.policy.policyNumber}
Carrier: ${fnolPayload.policy.carrier}
Loss Type: ${fnolPayload.loss.type}
Date of Loss: ${fnolPayload.loss.date}
Time of Loss: ${fnolPayload.loss.time}

Policyholder: ${fnolPayload.policyholder.name}
Email: ${fnolPayload.policyholder.email}
Phone: ${fnolPayload.policyholder.phone}

Property Address: ${fnolPayload.property.address}

Description: ${fnolPayload.damage.description}

Severity: ${fnolPayload.damage.severity}
Areas Affected: ${fnolPayload.damage.areasAffected.join(', ') || 'None specified'}

This FNOL has been generated and submitted via Claim Navigator.
Please see the attached PDF for complete details.

FNOL ID: ${fnolId}
    `.trim();

    let emailSent = false;
    let emailError = null;

    try {
      // Send to policyholder (user copy)
      await sendFnolEmail(
        policyholderEmail,
        null,
        process.env.FNOL_EMAIL_BCC ? [process.env.FNOL_EMAIL_BCC] : null,
        emailSubject,
        emailBody,
        pdfBuffer,
        pdfFilename
      );

      // Send to carrier (if email available)
      if (carrierEmail) {
        await sendFnolEmail(
          carrierEmail,
          null,
          null,
          emailSubject,
          emailBody,
          pdfBuffer,
          pdfFilename
        );
      }

      emailSent = true;
    } catch (error) {
      console.error('Email send error:', error);
      emailError = error.message;
      // Continue even if email fails
    }

    // Integrate with Compliance Engine
    let complianceSummary = null;
    let alertsGenerated = 0;

    try {
      // Call Compliance Engine analyze
      const complianceResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/compliance-engine/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || ''
        },
        body: JSON.stringify({
          state: fnolPayload.state || '',
          carrier: fnolPayload.policy.carrier,
          claimType: fnolPayload.loss.type,
          claimReference: fnolId,
          timelineSummaryText: `FNOL submitted on ${fnolPayload.loss.date} for ${fnolPayload.loss.type} loss.`,
          events: [{
            name: 'FNOL Submitted',
            date: fnolPayload.loss.date,
            description: `First Notice of Loss submitted to ${fnolPayload.policy.carrier}`
          }],
          includeBadFaith: true,
          includeDeadlines: true,
          includeDocsCheck: true,
          generateEscalationRecommendations: true
        })
      });

      if (complianceResponse.ok) {
        complianceSummary = await complianceResponse.json();
      }
    } catch (error) {
      console.warn('Compliance Engine integration failed:', error);
    }

    try {
      // Call generate-alerts
      const alertsResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/compliance-engine/generate-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || ''
        },
        body: JSON.stringify({
          claimId: fnolId,
          state: fnolPayload.state || '',
          carrier: fnolPayload.policy.carrier,
          claimType: fnolPayload.loss.type,
          timelineEvents: [{
            name: 'FNOL Submitted',
            date: fnolPayload.loss.date,
            description: `First Notice of Loss submitted`
          }],
          evidenceData: Object.values(fnolPayload.evidenceFiles || {}).flat(),
          communicationsLog: []
        })
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        alertsGenerated = alertsData.alerts?.length || 0;
      }
    } catch (error) {
      console.warn('Alert generation failed:', error);
    }

    // Store FNOL record in database (if table exists)
    if (supabase && userId) {
      try {
        await supabase.from('fnol_submissions').insert({
          user_id: userId,
          fnol_id: fnolId,
          policy_number: fnolPayload.policy.policyNumber,
          carrier: fnolPayload.policy.carrier,
          loss_type: fnolPayload.loss.type,
          loss_date: fnolPayload.loss.date,
          pdf_url: pdfUrl,
          email_sent: emailSent,
          email_error: emailError,
          fnol_data: fnolPayload,
          created_at: fnolPayload.timestamps.createdAt
        }).catch(() => {
          // Table might not exist, that's okay
          console.warn('FNOL submissions table not found, skipping database storage');
        });
      } catch (error) {
        console.warn('Failed to store FNOL in database:', error);
      }
    }

    // Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fnolId: fnolId,
        pdfUrl: pdfUrl,
        pdfFilename: pdfFilename,
        emailSent: emailSent,
        emailError: emailError,
        complianceSummary: complianceSummary,
        alertsGenerated: alertsGenerated
      })
    };

  } catch (error) {
    console.error('FNOL submission error:', error);
    
    // SB-5: Log submission failure to timeline
    try {
      const body = JSON.parse(event.body);
      const claimId = body.claimId;
      
      if (claimId && user?.id) {
        await supabase
          .from('claim_timeline')
          .insert({
            user_id: user.id,
            claim_id: claimId,
            event_type: 'submission_failed',
            event_date: new Date().toISOString().split('T')[0],
            source: 'system',
            title: 'FNOL Submission Failed',
            description: `Backend submission failed: ${error.message}`,
            metadata: {
              actor: 'system',
              failure_reason: error.message,
              delivery_method: body.submissionMethod || 'portal',
              target: body.policy?.carrier || 'unknown'
            }
          });
      }
    } catch (timelineError) {
      console.warn('Failed to log submission failure:', timelineError);
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to submit FNOL',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};


