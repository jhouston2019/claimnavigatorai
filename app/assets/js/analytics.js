/**
 * Claim Navigator Analytics
 * Tracks user interactions and conversions
 */

class CNAnalytics {
  constructor() {
    this.enabled = true;
    this.sessionStart = Date.now();
    this.stepStartTimes = {};
  }

  /**
   * Track an event
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  track(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      event: eventName,
      ...properties,
      timestamp: new Date().toISOString(),
      session_duration_seconds: Math.floor((Date.now() - this.sessionStart) / 1000),
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };

    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Analytics]', eventName, event);
    }

    // Send to analytics endpoint
    this._sendToBackend(event);

    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // Send to Facebook Pixel if available
    if (window.fbq) {
      window.fbq('trackCustom', eventName, properties);
    }
  }

  /**
   * Send event to backend
   * @private
   */
  async _sendToBackend(event) {
    try {
      await fetch('/.netlify/functions/track-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  /**
   * Track page view
   */
  pageView() {
    this.track('page_view', {
      page_path: window.location.pathname,
      page_title: document.title
    });
  }

  /**
   * Track checkout initiated
   */
  checkoutInitiated(sourcePage) {
    this.track('checkout_initiated', {
      source_page: sourcePage
    });
  }

  /**
   * Track step started
   */
  stepStarted(stepNumber, stepTitle, claimId) {
    this.stepStartTimes[stepNumber] = Date.now();
    
    this.track('step_started', {
      step_number: stepNumber,
      step_title: stepTitle,
      claim_id: claimId
    });
  }

  /**
   * Track step completed
   */
  stepCompleted(stepNumber, stepTitle, claimId) {
    const timeSpent = this.stepStartTimes[stepNumber] 
      ? Math.floor((Date.now() - this.stepStartTimes[stepNumber]) / 1000)
      : 0;
    
    this.track('step_completed', {
      step_number: stepNumber,
      step_title: stepTitle,
      claim_id: claimId,
      time_spent_seconds: timeSpent
    });
  }

  /**
   * Track tool launched
   */
  toolLaunched(toolId, toolName, stepNumber, claimId) {
    this.track('tool_launched', {
      tool_id: toolId,
      tool_name: toolName,
      step_number: stepNumber,
      claim_id: claimId
    });
  }

  /**
   * Track tool completed
   */
  toolCompleted(toolId, toolName, stepNumber, claimId, outputType) {
    this.track('tool_completed', {
      tool_id: toolId,
      tool_name: toolName,
      step_number: stepNumber,
      claim_id: claimId,
      output_type: outputType
    });
  }

  /**
   * Track document uploaded
   */
  documentUploaded(documentType, fileSize, stepNumber, claimId) {
    this.track('document_uploaded', {
      document_type: documentType,
      file_size_bytes: fileSize,
      step_number: stepNumber,
      claim_id: claimId
    });
  }

  /**
   * Track document exported
   */
  documentExported(documentType, exportFormat, stepNumber, claimId) {
    this.track('document_exported', {
      document_type: documentType,
      export_format: exportFormat,
      step_number: stepNumber,
      claim_id: claimId
    });
  }

  /**
   * Track claim submitted
   */
  claimSubmitted(claimId, submissionMethod) {
    this.track('claim_submitted', {
      claim_id: claimId,
      submission_method: submissionMethod
    });
  }

  /**
   * Track claim closed
   */
  claimClosed(claimId, outcome, settlementAmount) {
    this.track('claim_closed', {
      claim_id: claimId,
      outcome: outcome,
      settlement_amount: settlementAmount
    });
  }

  /**
   * Track carrier response received
   */
  carrierResponseReceived(claimId, responseType) {
    this.track('carrier_response_received', {
      claim_id: claimId,
      response_type: responseType
    });
  }

  /**
   * Track negotiation tool used
   */
  negotiationToolUsed(claimId, toolType, stepNumber) {
    this.track('negotiation_tool_used', {
      claim_id: claimId,
      tool_type: toolType,
      step_number: stepNumber
    });
  }
}

// Initialize global analytics instance
window.CNAnalytics = new CNAnalytics();

// Track page view on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CNAnalytics.pageView();
  });
} else {
  window.CNAnalytics.pageView();
}
