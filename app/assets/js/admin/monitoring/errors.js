/**
 * Errors Viewer Controller
 */

import { requireAdminAuth } from '/app/assets/js/utils/admin-auth.js';

async function getAuthToken() {
  if (typeof window !== 'undefined' && window.supabase) {
    const session = await window.supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
  }
  return null;
}

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

let currentPage = 0;
const pageSize = 50;

async function loadErrors() {
  const tool = document.getElementById('tool-filter').value;
  const errorCode = document.getElementById('error-code-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;

  const params = new URLSearchParams({
    limit: pageSize,
    offset: currentPage * pageSize
  });
  if (tool) params.append('tool', tool);
  if (errorCode) params.append('error_code', errorCode);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);

  try {
    const res = await fetchWithAuth(`/.netlify/functions/monitoring/errors-list?${params}`);
    const data = await res.json();

    if (data.success) {
      const tbody = document.getElementById('errors-tbody');
      tbody.innerHTML = data.data.errors.map(err => `
        <tr>
          <td>${new Date(err.created_at).toLocaleString()}</td>
          <td>${err.tool_name || 'N/A'}</td>
          <td><span class="error-code">${err.error_code || 'N/A'}</span></td>
          <td>${(err.error_message || '').substring(0, 100)}</td>
          <td><button onclick="showErrorDetails('${err.id}')">Details</button></td>
        </tr>
      `).join('') || '<tr><td colspan="5">No errors found</td></tr>';

      // Pagination
      const totalPages = Math.ceil((data.data.total || 0) / pageSize);
      document.getElementById('pagination').innerHTML = `
        <button onclick="prevPage()" ${currentPage === 0 ? 'disabled' : ''}>Previous</button>
        Page ${currentPage + 1} of ${totalPages}
        <button onclick="nextPage()" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next</button>
      `;
    }
  } catch (error) {
    console.error('Failed to load errors:', error);
  }
}

window.prevPage = () => {
  if (currentPage > 0) {
    currentPage--;
    loadErrors();
  }
};

window.nextPage = () => {
  currentPage++;
  loadErrors();
};

window.showErrorDetails = (id) => {
  // Modal for error details
  alert('Error details for ID: ' + id);
};

window.exportCSV = async () => {
  // Export to CSV
  alert('CSV export functionality');
};

(async () => {
  const auth = await requireAdminAuth();
  if (!auth.authenticated) return;
  await loadErrors();
})();


