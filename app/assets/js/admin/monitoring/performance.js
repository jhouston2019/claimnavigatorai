/**
 * Performance Metrics Controller
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

async function loadPerformance() {
  try {
    const res = await fetchWithAuth('/.netlify/functions/monitoring/performance-metrics?hours=24');
    const data = await res.json();

    if (data.success) {
      document.getElementById('p50-latency').textContent = data.data.p50_latency || 0;
      document.getElementById('p95-latency').textContent = data.data.p95_latency || 0;
      document.getElementById('p99-latency').textContent = data.data.p99_latency || 0;
      document.getElementById('throughput').textContent = data.data.throughput_per_minute || 0;

      // Endpoint performance table
      const tbody = document.getElementById('endpoint-tbody');
      if (data.data.by_endpoint) {
        tbody.innerHTML = data.data.by_endpoint.map(ep => `
          <tr>
            <td>${ep.endpoint}</td>
            <td>${ep.p50}ms</td>
            <td>${ep.p95}ms</td>
            <td>${ep.p99}ms</td>
            <td>${ep.requests}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">No data</td></tr>';
      }
    }
  } catch (error) {
    console.error('Failed to load performance:', error);
  }
}

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;
  await loadPerformance();
  setInterval(loadPerformance, 60000);
})();


