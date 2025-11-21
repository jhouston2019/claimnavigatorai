/**
 * Evidence Organizer Controller
 * Activates the Evidence Organizer tool
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { uploadToStorage, uploadMultipleFiles } from '../storage.js';
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
    await loadExistingEvidence();
  } catch (error) {
    console.error('Evidence Organizer initialization error:', error);
  }
});

async function initStorageEngine() {
  // Storage engine ready via storage.js
}

async function attachEventListeners() {
  // Wire file upload
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      await handleFileUpload(e.target.files);
    });
  }

  // Wire AI categorize button
  const categorizeBtn = document.getElementById('categorizeBtn');
  if (categorizeBtn) {
    const originalHandler = categorizeBtn.onclick;
    categorizeBtn.addEventListener('click', async () => {
      await handleCategorizeAll();
    });
  }

  // Wire evidence check button
  const checkBtn = document.getElementById('checkEvidenceBtn');
  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      await handleCheckEvidence();
    });
  }

  // Wire generate report button
  const reportBtn = document.getElementById('generateReportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', async () => {
      await handleGenerateReport();
    });
  }
}

async function handleFileUpload(files) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    for (const file of Array.from(files)) {
      // Upload to storage
      const uploadResult = await uploadToStorage(file, 'evidence');
      
      // Save to evidence_items table
      await client.from('evidence_items').insert({
        user_id: user.id,
        category: 'other', // Will be updated by AI categorization
        file_url: uploadResult.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        notes: ''
      });
    }

    // Reload evidence
    await loadExistingEvidence();

  } catch (error) {
    console.error('File upload error:', error);
    alert(`Error uploading file: ${error.message}`);
  }
}

async function handleCategorizeAll() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    // Get all evidence items
    const { data: evidence } = await client
      .from('evidence_items')
      .select('*')
      .eq('user_id', user.id);

    if (!evidence || evidence.length === 0) {
      alert('No evidence items to categorize');
      return;
    }

    const button = document.getElementById('categorizeBtn');
    if (button) {
      button.disabled = true;
      button.textContent = 'Categorizing...';
    }

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-evidence-auto-tagger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        evidence_items: evidence.map(item => ({
          file_name: item.file_name,
          file_url: item.file_url,
          current_category: item.category
        }))
      })
    });

    if (!response.ok) {
      throw new Error('Categorization failed');
    }

    const result = await response.json();

    // Update categories
    if (result.data && result.data.categorized_items) {
      for (const item of result.data.categorized_items) {
        await client
          .from('evidence_items')
          .update({ category: item.category })
          .eq('file_name', item.file_name)
          .eq('user_id', user.id);
      }
    }

    await loadExistingEvidence();
    alert('Categorization complete!');

  } catch (error) {
    console.error('Categorize error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    const button = document.getElementById('categorizeBtn');
    if (button) {
      button.disabled = false;
      button.textContent = 'AI Categorize All';
    }
  }
}

async function handleCheckEvidence() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data: evidence } = await client
      .from('evidence_items')
      .select('*')
      .eq('user_id', user.id);

    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-evidence-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        evidence_items: evidence || []
      })
    });

    if (!response.ok) {
      throw new Error('Evidence check failed');
    }

    const result = await response.json();
    
    // Display results
    const aiResults = document.getElementById('aiResults');
    if (aiResults && result.data) {
      aiResults.style.display = 'block';
      aiResults.innerHTML = `
        <h3>Evidence Completeness Check</h3>
        <p>${result.data.summary || 'Check complete'}</p>
        ${result.data.missing_items ? `<p><strong>Missing:</strong> ${result.data.missing_items.join(', ')}</p>` : ''}
      `;
    }

  } catch (error) {
    console.error('Check evidence error:', error);
    alert(`Error: ${error.message}`);
  }
}

async function handleGenerateReport() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data: evidence } = await client
      .from('evidence_items')
      .select('*')
      .eq('user_id', user.id);

    // Generate report document
    const reportContent = generateReportContent(evidence || []);

    // Save to documents
    await client.from('documents').insert({
      user_id: user.id,
      type: 'evidence_report',
      title: 'Evidence Summary Report',
      content: reportContent,
      metadata: { evidence_count: evidence?.length || 0, generated_at: new Date().toISOString() }
    });

    alert('Report generated and saved to dashboard!');

  } catch (error) {
    console.error('Generate report error:', error);
    alert(`Error: ${error.message}`);
  }
}

function generateReportContent(evidence) {
  let content = 'EVIDENCE SUMMARY REPORT\n\n';
  content += `Total Items: ${evidence.length}\n\n`;
  
  const byCategory = {};
  evidence.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  for (const [category, items] of Object.entries(byCategory)) {
    content += `${category.toUpperCase()} (${items.length}):\n`;
    items.forEach(item => {
      content += `  - ${item.file_name} (${formatFileSize(item.file_size)})\n`;
    });
    content += '\n';
  }

  return content;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function loadExistingEvidence() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data: evidence } = await client
      .from('evidence_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Update statistics
    updateStatistics(evidence || []);

    // Update file grid (existing function handles this)
    if (window.updateFileGrid && evidence) {
      // Let existing function handle display
    }

  } catch (error) {
    console.error('Load evidence error:', error);
  }
}

function updateStatistics(evidence) {
  const stats = {
    total: evidence.length,
    photos: evidence.filter(e => e.category === 'photo').length,
    documents: evidence.filter(e => e.category === 'document' || e.category === 'estimate' || e.category === 'invoice').length,
    receipts: evidence.filter(e => e.category === 'receipt').length,
    other: evidence.filter(e => !['photo', 'document', 'estimate', 'invoice', 'receipt'].includes(e.category)).length
  };

  const totalFiles = document.getElementById('totalFiles');
  const totalPhotos = document.getElementById('totalPhotos');
  const totalDocs = document.getElementById('totalDocs');
  const totalReceipts = document.getElementById('totalReceipts');
  const totalOther = document.getElementById('totalOther');

  if (totalFiles) totalFiles.textContent = stats.total;
  if (totalPhotos) totalPhotos.textContent = stats.photos;
  if (totalDocs) totalDocs.textContent = stats.documents;
  if (totalReceipts) totalReceipts.textContent = stats.receipts;
  if (totalOther) totalOther.textContent = stats.other;
}

function showPaymentRequired() {
  const main = document.querySelector('main') || document.body;
  if (main) {
    const message = document.createElement('div');
    message.className = 'error';
    message.style.cssText = 'text-align: center; padding: 2rem; margin: 2rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem;';
    message.innerHTML = `
      <h3 style="margin-bottom: 1rem;">Payment Required</h3>
      <p style="margin-bottom: 1rem;">Please purchase access to use Evidence Organizer.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}

