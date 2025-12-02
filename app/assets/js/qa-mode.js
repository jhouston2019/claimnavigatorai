/**
 * QA Mode - Debug and Testing Tools
 * Phase G - Internal QA Mode for verifying all tool outputs
 * Access via CTRL + SHIFT + D
 */

(function() {
  let qaModeActive = false;
  const QA_KEY = 'cn_qa_mode_active';

  function initQAMode() {
    // Check if QA mode is already active
    if (localStorage.getItem(QA_KEY) === 'true') {
      qaModeActive = true;
      showQAPanel();
    }

    // Listen for keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleQAMode();
      }
    });
  }

  function toggleQAMode() {
    qaModeActive = !qaModeActive;
    localStorage.setItem(QA_KEY, qaModeActive ? 'true' : 'false');
    
    if (qaModeActive) {
      showQAPanel();
      if (window.CNToast) {
        window.CNToast.info('QA Mode Enabled');
      }
    } else {
      hideQAPanel();
      if (window.CNToast) {
        window.CNToast.info('QA Mode Disabled');
      }
    }
  }

  function showQAPanel() {
    // Remove existing panel if any
    const existing = document.getElementById('cn-qa-panel');
    if (existing) {
      existing.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'cn-qa-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(15,23,42,0.98);
      border: 2px solid #38bdf8;
      border-radius: 12px;
      padding: 20px;
      z-index: 999999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      color: #ffffff;
      font-size: 14px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    const profile = window.CNClaimProfile?.getClaimProfile() || {};
    const health = window.CNHealth ? window.CNHealth.compute() : { score: 0, flags: [] };
    const stateCode = window.CNClaimProfile?.getClaimStateCode(profile);
    const stateModule = window.CNStateModules?.get(stateCode) || null;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; color: #38bdf8; font-size: 18px;">QA Mode</h3>
        <button id="cn-qa-close" style="background: none; border: none; color: #ffffff; cursor: pointer; font-size: 20px;">×</button>
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>Claim Profile:</strong>
        <div style="margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 12px; max-height: 100px; overflow-y: auto;">
          ${JSON.stringify(profile, null, 2)}
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>Claim Health:</strong>
        <div style="margin-top: 8px;">
          Score: ${health.score || 0}<br>
          Flags: ${health.flags?.length || 0}<br>
          State: ${health.stateName || 'N/A'}
        </div>
      </div>
      
      ${stateModule ? `
        <div style="margin-bottom: 16px;">
          <strong>State Module:</strong>
          <div style="margin-top: 8px;">
            ${stateModule.name} (${stateModule.code})<br>
            Proof of Loss: ${stateModule.deadlines.proofOfLossDays} days<br>
            Statutes: ${stateModule.regulations.statutes?.length || 0}
          </div>
        </div>
      ` : ''}
      
      <div style="margin-bottom: 16px;">
        <strong>Storage:</strong>
        <div style="margin-top: 8px;">
          Evidence: ${window.CNStorage ? window.CNStorage.getSection("evidence")?.count || 0 : localStorage.getItem("cn_evidence_photo_count") || 0}<br>
          Documents: ${window.CNStorage ? window.CNStorage.getSection("documents")?.count || 0 : localStorage.getItem("cn_docs_generated") || 0}
        </div>
      </div>
      
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
        <button id="cn-qa-test-pdf" style="width: 100%; padding: 8px; background: #38bdf8; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 8px;">
          Test PDF Render
        </button>
        <button id="cn-qa-test-health" style="width: 100%; padding: 8px; background: #38bdf8; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 8px;">
          Recalc Health
        </button>
        <button id="cn-qa-disable" style="width: 100%; padding: 8px; background: rgba(239,68,68,0.8); color: #fff; border: none; border-radius: 6px; cursor: pointer;">
          Disable QA Mode
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    // Event handlers
    document.getElementById('cn-qa-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    document.getElementById('cn-qa-disable').addEventListener('click', () => {
      toggleQAMode();
    });

    document.getElementById('cn-qa-test-pdf').addEventListener('click', () => {
      if (window.buildDocShell) {
        const testContent = '<h1>Test Document</h1><p>This is a test PDF render.</p>';
        const html = window.buildDocShell(testContent);
        const win = window.open();
        win.document.write(html);
        win.document.close();
        if (window.CNToast) {
          window.CNToast.success('PDF test opened in new window');
        }
      } else {
        if (window.CNToast) {
          window.CNToast.error('buildDocShell not available');
        }
      }
    });

    document.getElementById('cn-qa-test-health').addEventListener('click', () => {
      if (window.CNHealth) {
        const health = window.CNHealth.compute();
        if (window.CNHealthHooks) {
          window.CNHealthHooks.trigger();
        }
        if (window.CNToast) {
          window.CNToast.success(`Health recalculated: ${health.score}`);
        }
      }
    });
  }

  function hideQAPanel() {
    const panel = document.getElementById('cn-qa-panel');
    if (panel) {
      panel.remove();
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQAMode);
  } else {
    initQAMode();
  }

  window.CNQAMode = {
    isActive: () => qaModeActive,
    enable: () => {
      qaModeActive = true;
      localStorage.setItem(QA_KEY, 'true');
      showQAPanel();
    },
    disable: () => {
      qaModeActive = false;
      localStorage.setItem(QA_KEY, 'false');
      hideQAPanel();
    }
  };
})();

