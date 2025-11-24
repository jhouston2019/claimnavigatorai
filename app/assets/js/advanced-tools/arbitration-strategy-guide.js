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
        } catch (error) {
            console.error('Error:', error);
            resultsPanel.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export PDF
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        // TODO: Implement PDF export
        alert('PDF export coming soon');
    });
});

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
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        alert('PDF export coming soon');
    });
}

