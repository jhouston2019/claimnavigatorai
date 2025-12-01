/**
 * Expert Opinion Request Generator Controller
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { uploadToStorage } from '../storage.js';
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
    console.error('Expert Opinion initialization error:', error);
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
    resultDiv.innerHTML = '<p><em>Generating, please wait...</em></p>';
  }

  try {
    const description = document.getElementById('description')?.value || '';
    const expertise = document.getElementById('expertise')?.value || '';
    const urgency = document.getElementById('urgency')?.value || '';
    const deadline = document.getElementById('deadline')?.value || '';
    const requirements = document.getElementById('requirements')?.value || '';

    if (!description.trim()) {
      throw new Error('Please provide expert request description');
    }

    // Handle file uploads if any
    const fileInput = document.getElementById('documents');
    const files = fileInput?.files || [];
    const uploadedFiles = [];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadToStorage(file, 'documents');
        uploadedFiles.push({ filename: file.name, url: result.url });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-expert-opinion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        description: description,
        expertise: expertise,
        urgency: urgency,
        deadline: deadline,
        requirements: requirements,
        supporting_documents: uploadedFiles
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    const result = await response.json();

    if (resultDiv && result.data) {
      resultDiv.innerHTML = result.data.html || result.data.document || 'Document generated';
    }

    await saveToDatabase(result.data, description);

  } catch (error) {
    console.error('Analyze error:', error);
    if (resultDiv) {
      resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  }
}

async function saveToDatabase(data, description) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'expert_opinion_request',
      title: 'Expert Opinion Request',
      content: data.document || data.html || '',
      metadata: { description, created_at: new Date().toISOString() }
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Expert Opinion Generator.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



