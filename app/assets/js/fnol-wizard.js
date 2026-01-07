/**
 * FNOL Auto-File Wizard
 * Manages the multi-step FNOL submission process
 */

import { getSupabaseClient, getAuthToken } from './auth.js';
import { uploadToStorage } from './storage.js';
import { getIntakeData } from './autofill.js';
import { generateAlerts } from './utils/compliance-engine-helper.js';

let currentStep = 1;
const totalSteps = 5;
let fnolPayload = {
    policyholder: {},
    policy: {},
    property: {},
    loss: {},
    damage: {},
    impact: {},
    evidenceFiles: [],
    timestamps: {}
};

// File storage
let photoFiles = [];
let reportFiles = [];
let estimateFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCarriers();
    setupEventListeners();
    updateProgressIndicator();
    updateWizardActions();
});

/**
 * Load carriers from insurer directory
 */
async function loadCarriers() {
    try {
        const response = await fetch('/app/resource-center/insurer-directory/insurers.json');
        if (!response.ok) {
            throw new Error('Could not load insurer directory.');
        }
        const insurers = await response.json();
        const carrierSelect = document.getElementById('carrier-select');

        if (insurers && insurers.length > 0) {
            insurers.sort((a, b) => a.name.localeCompare(b.name));
            insurers.forEach(insurer => {
                const option = document.createElement('option');
                option.value = insurer.name;
                option.textContent = insurer.name;
                carrierSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading carriers:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Next button
    document.getElementById('next-btn').addEventListener('click', () => {
        if (validateCurrentStep()) {
            saveCurrentStepData();
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        }
    });

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    // Submit button
    document.getElementById('submit-btn').addEventListener('click', async () => {
        if (validateCurrentStep() && document.getElementById('confirm-accuracy').checked) {
            await submitFNOL();
        } else {
            alert('Please confirm that the information is accurate.');
        }
    });

    // Emergency work toggle
    document.querySelectorAll('input[name="emergency-work"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const notesGroup = document.getElementById('emergency-notes-group');
            if (e.target.value === 'yes') {
                notesGroup.style.display = 'block';
            } else {
                notesGroup.style.display = 'none';
            }
        });
    });

    // Injuries toggle
    document.querySelectorAll('input[name="injuries"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const notesGroup = document.getElementById('injury-notes-group');
            if (e.target.value === 'yes') {
                notesGroup.style.display = 'block';
            } else {
                notesGroup.style.display = 'none';
            }
        });
    });

    // File uploads
    setupFileUpload('photo-input', 'photo-upload-area', photoFiles, 'photo-file-list');
    setupFileUpload('report-input', 'report-upload-area', reportFiles, 'report-file-list');
    setupFileUpload('estimate-input', 'estimate-upload-area', estimateFiles, 'estimate-file-list');
}

/**
 * Setup file upload area
 */
function setupFileUpload(inputId, areaId, fileArray, listId) {
    const input = document.getElementById(inputId);
    const area = document.getElementById(areaId);
    const list = document.getElementById(listId);

    if (!input || !area || !list) return;

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });

    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        handleFiles(e.dataTransfer.files, fileArray, list);
    });

    input.addEventListener('change', (e) => {
        handleFiles(e.target.files, fileArray, list);
    });
}

/**
 * Handle file selection
 */
function handleFiles(files, fileArray, listElement) {
    Array.from(files).forEach(file => {
        fileArray.push(file);
    });
    renderFileList(fileArray, listElement);
}

/**
 * Render file list
 */
function renderFileList(fileArray, listElement) {
    listElement.innerHTML = '';
    fileArray.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" class="btn btn-secondary btn-small" onclick="removeFile(${index}, '${listElement.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Remove</button>
        `;
        listElement.appendChild(fileItem);
    });
}

/**
 * Remove file from list
 */
window.removeFile = function(index, listId) {
    const listElement = document.getElementById(listId);
    if (listId === 'photo-file-list') {
        photoFiles.splice(index, 1);
        renderFileList(photoFiles, listElement);
    } else if (listId === 'report-file-list') {
        reportFiles.splice(index, 1);
        renderFileList(reportFiles, listElement);
    } else if (listId === 'estimate-file-list') {
        estimateFiles.splice(index, 1);
        renderFileList(estimateFiles, listElement);
    }
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
 * Show specific step
 */
function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });

    // Show current step
    const currentStepEl = document.getElementById(`step-${step}`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }

    // Update progress indicator
    updateProgressIndicator();

    // Update wizard actions
    updateWizardActions();

    // If step 5, generate review summary
    if (step === 5) {
        generateReviewSummary();
    }
}

/**
 * Update progress indicator
 */
function updateProgressIndicator() {
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            stepEl.classList.add('completed');
        } else if (stepNum === currentStep) {
            stepEl.classList.add('active');
        }
    });
}

/**
 * Update wizard action buttons
 */
function updateWizardActions() {
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Back button
    if (currentStep > 1) {
        backBtn.style.display = 'inline-block';
    } else {
        backBtn.style.display = 'none';
    }

    // Next/Submit buttons
    if (currentStep < totalSteps) {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    }
}

/**
 * Validate current step
 */
function validateCurrentStep() {
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    if (!currentStepEl) return false;

    const requiredFields = currentStepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#ef4444';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 2000);
        }
    });

    if (!isValid) {
        alert('Please fill in all required fields.');
    }

    return isValid;
}

/**
 * Save current step data
 */
function saveCurrentStepData() {
    if (currentStep === 1) {
        fnolPayload.policyholder = {
            name: document.getElementById('policyholder-name').value,
            email: document.getElementById('policyholder-email').value,
            phone: document.getElementById('policyholder-phone').value,
            address: document.getElementById('policyholder-address').value
        };
        fnolPayload.policy = {
            policyNumber: document.getElementById('policy-number').value,
            carrier: document.getElementById('carrier-select').value
        };
    } else if (currentStep === 2) {
        fnolPayload.property = {
            address: document.getElementById('property-address').value || fnolPayload.policyholder.address
        };
        fnolPayload.loss = {
            type: document.getElementById('loss-type').value,
            date: document.getElementById('loss-date').value,
            time: document.getElementById('loss-time').value,
            emergencyWork: document.querySelector('input[name="emergency-work"]:checked')?.value === 'yes',
            emergencyNotes: document.getElementById('emergency-notes').value
        };
    } else if (currentStep === 3) {
        const areasAffected = Array.from(document.querySelectorAll('input[name="areas-affected"]:checked')).map(cb => cb.value);
        fnolPayload.damage = {
            description: document.getElementById('damage-description').value,
            areasAffected: areasAffected,
            severity: document.getElementById('severity').value
        };
        fnolPayload.impact = {
            habitable: document.querySelector('input[name="habitable"]:checked')?.value === 'yes',
            injuries: document.querySelector('input[name="injuries"]:checked')?.value === 'yes',
            injuryNotes: document.getElementById('injury-notes').value
        };
    } else if (currentStep === 4) {
        fnolPayload.evidenceFiles = {
            photos: photoFiles,
            reports: reportFiles,
            estimates: estimateFiles
        };
    }
}

/**
 * Generate review summary
 */
function generateReviewSummary() {
    const summaryContainer = document.getElementById('review-summary');
    
    let html = `
        <div class="summary-item">
            <h4>Policyholder Information</h4>
            <p><strong>Name:</strong> ${fnolPayload.policyholder.name}</p>
            <p><strong>Email:</strong> ${fnolPayload.policyholder.email}</p>
            <p><strong>Phone:</strong> ${fnolPayload.policyholder.phone}</p>
            <p><strong>Address:</strong> ${fnolPayload.policyholder.address}</p>
        </div>
        
        <div class="summary-item">
            <h4>Policy Information</h4>
            <p><strong>Policy Number:</strong> ${fnolPayload.policy.policyNumber}</p>
            <p><strong>Carrier:</strong> ${fnolPayload.policy.carrier}</p>
        </div>
        
        <div class="summary-item">
            <h4>Loss Information</h4>
            <p><strong>Type:</strong> ${fnolPayload.loss.type}</p>
            <p><strong>Date:</strong> ${formatDate(fnolPayload.loss.date)}</p>
            <p><strong>Time:</strong> ${fnolPayload.loss.time}</p>
            <p><strong>Emergency Work:</strong> ${fnolPayload.loss.emergencyWork ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="summary-item">
            <h4>Damage Details</h4>
            <p><strong>Severity:</strong> ${fnolPayload.damage.severity}</p>
            <p><strong>Areas Affected:</strong> ${fnolPayload.damage.areasAffected.join(', ') || 'None specified'}</p>
            <p><strong>Description:</strong> ${fnolPayload.damage.description}</p>
        </div>
        
        <div class="summary-item">
            <h4>Impact</h4>
            <p><strong>Property Habitable:</strong> ${fnolPayload.impact.habitable ? 'Yes' : 'No'}</p>
            <p><strong>Injuries:</strong> ${fnolPayload.impact.injuries ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="summary-item">
            <h4>Evidence Files</h4>
            <p><strong>Photos:</strong> ${photoFiles.length} file(s)</p>
            <p><strong>Reports:</strong> ${reportFiles.length} file(s)</p>
            <p><strong>Estimates:</strong> ${estimateFiles.length} file(s)</p>
        </div>
    `;
    
    summaryContainer.innerHTML = html;
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Submit FNOL
 */
async function submitFNOL() {
    try {
        // Show loading
        document.getElementById('loading-indicator').classList.add('show');
        document.getElementById('wizard-actions').style.display = 'none';
        document.getElementById('step-5').style.display = 'none';

        // Add timestamp
        fnolPayload.timestamps = {
            createdAt: new Date().toISOString()
        };

        // Upload files first
        const uploadedFiles = await uploadAllFiles();

        // Build final payload
        const finalPayload = {
            ...fnolPayload,
            evidenceFiles: uploadedFiles
        };

        // Submit to backend
        const token = await getAuthToken();
        const response = await fetch('/.netlify/functions/fnol-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(finalPayload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();

        // Integrate with other systems
        await integrateWithSystems(result);

        // Show success message
        showSuccessMessage(result);

    } catch (error) {
        console.error('FNOL submission error:', error);
        
        // SB-5: Log submission failure to timeline
        try {
            const { addTimelineEvent } = await import('./utils/timeline-autosync.js');
            await addTimelineEvent({
                type: 'submission_failed',
                date: new Date().toISOString().split('T')[0],
                source: 'fnol-wizard',
                title: 'FNOL Submission Failed',
                description: `Submission attempt failed: ${error.message}`,
                metadata: {
                    actor: 'system',
                    failure_reason: error.message,
                    delivery_method: fnolPayload?.submissionMethod || 'portal',
                    target: fnolPayload?.policy?.carrier || 'unknown'
                }
            });
        } catch (timelineError) {
            console.warn('Failed to log submission failure:', timelineError);
        }
        
        alert('Failed to submit FNOL: ' + error.message);
        document.getElementById('loading-indicator').classList.remove('show');
        document.getElementById('wizard-actions').style.display = 'flex';
        document.getElementById('step-5').style.display = 'block';
    }
}

/**
 * Upload all files
 */
async function uploadAllFiles() {
    const uploadedFiles = {
        photos: [],
        reports: [],
        estimates: []
    };

    try {
        // Upload photos
        for (const file of photoFiles) {
            try {
                const uploadResult = await uploadToStorage(file, 'evidence');
                uploadedFiles.photos.push({
                    fileName: file.name,
                    fileUrl: uploadResult.url,
                    fileSize: file.size,
                    fileType: file.type
                });
            } catch (error) {
                console.warn('Failed to upload photo:', file.name, error);
            }
        }

        // Upload reports
        for (const file of reportFiles) {
            try {
                const uploadResult = await uploadToStorage(file, 'evidence');
                uploadedFiles.reports.push({
                    fileName: file.name,
                    fileUrl: uploadResult.url,
                    fileSize: file.size,
                    fileType: file.type
                });
            } catch (error) {
                console.warn('Failed to upload report:', file.name, error);
            }
        }

        // Upload estimates
        for (const file of estimateFiles) {
            try {
                const uploadResult = await uploadToStorage(file, 'evidence');
                uploadedFiles.estimates.push({
                    fileName: file.name,
                    fileUrl: uploadResult.url,
                    fileSize: file.size,
                    fileType: file.type
                });
            } catch (error) {
                console.warn('Failed to upload estimate:', file.name, error);
            }
        }
    } catch (error) {
        console.error('File upload error:', error);
    }

    return uploadedFiles;
}

/**
 * Integrate with other systems
 */
async function integrateWithSystems(result) {
    try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        // 1. Add to Claim Journal
        await addToClaimJournal(result);

        // 2. Add to Timeline
        await addToTimeline(result);

        // 3. Add to Evidence Organizer
        await addToEvidenceOrganizer(result);

        // 4. Trigger Compliance Engine & Alerts
        await triggerComplianceAndAlerts(result);

    } catch (error) {
        console.error('Integration error:', error);
        // Don't block success if integrations fail
    }
}

/**
 * Add to Claim Journal
 */
async function addToClaimJournal(result) {
    try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        const journalEntry = {
            user_id: user.id,
            entry_type: 'fnol_submitted',
            title: 'FNOL Submitted',
            content: JSON.stringify({
                carrier: fnolPayload.policy.carrier,
                policyNumber: fnolPayload.policy.policyNumber,
                lossType: fnolPayload.loss.type,
                lossDate: fnolPayload.loss.date,
                description: fnolPayload.damage.description,
                fnolId: result.fnolId,
                pdfUrl: result.pdfUrl,
                complianceSummary: result.complianceSummary
            }),
            metadata: {
                fnolId: result.fnolId,
                timestamp: fnolPayload.timestamps.createdAt
            }
        };

        // Try to insert into journal table (adjust table name if different)
        await client.from('claim_journal').insert(journalEntry).catch(() => {
            // Fallback: try documents table
            return client.from('documents').insert({
                user_id: user.id,
                type: 'journal_entry',
                title: journalEntry.title,
                content: journalEntry.content,
                metadata: journalEntry.metadata
            });
        });
    } catch (error) {
        console.warn('Failed to add to journal:', error);
    }
}

/**
 * Add to Timeline
 */
async function addToTimeline(result) {
    try {
        const { addTimelineEvent } = await import('./utils/timeline-autosync.js');
        
        const claimId = localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        localStorage.setItem('claim_id', claimId);

        await addTimelineEvent({
            type: 'fnol_submitted',
            date: fnolPayload.loss.date,
            source: 'fnol',
            title: 'FNOL Submitted',
            description: `First Notice of Loss submitted to ${fnolPayload.policy.carrier} for ${fnolPayload.loss.type} loss on ${fnolPayload.loss.date}`,
            metadata: {
                fnolId: result.fnolId,
                carrier: fnolPayload.policy.carrier,
                claimType: fnolPayload.loss.type,
                lossType: fnolPayload.loss.type,
                pdfUrl: result.pdfUrl
            },
            claimId: claimId
        });
    } catch (error) {
        console.warn('Failed to add to timeline:', error);
    }
}

/**
 * Add to Evidence Organizer
 */
async function addToEvidenceOrganizer(result) {
    try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        const allFiles = [
            ...(result.evidenceFiles?.photos || []),
            ...(result.evidenceFiles?.reports || []),
            ...(result.evidenceFiles?.estimates || [])
        ];

        for (const file of allFiles) {
            await client.from('evidence_items').insert({
                user_id: user.id,
                category: 'fnol_initial_evidence',
                file_url: file.fileUrl,
                file_name: file.fileName,
                file_size: file.fileSize,
                mime_type: file.fileType,
                notes: 'Uploaded with FNOL submission',
                metadata: {
                    fnolId: result.fnolId,
                    complianceCritical: true,
                    source: 'FNOL Wizard'
                }
            });
        }
    } catch (error) {
        console.warn('Failed to add to evidence organizer:', error);
    }
}

/**
 * Trigger Compliance Engine & Alerts
 */
async function triggerComplianceAndAlerts(result) {
    try {
        // Get state from intake or use default
        const intakeData = await getIntakeData();
        const state = intakeData?.state || localStorage.getItem('claim_state') || '';

        if (!state || !fnolPayload.policy.carrier) {
            console.warn('Missing state or carrier for compliance check');
            return;
        }

        // Trigger compliance analysis
        const complianceResponse = await fetch('/.netlify/functions/compliance-engine/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
                state: state,
                carrier: fnolPayload.policy.carrier,
                claimType: fnolPayload.loss.type,
                claimReference: result.fnolId,
                timelineSummaryText: `FNOL submitted on ${fnolPayload.loss.date} for ${fnolPayload.loss.type} loss.`,
                events: [{
                    name: 'FNOL Submitted',
                    date: fnolPayload.loss.date,
                    description: `First Notice of Loss submitted to ${fnolPayload.policy.carrier}`
                }],
                includeBadFaith: true,
                includeDeadlines: true,
                includeDocsCheck: true,
                generateEscalationRecommendations: true
            })
        });

        if (complianceResponse.ok) {
            const complianceData = await complianceResponse.json();
            result.complianceSummary = complianceData;
        }

        // Trigger alerts
        await generateAlerts(
            {
                state: state,
                carrier: fnolPayload.policy.carrier,
                claimType: fnolPayload.loss.type,
                claimId: result.fnolId
            },
            [{
                name: 'FNOL Submitted',
                date: fnolPayload.loss.date,
                description: `First Notice of Loss submitted`
            }],
            [],
            '',
            []
        );

    } catch (error) {
        console.warn('Failed to trigger compliance and alerts:', error);
    }
}

/**
 * Show success message
 */
function showSuccessMessage(result) {
    document.getElementById('loading-indicator').classList.remove('show');
    
    const successDetails = document.getElementById('success-details');
    let detailsHtml = `
        <p><strong>FNOL ID:</strong> ${result.fnolId || 'N/A'}</p>
    `;
    
    if (result.pdfUrl) {
        detailsHtml += `<p><a href="${result.pdfUrl}" target="_blank" class="btn btn-secondary" style="margin-top: 0.5rem;">Download FNOL PDF</a></p>`;
    }
    
    if (result.complianceSummary) {
        detailsHtml += `
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem;">
                <h4>Compliance Summary</h4>
                <p>${result.complianceSummary.overallSummary || 'Compliance analysis completed.'}</p>
                <a href="/app/resource-center/compliance-engine.html" class="btn btn-secondary btn-small" style="margin-top: 0.5rem;">View Full Compliance Report</a>
            </div>
        `;
    }
    
    if (result.alertsGenerated > 0) {
        detailsHtml += `
            <p style="margin-top: 1rem; color: #f59e0b !important;">
                <strong>⚠ ${result.alertsGenerated} compliance alert(s) generated.</strong>
                <a href="/app/resource-center/compliance-alerts.html" style="color: #dbeafe !important; text-decoration: underline;">View Alerts</a>
            </p>
        `;
    }
    
    successDetails.innerHTML = detailsHtml;
    document.getElementById('success-message').classList.add('show');
}

