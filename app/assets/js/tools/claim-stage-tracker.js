/**
 * Claim Stage Tracker Controller
 * Activates the Claim Stage Tracker tool
 */

import { requireAuth, checkPaymentStatus, getSupabaseClient } from '../auth.js';
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
  } catch (error) {
    console.error('Save stage error:', error);
  }
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

