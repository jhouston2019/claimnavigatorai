/**
 * Claim Timeline Logger
 * Phase 15.2 - Track major claim actions for portfolio generation
 */

(function() {
  const KEY = "cn_claim_timeline";

  function log(action, meta = {}) {
    try {
      let list = [];
      
      // Try storage-v2 first
      if (window.CNStorage) {
        list = window.CNStorage.getSection("timeline") || [];
      } else {
        // Fallback to old localStorage
        list = JSON.parse(localStorage.getItem(KEY) || "[]");
      }
      
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
      
      // Save to storage-v2
      if (window.CNStorage) {
        window.CNStorage.setSection("timeline", list);
      }
      
      // Also save to old key for backward compatibility
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      console.error("CNError (Timeline Log):", e);
    }
  }

  window.CNTimeline = { log };
})();

