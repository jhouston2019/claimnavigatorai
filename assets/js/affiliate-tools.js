// Affiliate Tools Data and Rendering Functions
// Get affiliate ID from environment variable or use default
const AFFILIATE_ID = window.AFFILIATE_ID || 'ash202500-20';

const affiliates = [
  {
    category: "Documentation",
    title: "Adobe Scan",
    description: "Scan receipts and paperwork instantly with your phone.",
    link: `https://www.amazon.com/dp/B00X4WHP5E?tag=${AFFILIATE_ID}`
  },
  {
    category: "Storage",
    title: "Dropbox Business",
    description: "Secure cloud backup for all claim files with version history.",
    link: "https://www.dropbox.com/business"
  },
  {
    category: "Organization",
    title: "Evernote",
    description: "Organize notes, communications, and claim timelines.",
    link: "https://evernote.com"
  },
  {
    category: "Accounting",
    title: "QuickBooks",
    description: "Track ALE expenses, repairs, and reimbursements.",
    link: "https://quickbooks.intuit.com"
  },
  {
    category: "Finance",
    title: "Expensify",
    description: "Track meals, hotels, and receipts for reimbursement.",
    link: "https://www.expensify.com"
  },
  {
    category: "Inventory",
    title: "Encircle",
    description: "Document personal property before and after a loss.",
    link: "https://www.getencircle.com"
  },
  {
    category: "3D Imaging",
    title: "Matterport Pro2 3D Camera",
    description: "Capture immersive 3D scans of property damage.",
    link: `https://www.amazon.com/dp/B072PC3K1W?tag=${AFFILIATE_ID}`
  },
  {
    category: "Contractors",
    title: "Angi (Angie's List)",
    description: "Find vetted local contractors for repairs and restoration.",
    link: "https://www.angi.com"
  },
  {
    category: "Contractors",
    title: "HomeAdvisor",
    description: "Connect with local contractors for roofing, HVAC, and repairs.",
    link: "https://www.homeadvisor.com"
  },
  {
    category: "Photography",
    title: "Photo Evidence Kit",
    description: "Tools for moisture testing, measurement, and damage documentation.",
    link: `https://www.amazon.com/dp/B09B1DHP5F?tag=${AFFILIATE_ID}`
  },
  {
    category: "Security",
    title: "Ring Security Camera",
    description: "Document property condition with continuous video evidence.",
    link: `https://www.amazon.com/dp/B08F6GPQQ7?tag=${AFFILIATE_ID}`
  },
  {
    category: "Tools & Equipment",
    title: "Home Depot",
    description: "Emergency supplies, tarps, tools, dehumidifiers, and fans.",
    link: "https://www.homedepot.com"
  }
];

// Function to render affiliate cards in a container
function renderAffiliateCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID '${containerId}' not found`);
    return;
  }

  const currentLang = localStorage.getItem('lang') || 'en';
  
  container.innerHTML = affiliates.map(affiliate => `
    <div class="resource-card">
      <span class="resource-badge">${affiliate.category.toUpperCase()}</span>
      <h4>${affiliate.title}</h4>
      <p>${affiliate.description}</p>
      <a href="${affiliate.link}" class="btn-secondary" target="_blank" rel="noopener noreferrer">
        ${currentLang === 'es' ? 'Más Información →' : 'Learn More →'}
      </a>
    </div>
  `).join('');
}

// Function to render complete affiliate section (disclosure + grid)
function renderAffiliateSection(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID '${containerId}' not found`);
    return;
  }

  const currentLang = localStorage.getItem('lang') || 'en';
  
  container.innerHTML = `
    <div class="affiliate-disclosure">
      <strong>${currentLang === 'es' ? 'Divulgación de Afiliados:' : 'Affiliate Disclosure:'}</strong> 
      <span>${currentLang === 'es' 
        ? 'Esta página contiene enlaces de afiliados. Podemos ganar una comisión sin costo adicional si compra a través de estos enlaces. Solo recomendamos herramientas que creemos que agregan valor a su proceso de reclamo.'
        : 'This page contains affiliate links. We may earn a commission at no extra cost to you if you purchase through these links. We only recommend tools we believe add value to your claim process.'
      }</span>
    </div>
    <div class="resource-grid" id="affiliate-grid-${containerId}">
      ${affiliates.map(affiliate => `
        <div class="resource-card">
          <span class="resource-badge">${affiliate.category.toUpperCase()}</span>
          <h4>${affiliate.title}</h4>
          <p>${affiliate.description}</p>
          <a href="${affiliate.link}" class="btn-secondary" target="_blank" rel="noopener noreferrer">
            ${currentLang === 'es' ? 'Más Información →' : 'Learn More →'}
          </a>
        </div>
      `).join('')}
    </div>
  `;
}

// Initialize affiliate sections when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Render affiliate cards in main page if container exists
  if (document.getElementById('affiliate-grid')) {
    renderAffiliateCards('affiliate-grid');
  }
  
  // Render affiliate section in response center if container exists
  if (document.getElementById('affiliate-tools-container')) {
    renderAffiliateSection('affiliate-tools-container');
  }
});

// Export functions for manual initialization if needed
window.renderAffiliateCards = renderAffiliateCards;
window.renderAffiliateSection = renderAffiliateSection;
