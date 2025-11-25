/**
 * Compliance Engine - Generate Alerts
 * Automatically detects statutory violations, deadline failures, carrier delays, and compliance risks
 */

const { runToolAIJSON, loadRuleset } = require('../../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get state-specific silence thresholds
 */
function getSilenceThreshold(state) {
  const fastStates = ['FL', 'TX', 'CA', 'LA'];
  if (fastStates.includes(state)) return 10;
  return 14; // Default
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      claimId,
      sessionId,
      state,
      carrier,
      timelineEvents = [],
      evidenceData = [],
      policyUpload,
      communicationsLog = []
    } = body;

    if (!state || !carrier) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: state, carrier' })
      };
    }

    // Get user ID if available
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    const supabase = getSupabaseClient();
    
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch (err) {
        console.warn('Auth check failed:', err.message);
      }
    }

    const alerts = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Load rulesets
    const deadlineRules = await loadRuleset('deadline-rules');
    const complianceRules = await loadRuleset('compliance-rules');
    const badFaithRules = await loadRuleset('bad-faith-rules');

    // 1. Check for missed statutory response deadlines
    const fnolEvent = timelineEvents.find(e => e.name?.toLowerCase().includes('fnol') || e.name?.toLowerCase().includes('first notice'));
    if (fnolEvent) {
      const daysSinceFNOL = daysBetween(fnolEvent.date, today);
      const acknowledgmentDeadline = state === 'FL' || state === 'TX' ? 10 : 14;
      
      if (daysSinceFNOL > acknowledgmentDeadline) {
        const lastComm = communicationsLog
          .filter(c => c.from === 'carrier' || c.from === 'insurer')
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (!lastComm || daysBetween(lastComm.date, today) > acknowledgmentDeadline) {
          alerts.push({
            id: `ALERT_${Date.now()}_1`,
            type: 'deadline',
            severity: 'high',
            title: 'Carrier Late on Required Response',
            description: `Carrier exceeded the ${acknowledgmentDeadline}-day acknowledgment deadline. No response received since FNOL submission.`,
            recommendedAction: 'Send follow-up communication requesting immediate acknowledgment and status update. Document the delay.',
            timestamp: now.toISOString(),
            relatedTimelineEvent: 'fnol_submitted',
            stateRule: `State requires acknowledgment within ${acknowledgmentDeadline} days of FNOL`,
            category: 'statutory_deadline'
          });
        }
      }
    }

    // 2. Check for payment delays
    const approvalEvent = timelineEvents.find(e => 
      e.name?.toLowerCase().includes('approval') || 
      e.name?.toLowerCase().includes('approved') ||
      e.name?.toLowerCase().includes('payment approved')
    );
    if (approvalEvent) {
      const daysSinceApproval = daysBetween(approvalEvent.date, today);
      const paymentDeadline = 30; // Typical payment deadline
      
      if (daysSinceApproval > paymentDeadline) {
        const paymentEvent = timelineEvents.find(e => e.name?.toLowerCase().includes('payment'));
        if (!paymentEvent) {
          alerts.push({
            id: `ALERT_${Date.now()}_2`,
            type: 'deadline',
            severity: 'high',
            title: 'Payment Late',
            description: `Payment approved ${daysSinceApproval} days ago but not yet received. Statutory payment deadline may be approaching.`,
            recommendedAction: 'Contact carrier to confirm payment status. Document any delays.',
            timestamp: now.toISOString(),
            relatedTimelineEvent: 'payment_approved',
            stateRule: 'State requires payment within reasonable time after approval',
            category: 'payment_deadline'
          });
        }
      }
    }

    // 3. Check for inspection delays
    const inspectionRequestEvent = timelineEvents.find(e => 
      e.name?.toLowerCase().includes('inspection') && 
      e.name?.toLowerCase().includes('request')
    );
    if (inspectionRequestEvent) {
      const daysSinceRequest = daysBetween(inspectionRequestEvent.date, today);
      const inspectionDeadline = 14;
      
      if (daysSinceRequest > inspectionDeadline) {
        const inspectionCompleteEvent = timelineEvents.find(e => 
          e.name?.toLowerCase().includes('inspection') && 
          e.name?.toLowerCase().includes('complete')
        );
        if (!inspectionCompleteEvent) {
          alerts.push({
            id: `ALERT_${Date.now()}_3`,
            type: 'deadline',
            severity: 'medium',
            title: 'Inspection Delayed',
            description: `Inspection requested ${daysSinceRequest} days ago but not yet completed.`,
            recommendedAction: 'Follow up with carrier to schedule inspection. Document delays.',
            timestamp: now.toISOString(),
            relatedTimelineEvent: 'inspection_requested',
            stateRule: 'Carrier should complete inspection within reasonable time',
            category: 'inspection_deadline'
          });
        }
      }
    }

    // 4. Check for missing required documents
    const requiredDocs = ['proof_of_loss', 'inventory', 'receipts', 'photos', 'police_report'];
    const uploadedDocTypes = evidenceData.map(e => e.category || e.type).filter(Boolean);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.some(u => u.toLowerCase().includes(doc)));
    
    if (missingDocs.length > 0) {
      alerts.push({
        id: `ALERT_${Date.now()}_4`,
        type: 'documentation',
        severity: 'medium',
        title: 'Required Documents Missing',
        description: `The following required documents appear to be missing: ${missingDocs.join(', ')}`,
        recommendedAction: 'Upload missing documents to avoid delays or denials.',
        timestamp: now.toISOString(),
        relatedTimelineEvent: null,
        stateRule: 'Policy and statutory requirements mandate certain documentation',
        category: 'missing_documents',
        missingDocuments: missingDocs
      });
    }

    // 5. Check for carrier delay patterns
    const carrierDelays = communicationsLog.filter(c => {
      if (c.from !== 'carrier' && c.from !== 'insurer') return false;
      const prevComm = communicationsLog
        .filter(prev => new Date(prev.date) < new Date(c.date))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      if (!prevComm) return false;
      const daysDiff = daysBetween(prevComm.date, c.date);
      return daysDiff > 14;
    });

    if (carrierDelays.length >= 2) {
      alerts.push({
        id: `ALERT_${Date.now()}_5`,
        type: 'pattern',
        severity: 'high',
        title: 'Carrier Delay Pattern Detected',
        description: `Multiple instances of carrier delays detected. Pattern suggests potential bad faith concerns.`,
        recommendedAction: 'Document all delays. Consider escalation or regulatory complaint if pattern continues.',
        timestamp: now.toISOString(),
        relatedTimelineEvent: null,
        stateRule: 'Carriers must respond within reasonable timeframes',
        category: 'carrier_delay_pattern'
      });
    }

    // 6. Check for long silence periods
    const silenceThreshold = getSilenceThreshold(state);
    const lastComm = communicationsLog
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (lastComm) {
      const daysSinceLastComm = daysBetween(lastComm.date, today);
      if (daysSinceLastComm > silenceThreshold) {
        alerts.push({
          id: `ALERT_${Date.now()}_6`,
          type: 'silence',
          severity: daysSinceLastComm > 30 ? 'high' : 'medium',
          title: `Extended Silence Period (${daysSinceLastComm} days)`,
          description: `No communication from carrier for ${daysSinceLastComm} days. This exceeds typical response expectations.`,
          recommendedAction: 'Send written follow-up requesting status update. Document the silence period.',
          timestamp: now.toISOString(),
          relatedTimelineEvent: null,
          stateRule: `State expects regular communication. ${silenceThreshold}+ days of silence may indicate issues.`,
          category: 'silence_period'
        });
      }
    }

    // 7. Check for missed consumer action deadlines
    const consumerDeadlines = timelineEvents.filter(e => 
      e.name?.toLowerCase().includes('deadline') ||
      e.name?.toLowerCase().includes('due date') ||
      e.name?.toLowerCase().includes('must respond')
    );
    
    for (const deadline of consumerDeadlines) {
      if (deadline.date && new Date(deadline.date) < now) {
        const deadlinePassed = timelineEvents.find(e => 
          e.name?.toLowerCase().includes(deadline.name?.toLowerCase()) &&
          e.name?.toLowerCase().includes('complete')
        );
        
        if (!deadlinePassed) {
          alerts.push({
            id: `ALERT_${Date.now()}_7`,
            type: 'deadline',
            severity: 'high',
            title: 'Missed Consumer Action Deadline',
            description: `Deadline for "${deadline.name}" has passed without completion.`,
            recommendedAction: 'Take immediate action if still possible. Document any extenuating circumstances.',
            timestamp: now.toISOString(),
            relatedTimelineEvent: deadline.name,
            stateRule: 'Consumer deadlines must be met to preserve rights',
            category: 'consumer_deadline'
          });
        }
      }
    }

    // 8. Check for mediation/appraisal rights approaching
    const denialEvent = timelineEvents.find(e => 
      e.name?.toLowerCase().includes('denial') ||
      e.name?.toLowerCase().includes('denied')
    );
    
    if (denialEvent) {
      const daysSinceDenial = daysBetween(denialEvent.date, today);
      const mediationWindow = 30;
      const appraisalWindow = 60;
      
      if (daysSinceDenial >= mediationWindow - 7 && daysSinceDenial < mediationWindow) {
        alerts.push({
          id: `ALERT_${Date.now()}_8`,
          type: 'rights',
          severity: 'medium',
          title: 'Mediation Rights Window Approaching',
          description: `Mediation rights window may be closing. Review policy and state law for mediation deadlines.`,
          recommendedAction: 'Review mediation options and deadlines. Consider filing mediation request if appropriate.',
          timestamp: now.toISOString(),
          relatedTimelineEvent: 'denial',
          stateRule: 'Mediation rights may have time limitations',
          category: 'mediation_rights'
        });
      }
      
      if (daysSinceDenial >= appraisalWindow - 14 && daysSinceDenial < appraisalWindow) {
        alerts.push({
          id: `ALERT_${Date.now()}_9`,
          type: 'rights',
          severity: 'high',
          title: 'Appraisal Demand Window Closing',
          description: `Appraisal demand window may be closing. This is a critical deadline for dispute resolution.`,
          recommendedAction: 'Review policy for appraisal clause. Consider filing appraisal demand if dispute remains.',
          timestamp: now.toISOString(),
          relatedTimelineEvent: 'denial',
          stateRule: 'Appraisal rights may have strict time limitations',
          category: 'appraisal_rights'
        });
      }
    }

    // 9. Check for complaint filing window
    const violationEvents = timelineEvents.filter(e => 
      e.name?.toLowerCase().includes('violation') ||
      e.name?.toLowerCase().includes('bad faith') ||
      e.name?.toLowerCase().includes('delay')
    );
    
    if (violationEvents.length > 0) {
      const firstViolation = violationEvents.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      const daysSinceViolation = daysBetween(firstViolation.date, today);
      const complaintWindow = 90;
      
      if (daysSinceViolation >= complaintWindow - 30 && daysSinceViolation < complaintWindow) {
        alerts.push({
          id: `ALERT_${Date.now()}_10`,
          type: 'rights',
          severity: 'medium',
          title: 'Regulatory Complaint Window Approaching',
          description: `Consider filing a complaint with state insurance department if violations persist.`,
          recommendedAction: 'Review state DOI complaint procedures. Gather documentation for potential complaint.',
          timestamp: now.toISOString(),
          relatedTimelineEvent: firstViolation.name,
          stateRule: 'State insurance departments accept complaints for violations',
          category: 'complaint_filing'
        });
      }
    }

    // Use AI to analyze and generate additional alerts if needed
    if (alerts.length === 0 || timelineEvents.length > 5) {
      try {
        const aiPrompt = `Analyze this claim for compliance alerts:\nState: ${state}\nCarrier: ${carrier}\nEvents: ${JSON.stringify(timelineEvents.slice(0, 10), null, 2)}\n\nIdentify any additional compliance concerns, missed deadlines, or risks not already flagged.`;
        
        const aiAnalysis = await runToolAIJSON(
          'compliance-engine',
          aiPrompt,
          {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 1500
          },
          'compliance-rules'
        );

        // Parse AI analysis for additional alerts
        if (aiAnalysis.additionalAlerts && Array.isArray(aiAnalysis.additionalAlerts)) {
          aiAnalysis.additionalAlerts.forEach((alert, idx) => {
            alerts.push({
              id: `ALERT_${Date.now()}_AI_${idx}`,
              type: alert.type || 'compliance',
              severity: alert.severity || 'medium',
              title: alert.title || 'Compliance Concern',
              description: alert.description || '',
              recommendedAction: alert.recommendedAction || '',
              timestamp: now.toISOString(),
              relatedTimelineEvent: alert.relatedEvent || null,
              stateRule: alert.stateRule || '',
              category: alert.category || 'ai_detected'
            });
          });
        }
      } catch (error) {
        console.warn('AI analysis for alerts failed:', error.message);
        // Continue without AI alerts
      }
    }

    // Store alerts in Supabase
    if (supabase && userId) {
      try {
        const alertsToStore = alerts.map(alert => ({
          user_id: userId,
          claim_id: claimId || null,
          session_id: sessionId || null,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          recommended_action: alert.recommendedAction,
          state_rule: alert.stateRule,
          category: alert.category,
          related_timeline_event: alert.relatedTimelineEvent,
          alert_data: alert,
          resolved_at: null,
          created_at: alert.timestamp
        }));

        if (alertsToStore.length > 0) {
          await supabase.from('compliance_alerts').insert(alertsToStore);
        }
      } catch (error) {
        console.warn('Failed to store alerts in Supabase:', error.message);
        // Continue even if storage fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ alerts })
    };

  } catch (error) {
    console.error('Generate alerts error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate alerts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

