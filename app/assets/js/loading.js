/**
 * Loading Overlay System
 * Mega Build A - Global loading state management
 */

(function() {
  // Create loading overlay if it doesn't exist
  function ensureLoadingOverlay() {
    let overlay = document.getElementById('cn-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cn-loading-overlay';
      overlay.innerHTML = `
        <div class="cn-loading-spinner"></div>
        <div class="cn-loading-text" id="cn-loading-text">Processing...</div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  // Loading API
  window.CNLoading = {
    show: function(label = 'Processing...') {
      const overlay = ensureLoadingOverlay();
      const textEl = document.getElementById('cn-loading-text');
      if (textEl) {
        textEl.textContent = label;
      }
      overlay.classList.add('show');
    },
    
    hide: function() {
      const overlay = document.getElementById('cn-loading-overlay');
      if (overlay) {
        overlay.classList.remove('show');
      }
    }
  };

  // Ensure CSS is loaded
  if (!document.getElementById('cn-loading-css')) {
    const link = document.createElement('link');
    link.id = 'cn-loading-css';
    link.rel = 'stylesheet';
    link.href = '/app/assets/css/loading.css';
    document.head.appendChild(link);
  }
})();

