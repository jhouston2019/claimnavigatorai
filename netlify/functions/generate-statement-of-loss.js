const { createClient } = require('@supabase/supabase-js');
const { PDFDocument, rgb } = require('pdf-lib');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate Statement of Loss PDF from claim financials
 * @param {string} claimId - Claim ID
 * @returns {Promise<object>} PDF URL and status
 */
async function generateStatementOfLoss(claimId) {
  try {
    // Query claim financials from Supabase
    const { data: financials, error: financialsError } = await supabase
      .from('claim_financials')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (financialsError && financialsError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch financials: ${financialsError.message}`);
    }

    // If no financials exist, create a default structure
    const totals = financials || {
      property_damage: 0,
      contents_damage: 0,
      additional_living_expenses: 0,
      business_interruption: 0,
      other_expenses: 0,
      total_claim_amount: 0
    };

    // Calculate totals if not already calculated
    const totalClaimAmount = totals.total_claim_amount || (
      (parseFloat(totals.property_damage) || 0) +
      (parseFloat(totals.contents_damage) || 0) +
      (parseFloat(totals.additional_living_expenses) || 0) +
      (parseFloat(totals.business_interruption) || 0) +
      (parseFloat(totals.other_expenses) || 0)
    );

    // Get claim metadata
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError) {
      console.warn('Could not fetch claim metadata:', claimError.message);
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont('Helvetica');

    let yPosition = height - 50;

    // Title
    page.drawText('STATEMENT OF LOSS', {
      x: 50,
      y: yPosition,
      size: 20,
      font: font,
      color: rgb(0, 0, 0.5)
    });

    yPosition -= 40;

    // Claim Information
    if (claim) {
      page.drawText(`Claim Number: ${claim.id}`, { x: 50, y: yPosition, size: 12, font: font });
      yPosition -= 20;
      page.drawText(`Policy Number: ${claim.policy_number || 'N/A'}`, { x: 50, y: yPosition, size: 12, font: font });
      yPosition -= 20;
      page.drawText(`Date of Loss: ${claim.date_of_loss || 'N/A'}`, { x: 50, y: yPosition, size: 12, font: font });
      yPosition -= 20;
      page.drawText(`Insured: ${claim.insured_name || 'N/A'}`, { x: 50, y: yPosition, size: 12, font: font });
      yPosition -= 40;
    }

    // Financial Breakdown
    page.drawText('FINANCIAL BREAKDOWN', {
      x: 50,
      y: yPosition,
      size: 16,
      font: font,
      color: rgb(0, 0, 0.5)
    });
    yPosition -= 30;

    const lineItems = [
      { label: 'Property Damage', amount: totals.property_damage || 0 },
      { label: 'Contents Damage', amount: totals.contents_damage || 0 },
      { label: 'Additional Living Expenses', amount: totals.additional_living_expenses || 0 },
      { label: 'Business Interruption', amount: totals.business_interruption || 0 },
      { label: 'Other Expenses', amount: totals.other_expenses || 0 }
    ];

    lineItems.forEach(item => {
      if (item.amount > 0) {
        page.drawText(item.label, { x: 50, y: yPosition, size: 11, font: font });
        page.drawText(`$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
          x: width - 150,
          y: yPosition,
          size: 11,
          font: font
        });
        yPosition -= 20;
      }
    });

    yPosition -= 10;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;

    // Total
    page.drawText('TOTAL CLAIM AMOUNT', {
      x: 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0, 0, 0.5)
    });
    page.drawText(`$${totalClaimAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
      x: width - 150,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0, 0, 0.5)
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Upload to Supabase Storage
    const fileName = `statement-of-loss-${claimId}-${Date.now()}.pdf`;
    const filePath = `claim_docs/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('claim_docs')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('claim_docs')
      .getPublicUrl(filePath);

    return {
      status: 'success',
      pdf_url: urlData.publicUrl,
      file_path: filePath,
      total_claim_amount: totalClaimAmount,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating statement of loss:', error);
    throw new Error(`Failed to generate statement of loss: ${error.message}`);
  }
}

// Export the function for direct import
exports.generateStatementOfLoss = generateStatementOfLoss;

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestData = JSON.parse(event.body || '{}');
    const { claim_id } = requestData;

    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id is required' })
      };
    }

    const result = await generateStatementOfLoss(claim_id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};

