/**
 * Claim Navigator Feature Gating System
 * Blocks access to Pro/Enterprise features based on user tier
 */

function showTierUpgradeModal(required) {
  const modal = document.getElementById("tier-upgrade-modal");
  if (!modal) {
    // Create modal if it doesn't exist
    createTierUpgradeModal();
    const newModal = document.getElementById("tier-upgrade-modal");
    if (newModal) {
      const text = document.getElementById("tier-upgrade-text");
      if (required === "pro") {
        text.textContent = "This feature is available on Pro and Enterprise plans.";
      } else if (required === "enterprise") {
        text.textContent = "This feature is available on the Enterprise plan.";
      }
      newModal.classList.remove("hidden");
    }
    return;
  }
  
  const text = document.getElementById("tier-upgrade-text");
  if (text) {
    if (required === "pro") {
      text.textContent = "This feature is available on Pro and Enterprise plans.";
    } else if (required === "enterprise") {
      text.textContent = "This feature is available on the Enterprise plan.";
    }
  }
  modal.classList.remove("hidden");
}

function createTierUpgradeModal() {
  // Check if modal already exists
  if (document.getElementById("tier-upgrade-modal")) return;
  
  const modal = document.createElement("div");
  modal.id = "tier-upgrade-modal";
  modal.className = "resume-modal hidden";
  modal.innerHTML = `
    <div class="resume-modal-content">
      <h3>Unlock This Feature</h3>
      <p id="tier-upgrade-text"></p>
      <div class="resume-modal-actions">
        <a href="/app/upgrade.html" class="btn-primary">See Pro & Enterprise Plans</a>
        <button id="tier-upgrade-close" class="btn-outline">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Close button handler
  const closeBtn = document.getElementById("tier-upgrade-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }
  
  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

// Feature gating on click
document.addEventListener("click", e => {
  if (!window.CNUserTier) return;
  
  const gated = e.target.closest("[data-tier-required]");
  if (!gated) return;
  
  const required = gated.getAttribute("data-tier-required"); // "pro" or "enterprise"
  const tier = CNUserTier.getUserTier();
  
  const tierRank = { free: 0, pro: 1, enterprise: 2 };
  if (tierRank[tier] < tierRank[required]) {
    e.preventDefault();
    e.stopPropagation();
    showTierUpgradeModal(required);
  }
});

// Initialize modal on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createTierUpgradeModal);
} else {
  createTierUpgradeModal();
}

