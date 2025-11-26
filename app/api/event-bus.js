/**
 * Internal Event Bus
 * Dispatches events to timeline, compliance, alerts, and checklist systems
 */

/**
 * Dispatch event to internal systems
 * @param {Object} event - Event object
 * @param {string} event.type - Event type
 * @param {Object} event.payload - Event payload
 * @returns {Promise<void>}
 */
export async function dispatchEvent(event) {
  const { type, payload } = event;

  if (!type || !payload) {
    console.warn('Invalid event:', event);
    return;
  }

  // Dispatch to timeline autosync
  try {
    const { addTimelineEvent } = await import('../assets/js/utils/timeline-autosync.js');
    
    // Map event types to timeline events
    const timelineEventMap = {
      'fnol.created': {
        type: 'fnol_submitted',
        source: 'fnol',
        title: 'FNOL Submitted',
        description: `First Notice of Loss submitted to ${payload.carrier || 'carrier'}`
      },
      'evidence.uploaded': {
        type: 'evidence_uploaded',
        source: 'evidence',
        title: `Uploaded ${payload.file_count || 1} file(s)`,
        description: `Files: ${payload.file_names?.join(', ') || 'Evidence files'}`
      },
      'estimate.interpreted': {
        type: 'contractor_estimate_interpreted',
        source: 'advanced-tool',
        title: 'Contractor Estimate Interpreted',
        description: `Estimate total: $${payload.estimate_total || 0}`
      },
      'compliance.analyzed': {
        type: 'compliance_analysis',
        source: 'compliance',
        title: 'Compliance Analysis Completed',
        description: `Risk score: ${payload.risk_score || 0}`
      },
      'deadline.detected': {
        type: 'deadline_statutory',
        source: 'deadlines',
        title: payload.deadline_label || 'Deadline Detected',
        description: payload.deadline_description || 'New deadline identified'
      }
    };

    const timelineEvent = timelineEventMap[type];
    if (timelineEvent) {
      const claimId = payload.claim_id || localStorage.getItem('claim_id') || `claim-${Date.now()}`;
      
      await addTimelineEvent({
        ...timelineEvent,
        date: payload.date || new Date().toISOString().split('T')[0],
        metadata: payload.metadata || {},
        claimId: claimId
      });
    }
  } catch (error) {
    console.warn('Failed to dispatch to timeline:', error);
  }

  // Dispatch to compliance engine (if relevant)
  if (type.startsWith('compliance.') || type === 'fnol.created' || type === 'evidence.uploaded') {
    try {
      const { analyzeCompliance } = await import('../assets/js/utils/compliance-engine-helper.js');
      
      if (payload.state && payload.carrier) {
        await analyzeCompliance({
          state: payload.state,
          carrier: payload.carrier,
          claimType: payload.claim_type || 'Property',
          events: payload.events || []
        });
      }
    } catch (error) {
      console.warn('Failed to dispatch to compliance engine:', error);
    }
  }

  // Dispatch to alerts engine
  if (type === 'compliance.analyzed' || type === 'deadline.detected') {
    try {
      const { generateAlerts } = await import('../assets/js/utils/compliance-engine-helper.js');
      
      if (payload.state && payload.carrier) {
        await generateAlerts(
          {
            state: payload.state,
            carrier: payload.carrier,
            claimType: payload.claim_type || 'Property',
            claimId: payload.claim_id
          },
          payload.deadlines || [],
          payload.evidence || [],
          payload.timeline_summary || '',
          payload.additional_context || []
        );
      }
    } catch (error) {
      console.warn('Failed to dispatch to alerts engine:', error);
    }
  }

  // Dispatch to checklist engine (trigger refresh)
  try {
    window.dispatchEvent(new CustomEvent('timeline-updated', {
      detail: { timestamp: new Date().toISOString() }
    }));
  } catch (error) {
    console.warn('Failed to dispatch checklist refresh:', error);
  }
}

/**
 * Event types
 */
export const EventTypes = {
  FNOL_CREATED: 'fnol.created',
  EVIDENCE_UPLOADED: 'evidence.uploaded',
  ESTIMATE_INTERPRETED: 'estimate.interpreted',
  COMPLIANCE_ANALYZED: 'compliance.analyzed',
  DEADLINE_DETECTED: 'deadline.detected',
  ALERT_RESOLVED: 'alert.resolved',
  SETTLEMENT_CALCULATED: 'settlement.calculated',
  POLICY_COMPARED: 'policy.compared',
  AI_CONFIG_UPDATED: 'ai-config-updated'
};

// Handle AI config updates
if (typeof window !== 'undefined') {
  window.addEventListener('ai-config-updated', (event) => {
    // Clear caches when config is updated
    console.log('AI config updated:', event.detail);
    // Tools will reload configs on next use
  });
}

