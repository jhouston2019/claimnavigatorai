/**
 * LEGAL DISCLAIMER COMPONENT
 * Reusable disclaimer for critical decision and export points
 * Uses existing disclaimer content only - NO new legal language
 */

(function() {
  'use strict';
  
  // Existing disclaimer text from compliance-banner.js
  const DISCLAIMER_TEXT = `
    <strong>Important:</strong>
    Claim Navigator AI provides informational tools and document assistance only.
    It is not a law firm, does not provide legal advice, and does not act as a public adjuster,
    attorney, or insurance producer. You are responsible for all decisions related to your claim.
    For legal, coverage, or representation questions, consult a licensed professional in your state.
  `;
  
  // Compact disclaimer for inline display
  const DISCLAIMER_COMPACT = `
    <strong>Disclaimer:</strong> ClaimNavigatorAI provides documentation tools only, not legal advice or professional services.
    You are responsible for all claim decisions. Consult licensed professionals for legal or coverage advice.
  `;
  
  /**
   * Show disclaimer modal (for step completion)
   * @param {Function} onAcknowledge - Callback when user acknowledges
   */
  function showDisclaimerModal(onAcknowledge) {
    // Check if already acknowledged in this session
    const sessionKey = 'cn_disclaimer_acknowledged_' + Date.now();
    
    const modal = document.createElement('div');
    modal.id = 'cn-disclaimer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 600px;
        margin: 1rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <h3 style="margin: 0 0 1rem 0; color: #1e3a8a;">Important Disclaimer</h3>
        <div style="
          padding: 1rem;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        ">
          ${DISCLAIMER_TEXT}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button id="cn-disclaimer-acknowledge" style="
            padding: 0.75rem 1.5rem;
            background: #1e3a8a;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
          ">I Understand</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cn-disclaimer-acknowledge').addEventListener('click', function() {
      sessionStorage.setItem(sessionKey, '1');
      document.body.removeChild(modal);
      if (onAcknowledge) onAcknowledge();
    });
  }
  
  /**
   * Show inline disclaimer (for exports and submissions)
   * @param {string} containerId - ID of container element
   * @param {string} position - 'before' or 'after' (default: 'before')
   */
  function showInlineDisclaimer(containerId, position = 'before') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('Disclaimer container not found:', containerId);
      return;
    }
    
    // Check if disclaimer already exists
    if (container.querySelector('.cn-inline-disclaimer')) {
      return;
    }
    
    const disclaimer = document.createElement('div');
    disclaimer.className = 'cn-inline-disclaimer';
    disclaimer.style.cssText = `
      padding: 1rem;
      background: #f3f4f6;
      border-left: 3px solid #6b7280;
      margin: 1rem 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #374151;
    `;
    disclaimer.innerHTML = DISCLAIMER_COMPACT;
    
    if (position === 'before') {
      container.insertBefore(disclaimer, container.firstChild);
    } else {
      container.appendChild(disclaimer);
    }
  }
  
  /**
   * Add disclaimer to export button
   * @param {string} buttonId - ID of export button
   * @param {Function} originalHandler - Original click handler
   */
  function wrapExportWithDisclaimer(buttonId, originalHandler) {
    const button = document.getElementById(buttonId);
    if (!button) {
      console.warn('Export button not found:', buttonId);
      return;
    }
    
    // Check if already wrapped
    if (button.dataset.disclaimerWrapped) {
      return;
    }
    
    button.dataset.disclaimerWrapped = 'true';
    
    // Clone button to remove existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Check if acknowledged in this session
      const sessionKey = 'cn_export_disclaimer_' + Date.now();
      if (sessionStorage.getItem(sessionKey)) {
        if (originalHandler) originalHandler();
        return;
      }
      
      // Show quick acknowledgment
      const acknowledged = confirm(
        'Disclaimer: ClaimNavigatorAI provides documentation tools only, not legal advice or professional services. ' +
        'You are responsible for all claim decisions. Consult licensed professionals for legal or coverage advice.\n\n' +
        'Click OK to proceed with export.'
      );
      
      if (acknowledged) {
        sessionStorage.setItem(sessionKey, '1');
        if (originalHandler) originalHandler();
      }
    });
  }
  
  /**
   * Add disclaimer to completion screen
   * @param {string} containerId - ID of completion screen container
   */
  function addCompletionDisclaimer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('Completion container not found:', containerId);
      return;
    }
    
    const disclaimer = document.createElement('div');
    disclaimer.className = 'cn-completion-disclaimer';
    disclaimer.style.cssText = `
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      text-align: center;
    `;
    disclaimer.innerHTML = `
      <div style="font-size: 0.875rem; line-height: 1.6; color: #6b7280;">
        ${DISCLAIMER_COMPACT}
        <div style="margin-top: 0.5rem;">
          <a href="/disclaimer.html" target="_blank" style="color: #1e3a8a; text-decoration: underline;">
            View Full Legal Disclaimer
          </a>
        </div>
      </div>
    `;
    
    container.appendChild(disclaimer);
  }
  
  // Export public API
  window.CNDisclaimer = {
    showModal: showDisclaimerModal,
    showInline: showInlineDisclaimer,
    wrapExport: wrapExportWithDisclaimer,
    addToCompletion: addCompletionDisclaimer,
    text: DISCLAIMER_TEXT,
    textCompact: DISCLAIMER_COMPACT
  };
  
})();



