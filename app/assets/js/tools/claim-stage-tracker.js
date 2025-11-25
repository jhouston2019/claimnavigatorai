/**
 * Claim Stage Tracker Controller
 * Activates the Claim Stage Tracker tool
 */

import { requireAuth, checkPaymentStatus, getSupabaseClient } from '../auth.js';
import { getIntakeData } from '../autofill.js';
import { analyzeCompliance } from '../utils/compliance-engine-helper.js';

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
    console.error('Claim Stage Tracker initialization error:', error);
  }
});

async function initStorageEngine() {}

async function attachEventListeners() {
  // Wire existing updateStage function to save to database
  const originalUpdateStage = window.updateStage;
  if (originalUpdateStage) {
    window.updateStage = async function(stageName, status) {
      await saveStageToDatabase(stageName, status);
      if (originalUpdateStage) originalUpdateStage(stageName, status);
    };
  }

  const originalSaveNotes = window.saveNotes;
  if (originalSaveNotes) {
    window.saveNotes = async function(stageName, index) {
      const notesTextarea = document.getElementById(`notes-${index}`);
      if (notesTextarea) {
        await saveNotesToDatabase(stageName, notesTextarea.value);
      }
      if (originalSaveNotes) originalSaveNotes(stageName, index);
    };
  }
}

async function saveStageToDatabase(stageName, status) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    // Save to documents table with type 'stage_tracker'
    await client.from('documents').insert({
      user_id: user.id,
      type: 'stage_tracker',
      title: `Stage: ${stageName}`,
      content: status,
      metadata: { stage_name: stageName, status: status, updated_at: new Date().toISOString() }
    });
    
    // Run compliance check for this stage
    await runComplianceCheckForStage(stageName, status);
  } catch (error) {
    console.error('Save stage error:', error);
  }
}

/**
 * Run compliance check for a specific stage
 */
async function runComplianceCheckForStage(stageName, status) {
  try {
    const intakeData = await getIntakeData();
    if (!intakeData || !intakeData.state || !intakeData.carrier) {
      return; // Skip if no intake data
    }
    
    const complianceData = await analyzeCompliance({
      state: intakeData.state,
      carrier: intakeData.carrier,
      claimType: intakeData.claim_type || 'Property',
      events: [{
        name: `Stage Update: ${stageName}`,
        date: new Date().toISOString().split('T')[0],
        description: `Claim moved to stage: ${stageName} with status: ${status}`
      }]
    });
    
    // Display compliance notes in sidebar
    displayComplianceNotesForStage(stageName, complianceData);
  } catch (error) {
    console.error('Compliance check error for stage:', error);
    // Don't block stage update if compliance check fails
  }
}

/**
 * Display compliance notes for current stage
 */
function displayComplianceNotesForStage(stageName, complianceData) {
  // Find or create compliance notes panel
  let compliancePanel = document.getElementById('compliance-notes-panel');
  if (!compliancePanel) {
    compliancePanel = document.createElement('div');
    compliancePanel.id = 'compliance-notes-panel';
    compliancePanel.className = 'compliance-notes-panel';
    compliancePanel.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.2);';
    
    const main = document.querySelector('main') || document.body;
    const sidebar = main.querySelector('.sidebar') || main.querySelector('aside');
    if (sidebar) {
      sidebar.appendChild(compliancePanel);
    } else {
      // Create sidebar if it doesn't exist
      const newSidebar = document.createElement('aside');
      newSidebar.className = 'sidebar';
      newSidebar.style.cssText = 'width: 300px; float: right; margin-left: 2rem;';
      newSidebar.appendChild(compliancePanel);
      main.appendChild(newSidebar);
    }
  }
  
  // Build compliance notes HTML
  let html = `<h3 style="margin-top: 0; color: #ffffff !important;">Compliance Notes for ${stageName}</h3>`;
  
  if (complianceData.statutoryDeadlines) {
    html += `<div style="margin-bottom: 1rem;"><strong>Stage-Specific Deadlines:</strong><p style="font-size: 0.9rem; margin-top: 0.5rem;">${complianceData.statutoryDeadlines.substring(0, 300)}...</p></div>`;
  }
  
  if (complianceData.requiredDocuments) {
    html += `<div style="margin-bottom: 1rem;"><strong>Required Documents:</strong><p style="font-size: 0.9rem; margin-top: 0.5rem;">${complianceData.requiredDocuments.substring(0, 200)}...</p></div>`;
  }
  
  if (complianceData.violationsLikelihood && complianceData.violationsLikelihood.possibleViolations) {
    html += `<div style="margin-bottom: 1rem;"><strong>Potential Violations:</strong><p style="font-size: 0.9rem; margin-top: 0.5rem; color: #fbbf24 !important;">${complianceData.violationsLikelihood.possibleViolations.substring(0, 200)}...</p></div>`;
  }
  
  if (complianceData.recommendedActions && complianceData.recommendedActions.steps) {
    html += `<div style="margin-bottom: 1rem;"><strong>Escalation Triggers:</strong><p style="font-size: 0.9rem; margin-top: 0.5rem;">${complianceData.recommendedActions.steps.substring(0, 200)}...</p></div>`;
  }
  
  html += `<a href="/app/resource-center/compliance-engine.html" style="color: #dbeafe !important; text-decoration: underline;">View Full Compliance Report →</a>`;
  
  compliancePanel.innerHTML = html;
}

async function saveNotesToDatabase(stageName, notes) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client.from('documents').insert({
      user_id: user.id,
      type: 'stage_notes',
      title: `Notes: ${stageName}`,
      content: notes,
      metadata: { stage_name: stageName, created_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Save notes error:', error);
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Claim Stage Tracker.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}


