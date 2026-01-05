/**
 * Document Watermark Module
 * Phase 12A - Adds header and footer with claim profile data
 */

function buildDocShell(bodyHtml) {
  // Fix spacing issues first
  let cleanedBody = bodyHtml;
  if (window.fixDocumentSpacing) {
    cleanedBody = fixDocumentSpacing(bodyHtml);
  }
  
  if (!window.CNClaimProfile) {
    console.warn("CNClaimProfile not available, rendering without header/footer");
    return cleanedBody;
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
      <div>
        <div><strong style="font-size:15px;">${claimantName || "Claimant"}</strong></div>
        <div style="font-size:13px;">
          ${address ? `${address}<br>` : ""}
          ${cityStateZip || ""}
        </div>
      </div>
      <div class="cn-doc-header-meta">
        <div><strong>Claim #:</strong> ${claimNumber}</div>
        <div><strong>Carrier:</strong> ${carrier}</div>
        <div><strong>Date of Loss:</strong> ${lossDate}</div>
      </div>
    </div>
  `;

  const footer = `
    <div class="cn-doc-footer">
      <div style="margin-bottom:2px;">Claim Navigator — Professional Claim Tools</div>
      <div>Generated for ${claimantName || "Claimant"} • Claim # ${claimNumber || "N/A"}</div>
      <div style="margin-top:4px; font-size:10px;">
        Informational use only. Claim Navigator is not a law firm or public adjuster and does not provide legal advice.
        Review all content before sending to your insurer. © ${new Date().getFullYear()} Claim Navigator.
      </div>
    </div>
  `;

  return `
    <div class="cn-doc-page cn-doc-watermark-bg">
      <div class="cn-doc-content">
        ${header}
        ${cleanedBody}
        ${footer}
      </div>
    </div>
  `;
}

window.buildDocShell = buildDocShell;

