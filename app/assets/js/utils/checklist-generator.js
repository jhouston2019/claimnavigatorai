/**
 * Checklist Generator
 * Generates dynamic task lists based on claim context
 */

/**
 * Generate checklist tasks from claim context
 * @param {Object} context - Claim context
 * @param {string} context.stage - Current claim stage
 * @param {Array} context.deadlines - Upcoming deadlines
 * @param {Array} context.alerts - Active compliance alerts
 * @param {Object} context.evidenceSummary - Evidence status summary
 * @param {Array} context.timelineSummary - Timeline events summary
 * @param {boolean} context.fnolSubmitted - Whether FNOL has been submitted
 * @param {Object} context.complianceStatus - Compliance health status
 * @param {Object} context.contractorEstimate - Contractor estimate interpretation if available
 * @returns {Array} Array of task objects
 */
export function generateChecklistFromContext(context) {
    const tasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const {
        stage = 'unknown',
        deadlines = [],
        alerts = [],
        evidenceSummary = {},
        timelineSummary = [],
        fnolSubmitted = false,
        complianceStatus = {},
        contractorEstimate = null
    } = context;

    // FNOL Tasks
    if (!fnolSubmitted) {
        tasks.push({
            id: 'task_fnol_submit',
            title: 'Submit FNOL (First Notice of Loss)',
            description: 'Complete and submit your First Notice of Loss to your insurance carrier. This starts the official claim process.',
            dueDate: today.toISOString().split('T')[0],
            severity: 'critical',
            category: 'fnol',
            relatedTool: '/app/resource-center/fnol-wizard.html',
            completed: false
        });
    } else {
        // Check if initial evidence uploaded
        const hasPhotos = evidenceSummary.photoCount > 0;
        if (!hasPhotos) {
            tasks.push({
                id: 'task_upload_photos',
                title: 'Upload Initial Damage Photos',
                description: 'Add at least 8-12 photos showing all angles and closeups of the damage. Include wide shots and detailed closeups.',
                dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
                severity: 'critical',
                category: 'evidence',
                relatedTool: '/app/evidence-organizer.html',
                completed: false
            });
        }
    }

    // Deadline-based Tasks
    deadlines.forEach(deadline => {
        if (!deadline.date) return;
        
        const deadlineDate = new Date(deadline.date + 'T00:00:00');
        const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= 7) {
            const isCritical = daysUntil <= 3;
            tasks.push({
                id: `task_deadline_${deadline.id || deadline.date}`,
                title: `Follow up before ${deadline.label || deadline.type} deadline`,
                description: `Deadline: ${deadlineDate.toLocaleDateString()}. ${deadline.description || 'Ensure all required actions are completed before this deadline.'}`,
                dueDate: deadline.date,
                severity: isCritical ? 'critical' : 'recommended',
                category: 'deadlines',
                relatedTool: '/app/deadlines.html',
                completed: false
            });
        }
    });

    // Compliance Alert Tasks
    const highSeverityAlerts = alerts.filter(a => a.severity === 'high' && !a.resolved_at);
    if (highSeverityAlerts.length > 0) {
        tasks.push({
            id: 'task_review_alerts',
            title: `Review ${highSeverityAlerts.length} High-Severity Compliance Alert${highSeverityAlerts.length > 1 ? 's' : ''}`,
            description: 'Review and address high-severity compliance alerts that may impact your claim.',
            dueDate: today.toISOString().split('T')[0],
            severity: 'critical',
            category: 'compliance',
            relatedTool: '/app/resource-center/compliance-alerts.html',
            completed: false
        });
    }

    // Evidence Gap Tasks
    if (evidenceSummary.missingTypes && evidenceSummary.missingTypes.length > 0) {
        evidenceSummary.missingTypes.forEach(missingType => {
            tasks.push({
                id: `task_upload_${missingType.toLowerCase().replace(/\s+/g, '_')}`,
                title: `Upload ${missingType}`,
                description: `Add ${missingType} to your evidence collection. This document may be required for your claim.`,
                dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week
                severity: 'recommended',
                category: 'evidence',
                relatedTool: '/app/evidence-organizer.html',
                completed: false
            });
        });
    }

    // Contractor Estimate Tasks
    if (contractorEstimate) {
        const romRelation = contractorEstimate.summary?.romRange?.relation;
        if (romRelation === 'below-range') {
            tasks.push({
                id: 'task_discuss_contractor_estimate',
                title: 'Discuss Scope/Price with Contractor',
                description: 'Your contractor estimate is below the expected ROM range. Review missing scope items and discuss pricing with your contractor.',
                dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
                severity: 'recommended',
                category: 'negotiation',
                relatedTool: '/app/resource-center/contractor-estimate-interpreter.html',
                completed: false
            });
        }
    }

    // Stage-based Tasks
    if (stage === 'filed' || stage === 'FNOL') {
        if (fnolSubmitted) {
            tasks.push({
                id: 'task_track_acknowledgment',
                title: 'Track Carrier Acknowledgment',
                description: 'Monitor for carrier acknowledgment of your FNOL. Most states require acknowledgment within 14 days.',
                dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                severity: 'recommended',
                category: 'compliance',
                relatedTool: '/app/resource-center/compliance-engine.html',
                completed: false
            });
        }
    } else if (stage === 'inspection' || stage === 'investigation') {
        tasks.push({
            id: 'task_prepare_inspection',
            title: 'Prepare for Inspection',
            description: 'Ensure all damage is documented, evidence is organized, and you have a list of questions ready for the adjuster.',
            dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            severity: 'recommended',
            category: 'evidence',
            relatedTool: '/app/evidence-organizer.html',
            completed: false
        });
    } else if (stage === 'offer' || stage === 'negotiation') {
        tasks.push({
            id: 'task_review_offer',
            title: 'Review Settlement Offer',
            description: 'Carefully review the carrier\'s settlement offer. Compare against your contractor estimate and policy coverage.',
            dueDate: today.toISOString().split('T')[0],
            severity: 'critical',
            category: 'negotiation',
            relatedTool: '/app/resource-center/advanced-tools/settlement-calculator-pro.html',
            completed: false
        });
    } else if (stage === 'appeal' || stage === 'denial') {
        tasks.push({
            id: 'task_generate_appeal',
            title: 'Generate Appeal Package',
            description: 'Create a comprehensive appeal package with all required documentation, evidence organization, and legal arguments.',
            dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            severity: 'critical',
            category: 'negotiation',
            relatedTool: '/app/resource-center/advanced-tools/appeal-package-builder.html',
            completed: false
        });
    }

    // Compliance Health Tasks
    if (complianceStatus.status === 'elevated-risk' || complianceStatus.status === 'critical') {
        tasks.push({
            id: 'task_review_compliance',
            title: 'Review Compliance Dashboard',
            description: 'Your compliance health score indicates elevated risk. Review the compliance dashboard and address any issues.',
            dueDate: today.toISOString().split('T')[0],
            severity: 'recommended',
            category: 'compliance',
            relatedTool: '/app/resource-center/compliance-engine.html',
            completed: false
        });
    }

    // Timeline-based Tasks
    const recentTimelineEvents = timelineSummary.filter(e => {
        const eventDate = new Date(e.event_date || e.due_date || e.created_at);
        const daysSince = Math.floor((today - eventDate) / (1000 * 60 * 60 * 24));
        return daysSince <= 7;
    });

    // If no recent activity, suggest engagement
    if (recentTimelineEvents.length === 0 && fnolSubmitted) {
        tasks.push({
            id: 'task_add_journal_entry',
            title: 'Add Journal Entry',
            description: 'Document recent claim activity, communications, or updates in your claim journal.',
            dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            severity: 'optional',
            category: 'evidence',
            relatedTool: '/app/claim-journal.html',
            completed: false
        });
    }

    return tasks;
}

/**
 * Group tasks by time period
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Grouped tasks
 */
export function groupTasksByTime(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const grouped = {
        today: [],
        week: [],
        upcoming: [],
        completed: []
    };

    tasks.forEach(task => {
        if (task.completed) {
            grouped.completed.push(task);
            return;
        }

        if (!task.dueDate) {
            grouped.upcoming.push(task);
            return;
        }

        const dueDate = new Date(task.dueDate + 'T00:00:00');
        const daysUntil = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
            // Overdue - add to today
            grouped.today.push(task);
        } else if (daysUntil === 0) {
            grouped.today.push(task);
        } else if (daysUntil <= 7) {
            grouped.week.push(task);
        } else {
            grouped.upcoming.push(task);
        }
    });

    // Sort by due date within each group
    grouped.today.sort((a, b) => {
        const dateA = new Date(a.dueDate || '9999-12-31');
        const dateB = new Date(b.dueDate || '9999-12-31');
        return dateA - dateB;
    });

    grouped.week.sort((a, b) => {
        const dateA = new Date(a.dueDate || '9999-12-31');
        const dateB = new Date(b.dueDate || '9999-12-31');
        return dateA - dateB;
    });

    grouped.upcoming.sort((a, b) => {
        const dateA = new Date(a.dueDate || '9999-12-31');
        const dateB = new Date(b.dueDate || '9999-12-31');
        return dateA - dateB;
    });

    grouped.completed.sort((a, b) => {
        const completedA = new Date(a.completedAt || a.completed_at || 0);
        const completedB = new Date(b.completedAt || b.completed_at || 0);
        return completedB - completedA; // Most recent first
    });

    return grouped;
}


