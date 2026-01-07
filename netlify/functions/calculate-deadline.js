/**
 * CALCULATE DEADLINE FUNCTION
 * L2 - DETERMINISTIC CALCULATION (NO AI)
 * 
 * Calculates jurisdiction-specific claim deadlines based on state rules
 */

const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR } = require('./_utils');

// Jurisdiction-specific deadline rules (in days from loss date)
const JURISDICTION_RULES = {
  // State: { proofOfLoss, suitLimitation, appraisalDemand }
  'CA': { proofOfLoss: 60, suitLimitation: 365, appraisalDemand: 30 },
  'FL': { proofOfLoss: 60, suitLimitation: 1825, appraisalDemand: 60 }, // 5 years
  'TX': { proofOfLoss: 90, suitLimitation: 730, appraisalDemand: 60 }, // 2 years
  'NY': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'IL': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'PA': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'OH': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'GA': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'NC': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 }, // 3 years
  'MI': { proofOfLoss: 60, suitLimitation: 365, appraisalDemand: 30 },
  'NJ': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'VA': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'WA': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 60 },
  'AZ': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'MA': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'TN': { proofOfLoss: 60, suitLimitation: 365, appraisalDemand: 30 },
  'IN': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'MO': { proofOfLoss: 60, suitLimitation: 1825, appraisalDemand: 60 },
  'MD': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'WI': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'CO': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'MN': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'SC': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'AL': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'LA': { proofOfLoss: 60, suitLimitation: 365, appraisalDemand: 30 },
  'KY': { proofOfLoss: 60, suitLimitation: 1825, appraisalDemand: 60 },
  'OR': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'OK': { proofOfLoss: 60, suitLimitation: 1825, appraisalDemand: 60 },
  'CT': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'UT': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'IA': { proofOfLoss: 60, suitLimitation: 1825, appraisalDemand: 60 },
  'NV': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'AR': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'MS': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'KS': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'NM': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'NE': { proofOfLoss: 60, suitLimitation: 1460, appraisalDemand: 60 }, // 4 years
  'WV': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'ID': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'HI': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'NH': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'ME': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'RI': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'MT': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'DE': { proofOfLoss: 60, suitLimitation: 1095, appraisalDemand: 45 },
  'SD': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'ND': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'AK': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'VT': { proofOfLoss: 60, suitLimitation: 730, appraisalDemand: 45 },
  'WY': { proofOfLoss: 60, suitLimitation: 1460, appraisalDemand: 60 }
};

// Default rules for states not explicitly listed
const DEFAULT_RULES = {
  proofOfLoss: 60,
  suitLimitation: 365,
  appraisalDemand: 45
};

// Deadline type mappings
const DEADLINE_TYPE_MAP = {
  'fnol': { name: 'First Notice of Loss', days: 0, description: 'Report claim immediately' },
  'proof-of-loss': { name: 'Proof of Loss', key: 'proofOfLoss', description: 'Submit sworn proof of loss statement' },
  'mitigation': { name: 'Mitigation Documentation', days: 30, description: 'Document steps taken to prevent further damage' },
  'supplement': { name: 'Supplement Submission', days: 90, description: 'Submit supplemental claim documentation' },
  'appeal': { name: 'Appeal Filing', days: 60, description: 'File appeal of claim decision' },
  'lawsuit': { name: 'Lawsuit Filing', key: 'suitLimitation', description: 'File lawsuit if necessary' }
};

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2 - date1) / oneDay);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate deadline based on jurisdiction and deadline type
 */
function calculateDeadline(triggerDate, state, deadlineType) {
  const trigger = new Date(triggerDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get jurisdiction rules
  const rules = JURISDICTION_RULES[state] || DEFAULT_RULES;
  
  // Get deadline type info
  const typeInfo = DEADLINE_TYPE_MAP[deadlineType];
  if (!typeInfo) {
    throw new Error(`Unknown deadline type: ${deadlineType}`);
  }
  
  // Calculate days to add
  let daysToAdd;
  if (typeInfo.key) {
    // Use jurisdiction-specific rule
    daysToAdd = rules[typeInfo.key];
  } else {
    // Use fixed days
    daysToAdd = typeInfo.days;
  }
  
  // Calculate deadline date
  const deadlineDate = addDays(trigger, daysToAdd);
  
  // Calculate days remaining
  const daysRemaining = daysBetween(today, deadlineDate);
  
  // Determine status
  let status;
  let priority;
  if (daysRemaining < 0) {
    status = 'overdue';
    priority = 'critical';
  } else if (daysRemaining <= 7) {
    status = 'urgent';
    priority = 'high';
  } else if (daysRemaining <= 30) {
    status = 'upcoming';
    priority = 'medium';
  } else {
    status = 'pending';
    priority = 'low';
  }
  
  return {
    deadlineType: typeInfo.name,
    triggerDate: formatDate(trigger),
    deadlineDate: formatDate(deadlineDate),
    daysFromTrigger: daysToAdd,
    daysRemaining: daysRemaining,
    status: status,
    priority: priority,
    description: typeInfo.description,
    jurisdiction: state,
    calculatedAt: new Date().toISOString()
  };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { triggerDate, state, deadlineType } = body;

    // Validate required fields
    if (!triggerDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'triggerDate is required' 
        })
      };
    }

    if (!state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'state is required' 
        })
      };
    }

    if (!deadlineType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'deadlineType is required' 
        })
      };
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(triggerDate)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'triggerDate must be in YYYY-MM-DD format' 
        })
      };
    }

    // Calculate deadline
    const result = calculateDeadline(triggerDate, state, deadlineType);

    // Log event
    await LOG_EVENT('deadline_calculated', 'calculate-deadline', {
      state,
      deadlineType,
      daysRemaining: result.daysRemaining
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
        metadata: {
          calculation_method: 'deterministic',
          jurisdiction_rules_applied: true,
          ai_used: false
        }
      })
    };

  } catch (error) {
    console.error('[calculate-deadline] Error:', error);
    await LOG_ERROR('calculate-deadline', error, { body: event.body });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to calculate deadline'
      })
    };
  }
};


