/**
 * TOOL OUTPUT INTEGRATION BRIDGE
 * 
 * This module bridges the gap between Resource Center tools and the Step Guide.
 * It enables tools to save outputs to localStorage and return to the step guide.
 * 
 * This is the final integration piece that makes the system end-to-end functional.
 */

// Import canonical storage abstraction (handles session namespacing)
// Note: Using relative path since claimStorage.js is in /storage/
// This import will be resolved at runtime via script loading order

/**
 * Save tool output and return to step guide
 * @param {Object} params - Bridge parameters
 * @param {number} params.step - Step number (1-13)
 * @param {string} params.toolId - Tool identifier from registry
 * @param {string} params.reportName - Human-readable report name
 * @param {Object} params.output - Tool output data
 */
export function saveAndReturn({ step, toolId, reportName, output, summary, sections }) {
  if (!step || !toolId) {
    console.error("Missing required bridge parameters:", { step, toolId });
    return;
  }

  // Construct storage key matching step guide expectations
  const storageKey = `claim_step_${step}_${toolId}_output`;

  // Normalize output structure - flatten for step guide compatibility
  const normalizedOutput = {
    summary: summary || output?.summary || output?.html?.substring(0, 200) || "Report generated successfully",
    sections: sections || output?.sections || output || {},
    metadata: {
      toolId: toolId,
      step: step,
      reportName: reportName || `Step ${step} Report`,
      generatedAt: new Date().toISOString()
    }
  };

  // Save using canonical storage abstraction (handles session namespacing)
  try {
    // Use global saveClaimData function from claimStorage.js
    if (typeof saveClaimData === 'function') {
      saveClaimData(storageKey, normalizedOutput);
      console.log(`✅ Tool output saved: ${storageKey}`);
    } else {
      // Fallback to direct localStorage if claimStorage not loaded
      console.warn('claimStorage.js not loaded, using direct localStorage');
      localStorage.setItem(storageKey, JSON.stringify(normalizedOutput));
    }
  } catch (error) {
    console.error("Failed to save tool output:", error);
    alert("⚠️ Failed to save report. Please try again.");
    return;
  }

  // Get return URL from query params
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get("return") || "/step-by-step-claim-guide";

  // Show success message
  showSuccessMessage(reportName);

  // Redirect back to step guide after brief delay
  setTimeout(() => {
    window.location.href = `${returnUrl}.html?step=${step}&tool=${toolId}&saved=true`;
  }, 1000);
}

/**
 * Show success message to user
 * @param {string} reportName - Name of the report that was saved
 */
function showSuccessMessage(reportName) {
  const message = document.createElement('div');
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10000;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <div>
        <div style="font-weight: 700; margin-bottom: 2px;">Report Saved!</div>
        <div style="font-size: 12px; opacity: 0.9;">${reportName}</div>
      </div>
    </div>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(message);
}

/**
 * Get tool parameters from URL
 * @returns {Object} Tool parameters (step, toolId, return)
 */
export function getToolParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    step: params.get('step'),
    toolId: params.get('toolId'),
    engine: params.get('engine'),
    mode: params.get('mode'),
    return: params.get('return')
  };
}

/**
 * Initialize tool page with return button
 * Call this on tool page load to add navigation back to step guide
 */
export function initToolPage() {
  const params = getToolParams();
  
  if (params.return) {
    addReturnButton(params.return, params.step);
  }
  
  // Log tool initialization
  console.log('Tool page initialized:', params);
}

/**
 * Add return button to tool page
 * @param {string} returnUrl - URL to return to
 * @param {string} step - Current step number
 */
function addReturnButton(returnUrl, step) {
  const button = document.createElement('button');
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    Return to Step ${step || 'Guide'}
  `;
  button.className = 'button secondary';
  button.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  button.onclick = () => {
    window.location.href = `${returnUrl}.html`;
  };
  
  // Add button after page loads
  if (document.body) {
    document.body.appendChild(button);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(button);
    });
  }
}

/**
 * Get report type name for a tool ID
 * @param {string} toolId - Tool identifier
 * @returns {string} Report type name
 */
export function getReportType(toolId) {
  const reportTypes = {
    'policy-intelligence-engine': 'Policy_Intelligence_Report',
    'compliance-review': 'Compliance_Status_Report',
    'damage-documentation': 'Damage_Documentation_Report',
    'estimate-review': 'Estimate_Quality_Report',
    'estimate-comparison': 'Estimate_Comparison_Report',
    'ale-tracker': 'ALE_Compliance_Report',
    'contents-inventory': 'Inventory_Completeness_Report',
    'contents-valuation': 'Contents_Valuation_Report',
    'coverage-alignment': 'Coverage_Alignment_Report',
    'claim-package-assembly': 'Claim_Package_Readiness_Report',
    'claim-submitter': 'Submission_Confirmation_Report',
    'carrier-response': 'Carrier_Response_Analysis_Report',
    'supplement-analysis': 'Supplement_Strategy_Report'
  };
  return reportTypes[toolId] || 'Report';
}

/**
 * Get human-readable report name for a tool ID
 * @param {string} toolId - Tool identifier
 * @returns {string} Human-readable report name
 */
export function getReportName(toolId) {
  const reportNames = {
    'policy-intelligence-engine': 'Policy Intelligence Report',
    'compliance-review': 'Compliance Status Report',
    'damage-documentation': 'Damage Documentation Report',
    'estimate-review': 'Estimate Quality Report',
    'estimate-comparison': 'Estimate Comparison Report',
    'ale-tracker': 'ALE Compliance Report',
    'contents-inventory': 'Inventory Completeness Report',
    'contents-valuation': 'Contents Valuation Report',
    'coverage-alignment': 'Coverage Alignment Report',
    'claim-package-assembly': 'Claim Package Readiness Report',
    'claim-submitter': 'Submission Confirmation Report',
    'carrier-response': 'Carrier Response Analysis Report',
    'supplement-analysis': 'Supplement & Underpayment Analysis Report'
  };
  return reportNames[toolId] || 'Report';
}

// Auto-initialize if loaded on a tool page
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('toolId') && params.get('step')) {
    // Tool page detected - initialize
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initToolPage);
    } else {
      initToolPage();
    }
  }
}

