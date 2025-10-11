// Response Center page behaviors
// All functions previously inline in response-center.html

// Import utilities (will be available via window bridge)
// window.ValidationUtils, window.errorHandler, window.apiClient

// Timeline and phase management
function toggleTimelinePhase(phaseId) {
  console.log('🔄 Toggling timeline phase:', phaseId);
  const body = document.getElementById(phaseId + '-body');
  const toggle = document.getElementById(phaseId + '-toggle');
  
  if (body && toggle) {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    toggle.textContent = isOpen ? '▶' : '▼';
    toggle.classList.toggle('expanded', !isOpen);
  }
}

function togglePhase(phaseId) {
  const body = document.getElementById(phaseId + '-body');
  const toggle = document.getElementById(phaseId + '-toggle');
  
  if (body && toggle) {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    toggle.textContent = isOpen ? '▶' : '▼';
    toggle.classList.toggle('expanded', !isOpen);
  }
}

function toggleQuickStart() {
  const content = document.getElementById('quick-start-content');
  const toggle = document.getElementById('quick-start-toggle');
  
  if (content && toggle) {
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    toggle.textContent = isOpen ? '▶ Quick Start Guide' : '▼ Quick Start Guide';
  }
}

function toggleHowToUse() {
  const content = document.getElementById('how-to-use-content');
  const toggle = document.getElementById('how-to-use-toggle');
  
  if (content && toggle) {
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    toggle.textContent = isOpen ? '▶ How to Use' : '▼ How to Use';
  }
}

// AI Response Generation
async function generateResponse() {
  const input = document.getElementById('input-text');
  const output = document.getElementById('ai-output');
  
  if (!input || !output) {
    console.error('Required elements not found');
    return;
  }
  
  const inputText = input.value.trim();
  if (!inputText) {
    alert('Please enter some text to analyze');
    return;
  }
  
  output.innerHTML = '<div class="spinner"></div> Generating response...';
  
  try {
    // Use the working endpoint, not generate-response-public
    const response = await fetch('/.netlify/functions/generate-response-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputText: inputText,
        type: 'claim_response',
        language: 'en'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.response || data.content || 'No response generated';
    
    output.innerHTML = `
      <div class="ai-response">
        <h3>AI Generated Response:</h3>
        <div class="response-content">${aiResponse}</div>
        <div class="response-actions">
          <button onclick="copyResponse()" class="btn btn-secondary">Copy</button>
          <button onclick="downloadResponse()" class="btn btn-primary">Download</button>
        </div>
      </div>
    `;
    
    // Add to session history
    addToSessionHistory(inputText, aiResponse);
    
  } catch (error) {
    console.error('AI generation error:', error);
    output.innerHTML = `
      <div class="error-message">
        <h3>Error generating response</h3>
        <p>${error.message}</p>
        <p>Please try again or contact support if the problem persists.</p>
      </div>
    `;
  }
}

// Document operations
async function saveDraft() {
  const output = document.getElementById('ai-output');
  if (!output || !output.innerHTML || output.innerHTML.includes('spinner')) {
    alert('Please generate a response first');
    return;
  }
  
  const content = output.innerHTML;
  const title = prompt('Enter a title for this draft:') || 'Untitled Draft';
  
  try {
    // Save to localStorage for now
    const drafts = JSON.parse(localStorage.getItem('responseDrafts') || '[]');
    const newDraft = {
      id: Date.now(),
      title: title,
      content: content,
      date: new Date().toISOString()
    };
    drafts.push(newDraft);
    localStorage.setItem('responseDrafts', JSON.stringify(drafts));
    
    alert('Draft saved successfully!');
  } catch (error) {
    console.error('Save error:', error);
    alert('Failed to save draft');
  }
}

async function exportDoc(format) {
  const output = document.getElementById('ai-output');
  if (!output || !output.innerHTML || output.innerHTML.includes('spinner')) {
    alert('Please generate a response first');
    return;
  }
  
  const content = output.innerHTML;
  
  try {
    // Use the working document generation endpoint
    const response = await fetch('/.netlify/functions/generate-document-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        format: format,
        type: 'ai_response',
        filename: `ai_response_${Date.now()}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (data.url || data.downloadUrl) {
      window.open(data.url || data.downloadUrl, '_blank');
    } else {
      // Fallback: create blob download
      const blob = new Blob([content], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_response_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export document');
  }
}

// Utility functions
function addToSessionHistory(input, response) {
  const history = document.getElementById('session-history');
  if (!history) return;
  
  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.innerHTML = `
    <div class="history-input"><strong>Input:</strong> ${input.substring(0, 100)}...</div>
    <div class="history-response"><strong>Response:</strong> ${response.substring(0, 200)}...</div>
    <div class="history-time">${new Date().toLocaleString()}</div>
  `;
  
  history.insertBefore(entry, history.firstChild);
}

function copyResponse() {
  const content = document.getElementById('ai-response-content');
  if (!content || !content.innerHTML.includes('AI Generated Response')) {
    alert('No response to copy');
    return;
  }
  
  const textContent = content.textContent || content.innerText;
  navigator.clipboard.writeText(textContent).then(() => {
    alert('Response copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy to clipboard');
  });
}

function downloadResponse() {
  const content = document.getElementById('ai-response-content');
  if (!content || !content.innerHTML.includes('AI Generated Response')) {
    alert('No response to download');
    return;
  }
  
  const textContent = content.textContent || content.innerText;
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai_response_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Tool management
function showTool(tool) {
  console.log('🔧 showTool called with:', tool);
  
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    console.error('Content area not found');
    return;
  }
  
  const content = getToolContent(tool);
  contentArea.innerHTML = content;
  
  // Load documents when documents tool is selected
  if (tool === 'documents') {
    // Load English documents by default
    setTimeout(() => {
      loadDocuments('en');
      setupDocumentLibraryEvents();
    }, 100);
  }
  
  // Update active state
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.querySelector(`[data-tool="${tool}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

function getToolContent(tool) {
  const toolNames = {
    'ai-agent': 'AI Response Agent',
    'documents': 'Document Library',
    'policy-review': 'Policy Review',
    'damage-assessment': 'Damage Assessment',
    'evidence-organizer': 'Evidence Organizer',
    'settlement-comparison': 'Settlement Comparison',
    'situational-advisory': 'Situational Advisory',
    'maximize-claim': 'Maximize Your Claim',
    'insurance-tactics': 'Insurance Tactics',
    'how-to-use': 'How to Use'
  };
  
  const toolName = toolNames[tool] || tool;
  
  // Special handling for document library
  if (tool === 'documents') {
    return getDocumentLibraryContent();
  }
  
  return `
    <div class="tool-content">
      <h2>${toolName}</h2>
      <p>Tool content for ${toolName} will be loaded here.</p>
      <div class="tool-placeholder">
        <p>This is a placeholder for the ${toolName} tool.</p>
        <p>Full functionality will be implemented in the next phase.</p>
      </div>
    </div>
  `;
}

// Document Library Content
function getDocumentLibraryContent() {
  return `
    <div class="tool-content">
      <div class="documents-section">
        <div class="section-header">
          <h2>Claim Document Library</h2>
          <p>Access your complete library of 122 professional claim documents and templates.</p>
          
          <div class="language-toggle">
            <button id="lang-en" class="lang-btn active" data-lang="en">English</button>
            <button id="lang-es" class="lang-btn" data-lang="es">Español</button>
          </div>
        </div>
        
        <div class="tool-card">
          <h3>Document Search</h3>
          <input type="text" id="document-search" placeholder="Search documents..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 1rem;">
          <button class="btn-primary" onclick="searchDocuments()">Search</button>
        </div>
        
        <div class="tool-card">
          <h3>My Documents</h3>
          <div id="documents-list">
            <div class="loading">Loading documents...</div>
          </div>
        </div>
        
        <div id="document-count" class="info-box" style="display: none;">
          <strong>📄 <span id="document-count-text">0</span> documents available in <span id="current-language">English</span></strong>
        </div>
      </div>
    </div>
  `;
}

// Document loading functions
async function loadDocuments(language = 'en') {
  try {
    const docsUrl = language === 'es' ? '/assets/docs/es/documents.json' : '/assets/data/documents.json';
    const response = await fetch(docsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load documents: ${response.status}`);
    }
    
    const docsData = await response.json();
    
    // Convert object to array and sort by label
    const docsArray = Object.values(docsData).sort((a, b) => a.label.localeCompare(b.label));
    
    renderDocuments(docsArray, language);
    updateDocumentCount(docsArray.length, language);
    
  } catch (error) {
    console.error('Error loading documents:', error);
    showDocumentError(error.message);
  }
}

function renderDocuments(documents, language) {
  const documentsList = document.querySelector('#documents-list');
  if (!documentsList) return;

  const documentsHtml = documents.map(doc => `
    <div class="document-item">
      <div class="document-header">
        <h4>${doc.label}</h4>
        <p>${doc.description}</p>
      </div>
      <div class="document-actions">
        ${doc.templatePath ? `<button class="btn-secondary" onclick="downloadDocument('${doc.templatePath}', 'template')">Download Template</button>` : ''}
        ${doc.samplePath ? `<button class="btn-secondary" onclick="downloadDocument('${doc.samplePath}', 'sample')">View Sample</button>` : ''}
      </div>
    </div>
  `).join('');

  documentsList.innerHTML = documentsHtml;
}

function updateDocumentCount(count, language) {
  const countElement = document.querySelector('#document-count-text');
  const langElement = document.querySelector('#current-language');
  const countBox = document.querySelector('#document-count');
  
  if (countElement) countElement.textContent = count;
  if (langElement) langElement.textContent = language === 'es' ? 'Spanish' : 'English';
  if (countBox) countBox.style.display = 'block';
}

function showDocumentError(message) {
  const documentsList = document.querySelector('#documents-list');
  if (documentsList) {
    documentsList.innerHTML = `<div class="error-message" style="color: red; padding: 1rem; text-align: center;">Error loading documents: ${message}</div>`;
  }
}

function switchLanguage(language) {
  // Update language button states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-lang="${language}"]`).classList.add('active');
  
  // Load documents for the selected language
  loadDocuments(language);
}

function searchDocuments(query) {
  const documentItems = document.querySelectorAll('.document-item');
  const searchTerm = (query || '').toLowerCase();
  
  documentItems.forEach(item => {
    const title = item.querySelector('h4').textContent.toLowerCase();
    const description = item.querySelector('p').textContent.toLowerCase();
    
    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function setupDocumentLibraryEvents() {
  // Language toggle events
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const lang = this.dataset.lang;
      switchLanguage(lang);
    });
  });
  
  // Document search events
  const searchInput = document.querySelector('#document-search');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchDocuments(this.value);
    });
  }
}

function downloadDocument(filePath, type) {
  // Create a link to download the document
  const link = document.createElement('a');
  link.href = `/Document Library - Final ${type === 'template' ? 'English' : 'English'}/${filePath}`;
  link.download = filePath;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Language management
function setLang(lang) {
  const enBtn = document.getElementById('lang-en');
  const esBtn = document.getElementById('lang-es');
  
  if (enBtn && esBtn) {
    enBtn.className = lang === 'en' ? 'btn-primary' : 'btn-secondary';
    esBtn.className = lang === 'es' ? 'btn-primary' : 'btn-secondary';
  }
  
  // Store language preference
  localStorage.setItem('preferredLanguage', lang);
}

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Clean Response Center loaded successfully');
  
  // Initialize sidebar
  const sidebarButtons = document.querySelectorAll('.sidebar-item');
  sidebarButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      sidebarButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
    });
  });
  
  // Initialize tool items
  const toolItems = document.querySelectorAll('[data-tool]');
  toolItems.forEach(item => {
    item.addEventListener('click', function() {
      const tool = this.dataset.tool;
      console.log('🖱️ Tool item clicked:', tool);
      showTool(tool);
    });
  });
  
  // Initialize language buttons
  const langButtons = document.querySelectorAll('[data-lang]');
  langButtons.forEach(button => {
    button.addEventListener('click', function() {
      const lang = this.dataset.lang;
      setLang(lang);
    });
  });
  
  // Load saved language preference
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  setLang(savedLang);
});

// Export functions for global access
export {
  toggleTimelinePhase,
  togglePhase,
  toggleQuickStart,
  toggleHowToUse,
  generateResponse,
  saveDraft,
  exportDoc,
  copyResponse,
  downloadResponse,
  addToSessionHistory,
  showTool,
  getToolContent,
  setLang
};
