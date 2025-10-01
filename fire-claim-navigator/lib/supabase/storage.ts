import { supabaseAdmin } from './server';

export async function uploadAndSign(
  bucket: string, 
  path: string, 
  contentType: string, 
  data: ArrayBuffer | Buffer
) {
  const { error: upErr } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, data, { contentType, upsert: false });
    
  if (upErr) throw upErr;
  
  const { data: signed } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24); // 24h
  
  return { path, signedUrl: signed?.signedUrl! };
}

export async function createSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
    
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path]);
    
  if (error) throw error;
  return true;
}

export async function listFiles(bucket: string, folder?: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(folder);
    
  if (error) throw error;
  return data;
}
