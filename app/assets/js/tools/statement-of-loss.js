/**
 * Statement of Loss Controller
 * Activates the Statement of Loss tool
 */

import { requireAuth, checkPaymentStatus, getAuthToken, getSupabaseClient } from '../auth.js';
import { autofillForm, getIntakeData } from '../autofill.js';

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
  } catch (error) {
    console.error('Statement of Loss initialization error:', error);
  }
});

/**
 * Enable autofill from intake
 */
async function enableAutofill() {
  try {
    // Statement of Loss doesn't have form fields to autofill
    // But we can load existing entries from database
    await loadExistingEntries();
  } catch (error) {
    console.error('Autofill error:', error);
  }
}

/**
 * Load existing entries from database
 */
async function loadExistingEntries() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return;

    // Load statement of loss entries
    const { data: documents } = await client
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'statement_of_loss')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (documents && documents.metadata && documents.metadata.entries) {
      // Populate ledger with existing entries
      const ledgerBody = document.getElementById('ledger-body');
      if (ledgerBody && documents.metadata.entries) {
        documents.metadata.entries.forEach(entry => {
          addEntryToTable(entry);
        });
        updateTotals();
      }
    }
  } catch (error) {
    // No existing entries - that's fine
    console.log('No existing statement of loss found');
  }
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
  // Wire existing functions to save to Supabase
  const originalSubmitAddEntry = window.submitAddEntry;
  if (originalSubmitAddEntry) {
    window.submitAddEntry = async function(event) {
      event.preventDefault();
      await handleAddEntry(event);
    };
  }

  const originalExportPDF = window.exportPDF;
  if (originalExportPDF) {
    window.exportPDF = async function() {
      await handleExportPDF();
    };
  }

  // Wire refresh to load from database
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadExistingEntries();
      if (window.refresh) window.refresh();
    });
  }
}

/**
 * Handle add entry
 */
async function handleAddEntry(event) {
  try {
    const entryType = document.getElementById('entry-type').value;
    const description = document.getElementById('description').value;
    const source = document.getElementById('source').value;
    const amount = document.getElementById('amount').value;
    const entryDate = document.getElementById('entry-date').value;

    const entry = {
      type: entryType,
      description: description,
      source: source || null,
      amount: parseFloat(amount),
      date: entryDate || new Date().toISOString().split('T')[0]
    };

    // Add to table (existing function)
    if (window.submitAddEntry) {
      // Call original function first
      const form = document.getElementById('add-form');
      if (form) {
        const formData = new FormData(form);
        // Let original function handle UI
      }
    }

    // Save to database
    await saveEntryToDatabase(entry);

    // Close modal
    if (window.closeModal) window.closeModal();

  } catch (error) {
    console.error('Add entry error:', error);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Save entry to database
 */
async function saveEntryToDatabase(entry) {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // Get all current entries from table
    const ledgerBody = document.getElementById('ledger-body');
    const entries = [];
    if (ledgerBody) {
      const rows = ledgerBody.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          entries.push({
            type: cells[0].textContent.trim(),
            description: cells[1].textContent.trim(),
            source: cells[2].textContent.trim() || null,
            amount: parseFloat(cells[3].textContent.replace('$', '').replace(',', '')) || 0,
            date: entry.date
          });
        }
      });
    }

    // Add new entry
    entries.push(entry);

    // Calculate totals
    const totals = calculateTotals(entries);

    // Save or update document
    const { data: existing } = await client
      .from('documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'statement_of_loss')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const documentData = {
      user_id: user.id,
      type: 'statement_of_loss',
      title: 'Statement of Loss',
      content: JSON.stringify(entries),
      metadata: {
        entries: entries,
        totals: totals,
        updated_at: new Date().toISOString()
      }
    };

    if (existing) {
      // Update existing
      await client
        .from('documents')
        .update(documentData)
        .eq('id', existing.id);
    } else {
      // Create new
      await client
        .from('documents')
        .insert(documentData);
    }

  } catch (error) {
    console.error('Save to database error:', error);
    throw error;
  }
}

/**
 * Calculate totals
 */
function calculateTotals(entries) {
  const totals = {
    total_payments: 0,
    total_invoices: 0,
    total_expenses: 0,
    total_supplements: 0,
    total_depreciation: 0,
    total_all: 0
  };

  entries.forEach(entry => {
    const amount = entry.amount || 0;
    totals.total_all += amount;
    
    switch(entry.type) {
      case 'payment':
        totals.total_payments += amount;
        break;
      case 'invoice':
        totals.total_invoices += amount;
        break;
      case 'expense':
        totals.total_expenses += amount;
        break;
      case 'supplement':
        totals.total_supplements += amount;
        break;
      case 'depreciation':
        totals.total_depreciation += amount;
        break;
    }
  });

  return totals;
}

/**
 * Add entry to table
 */
function addEntryToTable(entry) {
  const ledgerBody = document.getElementById('ledger-body');
  if (!ledgerBody) return;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${entry.type || ''}</td>
    <td>${entry.description || ''}</td>
    <td>${entry.source || ''}</td>
    <td>$${(entry.amount || 0).toFixed(2)}</td>
  `;
  ledgerBody.appendChild(row);
}

/**
 * Update totals display
 */
function updateTotals() {
  const ledgerBody = document.getElementById('ledger-body');
  if (!ledgerBody) return;

  const totals = calculateTotalsFromTable();
  
  const totalPayments = document.getElementById('total-payments');
  const totalInvoices = document.getElementById('total-invoices');
  const totalExpenses = document.getElementById('total-expenses');
  const totalSupplements = document.getElementById('total-supplements');
  const totalDepreciation = document.getElementById('total-depreciation');
  const totalAll = document.getElementById('total-all');

  if (totalPayments) totalPayments.textContent = `$${totals.total_payments.toFixed(2)}`;
  if (totalInvoices) totalInvoices.textContent = `$${totals.total_invoices.toFixed(2)}`;
  if (totalExpenses) totalExpenses.textContent = `$${totals.total_expenses.toFixed(2)}`;
  if (totalSupplements) totalSupplements.textContent = `$${totals.total_supplements.toFixed(2)}`;
  if (totalDepreciation) totalDepreciation.textContent = `$${totals.total_depreciation.toFixed(2)}`;
  if (totalAll) totalAll.textContent = `$${totals.total_all.toFixed(2)}`;
}

/**
 * Calculate totals from table
 */
function calculateTotalsFromTable() {
  const ledgerBody = document.getElementById('ledger-body');
  if (!ledgerBody) return calculateTotals([]);

  const entries = [];
  const rows = ledgerBody.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      entries.push({
        type: cells[0].textContent.trim(),
        description: cells[1].textContent.trim(),
        source: cells[2].textContent.trim() || null,
        amount: parseFloat(cells[3].textContent.replace('$', '').replace(',', '')) || 0
      });
    }
  });

  return calculateTotals(entries);
}

/**
 * Handle export PDF
 */
async function handleExportPDF() {
  try {
    const ledgerBody = document.getElementById('ledger-body');
    if (!ledgerBody) {
      alert('No entries to export');
      return;
    }

    // Get all entries
    const entries = [];
    const rows = ledgerBody.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        entries.push({
          type: cells[0].textContent.trim(),
          description: cells[1].textContent.trim(),
          source: cells[2].textContent.trim() || null,
          amount: parseFloat(cells[3].textContent.replace('$', '').replace(',', '')) || 0
        });
      }
    });

    const totals = calculateTotals(entries);

    // Build document content
    const content = buildStatementContent(entries, totals);

    // Get auth token
    const token = await getAuthToken();

    // Call PDF generation
    const response = await fetch('/.netlify/functions/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        document_content: content,
        metadata: {
          title: 'Statement of Loss',
          type: 'statement_of_loss'
        }
      })
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    // Download PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-of-loss-${Date.now()}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Export PDF error:', error);
    alert(`Error generating PDF: ${error.message}`);
  }
}

/**
 * Build statement content
 */
function buildStatementContent(entries, totals) {
  let content = 'STATEMENT OF LOSS\n\n';
  content += 'Entries:\n\n';
  
  entries.forEach((entry, index) => {
    content += `${index + 1}. ${entry.type.toUpperCase()}\n`;
    content += `   Description: ${entry.description}\n`;
    if (entry.source) content += `   Source: ${entry.source}\n`;
    content += `   Amount: $${entry.amount.toFixed(2)}\n\n`;
  });

  content += '\nTOTALS:\n';
  content += `Total Payments: $${totals.total_payments.toFixed(2)}\n`;
  content += `Total Invoices: $${totals.total_invoices.toFixed(2)}\n`;
  content += `Total Expenses: $${totals.total_expenses.toFixed(2)}\n`;
  content += `Total Supplements: $${totals.total_supplements.toFixed(2)}\n`;
  content += `Total Depreciation: $${totals.total_depreciation.toFixed(2)}\n`;
  content += `\nGRAND TOTAL: $${totals.total_all.toFixed(2)}\n`;

  return content;
}

/**
 * Show payment required message
 */
function showPaymentRequired() {
  const main = document.querySelector('main') || document.body;
  if (main) {
    const message = document.createElement('div');
    message.className = 'error';
    message.style.cssText = 'text-align: center; padding: 2rem; margin: 2rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem;';
    message.innerHTML = `
      <h3 style="margin-bottom: 1rem;">Payment Required</h3>
      <p style="margin-bottom: 1rem;">Please purchase access to use Statement of Loss.</p>
      <a href="/app/pricing.html" class="btn btn-primary">Get Full Access</a>
    `;
    main.insertBefore(message, main.firstChild);
  }
}



