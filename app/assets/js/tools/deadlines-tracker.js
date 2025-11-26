/**
 * Deadlines Tracker Controller
 * Activates the Deadlines Tracker tool
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { getIntakeData } from '../autofill.js';
import { applyDeadlines, generateAlerts } from '../utils/compliance-engine-helper.js';
import { addTimelineEvent } from '../utils/timeline-autosync.js';

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

    // Load intake data
    const intakeData = await getIntakeData();
    
    // Enable autofill
    await enableAutofill();

    // Initialize storage engine
    await initStorageEngine();

    // Attach event listeners
    await attachEventListeners();

    // Load existing deadlines
    await loadExistingDeadlines();
  } catch (error) {
    console.error('Deadlines Tracker initialization error:', error);
  }
});

/**
 * Enable autofill from intake
 */
async function enableAutofill() {
  // Deadlines page doesn't have form fields to autofill
  // But we can use intake data for AI analysis
}

/**
 * Initialize storage engine
 */
async function initStorageEngine() {
  // Storage engine ready via storage.js
}

/**
 * Attach event listeners
 */
async function attachEventListeners() {
  // Wire existing functions
  const originalSubmitAddDeadline = window.submitAddDeadline;
  if (originalSubmitAddDeadline) {
    window.submitAddDeadline = async function(event) {
      await handleAddDeadline(event);
    };
  }

  const originalSubmitScanDocument = window.submitScanDocument;
  if (originalSubmitScanDocument) {
    window.submitScanDocument = async function(event) {
      await handleScanDocument(event);
    };
  }

  // Wire refresh
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadExistingDeadlines();
      if (window.refresh) window.refresh();
    });
  }
  
  // Add Compliance Engine refresh button
  let complianceRefreshBtn = document.getElementById('compliance-refresh-btn');
  if (complianceRefreshBtn) {
    complianceRefreshBtn.addEventListener('click', async () => {
      await refreshDeadlinesFromComplianceEngine();
    });
  } else {
    // Create button if it doesn't exist
    const refreshContainer = document.querySelector('.refresh-container') || document.querySelector('#refresh-btn')?.parentElement;
    if (refreshContainer) {
      const newBtn = document.createElement('button');
      newBtn.id = 'compliance-refresh-btn';
      newBtn.className = 'btn btn-secondary';
      newBtn.textContent = 'Refresh Deadlines from Compliance Engine';
      newBtn.style.cssText = 'margin-left: 0.5rem;';
      refreshContainer.appendChild(newBtn);
      newBtn.addEventListener('click', async () => {
        await refreshDeadlinesFromComplianceEngine();
      });
    }
  }
}

/**
 * Handle add deadline
 */
async function handleAddDeadline(event) {
  event.preventDefault();

  try {
    const eventName = document.getElementById('event-name').value;
    const deadlineDate = document.getElementById('deadline-date').value;
    const priority = document.getElementById('deadline-priority').value;
    const source = document.getElementById('deadline-source').value || 'Manual Entry';

    const deadline = {
      label: eventName,
      date: deadlineDate,
      source: source,
      priority: priority,
      completed: false
    };

    // Save to database
    await saveDeadlineToDatabase(deadline);

    // Add to table (existing function)
    if (window.submitAddDeadline) {
      // Let original function handle UI update
      const form = document.getElementById('add-form');
      if (form) {
        // Original function will handle display
      }
    }

    // Close modal
    if (window.closeModal) window.closeModal('add-modal');

    // Refresh display
    await loadExistingDeadlines();

  } catch (error) {
    console.error('Add deadline error:', error);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Save deadline to database
 */
async function saveDeadlineToDatabase(deadline) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    await client
      .from('deadlines')
      .insert({
        user_id: user.id,
        label: deadline.label,
        date: deadline.date,
        source: deadline.source,
        completed: deadline.completed || false,
        notes: deadline.notes || null
      });

  } catch (error) {
    console.error('Save deadline error:', error);
    throw error;
  }
}

/**
 * Handle scan document
 */
async function handleScanDocument(event) {
  event.preventDefault();

  const scanBtn = document.querySelector('#scan-form button[type="submit"]');
  const originalText = scanBtn ? scanBtn.textContent : 'Scan for Deadlines';

  try {
    if (scanBtn) {
      scanBtn.disabled = true;
      scanBtn.textContent = 'Scanning...';
    }

    const documentText = document.getElementById('document-text').value;
    if (!documentText.trim()) {
      throw new Error('Please provide document text to scan');
    }

    // Get intake data for context
    const intakeData = await getIntakeData();
    const keyDates = {
      date_of_loss: intakeData?.date_of_loss || null,
      notice_date: null,
      denial_date: null,
      last_payment_date: null
    };

    // Call AI timeline analyzer
    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/ai-timeline-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        document_text: documentText,
        key_dates: keyDates
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Scan failed');
    }

    const result = await response.json();

    // Save suggested deadlines
    if (result.data && result.data.suggested_deadlines) {
      for (const deadline of result.data.suggested_deadlines) {
        await saveDeadlineToDatabase({
          label: deadline.label,
          date: deadline.date,
          source: deadline.source || 'AI Detected',
          priority: deadline.priority || 'medium',
          completed: false
        });
      }
    }

    // Close modal
    if (window.closeModal) window.closeModal('scan-modal');

    // Refresh display
    await loadExistingDeadlines();

    alert(`Found ${result.data?.suggested_deadlines?.length || 0} deadlines`);

  } catch (error) {
    console.error('Scan document error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.textContent = originalText;
    }
  }
}

/**
 * Load existing deadlines
 */
async function loadExistingDeadlines() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return;

    const { data: deadlines, error } = await client
      .from('deadlines')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('date', { ascending: true });

    if (error) throw error;

    // Add timeline events for key deadlines
    await addDeadlineTimelineEvents(deadlines || []);
}

/**
 * Add timeline events for deadlines
 */
async function addDeadlineTimelineEvents(deadlines) {
    try {
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        
        for (const deadline of deadlines) {
            // Only add critical deadlines or those within 30 days
            const daysUntil = getDaysUntil(deadline.date);
            if (daysUntil <= 30 || deadline.priority === 'high') {
                await addTimelineEvent({
                    type: deadline.type === 'statutory' ? 'deadline_statutory' : 'deadline_carrier',
                    date: deadline.date,
                    source: 'deadlines',
                    title: deadline.label,
                    description: deadline.notes || deadline.description || `Deadline: ${deadline.date}`,
                    metadata: {
                        deadlineId: deadline.id,
                        priority: deadline.priority,
                        source: deadline.source,
                        daysUntil: daysUntil
                    },
                    claimId: claimId
                });
            }
        }
    } catch (error) {
        console.warn('Failed to add deadline timeline events:', error);
    }

    // Update display
    if (window.updateDeadlinesDisplay && deadlines) {
      // Use existing function if available
      updateDeadlinesDisplay(deadlines);
    } else {
      // Manual update
      const tbody = document.getElementById('deadlines-body');
      if (tbody && deadlines) {
        tbody.innerHTML = deadlines.map(deadline => {
          const daysUntil = getDaysUntil(deadline.date);
          const priorityClass = daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low';
          return `
            <tr class="priority-${priorityClass}">
              <td>${escapeHtml(deadline.label)}</td>
              <td>${formatDate(deadline.date)}</td>
              <td><span class="priority-badge priority-${priorityClass}">${priorityClass}</span></td>
              <td>${escapeHtml(deadline.source || '')}</td>
              <td>${daysUntil} days</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Update statistics
    updateStatistics(deadlines || []);
    
    // Generate compliance alerts after loading deadlines
    await triggerComplianceAlerts(deadlines || []);

  } catch (error) {
    console.error('Load deadlines error:', error);
  }
}

/**
 * Update statistics
 */
function updateStatistics(deadlines) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: deadlines.length,
    upcoming: 0,
    overdue: 0,
    high: 0
  };

  deadlines.forEach(deadline => {
    const deadlineDate = new Date(deadline.date);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      stats.overdue++;
    } else if (daysUntil <= 30) {
      stats.upcoming++;
    }

    if (daysUntil <= 7) {
      stats.high++;
    }
  });

  const statTotal = document.getElementById('stat-total');
  const statUpcoming = document.getElementById('stat-upcoming');
  const statOverdue = document.getElementById('stat-overdue');
  const statHigh = document.getElementById('stat-high');

  if (statTotal) statTotal.textContent = stats.total;
  if (statUpcoming) statUpcoming.textContent = stats.upcoming;
  if (statOverdue) statOverdue.textContent = stats.overdue;
  if (statHigh) statHigh.textContent = stats.high;
}

/**
 * Helper functions
 */
function getDaysUntil(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show payment required message
 */
/**
 * Refresh deadlines from Compliance Engine
 */
async function refreshDeadlinesFromComplianceEngine() {
  try {
    const intakeData = await getIntakeData();
    if (!intakeData || !intakeData.state || !intakeData.carrier) {
      alert('Please complete intake form with state and carrier information first.');
      return;
    }
    
    const btn = document.getElementById('compliance-refresh-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Refreshing...';
    }
    
    // Get existing events from deadlines
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data: existingDeadlines } = await client
      .from('deadlines')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    const events = (existingDeadlines || []).map(d => ({
      name: d.label,
      date: d.date,
      description: d.source || 'Deadline'
    }));
    
    // Call Compliance Engine to get deadlines
    const result = await applyDeadlines(
      intakeData.state,
      intakeData.carrier,
      intakeData.claim_type || 'Property',
      events
    );
    
    // Save new deadlines from Compliance Engine
    if (result.deadlines && Array.isArray(result.deadlines)) {
      for (const deadline of result.deadlines) {
        await saveDeadlineToDatabase({
          label: deadline.label || deadline.name,
          date: deadline.date,
          source: 'Compliance Engine',
          priority: deadline.priority || 'medium',
          completed: false
        });
      }
    }
    
    // Reload display
    await loadExistingDeadlines();
    
    alert(`Refreshed ${result.deadlines?.length || 0} deadlines from Compliance Engine`);
    
  } catch (error) {
    console.error('Refresh deadlines error:', error);
    alert(`Error refreshing deadlines: ${error.message}`);
  } finally {
    const btn = document.getElementById('compliance-refresh-btn');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Refresh Deadlines from Compliance Engine';
    }
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
      <p style="margin-bottom: 1rem;">Please purchase access to use Deadlines Tracker.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}

/**
 * Trigger compliance alerts after deadlines are loaded
 */
async function triggerComplianceAlerts(deadlines = []) {
  try {
    const intakeData = await getIntakeData();
    if (!intakeData?.state || !intakeData?.carrier) {
      return; // Skip if no state/carrier
    }

    // Convert deadlines to timeline events format
    const timelineEvents = deadlines.map(d => ({
      name: d.label,
      date: d.date,
      description: d.source || 'Deadline'
    }));

    // Generate alerts
    await generateAlerts(
      {
        state: intakeData.state,
        carrier: intakeData.carrier_name || intakeData.carrier,
        claimType: intakeData.claim_type || 'Property',
        claimId: intakeData.claim_id || null
      },
      timelineEvents,
      [],
      '',
      []
    );
  } catch (error) {
    console.warn('Failed to trigger compliance alerts:', error);
  }
}


