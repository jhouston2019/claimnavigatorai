/**
 * Coverage Decoder Controller
 * Activates the Coverage Decoder tool
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
    console.error('Coverage Decoder initialization error:', error);
  }
});

async function initStorageEngine() {}

async function attachEventListeners() {
  // Wire existing runAnalysis function
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
    const response = await fetch('/.netlify/functions/ai-coverage-decoder', {
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

    // Display results
    if (resultDiv && result.data) {
      resultDiv.innerHTML = formatResults(result.data);
    }

    // Save to database
    await saveToDatabase(result.data, policyType, jurisdiction, deductible);

    // Show save button
    showSaveButton(result.data);

  } catch (error) {
    console.error('Analyze error:', error);
    if (resultDiv) {
      resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  }
}

function formatResults(data) {
  let html = '<div class="coverage-results">';
  
  if (data.summary) {
    html += `<h3>Coverage Summary</h3><p>${escapeHtml(data.summary)}</p>`;
  }
  
  if (data.limits) {
    html += `<h3>Coverage Limits</h3><ul>`;
    for (const [key, value] of Object.entries(data.limits)) {
      html += `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`;
    }
    html += `</ul>`;
  }
  
  if (data.deductibles) {
    html += `<h3>Deductibles</h3><p>${escapeHtml(data.deductibles)}</p>`;
  }
  
  if (data.exclusions && data.exclusions.length > 0) {
    html += `<h3>Exclusions</h3><ul>`;
    data.exclusions.forEach(exclusion => {
      html += `<li>${escapeHtml(exclusion)}</li>`;
    });
    html += `</ul>`;
  }
  
  if (data.deadlines && data.deadlines.length > 0) {
    html += `<h3>Important Deadlines</h3><ul>`;
    data.deadlines.forEach(deadline => {
      html += `<li>${escapeHtml(deadline)}</li>`;
    });
    html += `</ul>`;
  }
  
  html += '</div>';
  return html;
}

async function saveToDatabase(data, policyType, jurisdiction, deductible) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from('policy_summaries').insert({
      user_id: user.id,
      raw_policy_text: document.getElementById('policyText').value,
      summary_json: data,
      metadata: {
        policy_type: policyType,
        jurisdiction: jurisdiction,
        deductible: deductible,
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Save to database error:', error);
  }
}

function showSaveButton(data) {
  let saveBtn = document.getElementById('saveToDashboardBtn');
  if (!saveBtn && data) {
    saveBtn = document.createElement('button');
    saveBtn.id = 'saveToDashboardBtn';
    saveBtn.className = 'button primary';
    saveBtn.textContent = '💾 Saved to Dashboard';
    saveBtn.style.marginTop = '1rem';
    saveBtn.disabled = true;
    const resultDiv = document.getElementById('result-policy');
    if (resultDiv) resultDiv.appendChild(saveBtn);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showPaymentRequired() {
  const main = document.querySelector('main') || document.body;
  if (main) {
    const message = document.createElement('div');
    message.className = 'error';
    message.style.cssText = 'text-align: center; padding: 2rem; margin: 2rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem;';
    message.innerHTML = `
      <h3 style="margin-bottom: 1rem;">Payment Required</h3>
      <p style="margin-bottom: 1rem;">Please purchase access to use Coverage Decoder.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



