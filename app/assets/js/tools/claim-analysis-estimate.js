/**
 * Estimate Comparison Controller
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { uploadToStorage, extractTextFromFile } from '../storage.js';
import { getIntakeData } from '../autofill.js';
import { saveAndReturn, getToolParams, getReportName } from '../tool-output-bridge.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await requireAuth();
    const payment = await checkPaymentStatus();
    if (!payment.hasAccess) {
      showPaymentRequired();
      return;
    }
    await getIntakeData();
    await initStorageEngine();
    await attachEventListeners();
  } catch (error) {
    console.error('Estimate Comparison initialization error:', error);
  }
});

async function initStorageEngine() {}

async function attachEventListeners() {
  const originalRunAnalysis = window.runAnalysis;
  if (originalRunAnalysis) {
    window.runAnalysis = async function(module) {
      await handleAnalyze(module);
    };
  }
}

async function handleAnalyze(module) {
  const resultDiv = document.getElementById('result-' + module);
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p><em>Analyzing, please wait...</em></p>';
  }

  try {
    // Get mode from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'comparison';

    const fileInput = document.getElementById('estimates');
    const files = fileInput?.files || [];
    
    if (files.length === 0) {
      throw new Error('Please upload at least one estimate file');
    }

    // Extract text from files
    const estimateTexts = [];
    for (const file of Array.from(files)) {
      try {
        const text = await extractTextFromFile(file);
        estimateTexts.push({ filename: file.name, text: text });
      } catch (error) {
        console.error(`Error extracting text from ${file.name}:`, error);
        estimateTexts.push({ filename: file.name, text: '' });
      }
    }

    const laborRate = document.getElementById('laborRate')?.value || '';
    const taxRate = document.getElementById('taxRate')?.value || '';
    const includeOverhead = document.getElementById('includeOverhead')?.checked || false;
    const notes = document.getElementById('notes')?.value || '';

    const token = await getAuthToken();
    
    // Select appropriate analysis focus based on mode
    let analysisFocus = 'comparison';
    switch (mode) {
      case 'quality':
        analysisFocus = 'quality_review';
        break;
      case 'comparison':
        analysisFocus = 'comparison';
        break;
      case 'discrepancies':
        analysisFocus = 'line_item_discrepancies';
        break;
      case 'pricing':
        analysisFocus = 'pricing_deviations';
        break;
      case 'omissions':
        analysisFocus = 'scope_omissions';
        break;
      default:
        analysisFocus = 'comparison';
    }

    const response = await fetch('/.netlify/functions/ai-estimate-comparison', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        estimates: estimateTexts,
        labor_rate: laborRate,
        tax_rate: taxRate,
        include_overhead: includeOverhead,
        analysis_mode: mode,
        analysis_focus: analysisFocus,
        notes: notes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Comparison failed');
    }

    const result = await response.json();

    if (resultDiv && result.data) {
      resultDiv.innerHTML = result.data.html || result.data.comparison || 'Comparison complete';
    }

    await saveToDatabase(result.data, estimateTexts);

    // Save to step guide and return
    const toolParams = getToolParams();
    if (toolParams.step && toolParams.toolId) {
      saveAndReturn({
        step: toolParams.step,
        toolId: toolParams.toolId,
        reportName: getReportName(toolParams.toolId),
        output: result.data
      });
    }

  } catch (error) {
    console.error('Analyze error:', error);
    if (resultDiv) {
      resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  }
}

async function saveToDatabase(data, estimates) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'estimate_comparison',
      title: 'Estimate Comparison',
      content: JSON.stringify(data),
      metadata: { estimate_count: estimates.length, created_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Save error:', error);
  }
}

function showPaymentRequired() {
  const main = document.querySelector('main') || document.body;
  if (main) {
    const message = document.createElement('div');
    message.className = 'error';
    message.style.cssText = 'text-align: center; padding: 2rem; margin: 2rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem;';
    message.innerHTML = `
      <h3 style="margin-bottom: 1rem;">Payment Required</h3>
      <p style="margin-bottom: 1rem;">Please purchase access to use Estimate Comparison.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



