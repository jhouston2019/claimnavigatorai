/**
 * Service Health Controller
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

async function loadHealth() {
  try {
    const res = await fetchWithAuth('/.netlify/functions/monitoring/service-health');
    const data = await res.json();

    if (data.success) {
      const status = data.data.overall_status || 'unknown';
      const indicator = document.getElementById('health-indicator');
      indicator.textContent = status.toUpperCase();
      indicator.className = 'health-indicator ' + 
        (status === 'healthy' ? 'healthy' : status === 'degraded' ? 'degraded' : 'down');

      document.getElementById('health-status').textContent = 
        status === 'healthy' ? 'All systems operational' :
        status === 'degraded' ? 'Some systems experiencing issues' :
        'System outage detected';

      document.getElementById('uptime').textContent = data.data.uptime_percent + '%';

      // Dependencies
      const depsDiv = document.getElementById('dependencies');
      if (data.data.dependencies) {
        depsDiv.innerHTML = Object.entries(data.data.dependencies)
          .filter(([key]) => key !== 'tables')
          .map(([name, health]) => `
            <div class="dependency-card">
              <div>
                <span class="dependency-status ${health.status === 'up' ? 'up' : 'down'}"></span>
                <strong>${name}</strong>
              </div>
              <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                ${health.latency_ms ? health.latency_ms + 'ms' : ''}
              </div>
            </div>
          `).join('');
      }

      // Tables status
      if (data.data.dependencies.tables) {
        const tablesStatus = Object.values(data.data.dependencies.tables).every(exists => exists);
        depsDiv.innerHTML += `
          <div class="dependency-card">
            <div>
              <span class="dependency-status ${tablesStatus ? 'up' : 'down'}"></span>
              <strong>Database Tables</strong>
            </div>
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
              ${Object.values(data.data.dependencies.tables).filter(exists => exists).length} / ${Object.keys(data.data.dependencies.tables).length} tables
            </div>
          </div>
        `;
      }

      // Outages (simplified - would track actual outages)
      document.getElementById('outages-list').innerHTML = 
        status === 'healthy' ? '<p>No recent outages</p>' : 
        '<p>Outage detected. Check dependency status above.</p>';
    }
  } catch (error) {
    console.error('Failed to load health:', error);
    document.getElementById('health-indicator').textContent = 'ERROR';
    document.getElementById('health-indicator').className = 'health-indicator down';
  }
}

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;
  await loadHealth();
  setInterval(loadHealth, 60000); // Refresh every minute
})();


