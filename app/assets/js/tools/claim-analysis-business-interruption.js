/**
 * Business Interruption Calculator Controller
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
    console.error('Business Interruption initialization error:', error);
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
    resultDiv.innerHTML = '<p><em>Calculating, please wait...</em></p>';
  }

  try {
    const businessName = document.getElementById('businessName')?.value || '';
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const revenues = document.getElementById('revenues')?.value || '';
    const cogs = document.getElementById('cogs')?.value || '';
    const fixed = document.getElementById('fixed')?.value || '';
    const variable = document.getElementById('variable')?.value || '';
    const extra = document.getElementById('extra')?.value || '';
    const businessType = document.getElementById('businessType')?.value || '';

    if (!startDate || !endDate) {
      throw new Error('Please provide interruption start and end dates');
    }

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-business-interruption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        business_name: businessName,
        start_date: startDate,
        end_date: endDate,
        revenues: revenues,
        cogs_percent: cogs,
        fixed_costs_percent: fixed,
        variable_costs_percent: variable,
        extra_expenses: extra,
        business_type: businessType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Calculation failed');
    }

    const result = await response.json();

    if (resultDiv && result.data) {
      resultDiv.innerHTML = result.data.html || result.data.calculation || 'Calculation complete';
    }

    await saveToDatabase(result.data, businessName);

    // Save to step guide and return
    const toolParams = getToolParams();
    if (toolParams.step && toolParams.toolId) {
      saveAndReturn({
        step: toolParams.step,
        toolId: toolParams.toolId,
        reportName: getReportName(toolParams.toolId),
        summary: result.data.calculation || result.data.summary,
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

async function saveToDatabase(data, businessName) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'business_interruption',
      title: `Business Interruption - ${businessName}`,
      content: JSON.stringify(data),
      metadata: { business_name: businessName, created_at: new Date().toISOString() }
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Business Interruption Calculator.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



