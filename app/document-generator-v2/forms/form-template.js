// Form Template JavaScript
let currentDocument = null;
let formData = {};

// Initialize form when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get document ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const docId = urlParams.get('id');
        
        if (!docId) {
            showError('No document ID provided');
            return;
        }

        // Load document templates
        const response = await fetch('/app/document-generator-v2/doc-templates.json');
        if (!response.ok) throw new Error('Failed to load document templates');
        
        const documents = await response.json();
        currentDocument = documents.find(doc => doc.id === docId);
        
        if (!currentDocument) {
            showError('Document not found');
            return;
        }

        // Render the form
        renderForm();
        
    } catch (error) {
        console.error('Error initializing form:', error);
        showError('Failed to load form. Please try again.');
    }
});

// Render the form based on document template
function renderForm() {
    const formContent = document.getElementById('formContent');
    
    const html = `
        <div class="form-title">${currentDocument.title}</div>
        <div class="form-description">${currentDocument.description}</div>
        
        <form id="documentForm">
            ${currentDocument.fields.map(field => renderField(field)).join('')}
            
            <button type="submit" class="submit-btn" id="submitBtn">
                Generate Document
            </button>
        </form>
        
        <div id="resultContainer" style="display: none;"></div>
    `;
    
    formContent.innerHTML = html;
    
    // Add form submit handler
    document.getElementById('documentForm').addEventListener('submit', handleFormSubmit);
}

// Render individual form field
function renderField(field) {
    const required = field.required ? 'form-required' : '';
    
    switch (field.type) {
        case 'textarea':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <textarea 
                        name="${field.name}" 
                        class="form-input form-textarea" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    ></textarea>
                </div>
            `;
            
        case 'select':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <select 
                        name="${field.name}" 
                        class="form-input form-select" 
                        ${field.required ? 'required' : ''}
                    >
                        <option value="">Select ${field.label}</option>
                        ${field.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </div>
            `;
            
        case 'checkbox':
            return `
                <div class="form-group">
                    <label class="form-label">
                        <input 
                            type="checkbox" 
                            name="${field.name}" 
                            class="form-checkbox"
                            ${field.required ? 'required' : ''}
                        >
                        ${field.label}
                    </label>
                </div>
            `;
            
        case 'number':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="number" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                        step="0.01"
                    >
                </div>
            `;
            
        case 'date':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="date" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                    >
                </div>
            `;
            
        case 'time':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="time" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                    >
                </div>
            `;
            
        case 'email':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="email" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    >
                </div>
            `;
            
        case 'tel':
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="tel" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    >
                </div>
            `;
            
        default: // text
            return `
                <div class="form-group">
                    <label class="form-label ${required}">${field.label}</label>
                    <input 
                        type="text" 
                        name="${field.name}" 
                        class="form-input" 
                        ${field.required ? 'required' : ''}
                        placeholder="Enter ${field.label.toLowerCase()}"
                    >
                </div>
            `;
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const resultContainer = document.getElementById('resultContainer');
    
    try {
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating Document...';
        
        // Collect form data
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Add document metadata
        const requestData = {
            documentId: currentDocument.id,
            documentType: currentDocument.title,
            outputType: currentDocument.outputType,
            layoutType: currentDocument.layoutType,
            formData: data,
            timestamp: new Date().toISOString()
        };
        
        // Submit to backend
        const response = await fetch('/.netlify/functions/generate-doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result);
        } else {
            throw new Error(result.error || 'Document generation failed');
        }
        
    } catch (error) {
        console.error('Error generating document:', error);
        showError('Failed to generate document: ' + error.message);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Document';
    }
}

// Show success message with download link
function showSuccess(result) {
    const resultContainer = document.getElementById('resultContainer');
    
    const html = `
        <div class="success">
            <h3>Document Generated Successfully!</h3>
            <p>Your ${currentDocument.title} has been generated and is ready for download.</p>
            <a href="data:${result.mimeType};base64,${result.contentBase64}" 
               download="${result.filename}" 
               class="download-link">
                Download ${result.filename}
            </a>
        </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
}

// Show error message
function showError(message) {
    const resultContainer = document.getElementById('resultContainer');
    
    const html = `
        <div class="error">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
}
