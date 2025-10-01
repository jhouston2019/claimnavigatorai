const { createClient } = require('@supabase/supabase-js');

/**
 * Claim-Based Access Control Utility
 * Validates user access to specific claims and documents
 */

/**
 * Initialize Supabase client
 */
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

/**
 * Extract user ID from JWT token
 */
function extractUserIdFromToken(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || payload.user_id;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

/**
 * Validate claim access for a user
 * @param {string} userId - User ID from JWT token
 * @param {string} claimId - Claim ID to validate access for
 * @returns {Promise<Object>} - { hasAccess: boolean, claim: Object|null, error: string|null }
 */
async function validateClaimAccess(userId, claimId) {
  try {
    if (!userId) {
      return { hasAccess: false, claim: null, error: 'User not authenticated' };
    }

    if (!claimId) {
      return { hasAccess: false, claim: null, error: 'Claim ID is required' };
    }

    const supabase = getSupabaseClient();

    // Get claim data
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return { 
        hasAccess: false, 
        claim: null, 
        error: 'Claim not found or access denied' 
      };
    }

    // Check if claim is paid/active
    if (claim.status !== 'paid' && claim.status !== 'active') {
      return { 
        hasAccess: false, 
        claim: null, 
        error: 'Claim payment required' 
      };
    }

    return { hasAccess: true, claim: claim, error: null };

  } catch (error) {
    console.error('Error validating claim access:', error);
    return { 
      hasAccess: false, 
      claim: null, 
      error: 'Internal server error' 
    };
  }
}

/**
 * Log claim access for audit tracking
 * @param {string} userId - User ID
 * @param {string} claimId - Claim ID
 * @param {string} documentId - Document ID (optional)
 * @param {string} action - Action performed (viewed, generated, downloaded, etc.)
 * @param {string} documentType - Type of document (template, ai_generated, etc.)
 * @param {Object} metadata - Additional metadata
 */
async function logClaimAccess(userId, claimId, documentId, action, documentType, metadata = {}) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('claim_access_logs')
      .insert([{
        user_id: userId,
        claim_id: claimId,
        document_id: documentId,
        action: action,
        document_type: documentType,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          ip_address: metadata.ip_address,
          user_agent: metadata.user_agent
        }
      }]);

    if (error) {
      console.error('Error logging claim access:', error);
    }
  } catch (error) {
    console.error('Error logging claim access:', error);
  }
}

/**
 * Get claim information for document protection
 * @param {string} claimId - Claim ID
 * @returns {Promise<Object>} - Claimant information for document protection
 */
async function getClaimantInfo(claimId) {
  try {
    const supabase = getSupabaseClient();

    const { data: claim, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (error || !claim) {
      throw new Error('Claim not found');
    }

    return {
      user_id: claim.user_id,
      insured_name: claim.insured_name,
      policy_number: claim.policy_number,
      insurer: claim.insurer,
      date_of_loss: claim.date_of_loss,
      loss_location: claim.loss_location,
      property_type: claim.property_type,
      status: claim.status,
      type_of_loss: claim.type_of_loss
    };

  } catch (error) {
    console.error('Error getting claimant info:', error);
    throw error;
  }
}

/**
 * Middleware function for claim-based access control
 * Use this in Netlify functions to validate access
 */
async function requireClaimAccess(event, claimId) {
  const userId = extractUserIdFromToken(event);
  const accessValidation = await validateClaimAccess(userId, claimId);

  if (!accessValidation.hasAccess) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Access denied',
        message: accessValidation.error
      })
    };
  }

  return {
    userId: userId,
    claim: accessValidation.claim,
    claimantInfo: await getClaimantInfo(claimId)
  };
}

/**
 * Check if user has any active claims
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of active claims
 */
async function getUserActiveClaims(userId) {
  try {
    const supabase = getSupabaseClient();

    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['paid', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return claims || [];

  } catch (error) {
    console.error('Error getting user active claims:', error);
    return [];
  }
}

/**
 * Check if user needs to create a new claim
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user needs to create a claim
 */
async function userNeedsNewClaim(userId) {
  try {
    const activeClaims = await getUserActiveClaims(userId);
    return activeClaims.length === 0;
  } catch (error) {
    console.error('Error checking if user needs new claim:', error);
    return true; // Default to requiring a new claim on error
  }
}

module.exports = {
  validateClaimAccess,
  logClaimAccess,
  getClaimantInfo,
  requireClaimAccess,
  getUserActiveClaims,
  userNeedsNewClaim,
  extractUserIdFromToken,
  getSupabaseClient
};
