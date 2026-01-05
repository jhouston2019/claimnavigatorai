/**
 * Claim Navigator Upgrade Hooks System
 * Centralized upgrade trigger and messaging system
 */

window.CNUpgradeMessages = {
  "3_stage_complete": {
    title: "Unlock Advanced Claim Tools",
    desc: "You've completed 3 stages. Pro unlocks negotiation, compliance, and full AI support."
  },
  "using_advanced_tools": {
    title: "Advanced Tools Require Pro",
    desc: "Compliance Engine, Settlement Analysis, and Legal Suite are Pro features."
  },
  "lowball_detected": {
    title: "Fight Lowball Offers with Pro Tools",
    desc: "Unlock negotiation scripts, compliance escalations, and advanced insurer-response AI."
  },
  "health_low": {
    title: "Boost Your Claim Health",
    desc: "Pro tools can increase your claim's payout potential significantly."
  },
  "document_generated": {
    title: "Professional PDFs Require Pro",
    desc: "Export fully formatted, insurer-ready documents with Pro."
  },
  "checkout_abandoned": {
    title: "Complete Your Upgrade",
    desc: "You started an upgrade. Complete it now to unlock Pro features."
  }
};

window.CNUpgrade = {
  show(name, data = {}) {
    // Record trigger to analytics
    if (window.CNAnalytics) {
      CNAnalytics.log("upgrade_trigger", { name, data });
    }
    
    // Get message
    const message = CNUpgradeMessages[name];
    if (!message) {
      console.warn("Unknown upgrade trigger:", name);
      return;
    }
    
    // Trigger upgrade modal
    const modal = document.getElementById("upgrade-offer-modal");
    const title = document.getElementById("upgrade-offer-title");
    const desc = document.getElementById("upgrade-offer-desc");
    
    if (modal && title && desc) {
      title.textContent = message.title;
      desc.textContent = message.desc;
      modal.classList.remove("hidden");
    } else {
      // Fallback: redirect to pricing page
      if (confirm(message.title + "\n\n" + message.desc + "\n\nWould you like to see pricing?")) {
        window.location.href = "/app/pricing.html";
      }
    }
  },
  
  hide() {
    const modal = document.getElementById("upgrade-offer-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }
};

// Initialize modal close handlers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("upgrade-offer-modal");
    if (modal) {
      // Close on backdrop click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          CNUpgrade.hide();
        }
      });
    }
  });
} else {
  const modal = document.getElementById("upgrade-offer-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        CNUpgrade.hide();
      }
    });
  }
}

