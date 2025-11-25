/**
 * Compliance Engine
 * Comprehensive compliance and bad faith risk analysis
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Dynamically import auth helper
    let getSupabaseClient;
    try {
        const authModule = await import('../auth.js');
        getSupabaseClient = authModule.getSupabaseClient;
    } catch (error) {
        console.warn('Failed to load auth module:', error);
        getSupabaseClient = () => null;
    }
    // State
    let events = [];
    let letterFiles = [];
    let policyFiles = [];
    
    // DOM Elements
    const form = document.getElementById('compliance-form');
    const stateSelect = document.getElementById('state');
    const carrierSelect = document.getElementById('carrier');
    const carrierText = document.getElementById('carrier-text');
    const claimTypeSelect = document.getElementById('claim-type');
    const letterUploadArea = document.getElementById('letter-upload-area');
    const letterInput = document.getElementById('letter-input');
    const letterFileList = document.getElementById('letter-file-list');
    const policyUploadArea = document.getElementById('policy-upload-area');
    const policyInput = document.getElementById('policy-input');
    const policyFileList = document.getElementById('policy-file-list');
    const eventsList = document.getElementById('events-list');
    const addEventBtn = document.getElementById('add-event-btn');
    const runAnalysisBtn = document.getElementById('run-analysis-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultsPanel = document.getElementById('results-panel');
    const actionButtonsPanel = document.getElementById('action-buttons-panel');
    
    // Modal elements
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const closeEventModal = document.getElementById('close-event-modal');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    
    // Initialize
    loadCarriers();
    setupFileUploads();
    setupEventModal();
    setupCollapsibleSections();
    setupActionButtons();
    
    // Load carriers from insurers.json
    async function loadCarriers() {
        try {
            const response = await fetch('/app/resource-center/insurer-directory/insurers.json');
            const insurers = await response.json();
            
            if (Array.isArray(insurers) && insurers.length > 0) {
                insurers.forEach(insurer => {
                    const option = document.createElement('option');
                    option.value = insurer.name || insurer;
                    option.textContent = insurer.name || insurer;
                    carrierSelect.appendChild(option);
                });
            } else {
                // If no carriers in JSON, show text input
                carrierSelect.style.display = 'none';
                carrierText.style.display = 'block';
                carrierText.required = true;
            }
        } catch (error) {
            console.warn('Could not load carriers from JSON, using text input:', error);
            carrierSelect.style.display = 'none';
            carrierText.style.display = 'block';
            carrierText.required = true;
        }
    }
    
    // Setup file uploads
    function setupFileUploads() {
        // Letter upload
        letterUploadArea.addEventListener('click', () => letterInput.click());
        letterUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            letterUploadArea.classList.add('dragover');
        });
        letterUploadArea.addEventListener('dragleave', () => {
            letterUploadArea.classList.remove('dragover');
        });
        letterUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            letterUploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files, 'letter');
        });
        letterInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files, 'letter');
            }
        });
        
        // Policy upload
        policyUploadArea.addEventListener('click', () => policyInput.click());
        policyUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            policyUploadArea.classList.add('dragover');
        });
        policyUploadArea.addEventListener('dragleave', () => {
            policyUploadArea.classList.remove('dragover');
        });
        policyUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            policyUploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files, 'policy');
        });
        policyInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files, 'policy');
            }
        });
    }
    
    function handleFiles(files, type) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                if (type === 'letter') {
                    letterFiles.push(file);
                    displayFile(file, letterFileList, letterFiles);
                } else if (type === 'policy') {
                    policyFiles.push(file);
                    displayFile(file, policyFileList, policyFiles);
                }
            }
        });
    }
    
    function displayFile(file, container, fileArray) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-item-name">📄 ${file.name}</span>
            <button type="button" class="remove-file-btn" onclick="removeFile('${file.name}', ${fileArray === letterFiles ? 'letter' : 'policy'})">Remove</button>
        `;
        container.appendChild(fileItem);
    }
    
    // Make removeFile available globally for onclick handlers
    window.removeFile = function(fileName, type) {
        if (type === 'letter') {
            letterFiles = letterFiles.filter(f => f.name !== fileName);
            letterFileList.innerHTML = '';
            letterFiles.forEach(f => displayFile(f, letterFileList, letterFiles));
        } else if (type === 'policy') {
            policyFiles = policyFiles.filter(f => f.name !== fileName);
            policyFileList.innerHTML = '';
            policyFiles.forEach(f => displayFile(f, policyFileList, policyFiles));
        }
    };
    
    // Setup event modal
    function setupEventModal() {
        addEventBtn.addEventListener('click', () => {
            eventModal.classList.add('show');
        });
        
        closeEventModal.addEventListener('click', () => {
            eventModal.classList.remove('show');
            eventForm.reset();
        });
        
        cancelEventBtn.addEventListener('click', () => {
            eventModal.classList.remove('show');
            eventForm.reset();
        });
        
        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                eventModal.classList.remove('show');
                eventForm.reset();
            }
        });
        
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const eventName = document.getElementById('event-name').value;
            const eventDate = document.getElementById('event-date').value;
            const eventDescription = document.getElementById('event-description').value;
            
            const event = {
                name: eventName,
                date: eventDate,
                description: eventDescription
            };
            
            events.push(event);
            displayEvent(event);
            
            eventModal.classList.remove('show');
            eventForm.reset();
        });
    }
    
    function displayEvent(event) {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.innerHTML = `
            <div class="event-item-info">
                <div class="event-item-date">${formatDate(event.date)}</div>
                <div class="event-item-name">${event.name}</div>
                ${event.description ? `<div class="event-item-description">${event.description}</div>` : ''}
            </div>
            <button type="button" class="remove-event-btn" onclick="removeEvent(${events.length - 1})">Remove</button>
        `;
        eventsList.appendChild(eventItem);
    }
    
    window.removeEvent = function(index) {
        events.splice(index, 1);
        eventsList.innerHTML = '';
        events.forEach((event, idx) => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.innerHTML = `
                <div class="event-item-info">
                    <div class="event-item-date">${formatDate(event.date)}</div>
                    <div class="event-item-name">${event.name}</div>
                    ${event.description ? `<div class="event-item-description">${event.description}</div>` : ''}
                </div>
                <button type="button" class="remove-event-btn" onclick="removeEvent(${idx})">Remove</button>
            `;
            eventsList.appendChild(eventItem);
        });
    };
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // Setup collapsible sections
    function setupCollapsibleSections() {
        const sections = document.querySelectorAll('.collapsible-section');
        sections.forEach(section => {
            const header = section.querySelector('.collapsible-header');
            header.addEventListener('click', () => {
                section.classList.toggle('open');
            });
        });
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading
        runAnalysisBtn.disabled = true;
        loadingIndicator.classList.add('show');
        resultsPanel.classList.remove('show');
        actionButtonsPanel.style.display = 'none';
        
        try {
            // Get carrier name
            const carrier = carrierSelect.value || carrierText.value;
            
            if (!carrier) {
                throw new Error('Please select or enter a carrier name');
            }
            
            // Build payload
            const payload = {
                state: stateSelect.value,
                carrier: carrier,
                claimType: claimTypeSelect.value,
                events: events,
                letterFiles: letterFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                policyFiles: policyFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
            };
            
            // For file uploads, we'll need to handle them separately
            // For now, send metadata and let backend handle file URLs if needed
            
            // Call backend
            const response = await fetch('/.netlify/functions/compliance-engine/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Render results
            renderResults(data);
            
            // Add timeline events
            await addComplianceTimelineEvents(data, payload);
            
            // Show results and action buttons
            resultsPanel.classList.add('show');
            actionButtonsPanel.style.display = 'block';
            
            // Update compliance dashboard
            updateComplianceDashboard();
            
        } catch (error) {
            console.error('Compliance analysis error:', error);
            alert('Compliance analysis failed. Please try again. Error: ' + error.message);
        } finally {
            runAnalysisBtn.disabled = false;
            loadingIndicator.classList.remove('show');
        }
    });
    
    function renderResults(data) {
        // Statutory Deadlines
        const statutoryContent = document.getElementById('statutory-deadlines-content');
        if (data.statutoryDeadlines) {
            statutoryContent.innerHTML = formatResults(data.statutoryDeadlines);
        } else {
            statutoryContent.innerHTML = '<p>No statutory deadline information available.</p>';
        }
        
        // Carrier Overlay Rules
        const carrierContent = document.getElementById('carrier-overlay-content');
        if (data.carrierOverlayRules) {
            carrierContent.innerHTML = formatResults(data.carrierOverlayRules);
        } else {
            carrierContent.innerHTML = '<p>No carrier overlay rules available.</p>';
        }
        
        // Required Documents
        const documentsContent = document.getElementById('required-documents-content');
        if (data.requiredDocuments) {
            documentsContent.innerHTML = formatResults(data.requiredDocuments);
        } else {
            documentsContent.innerHTML = '<p>No required documents information available.</p>';
        }
        
        // Violations Likelihood
        const violationsContent = document.getElementById('violations-content');
        if (data.violationsLikelihood) {
            let violationsHTML = '';
            if (data.violationsLikelihood.possibleViolations) {
                violationsHTML += `<p><strong>Possible Violations:</strong></p>${formatResults(data.violationsLikelihood.possibleViolations)}`;
            }
            if (data.violationsLikelihood.severityScoring) {
                violationsHTML += `<p><strong>Severity Scoring:</strong></p>${formatResults(data.violationsLikelihood.severityScoring)}`;
            }
            if (data.violationsLikelihood.redFlags) {
                violationsHTML += `<p><strong>Red Flags:</strong></p>${formatResults(data.violationsLikelihood.redFlags)}`;
            }
            violationsContent.innerHTML = violationsHTML || '<p>No violations identified.</p>';
        } else {
            violationsContent.innerHTML = '<p>No violations analysis available.</p>';
        }
        
        // Recommended Actions
        const actionsContent = document.getElementById('recommended-actions-content');
        if (data.recommendedActions) {
            let actionsHTML = '';
            if (data.recommendedActions.steps) {
                actionsHTML += `<p><strong>Steps to Take:</strong></p>${formatResults(data.recommendedActions.steps)}`;
            }
            if (data.recommendedActions.escalationPaths) {
                actionsHTML += `<p><strong>Escalation Paths:</strong></p>${formatResults(data.recommendedActions.escalationPaths)}`;
            }
            if (data.recommendedActions.journalNotes) {
                actionsHTML += `<p><strong>Notes to Add to Journal:</strong></p>${formatResults(data.recommendedActions.journalNotes)}`;
            }
            actionsContent.innerHTML = actionsHTML || formatResults(data.recommendedActions);
        } else {
            actionsContent.innerHTML = '<p>No recommended actions available.</p>';
        }
    }
    
    function formatResults(content) {
        if (typeof content === 'string') {
            // Convert newlines to <br> and preserve formatting
            return `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
        } else if (Array.isArray(content)) {
            return `<ul>${content.map(item => `<li>${typeof item === 'string' ? item : JSON.stringify(item)}</li>`).join('')}</ul>`;
        } else if (typeof content === 'object') {
            let html = '';
            for (const [key, value] of Object.entries(content)) {
                html += `<p><strong>${key}:</strong> ${typeof value === 'string' ? value : JSON.stringify(value)}</p>`;
            }
            return html;
        }
        return '<p>No content available.</p>';
    }
    
    // Add timeline events for compliance analysis
    async function addComplianceTimelineEvents(data, payload) {
        try {
            const { addTimelineEvent } = await import('../utils/timeline-autosync.js');
            const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
            
            // Add main compliance analysis event
            await addTimelineEvent({
                type: 'compliance_analysis',
                date: new Date().toISOString().split('T')[0],
                source: 'compliance',
                title: 'Compliance Analysis Completed',
                description: `Compliance analysis completed for ${payload.carrier} in ${payload.state}`,
                metadata: {
                    state: payload.state,
                    carrier: payload.carrier,
                    claimType: payload.claimType,
                    hasDeadlines: !!data.statutoryDeadlines,
                    hasViolations: !!data.violationsLikelihood
                },
                claimId: claimId
            });
            
            // Add deadline events if detected
            if (data.statutoryDeadlines && typeof data.statutoryDeadlines === 'string') {
                // Try to extract deadline dates from the text
                const deadlineMatches = data.statutoryDeadlines.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/g);
                if (deadlineMatches && deadlineMatches.length > 0) {
                    for (const deadlineDate of deadlineMatches.slice(0, 5)) { // Limit to 5 deadlines
                        await addTimelineEvent({
                            type: 'deadline_statutory',
                            date: deadlineDate,
                            source: 'compliance',
                            title: 'Statutory Deadline Detected',
                            description: `Statutory deadline identified: ${deadlineDate}`,
                            metadata: {
                                deadlineType: 'statutory',
                                state: payload.state
                            },
                            claimId: claimId
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to add compliance timeline events:', error);
        }
    }
    
    // Setup action buttons
    function setupActionButtons() {
        // PDF Export
        const exportBtn = document.querySelector('.export-pdf-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                const targetSelector = exportBtn.getAttribute('data-export-target') || '#results-panel';
                const filename = exportBtn.getAttribute('data-export-filename') || 'compliance-report.pdf';
                
                try {
                    if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
                        await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
                    } else {
                        console.error('PDF export helper not available');
                        alert('PDF export is not available. Please refresh the page and try again.');
                    }
                } catch (err) {
                    console.error('Error exporting PDF', err);
                    alert('Failed to export PDF. Please try again.');
                }
            });
        }
        
        // Add to Claim Journal
        const addToJournalBtn = document.getElementById('add-to-journal-btn');
        if (addToJournalBtn) {
            addToJournalBtn.addEventListener('click', async () => {
                try {
                    // This would call a journal API endpoint
                    // For now, show a message
                    alert('Feature coming soon: This will add the compliance analysis to your Claim Journal.');
                } catch (err) {
                    console.error('Error adding to journal:', err);
                    alert('Failed to add to journal. Please try again.');
                }
            });
        }
        
        // Sync to Timeline
        const syncTimelineBtn = document.getElementById('sync-timeline-btn');
        if (syncTimelineBtn) {
            syncTimelineBtn.addEventListener('click', async () => {
                try {
                    // This would sync deadlines to the timeline
                    // For now, show a message
                    alert('Feature coming soon: This will sync deadlines to your Claim Timeline.');
                } catch (err) {
                    console.error('Error syncing timeline:', err);
                    alert('Failed to sync timeline. Please try again.');
                }
            });
        }
    }
});

/**
 * Update compliance dashboard with stats
 */
async function updateComplianceDashboard() {
    try {
        // Get Supabase client
        let getSupabaseClient;
        try {
            const authModule = await import('../auth.js');
            getSupabaseClient = authModule.getSupabaseClient;
        } catch (error) {
            console.warn('Failed to load auth module:', error);
            return;
        }
        
        const client = await getSupabaseClient();
        if (!client) return;
        
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;
        
        // Get active alerts count
        const { data: alerts } = await client
            .from('compliance_alerts')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .is('resolved_at', null);
        
        const activeAlertsCount = alerts?.length || 0;
        
        // Get high severity alerts
        const { data: highAlerts } = await client
            .from('compliance_alerts')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('severity', 'high')
            .is('resolved_at', null);
        
        const highSeverityCount = highAlerts?.length || 0;
        
        // Get deadlines count
        const { data: deadlines } = await client
            .from('deadlines')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('completed', false);
        
        const totalDeadlines = deadlines?.length || 0;
        
        // Get upcoming deadlines (next 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const { data: upcomingDeadlines } = await client
            .from('deadlines')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('completed', false)
            .gte('date', today.toISOString().split('T')[0])
            .lte('date', nextWeek.toISOString().split('T')[0]);
        
        const upcomingCount = upcomingDeadlines?.length || 0;
        
        // Render dashboard stats
        const dashboardStats = document.getElementById('dashboard-stats');
        const dashboard = document.getElementById('compliance-dashboard');
        
        if (dashboardStats && dashboard) {
            dashboardStats.innerHTML = `
                <div class="stat-card" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                    <div class="stat-number" style="font-size: 2rem; font-weight: 700; color: #ffffff !important;">${activeAlertsCount}</div>
                    <div class="stat-label" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7) !important;">Active Alerts</div>
                </div>
                <div class="stat-card" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                    <div class="stat-number" style="font-size: 2rem; font-weight: 700; color: #ef4444 !important;">${highSeverityCount}</div>
                    <div class="stat-label" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7) !important;">High Severity</div>
                </div>
                <div class="stat-card" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                    <div class="stat-number" style="font-size: 2rem; font-weight: 700; color: #ffffff !important;">${totalDeadlines}</div>
                    <div class="stat-label" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7) !important;">Total Deadlines</div>
                </div>
                <div class="stat-card" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                    <div class="stat-number" style="font-size: 2rem; font-weight: 700; color: #f59e0b !important;">${upcomingCount}</div>
                    <div class="stat-label" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7) !important;">Upcoming (7 days)</div>
                </div>
            `;
            
            dashboard.style.display = 'block';
        }
    } catch (error) {
        console.warn('Failed to update compliance dashboard:', error);
    }
}
