// Situational Advisory System - Modal and Letter Generation
class AdvisorySystem {
  constructor() {
    this.claimData = this.loadClaimData();
    this.currentSituation = null;
    this.currentDocumentType = null;
    this.init();
  }

  init() {
    this.createModal();
    this.bindEvents();
  }

  loadClaimData() {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem('claimUserData');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default data structure
    return {
      name: '',
      policy: '',
      claim: '',
      address: '',
      email: ''
    };
  }

  saveClaimData() {
    localStorage.setItem('claimUserData', JSON.stringify(this.claimData));
  }

  createModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="letterModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Generate Document for This Situation</h2>
              <button id="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Situation:</h3>
              <p id="modalSituation" class="text-gray-600 bg-gray-50 p-3 rounded-lg"></p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <!-- Standard Letter Option -->
              <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div class="text-center">
                  <div class="text-4xl mb-4">📄</div>
                  <h3 class="text-xl font-semibold mb-2">Generate Standard Letter</h3>
                  <p class="text-gray-600 mb-4">Use our professional template with your claim information</p>
                  <button id="generateStandard" class="w-full bg-[#1e40af] text-white px-6 py-3 rounded-lg hover:bg-[#3b82f6] transition-colors font-medium">
                    Generate Standard Letter
                  </button>
                </div>
              </div>

              <!-- AI Custom Letter Option -->
              <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div class="text-center">
                  <div class="text-4xl mb-4">🤖</div>
                  <h3 class="text-xl font-semibold mb-2">Generate Custom AI Letter</h3>
                  <p class="text-gray-600 mb-4">AI-powered customization based on your specific situation</p>
                  <button id="generateAI" class="w-full bg-[#1e40af] text-white px-6 py-3 rounded-lg hover:bg-[#3b82f6] transition-colors font-medium">
                    Generate AI Letter
                  </button>
                </div>
              </div>
            </div>

            <!-- AI Custom Input Section (Hidden by default) -->
            <div id="aiInputSection" class="hidden mb-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">Customize Your Letter</h3>
              <div id="customInputFields"></div>
              <div class="mt-4">
                <button id="generateCustom" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Generate Custom Letter
                </button>
              </div>
            </div>

            <!-- Letter Preview Section -->
            <div id="letterPreview" class="hidden">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Generated Letter</h3>
                <div class="flex gap-2">
                  <button id="downloadPDF" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    📄 Download PDF
                  </button>
                  <button id="copyText" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    📋 Copy Text
                  </button>
                </div>
              </div>
              <div id="letterContent" class="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto border">
                <!-- Generated letter content will appear here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  bindEvents() {
    // Close modal
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });

    // Standard letter generation
    document.getElementById('generateStandard').addEventListener('click', () => {
      this.generateLetter('standard');
    });

    // AI letter generation
    document.getElementById('generateAI').addEventListener('click', () => {
      this.showAIInputSection();
    });

    // Custom letter generation
    document.getElementById('generateCustom').addEventListener('click', () => {
      this.generateLetter('ai');
    });

    // PDF download
    document.getElementById('downloadPDF').addEventListener('click', () => {
      this.downloadPDF();
    });

    // Copy text
    document.getElementById('copyText').addEventListener('click', () => {
      this.copyText();
    });

    // Close modal on outside click
    document.getElementById('letterModal').addEventListener('click', (e) => {
      if (e.target.id === 'letterModal') {
        this.closeModal();
      }
    });
  }

  showModal(situation, documentType) {
    this.currentSituation = situation;
    this.currentDocumentType = documentType;
    
    document.getElementById('modalSituation').textContent = situation;
    document.getElementById('letterModal').classList.remove('hidden');
    document.getElementById('letterPreview').classList.add('hidden');
    document.getElementById('aiInputSection').classList.add('hidden');
  }

  closeModal() {
    document.getElementById('letterModal').classList.add('hidden');
    document.getElementById('letterPreview').classList.add('hidden');
    document.getElementById('aiInputSection').classList.add('hidden');
  }

  showAIInputSection() {
    document.getElementById('aiInputSection').classList.remove('hidden');
    this.createCustomInputFields();
  }

  createCustomInputFields() {
    const fieldsContainer = document.getElementById('customInputFields');
    const documentType = this.currentDocumentType;
    
    let inputHTML = '';
    
    switch (documentType) {
      case 'Appeal Letter':
        inputHTML = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Reason for Disagreement</label>
            <textarea id="customInput" class="w-full border border-gray-300 rounded-lg p-3" rows="3" 
              placeholder="Explain why you disagree with the denial and provide supporting evidence..."></textarea>
          </div>
        `;
        break;
      case 'Demand Letter':
        inputHTML = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount Owed and Insurer's Offer</label>
            <textarea id="customInput" class="w-full border border-gray-300 rounded-lg p-3" rows="3" 
              placeholder="Describe the amount you believe you're owed, the insurer's offer, and why it's inadequate..."></textarea>
          </div>
        `;
        break;
      case 'Proof of Loss':
        inputHTML = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Damage Items Description</label>
            <textarea id="customInput" class="w-full border border-gray-300 rounded-lg p-3" rows="3" 
              placeholder="List specific damaged items, their condition, and estimated values..."></textarea>
          </div>
        `;
        break;
      case 'Notice of Delay Complaint':
        inputHTML = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Delay Duration and Impact</label>
            <textarea id="customInput" class="w-full border border-gray-300 rounded-lg p-3" rows="3" 
              placeholder="Describe how long the insurer has delayed, what you've done to follow up, and the impact of the delay..."></textarea>
          </div>
        `;
        break;
      case 'Coverage Clarification Request':
        inputHTML = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Coverage Question</label>
            <textarea id="customInput" class="w-full border border-gray-300 rounded-lg p-3" rows="3" 
              placeholder="Describe the specific coverage question or policy term in dispute..."></textarea>
          </div>
        `;
        break;
      default:
        inputHTML = `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
            <textarea id="customInput" class="w-full border border-gray-300 rounded-lg p-3" rows="3" 
              placeholder="Provide any additional details to customize your letter..."></textarea>
          </div>
        `;
    }
    
    fieldsContainer.innerHTML = inputHTML;
  }

  async generateLetter(mode) {
    const userInput = mode === 'ai' ? document.getElementById('customInput').value : '';
    
    try {
      const response = await fetch('/netlify/functions/generate-letter.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: mode,
          situation: this.currentSituation,
          documentType: this.currentDocumentType,
          claimData: this.claimData,
          userInput: userInput
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.displayLetter(data.text);
      } else {
        throw new Error(data.error || 'Failed to generate letter');
      }
    } catch (error) {
      console.error('Error generating letter:', error);
      alert('Failed to generate letter. Please try again.');
    }
  }

  displayLetter(letterText) {
    document.getElementById('letterContent').textContent = letterText;
    document.getElementById('letterPreview').classList.remove('hidden');
    document.getElementById('aiInputSection').classList.add('hidden');
  }

  downloadPDF() {
    // Import jsPDF dynamically
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      .then(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "mm", format: "letter" });
        
        // Render header and footer
        this.renderHeaderFooter(doc, this.claimData);
        
        // Add letter content
        const letterText = document.getElementById('letterContent').textContent;
        const marginX = 10;
        const startY = 28;
        const lines = doc.splitTextToSize(letterText, 190);
        doc.text(lines, marginX, startY);
        
        // Save PDF
        const fileName = `${this.currentDocumentType.replace(/\s+/g, '_')}_${this.claimData.claim || 'claim'}.pdf`;
        doc.save(fileName);
      })
      .catch(error => {
        console.error('Error loading jsPDF:', error);
        alert('Error loading PDF library. Please try again.');
      });
  }

  renderHeaderFooter(doc, claimData) {
    // Header block
    doc.setFontSize(10);
    doc.text(`Claimant: ${claimData.name || '[Your Name]'}   Policy: ${claimData.policy || '[Policy Number]'}   Claim: ${claimData.claim || '[Claim Number]'}`, 10, 12);
    doc.text(`Property: ${claimData.address || '[Your Address]'}   Date: ${new Date().toLocaleDateString()}`, 10, 18);
    
    // Add separator line
    doc.line(10, 22, 200, 22);
    
    // Footer watermark
    const footerY = 285;
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("Claim Navigator • Professional Claim Assistance", 105, footerY, { align: "center" });
  }

  copyText() {
    const letterText = document.getElementById('letterContent').textContent;
    navigator.clipboard.writeText(letterText).then(() => {
      alert('Letter text copied to clipboard!');
    }).catch(error => {
      console.error('Error copying text:', error);
      alert('Failed to copy text. Please try again.');
    });
  }
}

// Initialize the advisory system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.advisorySystem = new AdvisorySystem();
});

// Function to open letter generation modal (called from scenario cards)
function openLetterModal(situation, documentType) {
  if (window.advisorySystem) {
    window.advisorySystem.showModal(situation, documentType);
  }
}
