const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Detect payment information from document text using OpenAI
 * @param {string} documentText - Text content of the document
 * @returns {Promise<object>} Extracted payment information
 */
async function detectPayment(documentText) {
  try {
    const prompt = `Analyze the following insurance claim document text and extract all payment-related information.

Document text:
${documentText}

Extract and return:
1. Payment amounts mentioned
2. Payment dates or due dates
3. Payment methods or references
4. Payment status (pending, received, due, etc.)
5. Payment type (settlement, reimbursement, advance, etc.)
6. Account numbers or payment references

Return the information in a structured JSON format with:
- amount: Payment amount (number)
- currency: Currency code (e.g., USD)
- payment_date: Date payment was made or is due (ISO format)
- status: Payment status
- payment_type: Type of payment
- reference_number: Any payment reference or check number
- description: Description of the payment`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting payment and financial information from insurance claim documents. Return structured JSON data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const paymentData = JSON.parse(responseText);

    return {
      payments: Array.isArray(paymentData.payments) ? paymentData.payments : [paymentData],
      detected_at: new Date().toISOString(),
      document_preview: documentText.substring(0, 200) + '...'
    };
  } catch (error) {
    console.error('Error detecting payment:', error);
    throw new Error(`Failed to detect payment: ${error.message}`);
  }
}

module.exports = {
  detectPayment
};


