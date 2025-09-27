const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Upload file to Supabase storage
 * @param {Object} params - Parameters
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.path - Storage path
 * @param {string} params.contentType - MIME type
 * @param {string} params.bucket - Storage bucket name
 * @returns {Promise<{path: string, publicUrl: string}>}
 */
async function uploadFile({ buffer, path, contentType, bucket = 'generated-docs' }) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL (will be null for private files)
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Generate signed URL for private file access
 * @param {Object} params - Parameters
 * @param {string} params.path - File path
 * @param {number} params.expiresIn - Expiration time in seconds (default: 24 hours)
 * @param {string} params.bucket - Storage bucket name
 * @returns {Promise<string>} Signed URL
 */
async function getSignedUrl({ path, expiresIn = 86400, bucket = 'generated-docs' }) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL generation error:', error);
    throw error;
  }
}

/**
 * Delete file from storage
 * @param {Object} params - Parameters
 * @param {string} params.path - File path
 * @param {string} params.bucket - Storage bucket name
 * @returns {Promise<boolean>} Success status
 */
async function deleteFile({ path, bucket = 'generated-docs' }) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete file error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

/**
 * List files in a folder
 * @param {Object} params - Parameters
 * @param {string} params.folder - Folder path
 * @param {string} params.bucket - Storage bucket name
 * @returns {Promise<Array>} File list
 */
async function listFiles({ folder, bucket = 'generated-docs' }) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    if (error) {
      console.error('List files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('List files error:', error);
    throw error;
  }
}

/**
 * Get file info
 * @param {Object} params - Parameters
 * @param {string} params.path - File path
 * @param {string} params.bucket - Storage bucket name
 * @returns {Promise<Object>} File info
 */
async function getFileInfo({ path, bucket = 'generated-docs' }) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      });

    if (error) {
      console.error('Get file info error:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Get file info error:', error);
    throw error;
  }
}

module.exports = {
  uploadFile,
  getSignedUrl,
  deleteFile,
  listFiles,
  getFileInfo
};
