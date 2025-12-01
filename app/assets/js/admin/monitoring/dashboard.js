/**
 * Monitoring Dashboard Controller
 */

import { requireAdminAuth } from '/app/assets/js/utils/admin-auth.js';

// Get auth token
async function getAuthToken() {
  if (typeof window !== 'undefined' && window.supabase) {
    const session = await window.supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
  }
  return null;
}

// Fetch with auth
async function fetchWithAuth(url, options = {}) {
  const token = await getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

// Load dashboard data
async function loadDashboard() {
  try {
    // Load usage stats
    const usageRes = await fetchWithAuth('/.netlify/functions/monitoring/usage-stats?hours=24');
    const usageData = await usageRes.json();

    if (usageData.success) {
      document.getElementById('total-requests').textContent = usageData.data.total_requests || 0;
      document.getElementById('active-keys').textContent = usageData.data.active_api_keys || 0;
    }

    // Load error stats
    const errorRes = await fetchWithAuth('/.netlify/functions/monitoring/errors-stats?hours=24');
    const errorData = await errorRes.json();

    if (errorData.success) {
      const totalErrors = errorData.data.total_errors || 0;
      const totalRequests = usageData.data?.total_requests || 1;
      const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);
      document.getElementById('error-rate').textContent = errorRate + '%';
    }

    // Load performance metrics
    const perfRes = await fetchWithAuth('/.netlify/functions/monitoring/performance-metrics?hours=24');
    const perfData = await perfRes.json();

    if (perfData.success) {
      document.getElementById('avg-latency').textContent = perfData.data.avg_latency || 0;
    }

    // Load cost data
    const costRes = await fetchWithAuth('/.netlify/functions/monitoring/cost-list?limit=1');
    const costData = await costRes.json();

    if (costData.success) {
      const totalCost = costData.data.totals?.total_cost || 0;
      document.getElementById('ai-costs').textContent = '$' + totalCost.toFixed(4);
    }

    // Load service health
    const healthRes = await fetchWithAuth('/.netlify/functions/monitoring/service-health');
    const healthData = await healthRes.json();

    if (healthData.success) {
      const status = healthData.data.overall_status || 'unknown';
      document.getElementById('system-health').textContent = status.toUpperCase();
      document.getElementById('system-health').className = 'status-badge ' + 
        (status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : 'error');
    }

    // Load recent errors
    const errorsRes = await fetchWithAuth('/.netlify/functions/monitoring/errors-list?limit=5');
    const errorsData = await errorsRes.json();

    if (errorsData.success && errorsData.data.errors) {
      const errorsHtml = errorsData.data.errors.map(err => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">
          <strong>${err.tool_name || 'Unknown'}</strong> - ${err.error_code || 'N/A'}<br>
          <small>${new Date(err.created_at).toLocaleString()}</small>
        </div>
      `).join('');
      document.getElementById('recent-errors').innerHTML = errorsHtml || 'No recent errors';
    }

    // Load top endpoints
    if (usageData.success && usageData.data.by_endpoint) {
      const endpoints = Object.entries(usageData.data.by_endpoint)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ep, count]) => `
          <div style="padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">
            <strong>${ep}</strong> - ${count} requests
          </div>
        `).join('');
      document.getElementById('top-endpoints').innerHTML = endpoints || 'No data';
    }

    // Load recent events
    const eventsRes = await fetchWithAuth('/.netlify/functions/monitoring/events-stream?limit=10');
    const eventsData = await eventsRes.json();

    if (eventsData.success && eventsData.data.events) {
      const eventsHtml = eventsData.data.events.map(evt => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">
          <strong>${evt.event_type}</strong> from ${evt.source}<br>
          <small>${new Date(evt.created_at).toLocaleString()}</small>
        </div>
      `).join('');
      document.getElementById('recent-events').innerHTML = eventsHtml || 'No recent events';
    }

  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Initialize
(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) {
    return;
  }

  await loadDashboard();
  // Refresh every 30 seconds
  setInterval(loadDashboard, 30000);
})();


