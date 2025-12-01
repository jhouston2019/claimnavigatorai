/**
 * Enhanced Timeline View
 * Loads and displays auto-synced timeline events with grouping, badges, filters, and links
 */

import { getTimelineEvents } from './utils/timeline-autosync.js';
import { formatDateForDisplay } from './utils/timeline-autosync.js';

let allEvents = [];
let filteredEvents = [];
let currentFilters = {
    sources: [],
    timeRange: 'all'
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadTimelineEvents();
    setupFilters();
    setupEventListeners();
    
    // Listen for timeline updates
    window.addEventListener('timeline-updated', async () => {
        await loadTimelineEvents();
    });
});

/**
 * Load timeline events
 */
async function loadTimelineEvents() {
    try {
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        allEvents = await getTimelineEvents(claimId);
        
        // Sort by date (newest first)
        allEvents.sort((a, b) => {
            const dateA = new Date(a.event_date || a.due_date || a.created_at);
            const dateB = new Date(b.event_date || b.due_date || b.created_at);
            return dateB - dateA;
        });
        
        applyFilters();
        renderTimeline();
    } catch (error) {
        console.error('Error loading timeline events:', error);
    }
}

/**
 * Setup filters
 */
function setupFilters() {
    const sourceFilters = document.getElementById('source-filters');
    const timeRangeFilter = document.getElementById('time-range-filter');
    
    if (sourceFilters) {
        const sources = ['fnol', 'compliance', 'evidence', 'journal', 'advanced-tool'];
        sources.forEach(source => {
            const label = document.createElement('label');
            label.className = 'filter-checkbox';
            label.innerHTML = `
                <input type="checkbox" value="${source}" checked>
                <span>${formatSourceLabel(source)}</span>
            `;
            sourceFilters.appendChild(label);
        });
        
        sourceFilters.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                updateSourceFilters();
            }
        });
    }
    
    if (timeRangeFilter) {
        timeRangeFilter.addEventListener('change', (e) => {
            currentFilters.timeRange = e.target.value;
            applyFilters();
            renderTimeline();
        });
    }
}

/**
 * Update source filters
 */
function updateSourceFilters() {
    const checkboxes = document.querySelectorAll('#source-filters input[type="checkbox"]');
    currentFilters.sources = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    applyFilters();
    renderTimeline();
}

/**
 * Apply filters
 */
function applyFilters() {
    filteredEvents = allEvents.filter(event => {
        // Source filter
        const eventSource = event.source || event.metadata?.source || 'system';
        if (currentFilters.sources.length > 0 && !currentFilters.sources.includes(eventSource)) {
            return false;
        }
        
        // Time range filter
        if (currentFilters.timeRange !== 'all') {
            const eventDate = new Date(event.event_date || event.due_date || event.created_at);
            const now = new Date();
            const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
            
            if (currentFilters.timeRange === '7days' && daysDiff > 7) return false;
            if (currentFilters.timeRange === '30days' && daysDiff > 30) return false;
        }
        
        return true;
    });
}

/**
 * Render timeline
 */
function renderTimeline() {
    const timelineContainer = document.getElementById('timeline-events-container') || document.getElementById('timeline');
    if (!timelineContainer) return;
    
    if (filteredEvents.length === 0) {
        timelineContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7) !important;">No timeline events found. Events will appear here as you use the tools.</p>';
        return;
    }
    
    // Group events by date
    const groupedEvents = groupEventsByDate(filteredEvents);
    
    let html = '';
    for (const [date, events] of Object.entries(groupedEvents)) {
        html += `
            <div class="timeline-date-group">
                <h3 class="timeline-date-header">${formatDateForDisplay(date)}</h3>
                <div class="timeline-events-group">
                    ${events.map(event => renderEvent(event)).join('')}
                </div>
            </div>
        `;
    }
    
    timelineContainer.innerHTML = html;
}

/**
 * Group events by date
 */
function groupEventsByDate(events) {
    const groups = {};
    events.forEach(event => {
        const date = event.event_date || event.due_date || event.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(event);
    });
    return groups;
}

/**
 * Render single event
 */
function renderEvent(event) {
    const source = event.source || event.metadata?.source || 'system';
    const eventType = event.event_type || event.metadata?.event_type || 'milestone';
    const title = event.title || event.milestone_name || 'Timeline Event';
    const description = event.description || event.milestone_description || '';
    const isComplianceCritical = source === 'compliance' || eventType.startsWith('deadline_');
    
    const sourceBadge = getSourceBadge(source);
    const typeBadge = getTypeBadge(eventType);
    const link = getEventLink(event, source, eventType);
    
    return `
        <div class="timeline-event ${isComplianceCritical ? 'compliance-critical' : ''}" data-source="${source}" data-type="${eventType}">
            <div class="timeline-event-header">
                <div class="timeline-event-badges">
                    ${sourceBadge}
                    ${typeBadge}
                </div>
                <div class="timeline-event-time">${formatTime(event.created_at || event.event_date)}</div>
            </div>
            <h4 class="timeline-event-title">${escapeHtml(title)}</h4>
            ${description ? `<p class="timeline-event-description">${escapeHtml(description)}</p>` : ''}
            ${link ? `<div class="timeline-event-actions">${link}</div>` : ''}
        </div>
    `;
}

/**
 * Get source badge
 */
function getSourceBadge(source) {
    const badges = {
        'fnol': '<span class="badge badge-fnol">FNOL</span>',
        'compliance': '<span class="badge badge-compliance">Compliance</span>',
        'evidence': '<span class="badge badge-evidence">Evidence</span>',
        'journal': '<span class="badge badge-journal">Journal</span>',
        'advanced-tool': '<span class="badge badge-advanced">Advanced Tool</span>',
        'deadlines': '<span class="badge badge-deadline">Deadline</span>'
    };
    return badges[source] || '<span class="badge badge-default">System</span>';
}

/**
 * Get type badge
 */
function getTypeBadge(eventType) {
    if (eventType.startsWith('deadline_')) {
        return '<span class="badge badge-deadline-type">⚠ Deadline</span>';
    }
    return '';
}

/**
 * Get event link
 */
function getEventLink(event, source, eventType) {
    const metadata = event.metadata || {};
    
    if (source === 'fnol' && metadata.pdfUrl) {
        return `<a href="${metadata.pdfUrl}" target="_blank" class="btn btn-secondary btn-small">View FNOL PDF</a>`;
    }
    
    if (source === 'evidence') {
        return `<a href="/app/evidence-organizer.html" class="btn btn-secondary btn-small">Open Evidence Organizer</a>`;
    }
    
    if (source === 'compliance' || eventType.startsWith('deadline_')) {
        return `<a href="/app/resource-center/compliance-engine.html" class="btn btn-secondary btn-small">View Compliance Report</a>`;
    }
    
    if (source === 'journal') {
        return `<a href="/app/claim-journal.html" class="btn btn-secondary btn-small">Open Journal</a>`;
    }
    
    if (eventType.startsWith('deadline_')) {
        return `<a href="/app/deadlines.html" class="btn btn-secondary btn-small">View Deadlines</a>`;
    }
    
    return '';
}

/**
 * Format source label
 */
function formatSourceLabel(source) {
    const labels = {
        'fnol': 'FNOL',
        'compliance': 'Compliance',
        'evidence': 'Evidence',
        'journal': 'Journal',
        'advanced-tool': 'Advanced Tools'
    };
    return labels[source] || source;
}

/**
 * Format time
 */
function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-timeline-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadTimelineEvents();
        });
    }
}


