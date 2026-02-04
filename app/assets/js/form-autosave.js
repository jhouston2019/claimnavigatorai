/**
 * FORM AUTO-SAVE & CRASH RECOVERY MODULE
 * 
 * Automatically saves form progress every 30 seconds and provides
 * crash recovery and "continue where you left off" functionality.
 * 
 * Features:
 * - Auto-save form data to localStorage every 30 seconds
 * - Detect browser close/refresh and save immediately
 * - Restore form data on page load
 * - Show "Continue where you left off" prompt
 * - Clear saved data after successful submission
 * - Works with all tool forms
 * 
 * Usage:
 *   <script src="/app/assets/js/form-autosave.js"></script>
 *   FormAutoSave.init(); // Call after page load
 */

const FormAutoSave = (function() {
  
  // Configuration
  const CONFIG = {
    SAVE_INTERVAL: 30000, // 30 seconds
    STORAGE_PREFIX: 'form_autosave_',
    RETENTION_DAYS: 7, // Keep saved forms for 7 days
    SHOW_SAVE_INDICATOR: true
  };

  let saveTimer = null;
  let currentForm = null;
  let currentToolId = null;

  /**
   * Initialize auto-save for all forms on the page
   */
  function init() {
    // Find the main tool form
    currentForm = document.querySelector('[data-tool-form]') || 
                  document.querySelector('form.tool-form') ||
                  document.querySelector('form');
    
    if (!currentForm) {
      console.log('[FormAutoSave] No form found on this page');
      return;
    }

    // Get tool ID from URL or form data
    currentToolId = getToolId();
    
    if (!currentToolId) {
      console.warn('[FormAutoSave] Could not determine tool ID');
      return;
    }

    console.log(`[FormAutoSave] Initialized for tool: ${currentToolId}`);

    // Check for existing saved data
    checkForSavedData();

    // Start auto-save timer
    startAutoSave();

    // Save on form changes (debounced)
    attachFormListeners();

    // Save before page unload
    attachUnloadListener();

    // Clear saved data on successful submission
    attachSubmitListener();

    // Add save indicator to UI
    if (CONFIG.SHOW_SAVE_INDICATOR) {
      addSaveIndicator();
    }
  }

  /**
   * Get tool ID from URL or page
   */
  function getToolId() {
    // Try to get from URL
    const path = window.location.pathname;
    const match = path.match(/\/tools\/([^\/]+)\.html/);
    if (match) {
      return match[1];
    }

    // Try to get from meta tag or data attribute
    const metaToolId = document.querySelector('meta[name="tool-id"]');
    if (metaToolId) {
      return metaToolId.content;
    }

    // Try to get from form data attribute
    if (currentForm && currentForm.dataset.toolId) {
      return currentForm.dataset.toolId;
    }

    // Fallback to page title slug
    const title = document.title.split('-')[0].trim();
    return title.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Get storage key for this tool
   */
  function getStorageKey() {
    return `${CONFIG.STORAGE_PREFIX}${currentToolId}`;
  }

  /**
   * Check if there's saved form data and prompt user
   */
  function checkForSavedData() {
    const savedData = getSavedData();
    
    if (!savedData) {
      return;
    }

    // Check if data is not expired
    const savedDate = new Date(savedData.timestamp);
    const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince > CONFIG.RETENTION_DAYS) {
      // Data is too old, clear it
      clearSavedData();
      return;
    }

    // Show restoration prompt
    showRestorePrompt(savedData, savedDate);
  }

  /**
   * Show prompt to restore saved data
   */
  function showRestorePrompt(savedData, savedDate) {
    const timeAgo = formatTimeAgo(savedDate);
    
    // Create prompt overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      margin: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    `;

    dialog.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">💾</div>
        <h3 style="margin: 0 0 0.5rem 0; color: #1e3a5f; font-size: 1.5rem;">Continue Where You Left Off?</h3>
        <p style="margin: 0; color: #4a5568; font-size: 0.875rem;">
          We found saved progress from ${timeAgo}
        </p>
      </div>
      
      <div style="background: #f7f9fc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;">Saved Fields:</div>
        <div style="font-weight: 600; color: #1e3a5f;">${savedData.fieldCount} field${savedData.fieldCount !== 1 ? 's' : ''} saved</div>
      </div>

      <div style="display: flex; gap: 0.75rem; justify-content: center;">
        <button id="restoreBtn" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        ">
          ✓ Restore My Progress
        </button>
        <button id="discardBtn" style="
          background: white;
          color: #4a5568;
          border: 1px solid #d1dce6;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        ">
          Start Fresh
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add hover effects
    const restoreBtn = dialog.querySelector('#restoreBtn');
    const discardBtn = dialog.querySelector('#discardBtn');

    restoreBtn.addEventListener('mouseenter', () => {
      restoreBtn.style.background = '#2563eb';
      restoreBtn.style.transform = 'translateY(-2px)';
    });
    restoreBtn.addEventListener('mouseleave', () => {
      restoreBtn.style.background = '#3b82f6';
      restoreBtn.style.transform = 'translateY(0)';
    });

    discardBtn.addEventListener('mouseenter', () => {
      discardBtn.style.background = '#f7f9fc';
      discardBtn.style.borderColor = '#b8c5d3';
    });
    discardBtn.addEventListener('mouseleave', () => {
      discardBtn.style.background = 'white';
      discardBtn.style.borderColor = '#d1dce6';
    });

    // Handle restore
    restoreBtn.addEventListener('click', () => {
      restoreFormData(savedData);
      overlay.remove();
      showNotification('✓ Progress restored!', 'success');
    });

    // Handle discard
    discardBtn.addEventListener('click', () => {
      clearSavedData();
      overlay.remove();
      showNotification('Starting with a clean form', 'info');
    });

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Format time ago
   */
  function formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''} ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) !== 1 ? 's' : ''} ago`;
  }

  /**
   * Save current form data
   */
  function saveFormData() {
    if (!currentForm) return;

    const formData = {};
    let fieldCount = 0;

    // Get all form inputs
    const inputs = currentForm.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.name || input.id;
      if (!name) return;

      // Skip password fields and other sensitive data
      if (input.type === 'password' || input.dataset.noAutosave) {
        return;
      }

      let value = null;

      if (input.type === 'checkbox') {
        value = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          value = input.value;
        } else {
          return; // Skip unchecked radio buttons
        }
      } else if (input.type === 'file') {
        // Don't save file inputs
        return;
      } else {
        value = input.value;
      }

      if (value !== null && value !== '' && value !== false) {
        formData[name] = value;
        fieldCount++;
      }
    });

    // Only save if there's actual data
    if (fieldCount === 0) {
      return;
    }

    const saveData = {
      timestamp: new Date().toISOString(),
      fieldCount: fieldCount,
      data: formData
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(saveData));
      updateSaveIndicator('saved');
      console.log(`[FormAutoSave] Saved ${fieldCount} fields`);
    } catch (error) {
      console.error('[FormAutoSave] Failed to save:', error);
      updateSaveIndicator('error');
    }
  }

  /**
   * Get saved data
   */
  function getSavedData() {
    try {
      const data = localStorage.getItem(getStorageKey());
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[FormAutoSave] Failed to load saved data:', error);
      return null;
    }
  }

  /**
   * Restore form data
   */
  function restoreFormData(savedData) {
    if (!currentForm || !savedData) return;

    const data = savedData.data;
    let restoredCount = 0;

    Object.keys(data).forEach(name => {
      const input = currentForm.querySelector(`[name="${name}"], #${name}`);
      if (!input) return;

      const value = data[name];

      if (input.type === 'checkbox') {
        input.checked = value;
        restoredCount++;
      } else if (input.type === 'radio') {
        if (input.value === value) {
          input.checked = true;
          restoredCount++;
        }
      } else {
        input.value = value;
        restoredCount++;
      }

      // Trigger change event for any listeners
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    console.log(`[FormAutoSave] Restored ${restoredCount} fields`);
  }

  /**
   * Clear saved data
   */
  function clearSavedData() {
    try {
      localStorage.removeItem(getStorageKey());
      console.log('[FormAutoSave] Cleared saved data');
    } catch (error) {
      console.error('[FormAutoSave] Failed to clear saved data:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  function startAutoSave() {
    if (saveTimer) {
      clearInterval(saveTimer);
    }

    saveTimer = setInterval(() => {
      saveFormData();
    }, CONFIG.SAVE_INTERVAL);
  }

  /**
   * Attach form change listeners
   */
  function attachFormListeners() {
    if (!currentForm) return;

    let debounceTimer;
    
    currentForm.addEventListener('input', () => {
      updateSaveIndicator('saving');
      
      // Debounce: save 2 seconds after user stops typing
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveFormData();
      }, 2000);
    });

    currentForm.addEventListener('change', () => {
      updateSaveIndicator('saving');
      
      // Save immediately on dropdown/checkbox changes
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveFormData();
      }, 500);
    });
  }

  /**
   * Attach page unload listener
   */
  function attachUnloadListener() {
    window.addEventListener('beforeunload', (e) => {
      // Save immediately before page closes
      saveFormData();
    });
  }

  /**
   * Attach form submit listener
   */
  function attachSubmitListener() {
    if (!currentForm) return;

    currentForm.addEventListener('submit', () => {
      // Clear saved data on successful submission
      setTimeout(() => {
        clearSavedData();
        console.log('[FormAutoSave] Form submitted, cleared saved data');
      }, 100);
    });
  }

  /**
   * Add save indicator to UI
   */
  function addSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autosaveIndicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border: 1px solid #d1dce6;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: #718096;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: none;
      align-items: center;
      gap: 0.5rem;
      z-index: 9999;
      transition: all 0.3s ease;
    `;

    indicator.innerHTML = `
      <span id="saveIcon">💾</span>
      <span id="saveText">Autosave enabled</span>
    `;

    document.body.appendChild(indicator);

    // Show indicator briefly on page load
    setTimeout(() => {
      indicator.style.display = 'flex';
      setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
          indicator.style.display = 'none';
          indicator.style.opacity = '1';
        }, 300);
      }, 2000);
    }, 500);
  }

  /**
   * Update save indicator
   */
  function updateSaveIndicator(status) {
    const indicator = document.getElementById('autosaveIndicator');
    if (!indicator) return;

    const icon = document.getElementById('saveIcon');
    const text = document.getElementById('saveText');

    indicator.style.display = 'flex';

    switch (status) {
      case 'saving':
        icon.textContent = '💾';
        text.textContent = 'Saving...';
        indicator.style.background = '#fef3c7';
        indicator.style.borderColor = '#f59e0b';
        indicator.style.color = '#78350f';
        break;
      
      case 'saved':
        icon.textContent = '✓';
        text.textContent = 'Saved';
        indicator.style.background = '#dcfce7';
        indicator.style.borderColor = '#10b981';
        indicator.style.color = '#065f46';
        
        // Hide after 2 seconds
        setTimeout(() => {
          indicator.style.opacity = '0';
          setTimeout(() => {
            indicator.style.display = 'none';
            indicator.style.opacity = '1';
          }, 300);
        }, 2000);
        break;
      
      case 'error':
        icon.textContent = '⚠️';
        text.textContent = 'Save failed';
        indicator.style.background = '#fee2e2';
        indicator.style.borderColor = '#ef4444';
        indicator.style.color = '#991b1b';
        
        // Hide after 3 seconds
        setTimeout(() => {
          indicator.style.opacity = '0';
          setTimeout(() => {
            indicator.style.display = 'none';
            indicator.style.opacity = '1';
          }, 300);
        }, 3000);
        break;
    }
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#e0f2fe'};
      border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0284c7'};
      color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#0c4a6e'};
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);

    // Add animation styles if not already present
    if (!document.getElementById('notificationStyles')) {
      const style = document.createElement('style');
      style.id = 'notificationStyles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Manually trigger save (can be called from outside)
   */
  function save() {
    saveFormData();
  }

  /**
   * Manually clear saved data (can be called from outside)
   */
  function clear() {
    clearSavedData();
  }

  // Public API
  return {
    init,
    save,
    clear
  };

})();

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    FormAutoSave.init();
  });
} else {
  FormAutoSave.init();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormAutoSave;
}
