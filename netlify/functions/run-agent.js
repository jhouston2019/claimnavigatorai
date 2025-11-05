const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize Supabase client
// Note: Uses SUPABASE_KEY (from env) or falls back to SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Import tool modules
const emailDraft = require('./agent_tools/email_draft');
const emailSend = require('./agent_tools/email_send');
const createAlert = require('./agent_tools/create_alert');
const detectDeadline = require('./agent_tools/detect_deadline');
const detectPayment = require('./agent_tools/detect_payment');
const detectInvoice = require('./agent_tools/detect_invoice');

/**
 * Log agent activity to Supabase
 */
async function logActivity(userId, claimId, action, status, details = {}) {
  try {
    const { error } = await supabase
      .from('agent_logs')
      .insert({
        user_id: userId,
        claim_id: claimId,
        action: action,
        status: status,
        details: details,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging agent activity:', error);
    }
  } catch (error) {
    console.error('Exception logging agent activity:', error);
  }
}

/**
 * Update Statement of Loss by calling generate-statement-of-loss function
 */
async function updateStatementOfLoss(userId, claimId) {
  try {
    // Import generate-statement-of-loss function directly
    const generateStatement = require('./generate-statement-of-loss');
    
    // Call directly (or use HTTP if needed)
    let result;
    try {
      // Try direct call first
      result = await generateStatement.generateStatementOfLoss(claimId);
    } catch (directError) {
      // Fallback to HTTP call if direct import fails
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const functionUrl = process.env.NETLIFY_URL || process.env.URL || 'https://your-site.netlify.app';
      const functionPath = '/.netlify/functions/generate-statement-of-loss';
      
      result = await new Promise((resolve, reject) => {
        const parsedUrl = url.parse(functionUrl + functionPath);
        const httpModule = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        const req = httpModule.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP error! status: ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify({ claim_id: claimId }));
        req.end();
      });
    }
    
    // Log the update
    await logActivity(userId, claimId, 'update_statement_of_loss', 'success', { 
      pdf_url: result.pdf_url,
      total_claim_amount: result.total_claim_amount 
    });

    return {
      status: 'success',
      message: 'Statement of Loss updated',
      pdf_url: result.pdf_url,
      total_claim_amount: result.total_claim_amount
    };
  } catch (error) {
    console.error('Error updating statement of loss:', error);
    await logActivity(userId, claimId, 'update_statement_of_loss', 'error', { error: error.message });
    throw error;
  }
}

/**
 * Log event to claim journal
 */
async function logEvent(userId, claimId, entryTitle, entryBody) {
  try {
    const addJournalEntry = require('./add-journal-entry');
    
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        claim_id: claimId,
        user_id: userId,
        entry_title: entryTitle,
        entry_body: entryBody
      })
    };

    const handlerResult = await addJournalEntry.handler(mockEvent, {});
    const parsedResult = JSON.parse(handlerResult.body);

    if (parsedResult.status === 'error') {
      throw new Error(parsedResult.error);
    }

    await logActivity(userId, claimId, 'log_event', 'success', { 
      entry_title: entryTitle 
    });

    return {
      status: 'success',
      message: 'Event logged to journal',
      entry: parsedResult.entry
    };
  } catch (error) {
    console.error('Error logging event:', error);
    await logActivity(userId, claimId, 'log_event', 'error', { error: error.message });
    throw error;
  }
}

/**
 * Request expert opinion via email
 */
async function requestExpertOpinion(userId, claimId, message) {
  try {
    const sendExpertRequest = require('./send-expert-request');
    
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        name: 'Auto-Agent',
        email: process.env.FROM_EMAIL || 'no-reply@claimnavigator.ai',
        claim_id: claimId,
        message: message || 'Automated expert opinion request from ClaimNavigator Agent'
      })
    };

    const handlerResult = await sendExpertRequest.handler(mockEvent, {});
    const parsedResult = JSON.parse(handlerResult.body);

    if (parsedResult.status === 'error') {
      throw new Error(parsedResult.error);
    }

    await logActivity(userId, claimId, 'request_expert_opinion', 'success', { 
      message: 'Expert opinion request sent'
    });

    return {
      status: 'success',
      message: 'Expert opinion request sent'
    };
  } catch (error) {
    console.error('Error requesting expert opinion:', error);
    await logActivity(userId, claimId, 'request_expert_opinion', 'error', { error: error.message });
    throw error;
  }
}

/**
 * Get state information for legal deadlines
 */
async function getStateInfo(userId, claimId, stateName) {
  try {
    const getStateInfoFn = require('./get-state-info');
    
    const mockEvent = {
      httpMethod: 'GET',
      queryStringParameters: {
        state: stateName
      }
    };

    const handlerResult = await getStateInfoFn.handler(mockEvent, {});
    const parsedResult = JSON.parse(handlerResult.body);

    if (parsedResult.status === 'error') {
      throw new Error(parsedResult.error);
    }

    await logActivity(userId, claimId, 'state_info', 'success', { 
      state: stateName,
      deadline: parsedResult.data?.deadline || 'N/A'
    });

    return {
      status: 'success',
      message: `State information retrieved for ${stateName}`,
      data: parsedResult.data
    };
  } catch (error) {
    console.error('Error getting state info:', error);
    await logActivity(userId, claimId, 'state_info', 'error', { error: error.message, state: stateName });
    throw error;
  }
}

/**
 * Estimate repair/replacement cost using ROM tool
 */
async function estimateRepairCost(userId, claimId, category, severity, squareFeet) {
  try {
    const romEstimate = require('./rom-estimate');
    
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        claim_id: claimId,
        category: category,
        severity: severity,
        square_feet: parseFloat(squareFeet)
      })
    };

    const handlerResult = await romEstimate.handler(mockEvent);
    const parsedResult = JSON.parse(handlerResult.body);

    if (parsedResult.status === 'error') {
      throw new Error(parsedResult.error);
    }

    await logActivity(userId, claimId, 'estimate_repair_cost', 'success', { 
      estimate: parsedResult.estimate,
      category,
      severity,
      square_feet: squareFeet
    });

    return {
      status: 'success',
      message: `Repair cost estimate generated: $${parsedResult.estimate.toLocaleString()}`,
      estimate: parsedResult.estimate,
      explanation: parsedResult.explanation,
      breakdown: parsedResult.breakdown
    };
  } catch (error) {
    console.error('Error estimating repair cost:', error);
    await logActivity(userId, claimId, 'estimate_repair_cost', 'error', { error: error.message });
    throw error;
  }
}

/**
 * Update deadlines by calling update-deadlines function
 */
async function updateDeadlines(userId, claimId, documentText = null) {
  try {
    // Import update-deadlines function directly
    const updateDeadlinesFn = require('./update-deadlines');
    
    // Call directly (or use HTTP if needed)
    let result;
    try {
      // Try direct call first - use the handler function
      const mockEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
          claim_id: claimId,
          document_text: documentText
        })
      };
      
      // Create a mock handler call
      const handlerResult = await updateDeadlinesFn.handler(mockEvent, {});
      const parsedResult = JSON.parse(handlerResult.body);
      result = parsedResult;
    } catch (directError) {
      // Fallback to HTTP call if direct import fails
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const functionUrl = process.env.NETLIFY_URL || process.env.URL || 'https://your-site.netlify.app';
      const functionPath = '/.netlify/functions/update-deadlines';
      
      result = await new Promise((resolve, reject) => {
        const parsedUrl = url.parse(functionUrl + functionPath);
        const httpModule = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        const req = httpModule.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP error! status: ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify({ claim_id: claimId }));
        req.end();
      });
    }
    
    // Log the update
    await logActivity(userId, claimId, 'update_deadlines', 'success', { 
      added: result.added || 0,
      updated: result.updated || 0,
      extracted: result.extracted || 0,
      total_processed: result.total_processed || 0
    });

    return {
      status: 'success',
      message: 'Deadlines updated',
      added: result.added || 0,
      updated: result.updated || 0,
      extracted: result.extracted || 0,
      total_processed: result.total_processed || 0
    };
  } catch (error) {
    console.error('Error updating deadlines:', error);
    await logActivity(userId, claimId, 'update_deadlines', 'error', { error: error.message });
    throw error;
  }
}

/**
 * Main agent handler
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const requestData = JSON.parse(event.body);
    const { user_id, claim_id, action, ...params } = requestData;

    // Validate required fields
    if (!user_id || !claim_id || !action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: user_id, claim_id, and action are required' 
        })
      };
    }

    let result;
    let status = 'success';

    // Route to appropriate tool based on action
    try {
      switch (action) {
        case 'email_draft':
          result = await emailDraft.generateEmailDraft(params.subject || '', params.context || '');
          break;

        case 'email_send':
          if (!params.to || !params.subject || !params.body) {
            throw new Error('Missing required fields: to, subject, and body are required');
          }
          result = await emailSend.sendEmail(
            params.to,
            params.subject,
            params.body
          );
          break;

        case 'create_alert':
          if (!params.message) {
            throw new Error('Missing required field: message is required');
          }
          result = await createAlert.createAlert(
            user_id,
            claim_id,
            params.message,
            params.due_date || null,
            params.priority || 'High'
          );
          break;

        case 'detect_deadline':
          if (!params.document_text) {
            throw new Error('Missing required field: document_text is required');
          }
          result = await detectDeadline.detectDeadline(params.document_text);
          
          // Auto-trigger: Update deadlines after detecting deadline
          try {
            await updateDeadlines(user_id, claim_id);
          } catch (autoError) {
            console.warn('Auto-trigger update_deadlines failed:', autoError);
          }
          break;

        case 'detect_payment':
          if (!params.document_text) {
            throw new Error('Missing required field: document_text is required');
          }
          result = await detectPayment.detectPayment(params.document_text);
          
          // Auto-trigger: Update Statement of Loss after detecting payment
          try {
            await updateStatementOfLoss(user_id, claim_id);
          } catch (autoError) {
            console.warn('Auto-trigger update_statement_of_loss failed:', autoError);
          }
          break;

        case 'detect_invoice':
          if (!params.document_text) {
            throw new Error('Missing required field: document_text is required');
          }
          result = await detectInvoice.detectInvoice(params.document_text);
          
          // Auto-trigger: Update Statement of Loss after detecting invoice
          try {
            await updateStatementOfLoss(user_id, claim_id);
          } catch (autoError) {
            console.warn('Auto-trigger update_statement_of_loss failed:', autoError);
          }
          break;

        case 'update_statement_of_loss':
        case 'generate_statement_of_loss':
          result = await updateStatementOfLoss(user_id, claim_id);
          break;

        case 'update_deadlines':
          result = await updateDeadlines(user_id, claim_id, params.document_text || null);
          break;

        case 'log_event':
          result = await logEvent(user_id, claim_id, params.entry_title || 'Agent Event', params.entry_body || '');
          break;

        case 'request_expert_opinion':
          result = await requestExpertOpinion(user_id, claim_id, params.message || '');
          break;

        case 'state_info':
          result = await getStateInfo(user_id, claim_id, params.state || '');
          break;

        case 'legal_deadline':
          result = await getStateInfo(user_id, claim_id, params.state || '');
          break;

        case 'estimate_repair_cost':
          if (!params.category || !params.severity || !params.square_feet) {
            throw new Error('Missing required fields: category, severity, and square_feet are required');
          }
          result = await estimateRepairCost(
            user_id, 
            claim_id, 
            params.category, 
            params.severity, 
            params.square_feet
          );
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Log successful activity
      await logActivity(user_id, claim_id, action, 'success', { result });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          action: action,
          result: result,
          timestamp: new Date().toISOString()
        })
      };

    } catch (toolError) {
      status = 'error';
      const errorMessage = toolError.message || 'Unknown error occurred';
      
      // Log failed activity
      await logActivity(user_id, claim_id, action, 'error', { error: errorMessage });

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          status: 'error',
          action: action,
          error: errorMessage,
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    console.error('Agent handler error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

