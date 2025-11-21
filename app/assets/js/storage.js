/**
 * Storage Engine
 * Handles file uploads to Supabase Storage
 */

import { getSupabaseClient, getAuthToken, getCurrentUser } from './auth.js';

/**
 * Upload file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} bucket - Storage bucket name (e.g., 'evidence', 'documents', 'policies')
 * @param {string} path - Path within bucket (e.g., 'user-id/filename.pdf')
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadToStorage(file, bucket, path = null) {
  try {
    const client = await getSupabaseClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User must be authenticated to upload files');
    }

    // Generate path if not provided
    if (!path) {
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      path = `${user.id}/${timestamp}-${sanitizedFilename}`;
    }

    // Upload file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files
 * @param {File[]} files - Array of files
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Array<{url: string, path: string, filename: string}>>}
 */
export async function uploadMultipleFiles(files, bucket) {
  const uploads = Array.from(files).map(async (file) => {
    const result = await uploadToStorage(file, bucket);
    return {
      ...result,
      filename: file.name,
      size: file.size,
      type: file.type
    };
  });

  return Promise.all(uploads);
}

/**
 * Delete file from storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 */
export async function deleteFromStorage(bucket, path) {
  try {
    const client = await getSupabaseClient();
    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Storage delete error:', error);
    throw error;
  }
}

/**
 * Get public URL for a file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 * @returns {string} Public URL
 */
export function getPublicUrl(bucket, path) {
  // This will be set by Supabase client
  // For now, return a placeholder that will be replaced
  return `/${bucket}/${path}`;
}

/**
 * Extract text from PDF/DOCX via Netlify function
 * @param {File} file - PDF or DOCX file
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromFile(file) {
  try {
    const token = await getAuthToken();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Call text extraction function
    const response = await fetch('/.netlify/functions/text-extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Text extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
}


