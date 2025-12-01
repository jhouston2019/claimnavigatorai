/**
 * System Events Stream Controller
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

let lastEventTime = null;
let autoRefreshInterval = null;

async function loadEvents() {
  try {
    const since = lastEventTime || new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await fetchWithAuth(`/.netlify/functions/monitoring/events-stream?since=${since}&limit=100`);
    const data = await res.json();

    if (data.success && data.data.events) {
      const streamDiv = document.getElementById('events-stream');
      const newEvents = data.data.events.map(evt => `
        <div class="event-item">
          <div class="event-time">${new Date(evt.created_at).toLocaleString()}</div>
          <div class="event-type">${evt.event_type}</div>
          <div>Source: ${evt.source}</div>
          ${evt.metadata ? `<div style="font-size: 0.875rem; color: #6b7280;">${JSON.stringify(evt.metadata)}</div>` : ''}
        </div>
      `).join('');

      if (lastEventTime) {
        // Append new events
        streamDiv.innerHTML = newEvents + streamDiv.innerHTML;
      } else {
        // Initial load
        streamDiv.innerHTML = newEvents || '<div class="event-item">No events</div>';
      }

      if (data.data.events.length > 0) {
        lastEventTime = data.data.events[0].created_at;
      }
    }
  } catch (error) {
    console.error('Failed to load events:', error);
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(loadEvents, 5000); // Every 5 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;

  await loadEvents();
  startAutoRefresh();

  document.getElementById('auto-refresh').addEventListener('change', (e) => {
    if (e.target.checked) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });
})();


