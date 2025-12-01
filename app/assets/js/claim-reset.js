/**
 * Claim Reset System
 * Mega Build A - Safe reset of all claim data
 */

(function() {
  // Create reset modal if it doesn't exist
  function ensureResetModal() {
    let modal = document.getElementById('cn-reset-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cn-reset-modal';
      modal.className = 'cn-error-modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="cn-error-modal-content">
          <div class="cn-error-modal-header">
            <div class="cn-error-modal-title">Clear My Claim Data</div>
            <button class="cn-error-modal-close" onclick="window.CNReset.hide()">×</button>
          </div>
          <div class="cn-error-modal-message">
            Are you sure you want to clear all claim data?<br><br>
            This will erase your claim profile, evidence, documents, timeline, and all related data.
            This action cannot be undone.
          </div>
          <div class="cn-error-modal-actions">
            <button class="cn-error-modal-btn cn-error-modal-btn-secondary" onclick="window.CNReset.hide()">Cancel</button>
            <button class="cn-error-modal-btn cn-error-modal-btn-primary" id="cn-reset-confirm-btn">Reset</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          window.CNReset.hide();
        }
      });

      // Confirm button handler
      document.getElementById('cn-reset-confirm-btn').addEventListener('click', () => {
        window.CNReset.execute();
      });
    }
    return modal;
  }

  // Reset API
  window.CNReset = {
    show: function() {
      const modal = ensureResetModal();
      modal.style.display = 'flex';
      modal.classList.add('show');
    },

    hide: function() {
      const modal = document.getElementById('cn-reset-modal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    },

    execute: function() {
      try {
        // Use CNStorage.purgeAll() if available
        if (window.CNStorage && window.CNStorage.purgeAll) {
          window.CNStorage.purgeAll();
        } else {
          // Fallback to manual removal
          const keysToRemove = [
            'cn_claim_profile',
            'cn_evidence_list',
            'cn_evidence_photo_count',
            'cn_document_list',
            'cn_docs_generated',
            'cn_claim_timeline',
            'cn_claim_health_score',
            'currentStageId',
            'completedStageIds',
            'claimRoadmapProgress',
            'roadmapToolStatus',
            'cn_guided_tour_complete',
            'cn_guided_tour_step',
            'cn_lowball_detected',
            'dismissedResumeModal',
            'globalRoadmapStageName',
            'cn_storage_v2',
            'cn_storage_backups',
            'cn_snapshots'
          ];

          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
          });

          // Also clear any keys that start with 'cn_'
          const allKeys = Object.keys(localStorage);
          allKeys.forEach(key => {
            if (key.startsWith('cn_')) {
              localStorage.removeItem(key);
            }
          });
        }

        // Hide modal
        window.CNReset.hide();

        // Show success toast
        if (window.CNToast) {
          window.CNToast.success('Claim data reset successfully.');
        }

        // Redirect to onboarding after a short delay
        setTimeout(() => {
          window.location.href = '/app/onboarding/index.html';
        }, 1000);

      } catch (error) {
        console.error('CNError (Reset):', error);
        if (window.CNModalError) {
          window.CNModalError.show('Reset Error', 'Failed to reset claim data. Please try again.', error.toString());
        }
      }
    }
  };
})();

