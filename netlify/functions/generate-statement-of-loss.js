const { createClient } = require('@supabase/supabase-js');
const { PDFDocument, rgb } = require('pdf-lib');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate Statement of Loss PDF from claim financials ledger
 * @param {string} claimId - Claim ID
 * @param {string} toEmail - Optional email to send PDF to
 * @returns {Promise<object>} PDF URL and status
 */
async function generateStatementOfLoss(claimId, toEmail = null) {
  try {
    // Calculate totals from transactions
    const totalsData = {
      total_payments: 0,
      total_invoices: 0,
      total_expenses: 0,
      total_supplements: 0,
      total_depreciation: 0,
      total_all: 0,
      total_entries: 0
    };

    // Get all transactions for detailed ledger
    const { data: transactions, error: transactionsError } = await supabase
      .from('claim_financials')
      .select('*')
      .eq('claim_id', claimId)
      .order('date', { ascending: true });

    if (transactionsError) {
      console.warn('Could not fetch transactions:', transactionsError.message);
    }

    // Calculate totals from transactions
    if (transactions && transactions.length > 0) {
      transactions.forEach(txn => {
        const amount = parseFloat(txn.amount) || 0;
        totalsData.total_all += amount;
        totalsData.total_entries++;

        switch (txn.entry_type) {
          case 'payment':
            totalsData.total_payments += amount;
            break;
          case 'invoice':
            totalsData.total_invoices += amount;
            break;
          case 'expense':
            totalsData.total_expenses += amount;
            break;
          case 'supplement':
            totalsData.total_supplements += amount;
            break;
          case 'depreciation':
            totalsData.total_depreciation += amount;
            break;
        }
      });
    }

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

    // Financial Summary
    page.drawText('FINANCIAL SUMMARY', {
      x: 50,
      y: yPosition,
      size: 16,
      font: font,
      color: rgb(0, 0, 0.5)
    });
    yPosition -= 30;

    const summaryItems = [
      { label: 'Total Payments', amount: totalsData.total_payments || 0 },
      { label: 'Total Invoices', amount: totalsData.total_invoices || 0 },
      { label: 'Total Expenses', amount: totalsData.total_expenses || 0 },
      { label: 'Total Supplements', amount: totalsData.total_supplements || 0 },
      { label: 'Total Depreciation', amount: totalsData.total_depreciation || 0 }
    ];

    summaryItems.forEach(item => {
      const amount = parseFloat(item.amount) || 0;
      if (amount > 0) {
        page.drawText(item.label, { x: 50, y: yPosition, size: 11, font: font });
        page.drawText(`$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
          x: width - 150,
          y: yPosition,
          size: 11,
          font: font
        });
        yPosition -= 20;
      }
    });

    // Transaction Ledger (if space allows)
    if (transactions && transactions.length > 0 && yPosition > 100) {
      yPosition -= 20;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5)
      });
      yPosition -= 20;

      page.drawText('TRANSACTION LEDGER', {
        x: 50,
        y: yPosition,
        size: 14,
        font: font,
        color: rgb(0, 0, 0.5)
      });
      yPosition -= 25;

      // Show recent transactions (last 10 that fit)
      const recentTransactions = transactions.slice(-10).reverse();
      for (const txn of recentTransactions) {
        if (yPosition < 50) break; // Stop if too close to bottom

        const dateStr = new Date(txn.date).toLocaleDateString();
        const desc = txn.description.substring(0, 30);
        const amount = parseFloat(txn.amount) || 0;

        page.drawText(`${dateStr} - ${txn.entry_type}`, { x: 50, y: yPosition, size: 9, font: font });
        page.drawText(desc, { x: 150, y: yPosition, size: 9, font: font });
        page.drawText(`$${amount.toFixed(2)}`, {
          x: width - 100,
          y: yPosition,
          size: 9,
          font: font
        });
        yPosition -= 15;
      }
    }

    yPosition -= 10;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;

    // Total
    yPosition -= 10;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 2,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;

    page.drawText('TOTAL CLAIM AMOUNT', {
      x: 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0, 0, 0.5)
    });
    const totalAmount = parseFloat(totalsData.total_all) || 0;
    page.drawText(`$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
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

    // Send email if requested
    if (toEmail) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const { data: downloadData } = await supabase.storage
          .from('claim_docs')
          .download(filePath);

        const pdfBase64 = Buffer.from(await downloadData.arrayBuffer()).toString('base64');

        await sgMail.send({
          to: toEmail,
          from: process.env.FROM_EMAIL || 'no-reply@claimnavigator.ai',
          subject: 'Statement of Loss',
          html: '<p>Attached is your Statement of Loss.</p>',
          attachments: [
            {
              content: pdfBase64,
              filename: 'StatementOfLoss.pdf',
              type: 'application/pdf',
              disposition: 'attachment'
            }
          ]
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail the whole operation if email fails
      }
    }

    return {
      status: 'success',
      pdf_url: urlData.publicUrl,
      file_path: filePath,
      total_claim_amount: totalAmount,
      totals: totalsData,
      generated_at: new Date().toISOString(),
      email_sent: !!toEmail
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
    const { claim_id, to_email } = requestData;

    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id is required' })
      };
    }

    const result = await generateStatementOfLoss(claim_id, to_email);

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

