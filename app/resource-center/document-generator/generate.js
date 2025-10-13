// Document Intelligence Generator with Metadata-Driven AI
class DocumentIntelligenceGenerator {
    constructor() {
        this.generatedContent = null;
        this.documentMetadata = null;
        this.claimInfo = {};
        this.init();
    }

    async init() {
        await this.loadDocumentMetadata();
        this.setupEventListeners();
        this.setupDownloadButtons();
        this.populateDocumentTypes();
    }

    async loadDocumentMetadata() {
        try {
            const response = await fetch('/assets/data/document-metadata.json');
            this.documentMetadata = await response.json();
            console.log('Loaded document metadata:', this.documentMetadata.length, 'documents');
        } catch (error) {
            console.error('Failed to load document metadata:', error);
            this.showError('Failed to load document types. Please refresh the page.');
        }
    }

    populateDocumentTypes() {
        const select = document.getElementById('documentType');
        if (!select || !this.documentMetadata) return;

        // Clear existing options
        select.innerHTML = '<option value="">Select a document type...</option>';

        // Group documents by category
        const categories = {};
        this.documentMetadata.forEach(doc => {
            if (!categories[doc.category]) {
                categories[doc.category] = [];
            }
            categories[doc.category].push(doc);
        });

        // Add options grouped by category
        Object.keys(categories).sort().forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            categories[category].forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.title;
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
    }

    setupEventListeners() {
        // Document type selection
        const documentTypeSelect = document.getElementById('documentType');
        if (documentTypeSelect) {
            documentTypeSelect.addEventListener('change', (e) => {
                this.handleDocumentTypeChange(e.target.value);
            });
        }

        // Generate document button
        const generateBtn = document.getElementById('generateDocumentBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateDocument());
        }

        // Regenerate button
        const regenerateBtn = document.getElementById('regenerateBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.generateDocument());
        }
    }

    setupDownloadButtons() {
        const pdfBtn = document.getElementById('exportPdfBtn');
        const docxBtn = document.getElementById('exportDocxBtn');
        const copyBtn = document.getElementById('copyTextBtn');

        if (pdfBtn) pdfBtn.addEventListener('click', () => this.exportToPDF());
        if (docxBtn) docxBtn.addEventListener('click', () => this.exportToDOCX());
        if (copyBtn) copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    handleDocumentTypeChange(documentTypeId) {
        if (!documentTypeId || !this.documentMetadata) return;

        const doc = this.documentMetadata.find(d => d.id === documentTypeId);
        if (!doc) return;

        this.documentMetadata = doc;
        this.updateDynamicForm(doc);
        this.showTopicInput();
    }

    updateDynamicForm(doc) {
        const formSection = document.getElementById('dynamicFormSection');
        const formFields = document.getElementById('dynamicFormFields');
        
        if (!formSection || !formFields) return;

        // Clear existing fields
        formFields.innerHTML = '';

        // Add document-specific fields based on metadata
        if (doc.fields) {
            doc.fields.forEach(field => {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'form-group';
                
                const label = document.createElement('label');
                label.textContent = field;
                label.setAttribute('for', field.toLowerCase().replace(/\s+/g, '-'));
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = field.toLowerCase().replace(/\s+/g, '-');
                input.name = field.toLowerCase().replace(/\s+/g, '-');
                input.className = 'form-control';
                input.placeholder = `Enter ${field.toLowerCase()}`;
                
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(input);
                formFields.appendChild(fieldDiv);
            });
        }

        // Show the form section
        formSection.style.display = 'block';
    }

    showTopicInput() {
        const topicSection = document.getElementById('topicInputSection');
        if (topicSection) {
            topicSection.style.display = 'block';
        }
    }

    async generateDocument() {
        const documentTypeId = document.getElementById('documentType').value;
        const topic = document.getElementById('claimTopic').value.trim();
        
        if (!documentTypeId) {
            this.showError('Please select a document type first.');
            return;
        }
        
        if (!topic) {
            this.showError('Please describe your claim situation first.');
            return;
        }

        // Get global claim information
        const globalClaimInfo = window.globalClaimManager.getClaimInfo();
        
        // Collect dynamic form data
        const dynamicFormData = this.collectDynamicFormData();
        
        // Merge claim info with dynamic form data
        const formData = { ...globalClaimInfo, ...dynamicFormData };

        this.showLoading();
        this.hideResults();
        this.hideError();

        try {
            const response = await fetch('/.netlify/functions/generate-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documentType: documentTypeId,
                    formData: formData,
                    content: topic
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            if (result.success && result.content) {
                this.generatedContent = result.content;
                
                // Apply watermark to the generated content
                console.log('Global claim info:', globalClaimInfo);
                const watermarkedContent = window.globalClaimManager.applyWatermark(result.content, globalClaimInfo);
                console.log('Watermarked content length:', watermarkedContent.length);
                this.displayResults({
                    ...result, 
                    content: watermarkedContent, 
                    documentType: result.documentType || this.documentMetadata?.title
                });
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error("Generation error:", error);
            if (error.message.includes('404')) {
                alert("The document generator function is not deployed or misnamed. Please verify Netlify functions.");
            }
            this.showError(`Failed to generate document: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    collectDynamicFormData() {
        const formData = {};
        const formFields = document.getElementById('dynamicFormFields');
        
        if (formFields) {
            const inputs = formFields.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.value.trim()) {
                    formData[input.name] = input.value.trim();
                }
            });
        }
        
        return formData;
    }

    displayResults(result) {
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');
        const documentTypeLabel = document.getElementById('documentTypeLabel');
        const documentDescription = document.getElementById('documentDescription');
        
        // Update headers
        documentTypeLabel.textContent = `Generated Document: ${result.documentType}`;
        documentDescription.textContent = `AI-generated ${result.documentType.toLowerCase()} based on your situation`;
        
        // Display content
        resultContent.innerHTML = result.content;
        
        // Show results
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showResults() {
        document.getElementById('resultContainer').style.display = 'block';
    }

    hideResults() {
        document.getElementById('resultContainer').style.display = 'none';
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    copyToClipboard() {
        if (!this.generatedContent) {
            this.showError('No document content to copy. Please generate a document first.');
            return;
        }

        try {
            const content = document.getElementById('resultContent').textContent;
            navigator.clipboard.writeText(content).then(() => {
                // Show success feedback
                const copyBtn = document.getElementById('copyTextBtn');
                if (copyBtn) {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 2000);
                }
            });
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    exportToPDF() {
        if (!this.generatedContent) {
            this.showError('No document content to export. Please generate a document first.');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set up the document
            doc.setFontSize(12);
            doc.setFont('helvetica');
            
            // Get the watermarked content from the display
            const watermarkedContent = document.getElementById('resultContent').innerHTML;
            
            // Convert HTML to text for PDF
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = watermarkedContent;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            const lines = doc.splitTextToSize(textContent, maxWidth);
            
            let yPosition = 20;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Add each line to the PDF
            for (let i = 0; i < lines.length; i++) {
                if (yPosition + lineHeight > pageHeight - 20) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(lines[i], margin, yPosition);
                yPosition += lineHeight;
            }
            
            // Save the PDF
            const fileName = `${this.documentMetadata?.title || 'document'}_${Date.now()}.pdf`;
            doc.save(fileName);
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Failed to export PDF. Please try again.');
        }
    }

    exportToDOCX() {
        if (!this.generatedContent) {
            this.showError('No document content to export. Please generate a document first.');
            return;
        }

        try {
            const content = document.getElementById('resultContent').innerHTML;
            
            // Convert HTML to DOCX
            const docx = htmlDocx.asBlob(content, {
                orientation: 'portrait',
                margins: { top: 720, right: 720, bottom: 720, left: 720 }
            });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(docx);
            link.download = `${this.documentMetadata?.title || 'document'}_${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('DOCX export error:', error);
            this.showError('Failed to export DOCX. Please try again.');
        }
    }
}

// Initialize the generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DocumentIntelligenceGenerator();
});
