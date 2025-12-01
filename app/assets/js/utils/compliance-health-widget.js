/**
 * Compliance Health Widget
 * Reusable widget component for displaying compliance health score
 */

import { getSupabaseClient, getAuthToken } from '../../auth.js';
import { getIntakeData } from '../../autofill.js';

/**
 * Render compliance health widget
 * @param {string} containerSelector - CSS selector for container element
 * @param {Object} options - Options object
 * @param {string} options.claimId - Optional claim ID
 * @param {string} options.sessionId - Optional session ID
 * @param {boolean} options.showFullButton - Show "View Full Dashboard" button (default: true)
 */
export async function renderComplianceHealthWidget(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn('Compliance health widget container not found:', containerSelector);
    return;
  }

  try {
    // Show loading state
    container.innerHTML = '<div class="compliance-health-loading">Loading compliance health...</div>';

    // Get claim context
    const intakeData = await getIntakeData();
    const claimId = options.claimId || intakeData?.claim_id || null;
    const sessionId = options.sessionId || null;
    const state = intakeData?.state || '';
    const carrier = intakeData?.carrier_name || intakeData?.carrier || '';
    const claimType = intakeData?.claim_type || 'Property';

    if (!state || !carrier) {
      container.innerHTML = `
        <div class="compliance-health-widget compliance-health-no-data">
          <p>Complete intake form to view compliance health score.</p>
        </div>
      `;
      return;
    }

    // Fetch health score
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/.netlify/functions/compliance-engine/health-score', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        claimId,
        sessionId,
        state,
        carrier,
        claimType
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Render widget
    const statusClass = `compliance-health-${data.status}`;
    const statusLabel = getStatusLabel(data.status);
    const statusColor = getStatusColor(data.status);

    let html = `
      <div class="compliance-health-widget ${statusClass}">
        <div class="compliance-health-header">
          <h3>Compliance Health Score</h3>
          <span class="compliance-health-disclaimer">Compliance Health Indicator, not legal advice.</span>
        </div>
        <div class="compliance-health-score-display">
          <div class="compliance-health-number" style="color: ${statusColor};">${data.score}</div>
          <div class="compliance-health-status" style="color: ${statusColor};">${statusLabel}</div>
        </div>
        <div class="compliance-health-factors">
          <h4>Key Factors:</h4>
          <ul>
            ${data.factors.slice(0, 3).map(factor => `<li>${escapeHtml(factor)}</li>`).join('')}
          </ul>
        </div>
        ${options.showFullButton !== false ? `
        <div class="compliance-health-actions">
          <a href="/app/resource-center/compliance-engine.html" class="btn btn-primary btn-small">View Full Compliance Dashboard</a>
        </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

  } catch (error) {
    console.error('Error rendering compliance health widget:', error);
    container.innerHTML = `
      <div class="compliance-health-widget compliance-health-error">
        <p>Unable to load compliance health score. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Get status label
 */
function getStatusLabel(status) {
  const labels = {
    'good': 'Good',
    'watch': 'Watch',
    'elevated-risk': 'Elevated Risk',
    'critical': 'Critical'
  };
  return labels[status] || status;
}

/**
 * Get status color
 */
function getStatusColor(status) {
  const colors = {
    'good': '#10b981', // green
    'watch': '#f59e0b', // amber
    'elevated-risk': '#f97316', // orange
    'critical': '#ef4444' // red
  };
  return colors[status] || '#64748b';
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add CSS styles if not already present
if (!document.getElementById('compliance-health-widget-styles')) {
  const style = document.createElement('style');
  style.id = 'compliance-health-widget-styles';
  style.textContent = `
    .compliance-health-widget {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .compliance-health-widget.compliance-health-good {
      border-left: 4px solid #10b981;
    }
    
    .compliance-health-widget.compliance-health-watch {
      border-left: 4px solid #f59e0b;
    }
    
    .compliance-health-widget.compliance-health-elevated-risk {
      border-left: 4px solid #f97316;
    }
    
    .compliance-health-widget.compliance-health-critical {
      border-left: 4px solid #ef4444;
    }
    
    .compliance-health-header {
      margin-bottom: 1rem;
    }
    
    .compliance-health-header h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #ffffff !important;
    }
    
    .compliance-health-disclaimer {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7) !important;
      font-style: italic;
    }
    
    .compliance-health-score-display {
      text-align: center;
      margin: 1.5rem 0;
    }
    
    .compliance-health-number {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    
    .compliance-health-status {
      font-size: 1.25rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .compliance-health-factors {
      margin-top: 1.5rem;
    }
    
    .compliance-health-factors h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .compliance-health-factors ul {
      margin: 0;
      padding-left: 1.25rem;
      list-style-type: disc;
    }
    
    .compliance-health-factors li {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8) !important;
      margin-bottom: 0.25rem;
    }
    
    .compliance-health-actions {
      margin-top: 1.5rem;
      text-align: center;
    }
    
    .compliance-health-loading {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.7) !important;
    }
    
    .compliance-health-no-data,
    .compliance-health-error {
      text-align: center;
      padding: 1.5rem;
      color: rgba(255, 255, 255, 0.7) !important;
    }
    
    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
  `;
  document.head.appendChild(style);
}

// Export for global use
window.renderComplianceHealthWidget = renderComplianceHealthWidget;


