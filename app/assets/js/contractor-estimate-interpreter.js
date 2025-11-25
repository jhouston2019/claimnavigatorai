/**
 * Contractor Estimate Interpreter
 * Analyzes contractor estimates, identifies missing scope, and compares against ROM ranges
 */

import { getSupabaseClient, getAuthToken } from './auth.js';
import { uploadToStorage } from './storage.js';
import { addTimelineEvent } from './utils/timeline-autosync.js';

let uploadedFile = null;
let interpretationResult = null;

document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload();
    setupFormSubmission();
    setupActionButtons();
});

/**
 * Setup file upload
 */
function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('estimate-file');
    const fileList = document.getElementById('file-list');

    if (!uploadArea || !fileInput) return;

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
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(file) {
    uploadedFile = file;
    const fileList = document.getElementById('file-list');
    
    if (fileList) {
        fileList.innerHTML = `
            <div class="file-item">
                <span>${file.name} (${formatFileSize(file.size)})</span>
                <button type="button" class="btn btn-secondary btn-small" onclick="removeFile()" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Remove</button>
            </div>
        `;
    }
}

/**
 * Remove file
 */
window.removeFile = function() {
    uploadedFile = null;
    document.getElementById('file-list').innerHTML = '';
    document.getElementById('estimate-file').value = '';
};

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Setup form submission
 */
function setupFormSubmission() {
    const analyzeBtn = document.getElementById('analyze-btn');
    if (!analyzeBtn) return;

    analyzeBtn.addEventListener('click', async () => {
        await analyzeEstimate();
    });
}

/**
 * Analyze estimate
 */
async function analyzeEstimate() {
    if (!uploadedFile) {
        alert('Please upload a contractor estimate file.');
        return;
    }

    try {
        // Show loading
        const loadingIndicator = document.getElementById('loading-indicator');
        const analyzeBtn = document.getElementById('analyze-btn');
        const resultsPanel = document.getElementById('results-panel');
        
        loadingIndicator.classList.add('show');
        analyzeBtn.disabled = true;
        resultsPanel.classList.remove('show');

        // Collect form data
        const areas = Array.from(document.querySelectorAll('input[name="areas"]:checked')).map(cb => cb.value);
        const lossType = document.getElementById('loss-type').value;
        const severity = document.getElementById('severity').value;

        // Upload file to storage
        const uploadResult = await uploadToStorage(uploadedFile, 'evidence');
        const fileUrl = uploadResult.url;

        // Get claim ID
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        localStorage.setItem('claim_id', claimId);

        // Build payload
        const payload = {
            fileUrl: fileUrl,
            fileName: uploadedFile.name,
            lossType: lossType,
            severity: severity,
            areas: areas,
            claimId: claimId
        };

        // Call backend
        const token = await getAuthToken();
        const response = await fetch('/.netlify/functions/contractor-estimate-interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        // Add metadata to result for later use
        result.lossType = lossType;
        result.severity = severity;
        result.areas = areas;
        interpretationResult = result;

        // Render results
        renderResults(result);

        // Show results panel
        resultsPanel.classList.add('show');
        document.getElementById('actions-footer').style.display = 'flex';

        // Auto-add to timeline
        await addToTimeline(result);
        
        // Light compliance check if estimate is below ROM range
        if (result.summary?.romRange?.relation === 'below-range') {
            await triggerLightComplianceCheck(result);
        }

    } catch (error) {
        console.error('Estimate analysis error:', error);
        alert('Failed to analyze estimate: ' + error.message);
    } finally {
        document.getElementById('loading-indicator').classList.remove('show');
        document.getElementById('analyze-btn').disabled = false;
    }
}

/**
 * Render results
 */
function renderResults(result) {
    // Summary Card
    renderSummary(result.summary);

    // ROM Comparison
    renderROMComparison(result.summary);

    // Line Items
    renderLineItems(result.lineItems || []);

    // Missing Scope
    renderMissingScope(result.missingScope || []);

    // Recommendations
    renderRecommendations(result.recommendations || []);
}

/**
 * Render summary
 */
function renderSummary(summary) {
    const summaryCard = document.getElementById('summary-card');
    if (!summaryCard) return;

    summaryCard.innerHTML = `
        <h3 style="margin-top: 0; color: #ffffff !important;">Summary</h3>
        <div class="summary-stat">
            <span>Total Estimate Amount:</span>
            <strong>$${formatCurrency(summary.totalAmount || 0)}</strong>
        </div>
        <div class="summary-stat">
            <span>Number of Line Items:</span>
            <strong>${summary.lineItemCount || 0}</strong>
        </div>
        ${summary.coverageCategory ? `
            <div class="summary-stat">
                <span>Coverage Category:</span>
                <strong>${summary.coverageCategory}</strong>
            </div>
        ` : ''}
    `;
}

/**
 * Render ROM comparison
 */
function renderROMComparison(summary) {
    const romComparison = document.getElementById('rom-comparison');
    if (!romComparison || !summary.romRange) return;

    const { low, high, relation } = summary.romRange;
    const total = summary.totalAmount || 0;

    let message = '';
    let className = '';

    if (relation === 'below-range') {
        message = `This estimate ($${formatCurrency(total)}) is below the expected ROM range ($${formatCurrency(low)} - $${formatCurrency(high)}). This may indicate missing scope or under-pricing.`;
        className = 'below';
    } else if (relation === 'above-range') {
        message = `This estimate ($${formatCurrency(total)}) is above the expected ROM range ($${formatCurrency(low)} - $${formatCurrency(high)}). Review line items for potential over-pricing.`;
        className = 'above';
    } else {
        message = `This estimate ($${formatCurrency(total)}) is within the expected ROM range ($${formatCurrency(low)} - $${formatCurrency(high)}).`;
    }

    romComparison.className = `rom-comparison ${className}`;
    romComparison.innerHTML = `
        <h4 style="margin-top: 0; color: #ffffff !important;">ROM Cross-Check</h4>
        <p style="margin: 0; color: rgba(255, 255, 255, 0.9) !important;">${message}</p>
    `;
}

/**
 * Render line items
 */
function renderLineItems(lineItems) {
    const tbody = document.getElementById('line-items-body');
    if (!tbody) return;

    if (lineItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No line items found in estimate.</td></tr>';
        return;
    }

    tbody.innerHTML = lineItems.map(item => {
        const flags = item.flags || [];
        const flagBadges = flags.map(flag => {
            if (flag === 'possible_underpricing') {
                return '<span class="flag-badge flag-underpricing">Underpriced</span>';
            } else if (flag === 'missing_quantity') {
                return '<span class="flag-badge flag-missing-qty">Missing Qty</span>';
            } else if (flag === 'ambiguous_description') {
                return '<span class="flag-badge flag-ambiguous">Ambiguous</span>';
            }
            return '';
        }).join('');

        const rowClass = flags.length > 0 ? 'line-item-flagged' : '';

        return `
            <tr class="${rowClass}">
                <td>${escapeHtml(item.description || item.rawText || '')}${flagBadges}</td>
                <td>${item.quantity || '—'}</td>
                <td>${item.unit || '—'}</td>
                <td>${item.unitPrice ? '$' + formatCurrency(item.unitPrice) : '—'}</td>
                <td>${item.lineTotal ? '$' + formatCurrency(item.lineTotal) : '—'}</td>
                <td>${item.category || '—'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Render missing scope
 */
function renderMissingScope(missingScope) {
    const list = document.getElementById('missing-scope-list');
    if (!list) return;

    if (missingScope.length === 0) {
        list.innerHTML = '<li style="color: rgba(255, 255, 255, 0.7) !important;">No missing scope items identified.</li>';
        return;
    }

    list.innerHTML = missingScope.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

/**
 * Render recommendations
 */
function renderRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    if (!list) return;

    if (recommendations.length === 0) {
        list.innerHTML = '<li style="color: rgba(255, 255, 255, 0.7) !important;">No specific recommendations at this time.</li>';
        return;
    }

    list.innerHTML = recommendations.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Setup action buttons
 */
function setupActionButtons() {
    // Save to Journal
    document.getElementById('save-journal-btn')?.addEventListener('click', async () => {
        await saveToJournal();
    });

    // Add to Evidence
    document.getElementById('add-evidence-btn')?.addEventListener('click', async () => {
        await addToEvidence();
    });

    // Add to Timeline (already done automatically, but allow manual trigger)
    document.getElementById('add-timeline-btn')?.addEventListener('click', async () => {
        if (interpretationResult) {
            await addToTimeline(interpretationResult);
            alert('Added to timeline.');
        }
    });

    // Export PDF
    document.getElementById('export-pdf-btn')?.addEventListener('click', async () => {
        await exportToPDF();
    });
}

/**
 * Save to Journal
 */
async function saveToJournal() {
    if (!interpretationResult) return;

    try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            alert('Please sign in to save to journal.');
            return;
        }

        const summary = interpretationResult.summary;
        const romRelation = summary.romRange?.relation || 'unknown';
        const missingScopeCount = interpretationResult.missingScope?.length || 0;

        const entry = {
            title: 'Contractor Estimate Interpreted',
            body: `Total: $${formatCurrency(summary.totalAmount || 0)}\nLine Items: ${summary.lineItemCount || 0}\nROM Relation: ${romRelation}\nMissing Scope Items: ${missingScopeCount}\n\nKey Missing Scope:\n${(interpretationResult.missingScope || []).slice(0, 3).join('\n')}`
        };

        await client.from('documents').insert({
            user_id: user.id,
            type: 'journal_entry',
            title: entry.title,
            content: entry.body,
            metadata: {
                entry_type: 'journal',
                source: 'contractor-estimate-interpreter',
                created_at: new Date().toISOString()
            }
        });

        alert('Saved to Claim Journal.');
    } catch (error) {
        console.error('Error saving to journal:', error);
        alert('Failed to save to journal: ' + error.message);
    }
}

/**
 * Add to Evidence Organizer
 */
async function addToEvidence() {
    if (!uploadedFile) return;

    try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            alert('Please sign in to add to evidence.');
            return;
        }

        // File already uploaded, just need to add metadata
        const uploadResult = await uploadToStorage(uploadedFile, 'evidence');

        await client.from('evidence_items').insert({
            user_id: user.id,
            category: 'financial_contractor',
            file_url: uploadResult.url,
            file_name: uploadedFile.name,
            file_size: uploadedFile.size,
            mime_type: uploadedFile.type,
            notes: 'Contractor estimate - interpreted',
            metadata: {
                source: 'contractor-estimate-interpreter',
                interpretationId: interpretationResult?.id
            }
        });

        alert('Added to Evidence Organizer.');
    } catch (error) {
        console.error('Error adding to evidence:', error);
        alert('Failed to add to evidence: ' + error.message);
    }
}

/**
 * Add to Timeline
 */
async function addToTimeline(result) {
    try {
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        const summary = result.summary || {};
        const romRelation = summary.romRange?.relation || 'unknown';

        await addTimelineEvent({
            type: 'contractor_estimate_interpreted',
            date: new Date().toISOString().split('T')[0],
            source: 'advanced-tool',
            title: 'Contractor Estimate Interpreted',
            description: `Total $${formatCurrency(summary.totalAmount || 0)} (${romRelation} ROM range).`,
            metadata: {
                totalAmount: summary.totalAmount,
                romRange: summary.romRange,
                lineItemCount: summary.lineItemCount,
                lossType: result.lossType,
                severity: result.severity
            },
            claimId: claimId
        });
    } catch (error) {
        console.warn('Failed to add to timeline:', error);
    }
}

/**
 * Export to PDF
 */
async function exportToPDF() {
    try {
        const targetSelector = document.getElementById('export-pdf-btn')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf-btn')?.getAttribute('data-export-filename') || 'contractor-estimate-interpretation.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            // Try to load the PDF export utility
            const script = document.createElement('script');
            script.src = '/app/assets/js/utils/pdf-export.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
                await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
            } else {
                alert('PDF export is not available. Please refresh the page and try again.');
            }
        }
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Failed to export PDF: ' + error.message);
    }
}

/**
 * Light compliance check for underpayment scenarios
 */
async function triggerLightComplianceCheck(result) {
    try {
        // Only trigger if estimate is significantly below ROM range
        const summary = result.summary || {};
        const romRange = summary.romRange || {};
        
        if (romRange.relation === 'below-range' && summary.totalAmount && romRange.low) {
            const percentageBelow = ((romRange.low - summary.totalAmount) / romRange.low) * 100;
            
            // Only trigger if more than 20% below ROM range
            if (percentageBelow > 20) {
                const { generateAlerts } = await import('./utils/compliance-engine-helper.js');
                const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
                
                await generateAlerts(
                    {
                        state: localStorage.getItem('claim_state') || '',
                        carrier: localStorage.getItem('claim_carrier') || '',
                        claimType: result.lossType || 'Property',
                        claimId: claimId
                    },
                    [{
                        name: 'Contractor Estimate Below ROM Range',
                        date: new Date().toISOString().split('T')[0],
                        description: `Contractor estimate is ${Math.round(percentageBelow)}% below expected ROM range. Possible underpayment or missing scope.`
                    }],
                    [],
                    '',
                    []
                );
            }
        }
    } catch (error) {
        console.warn('Light compliance check failed:', error);
        // Don't block user experience if compliance check fails
    }
}

