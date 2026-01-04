/**
 * Document Generator Controller
 * Activates the Document Generator tool
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { autofillForm, getIntakeData } from '../autofill.js';
import { saveAndReturn, getToolParams, getReportName } from '../tool-output-bridge.js';

// Initialize controller
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require authentication
    await requireAuth();
    
    // Check payment status
    const payment = await checkPaymentStatus();
    if (!payment.hasAccess) {
      showPaymentRequired();
      return;
    }

    // Load intake data
    const intakeData = await getIntakeData();
    
    // Enable autofill if on form page
    if (window.location.pathname.includes('form-template.html')) {
      await enableAutofill();
    }

    // Initialize storage engine
    await initStorageEngine();

    // Attach event listeners
    await attachEventListeners();
  } catch (error) {
    console.error('Document Generator initialization error:', error);
  }
});

/**
 * Enable autofill from intake
 */
async function enableAutofill() {
  try {
    await autofillForm({
      insured_name: 'userName',
      insurer_name: 'insurerName',
      claim_number: 'claimNumber',
      policy_number: 'policyNumber',
      date_of_loss: 'dateOfLoss',
      property_address: 'propertyAddress'
    });
  } catch (error) {
    console.error('Autofill error:', error);
  }
}

/**
 * Initialize storage engine
 */
async function initStorageEngine() {
  // Storage engine is ready via storage.js
  // No additional initialization needed
}

/**
 * Attach event listeners
 */
async function attachEventListeners() {
  // If on form template page, wire form submission
  if (window.location.pathname.includes('form-template.html')) {
    const form = document.getElementById('documentForm');
    if (form) {
      // Remove existing submit handler if any
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      // Add our submit handler
      newForm.addEventListener('submit', handleFormSubmit);
    }
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn') || document.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : 'Generate Document';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';
    }
    
    if (window.CNLoading) {
      window.CNLoading.show("Generating document...");
    }

    // Get form data
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Get document ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');

    // Get document template info
    let documentType = 'Professional Document';
    try {
      const templatesResponse = await fetch('/app/document-generator-v2/doc-templates.json');
      if (templatesResponse.ok) {
        const templates = await templatesResponse.json();
        const template = templates.find(t => t.id === docId);
        if (template) {
          documentType = template.title || template.name || documentType;
        }
      }
    } catch (err) {
      console.error('Error loading template:', err);
    }

    // Get auth token
    const token = await getAuthToken();

    // Call AI function
    const response = await fetch('/.netlify/functions/ai-document-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        template_type: docId || 'general',
        user_inputs: data,
        document_type: documentType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Document generation failed');
    }

    const result = await response.json();

    // Display results
    displayResults(result, documentType);

    // Show save button
    showSaveButton(result, documentType);
    
    if (window.CNToast) {
      window.CNToast.success("Document generated successfully!");
    }

  } catch (error) {
    console.error('CNError (Document Generator):', error);
    if (window.CNModalError) {
      window.CNModalError.show("Document Generation Error", "The document could not be generated. Please try again.", error.message);
    } else if (window.CNToast) {
      window.CNToast.error(`Error: ${error.message}`);
    } else {
      alert(`Error: ${error.message}`);
    }
  } finally {
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

/**
 * Display results
 */
function displayResults(result, documentType) {
  // Find preview container
  const previewContainer = document.getElementById('documentPreview') || document.getElementById('previewContent') || document.getElementById('resultContainer');
  
  if (!previewContainer) {
    // Create preview container if it doesn't exist
    const form = document.getElementById('documentForm');
    if (form) {
      const container = document.createElement('div');
      container.id = 'documentPreview';
      container.className = 'document-preview';
      container.style.display = 'block';
      container.style.marginTop = '2rem';
      container.style.padding = '2rem';
      container.style.background = 'rgba(255, 255, 255, 0.1)';
      container.style.borderRadius = '1rem';
      form.parentNode.appendChild(container);
      
      const content = document.createElement('div');
      content.id = 'previewContent';
      const rawHtml = result.html || result.document_text || result.content || 'Document generated successfully';
      // Wrap with header/footer watermark if buildDocShell is available
      const wrappedHtml = (window.buildDocShell) ? window.buildDocShell(rawHtml) : rawHtml;
      content.innerHTML = `<div class="cn-doc-page">${wrappedHtml}</div>`;
      container.appendChild(content);
      
      // Increment generated documents count and store document
      let docList = [];
      let docCount = 0;
      
      // Try storage-v2 first
      if (window.CNStorage) {
        const docData = window.CNStorage.getSection("documents") || { list: [], count: 0 };
        docList = docData.list || [];
        docCount = docData.count || 0;
      } else {
        // Fallback to old localStorage
        const docKey = "cn_docs_generated";
        docCount = parseInt(localStorage.getItem(docKey) || "0", 10);
        docList = JSON.parse(localStorage.getItem("cn_document_list") || "[]");
      }
      
      // Add new document
      docList.push({
        id: Date.now(),
        title: documentType || "Generated Document",
        timestamp: Date.now()
      });
      docCount++;
      
      // Save to storage-v2
      if (window.CNStorage) {
        window.CNStorage.setSection("documents", { list: docList, count: docCount });
      }
      
      // Also save to old keys for backward compatibility
      localStorage.setItem("cn_docs_generated", String(docCount));
      localStorage.setItem("cn_document_list", JSON.stringify(docList));
      
      // Log timeline event
      if (window.CNTimeline) {
        window.CNTimeline.log("document_generated", { template: documentType || "Generated Document" });
      }
      
      // Trigger real-time Claim Health recalculation
      if (window.CNHealthHooks) {
        window.CNHealthHooks.trigger();
      }
      
      // Add save button
      showSaveButton(result, documentType);
    }
    return;
  }

  // Update existing preview
  const content = previewContainer.querySelector('#previewContent') || previewContainer;
  if (content) {
    const rawHtml = result.html || result.document_text || result.content || 'Document generated successfully';
    // Wrap with header/footer watermark if buildDocShell is available
    const wrappedHtml = (window.buildDocShell) ? window.buildDocShell(rawHtml) : rawHtml;
    content.innerHTML = `<div class="cn-doc-page">${wrappedHtml}</div>`;
    
    // Increment generated documents count
    const docKey = "cn_docs_generated";
    const docCount = parseInt(localStorage.getItem(docKey) || "0", 10);
    localStorage.setItem(docKey, String(docCount + 1));
    
    // Store document in list for portfolio
    let docList = JSON.parse(localStorage.getItem("cn_document_list") || "[]");
    docList.push({
      id: Date.now(),
      title: documentType || "Generated Document",
      timestamp: Date.now()
    });
    localStorage.setItem("cn_document_list", JSON.stringify(docList));
    
    // Log timeline event
    if (window.CNTimeline) {
      window.CNTimeline.log("document_generated", { template: documentType || "Generated Document" });
    }
    
    // Trigger real-time Claim Health recalculation
    if (window.CNHealthHooks) {
      window.CNHealthHooks.trigger();
    }
  }
  
  if (previewContainer.style) {
    previewContainer.style.display = 'block';
  }
}

/**
 * Show save button
 */
function showSaveButton(result, documentType) {
  // Check if save button exists
  let saveBtn = document.getElementById('saveToDashboardBtn');
  if (!saveBtn) {
    saveBtn = document.createElement('button');
    saveBtn.id = 'saveToDashboardBtn';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = '💾 Save to Dashboard';
    saveBtn.style.marginTop = '1rem';
    saveBtn.addEventListener('click', () => handleSaveToDashboard(result, documentType));
    
    const previewContainer = document.getElementById('documentPreview') || document.getElementById('resultContainer');
    if (previewContainer) {
      previewContainer.appendChild(saveBtn);
    } else {
      // Append to form if no preview container
      const form = document.getElementById('documentForm');
      if (form) {
        form.parentNode.appendChild(saveBtn);
      }
    }
  }
}

/**
 * Handle save to dashboard
 */
async function handleSaveToDashboard(result, documentType) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Save to documents table
    const { error } = await client
      .from('documents')
      .insert({
        user_id: user.id,
        type: 'generated_document',
        title: documentType,
        content: result.document_text || result.html || result.content || '',
        metadata: {
          template_type: result.template_type,
          generated_at: new Date().toISOString(),
          subject_line: result.subject_line
        }
      });

    if (error) throw error;

    // Save to step guide and return
    const toolParams = getToolParams();
    if (toolParams.step && toolParams.toolId) {
      saveAndReturn({
        step: toolParams.step,
        toolId: toolParams.toolId,
        reportName: getReportName(toolParams.toolId),
        summary: `${documentType} generated successfully`,
        sections: {
          documentText: result.document_text || result.html || result.content || '',
          subjectLine: result.subject_line,
          metadata: result
        }
      });
    } else {
      alert('Document saved to dashboard!');
    }
  } catch (error) {
    console.error('Save error:', error);
    alert(`Error saving: ${error.message}`);
  }
}

/**
 * Show payment required message
 */
function showPaymentRequired() {
  const main = document.querySelector('main') || document.body;
  if (main) {
    const message = document.createElement('div');
    message.className = 'error';
    message.style.cssText = 'text-align: center; padding: 2rem; margin: 2rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem;';
    message.innerHTML = `
      <h3 style="margin-bottom: 1rem;">Payment Required</h3>
      <p style="margin-bottom: 1rem;">Please purchase access to use the Document Generator.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



