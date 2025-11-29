const { json, readBody, openaiChat } = require('./utils-helper.js');

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { analysisType='generic', text='' } = body;
  const sys = "You are a claims analyst. Produce structured HTML sections.";
  const prompt = `AnalysisType: ${analysisType}\n\nInput:\n${text}`;
  const { content } = await openaiChat([{role:'system',content:sys},{role:'user',content:prompt}]);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true, data: { analysis: content, assessment: content, comparison: content, report: content }, error: null })
  };
};