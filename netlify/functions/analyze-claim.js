import { json, readBody, openaiChat } from './_utils.js';
export default async (req)=>{
  const { analysisType='generic', text='' } = await readBody(req);
  const sys = "You are a claims analyst. Produce structured HTML sections.";
  const prompt = `AnalysisType: ${analysisType}\n\nInput:\n${text}`;
  const { content } = await openaiChat(sys, prompt);
  return json(200, { analysis: content, assessment: content, comparison: content, report: content });
}