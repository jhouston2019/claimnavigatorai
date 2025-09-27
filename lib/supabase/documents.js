const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Insert document record
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.docType - Document type
 * @param {string} params.lang - Language
 * @param {Object} params.inputJson - Input data
 * @param {string} params.htmlExcerpt - HTML content excerpt
 * @param {string} params.pdfPath - PDF file path
 * @param {string} params.docxPath - DOCX file path
 * @returns {Promise<Object>} Inserted document
 */
async function insertDocument({ userId, docType, lang, inputJson, htmlExcerpt, pdfPath, docxPath }) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        doc_type: docType,
        lang: lang,
        input_json: inputJson,
        html_excerpt: htmlExcerpt,
        pdf_path: pdfPath,
        docx_path: docxPath
      })
      .select()
      .single();

    if (error) {
      console.error('Insert document error:', error);
      throw new Error(`Failed to insert document: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Insert document error:', error);
    throw error;
  }
}

/**
 * Get user documents
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {number} params.limit - Limit results
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Array>} Documents list
 */
async function getUserDocuments({ userId, limit = 50, offset = 0 }) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get user documents error:', error);
      throw new Error(`Failed to get user documents: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get user documents error:', error);
    throw error;
  }
}

/**
 * Get document by ID
 * @param {Object} params - Parameters
 * @param {string} params.documentId - Document ID
 * @param {string} params.userId - User ID (for security)
 * @returns {Promise<Object|null>} Document or null
 */
async function getDocumentById({ documentId, userId }) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Document not found
      }
      console.error('Get document by ID error:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get document by ID error:', error);
    throw error;
  }
}

/**
 * Count user documents for current month
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {Date} params.monthStart - Month start date
 * @returns {Promise<number>} Document count
 */
async function countUserDocumentsThisMonth({ userId, monthStart }) {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());

    if (error) {
      console.error('Count documents error:', error);
      throw new Error(`Failed to count documents: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    console.error('Count documents error:', error);
    throw error;
  }
}

/**
 * Delete document
 * @param {Object} params - Parameters
 * @param {string} params.documentId - Document ID
 * @param {string} params.userId - User ID (for security)
 * @returns {Promise<boolean>} Success status
 */
async function deleteDocument({ documentId, userId }) {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete document error:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
}

/**
 * Get document statistics
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @returns {Promise<Object>} Statistics
 */
async function getDocumentStats({ userId }) {
  try {
    // Get total documents
    const { count: totalCount, error: totalError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) {
      console.error('Get total count error:', totalError);
      throw new Error(`Failed to get total count: ${totalError.message}`);
    }

    // Get documents by type
    const { data: typeData, error: typeError } = await supabase
      .from('documents')
      .select('doc_type')
      .eq('user_id', userId);

    if (typeError) {
      console.error('Get type data error:', typeError);
      throw new Error(`Failed to get type data: ${typeError.message}`);
    }

    // Count by type
    const typeCounts = {};
    typeData.forEach(doc => {
      typeCounts[doc.doc_type] = (typeCounts[doc.doc_type] || 0) + 1;
    });

    // Get this month's count
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await countUserDocumentsThisMonth({ userId, monthStart });

    return {
      total: totalCount || 0,
      thisMonth: thisMonthCount,
      byType: typeCounts
    };
  } catch (error) {
    console.error('Get document stats error:', error);
    throw error;
  }
}

module.exports = {
  insertDocument,
  getUserDocuments,
  getDocumentById,
  countUserDocumentsThisMonth,
  deleteDocument,
  getDocumentStats
};
