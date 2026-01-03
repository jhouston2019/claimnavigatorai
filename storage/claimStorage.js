// claimStorage.js
// Storage abstraction layer for claim data persistence
// Enables future migration from localStorage to API/database without refactoring business logic

const STORAGE_MODE = 'local'; // future: 'api'

// Session management
let currentSessionId = null;

/**
 * Initialize or retrieve the current claim session ID
 */
function initializeSession() {
  if (currentSessionId) return currentSessionId;
  
  currentSessionId = localStorage.getItem('claimSessionId');
  
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
    localStorage.setItem('claimSessionId', currentSessionId);
    migrateExistingData(currentSessionId);
  }
  
  return currentSessionId;
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Migrate existing localStorage keys into a default session namespace
 */
function migrateExistingData(sessionId) {
  const allKeys = Object.keys(localStorage);
  const claimKeys = allKeys.filter(k => 
    k.startsWith('claim_step_') && 
    !k.includes(sessionId)
  );
  
  if (claimKeys.length === 0) return;
  
  console.log(`Migrating ${claimKeys.length} existing claim keys to session: ${sessionId}`);
  
  claimKeys.forEach(oldKey => {
    const value = localStorage.getItem(oldKey);
    const newKey = `${sessionId}_${oldKey}`;
    localStorage.setItem(newKey, value);
  });
}

/**
 * Get the namespaced key for storage
 */
function getNamespacedKey(key) {
  const sessionId = initializeSession();
  
  // If key already includes session ID, return as-is
  if (key.startsWith(sessionId)) {
    return key;
  }
  
  // For backward compatibility: if key starts with 'claim_', namespace it
  if (key.startsWith('claim_')) {
    return `${sessionId}_${key}`;
  }
  
  // For non-claim keys (like claimNavigatorState), leave as-is
  return key;
}

/**
 * Save claim data to storage
 * @param {string} key - Storage key
 * @param {any} value - Data to store (will be JSON stringified)
 */
function saveClaimData(key, value) {
  if (STORAGE_MODE === 'local') {
    const namespacedKey = getNamespacedKey(key);
    
    // Add metadata if not present
    if (typeof value === 'object' && value !== null && !value.metadata) {
      value.metadata = {
        savedAt: new Date().toISOString(),
        sessionId: currentSessionId
      };
    }
    
    localStorage.setItem(namespacedKey, JSON.stringify(value));
    
    // Update last activity timestamp
    updateLastActivity();
  } else if (STORAGE_MODE === 'api') {
    // Placeholder for future API implementation
    saveClaimDataAPI(key, value);
  }
}

/**
 * Retrieve claim data from storage
 * @param {string} key - Storage key
 * @returns {any} Parsed data or null if not found
 */
function getClaimData(key) {
  if (STORAGE_MODE === 'local') {
    const namespacedKey = getNamespacedKey(key);
    const data = localStorage.getItem(namespacedKey);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing data for key ${key}:`, e);
      return null;
    }
  } else if (STORAGE_MODE === 'api') {
    // Placeholder for future API implementation
    return getClaimDataAPI(key);
  }
}

/**
 * Remove claim data from storage
 * @param {string} key - Storage key
 */
function removeClaimData(key) {
  if (STORAGE_MODE === 'local') {
    const namespacedKey = getNamespacedKey(key);
    localStorage.removeItem(namespacedKey);
    updateLastActivity();
  } else if (STORAGE_MODE === 'api') {
    // Placeholder for future API implementation
    removeClaimDataAPI(key);
  }
}

/**
 * List all claim data keys matching a prefix
 * @param {string} prefix - Key prefix to filter by
 * @returns {Array<string>} Array of matching keys (without session namespace)
 */
function listClaimData(prefix) {
  if (STORAGE_MODE === 'local') {
    const sessionId = initializeSession();
    const allKeys = Object.keys(localStorage);
    const sessionPrefix = `${sessionId}_${prefix}`;
    
    return allKeys
      .filter(k => k.startsWith(sessionPrefix))
      .map(k => k.replace(`${sessionId}_`, ''));
  } else if (STORAGE_MODE === 'api') {
    // Placeholder for future API implementation
    return listClaimDataAPI(prefix);
  }
}

/**
 * Update last activity timestamp
 */
function updateLastActivity() {
  const state = localStorage.getItem('claimNavigatorState');
  let stateObj = state ? JSON.parse(state) : {};
  stateObj.lastSaved = new Date().toISOString();
  localStorage.setItem('claimNavigatorState', JSON.stringify(stateObj));
}

/**
 * Get current session ID
 * @returns {string} Current session ID
 */
function getCurrentSessionId() {
  return initializeSession();
}

/**
 * Create a new session (for multi-claim support)
 * @returns {string} New session ID
 */
function createNewSession() {
  currentSessionId = generateSessionId();
  localStorage.setItem('claimSessionId', currentSessionId);
  return currentSessionId;
}

/**
 * List all sessions
 * @returns {Array<object>} Array of session objects with metadata
 */
function listAllSessions() {
  const allKeys = Object.keys(localStorage);
  const sessionIds = new Set();
  
  allKeys.forEach(key => {
    const match = key.match(/^(claim_\d+_[a-z0-9]+)_/);
    if (match) {
      sessionIds.add(match[1]);
    }
  });
  
  return Array.from(sessionIds).map(sessionId => {
    const sessionKeys = allKeys.filter(k => k.startsWith(sessionId));
    const timestamps = sessionKeys
      .map(k => {
        try {
          const data = JSON.parse(localStorage.getItem(k));
          return data.metadata?.savedAt || data.timestamp;
        } catch {
          return null;
        }
      })
      .filter(t => t);
    
    timestamps.sort();
    
    return {
      sessionId,
      created: timestamps[0] || null,
      lastActivity: timestamps[timestamps.length - 1] || null,
      keyCount: sessionKeys.length
    };
  });
}

// ============================================
// FUTURE API PLACEHOLDERS (NOT IMPLEMENTED)
// ============================================

function saveClaimDataAPI(key, value) {
  console.warn('API storage not yet implemented');
  // Future: POST to /api/claims/{sessionId}/data
  // Body: { key, value }
}

function getClaimDataAPI(key) {
  console.warn('API storage not yet implemented');
  // Future: GET from /api/claims/{sessionId}/data/{key}
  return null;
}

function removeClaimDataAPI(key) {
  console.warn('API storage not yet implemented');
  // Future: DELETE /api/claims/{sessionId}/data/{key}
}

function listClaimDataAPI(prefix) {
  console.warn('API storage not yet implemented');
  // Future: GET from /api/claims/{sessionId}/data?prefix={prefix}
  return [];
}

// ============================================
// BACKWARD COMPATIBILITY HELPERS
// ============================================

/**
 * Get data using old localStorage pattern (for migration)
 * @param {string} key - Original key without namespace
 * @returns {any} Data or null
 */
function getLegacyData(key) {
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Initialize session on module load
initializeSession();

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveClaimData,
    getClaimData,
    removeClaimData,
    listClaimData,
    getCurrentSessionId,
    createNewSession,
    listAllSessions,
    getLegacyData
  };
}

