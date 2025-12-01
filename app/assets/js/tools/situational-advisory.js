/**
 * Situational Advisory Controller
 * Activates the Situational Advisory tool
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
    console.error('Situational Advisory initialization error:', error);
  }
});

async function initStorageEngine() {}

async function attachEventListeners() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    const originalHandler = analyzeBtn.onclick;
    analyzeBtn.addEventListener('click', async () => {
      await handleAnalyze();
    });
  }
}

async function handleAnalyze() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analyzeText = document.getElementById('analyzeText');
  const analyzeSpinner = document.getElementById('analyzeSpinner');
  const situationInput = document.getElementById('situationInput');
  const responseContainer = document.getElementById('aiResponse');
  const responseContent = document.getElementById('aiResponseContent');

  try {
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (analyzeText) analyzeText.classList.add('hidden');
    if (analyzeSpinner) analyzeSpinner.classList.remove('hidden');

    const situation = situationInput ? situationInput.value.trim() : '';
    if (!situation) {
      throw new Error('Please describe your situation');
    }

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-situational-advisory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        situation_description: situation,
        claim_type: 'general'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const result = await response.json();

    // Display results
    if (responseContainer && responseContent && result.data) {
      responseContainer.classList.remove('hidden');
      responseContent.innerHTML = `
        <h4>Advisory Response</h4>
        <p>${escapeHtml(result.data.response || result.data.advice || 'Analysis complete')}</p>
        ${result.data.recommendations ? `
          <h4>Recommendations</h4>
          <ul>
            ${result.data.recommendations.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
          </ul>
        ` : ''}
        ${result.data.next_steps ? `
          <h4>Next Steps</h4>
          <ul>
            ${result.data.next_steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
          </ul>
        ` : ''}
      `;
    }

    // Save to database
    await saveToDatabase(result.data, situation);

  } catch (error) {
    console.error('Analyze error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (analyzeText) analyzeText.classList.remove('hidden');
    if (analyzeSpinner) analyzeSpinner.classList.add('hidden');
  }
}

async function saveToDatabase(data, situation) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'advisory',
      title: 'Situational Advisory',
      content: data.response || data.advice || '',
      metadata: {
        situation: situation,
        recommendations: data.recommendations,
        next_steps: data.next_steps,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Save error:', error);
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Situational Advisory.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



