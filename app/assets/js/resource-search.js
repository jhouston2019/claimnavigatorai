/**
 * Resource Center Search and Filter Functionality
 * Provides instant search and category filtering for all Resource Center tools
 */

const tools = [
  { 
    title: "Document Generator", 
    tag: "documents", 
    desc: "Auto-generate professional claim documents, letters, and forms with AI assistance.", 
    link: "/app/resource-center/document-generator.html" 
  },
  { 
    title: "Evidence Organizer", 
    tag: "tools", 
    desc: "Organize and label your claim photos, receipts, and documentation files.", 
    link: "/app/resource-center/evidence-organizer.html" 
  },
  { 
    title: "Financial Calculator", 
    tag: "calculators", 
    desc: "Calculate reimbursements, out-of-pocket expenses, and settlement values.", 
    link: "/app/resource-center/financial-calculator.html" 
  },
  { 
    title: "Negotiation Tools", 
    tag: "tools", 
    desc: "Generate scripts, arguments, and strategies for better settlement negotiations.", 
    link: "/app/resource-center/negotiation-tools.html" 
  },
  { 
    title: "Claim Timeline", 
    tag: "guides", 
    desc: "Track and visualize your claim milestones, deadlines, and progress.", 
    link: "/app/resource-center/claim-timeline.html" 
  },
  { 
    title: "Professional Network", 
    tag: "guides", 
    desc: "Find licensed professionals, attorneys, and experts to support your claim.", 
    link: "/app/resource-center/professional-network.html" 
  },
  { 
    title: "Situational Advisory", 
    tag: "advisory", 
    desc: "AI-driven guidance and recommendations for complex claim scenarios.", 
    link: "/app/resource-center/situational-advisory.html" 
  },
  { 
    title: "Maximize Your Claim", 
    tag: "guides", 
    desc: "Learn proven strategies and tactics to get full compensation for your claim.", 
    link: "/app/resource-center/maximize-claim.html" 
  },
  { 
    title: "Insurance Tactics", 
    tag: "guides", 
    desc: "Understand common insurance company strategies and how to counter them.", 
    link: "/app/resource-center/insurance-tactics.html" 
  },
  { 
    title: "Advanced Tools", 
    tag: "tools", 
    desc: "Premium AI-powered utilities for complex claim analysis and optimization.", 
    link: "/app/resource-center/advanced-tools.html" 
  },
  { 
    title: "Quick Start Guide", 
    tag: "guides", 
    desc: "Get started quickly with step-by-step guidance for the claim process.", 
    link: "/app/resource-center/quick-start.html" 
  }
];

// DOM elements
const resultsContainer = document.getElementById("searchResults");
const searchInput = document.getElementById("searchInput");
const tagButtons = document.querySelectorAll(".tag-btn");

// Current filter state
let currentFilter = "all";
let currentQuery = "";

/**
 * Render search results in the grid
 * @param {Array} items - Array of tool objects to display
 */
function renderResults(items) {
  if (!resultsContainer) return;
  
  if (items.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center col-span-full py-8">
        <p class="text-gray-500 text-lg">No tools found matching your search.</p>
        <p class="text-gray-400 text-sm mt-2">Try adjusting your search terms or filters.</p>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = items.map(item => `
    <div class="result-card">
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
      <a href="${item.link}" class="inline-block mt-2 text-blue-700 font-semibold hover:text-blue-800 transition-colors">
        Open Tool →
      </a>
    </div>
  `).join('');
}

/**
 * Filter tools by tag category
 * @param {string} tag - Tag to filter by ("all" for no filter)
 */
function filterByTag(tag) {
  currentFilter = tag;
  
  // Update active button
  tagButtons.forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.tag-btn[data-tag='${tag}']`);
  if (activeBtn) activeBtn.classList.add("active");
  
  // Apply filters
  let filtered = tools;
  
  // Filter by tag
  if (tag !== "all") {
    filtered = filtered.filter(t => t.tag === tag);
  }
  
  // Filter by search query
  if (currentQuery) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(currentQuery) ||
      t.desc.toLowerCase().includes(currentQuery) ||
      t.tag.toLowerCase().includes(currentQuery)
    );
  }
  
  renderResults(filtered);
}

/**
 * Search tools by query
 * @param {string} query - Search query
 */
function searchTools(query) {
  currentQuery = query.toLowerCase();
  
  let filtered = tools;
  
  // Filter by current tag
  if (currentFilter !== "all") {
    filtered = filtered.filter(t => t.tag === currentFilter);
  }
  
  // Filter by search query
  if (currentQuery) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(currentQuery) ||
      t.desc.toLowerCase().includes(currentQuery) ||
      t.tag.toLowerCase().includes(currentQuery)
    );
  }
  
  renderResults(filtered);
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
  // Check if required elements exist
  if (!resultsContainer || !searchInput) {
    console.warn("Resource search elements not found");
    return;
  }
  
  // Set up search input listener
  searchInput.addEventListener("input", (e) => {
    searchTools(e.target.value);
  });
  
  // Set up tag button listeners
  tagButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterByTag(btn.dataset.tag);
    });
  });
  
  // Initial render with all tools
  renderResults(tools);
}

/**
 * Highlight search terms in results
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} - HTML with highlighted terms
 */
function highlightSearchTerms(text, query) {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

/**
 * Get search statistics
 * @returns {Object} - Search statistics
 */
function getSearchStats() {
  const totalTools = tools.length;
  const filteredTools = resultsContainer ? resultsContainer.children.length : 0;
  
  return {
    total: totalTools,
    filtered: filteredTools,
    showing: filteredTools
  };
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
  initializeSearch();
}

// Export for potential external use
window.ResourceSearch = {
  searchTools,
  filterByTag,
  getSearchStats,
  tools
};
