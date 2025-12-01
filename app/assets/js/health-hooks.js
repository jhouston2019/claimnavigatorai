/**
 * Claim Health Recalculation Hooks
 * Phase 14.1 - Real-time health score updates
 */

(function() {
  // Debounce to prevent multiple rapid recalculations
  let timeout = null;

  function triggerHealthRecalc() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (window.CNHealth?.compute) {
        const updated = window.CNHealth.compute();
        document.dispatchEvent(new CustomEvent("claimHealthUpdated", { detail: updated }));
      }
    }, 200);
  }

  // Expose globally
  window.CNHealthHooks = {
    trigger: triggerHealthRecalc
  };
})();

