/**
 * Document Watermark Module
 * Phase 12A - Adds header and footer with claim profile data
 */

function buildDocShell(bodyHtml) {
  if (!window.CNClaimProfile) {
    console.warn("CNClaimProfile not available, rendering without header/footer");
    return bodyHtml;
  }

  const profile = CNClaimProfile.getClaimProfile() || {};
  const c = profile.claimant || {};
  const cl = profile.claim || {};
  const p = profile.property || {};

  const claimantName = c.name || "";
  const address = p.address || c.address || "";
  const cityStateZip = [p.city || c.city, p.state || c.state, p.zip || c.zip].filter(Boolean).join(", ");
  const claimNumber = cl.claimNumber || "N/A";
  const carrier = cl.carrier || "N/A";
  const lossDate = cl.lossDate ? new Date(cl.lossDate).toLocaleDateString() : "N/A";

  const header = `
    <div class="cn-doc-header">
      <div class="cn-doc-header-line">
        <div>
          <strong>${claimantName || "Claimant"}</strong><br>
          ${address ? address + "<br>" : ""}
          ${cityStateZip || ""}
        </div>
        <div style="text-align:right;">
          <strong>Claim #:</strong> ${claimNumber}<br>
          <strong>Carrier:</strong> ${carrier}<br>
          <strong>Date of Loss:</strong> ${lossDate}
        </div>
      </div>
    </div>
  `;

  const footer = `
    <div class="cn-doc-footer">
      ClaimNavigator AI • Professional Claim Tools • Generated for ${claimantName || "Claimant"} • Claim # ${claimNumber}<br>
      © ${new Date().getFullYear()} Claim Navigator AI – Powered by Axis Strategic Holdings. All rights reserved.
    </div>
  `;

  return `
    <div class="cn-doc-watermark-bg">
      <div class="cn-doc-content">
        ${header}
        ${bodyHtml}
        ${footer}
      </div>
    </div>
  `;
}

window.buildDocShell = buildDocShell;

