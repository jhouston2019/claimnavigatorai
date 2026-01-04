/**
 * Evidence Organizer Controller
 * Activates the Evidence Organizer tool
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { uploadToStorage, uploadMultipleFiles } from '../storage.js';
import { getIntakeData } from '../autofill.js';
import { runViolationCheck, generateAlerts } from '../utils/compliance-engine-helper.js';
import { addTimelineEvent } from '../utils/timeline-autosync.js';
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
    if (window.CNLoading) {
      window.CNLoading.show(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);
    }
    
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const intakeData = await getIntakeData();

    for (const file of Array.from(files)) {
      // Upload to storage
      const uploadResult = await uploadToStorage(file, 'evidence');
      
      // Save to evidence_items table
      const { data: evidenceItem } = await client.from('evidence_items').insert({
        user_id: user.id,
        category: 'other', // Will be updated by AI categorization
        file_url: uploadResult.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        notes: ''
      }).select().single();
      
      // Run compliance violation check if we have state/carrier
      if (intakeData && intakeData.state && intakeData.carrier && evidenceItem) {
        try {
          const violationCheck = await runViolationCheck(
            intakeData.state,
            intakeData.carrier,
            {
              fileName: file.name,
              fileType: file.type,
              category: 'other',
              uploadedAt: new Date().toISOString()
            }
          );
          
          // Update evidence item with compliance labels
          if (violationCheck.labels && violationCheck.labels.length > 0) {
            await client.from('evidence_items').update({
              metadata: {
                complianceLabels: violationCheck.labels,
                complianceCritical: violationCheck.labels.includes('Compliance-Critical'),
                requiredByStatute: violationCheck.labels.includes('Required by Statute'),
                requiredByCarrier: violationCheck.labels.includes('Required by Carrier'),
                missingRequired: violationCheck.labels.includes('Missing Required Document')
              }
            }).eq('id', evidenceItem.id);
          }
        } catch (error) {
          console.warn('Compliance check failed for evidence:', error);
          // Don't block upload if compliance check fails
        }
      }
      
      // Increment evidence photo count and store evidence item
      if (evidenceItem) {
        let evidenceList = [];
        let currentCount = 0;
        
        // Try storage-v2 first
        if (window.CNStorage) {
          const evidenceData = window.CNStorage.getSection("evidence") || { list: [], count: 0 };
          evidenceList = evidenceData.list || [];
          currentCount = evidenceData.count || 0;
        } else {
          // Fallback to old localStorage
          const photoKey = "cn_evidence_photo_count";
          currentCount = parseInt(localStorage.getItem(photoKey) || "0", 10);
          evidenceList = JSON.parse(localStorage.getItem("cn_evidence_list") || "[]");
        }
        
        // Add new evidence item
        evidenceList.push({
          id: evidenceItem.id || Date.now(),
          url: uploadResult.url || evidenceItem.file_url,
          category: evidenceItem.category || 'other',
          timestamp: Date.now()
        });
        currentCount++;
        
        // Save to storage-v2
        if (window.CNStorage) {
          window.CNStorage.setSection("evidence", { list: evidenceList, count: currentCount });
        }
        
        // Also save to old keys for backward compatibility
        localStorage.setItem("cn_evidence_photo_count", String(currentCount));
        localStorage.setItem("cn_evidence_list", JSON.stringify(evidenceList));
        
        // Log timeline event using CNTimeline
        if (window.CNTimeline) {
          window.CNTimeline.log("evidence_upload", { 
            category: evidenceItem.category || 'other',
            fileName: file.name
          });
        }
        
        // Trigger real-time Claim Health recalculation
        if (window.CNHealthHooks) {
          window.CNHealthHooks.trigger();
        }
      }
    }

    // Reload evidence
    await loadExistingEvidence();
    
    // Add timeline event for evidence upload
    await addEvidenceTimelineEvent(Array.from(files));
    
    // Generate compliance alerts after upload
    await triggerComplianceAlerts();
}

/**
 * Add timeline event for evidence upload
 */
async function addEvidenceTimelineEvent(files) {
    try {
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        
        await addTimelineEvent({
            type: 'evidence_uploaded',
            date: new Date().toISOString().split('T')[0],
            source: 'evidence',
            title: `Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
            description: `Files: ${files.map(f => f.name).join(', ')}`,
            metadata: {
                fileCount: files.length,
                fileNames: files.map(f => f.name),
                fileTypes: files.map(f => f.type)
            },
            claimId: claimId
        });
    } catch (error) {
        console.warn('Failed to add evidence timeline event:', error);
    }

    if (window.CNToast) {
      window.CNToast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}.`);
    }
  } catch (error) {
    console.error('CNError (Evidence Upload):', error);
    if (window.CNModalError) {
      window.CNModalError.show("Upload Error", "Failed to upload evidence file. Please try again.", error.message);
    } else if (window.CNToast) {
      window.CNToast.error(`Error uploading file: ${error.message}`);
    } else {
      alert(`Error uploading file: ${error.message}`);
    }
  } finally {
    if (window.CNLoading) {
      window.CNLoading.hide();
    }
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

    // Save to step guide and return
    const toolParams = getToolParams();
    if (toolParams.step && toolParams.toolId) {
      saveAndReturn({
        step: toolParams.step,
        toolId: toolParams.toolId,
        reportName: getReportName(toolParams.toolId),
        summary: `Evidence report generated with ${evidence?.length || 0} items`,
        sections: { reportContent, evidence, evidenceCount: evidence?.length || 0 }
      });
    } else {
      alert('Report generated and saved to dashboard!');
    }

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

/**
 * Trigger compliance alerts after evidence changes
 */
async function triggerComplianceAlerts() {
  try {
    const intakeData = await getIntakeData();
    if (!intakeData?.state || !intakeData?.carrier) {
      return; // Skip if no state/carrier
    }

    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    // Get all evidence items
    const { data: evidence } = await client
      .from('evidence_items')
      .select('*')
      .eq('user_id', user.id);

    // Get timeline events (if available)
    const { data: timelineEvents } = await client
      .from('claim_timeline_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('due_day', { ascending: true });

    // Generate alerts
    await generateAlerts(
      {
        state: intakeData.state,
        carrier: intakeData.carrier_name || intakeData.carrier,
        claimType: intakeData.claim_type || 'Property',
        claimId: intakeData.claim_id || null
      },
      (timelineEvents || []).map(e => ({
        name: e.milestone_name,
        date: e.due_day ? new Date(Date.now() + e.due_day * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: e.milestone_description
      })),
      (evidence || []).map(e => ({
        category: e.category,
        fileName: e.file_name,
        fileType: e.mime_type
      })),
      '',
      []
    );
  } catch (error) {
    console.warn('Failed to trigger compliance alerts:', error);
  }
}


