/**
 * Compliance Engine - Health Score
 * Calculates a compliance health score (0-100) for a claim/session
 */

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
      claimType
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

    // Start with perfect score
    let score = 100;
    const factors = [];
    const recommendations = [];

    // 1. Check unresolved alerts
    if (supabase && userId) {
      const { data: alerts, error: alertsError } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', userId)
        .is('resolved_at', null);

      if (!alertsError && alerts) {
        // Filter alerts by claim if claimId provided
        const relevantAlerts = claimId 
          ? alerts.filter(a => a.claim_id === claimId || !a.claim_id)
          : alerts;

        const highSeverity = relevantAlerts.filter(a => a.severity === 'high');
        const mediumSeverity = relevantAlerts.filter(a => a.severity === 'medium');
        const lowSeverity = relevantAlerts.filter(a => a.severity === 'low');

        // Deduct for high severity alerts
        if (highSeverity.length > 0) {
          const deduction = Math.min(30, highSeverity.length * 10);
          score -= deduction;
          factors.push(`${highSeverity.length} high-severity alert${highSeverity.length > 1 ? 's' : ''} unresolved.`);
          if (highSeverity.length >= 2) {
            recommendations.push('Address high-priority compliance concerns immediately. Consider professional review.');
          }
        }

        // Deduct for medium severity alerts
        if (mediumSeverity.length > 0) {
          const deduction = Math.min(20, mediumSeverity.length * 5);
          score -= deduction;
          factors.push(`${mediumSeverity.length} medium-severity alert${mediumSeverity.length > 1 ? 's' : ''} unresolved.`);
        }

        // Small deduction for low severity
        if (lowSeverity.length > 0) {
          const deduction = Math.min(10, lowSeverity.length * 2);
          score -= deduction;
        }
      }

      // 2. Check deadlines status
      const { data: deadlines, error: deadlinesError } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false);

      if (!deadlinesError && deadlines) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueDeadlines = deadlines.filter(d => {
          const deadlineDate = new Date(d.date);
          deadlineDate.setHours(0, 0, 0, 0);
          return deadlineDate < today;
        });

        const upcomingDeadlines = deadlines.filter(d => {
          const deadlineDate = new Date(d.date);
          deadlineDate.setHours(0, 0, 0, 0);
          const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
          return daysUntil >= 0 && daysUntil <= 7;
        });

        // Deduct for overdue deadlines
        if (overdueDeadlines.length > 0) {
          const deduction = Math.min(25, overdueDeadlines.length * 8);
          score -= deduction;
          factors.push(`${overdueDeadlines.length} deadline${overdueDeadlines.length > 1 ? 's' : ''} overdue.`);
          recommendations.push('Review and address overdue deadlines immediately. Document any extenuating circumstances.');
        }

        // Small deduction for upcoming critical deadlines
        if (upcomingDeadlines.length >= 3) {
          score -= 5;
          factors.push(`${upcomingDeadlines.length} critical deadline${upcomingDeadlines.length > 1 ? 's' : ''} approaching within 7 days.`);
        }
      }

      // 3. Check for multiple violations (from compliance_engine_audits or alerts)
      const { data: audits, error: auditsError } = await supabase
        .from('compliance_engine_audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!auditsError && audits) {
        const recentAudits = audits.filter(a => {
          const auditDate = new Date(a.created_at);
          const daysSince = daysBetween(auditDate, new Date());
          return daysSince <= 90; // Last 90 days
        });

        // Check for patterns of violations
        const violationKeywords = ['violation', 'non-compliant', 'deadline exceeded', 'late', 'delayed'];
        const violationCount = recentAudits.filter(a => {
          const summary = (a.result_summary || '').toLowerCase();
          return violationKeywords.some(keyword => summary.includes(keyword));
        }).length;

        if (violationCount >= 3) {
          const deduction = Math.min(20, violationCount * 5);
          score -= deduction;
          factors.push(`Multiple compliance concerns identified in recent analyses.`);
          recommendations.push('Review compliance history and consider escalation if pattern continues.');
        }
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status = 'good';
    if (score >= 80) {
      status = 'good';
    } else if (score >= 60) {
      status = 'watch';
    } else if (score >= 40) {
      status = 'elevated-risk';
    } else {
      status = 'critical';
    }

    // Add default recommendations if none exist
    if (recommendations.length === 0 && score < 100) {
      recommendations.push('Review compliance alerts and address any outstanding concerns.');
      recommendations.push('Ensure all required documents are submitted and deadlines are met.');
    }

    const result = {
      score,
      status,
      factors: factors.length > 0 ? factors : ['No compliance concerns identified.'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring compliance status.'],
      disclaimer: 'This is a Compliance Health Indicator, not legal advice. Consult with a qualified attorney for legal guidance.'
    };

    // Optionally persist snapshot
    if (supabase && userId) {
      try {
        await supabase.from('compliance_health_snapshots').insert({
          user_id: userId,
          claim_id: claimId || null,
          state: state,
          carrier: carrier,
          claim_type: claimType || 'Property',
          score: score,
          status: status,
          factors: factors,
          recommendations: recommendations
        });
      } catch (err) {
        console.warn('Failed to save health snapshot:', err.message);
        // Continue even if snapshot save fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Health score calculation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to calculate health score',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};


