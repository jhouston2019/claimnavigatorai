const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Detect invoice information from document text using OpenAI
 * @param {string} documentText - Text content of the document
 * @returns {Promise<object>} Extracted invoice information
 */
async function detectInvoice(documentText) {
  try {
    const prompt = `Analyze the following insurance claim document text and extract all invoice-related information.

Document text:
${documentText}

Extract and return:
1. Invoice numbers
2. Invoice dates
3. Line items and descriptions
4. Amounts (subtotal, tax, total)
5. Vendor or service provider information
6. Due dates
7. Payment terms

Return the information in a structured JSON format with:
- invoice_number: Invoice or reference number
- invoice_date: Date of invoice (ISO format)
- vendor_name: Name of vendor or service provider
- line_items: Array of items with description and amount
- subtotal: Subtotal amount
- tax: Tax amount
- total: Total amount
- currency: Currency code (e.g., USD)
- due_date: Payment due date (ISO format)
- payment_terms: Payment terms if mentioned`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting invoice and billing information from insurance claim documents. Return structured JSON data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const invoiceData = JSON.parse(responseText);

    return {
      invoices: Array.isArray(invoiceData.invoices) ? invoiceData.invoices : [invoiceData],
      detected_at: new Date().toISOString(),
      document_preview: documentText.substring(0, 200) + '...'
    };
  } catch (error) {
    console.error('Error detecting invoice:', error);
    throw new Error(`Failed to detect invoice: ${error.message}`);
  }
}

module.exports = {
  detectInvoice
};


