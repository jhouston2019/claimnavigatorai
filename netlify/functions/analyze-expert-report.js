/**
 * API Endpoint: /analyze-expert-report
 * Expert Report Analysis Engine
 * Deterministic NLP-based analysis with no AI inference
 */

const { createClient } = require('@supabase/supabase-js');
const pdfParse = require('pdf-parse');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { classifyExpertDocument, extractExpertMetadata, detectSections, validateExpertDocument } = require('./lib/expert-document-classifier');
const { parseNarrative } = require('./lib/narrative-parser');
const { extractOpinions, extractConclusions, extractRecommendations } = require('./lib/opinion-extractor');
const { detectLimitations } = require('./lib/limitation-detector');
const { calculateBiasScore, analyzeToneBalance, detectHedgingLanguage } = require('./lib/bias-scoring');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const startTime = Date.now();
  let userId = null;

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
      };
    }

    const authResult = await validateAuth(event.headers.authorization);
    if (!authResult.valid) {
      return sendError(authResult.error, 'AUTH-001', 401);
    }
    userId = authResult.user.id;

    const body = parseBody(event.body);
    
    if (!body.claim_id) {
      return sendError('claim_id is required', 'VAL-001', 400);
    }

    if (!body.expert_report_pdf_url) {
      return sendError('expert_report_pdf_url is required', 'VAL-002', 400);
    }

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id, claim_number')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    let reportText;
    try {
      const response = await fetch(body.expert_report_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download expert report PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      reportText = pdfData.text;

      if (!reportText || reportText.trim().length < 200) {
        throw new Error('Expert report PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      return sendError('Failed to parse expert report PDF', 'PDF-001', 400, {
        details: pdfError.message
      });
    }

    const validation = validateExpertDocument(reportText);
    if (!validation.valid) {
      return sendError('Expert report validation failed', 'VAL-003', 400, {
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    const classification = classifyExpertDocument(reportText);
    
    const metadata = extractExpertMetadata(reportText);
    
    const sections = detectSections(reportText);
    
    const narrativeData = parseNarrative(reportText);
    
    const opinionData = extractOpinions(narrativeData);
    
    const conclusions = extractConclusions(reportText, sections);
    
    const recommendations = extractRecommendations(reportText, sections);
    
    const limitations = detectLimitations(narrativeData, sections);
    
    const biasAnalysis = calculateBiasScore(reportText, narrativeData);
    
    const toneAnalysis = analyzeToneBalance(narrativeData);
    
    const hedgingAnalysis = detectHedgingLanguage(narrativeData);
    
    const expertReportData = {
      claim_id: body.claim_id,
      document_id: body.document_id || null,
      report_type: classification.report_type,
      classification_confidence: classification.confidence_score,
      expert_name: metadata.expert_name,
      expert_credentials: metadata.expert_credentials,
      expert_company: metadata.expert_company,
      inspection_date: metadata.inspection_date,
      report_date: metadata.report_date,
      causation_opinion: opinionData.causation_opinion,
      causation_confidence: opinionData.causation_confidence,
      causation_statements: opinionData.causation_statements,
      extracted_conclusions: conclusions,
      extracted_limitations: limitations.limitations,
      extracted_recommendations: recommendations,
      extracted_measurements: narrativeData.measurements,
      detected_sections: sections.map(s => ({ header: s.header, line_count: s.line_count })),
      bias_score: biasAnalysis.bias_score,
      carrier_aligned_phrases: biasAnalysis.carrier_aligned_phrases,
      policyholder_aligned_phrases: biasAnalysis.policyholder_aligned_phrases,
      parsed_sentence_count: narrativeData.sentence_count,
      negation_count: narrativeData.negated_statements.length,
      conditional_count: narrativeData.conditional_statements.length,
      qualification_count: narrativeData.qualification_statements.length
    };

    const { data: storedReport, error: storeError } = await supabase
      .from('claim_expert_reports')
      .insert(expertReportData)
      .select()
      .single();

    if (storeError) {
      return sendError('Failed to store expert report analysis', 'DB-001', 500, {
        details: storeError.message
      });
    }

    if (body.document_id) {
      await supabase
        .from('claim_documents')
        .update({ 
          document_type: classification.report_type === 'other_expert' ? 'expert_opinion' : classification.report_type
        })
        .eq('id', body.document_id);
    }

    await logAPIRequest({
      userId,
      endpoint: '/analyze-expert-report',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    return sendSuccess({
      report_id: storedReport.id,
      classification: {
        report_type: classification.report_type,
        confidence: classification.confidence_score,
        is_ambiguous: classification.is_ambiguous,
        alternative_type: classification.alternative_type
      },
      expert_metadata: {
        name: metadata.expert_name,
        credentials: metadata.expert_credentials,
        company: metadata.expert_company,
        inspection_date: metadata.inspection_date,
        report_date: metadata.report_date
      },
      causation_analysis: {
        opinion: opinionData.causation_opinion,
        confidence: opinionData.causation_confidence,
        statement_count: opinionData.causation_statements.length,
        statements: opinionData.causation_statements
      },
      conclusions: conclusions,
      recommendations: recommendations,
      limitations: {
        limitation_count: limitations.limitation_count,
        severity_score: limitations.severity_score,
        has_critical: limitations.has_critical_limitations,
        limitations: limitations.limitations
      },
      bias_analysis: {
        bias_score: biasAnalysis.bias_score,
        classification: biasAnalysis.bias_classification,
        carrier_phrase_count: biasAnalysis.carrier_aligned_phrases.length,
        policyholder_phrase_count: biasAnalysis.policyholder_aligned_phrases.length,
        tone_balance: toneAnalysis,
        hedging: hedgingAnalysis
      },
      narrative_stats: {
        sentence_count: narrativeData.sentence_count,
        negation_count: narrativeData.negated_statements.length,
        conditional_count: narrativeData.conditional_statements.length,
        qualification_count: narrativeData.qualification_statements.length,
        measurement_count: narrativeData.measurements.length,
        section_count: sections.length
      },
      detected_sections: sections.map(s => s.header),
      validation: {
        has_credentials: validation.has_credentials,
        warnings: validation.warnings
      },
      metadata: {
        processing_time_ms: Date.now() - startTime,
        engine_version: '4.0',
        analysis_method: 'deterministic_nlp',
        analysis_layers: [
          'classification',
          'metadata_extraction',
          'section_detection',
          'narrative_parsing',
          'opinion_extraction',
          'limitation_detection',
          'bias_scoring'
        ]
      }
    });

  } catch (error) {
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/analyze-expert-report',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Expert report analysis failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};
