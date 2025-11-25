/**
 * Bad Faith Evidence Tracker
 * Systematically document and organize evidence of bad faith practices
 */

let events = [];

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bad-faith-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    
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
        Array.from(files).forEach(file => handleFile(file));
    });
    
    fileInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => handleFile(file));
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            date: document.getElementById('event-date').value,
            event: document.getElementById('event-description').value,
            category: document.getElementById('carrier-action').value,
            files: Array.from(fileInput.files)
        };
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('date', formData.date);
            uploadFormData.append('event', formData.event);
            uploadFormData.append('category', formData.category);
            
            formData.files.forEach((file, index) => {
                uploadFormData.append(`file_${index}`, file);
            });
            
            const response = await fetch('/.netlify/functions/advanced-tools/bad-faith-evidence-tracker', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!response.ok) {
                throw new Error('Analysis failed');
            }
            
            const result = await response.json();
            displayAnalysis(result);
            addEventToTimeline(result);
            
            // Run compliance violation check
            await runComplianceViolationCheck(result);
            
            // Generate compliance alerts after bad faith event
            await triggerComplianceAlerts(result);
            
            // Reset form
            form.reset();
            fileList.innerHTML = '';
            fileInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            alert('Error analyzing event: ' + error.message);
        }
    });
    
    // Export report
    document.getElementById('export-report')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-report')?.getAttribute('data-export-target') || '#timeline-panel';
        const filename = document.getElementById('export-report')?.getAttribute('data-export-filename') || 'bad-faith-evidence-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

function handleFile(file) {
    const fileList = document.getElementById('file-list');
    const fileItem = document.createElement('div');
    fileItem.textContent = `✓ ${file.name}`;
    fileItem.style.marginBottom = '0.25rem';
    fileList.appendChild(fileItem);
}

async function displayAnalysis(result) {
    const analysisPanel = document.getElementById('analysis-panel');
    const riskScore = document.getElementById('risk-score');
    const severityDisplay = document.getElementById('severity-display');
    const aiNotes = document.getElementById('ai-notes');
    
    // Add timeline event
    await addAdvancedToolTimelineEvent('bad_faith_event_logged', 'Bad Faith Event Logged', result);
    
    // Update risk score
    riskScore.textContent = result.score || 0;
    riskScore.className = 'risk-score';
    if (result.score >= 70) {
        riskScore.classList.add('high');
    } else if (result.score >= 40) {
        riskScore.classList.add('medium');
    } else {
        riskScore.classList.add('low');
    }
    
    // Display severity
    if (result.severity) {
        severityDisplay.innerHTML = `<p><strong>Severity:</strong> ${result.severity}</p>`;
    }
    
    // Display AI notes
    if (result.aiNotes) {
        aiNotes.innerHTML = `<p>${result.aiNotes}</p>`;
    }
    
    analysisPanel.style.display = 'block';
}

/**
 * Run compliance violation check on bad faith event
 */
async function runComplianceViolationCheck(badFaithResult) {
    try {
        // Get state/carrier from form or intake
        const state = document.getElementById('state')?.value || '';
        const carrier = document.getElementById('carrier')?.value || '';
        const claimType = document.getElementById('claim-type')?.value || 'Property';
        
        if (!state || !carrier) {
            return; // Skip if no state/carrier
        }
        
        // Import compliance helper
        const { analyzeCompliance } = await import('../utils/compliance-engine-helper.js');
        
        // Check for compliance violations
        const complianceData = await analyzeCompliance({
            state,
            carrier,
            claimType,
            events: [{
                name: badFaithResult.category || 'Bad Faith Event',
                date: badFaithResult.date || new Date().toISOString().split('T')[0],
                description: badFaithResult.event || 'Bad faith evidence tracked'
            }]
        });
        
        // Update risk score with compliance data
        if (complianceData.violationsLikelihood && complianceData.violationsLikelihood.severityScoring) {
            const complianceRisk = extractComplianceRiskScore(complianceData.violationsLikelihood.severityScoring);
            if (complianceRisk > 0) {
                badFaithResult.complianceRiskScore = complianceRisk;
                badFaithResult.combinedRiskScore = Math.min(100, (badFaithResult.score || 0) + complianceRisk);
            }
        }
        
        // Display compliance warnings
        displayComplianceWarnings(complianceData);
        
    } catch (error) {
        console.error('Compliance violation check error:', error);
    }
}

/**
 * Trigger compliance alerts after bad faith event
 */
async function triggerComplianceAlerts(badFaithResult) {
    try {
        const state = document.getElementById('state')?.value || '';
        const carrier = document.getElementById('carrier')?.value || '';
        const claimType = document.getElementById('claim-type')?.value || 'Property';
        
        if (!state || !carrier) return;
        
        const { generateAlerts } = await import('../utils/compliance-engine-helper.js');
        
        await generateAlerts(
            { state, carrier, claimType },
            [{
                name: badFaithResult.category || 'Bad Faith Event',
                date: document.getElementById('event-date')?.value || new Date().toISOString().split('T')[0],
                description: badFaithResult.event || badFaithResult.description || ''
            }],
            [],
            '',
            []
        );
    } catch (error) {
        console.warn('Failed to trigger compliance alerts:', error);
    }
}

function extractComplianceRiskScore(severityScoringText) {
    if (!severityScoringText) return 0;
    const text = severityScoringText.toLowerCase();
    if (text.includes('high') || text.includes('severe')) return 30;
    if (text.includes('medium') || text.includes('moderate')) return 15;
    if (text.includes('low') || text.includes('minor')) return 5;
    return 0;
}

function displayComplianceWarnings(complianceData) {
    const analysisPanel = document.getElementById('analysis-panel');
    if (!analysisPanel) return;
    
    let warningsHTML = '';
    if (complianceData.violationsLikelihood) {
        if (complianceData.violationsLikelihood.possibleViolations) {
            warningsHTML += `<div style="margin-top: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem;"><strong>Compliance Violations:</strong><p style="margin-top: 0.5rem; font-size: 0.9rem;">${complianceData.violationsLikelihood.possibleViolations.substring(0, 300)}...</p></div>`;
        }
        if (complianceData.violationsLikelihood.redFlags) {
            warningsHTML += `<div style="margin-top: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0.5rem;"><strong>Red Flags:</strong><p style="margin-top: 0.5rem; font-size: 0.9rem;">${complianceData.violationsLikelihood.redFlags.substring(0, 300)}...</p></div>`;
        }
    }
    
    if (warningsHTML) {
        const existingWarnings = analysisPanel.querySelector('.compliance-warnings');
        if (existingWarnings) {
            existingWarnings.innerHTML = warningsHTML;
        } else {
            const warningsDiv = document.createElement('div');
            warningsDiv.className = 'compliance-warnings';
            warningsDiv.innerHTML = warningsHTML;
            analysisPanel.appendChild(warningsDiv);
        }
    }
}

function addEventToTimeline(result) {
    events.push(result);
    
    const timelinePanel = document.getElementById('timeline-panel');
    const timeline = document.getElementById('timeline');
    const runningRiskScore = document.getElementById('running-risk-score');
    
    // Calculate running risk score (include compliance risk if available)
    const avgScore = events.reduce((sum, e) => sum + (e.combinedRiskScore || e.score || 0), 0) / events.length;
    runningRiskScore.textContent = Math.round(avgScore);
    runningRiskScore.className = 'risk-score';
    if (avgScore >= 70) {
        runningRiskScore.classList.add('high');
    } else if (avgScore >= 40) {
        runningRiskScore.classList.add('medium');
    } else {
        runningRiskScore.classList.add('low');
    }
    
    // Add event to timeline
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    // Add compliance tags if available
    let complianceTags = '';
    if (result.complianceRiskScore) {
        complianceTags = '<span class="compliance-tag risk-high" style="display: inline-block; padding: 0.25rem 0.5rem; background: rgba(239, 68, 68, 0.3); border-radius: 0.25rem; font-size: 0.75rem; margin-left: 0.5rem;">Violation Risk</span>';
    }
    
    timelineItem.innerHTML = `
        <div class="date">${result.date || 'Unknown date'}</div>
        <div><strong>${result.category || 'Event'}:</strong> ${result.event || 'No description'}${complianceTags}</div>
        <div style="margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">
            Risk Score: ${result.combinedRiskScore || result.score || 0}/100 | Severity: ${result.severity || 'Unknown'}
            ${result.complianceRiskScore ? ` (includes ${result.complianceRiskScore} compliance risk)` : ''}
        </div>
    `;
    timeline.insertBefore(timelineItem, timeline.firstChild);
    
    timelinePanel.style.display = 'block';
}

