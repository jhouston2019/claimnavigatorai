/**
 * Claim Navigator JavaScript SDK
 * Enterprise client library for Claim Navigator API
 * 
 * Usage:
 *   const client = new ClaimNavigator({ apiKey: 'your-key', baseUrl: 'https://...' });
 *   const result = await client.createFNOL({ ... });
 */

class ClaimNavigator {
  constructor(options = {}) {
    this.apiKey = options.apiKey || '';
    this.baseUrl = options.baseUrl || 'https://your-site.netlify.app/.netlify/functions/api';
    this.timeout = options.timeout || 30000; // 30 seconds
  }

  /**
   * Make API request
   * @private
   */
  async _request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const options = {
      method: method,
      headers: headers,
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data.data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Create FNOL submission
   * @param {Object} fnolData - FNOL data
   * @returns {Promise<Object>} FNOL result
   */
  async createFNOL(fnolData) {
    return this._request('fnol/create', 'POST', fnolData);
  }

  /**
   * Check deadlines
   * @param {Object} params - { state, carrier, claimType, dateOfLoss }
   * @returns {Promise<Object>} Deadlines result
   */
  async checkDeadlines(params) {
    return this._request('deadlines/check', 'POST', params);
  }

  /**
   * Analyze compliance
   * @param {Object} params - { state, carrier, claimType, events }
   * @returns {Promise<Object>} Compliance analysis
   */
  async analyzeCompliance(params) {
    return this._request('compliance/analyze', 'POST', params);
  }

  /**
   * Upload evidence
   * @param {Object} params - { file_url, file_name, file_size, mime_type, category }
   * @returns {Promise<Object>} Evidence upload result
   */
  async uploadEvidence(params) {
    return this._request('evidence/upload', 'POST', params);
  }

  /**
   * Interpret contractor estimate
   * @param {Object} params - { file_url, loss_type, severity, areas }
   * @returns {Promise<Object>} Estimate interpretation
   */
  async interpretEstimate(params) {
    return this._request('estimate/interpret', 'POST', params);
  }

  /**
   * Calculate settlement
   * @param {Object} params - { initial_offer, estimated_damage, policy_limits, deductible }
   * @returns {Promise<Object>} Settlement calculation
   */
  async calculateSettlement(params) {
    return this._request('settlement/calc', 'POST', params);
  }

  /**
   * Compare policies
   * @param {Object} params - { policy_a_url, policy_b_url }
   * @returns {Promise<Object>} Policy comparison
   */
  async comparePolicies(params) {
    return this._request('policy/compare', 'POST', params);
  }

  /**
   * List alerts
   * @param {Object} params - { resolved, limit, offset }
   * @returns {Promise<Object>} Alerts list
   */
  async listAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this._request(`alerts/list?${queryString}`, 'GET');
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} Resolved alert
   */
  async resolveAlert(alertId) {
    return this._request('alerts/resolve', 'POST', { alert_id: alertId });
  }

  /**
   * Query settlement history
   * @param {Object} params - { carrier, state, claim_type, limit }
   * @returns {Promise<Object>} Settlement history
   */
  async queryHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this._request(`history/query?${queryString}`, 'GET');
  }

  /**
   * Find expert witnesses
   * @param {Object} params - { specialty, state, min_experience, name_search }
   * @returns {Promise<Object>} Expert witnesses
   */
  async findExpert(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this._request(`expert/find?${queryString}`, 'GET');
  }

  /**
   * Generate checklist
   * @param {Object} params - { claim_id }
   * @returns {Promise<Object>} Checklist tasks
   */
  async generateChecklist(params = {}) {
    return this._request('checklist/generate', 'POST', params);
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaimNavigator;
}
if (typeof window !== 'undefined') {
  window.ClaimNavigator = ClaimNavigator;
}


