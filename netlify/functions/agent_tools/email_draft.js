const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an email draft using OpenAI
 * @param {string} subject - Email subject line
 * @param {string} context - Context about what the email should cover
 * @returns {Promise<string>} Generated email draft
 */
async function generateEmailDraft(subject, context) {
  try {
    const prompt = `You are a professional insurance claim specialist. Draft a professional, clear, and effective email about: ${context}

${subject ? `Subject: ${subject}` : ''}

Requirements:
- Professional and courteous tone
- Clear and concise language
- Include all relevant details
- Professional closing
- Format as a complete email body

Generate the email draft:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance claim communication specialist. Generate professional, clear, and effective email drafts for insurance claims.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const draft = completion.choices[0]?.message?.content || 'Unable to generate email draft.';
    
    return {
      draft: draft,
      subject: subject || 'Insurance Claim Communication',
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating email draft:', error);
    throw new Error(`Failed to generate email draft: ${error.message}`);
  }
}

module.exports = {
  generateEmailDraft
};


