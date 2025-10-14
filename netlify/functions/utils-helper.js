export const json = (status, data) => new Response(JSON.stringify(data), { status, headers:{'Content-Type':'application/json'}});
export function readBody(req){return req.json().catch(()=> ({}));}
export function ensureKey() { return process.env.OPENAI_API_KEY; }
export async function openaiChat(system, user){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return { demo:true, content:`(demo) ${user.slice(0,200)}` };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({ model:"gpt-4o-mini", messages:[{role:'system',content:system},{role:'user',content:user}], temperature:0.3 })
  });
  const data = await r.json().catch(()=> ({}));
  const content = data?.choices?.[0]?.message?.content || JSON.stringify(data).slice(0,500);
  return { demo:false, content };
}
