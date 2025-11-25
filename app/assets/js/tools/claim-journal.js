/**
 * Claim Journal Controller
 * Activates the Claim Journal tool
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { getIntakeData } from '../autofill.js';

// Initialize controller
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
    await loadExistingEntries();
  } catch (error) {
    console.error('Claim Journal initialization error:', error);
  }
});

async function initStorageEngine() {}

async function attachEventListeners() {
  const originalSubmitAddEntry = window.submitAddEntry;
  if (originalSubmitAddEntry) {
    window.submitAddEntry = async function(event) {
      await handleAddEntry(event);
    };
  }
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadExistingEntries();
      if (window.refresh) window.refresh();
    });
  }
}

async function handleAddEntry(event) {
  event.preventDefault();
  try {
    const title = document.getElementById('entry-title').value;
    const body = document.getElementById('entry-body').value;
    await saveEntryToDatabase({ title, body });
    if (window.closeModal) window.closeModal();
    await loadExistingEntries();
  } catch (error) {
    console.error('Add entry error:', error);
    alert(`Error: ${error.message}`);
  }
}

async function saveEntryToDatabase(entry) {
  const client = await getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  await client.from('documents').insert({
    user_id: user.id,
    type: 'journal_entry',
    title: entry.title,
    content: entry.body,
    metadata: { entry_type: 'journal', created_at: new Date().toISOString() }
  });
  
  // Add timeline event
  await addJournalTimelineEvent(entry);
}

/**
 * Add timeline event for journal entry
 */
async function addJournalTimelineEvent(entry) {
  try {
    const { addTimelineEvent } = await import('../utils/timeline-autosync.js');
    const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
    
    const truncatedDescription = entry.body.length > 100 
      ? entry.body.substring(0, 100) + '...' 
      : entry.body;
    
    await addTimelineEvent({
      type: 'journal_entry',
      date: new Date().toISOString().split('T')[0],
      source: 'journal',
      title: entry.title,
      description: truncatedDescription,
      metadata: {
        entryLength: entry.body.length
      },
      claimId: claimId
    });
  } catch (error) {
    console.warn('Failed to add journal timeline event:', error);
  }
}

async function loadExistingEntries() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    const { data: entries } = await client
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'journal_entry')
      .order('created_at', { ascending: false })
      .limit(50);
    const entriesList = document.getElementById('entries');
    if (entriesList) {
      if (!entries || entries.length === 0) {
        entriesList.innerHTML = '<li class="empty-state">No entries yet. Add your first entry!</li>';
        return;
      }
      entriesList.innerHTML = entries.map(entry => `
        <li class="journal-entry">
          <div class="journal-entry-header">
            <h4>${escapeHtml(entry.title)}</h4>
            <span class="journal-entry-date">${formatDate(entry.created_at)}</span>
          </div>
          <p>${escapeHtml(entry.content)}</p>
        </li>
      `).join('');
    }
  } catch (error) {
    console.error('Load entries error:', error);
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Claim Journal.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}


