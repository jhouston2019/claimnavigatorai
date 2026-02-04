# ANALYTICS EVENTS IMPLEMENTATION
**Date:** January 9, 2026  
**Status:** READY FOR IMPLEMENTATION

---

## 🎯 ANALYTICS STRATEGY

### Event Tracking Goals:
1. **Conversion Tracking:** Checkout → Payment → Claim Creation
2. **User Engagement:** Step completion, tool usage, document uploads
3. **Feature Usage:** Which tools are most used, which steps take longest
4. **Drop-off Points:** Where users abandon the workflow

---

## 📊 EVENTS TO IMPLEMENT

### 1. CHECKOUT & PAYMENT EVENTS

#### Event: `checkout_initiated`
**Trigger:** User clicks "Get Your Claim Toolkit" or "Proceed to Checkout"  
**Properties:**
```javascript
{
  event: 'checkout_initiated',
  source_page: window.location.pathname,
  timestamp: new Date().toISOString(),
  user_authenticated: !!user
}
```

**Implementation Location:** `index.html`, `marketing/pricing.html`

#### Event: `checkout_completed`
**Trigger:** Stripe checkout session completed  
**Properties:**
```javascript
{
  event: 'checkout_completed',
  session_id: stripeSessionId,
  amount: 99.00,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** `netlify/functions/stripe-webhook.js`

#### Event: `claim_created`
**Trigger:** New claim record created in database  
**Properties:**
```javascript
{
  event: 'claim_created',
  claim_id: claimId,
  user_id: userId,
  stripe_session_id: sessionId,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** `netlify/functions/stripe-webhook.js`

---

### 2. STEP COMPLETION EVENTS

#### Event: `step_started`
**Trigger:** User opens/expands a step  
**Properties:**
```javascript
{
  event: 'step_started',
  step_number: stepNum,
  step_title: stepData[stepNum].title,
  claim_id: claimId,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** `step-by-step-claim-guide.html` (openStep function)

#### Event: `step_completed`
**Trigger:** User acknowledges step completion  
**Properties:**
```javascript
{
  event: 'step_completed',
  step_number: stepNum,
  step_title: stepData[stepNum].title,
  claim_id: claimId,
  time_spent_seconds: timeSpent,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** `step-by-step-claim-guide.html` (completeAndNext function)

---

### 3. TOOL USAGE EVENTS

#### Event: `tool_launched`
**Trigger:** User clicks to open a tool  
**Properties:**
```javascript
{
  event: 'tool_launched',
  tool_id: toolId,
  tool_name: toolName,
  step_number: stepNum,
  claim_id: claimId,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** `step-by-step-claim-guide.html` (openTool function)

#### Event: `tool_completed`
**Trigger:** Tool generates output successfully  
**Properties:**
```javascript
{
  event: 'tool_completed',
  tool_id: toolId,
  tool_name: toolName,
  step_number: stepNum,
  claim_id: claimId,
  output_type: outputType,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** Tool controller files

---

### 4. DOCUMENT EVENTS

#### Event: `document_uploaded`
**Trigger:** User uploads a document  
**Properties:**
```javascript
{
  event: 'document_uploaded',
  document_type: docType,
  file_size_bytes: fileSize,
  step_number: stepNum,
  claim_id: claimId,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** Upload handlers

#### Event: `document_exported`
**Trigger:** User exports a document (PDF/DOC)  
**Properties:**
```javascript
{
  event: 'document_exported',
  document_type: docType,
  export_format: format,
  step_number: stepNum,
  claim_id: claimId,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** Export functions

---

### 5. CLAIM LIFECYCLE EVENTS

#### Event: `claim_submitted`
**Trigger:** User submits claim to carrier (Step 11)  
**Properties:**
```javascript
{
  event: 'claim_submitted',
  claim_id: claimId,
  submission_method: method,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** Submission tools

#### Event: `claim_closed`
**Trigger:** User marks claim as closed  
**Properties:**
```javascript
{
  event: 'claim_closed',
  claim_id: claimId,
  outcome: outcome,
  settlement_amount: amount,
  timestamp: new Date().toISOString()
}
```

**Implementation Location:** Claim closeout functions

---

## 🔧 IMPLEMENTATION CODE

### Analytics Helper Module
**File:** `app/assets/js/analytics.js`

```javascript
/**
 * Claim Navigator Analytics
 * Tracks user interactions and conversions
 */

class CNAnalytics {
  constructor() {
    this.enabled = true;
    this.sessionStart = Date.now();
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
    if (window.location.hostname === 'localhost') {
      console.log('[Analytics]', eventName, event);
    }

    // Send to analytics endpoint
    this._sendToBackend(event);

    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', eventName, properties);
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
    this.track('step_started', {
      step_number: stepNumber,
      step_title: stepTitle,
      claim_id: claimId
    });
  }

  /**
   * Track step completed
   */
  stepCompleted(stepNumber, stepTitle, claimId, timeSpent) {
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
}

// Initialize global analytics instance
window.CNAnalytics = new CNAnalytics();

// Track page view on load
window.addEventListener('DOMContentLoaded', () => {
  window.CNAnalytics.pageView();
});
```

---

## 📝 INTEGRATION POINTS

### 1. Add to step-by-step-claim-guide.html
```html
<script src="/app/assets/js/analytics.js"></script>
```

### 2. Update openStep function
```javascript
function openStep(stepNum) {
  // Existing code...
  
  // Track step started
  if (window.CNAnalytics) {
    window.CNAnalytics.stepStarted(
      stepNum,
      stepData[stepNum].title,
      getCurrentClaimId()
    );
  }
  
  // Rest of existing code...
}
```

### 3. Update completeAndNext function
```javascript
function completeAndNext(stepNum) {
  // Existing code...
  
  // Track step completed
  if (window.CNAnalytics) {
    const timeSpent = calculateTimeSpent(stepNum);
    window.CNAnalytics.stepCompleted(
      stepNum,
      stepData[stepNum].title,
      getCurrentClaimId(),
      timeSpent
    );
  }
  
  // Rest of existing code...
}
```

### 4. Update openTool function
```javascript
function openTool(toolId, stepNum) {
  // Track tool launch
  if (window.CNAnalytics) {
    window.CNAnalytics.toolLaunched(
      toolId,
      getToolName(toolId),
      stepNum,
      getCurrentClaimId()
    );
  }
  
  // Existing code...
}
```

---

## 🗄️ BACKEND FUNCTION

### File: `netlify/functions/track-analytics.js`

```javascript
/**
 * Analytics Tracking Endpoint
 * Stores analytics events in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const analyticsEvent = JSON.parse(event.body);

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Store event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: analyticsEvent.event,
        event_properties: analyticsEvent,
        user_id: analyticsEvent.user_id || null,
        claim_id: analyticsEvent.claim_id || null,
        created_at: analyticsEvent.timestamp
      });

    if (error) {
      console.error('Error storing analytics event:', error);
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to track event' })
    };
  }
};
```

---

## 📊 DATABASE SCHEMA

### Table: `analytics_events`

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_properties JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  claim_id UUID REFERENCES claims(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  INDEX idx_analytics_event_name ON analytics_events(event_name),
  INDEX idx_analytics_user_id ON analytics_events(user_id),
  INDEX idx_analytics_claim_id ON analytics_events(claim_id),
  INDEX idx_analytics_created_at ON analytics_events(created_at)
);
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Create `app/assets/js/analytics.js`
- [ ] Create `netlify/functions/track-analytics.js`
- [ ] Add analytics_events table to Supabase
- [ ] Add analytics script to step-by-step-claim-guide.html
- [ ] Integrate tracking in openStep function
- [ ] Integrate tracking in completeAndNext function
- [ ] Integrate tracking in openTool function
- [ ] Add tracking to checkout buttons
- [ ] Add tracking to stripe-webhook.js
- [ ] Test all events in development
- [ ] Verify events appear in database
- [ ] Deploy to production

---

**Status:** ✅ SPECIFICATION COMPLETE - READY FOR IMPLEMENTATION  
**Estimated Implementation Time:** 3-4 hours  
**Priority:** HIGH (required for launch metrics)


