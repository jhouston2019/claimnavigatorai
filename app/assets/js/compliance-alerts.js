/**
 * Compliance Alerts Controller
 * Unified alert center for compliance alerts
 */

import { getSupabaseClient, getAuthToken } from './auth.js';

let allAlerts = [];
let activeAlerts = [];
let resolvedAlerts = [];
let currentFilter = 'all';
let currentSort = 'date';
let pollInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAlerts();
        setupEventListeners();
        setupPolling();
        setupBrowserEvents();
    } catch (error) {
        console.error('Compliance alerts initialization error:', error);
    }
});

/**
 * Load alerts from Supabase
 */
async function loadAlerts() {
    try {
        const client = await getSupabaseClient();
        if (!client) {
            console.warn('Supabase client not available');
            return;
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            console.warn('User not authenticated');
            return;
        }

        // Load all alerts for user
        const { data: alerts, error } = await client
            .from('compliance_alerts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allAlerts = alerts || [];
        activeAlerts = allAlerts.filter(a => !a.resolved_at);
        resolvedAlerts = allAlerts.filter(a => a.resolved_at);

        updateStatistics();
        renderAlerts();
        
        // Update global alert badge
        updateGlobalAlertBadge();

    } catch (error) {
        console.error('Error loading alerts:', error);
        document.getElementById('active-alerts-container').innerHTML = 
            '<div class="empty-state">Error loading alerts. Please refresh the page.</div>';
    }
}

/**
 * Update statistics
 */
function updateStatistics() {
    const high = activeAlerts.filter(a => a.severity === 'high').length;
    const medium = activeAlerts.filter(a => a.severity === 'medium').length;
    const low = activeAlerts.filter(a => a.severity === 'low').length;
    const resolved = resolvedAlerts.length;

    document.getElementById('stat-high').textContent = high;
    document.getElementById('stat-medium').textContent = medium;
    document.getElementById('stat-low').textContent = low;
    document.getElementById('stat-resolved').textContent = resolved;
}

/**
 * Render alerts
 */
function renderAlerts() {
    // Filter alerts
    let filtered = [...activeAlerts];
    
    if (currentFilter !== 'all') {
        if (['high', 'medium', 'low'].includes(currentFilter)) {
            filtered = filtered.filter(a => a.severity === currentFilter);
        } else {
            filtered = filtered.filter(a => a.category === currentFilter || a.alert_type === currentFilter);
        }
    }
    
    // Sort alerts
    if (currentSort === 'date') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (currentSort === 'severity') {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
    }
    
    // Render active alerts
    const activeContainer = document.getElementById('active-alerts-container');
    if (filtered.length === 0) {
        activeContainer.innerHTML = '<div class="empty-state">No active alerts matching your filters.</div>';
    } else {
        activeContainer.innerHTML = filtered.map(alert => renderAlertItem(alert)).join('');
    }
    
    // Render resolved alerts
    const resolvedContainer = document.getElementById('resolved-alerts-container');
    if (resolvedAlerts.length === 0) {
        resolvedContainer.innerHTML = '<div class="empty-state">No resolved alerts.</div>';
    } else {
        resolvedContainer.innerHTML = resolvedAlerts
            .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at))
            .map(alert => renderAlertItem(alert, true))
            .join('');
    }
    
    // Re-attach event listeners
    attachAlertEventListeners();
}

/**
 * Render single alert item
 */
function renderAlertItem(alert, isResolved = false) {
    const severityIcon = alert.severity === 'high' ? '🔥' : alert.severity === 'medium' ? '⚠' : 'ℹ';
    const date = new Date(alert.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="alert-item ${alert.severity} ${isResolved ? 'resolved' : ''}" data-alert-id="${alert.id}">
            <div class="alert-header">
                <h3 class="alert-title">${severityIcon} ${alert.title}</h3>
                <span class="alert-severity ${alert.severity}">${alert.severity.toUpperCase()}</span>
            </div>
            <p class="alert-description">${alert.description}</p>
            <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">
                ${date} • ${alert.category || alert.alert_type || 'compliance'}
            </div>
            ${!isResolved ? `
            <div class="alert-actions">
                <button class="btn btn-primary btn-small view-details-btn" data-alert-id="${alert.id}">View Details</button>
                <button class="btn btn-secondary btn-small resolve-btn" data-alert-id="${alert.id}">Mark Resolved</button>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Attach event listeners to alert items
 */
function attachAlertEventListeners() {
    // View details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alertId = e.target.getAttribute('data-alert-id');
            showAlertDetails(alertId);
        });
    });
    
    // Resolve buttons
    document.querySelectorAll('.resolve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const alertId = e.target.getAttribute('data-alert-id');
            await resolveAlert(alertId);
        });
    });
}

/**
 * Show alert details modal
 */
function showAlertDetails(alertId) {
    const alert = allAlerts.find(a => a.id === alertId);
    if (!alert) return;
    
    const modal = document.getElementById('alert-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = alert.title;
    
    let html = `
        <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <span class="alert-severity ${alert.severity}">${alert.severity.toUpperCase()}</span>
                <span style="color: rgba(255, 255, 255, 0.7);">${new Date(alert.created_at).toLocaleString()}</span>
            </div>
            <p style="margin-bottom: 1rem;">${alert.description}</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; color: #ffffff !important;">Rule Violated</h3>
            <p style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem;">${alert.state_rule || 'No specific rule identified'}</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; color: #ffffff !important;">Recommended Action</h3>
            <p style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">${alert.recommended_action || 'No specific recommendation'}</p>
        </div>
    `;
    
    if (alert.related_timeline_event) {
        html += `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 0.5rem; color: #ffffff !important;">Related Timeline Event</h3>
                <p>${alert.related_timeline_event}</p>
            </div>
        `;
    }
    
    html += `
        <div class="alert-actions" style="margin-top: 2rem;">
            <button class="btn btn-primary" id="add-to-journal-btn" data-alert-id="${alert.id}">Add to Journal</button>
            <button class="btn btn-secondary" id="sync-timeline-btn" data-alert-id="${alert.id}">Sync to Timeline</button>
            <a href="/app/evidence-organizer.html" class="btn btn-secondary">Open Evidence Organizer</a>
            <button class="btn btn-secondary" id="export-pdf-btn" data-alert-id="${alert.id}">Generate PDF Report</button>
        </div>
    `;
    
    modalBody.innerHTML = html;
    modal.classList.add('show');
    
    // Attach modal action listeners
    document.getElementById('add-to-journal-btn')?.addEventListener('click', () => addAlertToJournal(alert));
    document.getElementById('sync-timeline-btn')?.addEventListener('click', () => syncAlertToTimeline(alert));
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => exportAlertPDF(alert));
}

/**
 * Resolve alert
 */
async function resolveAlert(alertId) {
    try {
        const client = await getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');

        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await client
            .from('compliance_alerts')
            .update({ resolved_at: new Date().toISOString() })
            .eq('id', alertId)
            .eq('user_id', user.id);

        if (error) throw error;

        // Reload alerts
        await loadAlerts();
        
        // Update global badge
        updateGlobalAlertBadge();

    } catch (error) {
        console.error('Error resolving alert:', error);
        alert('Failed to resolve alert: ' + error.message);
    }
}

/**
 * Add alert to journal
 */
async function addAlertToJournal(alert) {
    try {
        // Import journal helper or call journal API
        const token = await getAuthToken();
        const response = await fetch('/.netlify/functions/add-journal-entry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                entry_type: 'compliance_alert',
                title: `Compliance Alert: ${alert.title}`,
                content: JSON.stringify({
                    alert: alert,
                    description: alert.description,
                    rule: alert.state_rule,
                    recommendedAction: alert.recommended_action,
                    alertLink: `/app/resource-center/compliance-alerts.html#alert-${alert.id}`
                }),
                metadata: {
                    alert_id: alert.id,
                    severity: alert.severity,
                    category: alert.category
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add to journal');
        }

        alert('Alert added to Claim Journal');
        
    } catch (error) {
        console.error('Error adding alert to journal:', error);
        alert('Failed to add alert to journal: ' + error.message);
    }
}

/**
 * Sync alert to timeline
 */
async function syncAlertToTimeline(alert) {
    try {
        const client = await getSupabaseClient();
        if (!client) return;

        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        // Get user's active claim
        const { data: claims } = await client
            .from('claims')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!claims || claims.length === 0) {
            alert('No active claim found. Please create a claim first.');
            return;
        }

        const claimId = claims[0].id;

        // Add alert as timeline event
        await client.from('claim_timeline_milestones').insert({
            claim_id: claimId,
            milestone_name: `Compliance Alert: ${alert.title}`,
            milestone_description: alert.description,
            due_day: 0,
            is_completed: false,
            is_critical: alert.severity === 'high'
        });

        alert('Alert synced to Timeline');
        window.location.href = `/app/timeline.html?id=${claimId}`;

    } catch (error) {
        console.error('Error syncing alert to timeline:', error);
        alert('Failed to sync alert to timeline: ' + error.message);
    }
}

/**
 * Export alert PDF
 */
async function exportAlertPDF(alert) {
    try {
        if (!window.PDFExporter || typeof window.PDFExporter.exportSectionToPDF !== 'function') {
            // Load PDF utility
            const { exportAlertReport } = await import('./utils/pdf-alert-report.js');
            await exportAlertReport(alert);
        } else {
            // Use existing PDF exporter for modal content
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                await window.PDFExporter.exportSectionToPDF(
                    '.modal-content',
                    `compliance-alert-${alert.id}-${Date.now()}.pdf`
                );
            }
        }
    } catch (error) {
        console.error('Error exporting alert PDF:', error);
        alert('Failed to export PDF: ' + error.message);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderAlerts();
        });
    });
    
    // Sort buttons
    document.querySelectorAll('.filter-btn[data-sort]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentSort = e.target.getAttribute('data-sort');
            renderAlerts();
        });
    });
    
    // Refresh button
    document.getElementById('refresh-alerts-btn')?.addEventListener('click', async () => {
        await loadAlerts();
    });
    
    // Toggle resolved section
    document.getElementById('toggle-resolved-btn')?.addEventListener('click', (e) => {
        const container = document.getElementById('resolved-alerts-container');
        const isCollapsed = container.classList.contains('collapsed-section');
        
        if (isCollapsed) {
            container.classList.remove('collapsed-section');
            e.target.textContent = 'Hide';
        } else {
            container.classList.add('collapsed-section');
            e.target.textContent = 'Show';
        }
    });
    
    // Close modal
    document.getElementById('close-modal')?.addEventListener('click', () => {
        document.getElementById('alert-modal').classList.remove('show');
    });
    
    // Close modal on outside click
    document.getElementById('alert-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'alert-modal') {
            document.getElementById('alert-modal').classList.remove('show');
        }
    });
}

/**
 * Setup polling (every 30 seconds)
 */
function setupPolling() {
    // Only poll if page is visible
    if (document.hidden) return;
    
    pollInterval = setInterval(async () => {
        if (!document.hidden) {
            await loadAlerts();
        }
    }, 30000); // 30 seconds
    
    // Stop polling when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        } else {
            setupPolling();
        }
    });
}

/**
 * Setup browser event listeners
 */
function setupBrowserEvents() {
    // Listen for new-alert events
    window.addEventListener('new-alert', async (e) => {
        // Reload alerts when new alert is detected
        await loadAlerts();
        
        // Show notification if page is visible
        if (!document.hidden && e.detail && e.detail.alert) {
            showAlertNotification(e.detail.alert);
        }
    });
}

/**
 * Show alert notification
 */
function showAlertNotification(alert) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.5rem;
        padding: 1rem;
        max-width: 400px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <strong style="color: #ffffff !important;">New Compliance Alert</strong>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #ffffff; cursor: pointer;">&times;</button>
        </div>
        <p style="margin: 0; color: rgba(255, 255, 255, 0.9) !important;">${alert.title}</p>
        <a href="/app/resource-center/compliance-alerts.html" style="color: #dbeafe !important; text-decoration: underline; font-size: 0.875rem; display: inline-block; margin-top: 0.5rem;">View Alert →</a>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Update global alert badge (called from other pages)
 */
function updateGlobalAlertBadge() {
    const badgeCount = activeAlerts.length;
    const badge = document.getElementById('compliance-alert-badge');
    
    if (badge) {
        if (badgeCount > 0) {
            badge.textContent = badgeCount > 99 ? '99+' : badgeCount.toString();
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Dispatch event for other pages
    window.dispatchEvent(new CustomEvent('alerts-updated', { detail: { count: badgeCount } }));
}

// Export function for use by other modules
window.updateComplianceAlertBadge = updateGlobalAlertBadge;


