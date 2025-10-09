import { json, readBody } from './_utils.js';
export default async (req)=>{
  const { content='<h1>Document</h1>', format='pdf', filename='document' } = await readBody(req);
  // demo: return data URL so downloads work without external deps
  const data = 'data:text/html;charset=utf-8,'+encodeURIComponent(content);
  return json(200, { url:data, downloadUrl:data, filename:`${filename}.${format}` });
}
