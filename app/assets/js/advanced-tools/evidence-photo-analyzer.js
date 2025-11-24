/**
 * Evidence Photo Analyzer
 * AI-powered photo analysis using OpenAI Vision
 */

document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
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
            alert('Please upload an image first');
            return;
        }
        
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        try {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            
            const response = await fetch('/.netlify/functions/advanced-tools/evidence-photo-analyzer', {
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
            alert('Error analyzing photo: ' + error.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze Photo';
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'evidence-photo-analysis.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    // Add to evidence organizer
    document.getElementById('add-to-organizer')?.addEventListener('click', () => {
        // TODO: Integrate with evidence organizer
        alert('Adding to Evidence Organizer...');
        window.location.href = '/app/evidence-organizer.html';
    });
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = 'block';
        analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function displayResults(result) {
    const resultsPanel = document.getElementById('results-panel');
    
    // Auto-tagging
    const autoTags = document.getElementById('auto-tags');
    if (result.tags && result.tags.length > 0) {
        autoTags.innerHTML = result.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
    } else {
        autoTags.innerHTML = '<p>No tags generated.</p>';
    }
    
    // Damage classification
    const damageClassification = document.getElementById('damage-classification');
    if (result.damageType) {
        damageClassification.innerHTML = `<p><strong>Type:</strong> ${result.damageType}</p>`;
        if (result.damageDescription) {
            damageClassification.innerHTML += `<p>${result.damageDescription}</p>`;
        }
    } else {
        damageClassification.innerHTML = '<p>No damage classification available.</p>';
    }
    
    // Severity rating
    const severityRating = document.getElementById('severity-rating');
    if (result.severity) {
        const severityClass = result.severity.toLowerCase();
        severityRating.innerHTML = `
            <span class="severity-badge ${severityClass}">${result.severity}</span>
        `;
    } else {
        severityRating.innerHTML = '<p>No severity rating available.</p>';
    }
    
    // Required supplemental photos
    const supplementalPhotos = document.getElementById('supplemental-photos');
    if (result.requiredPhotos && result.requiredPhotos.length > 0) {
        supplementalPhotos.innerHTML = '<ul>';
        result.requiredPhotos.forEach(photo => {
            supplementalPhotos.innerHTML += `<li>${photo}</li>`;
        });
        supplementalPhotos.innerHTML += '</ul>';
    } else {
        supplementalPhotos.innerHTML = '<p>No additional photos required.</p>';
    }
    
    resultsPanel.style.display = 'block';
    resultsPanel.classList.add('show');
}

