// /lib/documents.js
// Client-side Supabase integration for document management

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || window.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY
);

/**
 * Save generated document to Supabase
 */
export async function saveGeneratedDoc({
  docType,
  lang,
  inputJson,
  htmlExcerpt,
  pdfBlob,
  docxBlob,
}) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Upload files to Supabase Storage
    const timestamp = Date.now();
    const pdfFileName = `generated-docs/${user.id}/${docType}_${timestamp}.pdf`;
    const docxFileName = `generated-docs/${user.id}/${docType}_${timestamp}.docx`;

    // Upload PDF
    const { error: pdfError } = await supabase.storage
      .from('generated-docs')
      .upload(pdfFileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (pdfError) {
      throw new Error(`Failed to upload PDF: ${pdfError.message}`);
    }

    // Upload DOCX
    const { error: docxError } = await supabase.storage
      .from('generated-docs')
      .upload(docxFileName, docxBlob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false
      });

    if (docxError) {
      throw new Error(`Failed to upload DOCX: ${docxError.message}`);
    }

    // Insert document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        doc_type: docType,
        lang: lang,
        input_json: inputJson,
        html_excerpt: htmlExcerpt,
        pdf_path: pdfFileName,
        docx_path: docxFileName
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save document record: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Save generated document error:', error);
    throw error;
  }
}

/**
 * Get user documents
 */
export async function getUserDocuments(limit = 50, offset = 0) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
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
 */
export async function getDocumentById(documentId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Document not found
      }
      throw new Error(`Failed to get document: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get document by ID error:', error);
    throw error;
  }
}

/**
 * Delete document
 */
export async function deleteDocument(documentId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
}
