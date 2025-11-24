/**
 * Insurance Company Profile Database
 * Access detailed profiles of insurance companies
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const stateFilter = document.getElementById('state-filter');
    const searchBtn = document.getElementById('search-btn');
    const carrierList = document.getElementById('carrier-list');
    const modal = document.getElementById('carrier-modal');
    const closeModal = document.getElementById('close-modal');
    
    // Search functionality
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Load initial list (optional - can be empty)
    // performSearch();
});

async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const stateFilter = document.getElementById('state-filter');
    const carrierList = document.getElementById('carrier-list');
    
    const searchTerm = searchInput.value.trim();
    const state = stateFilter.value;
    
    carrierList.innerHTML = '<p>Searching...</p>';
    
    try {
        const response = await fetch('/.netlify/functions/advanced-tools/insurance-profile-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                search: searchTerm,
                state: state
            })
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const result = await response.json();
        displayCarriers(result.carriers || []);
    } catch (error) {
        console.error('Error:', error);
        carrierList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

function displayCarriers(carriers) {
    const carrierList = document.getElementById('carrier-list');
    
    if (carriers.length === 0) {
        carrierList.innerHTML = '<p style="text-align: center; color: rgba(255, 255, 255, 0.7);">No carriers found. Try a different search term.</p>';
        return;
    }
    
    carrierList.innerHTML = '';
    
    carriers.forEach(carrier => {
        const item = document.createElement('div');
        item.className = 'carrier-item';
        item.innerHTML = `
            <h3>${carrier.carrier_name || 'Unknown Carrier'}</h3>
            <div class="meta">
                <span>State: ${carrier.state || 'N/A'}</span>
                <span>Rating: ${carrier.am_best_rating || 'N/A'}</span>
            </div>
        `;
        item.addEventListener('click', () => showCarrierProfile(carrier));
        carrierList.appendChild(item);
    });
}

async function showCarrierProfile(carrier) {
    const modal = document.getElementById('carrier-modal');
    const modalCarrierName = document.getElementById('modal-carrier-name');
    const modalContent = document.getElementById('modal-content');
    
    modalCarrierName.textContent = carrier.carrier_name || 'Carrier Profile';
    
    // If profile is incomplete, fetch full profile
    if (!carrier.known_tactics || !carrier.bad_faith_history) {
        try {
            const response = await fetch('/.netlify/functions/advanced-tools/insurance-profile-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrierId: carrier.id,
                    carrierName: carrier.carrier_name,
                    state: carrier.state
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                carrier = result.carrier || carrier;
            }
        } catch (error) {
            console.error('Error fetching full profile:', error);
        }
    }
    
    modalContent.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h3>Basic Information</h3>
            <p><strong>State:</strong> ${carrier.state || 'N/A'}</p>
            <p><strong>A.M. Best Rating:</strong> ${carrier.am_best_rating || 'N/A'}</p>
            <p><strong>Average Response Time:</strong> ${carrier.avg_response_time ? carrier.avg_response_time + ' days' : 'N/A'}</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h3>Known Tactics</h3>
            <div>${formatJSONField(carrier.known_tactics)}</div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h3>Bad Faith History</h3>
            <div>${formatJSONField(carrier.bad_faith_history)}</div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <h3>State-Level Restrictions</h3>
            <div>${formatJSONField(carrier.state_restrictions)}</div>
        </div>
        
        ${carrier.notes ? `
        <div style="margin-bottom: 1.5rem;">
            <h3>Additional Notes</h3>
            <p>${carrier.notes}</p>
        </div>
        ` : ''}
    `;
    
    modal.classList.add('show');
    
    // Show export button
    const exportBtn = document.getElementById('export-carrier-pdf');
    if (exportBtn) {
        exportBtn.style.display = 'inline-block';
        exportBtn.setAttribute('data-export-filename', `carrier-profile-${(carrier.carrier_name || 'unknown').replace(/\s+/g, '-').toLowerCase()}.pdf`);
    }
    
    // Wire up export button
    exportBtn?.addEventListener('click', async () => {
        const targetSelector = exportBtn.getAttribute('data-export-target') || '#modal-content-container';
        const filename = exportBtn.getAttribute('data-export-filename') || 'carrier-profile.pdf';
        
        if (window.PDFExporter && typeof window.PDFExporter.exportSectionToPDF === 'function') {
            await window.PDFExporter.exportSectionToPDF(targetSelector, filename);
        } else {
            console.error('PDF export helper not available');
            alert('PDF export is not available. Please refresh the page and try again.');
        }
    });
}

function formatJSONField(field) {
    if (!field) return '<p>No data available.</p>';
    
    if (typeof field === 'string') {
        try {
            field = JSON.parse(field);
        } catch (e) {
            return `<p>${field}</p>`;
        }
    }
    
    if (Array.isArray(field)) {
        return '<ul>' + field.map(item => `<li>${item}</li>`).join('') + '</ul>';
    }
    
    if (typeof field === 'object') {
        return '<ul>' + Object.entries(field).map(([key, value]) => 
            `<li><strong>${key}:</strong> ${value}</li>`
        ).join('') + '</ul>';
    }
    
    return `<p>${field}</p>`;
}

