/**
 * Communication Templates Module
 * Browse and use professional communication templates
 */

document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('category-filter');
    const templateSearch = document.getElementById('template-search');
    const resultsContainer = document.getElementById('results-container');
    const templatesList = document.getElementById('templates-list');
    const templatePreview = document.getElementById('template-preview');
    const previewTitle = document.getElementById('preview-title');
    const insertDetailsBtn = document.getElementById('insert-details');
    
    let currentTemplates = [];
    let selectedTemplate = null;
    
    // Load templates on page load
    loadTemplates();
    
    // Filter by category
    categoryFilter.addEventListener('change', () => {
        loadTemplates();
    });
    
    // Search templates
    templateSearch.addEventListener('input', () => {
        filterTemplates();
    });
    
    // Insert claim details
    insertDetailsBtn?.addEventListener('click', () => {
        if (selectedTemplate) {
            const claimNumber = prompt('Enter claim number:');
            const carrierName = prompt('Enter carrier name:');
            const date = prompt('Enter date (MM/DD/YYYY):');
            
            if (claimNumber && carrierName && date) {
                let filledTemplate = templatePreview.value;
                filledTemplate = filledTemplate.replace(/\{\{CLAIM_NUMBER\}\}/g, claimNumber);
                filledTemplate = filledTemplate.replace(/\{\{CARRIER_NAME\}\}/g, carrierName);
                filledTemplate = filledTemplate.replace(/\{\{DATE\}\}/g, date);
                
                templatePreview.value = filledTemplate;
            }
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'communication-template.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    async function loadTemplates() {
        const category = categoryFilter.value;
        
        templatesList.innerHTML = '<p>Loading templates...</p>';
        resultsContainer.style.display = 'none';
        
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/communication-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: category
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to load templates');
            }
            
            const result = await response.json();
            currentTemplates = result.templates || [];
            displayTemplates(currentTemplates);
            resultsContainer.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            templatesList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    }
    
    function displayTemplates(templates) {
        if (templates.length === 0) {
            templatesList.innerHTML = '<p>No templates found.</p>';
            return;
        }
        
        let html = '';
        templates.forEach((template, index) => {
            html += `
                <div class="template-item ${index === 0 ? 'active' : ''}" data-template-id="${template.id}">
                    <strong>${escapeHtml(template.template_name || 'Untitled')}</strong>
                    <div style="font-size: 0.875rem; margin-top: 0.25rem; color: rgba(255, 255, 255, 0.7);">
                        ${escapeHtml(template.category || 'Uncategorized')}
                    </div>
                </div>
            `;
        });
        
        templatesList.innerHTML = html;
        
        // Add click handlers
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', async () => {
                document.querySelectorAll('.template-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const templateId = item.getAttribute('data-template-id');
                await loadTemplate(templateId);
            });
        });
        
        // Load first template
        if (templates.length > 0) {
            loadTemplate(templates[0].id);
        }
    }
    
    async function loadTemplate(templateId) {
        templatePreview.value = 'Loading template...';
        
        try {
            const response = await fetch(`/.netlify/functions/advanced-tools/communication-templates?id=${templateId}`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load template');
            }
            
            const template = await response.json();
            selectedTemplate = template;
            
            previewTitle.textContent = template.template_name || 'Template Preview';
            templatePreview.value = template.template_content || 'No content available.';
        } catch (error) {
            console.error('Error:', error);
            templatePreview.value = `Error loading template: ${error.message}`;
        }
    }
    
    function filterTemplates() {
        const searchTerm = templateSearch.value.toLowerCase();
        const filtered = currentTemplates.filter(template => {
            const name = (template.template_name || '').toLowerCase();
            const category = (template.category || '').toLowerCase();
            return name.includes(searchTerm) || category.includes(searchTerm);
        });
        
        displayTemplates(filtered);
    }
});

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


