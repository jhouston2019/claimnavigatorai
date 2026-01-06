/**
 * DOCUMENT_GENERATOR_CONTROLLER
 * 
 * Shared controller for all DOCUMENT_GENERATOR tools.
 * Implements the functional contract defined in Phase 3A.
 * 
 * Contract Requirements:
 * - Bind form submission
 * - Call AI document generation backend
 * - Render generated document
 * - Enable export actions (PDF, DOCX, Clipboard)
 * - Save to database via Tool Output Bridge
 * 
 * Usage:
 *   import { initTool } from './document-generator-controller.js';
 *   initTool({
 *     toolId: 'carrier-submission-cover-letter',
 *     toolName: 'Carrier Submission Cover Letter Generator',
 *     templateType: 'carrier_submission_cover_letter',
 *     backendFunction: '/.netlify/functions/ai-document-generator'
 *   });
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { autofillForm, getIntakeData } from '../autofill.js';
import { saveAndReturn, getToolParams, getReportName } from '../tool-output-bridge.js';
import { addTimelineEvent } from '../utils/timeline-autosync.js';
import { formatClaimOutput, getJournalEntryType, OutputTypes } from '../utils/claim-output-standard.js';
import { applyDocumentBranding, injectBrandingStyles, getClaimInfoFromContext } from '../utils/document-branding.js';

/**
 * Initialize a document generator tool
 * @param {Object} config - Tool configuration
 * @param {string} config.toolId - Unique tool identifier
 * @param {string} config.toolName - Human-readable tool name
 * @param {string} config.templateType - Template type for AI generation
 * @param {string} config.backendFunction - Netlify function endpoint (default: ai-document-generator)
 * @param {string} config.timelineEventType - Optional timeline event type
 */
export async function initTool(config) {
  const {
    toolId,
    toolName,
    templateType,
    documentType, // NEW: Type of document (letter, email, etc.)
    outputType = OutputTypes.LETTER, // NEW: Default to letter
    backendFunction = '/.netlify/functions/ai-document-generator',
    timelineEventType = 'document_generated'
  } = config;

  try {
    // Phase 1: Authentication & Access Control
    await requireAuth();
    const payment = await checkPaymentStatus();
    if (!payment.hasAccess) {
      showPaymentRequired();
      return;
    }

    // Phase 2: Inject branding styles
    injectBrandingStyles();

    // Phase 3: Auto-fill form from intake data
    await autofillIntakeData();

    // Phase 4: Bind form submission
    await bindFormSubmit(config);

    // Phase 5: Bind export actions
    await bindExportActions();

    console.log(`[DocumentGeneratorController] ${toolName} initialized successfully`);
  } catch (error) {
    console.error(`[DocumentGeneratorController] Initialization error for ${toolName}:`, error);
    showError('Failed to initialize tool. Please refresh the page.');
  }
}

/**
 * Auto-fill form fields from intake data
 */
async function autofillIntakeData() {
  try {
    const intakeData = await getIntakeData();
    if (!intakeData) return;

    // Standard field mappings for document generators
    const fieldMappings = {
      insured_name: ['userName', 'insuredName', 'claimantName'],
      insurer_name: ['insurerName', 'carrierName', 'insuranceCompany'],
      claim_number: ['claimNumber', 'claimNo'],
      policy_number: ['policyNumber', 'policyNo'],
      date_of_loss: ['dateOfLoss', 'lossDate'],
      property_address: ['propertyAddress', 'address', 'lossAddress']
    };

    // Attempt to fill each field
    Object.keys(fieldMappings).forEach(dataKey => {
      const value = intakeData[dataKey];
      if (!value) return;

      fieldMappings[dataKey].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value) {
          field.value = value;
        }
      });
    });
  } catch (error) {
    console.warn('[DocumentGeneratorController] Autofill failed:', error);
  }
}

/**
 * Bind form submission handler
 */
async function bindFormSubmit(config) {
  const form = document.querySelector('[data-tool-form]') || document.querySelector('form');
  if (!form) {
    console.warn('[DocumentGeneratorController] No form found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleGenerate(config, form);
  });
}

/**
 * Handle document generation (PHASE 5A - Claim-grade output)
 */
async function handleGenerate(config, form) {
  const { 
    toolId, 
    toolName, 
    templateType, 
    documentType,
    outputType = OutputTypes.LETTER,
    backendFunction, 
    timelineEventType 
  } = config;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : 'Generate Document';

  try {
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';
    }
    if (window.CNLoading) {
      window.CNLoading.show('Generating document...');
    }

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Get claim context
    const claimInfo = getClaimInfoFromContext();

    // Get auth token and user
    const token = await getAuthToken();
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();

    // Call backend AI function
    const response = await fetch(backendFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        template_type: templateType,
        user_inputs: data,
        document_type: documentType || toolName,
        claim_info: claimInfo
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Document generation failed');
    }

    const result = await response.json();
    const documentContent = result.data?.document_text || result.data?.content || result.data;

    // PHASE 5A: Format output to claim-grade standard
    const formattedOutput = formatClaimOutput({
      toolName,
      outputType,
      content: documentContent,
      claimInfo,
      userId: user?.id
    });

    // Apply document branding
    const brandedHtml = applyDocumentBranding(
      formattedOutput.formattedHtml,
      claimInfo,
      formattedOutput.metadata
    );

    // Render branded document
    await renderBrandedDocument(brandedHtml);

    // MANDATORY: Save to Claim Journal (journal_entries table)
    await saveToClaimJournal({
      userId: user?.id,
      claimId: claimInfo.claimId,
      toolName,
      outputType,
      title: formattedOutput.title,
      content: formattedOutput.plainText,
      htmlContent: brandedHtml,
      metadata: formattedOutput.metadata,
      inputData: data
    });

    // Also save to documents table for backward compatibility
    await saveToDatabase(toolId, toolName, result.data, data);

    // Add timeline event
    if (timelineEventType) {
      await addTimelineEvent({
        type: timelineEventType,
        date: new Date().toISOString().split('T')[0],
        source: toolId,
        title: `Generated: ${toolName}`,
        description: formattedOutput.title,
        metadata: { 
          template_type: templateType,
          journal_entry: formattedOutput.title
        }
      });
    }

    // Store for export
    window._currentDocument = {
      raw: result.data,
      formatted: formattedOutput,
      branded: brandedHtml
    };

    // Show success message
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    showSuccess('Document generated and saved to Claim Journal!');

  } catch (error) {
    console.error('[DocumentGeneratorController] Generation error:', error);
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    showError(error.message || 'Failed to generate document');
  } finally {
    // Restore button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

/**
 * Render branded document (PHASE 5A)
 */
async function renderBrandedDocument(brandedHtml) {
  const outputArea = document.querySelector('[data-tool-output]') || document.getElementById('output');
  if (!outputArea) {
    console.warn('[DocumentGeneratorController] No output area found');
    return;
  }

  // Show output area
  outputArea.style.display = 'block';
  outputArea.classList.remove('hidden');

  // Render branded HTML directly
  outputArea.innerHTML = brandedHtml;
}

/**
 * Render generated document in output area (LEGACY - kept for backward compatibility)
 */
async function renderDocument(documentData) {
  const outputArea = document.querySelector('[data-tool-output]') || document.getElementById('output');
  if (!outputArea) {
    console.warn('[DocumentGeneratorController] No output area found');
    return;
  }

  // Show output area
  outputArea.style.display = 'block';
  outputArea.classList.remove('hidden');

  // Render document text
  const documentText = documentData.document_text || documentData.content || '';
  const contentArea = outputArea.querySelector('[data-document-content]') || outputArea;
  
  if (contentArea) {
    contentArea.innerHTML = `<div style="white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.6;">${escapeHtml(documentText)}</div>`;
  }

  // Store document data for export
  window._currentDocument = {
    text: documentText,
    metadata: documentData.metadata || {}
  };
}

/**
 * MANDATORY: Save to Claim Journal (PHASE 5A)
 * Every document MUST be journaled - no opt-out
 */
async function saveToClaimJournal({
  userId,
  claimId,
  toolName,
  outputType,
  title,
  content,
  htmlContent,
  metadata,
  inputData
}) {
  try {
    const client = await getSupabaseClient();
    
    if (!userId) {
      const { data: { user } } = await client.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      throw new Error('User ID required for journaling');
    }

    // Determine entry type based on output type
    const entryType = getJournalEntryType(outputType);

    // Insert into journal_entries table
    const { data, error } = await client
      .from('journal_entries')
      .insert({
        user_id: userId,
        claim_id: claimId || null,
        tool_name: toolName,
        entry_type: entryType,
        title: title,
        content: content,
        html_content: htmlContent,
        metadata: {
          ...metadata,
          input_data: inputData,
          output_type: outputType,
          journaled_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`[DocumentGeneratorController] ✅ Saved to Claim Journal: ${title}`);
    return data;

  } catch (error) {
    console.error('[DocumentGeneratorController] ❌ CRITICAL: Failed to save to Claim Journal:', error);
    // This is critical - throw error to prevent silent failures
    throw new Error(`Failed to journal document: ${error.message}`);
  }
}

/**
 * Save generated document to database (backward compatibility)
 */
async function saveToDatabase(toolId, toolName, documentData, userInputs) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from('documents').insert({
      user_id: user.id,
      type: 'generated_document',
      title: toolName,
      content: documentData.document_text || documentData.content || '',
      metadata: {
        tool_id: toolId,
        template_type: documentData.template_type,
        user_inputs: userInputs,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn('[DocumentGeneratorController] Failed to save to database:', error);
  }
}

/**
 * Bind export action buttons
 */
async function bindExportActions() {
  // PDF Export
  const pdfBtn = document.querySelector('[data-export-pdf]') || document.getElementById('exportPDF');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', handleExportPDF);
  }

  // DOCX Export
  const docxBtn = document.querySelector('[data-export-docx]') || document.getElementById('exportDOCX');
  if (docxBtn) {
    docxBtn.addEventListener('click', handleExportDOCX);
  }

  // Copy to Clipboard
  const copyBtn = document.querySelector('[data-copy-clipboard]') || document.getElementById('copyToClipboard');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyToClipboard);
  }
}

/**
 * Export document as PDF
 */
async function handleExportPDF() {
  if (!window._currentDocument) {
    showError('No document to export');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showError('PDF library not loaded');
      return;
    }

    const doc = new jsPDF();
    const text = window._currentDocument.text;
    const splitText = doc.splitTextToSize(text, 170);
    
    doc.setFontSize(12);
    doc.text(splitText, 20, 20);
    doc.save('document.pdf');

    showSuccess('PDF downloaded successfully');
  } catch (error) {
    console.error('[DocumentGeneratorController] PDF export error:', error);
    showError('Failed to export PDF');
  }
}

/**
 * Export document as DOCX
 */
async function handleExportDOCX() {
  if (!window._currentDocument) {
    showError('No document to export');
    return;
  }

  try {
    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/export-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: window._currentDocument.text,
        filename: 'document.docx'
      })
    });

    if (!response.ok) throw new Error('DOCX export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.docx';
    a.click();

    showSuccess('DOCX downloaded successfully');
  } catch (error) {
    console.error('[DocumentGeneratorController] DOCX export error:', error);
    showError('Failed to export DOCX');
  }
}

/**
 * Copy document to clipboard
 */
async function handleCopyToClipboard() {
  if (!window._currentDocument) {
    showError('No document to copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(window._currentDocument.text);
    showSuccess('Copied to clipboard!');
  } catch (error) {
    console.error('[DocumentGeneratorController] Clipboard error:', error);
    showError('Failed to copy to clipboard');
  }
}

/**
 * Utility: Show payment required message
 */
function showPaymentRequired() {
  if (window.CNPaywall) {
    window.CNPaywall.show();
  } else {
    alert('Payment required to access this tool.');
    window.location.href = '/app/pricing.html';
  }
}

/**
 * Utility: Show success message
 */
function showSuccess(message) {
  if (window.CNNotification) {
    window.CNNotification.success(message);
  } else {
    alert(message);
  }
}

/**
 * Utility: Show error message
 */
function showError(message) {
  if (window.CNError) {
    window.CNError.show(message);
  } else {
    alert('Error: ' + message);
  }
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

