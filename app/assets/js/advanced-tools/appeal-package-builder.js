/**
 * Appeal Package Builder
 * Generate comprehensive appeal packages
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appeal-form');
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
        
        if (!fileInput.files[0]) {
            alert('Please upload the denial letter');
            return;
        }
        
        // Show loading
        resultsPanel.style.display = 'block';
        resultsPanel.classList.add('show');
        resultsPanel.innerHTML = '<p>Generating appeal package...</p>';
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', fileInput.files[0]);
            uploadFormData.append('claimDetails', document.getElementById('claim-details').value);
            uploadFormData.append('disputedItems', document.getElementById('disputed-items').value);
            uploadFormData.append('evidenceLinks', document.getElementById('evidence-links').value);
            
            const response = await fetch('/.netlify/functions/advanced-tools/appeal-package-builder', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!response.ok) {
                throw new Error('Appeal package generation failed');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export PDF
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        // TODO: Implement PDF export
        alert('PDF export coming soon');
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
    const summaryContent = document.getElementById('summary-content');
    const legalContent = document.getElementById('legal-content');
    const evidenceContent = document.getElementById('evidence-content');
    const actionContent = document.getElementById('action-content');
    
    // Appeal summary
    if (result.appealSummary) {
        summaryContent.innerHTML = `<p>${result.appealSummary}</p>`;
    } else {
        summaryContent.innerHTML = '<p>No summary available.</p>';
    }
    
    // Legal basis
    if (result.legalBasis) {
        legalContent.innerHTML = `<p>${result.legalBasis}</p>`;
    } else {
        legalContent.innerHTML = '<p>No legal basis information available.</p>';
    }
    
    // Evidence appendix
    if (result.evidenceList && result.evidenceList.length > 0) {
        evidenceContent.innerHTML = '<ul>';
        result.evidenceList.forEach(item => {
            evidenceContent.innerHTML += `<li>${item}</li>`;
        });
        evidenceContent.innerHTML += '</ul>';
    } else {
        evidenceContent.innerHTML = '<p>No evidence list available.</p>';
    }
    
    // Corrective action
    if (result.correctiveAction) {
        actionContent.innerHTML = `<p>${result.correctiveAction}</p>`;
    } else {
        actionContent.innerHTML = '<p>No corrective action specified.</p>';
    }
    
    // Re-attach export button
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        alert('PDF export coming soon');
    });
}

