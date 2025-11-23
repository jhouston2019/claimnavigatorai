/**
 * Policy Review Controller (Claim Analysis Tools)
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { getIntakeData } from '../autofill.js';

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
    console.error('Policy Review initialization error:', error);
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
    const policyText = document.getElementById('policyText').value;
    const policyType = document.getElementById('policyType').value;
    const jurisdiction = document.getElementById('jurisdiction').value;
    const deductible = document.getElementById('deductible').value;

    if (!policyText.trim()) {
      throw new Error('Please provide policy text');
    }

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-policy-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        policy_text: policyText,
        policy_type: policyType,
        jurisdiction: jurisdiction,
        deductible: deductible
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const result = await response.json();

    if (resultDiv && result.data) {
      resultDiv.innerHTML = result.data.html || result.data.summary || 'Analysis complete';
    }

    await saveToDatabase(result.data, policyType);

  } catch (error) {
    console.error('Analyze error:', error);
    if (resultDiv) {
      resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  }
}

async function saveToDatabase(data, policyType) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('policy_summaries').insert({
      user_id: user.id,
      raw_policy_text: document.getElementById('policyText').value,
      summary_json: data,
      metadata: { policy_type: policyType, analyzed_at: new Date().toISOString() }
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Policy Review.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}


