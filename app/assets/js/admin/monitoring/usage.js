/**
 * Usage Analytics Controller
 */

import { requireAdminAuth } from '/app/assets/js/utils/admin-auth.js';

async function getAuthToken() {
  if (typeof window !== 'undefined' && window.supabase) {
    const session = await window.supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
  }
  return null;
}

async function fetchWithAuth(url) {
  const token = await getAuthToken();
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

async function loadUsage() {
  try {
    const res = await fetchWithAuth('/.netlify/functions/monitoring/usage-list?limit=50');
    const data = await res.json();

    if (data.success) {
      const tbody = document.getElementById('api-usage-tbody');
      tbody.innerHTML = data.data.logs.map(log => `
        <tr>
          <td>${log.api_keys?.key?.substring(0, 8) + '...' || 'N/A'}</td>
          <td>${log.endpoint}</td>
          <td>${log.status}</td>
          <td>${((log.status >= 200 && log.status < 300) ? '100%' : '0%')}</td>
          <td>${log.latency_ms || 0}ms</td>
        </tr>
      `).join('') || '<tr><td colspan="5">No usage data</td></tr>';
    }

    // Endpoint distribution
    const statsRes = await fetchWithAuth('/.netlify/functions/monitoring/usage-stats?hours=24');
    const statsData = await statsRes.json();

    if (statsData.success && statsData.data.by_endpoint) {
      // Simple chart representation
      const chartDiv = document.getElementById('endpoint-chart');
      const max = Math.max(...Object.values(statsData.data.by_endpoint));
      chartDiv.innerHTML = Object.entries(statsData.data.by_endpoint)
        .map(([ep, count]) => `
          <div style="margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between;">
              <span>${ep}</span>
              <span>${count}</span>
            </div>
            <div style="background: #e5e7eb; height: 20px; border-radius: 0.25rem;">
              <div style="background: #1e40af; height: 100%; width: ${(count / max) * 100}%; border-radius: 0.25rem;"></div>
            </div>
          </div>
        `).join('');
    }
  } catch (error) {
    console.error('Failed to load usage:', error);
  }
}

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;
  await loadUsage();
})();


