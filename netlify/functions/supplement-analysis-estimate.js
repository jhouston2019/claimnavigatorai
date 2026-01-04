/**
 * Supplement & Underpayment Analysis
 * Step 13: Analyzes estimate supplements and identifies underpayments
 * POWERED BY ESTIMATE REVIEW PRO ENGINE
 */

const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE } = require('./_utils');
const EstimateEngine = require('../../app/assets/js/intelligence/estimate-engine');

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
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Authorization required' })
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
        body: JSON.stringify({ success: false, error: 'Invalid token' })
      };
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid JSON body' })
      };
    }

    await LOG_EVENT('supplement_analysis', 'supplement-analysis-estimate', { payload: body });

    const {
      originalEstimateText = '',
      carrierEstimateText = '',
      supplementEstimateText = '',
      carrierOffer = '',
      notes = ''
    } = body;

    if (!originalEstimateText && !carrierEstimateText && !supplementEstimateText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'At least one estimate required' })
      };
    }

    const startTime = Date.now();

    // STEP 1: Analyze original contractor estimate (if provided)
    let originalAnalysis = null;
    if (originalEstimateText) {
      originalAnalysis = EstimateEngine.analyzeEstimate({
        estimateText: originalEstimateText,
        lineItems: [],
        userInput: 'Original contractor estimate',
        metadata: { context: 'supplement_analysis', estimateType: 'original' }
      });

      if (!originalAnalysis.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Original estimate analysis failed: ' + originalAnalysis.error
          })
        };
      }
    }

    // STEP 2: Analyze carrier estimate (if provided)
    let carrierAnalysis = null;
    if (carrierEstimateText) {
      carrierAnalysis = EstimateEngine.analyzeEstimate({
        estimateText: carrierEstimateText,
        lineItems: [],
        userInput: 'Insurance carrier estimate',
        metadata: { context: 'supplement_analysis', estimateType: 'carrier' }
      });

      if (!carrierAnalysis.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Carrier estimate analysis failed: ' + carrierAnalysis.error
          })
        };
      }
    }

    // STEP 3: Analyze supplement estimate (if provided)
    let supplementAnalysis = null;
    if (supplementEstimateText) {
      supplementAnalysis = EstimateEngine.analyzeEstimate({
        estimateText: supplementEstimateText,
        lineItems: [],
        userInput: 'Supplement estimate',
        metadata: { context: 'supplement_analysis', estimateType: 'supplement' }
      });

      if (!supplementAnalysis.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Supplement estimate analysis failed: ' + supplementAnalysis.error
          })
        };
      }
    }

    // STEP 4: Build supplement analysis report
    const supplementReport = buildSupplementReport({
      originalAnalysis,
      carrierAnalysis,
      supplementAnalysis,
      carrierOffer,
      notes
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    await LOG_USAGE({
      function: 'supplement-analysis-estimate',
      duration_ms: durationMs,
      success: true,
      engine: 'estimate-review-pro'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          originalAnalysis: originalAnalysis?.analysis || null,
          carrierAnalysis: carrierAnalysis?.analysis || null,
          supplementAnalysis: supplementAnalysis?.analysis || null,
          supplementReport,
          engine: 'Estimate Review Pro'
        }
      })
    };

  } catch (error) {
    await LOG_ERROR('supplement_analysis_error', {
      function: 'supplement-analysis-estimate',
      message: error.message,
      stack: error.stack
    });

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

/**
 * Build supplement analysis report
 */
function buildSupplementReport(data) {
  const {
    originalAnalysis,
    carrierAnalysis,
    supplementAnalysis,
    carrierOffer,
    notes
  } = data;

  const report = {
    title: 'Supplement & Underpayment Analysis Report',
    generated: new Date().toISOString(),
    
    sections: {
      summary: buildSupplementSummary(data),
      scopeComparison: buildScopeComparison(originalAnalysis, carrierAnalysis),
      identifiedDiscrepancies: buildDiscrepancies(originalAnalysis, carrierAnalysis),
      supplementJustification: buildSupplementJustification(supplementAnalysis, carrierAnalysis),
      observations: buildSupplementObservations(data)
    }
  };

  return report;
}

function buildSupplementSummary(data) {
  const { originalAnalysis, carrierAnalysis, supplementAnalysis } = data;
  
  const summary = {
    title: 'Analysis Summary',
    estimatesAnalyzed: []
  };

  if (originalAnalysis) {
    summary.estimatesAnalyzed.push({
      type: 'Original Contractor Estimate',
      classification: originalAnalysis.classification.classification,
      lineItems: originalAnalysis.analysis.totalLineItems,
      categoriesFound: originalAnalysis.analysis.includedCategories?.length || 0,
      categoriesMissing: originalAnalysis.analysis.missingCategories?.length || 0
    });
  }

  if (carrierAnalysis) {
    summary.estimatesAnalyzed.push({
      type: 'Insurance Carrier Estimate',
      classification: carrierAnalysis.classification.classification,
      lineItems: carrierAnalysis.analysis.totalLineItems,
      categoriesFound: carrierAnalysis.analysis.includedCategories?.length || 0,
      categoriesMissing: carrierAnalysis.analysis.missingCategories?.length || 0
    });
  }

  if (supplementAnalysis) {
    summary.estimatesAnalyzed.push({
      type: 'Supplement Estimate',
      classification: supplementAnalysis.classification.classification,
      lineItems: supplementAnalysis.analysis.totalLineItems,
      categoriesFound: supplementAnalysis.analysis.includedCategories?.length || 0,
      categoriesMissing: supplementAnalysis.analysis.missingCategories?.length || 0
    });
  }

  return summary;
}

function buildScopeComparison(originalAnalysis, carrierAnalysis) {
  if (!originalAnalysis || !carrierAnalysis) {
    return {
      title: 'Scope Comparison',
      note: 'Both original and carrier estimates required for comparison'
    };
  }

  const originalCategories = originalAnalysis.analysis.includedCategories?.map(c => c.category) || [];
  const carrierCategories = carrierAnalysis.analysis.includedCategories?.map(c => c.category) || [];

  const inOriginalNotCarrier = originalCategories.filter(cat => !carrierCategories.includes(cat));
  const inCarrierNotOriginal = carrierCategories.filter(cat => !originalCategories.includes(cat));

  return {
    title: 'Scope Comparison',
    originalCategoriesCount: originalCategories.length,
    carrierCategoriesCount: carrierCategories.length,
    categoriesInOriginalNotInCarrier: inOriginalNotCarrier,
    categoriesInCarrierNotInOriginal: inCarrierNotOriginal,
    observation: inOriginalNotCarrier.length > 0 
      ? `${inOriginalNotCarrier.length} category(ies) present in contractor estimate but not detected in carrier estimate`
      : 'No obvious scope omissions detected'
  };
}

function buildDiscrepancies(originalAnalysis, carrierAnalysis) {
  const discrepancies = [];

  if (!originalAnalysis || !carrierAnalysis) {
    return {
      title: 'Identified Discrepancies',
      note: 'Both estimates required for discrepancy analysis',
      discrepancies: []
    };
  }

  // Compare line item counts
  const originalLineItems = originalAnalysis.analysis.totalLineItems;
  const carrierLineItems = carrierAnalysis.analysis.totalLineItems;

  if (originalLineItems !== carrierLineItems) {
    discrepancies.push({
      type: 'Line Item Count Difference',
      observation: `Original: ${originalLineItems} items, Carrier: ${carrierLineItems} items`,
      difference: Math.abs(originalLineItems - carrierLineItems)
    });
  }

  // Compare issues detected
  const originalIssues = (originalAnalysis.analysis.zeroQuantityItems?.length || 0) + 
                        (originalAnalysis.analysis.potentialUnderScoping?.length || 0);
  const carrierIssues = (carrierAnalysis.analysis.zeroQuantityItems?.length || 0) + 
                       (carrierAnalysis.analysis.potentialUnderScoping?.length || 0);

  if (carrierIssues > originalIssues) {
    discrepancies.push({
      type: 'Quality Issues',
      observation: `Carrier estimate has ${carrierIssues} potential issues vs ${originalIssues} in original`,
      note: 'Review carrier estimate for zero quantities or incomplete scope'
    });
  }

  if (discrepancies.length === 0) {
    discrepancies.push({
      observation: 'No structural discrepancies detected between estimates'
    });
  }

  return {
    title: 'Identified Discrepancies',
    count: discrepancies.length,
    discrepancies
  };
}

function buildSupplementJustification(supplementAnalysis, carrierAnalysis) {
  if (!supplementAnalysis) {
    return {
      title: 'Supplement Justification',
      note: 'No supplement estimate provided'
    };
  }

  const justification = {
    title: 'Supplement Justification',
    supplementCategories: supplementAnalysis.analysis.includedCategories?.length || 0,
    supplementLineItems: supplementAnalysis.analysis.totalLineItems,
    observations: []
  };

  if (supplementAnalysis.analysis.includedCategories && supplementAnalysis.analysis.includedCategories.length > 0) {
    justification.observations.push({
      item: 'Supplement Scope',
      observation: `Supplement includes ${supplementAnalysis.analysis.includedCategories.length} category(ies)`
    });
  }

  if (carrierAnalysis && supplementAnalysis) {
    const supplementCats = supplementAnalysis.analysis.includedCategories?.map(c => c.category) || [];
    const carrierCats = carrierAnalysis.analysis.includedCategories?.map(c => c.category) || [];
    const newCategories = supplementCats.filter(cat => !carrierCats.includes(cat));

    if (newCategories.length > 0) {
      justification.observations.push({
        item: 'New Categories in Supplement',
        observation: `${newCategories.length} category(ies) in supplement not present in carrier estimate`,
        categories: newCategories
      });
    }
  }

  justification.observations.push({
    item: 'Limitation',
    observation: 'This analysis identifies structural differences only. It does not determine pricing accuracy or what is owed.'
  });

  return justification;
}

function buildSupplementObservations(data) {
  const { originalAnalysis, carrierAnalysis, supplementAnalysis, notes } = data;
  const observations = [];

  observations.push({
    item: 'Analysis Type',
    observation: 'Supplement and underpayment analysis using Estimate Review Pro engine'
  });

  if (originalAnalysis) {
    observations.push({
      item: 'Original Estimate',
      observation: `Classified as ${originalAnalysis.classification.classification} with ${originalAnalysis.analysis.totalLineItems} line items`
    });
  }

  if (carrierAnalysis) {
    observations.push({
      item: 'Carrier Estimate',
      observation: `Classified as ${carrierAnalysis.classification.classification} with ${carrierAnalysis.analysis.totalLineItems} line items`
    });
  }

  if (supplementAnalysis) {
    observations.push({
      item: 'Supplement Estimate',
      observation: `Classified as ${supplementAnalysis.classification.classification} with ${supplementAnalysis.analysis.totalLineItems} line items`
    });
  }

  observations.push({
    item: 'Critical Disclaimer',
    observation: 'This is a factual comparison only. It does not constitute advice on negotiations, coverage, pricing, or claim strategy.'
  });

  return {
    title: 'Observations',
    items: observations
  };
}

