import { handleGenerateAndSave } from './generatorHandler';

/**
 * Enhanced document generation with automatic Supabase saving
 * This replaces the existing handleFormSubmit method in document-generator.html
 */
export class EnhancedDocumentGenerator {
  private currentDocType: string = '';
  private currentLocale: 'en' | 'es' = 'en';

  constructor() {
    this.currentDocType = this.getCurrentDocType();
    this.currentLocale = this.getCurrentLocale();
  }

  private getCurrentDocType(): string {
    // Get from URL or form state
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || 'denial_letter';
  }

  private getCurrentLocale(): 'en' | 'es' {
    // Get from language toggle or form state
    const languageToggle = document.querySelector('input[name="language"]:checked') as HTMLInputElement;
    return languageToggle?.value === 'es' ? 'es' : 'en';
  }

  private getAuthToken(): string {
    // Get auth token from localStorage or session
    return localStorage.getItem('supabase.auth.token') || '';
  }

  private showLoading(show: boolean): void {
    const submitBtn = document.querySelector('.doc-gen-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = show;
      const spinner = submitBtn.querySelector('.btn-spinner') as HTMLElement;
      if (spinner) {
        spinner.style.display = show ? 'inline-block' : 'none';
      }
    }
  }

  private hideResultPanel(): void {
    const resultPanel = document.getElementById('resultPanel');
    if (resultPanel) {
      resultPanel.classList.remove('show');
    }
  }

  private showResult(result: any): void {
    const resultPanel = document.getElementById('resultPanel');
    const previewContent = document.getElementById('previewContent');
    const downloadPdf = document.getElementById('downloadPdf') as HTMLAnchorElement;
    const downloadDocx = document.getElementById('downloadDocx') as HTMLAnchorElement;
    const saveToDocuments = document.getElementById('saveToDocuments') as HTMLAnchorElement;
    
    if (previewContent) {
      previewContent.innerHTML = result.html;
    }
    
    // Set download links
    if (downloadPdf) {
      downloadPdf.href = result.pdfUrl;
      downloadPdf.style.display = 'flex';
    }
    if (downloadDocx) {
      downloadDocx.href = result.docxUrl;
      downloadDocx.style.display = 'flex';
    }
    if (saveToDocuments) {
      saveToDocuments.href = `/my-documents.html?id=${result.docId}`;
      saveToDocuments.style.display = 'flex';
    }
    
    // Show result panel
    if (resultPanel) {
      resultPanel.classList.add('show');
      resultPanel.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private showError(message: string): void {
    const resultPanel = document.getElementById('resultPanel');
    if (resultPanel) {
      resultPanel.innerHTML = `
        <div class="error-message">
          <strong>Error:</strong> ${message}
        </div>
      `;
      resultPanel.classList.add('show');
    }
  }

  private showUpgradeRequired(result: any): void {
    const resultPanel = document.getElementById('resultPanel');
    if (resultPanel) {
      resultPanel.innerHTML = `
        <div class="limit-warning">
          <strong>Document Limit Reached</strong><br>
          You have reached your monthly limit of ${result.limit} documents.
          <a href="/upgrade.html" class="text-blue-600 hover:text-blue-800 underline">Upgrade now</a> for unlimited documents.
        </div>
      `;
      resultPanel.classList.add('show');
    }
  }

  /**
   * Enhanced form submission with automatic Supabase saving
   */
  async handleFormSubmit(data: any): Promise<void> {
    try {
      this.showLoading(true);
      this.hideResultPanel();
      
      // Use the new enhanced handler that automatically saves to Supabase
      await handleGenerateAndSave({
        docType: this.currentDocType,
        lang: this.currentLocale,
        inputJson: data
      });

      // Show success message and redirect to documents page
      alert('Document generated and saved! Check your Documents page.');
      window.location.href = '/my-documents.html';
      
    } catch (error: any) {
      console.error('Document generation error:', error);
      
      // Check if it's a limit error
      if (error.message?.includes('limit') || error.message?.includes('quota')) {
        this.showUpgradeRequired({ limit: 2 });
      } else {
        this.showError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Legacy method for backward compatibility
   * Falls back to the original Netlify function approach
   */
  async handleFormSubmitLegacy(data: any): Promise<void> {
    try {
      this.showLoading(true);
      this.hideResultPanel();
      
      const response = await fetch('/.netlify/functions/generateDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          docType: this.currentDocType,
          lang: this.currentLocale,
          input: data
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 402) {
          this.showUpgradeRequired(result);
        } else {
          this.showError(result.error || 'Failed to generate document');
        }
        return;
      }
      
      this.showResult(result);
      
    } catch (error: any) {
      console.error('Document generation error:', error);
      this.showError('An unexpected error occurred. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }
}

// Export for use in HTML files
(window as any).EnhancedDocumentGenerator = EnhancedDocumentGenerator;
