/**
 * Regulatory Updates Monitor
 * Monitor state-specific regulatory updates
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('regulatory-form');
    const resultsPanel = document.getElementById('results-panel');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const state = document.getElementById('state-select').value;
        const category = document.getElementById('category-filter').value;
        
        if (!state) {
            alert('Please select a state');
            return;
        }
        
        // Show loading
        resultsPanel.style.display = 'block';
        resultsPanel.classList.add('show');
        resultsPanel.innerHTML = '<p>Fetching regulatory updates...</p>';
        
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/regulatory-updates-monitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ state, category })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch updates');
            }
            
            const result = await response.json();
            displayResults(result, state, category);
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Download PDF
    document.getElementById('download-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('download-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('download-pdf')?.getAttribute('data-export-filename') || 'regulatory-updates-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    // Save to journal
    document.getElementById('save-journal')?.addEventListener('click', () => {
        // TODO: Integrate with claim journal
        alert('Saving to Claim Journal...');
        window.location.href = '/app/claim-journal.html';
    });
});

function displayResults(result, state, category) {
    const resultsPanel = document.getElementById('results-panel');
    const updatesList = document.getElementById('updates-list');
    const aiSummary = document.getElementById('ai-summary');
    const aiSummaryContent = document.getElementById('ai-summary-content');
    
    // Display updates
    if (result.updates && result.updates.length > 0) {
        updatesList.innerHTML = '';
        result.updates.forEach(update => {
            const item = document.createElement('div');
            item.className = 'update-item';
            item.innerHTML = `
                <h3>${update.title || 'Regulatory Update'}</h3>
                <div class="meta">
                    <span>Category: ${update.category || 'N/A'}</span> | 
                    <span>State: ${state}</span>
                </div>
                <p>${update.summary || update.full_text || 'No summary available.'}</p>
            `;
            updatesList.appendChild(item);
        });
    } else {
        updatesList.innerHTML = '<p>No regulatory updates found for this state and category.</p>';
    }
    
    // Display AI summary
    if (result.aiNotes) {
        aiSummaryContent.innerHTML = `<p>${result.aiNotes}</p>`;
        aiSummary.style.display = 'block';
    } else {
        aiSummary.style.display = 'none';
    }
    
    // Re-attach event listeners
    document.getElementById('download-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('download-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('download-pdf')?.getAttribute('data-export-filename') || 'regulatory-updates-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    document.getElementById('save-journal')?.addEventListener('click', () => {
        alert('Saving to Claim Journal...');
        window.location.href = '/app/claim-journal.html';
    });
}

