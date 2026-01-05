/**
 * Compliance Banner System
 * Mega Build C - Global compliance messaging
 */

(function() {
  const KEY = "cn_compliance_acknowledged";

  function shouldShow() {
    return !localStorage.getItem(KEY);
  }

  function markAcknowledged() {
    localStorage.setItem(KEY, "1");
    const el = document.getElementById("cn-compliance-banner");
    if (el) el.style.display = "none";
  }

  function renderBanner(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !shouldShow()) return;

    const div = document.createElement("div");
    div.id = "cn-compliance-banner";
    div.className = "cn-compliance-banner";
    div.innerHTML = `
      <div>
        <strong>Important:</strong>
        Claim Navigator provides informational tools and document assistance only.
        It is not a law firm, does not provide legal advice, and does not act as a public adjuster,
        attorney, or insurance producer. You are responsible for all decisions related to your claim.
        For legal, coverage, or representation questions, consult a licensed professional in your state.
      </div>
      <button type="button" id="cn-compliance-dismiss">Dismiss</button>
    `;
    container.prepend(div);

    const btn = div.querySelector("#cn-compliance-dismiss");
    if (btn) {
      btn.addEventListener("click", markAcknowledged);
    }
  }

  window.CNCompliance = {
    renderBanner,
    markAcknowledged
  };
})();

