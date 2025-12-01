/**
 * Toast Notification System
 * Mega Build A - Global toast and error modal system
 */

(function() {
  // Create toast container if it doesn't exist
  function ensureToastContainer() {
    let container = document.getElementById('cn-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cn-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Create error modal if it doesn't exist
  function ensureErrorModal() {
    let modal = document.getElementById('cn-error-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cn-error-modal';
      modal.innerHTML = `
        <div class="cn-error-modal-content">
          <div class="cn-error-modal-header">
            <div class="cn-error-modal-title">Error</div>
            <button class="cn-error-modal-close" onclick="window.CNModalError.hide()">×</button>
          </div>
          <div class="cn-error-modal-message" id="cn-error-message"></div>
          <div class="cn-error-modal-details" id="cn-error-details" style="display: none;"></div>
          <div class="cn-error-modal-actions">
            <button class="cn-error-modal-btn cn-error-modal-btn-secondary" onclick="window.CNModalError.hide()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          window.CNModalError.hide();
        }
      });
    }
    return modal;
  }

  // Toast function
  function showToast(message, type = 'info', persistent = false) {
    const container = ensureToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `cn-toast ${type}${persistent ? ' persistent' : ''}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="cn-toast-icon">${icons[type] || icons.info}</span>
      <span class="cn-toast-content">${message}</span>
      <button class="cn-toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after animation (unless persistent)
    if (!persistent) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.animation = 'fadeOut 0.3s ease-in forwards';
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
    }
    
    return toast;
  }

  // Toast API
  window.CNToast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warn: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info')
  };

  // Error Modal API
  window.CNModalError = {
    show: function(title, message, details) {
      const modal = ensureErrorModal();
      const titleEl = modal.querySelector('.cn-error-modal-title');
      const messageEl = document.getElementById('cn-error-message');
      const detailsEl = document.getElementById('cn-error-details');
      
      if (titleEl) titleEl.textContent = title || 'Error';
      if (messageEl) messageEl.textContent = message || 'An error occurred.';
      
      if (details) {
        detailsEl.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
        detailsEl.style.display = 'block';
      } else {
        detailsEl.style.display = 'none';
      }
      
      modal.classList.add('show');
    },
    
    hide: function() {
      const modal = document.getElementById('cn-error-modal');
      if (modal) {
        modal.classList.remove('show');
      }
    }
  };

  // Ensure CSS is loaded
  if (!document.getElementById('cn-toasts-css')) {
    const link = document.createElement('link');
    link.id = 'cn-toasts-css';
    link.rel = 'stylesheet';
    link.href = '/app/assets/css/toasts.css';
    document.head.appendChild(link);
  }
})();

