/**
 * Event Recorder Utility
 * Records system events to system_events table
 */

/**
 * Record a system event
 * @param {string} eventType - Type of event
 * @param {string} source - Source of event (tool name, system component)
 * @param {object} metadata - Additional event metadata
 */
export async function recordEvent(eventType, source, metadata = {}) {
  try {
    // Call backend to record event
    const response = await fetch('/.netlify/functions/monitoring/record-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: eventType,
        source: source,
        metadata: metadata
      })
    });

    if (!response.ok) {
      console.warn('Failed to record event:', eventType);
    }
  } catch (error) {
    // Non-critical - don't break user flow
    console.warn('Event recording failed:', error);
  }
}

/**
 * Record events for common actions
 */
export const EventTypes = {
  FNOL_CREATED: 'fnol.created',
  EVIDENCE_UPLOADED: 'evidence.uploaded',
  ESTIMATE_INTERPRETED: 'estimate.interpreted',
  COMPLIANCE_ANALYZED: 'compliance.analyzed',
  DEADLINE_DETECTED: 'deadline.detected',
  ALERT_GENERATED: 'alert.generated',
  SETTLEMENT_CALCULATED: 'settlement.calculated',
  POLICY_COMPARED: 'policy.compared',
  AI_CONFIG_UPDATED: 'ai.config.updated',
  API_REQUEST: 'api.request',
  RATE_LIMIT_EXCEEDED: 'rate_limit.exceeded'
};


