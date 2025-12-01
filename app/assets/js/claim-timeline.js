/**
 * Claim Timeline Logger
 * Phase 15.2 - Track major claim actions for portfolio generation
 */

(function() {
  const KEY = "cn_claim_timeline";

  function log(action, meta = {}) {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    list.push({
      id: Date.now(),
      action,
      meta,
      ts: Date.now()
    });
    // Keep only last 500 entries
    if (list.length > 500) {
      list.splice(0, list.length - 500);
    }
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  window.CNTimeline = { log };
})();

