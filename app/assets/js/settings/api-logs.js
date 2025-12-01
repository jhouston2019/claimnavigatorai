/**
 * API Logs Management
 */

import { getSupabaseClient, getAuthToken } from '../auth.js';

let currentPage = 0;
const pageSize = 50;
let filters = {
  apiKey: '',
  endpoint: '',
  status: '',
  dateFrom: '',
  dateTo: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadAPIKeys();
    await loadEndpoints();
    await loadLogs();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('api-key-filter')?.addEventListener('change', (e) => {
        filters.apiKey = e.target.value;
    });
    
    document.getElementById('endpoint-filter')?.addEventListener('change', (e) => {
        filters.endpoint = e.target.value;
    });
    
    document.getElementById('status-filter')?.addEventListener('change', (e) => {
        filters.status = e.target.value;
    });
    
    document.getElementById('date-from')?.addEventListener('change', (e) => {
        filters.dateFrom = e.target.value;
    });
    
    document.getElementById('date-to')?.addEventListener('change', (e) => {
        filters.dateTo = e.target.value;
    });
}

async function loadAPIKeys() {
    try {
        const client = await getSupabaseClient();
        if (!client) return;

        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        const { data: keys } = await client
            .from('api_keys')
            .select('key, name')
            .eq('user_id', user.id)
            .eq('active', true);

        const select = document.getElementById('api-key-filter');
        if (select && keys) {
            keys.forEach(key => {
                const option = document.createElement('option');
                option.value = key.key.substring(0, 8) + '***'; // Masked key
                option.textContent = key.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

async function loadEndpoints() {
    const endpoints = [
        'fnol/create',
        'deadlines/check',
        'compliance/analyze',
        'alerts/list',
        'alerts/resolve',
        'evidence/upload',
        'estimate/interpret',
        'settlement/calc',
        'policy/compare',
        'history/query',
        'expert/find',
        'checklist/generate'
    ];

    const select = document.getElementById('endpoint-filter');
    if (select) {
        endpoints.forEach(endpoint => {
            const option = document.createElement('option');
            option.value = endpoint;
            option.textContent = `/${endpoint}`;
            select.appendChild(option);
        });
    }
}

async function loadLogs() {
    try {
        const client = await getSupabaseClient();
        if (!client) {
            document.getElementById('logs-tbody').innerHTML = 
                '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Database not available.</td></tr>';
            return;
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = '/app/login.html';
            return;
        }

        // Get user's API keys
        const { data: userKeys } = await client
            .from('api_keys')
            .select('key')
            .eq('user_id', user.id);

        const apiKeyList = userKeys?.map(k => k.key) || [];

        // Build query
        let query = client
            .from('api_logs')
            .select('*')
            .in('user_id', [user.id])
            .order('created_at', { ascending: false })
            .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        // Apply filters
        if (filters.endpoint) {
            query = query.eq('endpoint', filters.endpoint);
        }

        if (filters.status === 'success') {
            query = query.lt('status_code', 400);
        } else if (filters.status === 'error') {
            query = query.gte('status_code', 400);
        }

        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom + 'T00:00:00');
        }

        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo + 'T23:59:59');
        }

        const { data: logs, error, count } = await query;

        if (error) throw error;

        // Also get stats
        await loadStats(client, user.id, filters);

        renderLogs(logs || []);
        renderPagination(count || 0);
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logs-tbody').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load logs.</td></tr>';
    }
}

async function loadStats(client, userId, filters) {
    try {
        let statsQuery = client
            .from('api_logs')
            .select('status_code, response_time_ms', { count: 'exact' })
            .eq('user_id', userId);

        // Apply same filters
        if (filters.endpoint) {
            statsQuery = statsQuery.eq('endpoint', filters.endpoint);
        }
        if (filters.dateFrom) {
            statsQuery = statsQuery.gte('created_at', filters.dateFrom + 'T00:00:00');
        }
        if (filters.dateTo) {
            statsQuery = statsQuery.lte('created_at', filters.dateTo + 'T23:59:59');
        }

        const { data: allLogs, count } = await statsQuery;

        const total = count || 0;
        const successCount = (allLogs || []).filter(l => l.status_code < 400).length;
        const errorCount = total - successCount;
        const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : 0;
        const avgLatency = allLogs && allLogs.length > 0
            ? Math.round(allLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / allLogs.length)
            : 0;

        document.getElementById('total-requests').textContent = total.toLocaleString();
        document.getElementById('success-rate').textContent = successRate + '%';
        document.getElementById('avg-latency').textContent = avgLatency;
        document.getElementById('error-count').textContent = errorCount.toLocaleString();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderLogs(logs) {
    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No logs found.</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const date = new Date(log.created_at);
        const statusClass = log.status_code < 400 ? 'status-success' : 'status-error';
        const statusText = log.status_code < 400 ? 'Success' : 'Error';

        return `
            <tr>
                <td>${date.toLocaleString()}</td>
                <td>/${log.endpoint}</td>
                <td>${log.method}</td>
                <td class="${statusClass}">${statusText} (${log.status_code})</td>
                <td>${log.response_time_ms || '-'}</td>
                <td>${log.error_message ? log.error_message.substring(0, 50) : '-'}</td>
                <td>${log.ip_address || '-'}</td>
            </tr>
        `;
    }).join('');
}

function renderPagination(total) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(total / pageSize);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button onclick="goToPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>Previous</button>`;

    // Page numbers
    for (let i = 0; i < totalPages && i < 10; i++) {
        html += `<button onclick="goToPage(${i})" ${i === currentPage ? 'style="background: #1e40af;"' : ''}>${i + 1}</button>`;
    }

    // Next button
    html += `<button onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next</button>`;

    pagination.innerHTML = html;
}

window.goToPage = function(page) {
    currentPage = page;
    loadLogs();
};

window.applyFilters = function() {
    currentPage = 0;
    loadLogs();
};


