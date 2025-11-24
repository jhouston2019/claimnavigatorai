/**
 * Policy Comparison Tool
 * Compare multiple insurance policies side-by-side
 */

document.addEventListener('DOMContentLoaded', () => {
    const uploadAreaA = document.getElementById('upload-area-a');
    const uploadAreaB = document.getElementById('upload-area-b');
    const fileInputA = document.getElementById('file-input-a');
    const fileInputB = document.getElementById('file-input-b');
    const compareBtn = document.getElementById('compare-btn');
    const resultsPanel = document.getElementById('results-panel');
    
    // File upload handling for Policy A
    uploadAreaA.addEventListener('click', () => fileInputA.click());
    fileInputA.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], 'a');
        }
    });
    
    // File upload handling for Policy B
    uploadAreaB.addEventListener('click', () => fileInputB.click());
    fileInputB.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], 'b');
        }
    });
    
    // Compare button
    compareBtn.addEventListener('click', async () => {
        if (!fileInputA.files[0] || !fileInputB.files[0]) {
            alert('Please upload both policies');
            return;
        }
        
        compareBtn.disabled = true;
        compareBtn.textContent = 'Comparing...';
        
        try {
            const formData = new FormData();
            formData.append('policyA', fileInputA.files[0]);
            formData.append('policyB', fileInputB.files[0]);
            
            const response = await fetch('/.netlify/functions/advanced-tools/policy-comparison-tool', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Comparison failed');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error comparing policies: ' + error.message);
        } finally {
            compareBtn.disabled = false;
            compareBtn.textContent = 'Compare Policies';
        }
    });
    
    // Export report
    document.getElementById('export-report')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-report')?.getAttribute('data-export-target') || '#results-panel';
        const filename = document.getElementById('export-report')?.getAttribute('data-export-filename') || 'policy-comparison-report.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
});

function handleFile(file, policy) {
    const fileName = document.getElementById(`file-name-${policy}`);
    const filePreview = document.getElementById(`file-preview-${policy}`);
    
    fileName.textContent = file.name;
    filePreview.style.display = 'block';
    
    // Enable compare button if both files are selected
    const fileInputA = document.getElementById('file-input-a');
    const fileInputB = document.getElementById('file-input-b');
    const compareBtn = document.getElementById('compare-btn');
    
    if (fileInputA.files[0] && fileInputB.files[0]) {
        compareBtn.disabled = false;
    }
}

function displayResults(result) {
    const resultsPanel = document.getElementById('results-panel');
    const policyASections = document.getElementById('policy-a-sections');
    const policyBSections = document.getElementById('policy-b-sections');
    const differences = document.getElementById('differences');
    const exclusions = document.getElementById('exclusions');
    
    // Display Policy A sections
    if (result.policyA && result.policyA.sections) {
        policyASections.innerHTML = '<ul>';
        result.policyA.sections.forEach(section => {
            policyASections.innerHTML += `<li><strong>${section.type}:</strong> ${section.content}</li>`;
        });
        policyASections.innerHTML += '</ul>';
    } else {
        policyASections.innerHTML = '<p>No sections extracted.</p>';
    }
    
    // Display Policy B sections
    if (result.policyB && result.policyB.sections) {
        policyBSections.innerHTML = '<ul>';
        result.policyB.sections.forEach(section => {
            policyBSections.innerHTML += `<li><strong>${section.type}:</strong> ${section.content}</li>`;
        });
        policyBSections.innerHTML += '</ul>';
    } else {
        policyBSections.innerHTML = '<p>No sections extracted.</p>';
    }
    
    // Display differences
    if (result.differences && result.differences.length > 0) {
        differences.innerHTML = '';
        result.differences.forEach(diff => {
            const div = document.createElement('div');
            div.className = 'difference-highlight';
            div.innerHTML = `<strong>${diff.category}:</strong> ${diff.description}`;
            differences.appendChild(div);
        });
    } else {
        differences.innerHTML = '<p>No significant differences found.</p>';
    }
    
    // Display exclusions
    if (result.exclusions && result.exclusions.length > 0) {
        exclusions.innerHTML = '<ul>';
        result.exclusions.forEach(exclusion => {
            exclusions.innerHTML += `<li>${exclusion}</li>`;
        });
        exclusions.innerHTML += '</ul>';
    } else {
        exclusions.innerHTML = '<p>No exclusions comparison available.</p>';
    }
    
    resultsPanel.style.display = 'block';
    resultsPanel.classList.add('show');
}

