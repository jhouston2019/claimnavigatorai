import { supabase } from './supabase'

const BUCKET_NAME = 'claim-documents'

export async function uploadFile(
  file: File,
  userId: string,
  folder: string = 'documents'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data.path
}

export async function getFileUrl(path: string): Promise<string> {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export async function downloadFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(path)

  if (error) {
    throw new Error(`Download failed: ${error.message}`)
  }

  return data
}
