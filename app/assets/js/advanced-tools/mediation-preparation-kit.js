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
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        alert('PDF export coming soon');
    });
}

