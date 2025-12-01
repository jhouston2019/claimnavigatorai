/**
 * Global Compliance Alert Badge
 * Updates alert badge in navigation across all pages
 */

import { getSupabaseClient } from '../auth.js';

let badgeElement = null;
let updateInterval = null;

/**
 * Initialize alert badge in navigation
 */
export function initAlertBadge() {
  // Find or create badge element
  const header = document.querySelector('.header');
  if (!header) return;

  const nav = header.querySelector('.nav');
  if (!nav) return;

  // Check if badge already exists
  badgeElement = document.getElementById('compliance-alert-badge');
  if (!badgeElement) {
    // Create badge element
    badgeElement = document.createElement('a');
    badgeElement.id = 'compliance-alert-badge';
    badgeElement.href = '/app/resource-center/compliance-alerts.html';
    badgeElement.className = 'alert-badge';
    badgeElement.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.5rem;
      background: #ef4444;
      color: #ffffff !important;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-decoration: none;
      margin-left: 0.5rem;
      min-width: 1.5rem;
      height: 1.5rem;
      line-height: 1;
    `;
    badgeElement.innerHTML = '🔔 <span id="alert-count">0</span>';
    badgeElement.style.display = 'none'; // Hidden by default

    // Insert after nav links
    nav.appendChild(badgeElement);
  }

  // Load initial count
  updateAlertBadge();

  // Set up polling (every 60 seconds)
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(updateAlertBadge, 60000);

  // Listen for alerts-updated events
  window.addEventListener('alerts-updated', (e) => {
    if (e.detail && e.detail.count !== undefined) {
      setAlertCount(e.detail.count);
    }
  });
}

/**
 * Update alert badge count
 */
async function updateAlertBadge() {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      setAlertCount(0);
      return;
    }

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      setAlertCount(0);
      return;
    }

    // Count active alerts
    const { data: alerts, error } = await client
      .from('compliance_alerts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .is('resolved_at', null);

    if (error) throw error;

    const count = alerts?.length || 0;
    setAlertCount(count);

  } catch (error) {
    console.warn('Failed to update alert badge:', error);
    setAlertCount(0);
  }
}

/**
 * Set alert count and show/hide badge
 */
function setAlertCount(count) {
  if (!badgeElement) return;

  const countSpan = badgeElement.querySelector('#alert-count');
  if (countSpan) {
    countSpan.textContent = count > 99 ? '99+' : count.toString();
  }

  if (count > 0) {
    badgeElement.style.display = 'inline-flex';
  } else {
    badgeElement.style.display = 'none';
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAlertBadge);
} else {
  initAlertBadge();
}

// Export for manual initialization
window.initComplianceAlertBadge = initAlertBadge;
window.updateComplianceAlertBadge = updateAlertBadge;


