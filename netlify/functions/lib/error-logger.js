/**
 * Error Logger Utility
 * Logs errors to system_errors table
 */

const { getSupabaseClient } = require('../api/lib/api-utils');

/**
 * Log an error to system_errors table
 * @param {Error} error - Error object
 * @param {string} toolName - Tool/component name
 * @param {string} errorCode - Error code (e.g., CN-5000)
 * @param {object} context - Additional context
 */
async function logError(error, toolName = null, errorCode = null, context = {}) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Error logging failed - Supabase not available:', error);
      return;
    }

    await supabase
      .from('system_errors')
      .insert({
        tool_name: toolName,
        error_code: errorCode,
        error_message: error.message || String(error),
        stack_trace: error.stack || null,
        context: context
      });
  } catch (logError) {
    // Don't throw - error logging should never break the main flow
    console.error('Failed to log error to database:', logError);
    console.error('Original error:', error);
  }
}

module.exports = {
  logError
};


