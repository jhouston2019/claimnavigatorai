/**
 * Email Automation System
 * Schedules and sends the 4-email nurture sequence
 */

const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./send-email');
const { generateEmail1 } = require('./email-templates/email-1-results');
const { generateEmail2 } = require('./email-templates/email-2-education');
const { generateEmail3 } = require('./email-templates/email-3-case-study');
const { generateEmail4 } = require('./email-templates/email-4-urgency');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Schedule email sequence for a new lead
 */
async function scheduleEmailSequence(email, analysisData) {
  const now = new Date();
  
  const emails = [
    {
      email: email,
      email_type: 'results',
      scheduled_for: now.toISOString(), // Immediate
      data: analysisData,
      status: 'pending'
    },
    {
      email: email,
      email_type: 'education',
      scheduled_for: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day 2
      data: analysisData,
      status: 'pending'
    },
    {
      email: email,
      email_type: 'case_study',
      scheduled_for: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // Day 4
      data: analysisData,
      status: 'pending'
    },
    {
      email: email,
      email_type: 'urgency',
      scheduled_for: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // Day 6
      data: analysisData,
      status: 'pending'
    }
  ];
  
  const { data, error } = await supabase
    .from('email_queue')
    .insert(emails);
  
  if (error) {
    console.error('[Email Automation] Failed to schedule emails:', error);
    throw error;
  }
  
  console.log(`[Email Automation] Scheduled 4 emails for ${email}`);
  return data;
}

/**
 * Process pending emails (called by cron job)
 */
async function processPendingEmails() {
  const now = new Date().toISOString();
  
  // Get pending emails that are due
  const { data: pendingEmails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .limit(50);
  
  if (error) {
    console.error('[Email Automation] Failed to fetch pending emails:', error);
    return;
  }
  
  console.log(`[Email Automation] Processing ${pendingEmails?.length || 0} pending emails`);
  
  for (const emailJob of pendingEmails || []) {
    try {
      // Generate email content based on type
      let emailContent;
      
      switch (emailJob.email_type) {
        case 'results':
          emailContent = generateEmail1(emailJob.data);
          break;
        case 'education':
          emailContent = generateEmail2(emailJob.data);
          break;
        case 'case_study':
          emailContent = generateEmail3(emailJob.data);
          break;
        case 'urgency':
          emailContent = generateEmail4(emailJob.data);
          break;
        default:
          console.warn(`[Email Automation] Unknown email type: ${emailJob.email_type}`);
          continue;
      }
      
      // Send email
      await sendEmail(
        emailJob.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text
      );
      
      // Mark as sent
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', emailJob.id);
      
      console.log(`[Email Automation] Sent ${emailJob.email_type} to ${emailJob.email}`);
      
    } catch (error) {
      console.error(`[Email Automation] Failed to send email ${emailJob.id}:`, error);
      
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: error.message,
          attempts: (emailJob.attempts || 0) + 1
        })
        .eq('id', emailJob.id);
    }
  }
}

/**
 * Netlify function handler (for manual triggers and cron)
 */
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  try {
    if (event.httpMethod === 'POST') {
      // Manual trigger: schedule emails for a new lead
      const { email, analysisData } = JSON.parse(event.body);
      
      if (!email || !analysisData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing email or analysisData' })
        };
      }
      
      await scheduleEmailSequence(email, analysisData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email sequence scheduled'
        })
      };
      
    } else {
      // Cron trigger: process pending emails
      await processPendingEmails();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Pending emails processed'
        })
      };
    }
    
  } catch (error) {
    console.error('[Email Automation] Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

module.exports = {
  scheduleEmailSequence,
  processPendingEmails
};
