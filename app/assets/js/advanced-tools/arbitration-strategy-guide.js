/**
 * Arbitration Strategy Guide
 * Prepare for arbitration/appraisal proceedings
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('arbitration-form');
    const uploadAreaCarrier = document.getElementById('upload-area-carrier');
    const uploadAreaUser = document.getElementById('upload-area-user');
    const fileInputCarrier = document.getElementById('file-input-carrier');
    const fileInputUser = document.getElementById('file-input-user');
    const resultsPanel = document.getElementById('results-panel');
    
    // File upload handling
    uploadAreaCarrier.addEventListener('click', () => fileInputCarrier.click());
    uploadAreaUser.addEventListener('click', () => fileInputUser.click());
    
    fileInputCarrier.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], 'carrier');
        }
    });
    
    fileInputUser.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], 'user');
        }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInputCarrier.files[0] || !fileInputUser.files[0]) {
            alert('Please upload both estimates');
            return;
        }
        
        // Show loading
        resultsPanel.style.display = 'block';
        resultsPanel.classList.add('show');
        resultsPanel.innerHTML = '<p>Generating strategy guide...</p>';
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('carrierEstimate', fileInputCarrier.files[0]);
            uploadFormData.append('userEstimate', fileInputUser.files[0]);
            uploadFormData.append('disagreementDescription', document.getElementById('disagreement-description').value);
            uploadFormData.append('arbitrationType', document.getElementById('arbitration-type').value);
            
            const response = await fetch('/.netlify/functions/advanced-tools/arbitration-strategy-guide', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!response.ok) {
                throw new Error('Strategy guide generation failed');
            }
            
            const result = await response.json();
            displayResults(result);
            
            // Add timeline event
            await addAdvancedToolTimelineEvent('arbitration_strategy_generated', 'Arbitration Strategy Generated', result);
            
            // Add compliance section
            await addComplianceSectionToArbitration(result);
            
            // Generate compliance alerts after arbitration guide generation
            await triggerComplianceAlerts();
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'arbitration-strategy-guide.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

/**
 * Add compliance section to arbitration guide
 */
async function addComplianceSectionToArbitration(arbitrationResult) {
    try {
        const state = document.getElementById('state')?.value || '';
        const carrier = document.getElementById('carrier')?.value || '';
        const claimType = document.getElementById('claim-type')?.value || 'Property';
        
        if (!state || !carrier) return;
        
        const { analyzeCompliance } = await import('../utils/compliance-engine-helper.js');
        const complianceData = await analyzeCompliance({
            state,
            carrier,
            claimType,
            events: [{ name: 'Arbitration Strategy', date: new Date().toISOString().split('T')[0], description: 'Arbitration guide generated' }]
        });
        
        let complianceSection = document.getElementById('compliance-section');
        if (!complianceSection) {
            complianceSection = document.createElement('div');
            complianceSection.id = 'compliance-section';
            complianceSection.className = 'results-section';
            complianceSection.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0.5rem;';
            const resultsPanel = document.getElementById('results-panel');
            if (resultsPanel) resultsPanel.appendChild(complianceSection);
        }
        
        let html = '<h3 style="margin-top: 0; color: #ffffff !important;">Compliance & Rights Information</h3>';
        if (complianceData.statutoryDeadlines) {
            const arbitrationRights = extractArbitrationRights(complianceData.statutoryDeadlines);
            if (arbitrationRights) html += `<div style="margin-bottom: 1rem;"><strong>Arbitration Rights Triggered:</strong><p style="margin-top: 0.5rem;">${arbitrationRights}</p></div>`;
        }
        if (complianceData.statutoryDeadlines) {
            const timelines = extractTimelines(complianceData.statutoryDeadlines, 'arbitration');
            if (timelines) html += `<div style="margin-bottom: 1rem;"><strong>Timelines for Arbitration Rights:</strong><p style="margin-top: 0.5rem;">${timelines}</p></div>`;
        }
        if (complianceData.requiredDocuments) {
            html += `<div style="margin-bottom: 1rem;"><strong>Required Documentation:</strong><p style="margin-top: 0.5rem;">${complianceData.requiredDocuments.substring(0, 400)}...</p></div>`;
        }
        if (complianceData.statutoryDeadlines) {
            html += `<div style="margin-bottom: 1rem;"><strong>Statutory Support:</strong><p style="margin-top: 0.5rem; font-size: 0.9rem;">${complianceData.statutoryDeadlines.substring(0, 400)}...</p></div>`;
        }
        
        complianceSection.innerHTML = html;
    } catch (error) {
        console.error('Error adding compliance section:', error);
    }
}

function extractArbitrationRights(text) {
    if (!text) return null;
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.toLowerCase().includes('arbitration') && (line.includes('right') || line.includes('trigger'))) {
            return line.trim();
        }
    }
    return null;
}

function extractTimelines(text, type) {
    if (!text) return null;
    const lines = text.split('\n');
    const relevant = lines.filter(l => l.toLowerCase().includes(type) && (l.includes('day') || l.includes('hour')));
    return relevant.slice(0, 3).join('; ');
}

function handleFile(file, type) {
    const fileName = document.getElementById(`file-name-${type}`);
    const filePreview = document.getElementById(`file-preview-${type}`);
    
    fileName.textContent = file.name;
    filePreview.style.display = 'block';
}

function displayResults(result) {
    const strengthsContent = document.getElementById('strengths-content');
    const weaknessesContent = document.getElementById('weaknesses-content');
    const strategyContent = document.getElementById('strategy-content');
    const evidenceContent = document.getElementById('evidence-content');
    const outcomesContent = document.getElementById('outcomes-content');
    
    // Strengths
    if (result.strengths && result.strengths.length > 0) {
        strengthsContent.innerHTML = '<ul>';
        result.strengths.forEach(strength => {
            strengthsContent.innerHTML += `<li>${strength}</li>`;
        });
        strengthsContent.innerHTML += '</ul>';
    } else {
        strengthsContent.innerHTML = '<p>No strengths identified.</p>';
    }
    
    // Weaknesses
    if (result.weaknesses && result.weaknesses.length > 0) {
        weaknessesContent.innerHTML = '<ul>';
        result.weaknesses.forEach(weakness => {
            weaknessesContent.innerHTML += `<li>${weakness}</li>`;
        });
        weaknessesContent.innerHTML += '</ul>';
    } else {
        weaknessesContent.innerHTML = '<p>No weaknesses identified.</p>';
    }
    
    // Strategy plan
    if (result.strategyPlan) {
        strategyContent.innerHTML = `<p>${result.strategyPlan}</p>`;
    } else {
        strategyContent.innerHTML = '<p>No strategy plan available.</p>';
    }
    
    // Evidence needed
    if (result.evidenceNeeded && result.evidenceNeeded.length > 0) {
        evidenceContent.innerHTML = '<ul>';
        result.evidenceNeeded.forEach(evidence => {
            evidenceContent.innerHTML += `<li>${evidence}</li>`;
        });
        evidenceContent.innerHTML += '</ul>';
    } else {
        evidenceContent.innerHTML = '<p>No evidence list available.</p>';
    }
    
    // Expected outcomes
    if (result.expectedOutcomes) {
        outcomesContent.innerHTML = `<p>${result.expectedOutcomes}</p>`;
    } else {
        outcomesContent.innerHTML = '<p>No outcome predictions available.</p>';
    }
    
    // Re-attach export button
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'arbitration-strategy-guide.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
}

/**
 * Trigger compliance alerts after arbitration guide generation
 */
async function triggerComplianceAlerts() {
    try {
        const state = document.getElementById('state')?.value || '';
        const carrier = document.getElementById('carrier')?.value || '';
        const claimType = document.getElementById('claim-type')?.value || 'Property';
        
        if (!state || !carrier) return;
        
        const { generateAlerts } = await import('../utils/compliance-engine-helper.js');
        
        await generateAlerts(
            { state, carrier, claimType },
            [{ name: 'Arbitration Strategy Guide Generated', date: new Date().toISOString().split('T')[0], description: 'Arbitration guide created' }],
            [],
            '',
            []
        );
    } catch (error) {
        console.warn('Failed to trigger compliance alerts:', error);
    }
}

