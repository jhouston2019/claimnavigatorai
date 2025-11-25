/**
 * Settlement Calculator Pro
 * Advanced settlement valuation tool
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settlement-form');
    const depreciationSlider = document.getElementById('depreciation');
    const depreciationValue = document.getElementById('depreciation-value');
    const resultsPanel = document.getElementById('results-panel');
    
    // Update depreciation display
    depreciationSlider.addEventListener('input', (e) => {
        depreciationValue.textContent = e.target.value;
    });
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            damageCategory: document.getElementById('damage-category').value,
            squareFootage: parseFloat(document.getElementById('square-footage').value),
            materialGrade: document.getElementById('material-grade').value,
            laborMultiplier: parseFloat(document.getElementById('labor-multiplier').value) || 1.5,
            depreciation: parseFloat(depreciationSlider.value)
        };
        
        // Show loading
        resultsPanel.style.display = 'block';
        resultsPanel.classList.add('show');
        resultsPanel.innerHTML = '<p>Calculating settlement value...</p>';
        
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/settlement-calculator-pro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Calculation failed');
            }
            
            const result = await response.json();
            displayResults(result);
            
            // Add timeline event
            await addAdvancedToolTimelineEvent('settlement_analysis_run', 'Settlement Analysis Completed', result);
            
            // Add compliance impact section
            await addComplianceImpactSection(result);
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'settlement-calculator-pro-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    // Compare to carrier estimate
    document.getElementById('compare-carrier')?.addEventListener('click', () => {
        const carrierEstimate = prompt('Enter carrier estimate amount:');
        if (carrierEstimate) {
            // TODO: Implement comparison
            alert('Comparison feature coming soon');
        }
    });
});

function displayResults(result) {
    const resultsPanel = document.getElementById('results-panel');
    
    resultsPanel.innerHTML = `
        <h2>Settlement Calculation Results</h2>
        <div class="results-grid">
            <div class="result-card">
                <h4>Total RCV</h4>
                <div class="value">$${formatCurrency(result.totalRCV)}</div>
            </div>
            <div class="result-card">
                <h4>Total ACV</h4>
                <div class="value">$${formatCurrency(result.totalACV)}</div>
            </div>
            <div class="result-card">
                <h4>Depreciation</h4>
                <div class="value">$${formatCurrency(result.depreciation)}</div>
            </div>
            <div class="result-card">
                <h4>Fair Range</h4>
                <div class="value">$${formatCurrency(result.fairRangeLow)} - $${formatCurrency(result.fairRangeHigh)}</div>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h3>AI Valuation Notes</h3>
            <div id="ai-notes" style="padding: 1rem; background: rgba(0, 0, 0, 0.2); border-radius: 0.5rem; margin-top: 1rem;">
                ${result.notes || 'No additional notes.'}
            </div>
        </div>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="export-pdf">Export to PDF</button>
            <button class="btn btn-secondary" id="compare-carrier">Compare to Carrier Estimate</button>
        </div>
    `;
    
    // Re-attach event listeners
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'settlement-calculator-pro-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    document.getElementById('compare-carrier')?.addEventListener('click', () => {
        const carrierEstimate = prompt('Enter carrier estimate amount:');
        if (carrierEstimate) {
            alert('Comparison feature coming soon');
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * Add compliance impact section to settlement results
 */
async function addComplianceImpactSection(settlementResult) {
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
        
        // Get compliance analysis
        const complianceData = await analyzeCompliance({
            state,
            carrier,
            claimType,
            events: [{
                name: 'Settlement Calculation',
                date: new Date().toISOString().split('T')[0],
                description: 'Settlement value calculated'
            }]
        });
        
        // Find or create compliance impact section
        let complianceSection = document.getElementById('compliance-impact-section');
        if (!complianceSection) {
            complianceSection = document.createElement('div');
            complianceSection.id = 'compliance-impact-section';
            complianceSection.className = 'results-section';
            complianceSection.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0.5rem;';
            
            const resultsPanel = document.getElementById('results-panel');
            if (resultsPanel) {
                resultsPanel.appendChild(complianceSection);
            }
        }
        
        // Build compliance impact HTML
        let html = '<h3 style="margin-top: 0; color: #ffffff !important;">Compliance Impact on Settlement Timeline</h3>';
        
        if (complianceData.statutoryDeadlines) {
            const paymentDeadline = extractPaymentDeadline(complianceData.statutoryDeadlines);
            if (paymentDeadline) {
                html += `<div style="margin-bottom: 1rem;"><strong>Payment Deadline:</strong><p style="margin-top: 0.5rem;">${paymentDeadline}</p></div>`;
            }
        }
        
        if (complianceData.carrierOverlayRules) {
            html += `<div style="margin-bottom: 1rem;"><strong>Carrier Delays:</strong><p style="margin-top: 0.5rem;">${complianceData.carrierOverlayRules.substring(0, 300)}...</p></div>`;
        }
        
        if (complianceData.recommendedActions && complianceData.recommendedActions.escalationPaths) {
            html += `<div style="margin-bottom: 1rem;"><strong>Escalation Windows:</strong><p style="margin-top: 0.5rem;">${complianceData.recommendedActions.escalationPaths.substring(0, 300)}...</p></div>`;
        }
        
        complianceSection.innerHTML = html;
        
    } catch (error) {
        console.error('Error adding compliance impact:', error);
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
                toolName: 'settlement-calculator-pro',
                hasResult: !!result
            },
            claimId: claimId
        });
    } catch (error) {
        console.warn('Failed to add advanced tool timeline event:', error);
    }
}

function extractPaymentDeadline(statutoryDeadlinesText) {
    if (!statutoryDeadlinesText) return null;
    const lines = statutoryDeadlinesText.split('\n');
    for (const line of lines) {
        if (line.toLowerCase().includes('payment') && (line.includes('day') || line.includes('hour'))) {
            return line.trim();
        }
    }
    return null;
}

