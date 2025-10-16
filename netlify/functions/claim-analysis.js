import { readBody, json, openaiChat } from './utils-helper.js';

export async function handler(event) {
  try {
    const body = await readBody(event);
    const { claimText } = body;

    if (!claimText) {
      return json({ error: 'Missing claimText' }, 400);
    }

    const messages = [
      { role: 'system', content: 'You are an expert insurance claim analyst providing clear, structured summaries and recommendations.' },
      { role: 'user', content: `Analyze the following insurance claim:\n${claimText}` },
    ];

    const response = await openaiChat(messages);
    return json({ analysis: response });
  } catch (err) {
    console.error('Claim analysis error:', err);
    return json({ error: err.message || 'Server error' }, 500);
  }
}