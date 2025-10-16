const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers:{'Content-Type':'application/json'}});
const readBody = (req) => req.json().catch(()=> ({}));
const ensureKey = () => process.env.OPENAI_API_KEY;
const openaiChat = async (messages) => {
  const key=process.env.OPENAI_API_KEY;
  if(!key) return { demo:true, content:`(demo) ${messages[messages.length-1].content.slice(0,200)}` };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({ model:"gpt-4o-mini", messages, temperature:0.3 })
  });
  const data = await r.json().catch(()=> ({}));
  const content = data?.choices?.[0]?.message?.content || JSON.stringify(data).slice(0,500);
  return { demo:false, content };
};

module.exports = { json, readBody, ensureKey, openaiChat };
