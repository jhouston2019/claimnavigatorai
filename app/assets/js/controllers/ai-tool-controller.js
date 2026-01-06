/**
 * AI_TOOL_CONTROLLER
 * 
 * Shared controller for all AI_TOOL tools.
 * Implements the functional contract defined in Phase 3A.
 * 
 * Contract Requirements:
 * - Bind analyze/calculate button
 * - Call configured AI Netlify function
 * - Render structured AI output
 * - Enable export actions
 * - Save results to database
 * 
 * Usage:
 *   import { initTool } from './ai-tool-controller.js';
 *   initTool({
 *     toolId: 'comparable-item-finder',
 *     toolName: 'Comparable Item Finder',
 *     backendFunction: '/.netlify/functions/ai-comparable-items',
 *     inputFields: ['itemDescription', 'estimatedValue'],
 *     outputFormat: 'structured'
 *   });
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { getIntakeData } from '../autofill.js';
import { saveAndReturn, getToolParams, getReportName } from '../tool-output-bridge.js';
import { addTimelineEvent } from '../utils/timeline-autosync.js';
import { formatClaimOutput, getJournalEntryType, OutputTypes } from '../utils/claim-output-standard.js';
import { applyDocumentBranding, injectBrandingStyles, getClaimInfoFromContext } from '../utils/document-branding.js';

/**
 * Initialize an AI tool
 * @param {Object} config - Tool configuration
 * @param {string} config.toolId - Unique tool identifier
 * @param {string} config.toolName - Human-readable tool name
 * @param {string} config.backendFunction - Netlify function endpoint
 * @param {Array<string>} config.inputFields - Required input field IDs
 * @param {string} config.outputFormat - Output format: 'structured', 'text', 'calculation'
 * @param {string} config.supabaseTable - Optional Supabase table for results
 * @param {string} config.timelineEventType - Optional timeline event type
 */
export async function initTool(config) {
  const {
    toolId,
    toolName,
    backendFunction,
    inputFields = [],
    outputFormat = 'structured',
    outputType = OutputTypes.ANALYSIS, // NEW: Claim output type
    supabaseTable = 'documents',
    timelineEventType = 'ai_analysis'
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

    // Phase 3: Load intake data for context
    await loadIntakeContext();

    // Phase 4: Bind analyze/calculate button
    await bindAnalyzeButton(config);

    // Phase 5: Bind export actions
    await bindExportActions();

    console.log(`[AIToolController] ${toolName} initialized successfully`);
  } catch (error) {
    console.error(`[AIToolController] Initialization error for ${toolName}:`, error);
    showError('Failed to initialize tool. Please refresh the page.');
  }
}

/**
 * Load intake data for context
 */
async function loadIntakeContext() {
  try {
    const intakeData = await getIntakeData();
    if (intakeData) {
      // Store intake data globally for AI context
      window._intakeContext = intakeData;
    }
  } catch (error) {
    console.warn('[AIToolController] Failed to load intake context:', error);
  }
}

/**
 * Bind analyze/calculate button
 */
async function bindAnalyzeButton(config) {
  const analyzeBtn = document.querySelector('[data-analyze-btn]') || 
                     document.querySelector('[data-calculate-btn]') ||
                     document.getElementById('analyzeBtn') ||
                     document.getElementById('calculateBtn');
  
  if (!analyzeBtn) {
    console.warn('[AIToolController] No analyze button found');
    return;
  }

  analyzeBtn.addEventListener('click', async () => {
    await handleAnalyze(config);
  });
}

/**
 * Handle AI analysis
 */
async function handleAnalyze(config) {
  const { 
    toolId, 
    toolName, 
    backendFunction, 
    inputFields, 
    outputFormat, 
    outputType = OutputTypes.ANALYSIS,
    supabaseTable, 
    timelineEventType 
  } = config;
  
  const analyzeBtn = document.querySelector('[data-analyze-btn]') || 
                     document.querySelector('[data-calculate-btn]') ||
                     document.getElementById('analyzeBtn') ||
                     document.getElementById('calculateBtn');
  const originalText = analyzeBtn ? analyzeBtn.textContent : 'Analyze';

  try {
    // Show loading state
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analyzing...';
    }
    if (window.CNLoading) {
      window.CNLoading.show('Running AI analysis...');
    }

    // Collect input data
    const inputData = collectInputData(inputFields);

    // Validate required fields
    if (!validateInputs(inputData, inputFields)) {
      throw new Error('Please fill in all required fields');
    }

    // Get claim context
    const claimInfo = getClaimInfoFromContext();

    // Add intake context
    const requestData = {
      ...inputData,
      context: window._intakeContext || {},
      claimInfo: claimInfo
    };

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
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const result = await response.json();
    const aiContent = result.data || result;

    // PHASE 5A: Format output to claim-grade standard
    const formattedOutput = formatClaimOutput({
      toolName,
      outputType,
      content: typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent, null, 2),
      claimInfo,
      userId: user?.id
    });

    // Apply document branding
    const brandedHtml = applyDocumentBranding(
      formattedOutput.formattedHtml,
      claimInfo,
      formattedOutput.metadata
    );

    // Render branded output
    await renderBrandedOutput(brandedHtml, outputFormat);

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
      inputData
    });

    // Also save to documents table for backward compatibility
    await saveToDatabase(toolId, toolName, aiContent, inputData, supabaseTable);

    // Add timeline event
    if (timelineEventType) {
      await addTimelineEvent({
        type: timelineEventType,
        date: new Date().toISOString().split('T')[0],
        source: toolId,
        title: `Completed: ${toolName}`,
        description: formattedOutput.title,
        metadata: { 
          tool_id: toolId,
          journal_entry: formattedOutput.title
        }
      });
    }

    // Store for export
    window._currentAnalysis = {
      raw: aiContent,
      formatted: formattedOutput,
      branded: brandedHtml
    };

    // Show success message
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    showSuccess('Analysis completed and saved to Claim Journal!');

  } catch (error) {
    console.error('[AIToolController] Analysis error:', error);
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    showError(error.message || 'Analysis failed');
  } finally {
    // Restore button state
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = originalText;
    }
  }
}

/**
 * Collect input data from form fields
 */
function collectInputData(inputFields) {
  const data = {};
  
  // Collect from specified input fields
  inputFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      data[fieldId] = field.value;
    }
  });

  // Collect from all form inputs if no specific fields specified
  if (inputFields.length === 0) {
    const form = document.querySelector('[data-tool-form]') || document.querySelector('form');
    if (form) {
      const formData = new FormData(form);
      Object.keys(Object.fromEntries(formData.entries())).forEach(key => {
        data[key] = formData.get(key);
      });
    }
  }

  return data;
}

/**
 * Validate required inputs
 */
function validateInputs(inputData, requiredFields) {
  if (requiredFields.length === 0) return true;
  
  for (const field of requiredFields) {
    if (!inputData[field] || inputData[field].trim() === '') {
      return false;
    }
  }
  return true;
}

/**
 * Render branded output (PHASE 5A)
 */
async function renderBrandedOutput(brandedHtml, format) {
  const outputArea = document.querySelector('[data-tool-output]') || document.getElementById('output');
  if (!outputArea) {
    console.warn('[AIToolController] No output area found');
    return;
  }

  // Show output area
  outputArea.style.display = 'block';
  outputArea.classList.remove('hidden');

  // Render branded HTML directly
  outputArea.innerHTML = brandedHtml;
}

/**
 * Render AI output based on format (LEGACY - kept for backward compatibility)
 */
async function renderOutput(data, format) {
  const outputArea = document.querySelector('[data-tool-output]') || document.getElementById('output');
  if (!outputArea) {
    console.warn('[AIToolController] No output area found');
    return;
  }

  // Show output area
  outputArea.style.display = 'block';
  outputArea.classList.remove('hidden');

  let html = '';

  switch (format) {
    case 'structured':
      html = renderStructuredOutput(data);
      break;
    case 'calculation':
      html = renderCalculationOutput(data);
      break;
    case 'text':
    default:
      html = renderTextOutput(data);
      break;
  }

  outputArea.innerHTML = html;

  // Store output data for export
  window._currentAnalysis = data;
}

/**
 * Render structured output (sections with headings)
 */
function renderStructuredOutput(data) {
  let html = '<div class="ai-output-structured">';
  
  // Summary section
  if (data.summary || data.analysis) {
    html += `<div class="output-section">
      <h3>Summary</h3>
      <p>${escapeHtml(data.summary || data.analysis)}</p>
    </div>`;
  }

  // Recommendations section
  if (data.recommendations) {
    html += `<div class="output-section">
      <h3>Recommendations</h3>`;
    if (Array.isArray(data.recommendations)) {
      html += '<ul>';
      data.recommendations.forEach(rec => {
        html += `<li>${escapeHtml(rec)}</li>`;
      });
      html += '</ul>';
    } else {
      html += `<p>${escapeHtml(data.recommendations)}</p>`;
    }
    html += '</div>';
  }

  // Details section
  if (data.details) {
    html += `<div class="output-section">
      <h3>Details</h3>
      <p>${escapeHtml(data.details)}</p>
    </div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render calculation output (numeric results with breakdown)
 */
function renderCalculationOutput(data) {
  let html = '<div class="ai-output-calculation">';
  
  // Main result
  if (data.result !== undefined || data.estimate !== undefined) {
    const value = data.result || data.estimate;
    html += `<div class="output-result">
      <h3>Result</h3>
      <p class="result-value">${typeof value === 'number' ? '$' + value.toLocaleString() : escapeHtml(value)}</p>
    </div>`;
  }

  // Breakdown
  if (data.breakdown) {
    html += `<div class="output-section">
      <h3>Breakdown</h3>`;
    if (typeof data.breakdown === 'object') {
      html += '<ul>';
      Object.keys(data.breakdown).forEach(key => {
        html += `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(data.breakdown[key]))}</li>`;
      });
      html += '</ul>';
    } else {
      html += `<p>${escapeHtml(data.breakdown)}</p>`;
    }
    html += '</div>';
  }

  // Explanation
  if (data.explanation) {
    html += `<div class="output-section">
      <h3>Explanation</h3>
      <p>${escapeHtml(data.explanation)}</p>
    </div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render text output (simple text response)
 */
function renderTextOutput(data) {
  const text = data.response || data.analysis || data.text || JSON.stringify(data, null, 2);
  return `<div class="ai-output-text">
    <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(text)}</pre>
  </div>`;
}

/**
 * MANDATORY: Save to Claim Journal (PHASE 5A)
 * Every AI output MUST be journaled - no opt-out
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

    console.log(`[AIToolController] ✅ Saved to Claim Journal: ${title}`);
    return data;

  } catch (error) {
    console.error('[AIToolController] ❌ CRITICAL: Failed to save to Claim Journal:', error);
    // This is critical - throw error to prevent silent failures
    throw new Error(`Failed to journal output: ${error.message}`);
  }
}

/**
 * Save analysis results to database (backward compatibility)
 */
async function saveToDatabase(toolId, toolName, analysisData, inputData, tableName) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from(tableName).insert({
      user_id: user.id,
      type: 'ai_analysis',
      title: toolName,
      content: JSON.stringify(analysisData),
      metadata: {
        tool_id: toolId,
        input_data: inputData,
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn('[AIToolController] Failed to save to database:', error);
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

  // Copy to Clipboard
  const copyBtn = document.querySelector('[data-copy-clipboard]') || document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyToClipboard);
  }
}

/**
 * Export analysis as PDF (PHASE 5A - uses formatted output)
 */
async function handleExportPDF() {
  if (!window._currentAnalysis) {
    showError('No analysis to export');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showError('PDF library not loaded');
      return;
    }

    const doc = new jsPDF();
    
    // Use formatted plain text if available
    const text = window._currentAnalysis.formatted?.plainText || 
                 JSON.stringify(window._currentAnalysis.raw || window._currentAnalysis, null, 2);
    
    const splitText = doc.splitTextToSize(text, 170);
    
    doc.setFontSize(10);
    doc.text(splitText, 20, 20);
    
    const filename = `claim-analysis-${Date.now()}.pdf`;
    doc.save(filename);

    showSuccess('PDF downloaded successfully');
  } catch (error) {
    console.error('[AIToolController] PDF export error:', error);
    showError('Failed to export PDF');
  }
}

/**
 * Copy analysis to clipboard (PHASE 5A - uses formatted output)
 */
async function handleCopyToClipboard() {
  if (!window._currentAnalysis) {
    showError('No analysis to copy');
    return;
  }

  try {
    // Use formatted plain text if available
    const text = window._currentAnalysis.formatted?.plainText || 
                 JSON.stringify(window._currentAnalysis.raw || window._currentAnalysis, null, 2);
    
    await navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  } catch (error) {
    console.error('[AIToolController] Clipboard error:', error);
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

