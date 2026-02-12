/**
 * Policy Parser Engine v2
 * Deterministic extraction with AI fallback
 * NO SUMMARIES - STRUCTURED DATA ONLY
 */

const crypto = require('crypto');

/**
 * Parse policy PDF text into structured coverage data
 * @param {string} policyText - Raw text from PDF
 * @returns {object} Structured policy data
 */
function parsePolicyDocument(policyText) {
  const startTime = Date.now();
  
  // Normalize text
  const normalizedText = normalizeText(policyText);
  
  // Calculate hash for deduplication
  const textHash = calculateHash(policyText);
  
  // Extract coverage data deterministically
  const coverage = {
    // Coverage Limits
    dwelling_limit: extractDwellingLimit(normalizedText),
    other_structures_limit: extractOtherStructuresLimit(normalizedText),
    contents_limit: extractContentsLimit(normalizedText),
    ale_limit: extractALELimit(normalizedText),
    
    // Deductible
    deductible: extractDeductible(normalizedText),
    deductible_type: extractDeductibleType(normalizedText),
    
    // Settlement Type
    settlement_type: extractSettlementType(normalizedText),
    
    // Ordinance & Law
    ordinance_law_percent: extractOrdinanceLawPercent(normalizedText),
    ordinance_law_limit: extractOrdinanceLawLimit(normalizedText),
    
    // Endorsements
    matching_endorsement: detectMatchingEndorsement(normalizedText),
    cosmetic_exclusion: detectCosmeticExclusion(normalizedText),
    roof_acv_endorsement: detectRoofACVEndorsement(normalizedText),
    replacement_cost_endorsement: detectReplacementCostEndorsement(normalizedText),
    named_peril_policy: detectNamedPerilPolicy(normalizedText),
    open_peril_policy: detectOpenPerilPolicy(normalizedText),
    
    // Sublimits
    water_sublimit: extractWaterSublimit(normalizedText),
    mold_sublimit: extractMoldSublimit(normalizedText),
    sewer_backup_sublimit: extractSewerBackupSublimit(normalizedText),
    
    // Special Endorsements
    special_endorsements: extractSpecialEndorsements(normalizedText),
    
    // Exclusions
    exclusion_flags: extractExclusions(normalizedText),
    
    // Metadata
    raw_policy_text_hash: textHash,
    parsed_by: 'regex',
    ai_confidence: null,
    parsing_duration_ms: Date.now() - startTime
  };
  
  return coverage;
}

/**
 * Normalize policy text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Calculate SHA256 hash of text
 */
function calculateHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Extract dwelling limit (Coverage A)
 */
function extractDwellingLimit(text) {
  const patterns = [
    /coverage\s+a[:\s-]+dwelling[:\s]+\$?([\d,]+)/i,
    /dwelling\s+coverage[:\s]+\$?([\d,]+)/i,
    /coverage\s+a[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract other structures limit (Coverage B)
 */
function extractOtherStructuresLimit(text) {
  const patterns = [
    /coverage\s+b[:\s-]+other\s+structures[:\s]+\$?([\d,]+)/i,
    /other\s+structures[:\s]+\$?([\d,]+)/i,
    /coverage\s+b[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract contents limit (Coverage C)
 */
function extractContentsLimit(text) {
  const patterns = [
    /coverage\s+c[:\s-]+personal\s+property[:\s]+\$?([\d,]+)/i,
    /personal\s+property[:\s]+\$?([\d,]+)/i,
    /contents\s+coverage[:\s]+\$?([\d,]+)/i,
    /coverage\s+c[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract ALE limit (Coverage D)
 */
function extractALELimit(text) {
  const patterns = [
    /coverage\s+d[:\s-]+loss\s+of\s+use[:\s]+\$?([\d,]+)/i,
    /additional\s+living\s+expense[s]?[:\s]+\$?([\d,]+)/i,
    /loss\s+of\s+use[:\s]+\$?([\d,]+)/i,
    /ale[:\s]+\$?([\d,]+)/i,
    /coverage\s+d[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract deductible
 */
function extractDeductible(text) {
  const patterns = [
    /deductible[:\s]+\$?([\d,]+)/i,
    /all\s+other\s+perils\s+deductible[:\s]+\$?([\d,]+)/i,
    /aop\s+deductible[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract deductible type
 */
function extractDeductibleType(text) {
  if (/deductible.*?(\d+)%/i.test(text)) {
    return 'percentage';
  }
  return 'flat';
}

/**
 * Extract settlement type
 */
function extractSettlementType(text) {
  const rcvPatterns = [
    /replacement\s+cost\s+value/i,
    /rcv/i,
    /replacement\s+cost/i
  ];
  
  const acvPatterns = [
    /actual\s+cash\s+value/i,
    /acv/i
  ];
  
  const hasRCV = rcvPatterns.some(pattern => pattern.test(text));
  const hasACV = acvPatterns.some(pattern => pattern.test(text));
  
  if (hasRCV && hasACV) return 'MIXED';
  if (hasRCV) return 'RCV';
  if (hasACV) return 'ACV';
  
  return null;
}

/**
 * Extract ordinance & law percentage
 */
function extractOrdinanceLawPercent(text) {
  const patterns = [
    /ordinance\s+(?:and|&|or)\s+law[:\s]+(\d{1,2})%/i,
    /ordinance\s+(?:and|&|or)\s+law.*?(\d{1,2})\s*percent/i,
    /building\s+code\s+upgrade.*?(\d{1,2})%/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const percent = parseFloat(match[1]);
      if (percent >= 0 && percent <= 100) {
        return percent;
      }
    }
  }
  
  return null;
}

/**
 * Extract ordinance & law limit
 */
function extractOrdinanceLawLimit(text) {
  const patterns = [
    /ordinance\s+(?:and|&|or)\s+law[:\s]+\$?([\d,]+)/i,
    /building\s+code\s+upgrade[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Detect matching endorsement
 */
function detectMatchingEndorsement(text) {
  const patterns = [
    /matching\s+endorsement/i,
    /undamaged\s+property\s+matching/i,
    /match\s+undamaged\s+portions/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect cosmetic exclusion
 */
function detectCosmeticExclusion(text) {
  const patterns = [
    /cosmetic\s+damage\s+exclusion/i,
    /cosmetic\s+loss\s+exclusion/i,
    /exclude.*?cosmetic/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect roof ACV endorsement
 */
function detectRoofACVEndorsement(text) {
  const patterns = [
    /roof\s+actual\s+cash\s+value/i,
    /roof\s+acv/i,
    /actual\s+cash\s+value\s+roof/i,
    /roof.*?depreciation/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect replacement cost endorsement
 */
function detectReplacementCostEndorsement(text) {
  const patterns = [
    /replacement\s+cost\s+endorsement/i,
    /extended\s+replacement\s+cost/i,
    /guaranteed\s+replacement\s+cost/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect named peril policy
 */
function detectNamedPerilPolicy(text) {
  const patterns = [
    /named\s+peril/i,
    /ho-?2/i,
    /basic\s+form/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect open peril policy
 */
function detectOpenPerilPolicy(text) {
  const patterns = [
    /open\s+peril/i,
    /all\s+risk/i,
    /ho-?3/i,
    /special\s+form/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Extract water sublimit
 */
function extractWaterSublimit(text) {
  const patterns = [
    /water\s+damage.*?limit[:\s]+\$?([\d,]+)/i,
    /water.*?sublimit[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract mold sublimit
 */
function extractMoldSublimit(text) {
  const patterns = [
    /mold.*?limit[:\s]+\$?([\d,]+)/i,
    /fungus.*?limit[:\s]+\$?([\d,]+)/i,
    /mold.*?sublimit[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract sewer backup sublimit
 */
function extractSewerBackupSublimit(text) {
  const patterns = [
    /sewer\s+backup.*?limit[:\s]+\$?([\d,]+)/i,
    /water\s+backup.*?limit[:\s]+\$?([\d,]+)/i
  ];
  
  return extractNumericValue(text, patterns);
}

/**
 * Extract special endorsements
 */
function extractSpecialEndorsements(text) {
  const endorsements = [];
  
  const endorsementPatterns = {
    'Earthquake': /earthquake\s+endorsement/i,
    'Flood': /flood\s+endorsement/i,
    'Sinkhole': /sinkhole\s+endorsement/i,
    'Identity Theft': /identity\s+theft/i,
    'Equipment Breakdown': /equipment\s+breakdown/i,
    'Service Line': /service\s+line/i
  };
  
  for (const [name, pattern] of Object.entries(endorsementPatterns)) {
    if (pattern.test(text)) {
      endorsements.push({ name, detected: true });
    }
  }
  
  return endorsements;
}

/**
 * Extract exclusions
 */
function extractExclusions(text) {
  const exclusions = {};
  
  const exclusionPatterns = {
    earth_movement: /exclude.*?earth\s+movement/i,
    flood: /exclude.*?flood/i,
    war: /exclude.*?war/i,
    nuclear: /exclude.*?nuclear/i,
    intentional_loss: /exclude.*?intentional/i,
    neglect: /exclude.*?neglect/i
  };
  
  for (const [key, pattern] of Object.entries(exclusionPatterns)) {
    exclusions[key] = pattern.test(text);
  }
  
  return exclusions;
}

/**
 * Extract numeric value from text using patterns
 */
function extractNumericValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Validate extracted coverage data
 */
function validateCoverageData(coverage) {
  const validated = { ...coverage };
  
  // Validate numeric fields
  const numericFields = [
    'dwelling_limit', 'other_structures_limit', 'contents_limit', 'ale_limit',
    'deductible', 'ordinance_law_percent', 'ordinance_law_limit',
    'water_sublimit', 'mold_sublimit', 'sewer_backup_sublimit'
  ];
  
  for (const field of numericFields) {
    if (validated[field] !== null && (isNaN(validated[field]) || validated[field] < 0)) {
      validated[field] = null;
    }
  }
  
  // Validate percentages (0-100)
  if (validated.ordinance_law_percent !== null) {
    if (validated.ordinance_law_percent < 0 || validated.ordinance_law_percent > 100) {
      validated.ordinance_law_percent = null;
    }
  }
  
  // Validate settlement type
  if (validated.settlement_type && !['ACV', 'RCV', 'MIXED'].includes(validated.settlement_type)) {
    validated.settlement_type = null;
  }
  
  return validated;
}

/**
 * AI Extraction Fallback
 * Only called if deterministic extraction fails for major fields
 */
async function extractWithAI(policyText, openaiClient) {
  const prompt = buildPolicyExtractionPrompt(policyText);
  
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a homeowner insurance policy analyst. Extract structured fields only. Return valid JSON only. DO NOT summarize or provide commentary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const response = JSON.parse(completion.choices[0].message.content);
    
    // Validate and sanitize AI response
    const validated = {
      dwelling_limit: sanitizeNumeric(response.dwelling_limit),
      other_structures_limit: sanitizeNumeric(response.other_structures_limit),
      contents_limit: sanitizeNumeric(response.contents_limit),
      ale_limit: sanitizeNumeric(response.ale_limit),
      deductible: sanitizeNumeric(response.deductible),
      deductible_type: response.deductible_type || 'flat',
      settlement_type: sanitizeSettlementType(response.settlement_type),
      ordinance_law_percent: sanitizePercent(response.ordinance_law_percent),
      ordinance_law_limit: sanitizeNumeric(response.ordinance_law_limit),
      matching_endorsement: Boolean(response.matching_endorsement),
      cosmetic_exclusion: Boolean(response.cosmetic_exclusion),
      roof_acv_endorsement: Boolean(response.roof_acv_endorsement),
      replacement_cost_endorsement: Boolean(response.replacement_cost_endorsement),
      named_peril_policy: Boolean(response.named_peril_policy),
      open_peril_policy: Boolean(response.open_peril_policy),
      water_sublimit: sanitizeNumeric(response.water_sublimit),
      mold_sublimit: sanitizeNumeric(response.mold_sublimit),
      sewer_backup_sublimit: sanitizeNumeric(response.sewer_backup_sublimit),
      special_endorsements: response.endorsements_detected || [],
      exclusion_flags: response.exclusions_detected || {},
      parsed_by: 'ai',
      ai_confidence: response.confidence || 0.8
    };
    
    return validated;
  } catch (error) {
    console.error('AI extraction failed:', error);
    return null;
  }
}

/**
 * Build AI extraction prompt
 */
function buildPolicyExtractionPrompt(policyText) {
  return `Extract the following structured fields from this homeowner insurance policy. Return JSON only.

POLICY TEXT:
${policyText.substring(0, 8000)}

REQUIRED JSON FORMAT:
{
  "dwelling_limit": number or null,
  "other_structures_limit": number or null,
  "contents_limit": number or null,
  "ale_limit": number or null,
  "deductible": number or null,
  "deductible_type": "flat" or "percentage",
  "settlement_type": "ACV" or "RCV" or "MIXED" or null,
  "ordinance_law_percent": number (0-100) or null,
  "ordinance_law_limit": number or null,
  "matching_endorsement": boolean,
  "cosmetic_exclusion": boolean,
  "roof_acv_endorsement": boolean,
  "replacement_cost_endorsement": boolean,
  "named_peril_policy": boolean,
  "open_peril_policy": boolean,
  "water_sublimit": number or null,
  "mold_sublimit": number or null,
  "sewer_backup_sublimit": number or null,
  "endorsements_detected": ["name1", "name2"],
  "exclusions_detected": {"earth_movement": boolean, "flood": boolean},
  "confidence": 0.0-1.0
}

RULES:
- Extract ONLY. Do not summarize.
- Return numbers without $ or commas
- Return null if field not found
- Return boolean true/false for endorsements
- Confidence score based on clarity of policy language`;
}

/**
 * Sanitize numeric value from AI
 */
function sanitizeNumeric(value) {
  if (value === null || value === undefined) return null;
  
  const num = parseFloat(String(value).replace(/[,$]/g, ''));
  if (isNaN(num) || num < 0) return null;
  
  return num;
}

/**
 * Sanitize percentage from AI
 */
function sanitizePercent(value) {
  const num = sanitizeNumeric(value);
  if (num === null) return null;
  if (num < 0 || num > 100) return null;
  return num;
}

/**
 * Sanitize settlement type from AI
 */
function sanitizeSettlementType(value) {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (['ACV', 'RCV', 'MIXED'].includes(upper)) {
    return upper;
  }
  return null;
}

/**
 * Merge deterministic and AI results
 * Prefer deterministic, use AI only for missing fields
 */
function mergePolicyData(deterministicData, aiData) {
  if (!aiData) return deterministicData;
  
  const merged = { ...deterministicData };
  
  // For each field, prefer deterministic result
  for (const key in aiData) {
    if (merged[key] === null || merged[key] === undefined) {
      merged[key] = aiData[key];
    }
  }
  
  // Update metadata
  if (aiData.parsed_by === 'ai') {
    merged.parsed_by = 'hybrid'; // Indicates both methods used
    merged.ai_confidence = aiData.ai_confidence;
  }
  
  return merged;
}

module.exports = {
  parsePolicyDocument,
  validateCoverageData,
  extractWithAI,
  mergePolicyData,
  calculateHash,
  normalizeText
};
