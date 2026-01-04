/**
 * Coverage Alignment with Estimate Analysis
 * Step 9: Aligns estimate findings with policy coverage
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

    await LOG_EVENT('coverage_alignment', 'coverage-alignment-estimate', { payload: body });

    const {
      estimateText = '',
      policyText = '',
      coverages = [],
      limits = {},
      notes = ''
    } = body;

    if (!estimateText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Estimate text required' })
      };
    }

    const startTime = Date.now();

    // STEP 1: Analyze estimate using ERP engine
    const estimateAnalysis = EstimateEngine.analyzeEstimate({
      estimateText,
      lineItems: [],
      userInput: notes,
      metadata: {
        context: 'coverage_alignment',
        policyProvided: !!policyText
      }
    });

    if (!estimateAnalysis.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: estimateAnalysis.error,
          details: estimateAnalysis.details
        })
      };
    }

    // STEP 2: Build coverage alignment report
    const alignmentReport = buildCoverageAlignmentReport(
      estimateAnalysis,
      { policyText, coverages, limits }
    );

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    await LOG_USAGE({
      function: 'coverage-alignment-estimate',
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
          estimateAnalysis: estimateAnalysis.analysis,
          classification: estimateAnalysis.classification,
          alignmentReport,
          engine: 'Estimate Review Pro'
        }
      })
    };

  } catch (error) {
    await LOG_ERROR('coverage_alignment_error', {
      function: 'coverage-alignment-estimate',
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
 * Build coverage alignment report
 */
function buildCoverageAlignmentReport(estimateAnalysis, policyData) {
  const { analysis, classification, report } = estimateAnalysis;
  const { policyText, coverages, limits } = policyData;

  const alignmentReport = {
    title: 'Coverage Alignment Report',
    generated: new Date().toISOString(),
    
    sections: {
      estimateSummary: {
        title: 'Estimate Analysis Summary',
        classification: classification.classification,
        confidence: classification.confidence,
        totalLineItems: analysis.totalLineItems,
        categoriesFound: analysis.includedCategories?.length || 0,
        categoriesMissing: analysis.missingCategories?.length || 0
      },
      
      coverageMapping: {
        title: 'Coverage Mapping',
        description: 'How estimate categories align with policy coverages',
        mappings: buildCoverageMappings(analysis, coverages)
      },
      
      potentialGaps: {
        title: 'Potential Coverage Gaps',
        description: 'Categories in estimate that may not be covered',
        gaps: identifyPotentialGaps(analysis, coverages)
      },
      
      limitImpacts: {
        title: 'Policy Limit Impacts',
        description: 'How policy limits may affect estimate categories',
        impacts: analyzeLimitImpacts(analysis, limits)
      },
      
      recommendations: {
        title: 'Alignment Observations',
        items: buildAlignmentObservations(analysis, policyData)
      }
    },
    
    fullEstimateReport: report
  };

  return alignmentReport;
}

function buildCoverageMappings(analysis, coverages) {
  const mappings = [];
  
  if (!analysis.includedCategories || analysis.includedCategories.length === 0) {
    return [{ note: 'No categories detected in estimate' }];
  }

  analysis.includedCategories.forEach(cat => {
    mappings.push({
      estimateCategory: cat.category,
      status: cat.status,
      note: 'Review policy to confirm coverage for this category'
    });
  });

  return mappings;
}

function identifyPotentialGaps(analysis, coverages) {
  const gaps = [];
  
  if (analysis.missingCategories && analysis.missingCategories.length > 0) {
    analysis.missingCategories.forEach(cat => {
      gaps.push({
        category: cat.category,
        observation: 'Category not detected in estimate but may be required for complete repair',
        note: 'Verify if this category is covered under policy and should be included'
      });
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      observation: 'No obvious gaps detected between estimate and expected categories'
    });
  }

  return gaps;
}

function analyzeLimitImpacts(analysis, limits) {
  const impacts = [];
  
  impacts.push({
    observation: 'Policy limits should be reviewed against estimate totals',
    note: 'Ensure estimate categories do not exceed applicable sublimits or aggregate limits'
  });

  if (analysis.includedCategories && analysis.includedCategories.length > 0) {
    impacts.push({
      categoriesDetected: analysis.includedCategories.length,
      note: 'Each category should be verified against policy limits and sublimits'
    });
  }

  return impacts;
}

function buildAlignmentObservations(analysis, policyData) {
  const observations = [];
  
  observations.push({
    item: 'Estimate Classification',
    observation: `Estimate classified as ${analysis.classification || 'UNKNOWN'} type`
  });

  if (analysis.observations && analysis.observations.length > 0) {
    analysis.observations.forEach(obs => {
      observations.push({
        item: 'Estimate Observation',
        observation: obs
      });
    });
  }

  observations.push({
    item: 'Coverage Verification Required',
    observation: 'All estimate categories should be verified against policy coverage provisions'
  });

  observations.push({
    item: 'Limitations',
    observation: 'This alignment is observational only. It does not interpret policy coverage or determine what is owed.'
  });

  return observations;
}

