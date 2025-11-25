/**
 * Appeal Package Builder
 * Generate comprehensive appeal packages
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Load compliance helper dynamically
    let analyzeCompliance, generateAlerts;
    try {
        const module = await import('../utils/compliance-engine-helper.js');
        analyzeCompliance = module.analyzeCompliance;
        generateAlerts = module.generateAlerts;
    } catch (error) {
        console.warn('Compliance helper not available:', error);
        analyzeCompliance = async () => ({ violationsLikelihood: {}, requiredDocuments: '', statutoryDeadlines: '', recommendedActions: {} });
        generateAlerts = async () => ({ alerts: [] });
    }
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
            
            // Add timeline event
            await addAdvancedToolTimelineEvent('appeal_package_generated', 'Appeal Package Generated', result);
            
            // Get compliance violations and add to appeal package
            await addComplianceViolationsToAppeal(result);
            
            // Generate compliance alerts after appeal generation
            await triggerComplianceAlerts();
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'appeal-package.pdf';
        
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
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'appeal-package.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
}

/**
 * Add compliance violations section to appeal package
 */
async function addComplianceViolationsToAppeal(appealResult) {
    // Dynamically import compliance helper
    let analyzeCompliance;
    try {
        const module = await import('../utils/compliance-engine-helper.js');
        analyzeCompliance = module.analyzeCompliance;
    } catch (error) {
        console.warn('Compliance helper not available:', error);
        return;
    }
    try {
        // Try to get state/carrier from form or intake data
        const state = document.getElementById('state')?.value || '';
        const carrier = document.getElementById('carrier')?.value || '';
        const claimType = document.getElementById('claim-type')?.value || 'Property';
        
        if (!state || !carrier) {
            // Skip if we don't have state/carrier
            return;
        }
        
        // Get compliance analysis
        const complianceData = await analyzeCompliance({
            state,
            carrier,
            claimType,
            events: [{
                name: 'Appeal Package Generated',
                date: new Date().toISOString().split('T')[0],
                description: 'Appeal package created for denial'
            }]
        });
        
        // Find or create compliance violations section
        let violationsSection = document.getElementById('compliance-violations-section');
        if (!violationsSection) {
            violationsSection = document.createElement('div');
            violationsSection.id = 'compliance-violations-section';
            violationsSection.className = 'results-section';
            violationsSection.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem;';
            
            const resultsPanel = document.getElementById('results-panel');
            if (resultsPanel) {
                resultsPanel.appendChild(violationsSection);
            }
        }
        
        // Build compliance violations HTML
        let html = '<h3 style="margin-top: 0; color: #ffffff !important;">Compliance Violations Summary</h3>';
        
        if (complianceData.violationsLikelihood) {
            if (complianceData.violationsLikelihood.possibleViolations) {
                html += `<div style="margin-bottom: 1rem;"><strong>Possible Violations:</strong><p style="margin-top: 0.5rem;">${complianceData.violationsLikelihood.possibleViolations}</p></div>`;
            }
            
            if (complianceData.violationsLikelihood.missedDeadlines) {
                html += `<div style="margin-bottom: 1rem;"><strong>Missed Deadlines:</strong><p style="margin-top: 0.5rem;">${complianceData.violationsLikelihood.missedDeadlines}</p></div>`;
            }
        }
        
        if (complianceData.requiredDocuments) {
            html += `<div style="margin-bottom: 1rem;"><strong>Required Documents Not Provided:</strong><p style="margin-top: 0.5rem;">${complianceData.requiredDocuments}</p></div>`;
        }
        
        if (complianceData.statutoryDeadlines) {
            html += `<div style="margin-bottom: 1rem;"><strong>Statutory Citations:</strong><p style="margin-top: 0.5rem; font-size: 0.9rem;">${complianceData.statutoryDeadlines.substring(0, 500)}...</p></div>`;
        }
        
        if (complianceData.recommendedActions && complianceData.recommendedActions.escalationPaths) {
            html += `<div style="margin-bottom: 1rem;"><strong>Suggested Escalation Pathways:</strong><p style="margin-top: 0.5rem;">${complianceData.recommendedActions.escalationPaths}</p></div>`;
        }
        
        violationsSection.innerHTML = html;
        
    } catch (error) {
        console.error('Error adding compliance violations:', error);
        // Don't block appeal package display if compliance check fails
    }
}

/**
 * Trigger compliance alerts after appeal generation
 */
async function triggerComplianceAlerts() {
    try {
        const state = document.getElementById('state')?.value || '';
        const carrier = document.getElementById('carrier')?.value || '';
        const claimType = document.getElementById('claim-type')?.value || 'Property';
        
        if (!state || !carrier || !generateAlerts) return;
        
        await generateAlerts(
            { state, carrier, claimType },
            [{ name: 'Appeal Package Generated', date: new Date().toISOString().split('T')[0], description: 'Appeal package created' }],
            [],
            '',
            []
        );
    } catch (error) {
        console.warn('Failed to trigger compliance alerts:', error);
    }
}

/**
 * Add timeline event for advanced tool usage
 */
async function addAdvancedToolTimelineEvent(eventType, title, result) {
    try {
        const { addTimelineEvent } = await import('../../utils/timeline-autosync.js');
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        
        await addTimelineEvent({
            type: eventType,
            date: new Date().toISOString().split('T')[0],
            source: 'advanced-tool',
            title: title,
            description: `Generated using ${title}`,
            metadata: {
                toolName: 'appeal-package-builder',
                hasResult: !!result
            },
            claimId: claimId
        });
    } catch (error) {
        console.warn('Failed to add advanced tool timeline event:', error);
    }
}

