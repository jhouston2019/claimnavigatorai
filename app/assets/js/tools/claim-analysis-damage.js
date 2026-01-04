/**
 * Damage Assessment Controller
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
    console.error('Damage Assessment initialization error:', error);
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
    const damageDesc = document.getElementById('damageDesc')?.value || '';
    const damageTypes = [];
    ['fire', 'water', 'wind', 'theft', 'vandalism', 'other'].forEach(type => {
      if (document.getElementById(`damage-${type}`)?.checked) {
        damageTypes.push(type);
      }
    });

    // Get damage items from table
    const damageItems = [];
    const rows = document.querySelectorAll('#damage-items tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const desc = cells[0].querySelector('input')?.value || '';
        const qty = parseFloat(cells[1].querySelector('input')?.value) || 0;
        const cost = parseFloat(cells[2].querySelector('input')?.value) || 0;
        if (desc) {
          damageItems.push({ description: desc, quantity: qty, unit_cost: cost, total: qty * cost });
        }
      }
    });

    if (!damageDesc.trim() && damageItems.length === 0) {
      throw new Error('Please provide damage description or items');
    }

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-damage-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        damage_description: damageDesc,
        damage_types: damageTypes,
        damage_items: damageItems
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const result = await response.json();

    if (resultDiv && result.data) {
      resultDiv.innerHTML = result.data.html || result.data.assessment || 'Analysis complete';
    }

    await saveToDatabase(result.data, damageDesc, damageItems);

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

async function saveToDatabase(data, description, items) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'damage_assessment',
      title: 'Damage Assessment',
      content: JSON.stringify(data),
      metadata: { description, items, created_at: new Date().toISOString() }
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Damage Assessment.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



