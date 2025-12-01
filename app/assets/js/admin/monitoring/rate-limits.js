/**
 * Rate Limit Monitoring Controller
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

async function loadRateLimits() {
  try {
    const res = await fetchWithAuth('/.netlify/functions/monitoring/rate-limit-list?limit=50');
    const data = await res.json();

    if (data.success) {
      const tbody = document.getElementById('rate-limit-tbody');
      tbody.innerHTML = data.data.logs.map(log => `
        <tr>
          <td>${new Date(log.created_at).toLocaleString()}</td>
          <td>${log.api_keys?.key?.substring(0, 8) + '...' || 'N/A'}</td>
          <td>${log.remaining}</td>
          <td>${log.limit_value}</td>
          <td>${log.remaining === 0 ? '<span class="violation">VIOLATION</span>' : 'OK'}</td>
        </tr>
      `).join('') || '<tr><td colspan="5">No rate limit data</td></tr>';

      // Violations list
      const violationsDiv = document.getElementById('violations-list');
      if (data.data.violations && data.data.violations.length > 0) {
        violationsDiv.innerHTML = data.data.violations.map(v => `
          <div style="padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">
            <strong>${new Date(v.created_at).toLocaleString()}</strong> - 
            API Key: ${v.api_keys?.key?.substring(0, 8) + '...' || 'N/A'}
          </div>
        `).join('');
      } else {
        violationsDiv.innerHTML = '<p>No violations in the selected time period.</p>';
      }
    }
  } catch (error) {
    console.error('Failed to load rate limits:', error);
  }
}

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;
  await loadRateLimits();
  setInterval(loadRateLimits, 30000);
})();


