/**
 * Monitoring Event Helper
 * Backend utility for recording system events
 */

const { getSupabaseClient } = require('../api/lib/api-utils');

/**
 * Record a system event
 * @param {string} eventType - Type of event
 * @param {string} source - Source of event
 * @param {object} metadata - Event metadata
 */
async function recordEvent(eventType, source, metadata = {}) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not available for event recording');
      return;
    }

    await supabase
      .from('system_events')
      .insert({
        event_type: eventType,
        source: source,
        metadata: metadata
      });
  } catch (error) {
    // Non-critical - don't break main flow
    console.warn('Failed to record event:', error);
  }
}

module.exports = {
  recordEvent
};


