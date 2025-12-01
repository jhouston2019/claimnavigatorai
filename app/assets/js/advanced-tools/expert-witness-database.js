/**
 * Expert Witness Database
 * Search and browse expert witnesses by specialty and location
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expert-search-form');
    const resultsContainer = document.getElementById('results-container');
    const resultsTableContainer = document.getElementById('results-table-container');
    const modal = document.getElementById('expert-modal');
    const closeModal = document.getElementById('close-modal');
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const searchQuery = document.getElementById('search-input').value;
        const specialty = document.getElementById('specialty-filter').value;
        const state = document.getElementById('state-filter').value;
        
        // Show loading
        resultsContainer.style.display = 'block';
        resultsTableContainer.innerHTML = '<p>Searching expert witnesses...</p>';
        
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/expert-witness-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    search: searchQuery,
                    specialty: specialty,
                    state: state
                })
            });
            
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            resultsTableContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
    
    // Export to PDF
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        const targetSelector = document.getElementById('export-pdf')?.getAttribute('data-export-target') || '#results-container';
        const filename = document.getElementById('export-pdf')?.getAttribute('data-export-filename') || 'expert-witness-database-results.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
    
    // Modal handlers
    closeModal?.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

function displayResults(result) {
    const resultsTableContainer = document.getElementById('results-table-container');
    
    if (!result.experts || result.experts.length === 0) {
        resultsTableContainer.innerHTML = '<p>No expert witnesses found matching your criteria.</p>';
        return;
    }
    
    let tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Specialty</th>
                    <th>License</th>
                    <th>Location</th>
                    <th>Summary</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    result.experts.forEach(expert => {
        tableHTML += `
            <tr>
                <td>${escapeHtml(expert.name || 'N/A')}</td>
                <td>${escapeHtml(expert.specialty || 'N/A')}</td>
                <td>${escapeHtml(expert.license_number || 'N/A')}</td>
                <td>${escapeHtml(expert.state || 'N/A')}</td>
                <td>${escapeHtml((expert.summary || 'N/A').substring(0, 100))}...</td>
                <td>
                    <button class="btn btn-primary btn-small view-profile" data-expert-id="${expert.id}">View Profile</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    resultsTableContainer.innerHTML = tableHTML;
    
    // Add event listeners for view profile buttons
    document.querySelectorAll('.view-profile').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const expertId = e.target.getAttribute('data-expert-id');
            await showExpertProfile(expertId);
        });
    });
}

async function showExpertProfile(expertId) {
    const modal = document.getElementById('expert-modal');
    const modalName = document.getElementById('modal-expert-name');
    const modalContent = document.getElementById('modal-expert-content');
    
    modalContent.innerHTML = '<p>Loading profile...</p>';
    modal.classList.add('show');
    
    try {
        const response = await fetch(`/.netlify/functions/advanced-tools/expert-witness-database?id=${expertId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const expert = await response.json();
        
        modalName.textContent = expert.name || 'Expert Profile';
        modalContent.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong>Specialty:</strong> ${escapeHtml(expert.specialty || 'N/A')}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>License Number:</strong> ${escapeHtml(expert.license_number || 'N/A')}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>State:</strong> ${escapeHtml(expert.state || 'N/A')}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Experience:</strong> ${expert.experience_years || 'N/A'} years
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Contact:</strong> ${escapeHtml(expert.contact_email || 'N/A')}
            </div>
            <div style="margin-top: 1.5rem;">
                <strong>Summary:</strong>
                <p style="margin-top: 0.5rem; line-height: 1.6;">${escapeHtml(expert.summary || 'No summary available.')}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        modalContent.innerHTML = `<p class="error">Error loading profile: ${error.message}</p>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


