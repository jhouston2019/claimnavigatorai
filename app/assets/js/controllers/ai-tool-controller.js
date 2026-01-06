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

    // Phase 2: Load intake data for context
    await loadIntakeContext();

    // Phase 3: Bind analyze/calculate button
    await bindAnalyzeButton(config);

    // Phase 4: Bind export actions
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
  const { toolId, toolName, backendFunction, inputFields, outputFormat, supabaseTable, timelineEventType } = config;
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

    // Add intake context
    const requestData = {
      ...inputData,
      context: window._intakeContext || {}
    };

    // Get auth token
    const token = await getAuthToken();

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

    // Render AI output
    await renderOutput(result.data, outputFormat);

    // Save to database
    await saveToDatabase(toolId, toolName, result.data, inputData, supabaseTable);

    // Add timeline event
    if (timelineEventType) {
      await addTimelineEvent({
        type: timelineEventType,
        date: new Date().toISOString().split('T')[0],
        source: toolId,
        title: `Completed: ${toolName}`,
        description: `AI analysis completed successfully`,
        metadata: { tool_id: toolId }
      });
    }

    // Show success message
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
    showSuccess('Analysis completed successfully!');

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
 * Render AI output based on format
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
 * Save analysis results to database
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
 * Export analysis as PDF
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
    const text = JSON.stringify(window._currentAnalysis, null, 2);
    const splitText = doc.splitTextToSize(text, 170);
    
    doc.setFontSize(12);
    doc.text(splitText, 20, 20);
    doc.save('analysis.pdf');

    showSuccess('PDF downloaded successfully');
  } catch (error) {
    console.error('[AIToolController] PDF export error:', error);
    showError('Failed to export PDF');
  }
}

/**
 * Copy analysis to clipboard
 */
async function handleCopyToClipboard() {
  if (!window._currentAnalysis) {
    showError('No analysis to copy');
    return;
  }

  try {
    const text = JSON.stringify(window._currentAnalysis, null, 2);
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

