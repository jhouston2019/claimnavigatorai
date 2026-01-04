/**
 * AI Response Agent Controller
 * Wires the AI Response Agent tool to backend functions
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { autofillForm } from '../autofill.js';
import { uploadToStorage, extractTextFromFile } from '../storage.js';
import { saveAndReturn, getToolParams, getReportName } from '../tool-output-bridge.js';

// Initialize controller
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require authentication
    await requireAuth();
    
    // Check payment status
    const payment = await checkPaymentStatus();
    if (!payment.hasAccess) {
      showPaymentRequired();
      return;
    }

    // Autofill intake data
    await autofillForm({
      insured_name: 'insuredName',
      insurer_name: 'insurerName',
      claim_number: 'claimNumber',
      policy_number: 'policyNumber'
    });

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('AI Response Agent initialization error:', error);
  }
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const documentUpload = document.getElementById('documentUpload');
  const uploadArea = document.getElementById('uploadArea');
  const removeFile = document.getElementById('removeFile');

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyze);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportPDF);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }

  if (uploadArea && documentUpload) {
    uploadArea.addEventListener('click', () => documentUpload.click());
    documentUpload.addEventListener('change', handleFileUpload);
  }

  if (removeFile) {
    removeFile.addEventListener('click', handleRemoveFile);
  }
}

/**
 * Handle file upload
 */
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  
  if (fileInfo) fileInfo.classList.remove('hidden');
  if (fileName) fileName.textContent = file.name;

  // Extract text if PDF/DOCX
  if (file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
    try {
      const text = await extractTextFromFile(file);
      const insurerLetter = document.getElementById('insurerLetter');
      if (insurerLetter) {
        insurerLetter.value = text;
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      alert('Could not extract text from file. Please paste the content manually.');
    }
  }
}

/**
 * Handle remove file
 */
function handleRemoveFile() {
  const documentUpload = document.getElementById('documentUpload');
  const fileInfo = document.getElementById('fileInfo');
  
  if (documentUpload) documentUpload.value = '';
  if (fileInfo) fileInfo.classList.add('hidden');
}

/**
 * Handle analyze button click
 */
async function handleAnalyze() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analyzeText = document.getElementById('analyzeText');
  const analyzingText = document.getElementById('analyzingText');
  const aiOutput = document.getElementById('aiOutput');
  const placeholder = document.getElementById('placeholder');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const aiResponse = document.getElementById('aiResponse');

  try {
    // Disable button and show loading
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (analyzeText) analyzeText.classList.add('hidden');
    if (analyzingText) analyzingText.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (aiResponse) aiResponse.classList.add('hidden');

    // Get form data
    const responseMode = document.getElementById('responseMode')?.value || 'reply';
    const insurerLetter = document.getElementById('insurerLetter')?.value || '';
    const claimType = document.getElementById('claimType')?.value || 'general';
    const insurerName = document.getElementById('insurerName')?.value || '';

    if (!insurerLetter.trim()) {
      throw new Error('Please provide insurer correspondence text or upload a document');
    }

    // Get auth token
    const token = await getAuthToken();

    // Call AI function
    const response = await fetch('/.netlify/functions/ai-response-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        claim_type: claimType,
        insurer_name: insurerName,
        denial_letter_text: insurerLetter,
        tone: responseMode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI analysis failed');
    }

    const data = await response.json();

    // Display results
    displayResults(data);

    // Show save button
    showSaveButton(data);

  } catch (error) {
    console.error('Analyze error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    // Re-enable button
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeText = document.getElementById('analyzeText');
    const analyzingText = document.getElementById('analyzingText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (analyzeText) analyzeText.classList.remove('hidden');
    if (analyzingText) analyzingText.classList.add('hidden');
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
  }
}

/**
 * Display AI results
 */
function displayResults(data) {
  const aiResponse = document.getElementById('aiResponse');
  const placeholder = document.getElementById('placeholder');
  const loadingIndicator = document.getElementById('loadingIndicator');

  if (placeholder) placeholder.classList.add('hidden');
  if (loadingIndicator) loadingIndicator.classList.add('hidden');
  if (aiResponse) {
    aiResponse.classList.remove('hidden');
    
    // Build HTML
    let html = '';
    if (data.subject) {
      html += `<h3 class="text-xl font-bold mb-4">Subject: ${escapeHtml(data.subject)}</h3>`;
    }
    if (data.body) {
      html += `<div class="prose prose-invert max-w-none">${formatText(data.body)}</div>`;
    }
    if (data.next_steps && data.next_steps.length > 0) {
      html += `<div class="mt-6"><h4 class="font-bold mb-2">Recommended Next Steps:</h4><ul class="list-disc list-inside space-y-1">`;
      data.next_steps.forEach(step => {
        html += `<li>${escapeHtml(step)}</li>`;
      });
      html += `</ul></div>`;
    }

    aiResponse.innerHTML = html;
  }
}

/**
 * Show save button
 */
function showSaveButton(data) {
  // Check if save button exists, if not create it
  let saveBtn = document.getElementById('saveToDashboardBtn');
  if (!saveBtn) {
    saveBtn = document.createElement('button');
    saveBtn.id = 'saveToDashboardBtn';
    saveBtn.className = 'btn-primary mt-4';
    saveBtn.textContent = '💾 Save to Dashboard';
    saveBtn.addEventListener('click', () => handleSaveToDashboard(data));
    
    const aiResponse = document.getElementById('aiResponse');
    if (aiResponse) {
      aiResponse.appendChild(saveBtn);
    }
  }
}

/**
 * Handle save to dashboard
 */
async function handleSaveToDashboard(data) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const responseMode = document.getElementById('responseMode')?.value || 'reply';
    const insurerName = document.getElementById('insurerName')?.value || '';

    // Save to documents table
    const { error } = await client
      .from('documents')
      .insert({
        user_id: user.id,
        type: 'response_letter',
        title: `Response Letter - ${insurerName} - ${new Date().toLocaleDateString()}`,
        content: data.body || '',
        metadata: {
          subject: data.subject,
          tone: responseMode,
          next_steps: data.next_steps,
          insurer_name: insurerName
        }
      });

    if (error) throw error;

    // Save to step guide and return
    const toolParams = getToolParams();
    if (toolParams.step && toolParams.toolId) {
      saveAndReturn({
        step: toolParams.step,
        toolId: toolParams.toolId,
        reportName: getReportName(toolParams.toolId),
        summary: `Response letter generated for ${insurerName}`,
        sections: {
          subject: data.subject,
          body: data.body,
          nextSteps: data.next_steps,
          metadata: data
        }
      });
    } else {
      alert('Document saved to dashboard!');
    }
  } catch (error) {
    console.error('Save error:', error);
    alert(`Error saving: ${error.message}`);
  }
}

/**
 * Handle export PDF
 */
async function handleExportPDF() {
  try {
    const aiResponse = document.getElementById('aiResponse');
    if (!aiResponse || aiResponse.classList.contains('hidden')) {
      alert('Please generate a response first');
      return;
    }

    const token = await getAuthToken();
    const responseMode = document.getElementById('responseMode')?.value || 'reply';
    const insurerName = document.getElementById('insurerName')?.value || '';

    // Get content
    const subject = aiResponse.querySelector('h3')?.textContent || '';
    const body = aiResponse.querySelector('.prose')?.textContent || '';

    // Call PDF generation
    const pdfResponse = await fetch('/.netlify/functions/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        document_content: body,
        metadata: {
          title: `Response Letter - ${insurerName}`,
          subject: subject,
          type: 'response_letter'
        }
      })
    });

    if (!pdfResponse.ok) {
      throw new Error('PDF generation failed');
    }

    // Download PDF
    const blob = await pdfResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-letter-${Date.now()}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Export PDF error:', error);
    alert(`Error generating PDF: ${error.message}`);
  }
}

/**
 * Handle clear
 */
function handleClear() {
  const insurerLetter = document.getElementById('insurerLetter');
  const aiResponse = document.getElementById('aiResponse');
  const placeholder = document.getElementById('placeholder');
  const documentUpload = document.getElementById('documentUpload');
  const fileInfo = document.getElementById('fileInfo');

  if (insurerLetter) insurerLetter.value = '';
  if (aiResponse) {
    aiResponse.classList.add('hidden');
    aiResponse.innerHTML = '';
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (documentUpload) documentUpload.value = '';
  if (fileInfo) fileInfo.classList.add('hidden');
}

/**
 * Show payment required message
 */
function showPaymentRequired() {
  const aiOutput = document.getElementById('aiOutput');
  if (aiOutput) {
    aiOutput.innerHTML = `
      <div class="text-center py-8">
        <h3 class="text-xl font-bold mb-4">Payment Required</h3>
        <p class="mb-4">Please purchase access to use AI tools.</p>
        <a href="/app/pricing.html" class="btn-primary">Get Full Access</a>
      </div>
    `;
  }
}

/**
 * Helper functions
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatText(text) {
  // Convert line breaks to <br>
  return escapeHtml(text).replace(/\n/g, '<br>');
}



