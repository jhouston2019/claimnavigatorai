// Simple integration script for document-generator.html
// This can be included directly in the HTML file

// Enhanced form submission with automatic Supabase saving
async function handleGenerateAndSaveEnhanced({
  docType,
  lang,
  inputJson,
}) {
  try {
    // 1. Call your AI generator function/endpoint
    const aiRes = await fetch('/.netlify/functions/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, lang, inputJson }),
    });
    const { html } = await aiRes.json();
    if (!html) throw new Error('No AI output received');

    // 2. Convert HTML to PDF + DOCX
    const pdfBlob = await htmlToPdf(html);
    const docxBlob = await htmlToDocx(html);

    // 3. Save document in Supabase
    await saveGeneratedDocToSupabase({
      docType,
      lang,
      inputJson,
      htmlExcerpt: html.slice(0, 200), // first 200 chars
      pdfBlob,
      docxBlob,
    });

    return { ok: true };
  } catch (err) {
    console.error('Generation failed:', err);
    throw err;
  }
}

// --- Helper Converters ---
async function htmlToPdf(html) {
  // Lazy-load the library so it only runs in browser
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.html(html, { x: 10, y: 10 });
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

async function htmlToDocx(html) {
  // Simple HTML → DOCX converter using html-docx-js
  const { default: HTMLtoDOCX } = await import('html-docx-js/dist/html-docx');
  const buffer = HTMLtoDOCX(html);
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

// Save to Supabase (simplified version)
async function saveGeneratedDocToSupabase({
  docType,
  lang,
  inputJson,
  htmlExcerpt,
  pdfBlob,
  docxBlob,
}) {
  try {
    // Get current user
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

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

// Enhanced form submission method
async function handleFormSubmitEnhanced(data) {
  try {
    // Show loading
    const submitBtn = document.querySelector('.doc-gen-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      const spinner = submitBtn.querySelector('.btn-spinner');
      if (spinner) {
        spinner.style.display = 'inline-block';
      }
    }

    // Hide result panel
    const resultPanel = document.getElementById('resultPanel');
    if (resultPanel) {
      resultPanel.classList.remove('show');
    }

    // Get current document type and language
    const currentDocType = this.currentDocType || 'denial_letter';
    const currentLocale = this.currentLocale || 'en';

    // Use the new enhanced handler that automatically saves to Supabase
    await handleGenerateAndSaveEnhanced({
      docType: currentDocType,
      lang: currentLocale,
      inputJson: data
    });

    // Show success message and redirect to documents page
    alert('Document generated and saved! Check your Documents page.');
    window.location.href = '/my-documents.html';
    
  } catch (error) {
    console.error('Document generation error:', error);
    
    // Show error
    const resultPanel = document.getElementById('resultPanel');
    if (resultPanel) {
      resultPanel.innerHTML = `
        <div class="error-message">
          <strong>Error:</strong> ${error.message || 'An unexpected error occurred. Please try again.'}
        </div>
      `;
      resultPanel.classList.add('show');
    }
  } finally {
    // Hide loading
    const submitBtn = document.querySelector('.doc-gen-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      const spinner = submitBtn.querySelector('.btn-spinner');
      if (spinner) {
        spinner.style.display = 'none';
      }
    }
  }
}

// Make functions available globally
window.handleGenerateAndSaveEnhanced = handleGenerateAndSaveEnhanced;
window.handleFormSubmitEnhanced = handleFormSubmitEnhanced;
