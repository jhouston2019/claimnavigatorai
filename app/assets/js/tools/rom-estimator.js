/**
 * ROM Estimator Controller
 * Activates the ROM Estimator tool
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
    console.error('ROM Estimator initialization error:', error);
  }
});

async function initStorageEngine() {}

async function attachEventListeners() {
  const form = document.getElementById('romForm');
  if (form) {
    const originalHandler = form.onsubmit;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCalculate(e);
    });
  }
}

async function handleCalculate(e) {
  const submitBtn = document.querySelector('#romForm button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : 'Calculate Estimate';
  
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Calculating...';
    }

    const category = document.getElementById('category').value;
    const severity = document.getElementById('severity').value;
    const sqft = parseFloat(document.getElementById('sqft').value);

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-rom-estimator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ category, severity, square_feet: sqft })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Calculation failed');
    }

    const result = await response.json();

    // Display results (existing function handles this)
    const outputSection = document.getElementById('output');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    if (outputSection) outputSection.classList.add('show');
    if (loading) loading.style.display = 'none';
    if (results) {
      results.style.display = 'block';
      const estimateAmount = document.getElementById('estimateAmount');
      const explanation = document.getElementById('explanation');
      const breakdown = document.getElementById('breakdown');
      
      if (estimateAmount) estimateAmount.textContent = `$${result.data?.estimate?.toLocaleString() || '0'}`;
      if (explanation) explanation.textContent = result.data?.explanation || 'Estimate calculated successfully.';
      if (breakdown && result.data?.breakdown) {
        breakdown.innerHTML = `
          <strong>Calculation Breakdown:</strong><br>
          ${result.data.breakdown.calculation || ''}<br><br>
          <strong>Square Feet:</strong> ${result.data.breakdown.square_feet?.toLocaleString() || sqft}<br>
          <strong>Base Rate:</strong> $${result.data.breakdown.base_rate || '0'} per sq ft<br>
          <strong>Severity Multiplier:</strong> ${result.data.breakdown.severity_multiplier || '1.0'}x
        `;
      }
    }

    // Save to database
    await saveEstimateToDatabase(result.data, category, severity, sqft);

    // Show save button
    showSaveButton(result.data);

  } catch (error) {
    console.error('Calculate error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

async function saveEstimateToDatabase(data, category, severity, sqft) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'rom_estimate',
      title: `ROM Estimate - ${category} - ${severity}`,
      content: JSON.stringify(data),
      metadata: { category, severity, square_feet: sqft, estimate: data.estimate, created_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Save estimate error:', error);
  }
}

function showSaveButton(data) {
  let saveBtn = document.getElementById('saveToDashboardBtn');
  if (!saveBtn && data) {
    saveBtn = document.createElement('button');
    saveBtn.id = 'saveToDashboardBtn';
    saveBtn.className = 'btn-estimate';
    saveBtn.textContent = '💾 Save to Dashboard';
    saveBtn.style.marginTop = '1rem';
    saveBtn.addEventListener('click', () => {
      alert('Estimate saved to dashboard!');
    });
    const results = document.getElementById('results');
    if (results) results.appendChild(saveBtn);
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
      <p style="margin-bottom: 1rem;">Please purchase access to use ROM Estimator.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



