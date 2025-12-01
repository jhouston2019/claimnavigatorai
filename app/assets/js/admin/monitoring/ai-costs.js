/**
 * AI Cost Tracking Controller
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

async function loadCosts() {
  try {
    const res = await fetchWithAuth('/.netlify/functions/monitoring/cost-list?limit=100');
    const data = await res.json();

    if (data.success) {
      document.getElementById('total-cost').textContent = '$' + (data.data.totals?.total_cost || 0).toFixed(4);
      document.getElementById('total-tokens').textContent = (data.data.totals?.input_tokens || 0) + (data.data.totals?.output_tokens || 0);
      document.getElementById('input-tokens').textContent = data.data.totals?.input_tokens || 0;
      document.getElementById('output-tokens').textContent = data.data.totals?.output_tokens || 0;

      // Cost by tool table
      const tbody = document.getElementById('cost-tbody');
      if (data.data.by_tool) {
        tbody.innerHTML = Object.entries(data.data.by_tool)
          .sort((a, b) => b[1].cost - a[1].cost)
          .map(([tool, costs]) => `
            <tr>
              <td>${tool}</td>
              <td>${costs.input_tokens}</td>
              <td>${costs.output_tokens}</td>
              <td>$${costs.cost.toFixed(4)}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No cost data</td></tr>';
      }
    }
  } catch (error) {
    console.error('Failed to load costs:', error);
  }
}

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;
  await loadCosts();
})();


