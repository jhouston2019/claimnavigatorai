/**
 * Lightweight Supabase storage reader.
 * Expects the site to define:
 *   window.__SUPABASE_URL
 *   window.__SUPABASE_ANON_KEY
 * Public READ ONLY usage is fine for listing & downloading public files.
 */
export function hasSupabase(){
  return Boolean(window.__SUPABASE_URL && window.__SUPABASE_ANON_KEY);
}
export async function listFiles({bucket, prefix="", limit=1000}){
  if(!hasSupabase()) throw new Error("Supabase not configured");
  const url = `${window.__SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(bucket)}?prefix=${encodeURIComponent(prefix)}&limit=${limit}`;
  const r = await fetch(url, { headers: { apikey: window.__SUPABASE_ANON_KEY, Authorization: `Bearer ${window.__SUPABASE_ANON_KEY}` } });
  if(!r.ok) throw new Error(`List failed: ${r.status}`);
  return r.json();
}
export function filePublicUrl({bucket, path}){
  if(!hasSupabase()) return "#";
  // Public URL format for storage
  return `${window.__SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;
}
