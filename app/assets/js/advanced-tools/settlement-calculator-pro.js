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

