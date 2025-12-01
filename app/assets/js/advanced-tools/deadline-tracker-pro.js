/**
 * Deadline Tracker Pro
 * Track and analyze deadlines for claims
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('deadline-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const eventsList = document.getElementById('events-list');
    const addEventBtn = document.getElementById('add-event');
    const resultsContainer = document.getElementById('results-container');
    
    let policyFile = null;
    
    // File upload handlers
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            policyFile = e.target.files[0];
            fileName.textContent = policyFile.name;
            filePreview.style.display = 'block';
        }
    });
    
    // Add event
    addEventBtn.addEventListener('click', () => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.innerHTML = `
            <input type="date" class="event-date" placeholder="Date">
            <input type="text" class="event-description" placeholder="Event description">
            <button type="button" class="btn btn-secondary btn-small remove-event">Remove</button>
        `;
        
        eventItem.querySelector('.remove-event').addEventListener('click', () => {
            eventItem.remove();
        });
        
        eventsList.appendChild(eventItem);
    });
    
    // Remove event handlers
    document.querySelectorAll('.remove-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.event-item').remove();
        });
    });
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const carrier = document.getElementById('carrier-select').value;
        const state = document.getElementById('state-select').value;
        
        if (!carrier || !state) {
            alert('Please fill in carrier and state.');
            return;
        }
        
        // Collect events
        const events = [];
        document.querySelectorAll('.event-item').forEach(item => {
            const date = item.querySelector('.event-date').value;
            const description = item.querySelector('.event-description').value;
            if (date && description) {
                events.push({ date, description });
            }
        });
        
        // Show loading
        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('show');
        resultsContainer.innerHTML = '<p>Analyzing deadlines...</p>';
        
        try {
            // Upload policy file if provided
            let policyUrl = null;
            if (policyFile) {
                const formData = new FormData();
                formData.append('file', policyFile);
                
                const uploadResponse = await fetch('/.netlify/functions/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    policyUrl = uploadResult.url;
                }
            }
            
            // Analyze deadlines
            const response = await fetch('/.netlify/functions/advanced-tools/deadline-tracker-pro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: carrier,
                    state: state,
                    events: events,
                    policyUrl: policyUrl
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to analyze deadlines');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Add to calendar
    document.getElementById('add-calendar')?.addEventListener('click', () => {
        // TODO: Implement calendar integration
        alert('Calendar integration coming soon');
    });
    
    // Send email reminder
    document.getElementById('send-reminder')?.addEventListener('click', () => {
        // TODO: Implement email reminder
        alert('Email reminder feature coming soon');
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'deadline-tracker-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

function displayResults(result) {
    const resultsContainer = document.getElementById('results-container');
    
    let html = '<h2>Deadline Analysis</h2>';
    
    // Statutory deadlines
    if (result.statutoryDeadlines && result.statutoryDeadlines.length > 0) {
        html += '<div id="statutory-deadlines">';
        html += '<h3 style="margin-top: 0;">Statutory Deadlines</h3>';
        result.statutoryDeadlines.forEach(deadline => {
            html += `
                <div class="deadline-item">
                    <strong>${escapeHtml(deadline.title || 'Deadline')}</strong>
                    <p style="margin: 0.5rem 0 0 0;">${escapeHtml(deadline.description || '')}</p>
                    <p style="margin: 0.5rem 0 0 0;"><strong>Due Date:</strong> ${escapeHtml(deadline.dueDate || 'N/A')}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Carrier patterns
    if (result.carrierPatterns) {
        html += '<div id="carrier-patterns" style="margin-top: 2rem;">';
        html += '<h3>Carrier Patterns</h3>';
        html += `<div style="line-height: 1.8;">${formatText(result.carrierPatterns)}</div>`;
        html += '</div>';
    }
    
    // Policy deadlines
    if (result.policyDeadlines && result.policyDeadlines.length > 0) {
        html += '<div id="policy-deadlines" style="margin-top: 2rem;">';
        html += '<h3>Policy Deadlines</h3>';
        result.policyDeadlines.forEach(deadline => {
            html += `
                <div class="deadline-item">
                    <strong>${escapeHtml(deadline.title || 'Deadline')}</strong>
                    <p style="margin: 0.5rem 0 0 0;">${escapeHtml(deadline.description || '')}</p>
                    <p style="margin: 0.5rem 0 0 0;"><strong>Due Date:</strong> ${escapeHtml(deadline.dueDate || 'N/A')}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Red flags
    if (result.redFlags && result.redFlags.length > 0) {
        html += '<div id="red-flags" style="margin-top: 2rem;">';
        html += '<h3>Red Flag Alerts</h3>';
        result.redFlags.forEach(flag => {
            html += `
                <div class="deadline-item red-flag">
                    <strong>⚠️ ${escapeHtml(flag.title || 'Alert')}</strong>
                    <p style="margin: 0.5rem 0 0 0;">${escapeHtml(flag.description || '')}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += `
        <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="add-calendar">Add to Calendar</button>
            <button class="btn btn-primary" id="send-reminder">Send Email Reminder</button>
            <button class="btn btn-secondary export-pdf-btn" id="export-pdf" data-export-target="#results-container" data-export-filename="deadline-tracker-report.pdf">Export PDF</button>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
    
    // Re-attach handlers
    document.getElementById('add-calendar')?.addEventListener('click', () => {
        alert('Calendar integration coming soon');
    });
    
    document.getElementById('send-reminder')?.addEventListener('click', () => {
        alert('Email reminder feature coming soon');
    });
    
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'deadline-tracker-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
}

function formatText(text) {
    if (!text) return '';
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


