const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create an alert/reminder in Supabase
 * @param {string} userId - User ID
 * @param {string} claimId - Claim ID
 * @param {string} message - Alert message
 * @param {string|null} dueDate - Due date (ISO format or null)
 * @param {string} priority - Priority level (default: 'High')
 * @returns {Promise<object>} Created alert
 */
async function createAlert(userId, claimId, message, dueDate = null, priority = 'High') {
  try {
    const alertData = {
      user_id: userId,
      claim_id: claimId,
      message: message,
      due_date: dueDate,
      sent: false,
      priority: priority,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('claim_reminders')
      .insert(alertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return {
      id: data.id,
      user_id: userId,
      claim_id: claimId,
      message: message,
      due_date: dueDate,
      priority: priority,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error creating alert:', error);
    throw new Error(`Failed to create alert: ${error.message}`);
  }
}

module.exports = {
  createAlert
};


