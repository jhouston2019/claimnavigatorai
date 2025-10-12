class TopicBasedDocumentGenerator {
    constructor() {
        this.generatedContent = null;
        this.documentType = null;
        this.selectedDocumentType = null;
        this.init();
    }

    init() {
        this.setupDocumentTypeSelection();
        this.setupEventListeners();
        this.setupDownloadButtons();
    }

    setupDocumentTypeSelection() {
        const cards = document.querySelectorAll('.document-type-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.document-type-card').forEach(c => c.classList.remove('selected'));
                
                // Select new card
                card.classList.add('selected');
                this.selectedDocumentType = card.dataset.type;
                
                // Show topic input section
                document.getElementById('topicInputSection').style.display = 'block';
                document.getElementById('topicInputSection').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateDocumentBtn');
        const regenerateBtn = document.getElementById('regenerateBtn');
        
        generateBtn.addEventListener('click', () => this.generateDocument());
        regenerateBtn.addEventListener('click', () => this.generateDocument());
    }

    setupDownloadButtons() {
        const copyBtn = document.getElementById('copyTextBtn');
        const pdfBtn = document.getElementById('exportPdfBtn');
        const docxBtn = document.getElementById('exportDocxBtn');
        
        copyBtn.addEventListener('click', () => this.copyToClipboard());
        pdfBtn.addEventListener('click', () => this.exportToPDF());
        docxBtn.addEventListener('click', () => this.exportToDOCX());
    }

    async generateDocument() {
        if (!this.selectedDocumentType) {
            this.showError('Please select a document type first.');
            return;
        }

        const topic = document.getElementById('claimTopic').value.trim();
        
        if (!topic) {
            this.showError('Please describe your claim situation first.');
            return;
        }

        const formData = this.collectFormData();
        
        // Show loading state
        this.showLoading();
        this.hideResults();
        this.hideError();

        try {
            const response = await fetch('/netlify/functions/generate-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: topic,
                    formData: formData,
                    documentType: this.selectedDocumentType
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            this.documentType = result.documentType;
            this.generatedContent = result.content;
            
            this.displayResults(result);
            
        } catch (error) {
            console.error('Generation error:', error);
            this.showError(`Failed to generate document: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    collectFormData() {
        const form = document.getElementById('claimInfoForm');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                data[key] = value.trim();
            }
        }
        
        return data;
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
        document.getElementById('generateDocumentBtn').disabled = true;
        document.getElementById('generateDocumentBtn').textContent = 'Generating...';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('generateDocumentBtn').disabled = false;
        document.getElementById('generateDocumentBtn').textContent = 'Generate Document';
    }

    hideResults() {
        document.getElementById('resultContainer').style.display = 'none';
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    async copyToClipboard() {
        try {
            const textContent = document.getElementById('resultContent').textContent;
            await navigator.clipboard.writeText(textContent);
            
            const btn = document.getElementById('copyTextBtn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = '#10b981';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
            
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
            
            // Get text content and split into lines
            const textContent = document.getElementById('resultContent').textContent;
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
            
            // Generate filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `claim-document-${this.documentType?.toLowerCase().replace(/\s+/g, '-') || 'generated'}-${dateStr}.pdf`;
            
            doc.save(filename);
            
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
                margins: {
                    top: 1440,
                    right: 1440,
                    bottom: 1440,
                    left: 1440
                }
            });
            
            // Create download link
            const url = URL.createObjectURL(docx);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `claim-document-${this.documentType?.toLowerCase().replace(/\s+/g, '-') || 'generated'}-${dateStr}.docx`;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('DOCX export error:', error);
            this.showError('Failed to export DOCX. Please try again.');
        }
    }
}

// Initialize the document generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TopicBasedDocumentGenerator();
});
