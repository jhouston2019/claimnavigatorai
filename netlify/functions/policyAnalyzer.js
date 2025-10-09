import { json, readBody, openaiChat } from './_utils.js';
export default async (req)=>{
  const { policyText='', analysisType='coverage_review' } = await readBody(req);
  const sys = "You examine policy language and highlight coverage, exclusions, limits, and applicable statutes.";
  const { content } = await openaiChat(sys, `Type:${analysisType}\n\nPolicy/Text:\n${policyText}`);
  return json(200, { analysis: content });
}