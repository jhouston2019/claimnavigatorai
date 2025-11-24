/**
 * Fraud Detection Scanner
 * Identify potential insurance fraud patterns
 */

document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const extractedText = document.getElementById('extracted-text');
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
    
    // Analyze button
    analyzeBtn.addEventListener('click', async () => {
        if (!fileInput.files[0]) {
            alert('Please upload a file first');
            return;
        }
        
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        try {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            const response = await fetch('/.netlify/functions/advanced-tools/fraud-detection-scanner', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Analysis failed');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error analyzing document: ' + error.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze for Fraud Patterns';
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'fraud-detection-scan.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    // Generate action plan
    document.getElementById('generate-action-plan')?.addEventListener('click', () => {
        // TODO: Implement action plan generation
        alert('Action plan generation coming soon');
    });
});

function handleFile(file) {
    const fileName = document.getElementById('file-name');
    const filePreview = document.getElementById('file-preview');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    fileName.textContent = file.name;
    filePreview.style.display = 'block';
    analyzeBtn.disabled = false;
    
    // Show extracted text preview (will be populated after analysis)
    document.getElementById('extracted-text').value = 'Uploading and extracting text...';
}

function displayResults(result) {
    const resultsPanel = document.getElementById('results-panel');
    const riskScore = document.getElementById('risk-score');
    const suspiciousSections = document.getElementById('suspicious-sections');
    const recommendedActions = document.getElementById('recommended-actions');
    
    // Update extracted text
    if (result.extractedText) {
        document.getElementById('extracted-text').value = result.extractedText;
    }
    
    // Display risk score
    riskScore.textContent = result.riskScore || 0;
    riskScore.className = 'risk-score';
    if (result.riskScore >= 70) {
        riskScore.classList.add('high');
    } else if (result.riskScore >= 40) {
        riskScore.classList.add('medium');
    } else {
        riskScore.classList.add('low');
    }
    
    // Display suspicious sections
    if (result.suspiciousSections && result.suspiciousSections.length > 0) {
        suspiciousSections.innerHTML = '<h3>Suspicious Language Detected</h3>';
        result.suspiciousSections.forEach(section => {
            const div = document.createElement('div');
            div.className = 'suspicious-section';
            div.innerHTML = `<strong>${section.type}:</strong> ${section.text}`;
            suspiciousSections.appendChild(div);
        });
    } else {
        suspiciousSections.innerHTML = '<p>No suspicious patterns detected.</p>';
    }
    
    // Display recommended actions
    if (result.recommendedActions && result.recommendedActions.length > 0) {
        recommendedActions.innerHTML = '<ul>';
        result.recommendedActions.forEach(action => {
            recommendedActions.innerHTML += `<li>${action}</li>`;
        });
        recommendedActions.innerHTML += '</ul>';
    } else {
        recommendedActions.innerHTML = '<p>No specific actions recommended.</p>';
    }
    
    resultsPanel.style.display = 'block';
    resultsPanel.classList.add('show');
}

