/**
 * REFERENCE_LIBRARY_CONTROLLER
 * 
 * Shared controller for all REFERENCE_LIBRARY tools.
 * Implements the functional contract defined in Phase 3A.
 * 
 * Contract Requirements:
 * - Validate page access
 * - Enable internal navigation helpers
 * - Optional: Client-side search/filter
 * - Optional: Analytics tracking
 * - No backend calls required
 * 
 * Usage:
 *   import { initTool } from './reference-library-controller.js';
 *   initTool({
 *     toolId: 'euo-sworn-statement-guide',
 *     toolName: 'EUO Sworn Statement Guide',
 *     enableSearch: true,
 *     trackPageView: true
 *   });
 */

import { requireAuth, checkPaymentStatus } from '../auth.js';

/**
 * Initialize a reference library page
 * @param {Object} config - Tool configuration
 * @param {string} config.toolId - Unique tool identifier
 * @param {string} config.toolName - Human-readable tool name
 * @param {boolean} config.enableSearch - Enable client-side search (default: false)
 * @param {boolean} config.trackPageView - Track page view in analytics (default: true)
 * @param {boolean} config.requireAuth - Require authentication (default: false)
 */
export async function initTool(config) {
  const {
    toolId,
    toolName,
    enableSearch = false,
    trackPageView = true,
    requireAuth: authRequired = false
  } = config;

  try {
    // Phase 1: Optional authentication check
    if (authRequired) {
      await requireAuth();
      const payment = await checkPaymentStatus();
      if (!payment.hasAccess) {
        showPaymentRequired();
        return;
      }
    }

    // Phase 2: Track page view
    if (trackPageView) {
      await trackAnalytics(toolId, toolName);
    }

    // Phase 3: Enable search if configured
    if (enableSearch) {
      await enableClientSideSearch();
    }

    // Phase 4: Enable navigation helpers
    await enableNavigationHelpers();

    // Phase 5: Enable print functionality
    await enablePrintHelper();

    console.log(`[ReferenceLibraryController] ${toolName} initialized successfully`);
  } catch (error) {
    console.error(`[ReferenceLibraryController] Initialization error for ${toolName}:`, error);
    // Don't show error for reference pages - they should still be readable
  }
}

/**
 * Track page view in analytics
 */
async function trackAnalytics(toolId, toolName) {
  try {
    // Track with window.CNAnalytics if available
    if (window.CNAnalytics && window.CNAnalytics.trackPageView) {
      window.CNAnalytics.trackPageView({
        page: toolId,
        title: toolName,
        category: 'reference_library'
      });
    }

    // Track with Google Analytics if available
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: toolName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }

    // Track with custom analytics function if available
    if (window.trackEvent) {
      window.trackEvent('reference_page_view', {
        tool_id: toolId,
        tool_name: toolName
      });
    }
  } catch (error) {
    console.warn('[ReferenceLibraryController] Analytics tracking failed:', error);
  }
}

/**
 * Enable client-side search functionality
 */
async function enableClientSideSearch() {
  const searchInput = document.querySelector('[data-search-input]') || 
                      document.getElementById('searchInput') ||
                      document.querySelector('input[type="search"]');
  
  if (!searchInput) {
    console.warn('[ReferenceLibraryController] No search input found');
    return;
  }

  // Get all searchable content
  const searchableContent = document.querySelectorAll('[data-searchable], p, li, h2, h3, h4');
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      // Show all content
      searchableContent.forEach(el => {
        el.style.display = '';
        el.classList.remove('search-highlight');
      });
      return;
    }

    // Filter and highlight matching content
    searchableContent.forEach(el => {
      const text = el.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        el.style.display = '';
        el.classList.add('search-highlight');
      } else {
        el.style.display = 'none';
        el.classList.remove('search-highlight');
      }
    });
  });

  // Add clear search button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '✕';
  clearBtn.className = 'search-clear-btn';
  clearBtn.style.display = 'none';
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    clearBtn.style.display = 'none';
  });

  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'inline-block' : 'none';
  });

  if (searchInput.parentNode) {
    searchInput.parentNode.insertBefore(clearBtn, searchInput.nextSibling);
  }
}

/**
 * Enable navigation helpers
 */
async function enableNavigationHelpers() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without triggering page reload
        history.pushState(null, null, href);
      }
    });
  });

  // Add "Back to Top" button
  const backToTopBtn = document.createElement('button');
  backToTopBtn.textContent = '↑ Back to Top';
  backToTopBtn.className = 'back-to-top-btn';
  backToTopBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: none;
    padding: 10px 20px;
    background: #0B2545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1000;
  `;
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  document.body.appendChild(backToTopBtn);

  // Show/hide back to top button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  // Highlight current section in navigation
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  
  if (sections.length > 0 && navLinks.length > 0) {
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }
}

/**
 * Enable print helper
 */
async function enablePrintHelper() {
  // Add print button if not exists
  const existingPrintBtn = document.querySelector('[data-print-btn]') || 
                           document.getElementById('printBtn');
  
  if (existingPrintBtn) {
    existingPrintBtn.addEventListener('click', () => {
      window.print();
    });
    return;
  }

  // Create print button
  const printBtn = document.createElement('button');
  printBtn.textContent = '🖨️ Print';
  printBtn.className = 'print-btn';
  printBtn.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 20px;
    padding: 10px 20px;
    background: #17BEBB;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1000;
  `;
  
  printBtn.addEventListener('click', () => {
    window.print();
  });

  document.body.appendChild(printBtn);

  // Add print-specific styles
  const printStyles = document.createElement('style');
  printStyles.textContent = `
    @media print {
      .back-to-top-btn,
      .print-btn,
      nav,
      header,
      footer,
      .search-clear-btn {
        display: none !important;
      }
      
      body {
        font-size: 12pt;
        line-height: 1.5;
      }
      
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      a {
        text-decoration: none;
        color: #000;
      }
      
      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
      }
    }
  `;
  document.head.appendChild(printStyles);
}

/**
 * Utility: Show payment required message
 */
function showPaymentRequired() {
  if (window.CNPaywall) {
    window.CNPaywall.show();
  } else {
    alert('Payment required to access this content.');
    window.location.href = '/app/pricing.html';
  }
}

/**
 * Utility: Show success message
 */
function showSuccess(message) {
  if (window.CNNotification) {
    window.CNNotification.success(message);
  } else {
    console.log('Success:', message);
  }
}

/**
 * Utility: Show error message
 */
function showError(message) {
  if (window.CNError) {
    window.CNError.show(message);
  } else {
    console.error('Error:', message);
  }
}



