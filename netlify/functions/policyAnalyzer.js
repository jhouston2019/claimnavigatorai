const { json, readBody, openaiChat } = require('./utils-helper.js');

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { policyText='', analysisType='coverage_review' } = body;
  const sys = "You examine policy language and highlight coverage, exclusions, limits, and applicable statutes.";
  const { content } = await openaiChat([{role:'system',content:sys},{role:'user',content:`Type:${analysisType}\n\nPolicy/Text:\n${policyText}`}]);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true, data: { analysis: content }, error: null })
  };
};