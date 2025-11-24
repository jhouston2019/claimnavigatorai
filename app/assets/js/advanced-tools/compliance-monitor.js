/**
 * Compliance Monitor
 * Check carrier compliance with statutory requirements
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('compliance-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const resultsPanel = document.getElementById('results-panel');
    
    // File upload handling
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            carrierName: document.getElementById('carrier-name').value,
            eventType: document.getElementById('event-type').value,
            eventDate: document.getElementById('event-date').value
        };
        
        // Show loading
        resultsPanel.style.display = 'block';
        resultsPanel.classList.add('show');
        resultsPanel.innerHTML = '<p>Analyzing compliance...</p>';
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('carrierName', formData.carrierName);
            uploadFormData.append('eventType', formData.eventType);
            uploadFormData.append('eventDate', formData.eventDate);
            
            if (fileInput.files[0]) {
                uploadFormData.append('file', fileInput.files[0]);
            }
            
            const response = await fetch('/.netlify/functions/advanced-tools/compliance-monitor', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!response.ok) {
                throw new Error('Compliance check failed');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export report
    document.getElementById('export-report')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-report')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-report')?.getAttribute('data-export-filename') || 'compliance-monitor-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

function handleFile(file) {
    const fileName = document.getElementById('file-name');
    const filePreview = document.getElementById('file-preview');
    
    fileName.textContent = file.name;
    filePreview.style.display = 'block';
}

function displayResults(result) {
    const resultsPanel = document.getElementById('results-panel');
    const statutoryRule = document.getElementById('statutory-rule');
    const violationIndicator = document.getElementById('violation-indicator');
    const severityRating = document.getElementById('severity-rating');
    const recommendedAction = document.getElementById('recommended-action');
    
    // Statutory rule
    if (result.statutoryRule) {
        statutoryRule.innerHTML = `<p>${result.statutoryRule}</p>`;
    } else {
        statutoryRule.innerHTML = '<p>No statutory rule information available.</p>';
    }
    
    // Violation indicator
    violationIndicator.textContent = result.isViolation ? 'YES' : 'NO';
    violationIndicator.className = 'violation-indicator ' + (result.isViolation ? 'yes' : 'no');
    
    // Severity rating
    if (result.severity) {
        const severityClass = result.severity.toLowerCase();
        severityRating.innerHTML = `
            <span class="severity-badge ${severityClass}">${result.severity}</span>
        `;
    } else {
        severityRating.innerHTML = '<p>No severity rating available.</p>';
    }
    
    // Recommended action
    if (result.recommendedAction) {
        recommendedAction.innerHTML = `<p>${result.recommendedAction}</p>`;
    } else {
        recommendedAction.innerHTML = '<p>No recommendation available.</p>';
    }
    
    // Re-attach export button
    document.getElementById('export-report')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-report')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-report')?.getAttribute('data-export-filename') || 'compliance-monitor-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
}

