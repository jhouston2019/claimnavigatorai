/**
 * Mediation / Arbitration Evidence Organizer
 * Organize and prepare evidence packages for dispute resolution
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('evidence-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const evidenceGridContainer = document.getElementById('evidence-grid-container');
    const evidenceGrid = document.getElementById('evidence-grid');
    const resultsContainer = document.getElementById('results-container');
    
    let uploadedFiles = [];
    
    // File upload handlers
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
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
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
    
    function handleFiles(files) {
        files.forEach(file => {
            uploadedFiles.push(file);
        });
        
        updateFileList();
    }
    
    function updateFileList() {
        if (uploadedFiles.length === 0) {
            fileList.innerHTML = '';
            return;
        }
        
        let html = '<strong>Uploaded files:</strong><ul style="margin-top: 0.5rem; padding-left: 1.5rem;">';
        uploadedFiles.forEach((file, index) => {
            html += `<li>${escapeHtml(file.name)} <button type="button" class="btn btn-secondary btn-small" style="padding: 0.25rem 0.5rem; margin-left: 0.5rem;" data-file-index="${index}">Remove</button></li>`;
        });
        html += '</ul>';
        
        fileList.innerHTML = html;
        
        // Add remove handlers
        fileList.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-file-index'));
                uploadedFiles.splice(index, 1);
                updateFileList();
            });
        });
    }
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const disputeType = document.getElementById('dispute-type').value;
        
        if (!disputeType) {
            alert('Please select a dispute type.');
            return;
        }
        
        if (uploadedFiles.length === 0) {
            alert('Please upload at least one evidence file.');
            return;
        }
        
        // Show loading
        evidenceGridContainer.style.display = 'block';
        evidenceGrid.innerHTML = '<p>Processing evidence...</p>';
        resultsContainer.style.display = 'none';
        
        try {
            // Upload files
            const fileUrls = [];
            for (const file of uploadedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadResponse = await fetch('/.netlify/functions/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    fileUrls.push(uploadResult.url);
                }
            }
            
            // Generate evidence package
            const response = await fetch('/.netlify/functions/advanced-tools/mediation-arbitration-evidence-organizer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    disputeType: disputeType,
                    fileUrls: fileUrls
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate evidence package');
            }
            
            const result = await response.json();
            displayEvidenceGrid(result.tags || []);
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            evidenceGrid.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'evidence-package.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

function displayEvidenceGrid(tags) {
    const evidenceGrid = document.getElementById('evidence-grid');
    
    if (!tags || tags.length === 0) {
        evidenceGrid.innerHTML = '<p>No evidence items to display.</p>';
        return;
    }
    
    let html = '';
    tags.forEach((tag, index) => {
        html += `
            <div class="evidence-item">
                <strong>${escapeHtml(tag.fileName || `File ${index + 1}`)}</strong>
                <div style="margin-top: 0.5rem;">
                    ${(tag.categories || []).map(cat => `<span class="tag">${escapeHtml(cat)}</span>`).join('')}
                </div>
                <div class="relevance">
                    <strong>Relevance:</strong> ${escapeHtml(tag.relevance || 'N/A')}
                </div>
                <div class="severity">
                    <strong>Severity:</strong> ${escapeHtml(tag.severity || 'N/A')}
                </div>
            </div>
        `;
    });
    
    evidenceGrid.innerHTML = html;
}

function displayResults(result) {
    const resultsContainer = document.getElementById('results-container');
    
    resultsContainer.style.display = 'block';
    resultsContainer.classList.add('show');
    
    let html = '<h2>Evidence Package</h2>';
    
    // Exhibits
    if (result.exhibits) {
        html += `
            <div class="package-section" id="exhibits">
                <h3>Exhibits</h3>
                <div id="exhibits-content">${formatText(result.exhibits)}</div>
            </div>
        `;
    }
    
    // Chronology
    if (result.chronology) {
        html += `
            <div class="package-section" id="chronology">
                <h3>Chronology</h3>
                <div id="chronology-content">${formatText(result.chronology)}</div>
            </div>
        `;
    }
    
    // Arguments
    if (result.arguments) {
        html += `
            <div class="package-section" id="arguments">
                <h3>Key Arguments</h3>
                <div id="arguments-content">${formatText(result.arguments)}</div>
            </div>
        `;
    }
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-secondary export-pdf-btn" id="export-pdf" data-export-target="#results-container" data-export-filename="evidence-package.pdf">Export PDF</button>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
    
    // Re-attach PDF export handler
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'evidence-package.pdf';
        
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


