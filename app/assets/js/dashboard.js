/**
 * Dashboard JavaScript
 * Loads user data and displays in dashboard
 */

import { requireAuth, getSupabaseClient, logout } from './auth.js';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) {
      return; // Redirected to login
    }

    // Setup logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await logout();
      });
    }

    // Load dashboard data
    await loadDashboardData();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showError('Failed to load dashboard. Please refresh the page.');
  }
});

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
  try {
    const client = await getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      throw new Error('User not found');
    }

    // Load all data in parallel
    const [documents, evidence, deadlines, policies] = await Promise.all([
      loadDocuments(client, user.id),
      loadEvidence(client, user.id),
      loadDeadlines(client, user.id),
      loadPolicySummaries(client, user.id)
    ]);

    // Render data
    renderDocuments(documents);
    renderEvidence(evidence);
    renderDeadlines(deadlines);
    renderPolicies(policies);

    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    document.getElementById('loading').style.display = 'none';
    showError('Failed to load dashboard data. Please try again.');
  }
}

/**
 * Load documents
 */
async function loadDocuments(client, userId) {
  try {
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

/**
 * Load evidence items
 */
async function loadEvidence(client, userId) {
  try {
    const { data, error } = await client
      .from('evidence_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading evidence:', error);
    return [];
  }
}

/**
 * Load deadlines
 */
async function loadDeadlines(client, userId) {
  try {
    const { data, error } = await client
      .from('deadlines')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('date', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading deadlines:', error);
    return [];
  }
}

/**
 * Load policy summaries
 */
async function loadPolicySummaries(client, userId) {
  try {
    const { data, error } = await client
      .from('policy_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading policy summaries:', error);
    return [];
  }
}

/**
 * Render documents
 */
function renderDocuments(documents) {
  const list = document.getElementById('documents-list');
  if (!list) return;

  if (documents.length === 0) {
    list.innerHTML = '<li class="empty">No documents yet. <a href="/app/tools/document-generator.html">Create your first document</a></li>';
    return;
  }

  list.innerHTML = documents.map(doc => `
    <li>
      <div class="item-title">${escapeHtml(doc.title)}</div>
      <div class="item-meta">${doc.type} • ${formatDate(doc.created_at)}</div>
      <div class="item-actions">
        <button class="btn btn-secondary" onclick="viewDocument('${doc.id}')">View</button>
        <button class="btn btn-secondary" onclick="downloadDocumentPDF('${doc.id}')">Download PDF</button>
      </div>
    </li>
  `).join('');
}

/**
 * Render evidence
 */
function renderEvidence(evidence) {
  const list = document.getElementById('evidence-list');
  if (!list) return;

  if (evidence.length === 0) {
    list.innerHTML = '<li class="empty">No evidence items yet. <a href="/app/tools/evidence-organizer.html">Add evidence</a></li>';
    return;
  }

  list.innerHTML = evidence.map(item => `
    <li>
      <div class="item-title">${escapeHtml(item.file_name || item.category)}</div>
      <div class="item-meta">${item.category} • ${formatDate(item.created_at)}</div>
      ${item.file_url ? `<div class="item-actions"><a href="${item.file_url}" target="_blank" class="btn btn-secondary">View</a></div>` : ''}
    </li>
  `).join('');
}

/**
 * Render deadlines
 */
function renderDeadlines(deadlines) {
  const list = document.getElementById('deadlines-list');
  if (!list) return;

  if (deadlines.length === 0) {
    list.innerHTML = '<li class="empty">No deadlines yet. <a href="/app/tools/timeline-deadlines.html">Add deadlines</a></li>';
    return;
  }

  list.innerHTML = deadlines.map(deadline => {
    const daysUntil = getDaysUntil(deadline.date);
    const urgencyClass = daysUntil <= 7 ? 'error' : daysUntil <= 30 ? 'warning' : '';
    return `
      <li>
        <div class="item-title">${escapeHtml(deadline.label)}</div>
        <div class="item-meta">${formatDate(deadline.date)} • ${daysUntil} days away</div>
        ${deadline.source ? `<div class="item-meta">Source: ${deadline.source}</div>` : ''}
      </li>
    `;
  }).join('');
}

/**
 * Render policy summaries
 */
function renderPolicies(policies) {
  const list = document.getElementById('policies-list');
  if (!list) return;

  if (policies.length === 0) {
    list.innerHTML = '<li class="empty">No policy summaries yet. <a href="/app/tools/coverage-decoder.html">Analyze a policy</a></li>';
    return;
  }

  list.innerHTML = policies.map(policy => `
    <li>
      <div class="item-title">Policy Summary</div>
      <div class="item-meta">${formatDate(policy.created_at)}</div>
      <div class="item-actions">
        <button class="btn btn-secondary" onclick="viewPolicy('${policy.id}')">View</button>
      </div>
    </li>
  `).join('');
}

/**
 * Helper functions
 */
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDaysUntil(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Global functions for buttons
window.viewDocument = async function(documentId) {
  // TODO: Implement document viewer
  alert('Document viewer coming soon');
};

window.downloadDocumentPDF = async function(documentId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`/.netlify/functions/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ document_id: documentId })
    });

    if (!response.ok) throw new Error('Failed to generate PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${documentId}.pdf`;
    a.click();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF');
  }
};

window.viewPolicy = async function(policyId) {
  // TODO: Implement policy viewer
  alert('Policy viewer coming soon');
};

async function getAuthToken() {
  const client = await getSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  return session?.access_token || null;
}



