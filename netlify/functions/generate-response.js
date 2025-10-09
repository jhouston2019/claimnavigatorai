import { json, readBody, openaiChat } from './_utils.js';
export default async (req)=> {
  const body = await readBody(req);
  const text = body.inputText || '';
  const lang = body.language || 'en';
  const sys = "You are ClaimNavigatorAI. Draft clear, assertive claim communications. Keep output HTML-ready.";
  const { content } = await openaiChat(sys, `Language: ${lang}\n\nTask:\n${text}`);
  return json(200, { response: content });
}