/**
 * Bad Faith Evidence Tracker
 * Systematically document and organize evidence of bad faith practices
 */

let events = [];

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bad-faith-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    
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
        Array.from(files).forEach(file => handleFile(file));
    });
    
    fileInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => handleFile(file));
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            date: document.getElementById('event-date').value,
            event: document.getElementById('event-description').value,
            category: document.getElementById('carrier-action').value,
            files: Array.from(fileInput.files)
        };
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('date', formData.date);
            uploadFormData.append('event', formData.event);
            uploadFormData.append('category', formData.category);
            
            formData.files.forEach((file, index) => {
                uploadFormData.append(`file_${index}`, file);
            });
            
            const response = await fetch('/.netlify/functions/advanced-tools/bad-faith-evidence-tracker', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!response.ok) {
                throw new Error('Analysis failed');
            }
            
            const result = await response.json();
            displayAnalysis(result);
            addEventToTimeline(result);
            
            // Reset form
            form.reset();
            fileList.innerHTML = '';
            fileInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            alert('Error analyzing event: ' + error.message);
        }
    });
    
    // Export report
    document.getElementById('export-report')?.addEventListener('click', () => {
        // TODO: Implement report export
        alert('Report export coming soon');
    });
});

function handleFile(file) {
    const fileList = document.getElementById('file-list');
    const fileItem = document.createElement('div');
    fileItem.textContent = `✓ ${file.name}`;
    fileItem.style.marginBottom = '0.25rem';
    fileList.appendChild(fileItem);
}

function displayAnalysis(result) {
    const analysisPanel = document.getElementById('analysis-panel');
    const riskScore = document.getElementById('risk-score');
    const severityDisplay = document.getElementById('severity-display');
    const aiNotes = document.getElementById('ai-notes');
    
    // Update risk score
    riskScore.textContent = result.score || 0;
    riskScore.className = 'risk-score';
    if (result.score >= 70) {
        riskScore.classList.add('high');
    } else if (result.score >= 40) {
        riskScore.classList.add('medium');
    } else {
        riskScore.classList.add('low');
    }
    
    // Display severity
    if (result.severity) {
        severityDisplay.innerHTML = `<p><strong>Severity:</strong> ${result.severity}</p>`;
    }
    
    // Display AI notes
    if (result.aiNotes) {
        aiNotes.innerHTML = `<p>${result.aiNotes}</p>`;
    }
    
    analysisPanel.style.display = 'block';
}

function addEventToTimeline(result) {
    events.push(result);
    
    const timelinePanel = document.getElementById('timeline-panel');
    const timeline = document.getElementById('timeline');
    const runningRiskScore = document.getElementById('running-risk-score');
    
    // Calculate running risk score
    const avgScore = events.reduce((sum, e) => sum + (e.score || 0), 0) / events.length;
    runningRiskScore.textContent = Math.round(avgScore);
    runningRiskScore.className = 'risk-score';
    if (avgScore >= 70) {
        runningRiskScore.classList.add('high');
    } else if (avgScore >= 40) {
        runningRiskScore.classList.add('medium');
    } else {
        runningRiskScore.classList.add('low');
    }
    
    // Add event to timeline
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.innerHTML = `
        <div class="date">${result.date || 'Unknown date'}</div>
        <div><strong>${result.category || 'Event'}:</strong> ${result.event || 'No description'}</div>
        <div style="margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">
            Risk Score: ${result.score || 0}/100 | Severity: ${result.severity || 'Unknown'}
        </div>
    `;
    timeline.insertBefore(timelineItem, timeline.firstChild);
    
    timelinePanel.style.display = 'block';
}

