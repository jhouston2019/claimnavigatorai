/**
 * Settlement Analysis & Negotiation Controller
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
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
    console.error('Settlement Analysis initialization error:', error);
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
    const mode = urlParams.get('mode') || 'valuation';

    const offer = parseFloat(document.getElementById('offer')?.value) || 0;
    const valuation = parseFloat(document.getElementById('valuation')?.value) || 0;
    const disputed = document.getElementById('disputed')?.value || '';
    const jurisdiction = document.getElementById('jurisdiction')?.value || '';
    const days = document.getElementById('days')?.value || '';
    const policyLimits = document.getElementById('policyLimits')?.value || '';
    const context = document.getElementById('context')?.value || '';

    if (offer === 0 || valuation === 0) {
      throw new Error('Please provide both offer amount and your valuation');
    }

    const gap = valuation - offer;
    const gapPercent = (gap / valuation) * 100;

    const token = await getAuthToken();
    
    // Select appropriate analysis focus based on mode
    let analysisFocus = 'negotiation';
    switch (mode) {
      case 'valuation':
        analysisFocus = 'contents_valuation';
        break;
      case 'supplement':
        analysisFocus = 'supplement_strategy';
        break;
      case 'depreciation':
        analysisFocus = 'depreciation_analysis';
        break;
      case 'comparables':
        analysisFocus = 'comparable_items';
        break;
      default:
        analysisFocus = 'negotiation';
    }

    const response = await fetch('/.netlify/functions/ai-negotiation-advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        offer_amount: offer,
        valuation: valuation,
        gap: gap,
        gap_percent: gapPercent,
        disputed_categories: disputed,
        jurisdiction: jurisdiction,
        days_since_claim: days,
        policy_limits: policyLimits,
        context: context,
        analysis_mode: mode,
        analysis_focus: analysisFocus
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const result = await response.json();

    if (resultDiv && result.data) {
      resultDiv.innerHTML = result.data.html || result.data.analysis || 'Analysis complete';
    }

    await saveToDatabase(result.data, offer, valuation);

    // Save to step guide and return
    const toolParams = getToolParams();
    if (toolParams.step && toolParams.toolId) {
      saveAndReturn({
        step: toolParams.step,
        toolId: toolParams.toolId,
        reportName: getReportName(toolParams.toolId),
        summary: result.data.analysis || result.data.summary,
        sections: result.data
      });
    }

  } catch (error) {
    console.error('Analyze error:', error);
    if (resultDiv) {
      resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  }
}

async function saveToDatabase(data, offer, valuation) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'settlement_analysis',
      title: 'Settlement Analysis',
      content: JSON.stringify(data),
      metadata: { offer, valuation, created_at: new Date().toISOString() }
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Settlement Analysis.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



