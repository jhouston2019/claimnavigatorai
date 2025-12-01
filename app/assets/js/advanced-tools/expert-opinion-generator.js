/**
 * Expert Opinion Generator
 * Generate professional expert opinions based on uploaded evidence
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expert-opinion-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const resultsContainer = document.getElementById('results-container');
    
    let uploadedFiles = [];
    
    // File upload handlers
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
    
    function handleFiles(files) {
        files.forEach(file => {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                uploadedFiles.push(file);
            }
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
        
        const situationDescription = document.getElementById('situation-description').value;
        const expertType = document.getElementById('expert-type').value;
        
        if (!situationDescription || !expertType) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Show loading
        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('show');
        resultsContainer.innerHTML = '<p>Generating expert opinion...</p>';
        
        try {
            // Upload files first if any
            let fileUrls = [];
            if (uploadedFiles.length > 0) {
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
            }
            
            // Generate expert opinion
            const response = await fetch('/.netlify/functions/advanced-tools/expert-opinion-generator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    situationDescription: situationDescription,
                    expertType: expertType,
                    fileUrls: fileUrls
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate expert opinion');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'expert-opinion.pdf';
        
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
    
    resultsContainer.innerHTML = `
        <h2>Expert Opinion</h2>
        
        <div class="opinion-section" id="cause-analysis">
            <h3>Cause Analysis</h3>
            <div id="cause-content">${formatText(result.causeAnalysis || 'No cause analysis available.')}</div>
        </div>
        
        <div class="opinion-section" id="severity-assessment">
            <h3>Severity Assessment</h3>
            <div id="severity-content">${formatText(result.severityAssessment || 'No severity assessment available.')}</div>
        </div>
        
        <div class="opinion-section" id="documentation-requirements">
            <h3>Documentation Requirements</h3>
            <div id="documentation-content">${formatText(result.documentationRequirements || 'No documentation requirements available.')}</div>
        </div>
        
        <div class="opinion-section" id="recommendations">
            <h3>Recommendations</h3>
            <div id="recommendations-content">${formatText(result.recommendations || 'No recommendations available.')}</div>
        </div>
        
        <div style="margin-top: 2rem;">
            <button class="btn btn-secondary export-pdf-btn" id="export-pdf" data-export-target="#results-container" data-export-filename="expert-opinion.pdf">Export PDF</button>
        </div>
    `;
    
    // Re-attach PDF export handler
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'expert-opinion.pdf';
        
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


