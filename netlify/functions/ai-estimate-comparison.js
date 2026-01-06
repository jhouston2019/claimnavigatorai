/**
 * AI Estimate Comparison Function
 * NOW POWERED BY ESTIMATE REVIEW PRO ENGINE
 */

const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const EstimateEngine = require('../../app/assets/js/intelligence/estimate-engine');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');


exports.handler = async (event) => {
// ⚠️ PHASE 5B: PROMPT HARDENING REQUIRED
// This function needs manual review to:
// 1. Replace system prompt with getClaimGradeSystemMessage(outputType)
// 2. Enhance user prompt with enhancePromptWithContext(prompt, claimInfo, outputType)
// 3. Post-process response with postProcessResponse(response, outputType)
// 4. Validate with validateProfessionalOutput(response, outputType)
// See: /netlify/functions/PROMPT_HARDENING_GUIDE.md

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
      body: JSON.stringify({ success: false, data: null, error: { code: 'CN-4000', message: 'Method not allowed' } })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Authorization required' } })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Invalid token' } })
      };
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (!payment) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-3000', message: 'Payment required' } })
      };
    }

    // Unified body parsing
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Invalid JSON body' } })
      };
    }
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-estimate-comparison', { payload: body });
    
    const { 
      estimates = [], 
      labor_rate = '', 
      tax_rate = '', 
      include_overhead = false, 
      notes = '',
      analysis_mode = 'comparison',
      analysis_focus = 'comparison'
    } = body;

    if (estimates.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'No estimates provided' } })
      };
    }

    const startTime = Date.now();

    // ESTIMATE REVIEW PRO ENGINE INTEGRATION
    // Process each estimate through the canonical engine
    const analysisResults = [];
    
    for (let i = 0; i < estimates.length; i++) {
      const estimate = estimates[i];
      
      // Run through Estimate Review Pro engine
      const engineResult = EstimateEngine.analyzeEstimate({
        estimateText: estimate.text || '',
        lineItems: [],
        userInput: notes || '',
        metadata: {
          filename: estimate.filename,
          labor_rate,
          tax_rate,
          include_overhead,
          analysis_mode,
          analysis_focus,
          estimateNumber: i + 1
        }
      });

      if (!engineResult.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            data: null, 
            error: { 
              code: 'CN-1000', 
              message: engineResult.error || 'Estimate analysis failed',
              details: engineResult.details
            } 
          })
        };
      }

      analysisResults.push({
        filename: estimate.filename,
        classification: engineResult.classification,
        analysis: engineResult.analysis,
        report: engineResult.report
      });
    }

    // Build comparison HTML from engine results
    const comparisonHTML = buildComparisonHTML(analysisResults, {
      labor_rate,
      tax_rate,
      include_overhead,
      analysis_mode,
      analysis_focus
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      html: comparisonHTML,
      comparison: comparisonHTML,
      estimate_count: estimates.length,
      engine_results: analysisResults,
      engine: 'Estimate Review Pro'
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-estimate-comparison',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true,
      engine: 'estimate-review-pro'
    });

    // Log cost
    await LOG_COST({
      function: 'ai-estimate-comparison',
      estimated_cost_usd: 0.0
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-estimate-comparison',
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};

/**
 * Build comparison HTML from engine results
 */
function buildComparisonHTML(analysisResults, options) {
  const html = [];
  
  html.push('<div class="estimate-comparison-report">');
  html.push('<h2>Estimate Analysis Report</h2>');
  html.push(`<p class="report-meta">Generated: ${new Date().toISOString()}</p>`);
  html.push(`<p class="report-meta">Estimates Analyzed: ${analysisResults.length}</p>`);
  
  // Individual estimate reports
  analysisResults.forEach((result, idx) => {
    html.push(`<div class="estimate-section">`);
    html.push(`<h3>Estimate ${idx + 1}: ${result.filename}</h3>`);
    html.push(`<div class="classification"><strong>Type:</strong> ${result.classification.classification} (${result.classification.confidence} confidence)</div>`);
    
    if (result.report) {
      html.push('<div class="report-content">');
      html.push(`<pre>${escapeHtml(result.report.summary)}</pre>`);
      html.push(`<pre>${escapeHtml(result.report.includedItems)}</pre>`);
      html.push(`<pre>${escapeHtml(result.report.potentialOmissions)}</pre>`);
      html.push(`<pre>${escapeHtml(result.report.potentialUnderScoping)}</pre>`);
      html.push(`<pre>${escapeHtml(result.report.limitations)}</pre>`);
      html.push('</div>');
    }
    
    html.push('</div>');
  });
  
  // Comparison summary (if multiple estimates)
  if (analysisResults.length > 1) {
    html.push('<div class="comparison-summary">');
    html.push('<h3>Comparison Summary</h3>');
    
    // Compare classifications
    const classifications = analysisResults.map(r => r.classification.classification);
    const allSameType = classifications.every(c => c === classifications[0]);
    
    if (allSameType) {
      html.push(`<p>✓ All estimates are classified as <strong>${classifications[0]}</strong> type.</p>`);
    } else {
      html.push(`<p>⚠️ Estimates have different classifications: ${classifications.join(', ')}</p>`);
    }
    
    // Compare categories
    html.push('<h4>Category Coverage Comparison</h4>');
    html.push('<table class="comparison-table">');
    html.push('<thead><tr><th>Estimate</th><th>Categories Found</th><th>Categories Missing</th></tr></thead>');
    html.push('<tbody>');
    
    analysisResults.forEach((result, idx) => {
      const found = result.analysis.includedCategories?.length || 0;
      const missing = result.analysis.missingCategories?.length || 0;
      html.push(`<tr><td>${result.filename}</td><td>${found}</td><td>${missing}</td></tr>`);
    });
    
    html.push('</tbody></table>');
    html.push('</div>');
  }
  
  html.push('</div>');
  
  return html.join('\n');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


