/**
 * Claim Navigator Event Analytics System
 * Tracks user interactions and events for analytics and monetization
 */

window.CNAnalytics = {
  log(eventName, data = {}) {
    try {
      const payload = {
        event: eventName,
        data,
        ts: Date.now(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };
      
      const logs = JSON.parse(localStorage.getItem("cn_events") || "[]");
      logs.push(payload);
      
      // Keep only last 1000 events to prevent storage bloat
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem("cn_events", JSON.stringify(logs));
      
      // Optional: Send to analytics endpoint (if configured)
      if (window.CNAnalytics.endpoint) {
        fetch(window.CNAnalytics.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Analytics send error:', err));
      }
    } catch (e) {
      console.error("Analytics error:", e);
    }
  },
  
  // Optional: Set custom analytics endpoint
  endpoint: null,
  
  // Get all events
  getEvents() {
    return JSON.parse(localStorage.getItem("cn_events") || "[]");
  },
  
  // Clear events
  clearEvents() {
    localStorage.removeItem("cn_events");
  }
};

// Auto-log page views
document.addEventListener("DOMContentLoaded", () => {
  CNAnalytics.log("page_view", { 
    url: window.location.pathname,
    search: window.location.search 
  });
});

// Auto-log link clicks
document.addEventListener("click", e => {
  const link = e.target.closest("a");
  if (link && link.href) {
    CNAnalytics.log("link_click", { 
      href: link.href,
      text: link.textContent?.trim().substring(0, 50) || ""
    });
  }
});

// Auto-log button clicks
document.addEventListener("click", e => {
  const button = e.target.closest("button");
  if (button && button.id) {
    CNAnalytics.log("button_click", { 
      buttonId: button.id,
      text: button.textContent?.trim().substring(0, 50) || ""
    });
  }
});

