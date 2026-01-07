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
    timelineEventType = 'ai_analysis',
    customData = {} // NEW: Custom data to send to backend
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

    // Add intake context and custom data
    const requestData = {
      ...inputData,
      ...customData, // Merge custom data (e.g., analysis_mode)
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
 * Render structured output (ENHANCED - routes to tool-specific renderers)
 */
function renderStructuredOutput(data) {
  // Route to tool-specific renderer based on data structure
  if (data.gaps && Array.isArray(data.gaps)) {
    return renderCoverageGaps(data);
  }
  if (data.discrepancies && Array.isArray(data.discrepancies)) {
    return renderLineItemDiscrepancies(data);
  }
  if (data.missing && Array.isArray(data.missing)) {
    return renderMissingItems(data);
  }
  if (data.omissions && Array.isArray(data.omissions)) {
    return renderScopeOmissions(data);
  }
  if (data.sublimits && Array.isArray(data.sublimits)) {
    return renderSublimitImpacts(data);
  }
  if (data.upgrades && Array.isArray(data.upgrades)) {
    return renderCodeUpgrades(data);
  }
  if (data.deviations && Array.isArray(data.deviations)) {
    return renderPricingDeviations(data);
  }
  if (data.comparables && Array.isArray(data.comparables)) {
    return renderComparableItems(data);
  }
  if (data.missing_trades && Array.isArray(data.missing_trades)) {
    return renderMissingTrades(data);
  }
  if (data.subject && data.body) {
    return renderResponseAgent(data);
  }
  if (data.assessment && Array.isArray(data.assessment)) {
    return renderDamageAssessment(data);
  }
  if (data.coverage_map && Array.isArray(data.coverage_map)) {
    return renderCoverageMap(data);
  }
  if (data.documentation) {
    return renderDamageDocumentation(data);
  }
  if (data.labels && Array.isArray(data.labels)) {
    return renderDamageLabels(data);
  }
  if (data.opinion) {
    return renderExpertOpinion(data);
  }
  if (data.mitigation_items && Array.isArray(data.mitigation_items)) {
    return renderMitigationDocumentation(data);
  }
  if (data.prompts && Array.isArray(data.prompts)) {
    return renderRoomByRoomGuide(data);
  }
  
  // Fallback to generic structured output
  return renderGenericStructured(data);
}

/**
 * Render generic structured output (fallback)
 */
function renderGenericStructured(data) {
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
 * TOOL-SPECIFIC RENDERERS
 * Each function renders data in a structured, scannable format
 */

/**
 * Render Coverage Gaps (Coverage Gap Detector, Sublimit Impact Analyzer)
 */
function renderCoverageGaps(data) {
  let html = '<div class="coverage-gaps-output structured-output">';
  
  const gapCount = data.gaps ? data.gaps.length : 0;
  html += `<div class="output-header">
    <h3>Coverage Gaps Detected: ${gapCount}</h3>
  </div>`;
  
  if (data.completeness_score !== undefined) {
    html += `<div class="completeness-score">
      <strong>Coverage Completeness:</strong> ${data.completeness_score}%
    </div>`;
  }
  
  if (data.gaps && data.gaps.length > 0) {
    data.gaps.forEach((gap, index) => {
      const severityClass = getSeverityClass(gap.severity);
      const severityIcon = getSeverityIcon(gap.severity);
      
      html += `<div class="gap-item structured-item ${severityClass}">
        <div class="item-header">
          <h4>${severityIcon} Gap #${index + 1}: ${escapeHtml(gap.name || gap.title || 'Coverage Gap')}</h4>
          <span class="severity-badge ${severityClass}">${gap.severity || 'MEDIUM'}</span>
        </div>
        <div class="item-details">`;
      
      if (gap.section) {
        html += `<p><strong>Policy Section:</strong> ${escapeHtml(gap.section)}</p>`;
      }
      if (gap.impact) {
        html += `<p><strong>Impact:</strong> ${escapeHtml(gap.impact)}</p>`;
      }
      if (gap.cost !== undefined) {
        html += `<p><strong>Potential Cost:</strong> ${formatCurrency(gap.cost)}</p>`;
      }
      if (gap.recommendation) {
        html += `<p><strong>Recommendation:</strong> ${escapeHtml(gap.recommendation)}</p>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">No coverage gaps detected.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Line Item Discrepancies (Line Item Discrepancy Finder, Pricing Deviation Analyzer)
 */
function renderLineItemDiscrepancies(data) {
  let html = '<div class="line-item-discrepancies-output structured-output">';
  
  const discrepancyCount = data.discrepancies ? data.discrepancies.length : 0;
  html += `<div class="output-header">
    <h3>Line Item Discrepancies Found: ${discrepancyCount}</h3>
  </div>`;
  
  if (data.total_difference !== undefined) {
    html += `<div class="total-difference">
      <strong>Total Discrepancy:</strong> ${formatCurrency(data.total_difference)}`;
    if (data.percentage_difference !== undefined) {
      html += ` (${data.percentage_difference}%)`;
    }
    html += `</div>`;
  }
  
  if (data.discrepancies && data.discrepancies.length > 0) {
    html += `<div class="discrepancies-table">
      <table class="structured-table">
        <thead>
          <tr>
            <th>Line Item</th>
            <th>Contractor</th>
            <th>Carrier</th>
            <th>Difference</th>
            <th>%</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.discrepancies.forEach(disc => {
      const severityClass = getSeverityClass(disc.severity);
      const severityIcon = getSeverityIcon(disc.severity);
      const difference = (disc.value1 || 0) - (disc.value2 || 0);
      const percentage = disc.percentage || ((difference / (disc.value2 || 1)) * 100);
      
      html += `<tr class="${severityClass}">
        <td>${escapeHtml(disc.item || disc.name || 'Item')}</td>
        <td>${formatCurrency(disc.value1 || disc.contractor || 0)}</td>
        <td>${formatCurrency(disc.value2 || disc.carrier || 0)}</td>
        <td class="difference">${difference >= 0 ? '+' : ''}${formatCurrency(difference)}</td>
        <td>${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%</td>
        <td class="severity-cell">${severityIcon}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  } else {
    html += '<p class="no-items">No discrepancies found.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Missing Items (Missing Document Identifier, Missing Evidence Identifier)
 */
function renderMissingItems(data) {
  let html = '<div class="missing-items-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Missing Items Analysis</h3>
  </div>`;
  
  if (data.completeness_score !== undefined) {
    const scoreClass = data.completeness_score >= 80 ? 'score-high' : 
                       data.completeness_score >= 60 ? 'score-medium' : 'score-low';
    html += `<div class="completeness-score ${scoreClass}">
      <strong>Completeness Score:</strong> ${data.completeness_score}%
    </div>`;
  }
  
  if (data.priority_items && data.priority_items.length > 0) {
    html += `<div class="priority-section">
      <h4>🔴 HIGH PRIORITY</h4>
      <ul class="priority-list">`;
    data.priority_items.forEach(item => {
      html += `<li class="priority-item">${escapeHtml(item)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.missing && data.missing.length > 0) {
    html += `<div class="missing-section">
      <h4>Missing Items (${data.missing.length})</h4>
      <ul class="missing-list">`;
    data.missing.forEach(item => {
      html += `<li class="missing-item">❌ ${escapeHtml(item)}</li>`;
    });
    html += `</ul></div>`;
  } else {
    html += '<p class="no-items">✅ All required items present.</p>';
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    html += `<div class="recommendations-section">
      <h4>Recommendations</h4>
      <ul class="recommendations-list">`;
    data.recommendations.forEach(rec => {
      html += `<li class="recommendation-item">✓ ${escapeHtml(rec)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Scope Omissions (Scope Omission Detector, Missing Trade Detector)
 */
function renderScopeOmissions(data) {
  let html = '<div class="scope-omissions-output structured-output">';
  
  const omissionCount = data.omissions ? data.omissions.length : 0;
  html += `<div class="output-header">
    <h3>Scope Omissions Detected: ${omissionCount}</h3>
  </div>`;
  
  if (data.total_omitted_value !== undefined) {
    html += `<div class="total-value">
      <strong>Total Omitted Value:</strong> ${formatCurrency(data.total_omitted_value)}
    </div>`;
  }
  
  if (data.omissions && data.omissions.length > 0) {
    html += `<div class="omissions-table">
      <table class="structured-table">
        <thead>
          <tr>
            <th>Omitted Item</th>
            <th>Category</th>
            <th>Est. Cost</th>
            <th>Severity</th>
            <th>Justification</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.omissions.forEach(omission => {
      const severityClass = getSeverityClass(omission.severity);
      const severityIcon = getSeverityIcon(omission.severity);
      
      html += `<tr class="${severityClass}">
        <td><strong>${escapeHtml(omission.item || omission.name || 'Item')}</strong></td>
        <td>${escapeHtml(omission.category || 'General')}</td>
        <td>${formatCurrency(omission.cost || omission.estimated_cost || 0)}</td>
        <td class="severity-cell">${severityIcon} ${omission.severity || 'MEDIUM'}</td>
        <td>${escapeHtml(omission.justification || omission.reason || '')}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  } else {
    html += '<p class="no-items">✅ No scope omissions detected.</p>';
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    html += `<div class="recommendations-section">
      <h4>Recommendations</h4>
      <ul class="recommendations-list">`;
    data.recommendations.forEach(rec => {
      html += `<li>✓ ${escapeHtml(rec)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Sublimit Impacts (Sublimit Impact Analyzer)
 */
function renderSublimitImpacts(data) {
  let html = '<div class="sublimit-impacts-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Sublimit Impact Analysis</h3>
  </div>`;
  
  if (data.total_impact !== undefined) {
    html += `<div class="total-impact">
      <strong>Total Sublimit Impact:</strong> ${formatCurrency(data.total_impact)}`;
    if (data.percentage_affected !== undefined) {
      html += ` (${data.percentage_affected}% of claim)`;
    }
    html += `</div>`;
  }
  
  if (data.sublimits && data.sublimits.length > 0) {
    data.sublimits.forEach((sublimit, index) => {
      const shortfall = (sublimit.claim_amount || 0) - (sublimit.limit || 0);
      const severityClass = shortfall > 0 ? 'severity-high' : 'severity-low';
      const statusIcon = shortfall > 0 ? '🔴' : '✅';
      
      html += `<div class="sublimit-item structured-item ${severityClass}">
        <div class="item-header">
          <h4>${statusIcon} ${escapeHtml(sublimit.category || sublimit.name || `Sublimit #${index + 1}`)}</h4>
        </div>
        <div class="item-details">
          <p><strong>Policy Limit:</strong> ${formatCurrency(sublimit.limit || 0)}</p>
          <p><strong>Your Claim:</strong> ${formatCurrency(sublimit.claim_amount || 0)}</p>`;
      
      if (shortfall !== 0) {
        html += `<p><strong>Shortfall:</strong> <span class="${shortfall > 0 ? 'negative' : 'positive'}">${formatCurrency(shortfall)}</span></p>`;
      }
      
      if (sublimit.impact) {
        html += `<p><strong>Impact:</strong> ${escapeHtml(sublimit.impact)}</p>`;
      }
      if (sublimit.recommendation) {
        html += `<p><strong>Recommendation:</strong> ${escapeHtml(sublimit.recommendation)}</p>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">✅ No sublimit issues detected.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Code Upgrades (Code Upgrade Identifier)
 */
function renderCodeUpgrades(data) {
  let html = '<div class="code-upgrades-output structured-output">';
  
  const upgradeCount = data.upgrades ? data.upgrades.length : 0;
  html += `<div class="output-header">
    <h3>Code Upgrades Required: ${upgradeCount}</h3>
  </div>`;
  
  if (data.total_cost !== undefined) {
    html += `<div class="total-cost">
      <strong>Total Code Upgrade Cost:</strong> ${formatCurrency(data.total_cost)}`;
    if (data.coverage_available !== undefined) {
      html += `<br><strong>Coverage Available:</strong> ${formatCurrency(data.coverage_available)}`;
      const shortfall = data.total_cost - data.coverage_available;
      if (shortfall > 0) {
        html += `<br><strong>Shortfall:</strong> <span class="negative">${formatCurrency(shortfall)}</span>`;
      } else {
        html += `<br><strong>Status:</strong> <span class="positive">✅ Fully Covered</span>`;
      }
    }
    html += `</div>`;
  }
  
  if (data.upgrades && data.upgrades.length > 0) {
    data.upgrades.forEach((upgrade, index) => {
      const severityClass = getSeverityClass(upgrade.severity);
      
      html += `<div class="upgrade-item structured-item ${severityClass}">
        <div class="item-header">
          <h4>Upgrade #${index + 1}: ${escapeHtml(upgrade.name || upgrade.item || 'Code Upgrade')}</h4>
        </div>
        <div class="item-details">`;
      
      if (upgrade.current_code) {
        html += `<p><strong>Current Code:</strong> ${escapeHtml(upgrade.current_code)}</p>`;
      }
      if (upgrade.required_code) {
        html += `<p><strong>Required Code:</strong> ${escapeHtml(upgrade.required_code)}</p>`;
      }
      if (upgrade.cost !== undefined) {
        html += `<p><strong>Estimated Cost:</strong> ${formatCurrency(upgrade.cost)}</p>`;
      }
      if (upgrade.justification) {
        html += `<p><strong>Justification:</strong> ${escapeHtml(upgrade.justification)}</p>`;
      }
      if (upgrade.coverage) {
        html += `<p><strong>Coverage:</strong> ${escapeHtml(upgrade.coverage)}</p>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">✅ No code upgrades required.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Pricing Deviations (Pricing Deviation Analyzer)
 */
function renderPricingDeviations(data) {
  let html = '<div class="pricing-deviations-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Pricing Deviation Analysis</h3>
  </div>`;
  
  if (data.total_impact !== undefined) {
    html += `<div class="total-impact">
      <strong>Total Impact:</strong> ${formatCurrency(data.total_impact)}`;
    if (data.percentage_below_market !== undefined) {
      html += ` (${data.percentage_below_market}% below market)`;
    }
    html += `</div>`;
  }
  
  if (data.deviations && data.deviations.length > 0) {
    html += `<div class="deviations-table">
      <table class="structured-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Carrier Price</th>
            <th>Market Rate</th>
            <th>Deviation</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.deviations.forEach(dev => {
      const deviation = ((dev.carrier_price || 0) - (dev.market_rate || 0)) / (dev.market_rate || 1) * 100;
      const severityClass = Math.abs(deviation) > 25 ? 'severity-high' : 
                           Math.abs(deviation) > 10 ? 'severity-medium' : 'severity-low';
      const severityIcon = Math.abs(deviation) > 25 ? '🔴' : 
                          Math.abs(deviation) > 10 ? '🟡' : '🟢';
      
      html += `<tr class="${severityClass}">
        <td>${escapeHtml(dev.item || dev.name || 'Item')}</td>
        <td>${formatCurrency(dev.carrier_price || 0)}</td>
        <td>${formatCurrency(dev.market_rate || 0)}</td>
        <td class="deviation">${deviation.toFixed(1)}%</td>
        <td class="severity-cell">${severityIcon}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  } else {
    html += '<p class="no-items">✅ Pricing within market range.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Comparable Items (Comparable Item Finder)
 */
function renderComparableItems(data) {
  let html = '<div class="comparable-items-output structured-output">';
  
  const comparableCount = data.comparables ? data.comparables.length : 0;
  html += `<div class="output-header">
    <h3>Comparable Items Found: ${comparableCount}</h3>
  </div>`;
  
  if (data.item_name) {
    html += `<div class="search-item">
      <strong>Searching for:</strong> ${escapeHtml(data.item_name)}
    </div>`;
  }
  
  if (data.recommended_rcv !== undefined) {
    html += `<div class="recommended-value">
      <strong>Recommended Replacement Cost:</strong> ${formatCurrency(data.recommended_rcv)}`;
    if (data.depreciation !== undefined) {
      html += `<br><strong>Depreciation:</strong> ${formatCurrency(data.depreciation)}`;
    }
    if (data.acv !== undefined) {
      html += `<br><strong>Actual Cash Value:</strong> ${formatCurrency(data.acv)}`;
    }
    html += `</div>`;
  }
  
  if (data.comparables && data.comparables.length > 0) {
    data.comparables.forEach((comp, index) => {
      const matchClass = (comp.match_percentage || 0) >= 90 ? 'match-high' : 
                        (comp.match_percentage || 0) >= 75 ? 'match-medium' : 'match-low';
      
      html += `<div class="comparable-item structured-item ${matchClass}">
        <div class="item-header">
          <h4>Comparable #${index + 1}: ${escapeHtml(comp.name || comp.item || 'Item')}</h4>
          ${comp.match_percentage ? `<span class="match-badge">${comp.match_percentage}% Match</span>` : ''}
        </div>
        <div class="item-details">
          <p><strong>Price:</strong> ${formatCurrency(comp.price || 0)}</p>`;
      
      if (comp.retailer) {
        html += `<p><strong>Retailer:</strong> ${escapeHtml(comp.retailer)}</p>`;
      }
      if (comp.condition) {
        html += `<p><strong>Condition:</strong> ${escapeHtml(comp.condition)}</p>`;
      }
      if (comp.link) {
        html += `<p><strong>Link:</strong> <a href="${escapeHtml(comp.link)}" target="_blank">View Item</a></p>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">No comparable items found.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Missing Trades (Missing Trade Detector)
 */
function renderMissingTrades(data) {
  let html = '<div class="missing-trades-output structured-output">';
  
  const tradeCount = data.missing_trades ? data.missing_trades.length : 0;
  html += `<div class="output-header">
    <h3>Missing Trades Detected: ${tradeCount}</h3>
  </div>`;
  
  if (data.total_value !== undefined) {
    html += `<div class="total-value">
      <strong>Total Missing Trade Value:</strong> ${formatCurrency(data.total_value)}
    </div>`;
  }
  
  if (data.missing_trades && data.missing_trades.length > 0) {
    data.missing_trades.forEach((trade, index) => {
      const severityClass = getSeverityClass(trade.severity);
      const severityIcon = getSeverityIcon(trade.severity);
      
      html += `<div class="trade-item structured-item ${severityClass}">
        <div class="item-header">
          <h4>${severityIcon} Trade #${index + 1}: ${escapeHtml(trade.trade || trade.name || 'Trade')}</h4>
          <span class="severity-badge ${severityClass}">${trade.severity || 'MEDIUM'}</span>
        </div>
        <div class="item-details">`;
      
      if (trade.reason) {
        html += `<p><strong>Reason:</strong> ${escapeHtml(trade.reason)}</p>`;
      }
      if (trade.cost !== undefined || trade.estimated_cost !== undefined) {
        html += `<p><strong>Estimated Cost:</strong> ${formatCurrency(trade.cost || trade.estimated_cost || 0)}</p>`;
      }
      if (trade.justification) {
        html += `<p><strong>Justification:</strong> ${escapeHtml(trade.justification)}</p>`;
      }
      if (trade.recommendation) {
        html += `<p><strong>Recommendation:</strong> ${escapeHtml(trade.recommendation)}</p>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">✅ All required trades included.</p>';
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    html += `<div class="recommendations-section">
      <h4>Recommendations</h4>
      <ul class="recommendations-list">`;
    data.recommendations.forEach(rec => {
      html += `<li>✓ ${escapeHtml(rec)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Response Agent (AI Response Agent tool)
 */
function renderResponseAgent(data) {
  let html = '<div class="response-agent-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Generated Response</h3>
  </div>`;
  
  if (data.subject) {
    html += `<div class="output-section">
      <h4>Subject</h4>
      <p class="subject-line"><strong>${escapeHtml(data.subject)}</strong></p>
    </div>`;
  }
  
  if (data.body) {
    html += `<div class="output-section">
      <h4>Letter Body</h4>
      <div class="letter-body" style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.body)}</div>
    </div>`;
  }
  
  if (data.next_steps && data.next_steps.length > 0) {
    html += `<div class="recommendations-section">
      <h4>Next Steps</h4>
      <ul class="recommendations-list">`;
    data.next_steps.forEach(step => {
      html += `<li>✓ ${escapeHtml(step)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Damage Assessment (Claim Damage Assessment tool)
 */
function renderDamageAssessment(data) {
  let html = '<div class="damage-assessment-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Damage Assessment Results</h3>
  </div>`;
  
  if (data.total_estimated_damage !== undefined) {
    html += `<div class="total-value">
      <strong>Total Estimated Damage:</strong> ${formatCurrency(data.total_estimated_damage)}
    </div>`;
  }
  
  if (data.assessment && data.assessment.length > 0) {
    html += `<div class="assessment-table">
      <table class="structured-table">
        <thead>
          <tr>
            <th>Area/Room</th>
            <th>Damage Type</th>
            <th>Severity</th>
            <th>Estimated Cost</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.assessment.forEach(item => {
      const severityClass = getSeverityClass(item.severity);
      const severityIcon = getSeverityIcon(item.severity);
      
      html += `<tr class="${severityClass}">
        <td><strong>${escapeHtml(item.area || 'Area')}</strong></td>
        <td>${escapeHtml(item.damage_type || 'Damage')}</td>
        <td class="severity-cell">${severityIcon} ${item.severity || 'MEDIUM'}</td>
        <td>${formatCurrency(item.estimated_cost || 0)}</td>
        <td>${escapeHtml(item.documentation_notes || '')}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  } else {
    html += '<p class="no-items">No damage assessment data available.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Coverage Map (Coverage Mapping Visualizer tool)
 */
function renderCoverageMap(data) {
  let html = '<div class="coverage-map-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Coverage Mapping Results</h3>
  </div>`;
  
  if (data.coverage_percentage !== undefined) {
    const scoreClass = data.coverage_percentage >= 80 ? 'score-high' : 
                       data.coverage_percentage >= 60 ? 'score-medium' : 'score-low';
    html += `<div class="completeness-score ${scoreClass}">
      <strong>Coverage Percentage:</strong> ${data.coverage_percentage}%
    </div>`;
  }
  
  if (data.coverage_map && data.coverage_map.length > 0) {
    html += `<div class="coverage-table">
      <table class="structured-table">
        <thead>
          <tr>
            <th>Claim Item</th>
            <th>Coverage Section</th>
            <th>Covered</th>
            <th>Limit</th>
            <th>Deductible</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.coverage_map.forEach(item => {
      const coveredIcon = item.covered ? '✅' : '❌';
      const rowClass = item.covered ? '' : 'severity-high';
      
      html += `<tr class="${rowClass}">
        <td><strong>${escapeHtml(item.claim_item || 'Item')}</strong></td>
        <td>${escapeHtml(item.coverage_section || 'N/A')}</td>
        <td class="severity-cell">${coveredIcon} ${item.covered ? 'Yes' : 'No'}</td>
        <td>${formatCurrency(item.limit || 0)}</td>
        <td>${formatCurrency(item.deductible || 0)}</td>
        <td>${escapeHtml(item.notes || '')}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  } else {
    html += '<p class="no-items">No coverage mapping data available.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Damage Documentation (Damage Documentation Tool)
 */
function renderDamageDocumentation(data) {
  let html = '<div class="damage-documentation-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Damage Documentation Checklist</h3>
  </div>`;
  
  if (data.documentation && data.documentation.completeness_score !== undefined) {
    const scoreClass = data.documentation.completeness_score >= 80 ? 'score-high' : 
                       data.documentation.completeness_score >= 60 ? 'score-medium' : 'score-low';
    html += `<div class="completeness-score ${scoreClass}">
      <strong>Documentation Completeness:</strong> ${data.documentation.completeness_score}%
    </div>`;
  }
  
  if (data.documentation) {
    const doc = data.documentation;
    
    if (doc.incident_summary) {
      html += `<div class="output-section">
        <h4>Incident Summary</h4>
        <p>${escapeHtml(doc.incident_summary)}</p>
      </div>`;
    }
    
    if (doc.affected_areas && doc.affected_areas.length > 0) {
      html += `<div class="output-section">
        <h4>Affected Areas</h4>
        <ul class="recommendations-list">`;
      doc.affected_areas.forEach(area => {
        html += `<li>📍 ${escapeHtml(area)}</li>`;
      });
      html += `</ul></div>`;
    }
    
    if (doc.required_photos && doc.required_photos.length > 0) {
      html += `<div class="output-section">
        <h4>Required Photos</h4>
        <ul class="recommendations-list">`;
      doc.required_photos.forEach(photo => {
        html += `<li>📷 ${escapeHtml(photo)}</li>`;
      });
      html += `</ul></div>`;
    }
    
    if (doc.required_documents && doc.required_documents.length > 0) {
      html += `<div class="output-section">
        <h4>Required Documents</h4>
        <ul class="recommendations-list">`;
      doc.required_documents.forEach(doc => {
        html += `<li>📄 ${escapeHtml(doc)}</li>`;
      });
      html += `</ul></div>`;
    }
  }
  
  if (data.missing_items && data.missing_items.length > 0) {
    html += `<div class="priority-section">
      <h4>🔴 Missing Items</h4>
      <ul class="priority-list">`;
    data.missing_items.forEach(item => {
      html += `<li class="priority-item">❌ ${escapeHtml(item)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    html += `<div class="recommendations-section">
      <h4>Recommendations</h4>
      <ul class="recommendations-list">`;
    data.recommendations.forEach(rec => {
      html += `<li>✓ ${escapeHtml(rec)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Damage Labels (Damage Labeling Tool)
 */
function renderDamageLabels(data) {
  let html = '<div class="damage-labels-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Generated Damage Labels</h3>
  </div>`;
  
  if (data.labels && data.labels.length > 0) {
    data.labels.forEach((label, index) => {
      const severityClass = getSeverityClass(label.severity);
      const severityIcon = getSeverityIcon(label.severity);
      
      html += `<div class="label-item structured-item ${severityClass}">
        <div class="item-header">
          <h4>${severityIcon} Label #${index + 1}: ${escapeHtml(label.label || 'Damage Label')}</h4>
          <span class="severity-badge ${severityClass}">${label.severity || 'MEDIUM'}</span>
        </div>
        <div class="item-details">`;
      
      if (label.documentation_priority) {
        html += `<p><strong>Documentation Priority:</strong> ${escapeHtml(label.documentation_priority)}</p>`;
      }
      if (label.suggested_description) {
        html += `<p><strong>Suggested Description:</strong> ${escapeHtml(label.suggested_description)}</p>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">No labels generated.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Expert Opinion (Expert Opinion tool)
 */
function renderExpertOpinion(data) {
  let html = '<div class="expert-opinion-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Expert Opinion</h3>
  </div>`;
  
  if (data.confidence_level) {
    const confidenceClass = data.confidence_level === 'HIGH' ? 'score-high' : 
                           data.confidence_level === 'MEDIUM' ? 'score-medium' : 'score-low';
    html += `<div class="completeness-score ${confidenceClass}">
      <strong>Confidence Level:</strong> ${data.confidence_level}
    </div>`;
  }
  
  if (data.opinion) {
    html += `<div class="output-section">
      <h4>Expert Analysis</h4>
      <p>${escapeHtml(data.opinion)}</p>
    </div>`;
  }
  
  if (data.precedents && data.precedents.length > 0) {
    html += `<div class="output-section">
      <h4>Relevant Precedents</h4>
      <ul class="recommendations-list">`;
    data.precedents.forEach(precedent => {
      html += `<li>📚 ${escapeHtml(precedent)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    html += `<div class="recommendations-section">
      <h4>Recommendations</h4>
      <ul class="recommendations-list">`;
    data.recommendations.forEach(rec => {
      html += `<li>✓ ${escapeHtml(rec)}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Mitigation Documentation (Mitigation Documentation Tool)
 */
function renderMitigationDocumentation(data) {
  let html = '<div class="mitigation-documentation-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Mitigation Documentation</h3>
  </div>`;
  
  if (data.total_mitigation_cost !== undefined) {
    html += `<div class="total-cost">
      <strong>Total Mitigation Cost:</strong> ${formatCurrency(data.total_mitigation_cost)}
    </div>`;
  }
  
  if (data.documentation_completeness !== undefined) {
    const scoreClass = data.documentation_completeness >= 80 ? 'score-high' : 
                       data.documentation_completeness >= 60 ? 'score-medium' : 'score-low';
    html += `<div class="completeness-score ${scoreClass}">
      <strong>Documentation Completeness:</strong> ${data.documentation_completeness}%
    </div>`;
  }
  
  if (data.mitigation_items && data.mitigation_items.length > 0) {
    html += `<div class="mitigation-table">
      <table class="structured-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Date</th>
            <th>Cost</th>
            <th>Vendor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.mitigation_items.forEach(item => {
      const statusIcon = item.documentation_status === 'Complete' ? '✅' : '⏳';
      
      html += `<tr>
        <td><strong>${escapeHtml(item.action || 'Action')}</strong></td>
        <td>${escapeHtml(item.date || 'N/A')}</td>
        <td>${formatCurrency(item.cost || 0)}</td>
        <td>${escapeHtml(item.vendor || 'N/A')}</td>
        <td>${statusIcon} ${escapeHtml(item.documentation_status || 'Pending')}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  } else {
    html += '<p class="no-items">No mitigation actions documented.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <h4>Summary</h4>
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Render Room-by-Room Guide (Room-by-Room Prompt Tool)
 */
function renderRoomByRoomGuide(data) {
  let html = '<div class="room-by-room-guide-output structured-output">';
  
  html += `<div class="output-header">
    <h3>Room Documentation Guide</h3>
  </div>`;
  
  if (data.checklist_items !== undefined) {
    html += `<div class="completeness-score">
      <strong>Total Checklist Items:</strong> ${data.checklist_items}
    </div>`;
  }
  
  if (data.prompts && data.prompts.length > 0) {
    data.prompts.forEach((prompt, index) => {
      html += `<div class="prompt-item structured-item">
        <div class="item-header">
          <h4>📦 ${escapeHtml(prompt.category || `Category ${index + 1}`)}</h4>
        </div>
        <div class="item-details">`;
      
      if (prompt.items_to_document && prompt.items_to_document.length > 0) {
        html += `<p><strong>Items to Document:</strong></p>
          <ul class="recommendations-list">`;
        prompt.items_to_document.forEach(item => {
          html += `<li>✓ ${escapeHtml(item)}</li>`;
        });
        html += `</ul>`;
      }
      
      if (prompt.photos_needed && prompt.photos_needed.length > 0) {
        html += `<p><strong>Photos Needed:</strong></p>
          <ul class="recommendations-list">`;
        prompt.photos_needed.forEach(photo => {
          html += `<li>📷 ${escapeHtml(photo)}</li>`;
        });
        html += `</ul>`;
      }
      
      if (prompt.documentation_tips && prompt.documentation_tips.length > 0) {
        html += `<p><strong>Documentation Tips:</strong></p>
          <ul class="recommendations-list">`;
        prompt.documentation_tips.forEach(tip => {
          html += `<li>💡 ${escapeHtml(tip)}</li>`;
        });
        html += `</ul>`;
      }
      
      html += `</div></div>`;
    });
  } else {
    html += '<p class="no-items">No documentation guide available.</p>';
  }
  
  if (data.summary) {
    html += `<div class="output-summary">
      <p>${escapeHtml(data.summary)}</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * UTILITY FUNCTIONS
 */

function getSeverityClass(severity) {
  if (!severity) return 'severity-medium';
  const sev = severity.toUpperCase();
  if (sev === 'HIGH' || sev === 'CRITICAL') return 'severity-high';
  if (sev === 'MEDIUM' || sev === 'MODERATE') return 'severity-medium';
  if (sev === 'LOW' || sev === 'MINOR') return 'severity-low';
  return 'severity-medium';
}

function getSeverityIcon(severity) {
  if (!severity) return '🟡';
  const sev = severity.toUpperCase();
  if (sev === 'HIGH' || sev === 'CRITICAL') return '🔴';
  if (sev === 'MEDIUM' || sev === 'MODERATE') return '🟡';
  if (sev === 'LOW' || sev === 'MINOR') return '🟢';
  return '🟡';
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '$0';
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

