class DocumentGenerator {
    constructor() {
        this.generatedContent = null;
        this.documentType = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDownloadButtons();
        this.determineDocumentType();
    }

    determineDocumentType() {
        // Get document type from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const documentTypeParam = urlParams.get('type');
        
        // Store the original slug for API calls
        this.documentTypeSlug = documentTypeParam;
        
        // Map parameter to document type
        const typeMapping = {
            'appeal-letter': 'Appeal Letter',
            'sworn-statement-proof-of-loss': 'Sworn Statement in Proof of Loss',
            'final-demand-payment': 'Final Demand for Payment Letter',
            'personal-property-inventory': 'Personal Property Inventory Claim Form',
            'claim-timeline': 'Claim Timeline / Diary',
            'ale-reimbursement-request': 'ALE Reimbursement Request',
            'claim-expense-tracking': 'Claim Expense Tracking Log',
            'appraisal-demand': 'Appraisal Demand Letter',
            'notice-of-delay': 'Notice of Delay',
            'coverage-clarification': 'Coverage Clarification Request',
            'first-notice-loss': 'First Notice of Loss (FNOL)',
            'bad-faith-complaint': 'Bad Faith Complaint',
            'follow-up-letter': 'Follow-up Letter',
            'business-interruption-claim': 'Business Interruption Claim',
            'settlement-negotiation': 'Settlement Negotiation Letter',
            'fire-damage-claim': 'Fire Damage Claim Documentation',
            'water-damage-claim': 'Water Damage Claim Documentation',
            'flood-damage-claim': 'Flood Damage Claim Documentation',
            'hurricane-windstorm-claim': 'Hurricane/Windstorm Claim Documentation',
            'roof-damage-claim': 'Roof Damage Claim Documentation',
            'mold-claim': 'Mold Claim Documentation',
            'vandalism-theft-claim': 'Vandalism and Theft Claim',
            'attorney-referral': 'Attorney Referral Engagement Letter',
            'expert-engineer-engagement': 'Expert Engineer Engagement Letter',
            'arbitration-demand': 'Arbitration Demand Letter',
            'mediation-request': 'Request for Mediation Letter',
            'doi-complaint': 'Department of Insurance Complaint Letter',
            'notice-intent-litigate': 'Notice of Intent to Litigate Letter',
            'unfair-claims-complaint': 'Complaint for Unfair Claims Practices',
            'commercial-lease-interruption': 'Commercial Lease Interruption Notice',
            'commercial-tenant-damage': 'Commercial Tenant Damage Claim',
            'restaurant-loss-claim': 'Restaurant Loss Claim Documentation',
            'industrial-loss-claim': 'Industrial Loss Claim Documentation',
            'advance-payment-request': 'Request for Advance Payment Letter',
            'withheld-depreciation-release': 'Withheld Depreciation Release Request',
            'settlement-rejection-counteroffer': 'Settlement Rejection and Counteroffer',
            'final-settlement-acceptance': 'Final Settlement Acceptance Letter',
            'claim-evidence-checklist': 'Claim Evidence Checklist',
            'photo-documentation-log': 'Evidence and Photo Documentation Log',
            'communication-tracking': 'Communication Tracking System with Carrier',
            'carrier-contact-log': 'Insurance Carrier Contact Log',
            'line-item-estimate': 'Line Item Estimate Template',
            'professional-estimate': 'Professional Estimate for Restoration',
            'damage-valuation-report': 'Damage Valuation Report',
            'scope-loss-summary': 'Scope of Loss Summary',
            'property-inspection-request': 'Property Inspection Scheduling Request',
            'property-damage-verification': 'Property Damage Verification Statement',
            'residential-construction-contract': 'Residential Construction Contract',
            'temporary-housing-lease': 'Temporary Housing Lease Agreement',
            'authorization-endorse-proceeds': 'Authorization to Endorse Insurance Proceeds',
            'authorization-release-info': 'Authorization for Release of Claim Information',
            'check-endorsement-instructions': 'Check Endorsement Instructions Letter',
            'mortgagee-notification': 'Mortgagee Notification Letter',
            'rebuttal-partial-denial': 'Rebuttal to Carrier Partial Denial of Coverage',
            'rebuttal-wrongful-denial': 'Rebuttal to Wrongful Claim Denial',
            'response-reservation-rights': 'Response to Reservation of Rights Letter',
            'reserve-information-request': 'Reserve Information Request Letter',
            'supplemental-claim-documentation': 'Supplemental Claim Documentation Letter',
            'claim-submission-checklist': 'Property Claim Submission Checklist',
            'claim-summary-report': 'Claim Summary Report',
            'rom-worksheet': 'Rough Order of Magnitude (ROM) Worksheet'
        };
        
        this.documentType = typeMapping[documentTypeParam] || 'Professional Document';
    }

    getDocumentTypeSlug() {
        return this.documentTypeSlug || 'appeal-letter';
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
        const topic = document.getElementById('claimTopic').value.trim();
        
        if (!topic) {
            this.showError('Please describe your claim situation first.');
            return;
        }

        // Get global claim information
        const globalClaimInfo = window.globalClaimManager.getClaimInfo();
        
        // Show loading state
        this.showLoading();
        this.hideResults();
        this.hideError();

        try {
            const response = await fetch('/netlify/functions/generate-document-simple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documentType: this.getDocumentTypeSlug(),
                    formData: {
                        ...globalClaimInfo,
                        situationDetails: topic
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            if (result.success && result.content && result.documentType) {
                this.generatedContent = result.content;
                
                // Apply watermark to the generated content
                const watermarkedContent = window.globalClaimManager.applyWatermark(result.content, globalClaimInfo);
                this.displayResults({...result, content: watermarkedContent});
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Generation error:', error);
            this.showError(`Failed to generate document: ${error.message}`);
        } finally {
            this.hideLoading();
        }
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
    new DocumentGenerator();
});
