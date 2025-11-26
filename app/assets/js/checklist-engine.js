/**
 * Checklist Engine
 * Auto-generates and manages claim-related tasks
 */

import { getSupabaseClient, getAuthToken } from './auth.js';
import { generateChecklistFromContext, groupTasksByTime } from './utils/checklist-generator.js';
import { getTimelineEvents } from './utils/timeline-autosync.js';
import { renderComplianceHealthWidget } from './utils/compliance-health-widget.js';

let allTasks = [];
let savedTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize compliance health widget
    await renderComplianceHealthWidget('#compliance-health-widget', {
        showFullButton: false
    });
    
    await loadChecklist();
    setupEventListeners();
    
    // Listen for timeline updates
    window.addEventListener('timeline-updated', async () => {
        await loadChecklist();
    });
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
        await loadChecklist();
    });

    // Add custom task button
    document.getElementById('add-custom-task-btn')?.addEventListener('click', () => {
        showAddCustomTaskModal();
    });

    // Export PDF button
    document.getElementById('export-pdf-btn')?.addEventListener('click', async () => {
        await exportChecklistToPDF();
    });
}

/**
 * Load checklist
 */
async function loadChecklist() {
    try {
        document.getElementById('loading-indicator')?.classList.add('show');

        // Load claim context
        const context = await loadClaimContext();

        // Update overview
        updateOverview(context);

        // Generate tasks from context
        const generatedTasks = generateChecklistFromContext(context);

        // Load saved tasks
        await loadSavedTasks();

        // Merge tasks (saved tasks take precedence if same ID)
        allTasks = mergeTasks(generatedTasks, savedTasks);

        // Group and render
        const grouped = groupTasksByTime(allTasks);
        renderTasks(grouped);

        // Update counts
        updateTaskCounts(grouped);

    } catch (error) {
        console.error('Error loading checklist:', error);
    } finally {
        document.getElementById('loading-indicator')?.classList.remove('show');
    }
}

/**
 * Load claim context from various sources
 */
async function loadClaimContext() {
    const context = {
        stage: 'unknown',
        deadlines: [],
        alerts: [],
        evidenceSummary: {},
        timelineSummary: [],
        fnolSubmitted: false,
        complianceStatus: {},
        contractorEstimate: null
    };

    try {
        const client = await getSupabaseClient();
        if (!client) return context;

        const { data: { user } } = await client.auth.getUser();
        if (!user) return context;

        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;

        // Load current stage
        try {
            const { data: stages } = await client
                .from('claim_stage_tracker')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (stages && stages.length > 0) {
                const currentStage = stages.find(s => s.status === 'in_progress') || stages[0];
                context.stage = currentStage?.stage || 'unknown';
            }
        } catch (error) {
            console.warn('Could not load stage:', error);
        }

        // Load deadlines
        try {
            const { data: deadlines } = await client
                .from('deadlines')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', false)
                .order('date', { ascending: true });

            context.deadlines = (deadlines || []).map(d => ({
                id: d.id,
                date: d.date,
                label: d.label,
                type: d.type || 'deadline',
                description: d.notes || d.description
            }));
        } catch (error) {
            console.warn('Could not load deadlines:', error);
        }

        // Load alerts
        try {
            const { data: alerts } = await client
                .from('compliance_alerts')
                .select('*')
                .eq('user_id', user.id)
                .is('resolved_at', null)
                .order('severity', { ascending: false });

            context.alerts = alerts || [];
        } catch (error) {
            console.warn('Could not load alerts:', error);
        }

        // Load evidence summary
        try {
            const { data: evidence } = await client
                .from('evidence_items')
                .select('category, mime_type')
                .eq('user_id', user.id);

            const photoCount = (evidence || []).filter(e => e.mime_type?.startsWith('image/')).length;
            const categories = new Set((evidence || []).map(e => e.category).filter(Boolean));
            
            // Determine missing types (simplified)
            const commonTypes = ['photos', 'invoices', 'estimates', 'police_reports', 'repair_receipts'];
            const missingTypes = commonTypes.filter(type => !Array.from(categories).some(c => c.toLowerCase().includes(type)));

            context.evidenceSummary = {
                photoCount: photoCount,
                totalCount: evidence?.length || 0,
                categories: Array.from(categories),
                missingTypes: missingTypes
            };
        } catch (error) {
            console.warn('Could not load evidence summary:', error);
        }

        // Load timeline summary
        try {
            context.timelineSummary = await getTimelineEvents(claimId);
        } catch (error) {
            console.warn('Could not load timeline:', error);
        }

        // Check FNOL status
        try {
            const { data: fnol } = await client
                .from('fnol_submissions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            context.fnolSubmitted = fnol && fnol.length > 0;
        } catch (error) {
            // Check timeline for FNOL event as fallback
            const fnolEvent = context.timelineSummary.find(e => 
                e.event_type === 'fnol_submitted' || 
                e.metadata?.event_type === 'fnol_submitted'
            );
            context.fnolSubmitted = !!fnolEvent;
        }

        // Load compliance status (from health score)
        try {
            const token = await getAuthToken();
            const response = await fetch('/.netlify/functions/compliance-engine/health-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    claimId: claimId
                })
            });

            if (response.ok) {
                const healthData = await response.json();
                context.complianceStatus = {
                    score: healthData.score,
                    status: healthData.status
                };
            }
        } catch (error) {
            console.warn('Could not load compliance status:', error);
        }

        // Load contractor estimate (if available)
        try {
            const { data: estimates } = await client
                .from('contractor_estimate_interpretations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (estimates && estimates.length > 0) {
                context.contractorEstimate = {
                    summary: {
                        totalAmount: estimates[0].estimate_total,
                        romRange: {
                            low: estimates[0].rom_low,
                            high: estimates[0].rom_high,
                            relation: estimates[0].rom_relation
                        }
                    }
                };
            }
        } catch (error) {
            console.warn('Could not load contractor estimate:', error);
        }

    } catch (error) {
        console.error('Error loading claim context:', error);
    }

    return context;
}

/**
 * Update overview panel
 */
function updateOverview(context) {
    // Current stage
    const stageDisplay = document.getElementById('current-stage');
    if (stageDisplay) {
        const stageLabels = {
            'filed': 'Filed',
            'FNOL': 'FNOL Submitted',
            'inspection': 'Inspection',
            'investigation': 'Investigation',
            'offer': 'Offer Received',
            'negotiation': 'Negotiation',
            'appeal': 'Appeal',
            'denial': 'Denial',
            'settlement': 'Settlement'
        };
        stageDisplay.textContent = stageLabels[context.stage] || 'Not Started';
    }

    // Active alerts count
    const alertsCount = document.getElementById('active-alerts-count');
    if (alertsCount) {
        alertsCount.textContent = context.alerts.length || 0;
    }
}

/**
 * Load saved tasks from database
 */
async function loadSavedTasks() {
    try {
        const client = await getSupabaseClient();
        if (!client) return;

        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;

        const { data: tasks } = await client
            .from('claim_checklist_tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('claim_id', claimId)
            .order('created_at', { ascending: false });

        savedTasks = (tasks || []).map(t => ({
            id: t.task_id || t.id,
            title: t.title,
            description: t.description,
            dueDate: t.due_date,
            severity: t.severity,
            category: t.category,
            relatedTool: t.related_tool,
            completed: t.completed || false,
            completedAt: t.completed_at,
            isCustom: true
        }));
    } catch (error) {
        console.warn('Could not load saved tasks:', error);
        savedTasks = [];
    }
}

/**
 * Merge generated and saved tasks
 */
function mergeTasks(generatedTasks, savedTasks) {
    const merged = [...generatedTasks];
    const generatedIds = new Set(generatedTasks.map(t => t.id));

    // Add saved tasks that aren't in generated list
    savedTasks.forEach(saved => {
        if (!generatedIds.has(saved.id)) {
            merged.push(saved);
        } else {
            // Update generated task with saved task's completion status
            const generated = merged.find(t => t.id === saved.id);
            if (generated) {
                generated.completed = saved.completed;
                generated.completedAt = saved.completedAt;
            }
        }
    });

    return merged;
}

/**
 * Render tasks
 */
function renderTasks(grouped) {
    renderTaskList('today-tasks', grouped.today);
    renderTaskList('week-tasks', grouped.week);
    renderTaskList('upcoming-tasks', grouped.upcoming);
    renderTaskList('completed-tasks', grouped.completed.slice(0, 10)); // Limit to 10 most recent
}

/**
 * Render a task list
 */
function renderTaskList(listId, tasks) {
    const list = document.getElementById(listId);
    if (!list) return;

    if (tasks.length === 0) {
        list.innerHTML = '<li class="empty-state">No tasks in this category.</li>';
        return;
    }

    list.innerHTML = tasks.map(task => renderTaskItem(task)).join('');
    
    // Attach event listeners
    tasks.forEach(task => {
        const checkbox = document.querySelector(`#task-${task.id.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (checkbox) {
            checkbox.addEventListener('change', async (e) => {
                await toggleTaskCompletion(task, e.target.checked);
            });
        }

        const goBtn = document.querySelector(`#task-go-${task.id.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (goBtn) {
            goBtn.addEventListener('click', () => {
                if (task.relatedTool) {
                    window.location.href = task.relatedTool;
                }
            });
        }
    });
}

/**
 * Render single task item
 */
function renderTaskItem(task) {
    const taskId = task.id.replace(/[^a-zA-Z0-9]/g, '_');
    const severityClass = `severity-${task.severity}`;
    const severityLabel = task.severity.charAt(0).toUpperCase() + task.severity.slice(1);
    const dueDateStr = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    return `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" 
                   class="task-checkbox" 
                   id="task-${taskId}"
                   ${task.completed ? 'checked' : ''}
                   data-task-id="${task.id}">
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="severity-badge ${severityClass}">${severityLabel}</span>
                </div>
                <p class="task-description">${escapeHtml(task.description)}</p>
                <div class="task-meta">
                    ${dueDateStr ? `<span>Due: ${dueDateStr}</span>` : ''}
                    <span>Category: ${task.category || 'general'}</span>
                </div>
            </div>
            <div class="task-actions">
                ${task.relatedTool ? `<button class="btn btn-secondary btn-small" id="task-go-${taskId}">Go</button>` : ''}
            </div>
        </li>
    `;
}

/**
 * Toggle task completion
 */
async function toggleTaskCompletion(task, completed) {
    try {
        task.completed = completed;
        task.completedAt = completed ? new Date().toISOString() : null;

        // Save to database
        const client = await getSupabaseClient();
        if (client) {
            const { data: { user } } = await client.auth.getUser();
            if (user) {
                const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;

                // Check if task exists
                const { data: existing } = await client
                    .from('claim_checklist_tasks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('task_id', task.id)
                    .eq('claim_id', claimId)
                    .single();

                if (existing) {
                    // Update
                    await client
                        .from('claim_checklist_tasks')
                        .update({
                            completed: completed,
                            completed_at: completed ? new Date().toISOString() : null
                        })
                        .eq('id', existing.id);
                } else {
                    // Insert
                    await client
                        .from('claim_checklist_tasks')
                        .insert({
                            user_id: user.id,
                            claim_id: claimId,
                            task_id: task.id,
                            title: task.title,
                            description: task.description,
                            due_date: task.dueDate,
                            severity: task.severity,
                            category: task.category,
                            related_tool: task.relatedTool,
                            completed: completed,
                            completed_at: completed ? new Date().toISOString() : null
                        });
                }
            }
        }

        // Reload checklist to update UI
        await loadChecklist();
    } catch (error) {
        console.error('Error toggling task completion:', error);
        alert('Failed to update task. Please try again.');
    }
}

/**
 * Update task counts
 */
function updateTaskCounts(grouped) {
    document.getElementById('today-count').textContent = grouped.today.length;
    document.getElementById('week-count').textContent = grouped.week.length;
    document.getElementById('upcoming-count').textContent = grouped.upcoming.length;
    document.getElementById('completed-count').textContent = grouped.completed.length;
    document.getElementById('total-tasks-count').textContent = 
        grouped.today.length + grouped.week.length + grouped.upcoming.length;
}

/**
 * Show add custom task modal
 */
function showAddCustomTaskModal() {
    const title = prompt('Task Title:');
    if (!title) return;

    const description = prompt('Task Description (optional):') || '';
    const dueDate = prompt('Due Date (YYYY-MM-DD, optional):') || '';
    const severity = prompt('Severity (critical/recommended/optional):') || 'optional';

    if (title) {
        addCustomTask({
            title: title,
            description: description,
            dueDate: dueDate,
            severity: severity,
            category: 'custom',
            relatedTool: ''
        });
    }
}

/**
 * Add custom task
 */
async function addCustomTask(task) {
    try {
        const client = await getSupabaseClient();
        if (!client) {
            alert('Database not available. Task will not be saved.');
            return;
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            alert('Please sign in to add custom tasks.');
            return;
        }

        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        const taskId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await client
            .from('claim_checklist_tasks')
            .insert({
                user_id: user.id,
                claim_id: claimId,
                task_id: taskId,
                title: task.title,
                description: task.description,
                due_date: task.dueDate || null,
                severity: task.severity,
                category: task.category,
                related_tool: task.relatedTool || null,
                completed: false
            });

        // Reload checklist
        await loadChecklist();
        alert('Custom task added.');
    } catch (error) {
        console.error('Error adding custom task:', error);
        alert('Failed to add custom task: ' + error.message);
    }
}

/**
 * Export checklist to PDF
 */
async function exportChecklistToPDF() {
    try {
        const targetSelector = document.getElementById('export-pdf-btn')?.getAttribute('data-export-target') || '.main-container';
        const filename = document.getElementById('export-pdf-btn')?.getAttribute('data-export-filename') || 'claim-checklist.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            // Try to load the PDF export utility
            const script = document.createElement('script');
            script.src = '/app/assets/js/utils/pdf-export.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
                await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
            } else {
                alert('PDF export is not available. Please refresh the page and try again.');
            }
        }
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Failed to export PDF: ' + error.message);
    }
}

/**
 * Toggle completed tasks section
 */
window.toggleCompleted = function() {
    const content = document.getElementById('completed-content');
    const header = document.querySelector('.collapsible-header');
    if (content) {
        content.classList.toggle('expanded');
        if (header) {
            const arrow = header.querySelector('span');
            if (arrow) {
                arrow.textContent = content.classList.contains('expanded') ? '▼' : '▶';
            }
        }
    }
};

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

