/**
 * Mediation Preparation Kit
 * Prepare for mediation with comprehensive strategy
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mediation-form');
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
        
        // Show loading
        resultsPanel.style.display = 'block';
        resultsPanel.classList.add('show');
        resultsPanel.innerHTML = '<p>Building mediation kit...</p>';
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('disputeDescription', document.getElementById('dispute-description').value);
            uploadFormData.append('mediationType', document.getElementById('mediation-type').value);
            
            if (fileInput.files[0]) {
                uploadFormData.append('file', fileInput.files[0]);
            }
            
            const response = await fetch('/.netlify/functions/advanced-tools/mediation-preparation-kit', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!response.ok) {
                throw new Error('Mediation kit generation failed');
            }
            
            const result = await response.json();
            displayResults(result);
            
            // Add timeline event
            await addAdvancedToolTimelineEvent('mediation_plan_generated', 'Mediation Plan Generated', result);
            
            // Add compliance section
            await addComplianceSectionToMediation(result);
            
            // Generate compliance alerts after mediation kit generation
            await triggerComplianceAlerts();
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'mediation-preparation-kit.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

/**
 * Add compliance section to mediation kit
 */
async function addComplianceSectionToMediation(mediationResult) {
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
            events: [{ name: 'Mediation Preparation', date: new Date().toISOString().split('T')[0], description: 'Mediation kit generated' }]
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
            const mediationRights = extractMediationRights(complianceData.statutoryDeadlines);
            if (mediationRights) html += `<div style="margin-bottom: 1rem;"><strong>Mediation Rights Triggered:</strong><p style="margin-top: 0.5rem;">${mediationRights}</p></div>`;
        }
        if (complianceData.statutoryDeadlines) {
            const timelines = extractTimelines(complianceData.statutoryDeadlines, 'mediation');
            if (timelines) html += `<div style="margin-bottom: 1rem;"><strong>Timelines for Mediation Rights:</strong><p style="margin-top: 0.5rem;">${timelines}</p></div>`;
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

/**
 * Trigger compliance alerts after mediation kit generation
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
            [{ name: 'Mediation Preparation Kit Generated', date: new Date().toISOString().split('T')[0], description: 'Mediation kit created' }],
            [],
            '',
            []
        );
    } catch (error) {
        console.warn('Failed to trigger compliance alerts:', error);
    }
}

function extractMediationRights(text) {
    if (!text) return null;
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.toLowerCase().includes('mediation') && (line.includes('right') || line.includes('trigger'))) {
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

function handleFile(file) {
    const fileName = document.getElementById('file-name');
    const filePreview = document.getElementById('file-preview');
    
    fileName.textContent = file.name;
    filePreview.style.display = 'block';
}

function displayResults(result) {
    const openingContent = document.getElementById('opening-content');
    const evidenceContent = document.getElementById('evidence-content');
    const weaknessContent = document.getElementById('weakness-content');
    const settlementContent = document.getElementById('settlement-content');
    const questionsContent = document.getElementById('questions-content');
    const tacticsContent = document.getElementById('tactics-content');
    
    // Opening statement
    if (result.openingStatement) {
        openingContent.innerHTML = `<p>${result.openingStatement}</p>`;
    } else {
        openingContent.innerHTML = '<p>No opening statement available.</p>';
    }
    
    // Key evidence
    if (result.keyEvidence && result.keyEvidence.length > 0) {
        evidenceContent.innerHTML = '<ul>';
        result.keyEvidence.forEach(item => {
            evidenceContent.innerHTML += `<li>${item}</li>`;
        });
        evidenceContent.innerHTML += '</ul>';
    } else {
        evidenceContent.innerHTML = '<p>No evidence list available.</p>';
    }
    
    // Weakness analysis
    if (result.weaknessAnalysis) {
        weaknessContent.innerHTML = `<p>${result.weaknessAnalysis}</p>`;
    } else {
        weaknessContent.innerHTML = '<p>No weakness analysis available.</p>';
    }
    
    // Settlement range
    if (result.settlementRange) {
        settlementContent.innerHTML = `<p>${result.settlementRange}</p>`;
    } else {
        settlementContent.innerHTML = '<p>No settlement range available.</p>';
    }
    
    // Questions to ask
    if (result.questions && result.questions.length > 0) {
        questionsContent.innerHTML = '<ul>';
        result.questions.forEach(q => {
            questionsContent.innerHTML += `<li>${q}</li>`;
        });
        questionsContent.innerHTML += '</ul>';
    } else {
        questionsContent.innerHTML = '<p>No questions available.</p>';
    }
    
    // Carrier tactics
    if (result.carrierTactics && result.carrierTactics.length > 0) {
        tacticsContent.innerHTML = '<ul>';
        result.carrierTactics.forEach(tactic => {
            tacticsContent.innerHTML += `<li>${tactic}</li>`;
        });
        tacticsContent.innerHTML += '</ul>';
    } else {
        tacticsContent.innerHTML = '<p>No tactics information available.</p>';
    }
    
    // Re-attach export button
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'mediation-preparation-kit.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
}

