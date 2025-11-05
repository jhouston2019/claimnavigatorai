const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Detect deadlines from document text using OpenAI
 * @param {string} documentText - Text content of the document
 * @returns {Promise<object>} Extracted deadline information
 */
async function detectDeadline(documentText) {
  try {
    const prompt = `Analyze the following insurance claim document text and extract all deadlines, due dates, and time-sensitive information.

Document text:
${documentText}

Extract and return:
1. All deadlines mentioned (dates, times, or relative dates like "within 30 days")
2. The context/purpose of each deadline
3. Any actions required before the deadline
4. Priority level (Critical, High, Medium, Low)

Return the information in a structured JSON format with:
- deadline_date: ISO date string if specific date found, null otherwise
- deadline_text: The exact text mentioning the deadline
- context: What the deadline is for
- action_required: What needs to be done
- priority: Critical, High, Medium, or Low
- days_until_deadline: Number of days if calculable, null otherwise`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting deadline and time-sensitive information from insurance claim documents. Return structured JSON data.'
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
    const deadlineData = JSON.parse(responseText);

    return {
      deadlines: Array.isArray(deadlineData.deadlines) ? deadlineData.deadlines : [deadlineData],
      detected_at: new Date().toISOString(),
      document_preview: documentText.substring(0, 200) + '...'
    };
  } catch (error) {
    console.error('Error detecting deadline:', error);
    throw new Error(`Failed to detect deadline: ${error.message}`);
  }
}

module.exports = {
  detectDeadline
};


