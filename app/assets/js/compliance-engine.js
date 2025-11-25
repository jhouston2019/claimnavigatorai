/**
 * Compliance Engine
 * Comprehensive compliance and bad faith risk analysis
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('compliance-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const resultsPanel = document.getElementById('compliance-results');
    const loadingIndicator = document.getElementById('loading-indicator');
    const runAuditBtn = document.getElementById('run-audit-btn');
    const fileList = document.getElementById('file-list');
    
    let uploadedFiles = [];
    
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
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    });
    
    function handleFiles(files) {
        files.forEach(file => {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                uploadedFiles.push(file);
                displayFile(file);
            }
        });
    }
    
    function displayFile(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>📄 ${file.name}</span>
            <button type="button" style="float: right; background: rgba(239, 68, 68, 0.3); border: none; color: #ffffff; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer;" onclick="this.parentElement.remove(); uploadedFiles = uploadedFiles.filter(f => f.name !== '${file.name}');">
                Remove
            </button>
        `;
        fileList.appendChild(fileItem);
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        runAuditBtn.disabled = true;
        loadingIndicator.classList.add('show');
        resultsPanel.classList.remove('show');
        
        try {
            // Build payload
            const payload = {
                state: document.getElementById('state').value,
                carrier: document.getElementById('carrier').value,
                claimType: document.getElementById('claim-type').value,
                claimReference: document.getElementById('claim-reference').value || null,
                timelineSummaryText: document.getElementById('timeline-summary').value || '',
                includeBadFaith: document.getElementById('include-bad-faith').checked,
                includeDeadlines: document.getElementById('include-deadlines').checked,
                includeDocsCheck: document.getElementById('include-docs-check').checked,
                generateEscalation: document.getElementById('generate-escalation').checked
            };
            
            // For now, we'll send file metadata only
            // In a production system, files would be uploaded to S3/Supabase first
            if (uploadedFiles.length > 0) {
                payload.fileCount = uploadedFiles.length;
                payload.fileNames = uploadedFiles.map(f => f.name);
            }
            
            // Call Netlify function
            const response = await fetch('/.netlify/functions/compliance-engine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Render results
            renderResults(data);
            
            // Show results panel
            resultsPanel.classList.add('show');
            
        } catch (error) {
            console.error('Compliance audit error:', error);
            alert('Compliance audit failed. Please try again. Error: ' + error.message);
        } finally {
            runAuditBtn.disabled = false;
            loadingIndicator.classList.remove('show');
        }
    });
    
    function renderResults(data) {
        // Overall Summary
        const overallSummaryEl = document.getElementById('overall-summary');
        if (data.overallSummary) {
            overallSummaryEl.innerHTML = `<p>${formatText(data.overallSummary)}</p>`;
        } else {
            overallSummaryEl.innerHTML = '<p>No summary available.</p>';
        }
        
        // Timeline Findings
        const timelineFindingsEl = document.getElementById('timeline-findings');
        if (data.timelineFindings) {
            timelineFindingsEl.innerHTML = `<p>${formatText(data.timelineFindings)}</p>`;
        } else {
            timelineFindingsEl.innerHTML = '<p>No timeline findings available.</p>';
        }
        
        // Deadline Analysis
        const deadlineAnalysisEl = document.getElementById('deadline-analysis');
        if (data.deadlineAnalysis) {
            deadlineAnalysisEl.innerHTML = `<p>${formatText(data.deadlineAnalysis)}</p>`;
        } else {
            deadlineAnalysisEl.innerHTML = '<p>No deadline analysis available.</p>';
        }
        
        // Bad Faith Concerns
        const badFaithEl = document.getElementById('bad-faith-concern-summary');
        if (data.badFaithConcernSummary) {
            badFaithEl.innerHTML = `<p>${formatText(data.badFaithConcernSummary)}</p>`;
        } else {
            badFaithEl.innerHTML = '<p>No bad faith concerns identified.</p>';
        }
        
        // Compliance Findings
        const complianceFindingsEl = document.getElementById('compliance-findings');
        if (data.complianceFindings) {
            complianceFindingsEl.innerHTML = `<p>${formatText(data.complianceFindings)}</p>`;
        } else {
            complianceFindingsEl.innerHTML = '<p>No compliance findings available.</p>';
        }
        
        // Carrier Behavior Patterns
        const carrierBehaviorEl = document.getElementById('carrier-behavior-patterns');
        if (data.carrierBehaviorPatterns) {
            carrierBehaviorEl.innerHTML = `<p>${formatText(data.carrierBehaviorPatterns)}</p>`;
        } else {
            carrierBehaviorEl.innerHTML = '<p>No carrier behavior patterns identified.</p>';
        }
        
        // Documentation Gaps
        const documentationGapsEl = document.getElementById('documentation-gaps');
        if (data.documentationGaps) {
            documentationGapsEl.innerHTML = `<p>${formatText(data.documentationGaps)}</p>`;
        } else {
            documentationGapsEl.innerHTML = '<p>No documentation gaps identified.</p>';
        }
        
        // Recommended Actions
        const recommendedActionsEl = document.getElementById('recommended-actions');
        if (data.recommendedActions) {
            recommendedActionsEl.innerHTML = `<p>${formatText(data.recommendedActions)}</p>`;
        } else {
            recommendedActionsEl.innerHTML = '<p>No recommended actions available.</p>';
        }
    }
    
    function formatText(text) {
        if (!text) return '';
        // Convert newlines to <br> and preserve formatting
        return text
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
    
    // PDF Export
    const exportBtn = document.querySelector('.export-pdf-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const targetSelector = exportBtn.getAttribute('data-export-target') || '#compliance-results';
            const filename = exportBtn.getAttribute('data-export-filename') || 'claim-compliance-report.pdf';
            
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
});

