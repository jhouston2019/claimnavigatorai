/**
 * Settlement History Database
 * Search historical settlement data and analyze trends
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settlement-search-form');
    const resultsContainer = document.getElementById('results-container');
    const resultsTableContainer = document.getElementById('results-table-container');
    const analyzeTrendsBtn = document.getElementById('analyze-trends');
    const trendsAnalysis = document.getElementById('trends-analysis');
    const trendsContent = document.getElementById('trends-content');
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const carrier = document.getElementById('carrier-search').value;
        const claimType = document.getElementById('claim-type').value;
        const state = document.getElementById('state-filter').value;
        const year = document.getElementById('year-filter').value;
        const severity = document.getElementById('severity-filter').value;
        
        // Show loading
        resultsContainer.style.display = 'block';
        resultsTableContainer.innerHTML = '<p>Searching settlement history...</p>';
        trendsAnalysis.style.display = 'none';
        
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/settlement-history-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: carrier,
                    claimType: claimType,
                    state: state,
                    year: year,
                    severity: severity
                })
            });
            
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            resultsTableContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Analyze trends
    analyzeTrendsBtn?.addEventListener('click', async () => {
        const carrier = document.getElementById('carrier-search').value;
        const claimType = document.getElementById('claim-type').value;
        const state = document.getElementById('state-filter').value;
        
        trendsContent.innerHTML = '<p>Analyzing trends...</p>';
        trendsAnalysis.style.display = 'block';
        
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/settlement-history-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: carrier,
                    claimType: claimType,
                    state: state,
                    analyzeTrends: true
                })
            });
            
            if (!response.ok) {
                throw new Error('Trend analysis failed');
            }
            
            const result = await response.json();
            displayTrends(result.trends);
        } catch (error) {
            console.error('Error:', error);
            trendsContent.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'settlement-history-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

function displayResults(result) {
    const resultsTableContainer = document.getElementById('results-table-container');
    
    if (!result.settlements || result.settlements.length === 0) {
        resultsTableContainer.innerHTML = '<p>No settlement history found matching your criteria.</p>';
        return;
    }
    
    let tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Carrier</th>
                    <th>Claim Type</th>
                    <th>State</th>
                    <th>Initial Offer</th>
                    <th>Final Payout</th>
                    <th>Days</th>
                    <th>Dispute Method</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    result.settlements.forEach(settlement => {
        tableHTML += `
            <tr>
                <td>${escapeHtml(settlement.carrier || 'N/A')}</td>
                <td>${escapeHtml(settlement.claim_type || 'N/A')}</td>
                <td>${escapeHtml(settlement.state || 'N/A')}</td>
                <td>$${formatCurrency(settlement.initial_offer || 0)}</td>
                <td>$${formatCurrency(settlement.final_payout || 0)}</td>
                <td>${settlement.timeline_days || 'N/A'}</td>
                <td>${escapeHtml(settlement.dispute_method || 'N/A')}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    resultsTableContainer.innerHTML = tableHTML;
}

function displayTrends(trends) {
    const trendsContent = document.getElementById('trends-content');
    
    if (!trends) {
        trendsContent.innerHTML = '<p>No trend analysis available.</p>';
        return;
    }
    
    trendsContent.innerHTML = `
        <div style="line-height: 1.8;">
            ${escapeHtml(trends).replace(/\n/g, '<br>')}
        </div>
    `;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


