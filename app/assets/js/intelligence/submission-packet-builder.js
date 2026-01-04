/**
 * SUBMISSION PACKET BUILDER
 * Creates carrier-safe, professional submission packages
 * 
 * CRITICAL: Most legally sensitive component
 * - No opinions
 * - No demands
 * - No entitlement language
 * - Neutral, factual, chronological only
 */

// ============================================================================
// PROHIBITED LANGUAGE (HARD RULES)
// ============================================================================

const PROHIBITED_PHRASES = [
  'underpaid',
  'under paid',
  'under-paid',
  'missed',
  'owed',
  'owe me',
  'owe us',
  'owed to',
  'should have',
  'should\'ve',
  'entitled',
  'entitled to',
  'wrong',
  'error',
  'mistake',
  'incorrect',
  'failed to',
  'neglected',
  'overlooked',
  'ignored',
  'bad faith',
  'unfair',
  'unreasonable',
  'inadequate',
  'insufficient'
];

// ============================================================================
// LANGUAGE SANITIZATION
// ============================================================================

/**
 * Sanitizes text to remove prohibited language
 * @param {string} text - Text to sanitize
 * @returns {Object} Sanitized text and flags
 */
function sanitizeLanguage(text) {
  if (!text) return { sanitized: '', violations: [] };

  let sanitized = text;
  const violations = [];

  // Check for prohibited phrases
  PROHIBITED_PHRASES.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (regex.test(sanitized)) {
      violations.push(phrase);
      
      // Apply neutral replacements
      const replacements = {
        'underpaid': 'the estimate does not include',
        'under paid': 'the estimate does not include',
        'under-paid': 'the estimate does not include',
        'missed': 'not present in',
        'owed': 'documented',
        'owe me': 'the documentation shows',
        'owe us': 'the documentation shows',
        'owed to': 'documented',
        'should have': 'the estimate does not include',
        'should\'ve': 'the estimate does not include',
        'entitled': 'the policy indicates',
        'entitled to': 'the policy indicates',
        'wrong': 'differs from',
        'error': 'discrepancy',
        'mistake': 'discrepancy',
        'incorrect': 'differs from',
        'failed to': 'did not',
        'neglected': 'did not include',
        'overlooked': 'not present in',
        'ignored': 'not addressed',
        'bad faith': 'the circumstances show',
        'unfair': 'differs from',
        'unreasonable': 'differs from',
        'inadequate': 'does not include',
        'insufficient': 'does not include'
      };

      const replacement = replacements[phrase.toLowerCase()] || '[REDACTED]';
      sanitized = sanitized.replace(regex, replacement);
    }
  });

  return { sanitized, violations };
}

/**
 * Converts user language to carrier-professional language
 * @param {string} text - User text
 * @returns {string} Professional text
 */
function convertToCarrierProfessional(text) {
  if (!text) return '';

  let professional = text;

  // Pattern replacements
  const patterns = [
    { from: /they missed (.+)/gi, to: '$1 is not present in the estimate' },
    { from: /they forgot (.+)/gi, to: '$1 is not present in the estimate' },
    { from: /they didn't include (.+)/gi, to: '$1 is not present in the estimate' },
    { from: /missing (.+)/gi, to: '$1 is not present in the estimate' },
    { from: /I need (.+)/gi, to: 'Documentation related to $1 is attached' },
    { from: /you need to (.+)/gi, to: 'Please review $1' },
    { from: /this is wrong/gi, to: 'This differs from the documentation' },
    { from: /this doesn't match/gi, to: 'This differs from the documentation' }
  ];

  patterns.forEach(({ from, to }) => {
    professional = professional.replace(from, to);
  });

  return professional;
}

// ============================================================================
// DOCUMENT FILTERING
// ============================================================================

/**
 * Filters documents for submission safety
 * @param {Array} documents - Documents to filter
 * @returns {Object} Included and excluded documents
 */
function filterDocumentsForSubmission(documents) {
  const included = [];
  const excluded = [];
  const exclusionReasons = {};

  documents.forEach(doc => {
    let shouldExclude = false;
    const reasons = [];

    // Auto-exclude: Draft documents
    if (doc.status === 'draft' || doc.isDraft) {
      shouldExclude = true;
      reasons.push('Document marked as draft');
    }

    // Auto-exclude: Incomplete documents
    if (doc.status === 'incomplete' || doc.isIncomplete) {
      shouldExclude = true;
      reasons.push('Document marked incomplete');
    }

    // Auto-exclude: Internal documents
    if (doc.internal || doc.isInternal || doc.type === 'internal') {
      shouldExclude = true;
      reasons.push('Internal document');
    }

    // Auto-exclude: User comments
    if (doc.type === 'comment' || doc.type === 'note' || doc.type === 'user_note') {
      shouldExclude = true;
      reasons.push('User commentary');
    }

    // Auto-exclude: Tool outputs
    if (doc.type === 'tool_output' || doc.source === 'ai_analysis') {
      shouldExclude = true;
      reasons.push('AI analysis artifact');
    }

    // Auto-exclude: Speculative documents
    if (doc.speculative || doc.isSpeculative) {
      shouldExclude = true;
      reasons.push('Speculative content');
    }

    // Auto-exclude: Documents with prohibited language
    if (doc.text || doc.content) {
      const check = sanitizeLanguage(doc.text || doc.content);
      if (check.violations.length > 0) {
        shouldExclude = true;
        reasons.push(`Contains prohibited language: ${check.violations.join(', ')}`);
      }
    }

    if (shouldExclude) {
      excluded.push(doc);
      exclusionReasons[doc.id] = reasons;
    } else {
      included.push(doc);
    }
  });

  return { included, excluded, exclusionReasons };
}

/**
 * Strips sensitive metadata from documents
 * @param {Object} document - Document to clean
 * @returns {Object} Cleaned document
 */
function stripSensitiveMetadata(document) {
  const cleaned = { ...document };

  // Remove internal fields
  delete cleaned.userComments;
  delete cleaned.internalNotes;
  delete cleaned.aiAnalysis;
  delete cleaned.toolOutput;
  delete cleaned.annotations;
  delete cleaned.comments;
  delete cleaned.internal;
  delete cleaned.isInternal;
  delete cleaned.isDraft;
  delete cleaned.isSpeculative;
  delete cleaned.speculative;

  // Remove user identification
  delete cleaned.uploadedBy;
  delete cleaned.createdBy;
  delete cleaned.modifiedBy;

  // Sanitize text content
  if (cleaned.text) {
    const sanitized = sanitizeLanguage(cleaned.text);
    cleaned.text = sanitized.sanitized;
  }

  if (cleaned.content) {
    const sanitized = sanitizeLanguage(cleaned.content);
    cleaned.content = sanitized.sanitized;
  }

  if (cleaned.description) {
    const sanitized = sanitizeLanguage(cleaned.description);
    cleaned.description = sanitized.sanitized;
  }

  return cleaned;
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

/**
 * Generates carrier-professional cover narrative
 * @param {Object} params - Narrative parameters
 * @returns {string} Cover narrative
 */
function generateCoverNarrative(params) {
  const {
    claimNumber,
    policyNumber,
    dateOfLoss,
    submissionType,
    documentCount,
    estimateFindings
  } = params;

  const lines = [];

  // Opening (neutral, factual)
  lines.push(`Re: Claim ${claimNumber || '[Claim Number]'}`);
  lines.push(`Policy: ${policyNumber || '[Policy Number]'}`);
  lines.push(`Date of Loss: ${dateOfLoss || '[Date]'}`);
  lines.push('');

  // Submission type context
  if (submissionType === 'INITIAL_CLAIM') {
    lines.push('The following materials are submitted for review:');
  } else if (submissionType === 'SUPPLEMENT') {
    lines.push('The following supplemental materials are submitted for review:');
  } else if (submissionType === 'ADDITIONAL_DOCUMENTATION') {
    lines.push('The following additional documentation is submitted:');
  } else if (submissionType === 'RESPONSE_TO_REQUEST') {
    lines.push('In response to your request, the following materials are submitted:');
  }

  lines.push('');

  // Document summary (factual list)
  lines.push(`Total documents: ${documentCount || 0}`);
  lines.push('');

  // Estimate findings (if provided, neutral language only)
  if (estimateFindings && estimateFindings.length > 0) {
    lines.push('Estimate documentation includes:');
    estimateFindings.forEach(finding => {
      // Sanitize finding text
      const sanitized = sanitizeLanguage(finding);
      lines.push(`- ${sanitized.sanitized}`);
    });
    lines.push('');
  }

  // Closing (neutral)
  lines.push('Please review the attached documentation.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates document list for submission
 * @param {Array} documents - Documents to list
 * @returns {string} Document list
 */
function generateDocumentList(documents) {
  const lines = ['ATTACHED DOCUMENTATION:', ''];

  documents.forEach((doc, index) => {
    const num = index + 1;
    const name = doc.name || doc.filename || `Document ${num}`;
    const type = doc.type || 'document';
    const date = doc.date || doc.createdAt || '';

    lines.push(`${num}. ${name} (${type})${date ? ` - ${date}` : ''}`);
  });

  return lines.join('\n');
}

// ============================================================================
// PACKET BUILDER
// ============================================================================

/**
 * Builds complete submission packet
 * @param {Object} params - Packet parameters
 * @returns {Object} Submission packet
 */
function buildSubmissionPacket(params) {
  const {
    claimId,
    claimNumber,
    policyNumber,
    dateOfLoss,
    claimState,
    submissionType,
    documents = [],
    estimateFindings = [],
    carrierContext = {}
  } = params;

  // Filter documents
  const { included, excluded, exclusionReasons } = filterDocumentsForSubmission(documents);

  // Clean included documents
  const cleanedDocuments = included.map(doc => stripSensitiveMetadata(doc));

  // Generate cover narrative
  const coverNarrative = generateCoverNarrative({
    claimNumber,
    policyNumber,
    dateOfLoss,
    submissionType,
    documentCount: cleanedDocuments.length,
    estimateFindings
  });

  // Generate document list
  const documentList = generateDocumentList(cleanedDocuments);

  // Audit metadata
  const auditMetadata = {
    claimId,
    claimState,
    submissionType,
    generatedAt: new Date().toISOString(),
    documentCount: {
      total: documents.length,
      included: cleanedDocuments.length,
      excluded: excluded.length
    },
    languageViolations: [],
    exclusionReasons
  };

  // Check for language violations in estimate findings
  estimateFindings.forEach(finding => {
    const check = sanitizeLanguage(finding);
    if (check.violations.length > 0) {
      auditMetadata.languageViolations.push({
        source: 'estimateFindings',
        violations: check.violations
      });
    }
  });

  return {
    coverNarrative,
    documentList,
    includedDocuments: cleanedDocuments,
    excludedDocuments: excluded,
    disclosureNotes: generateDisclosureNotes(excluded, exclusionReasons),
    auditMetadata
  };
}

/**
 * Generates disclosure notes for excluded documents
 * @param {Array} excluded - Excluded documents
 * @param {Object} reasons - Exclusion reasons
 * @returns {Array} Disclosure notes
 */
function generateDisclosureNotes(excluded, reasons) {
  const notes = [];

  if (excluded.length > 0) {
    notes.push(`${excluded.length} document(s) excluded from submission:`);
    excluded.forEach(doc => {
      const docReasons = reasons[doc.id] || ['Unknown reason'];
      notes.push(`- ${doc.name || doc.id}: ${docReasons.join(', ')}`);
    });
  }

  return notes;
}

/**
 * Validates submission packet
 * @param {Object} packet - Packet to validate
 * @returns {Object} Validation result
 */
function validateSubmissionPacket(packet) {
  const issues = [];
  const warnings = [];

  // Check for prohibited language in cover narrative
  const narrativeCheck = sanitizeLanguage(packet.coverNarrative);
  if (narrativeCheck.violations.length > 0) {
    issues.push(`Cover narrative contains prohibited language: ${narrativeCheck.violations.join(', ')}`);
  }

  // Check that documents were actually included
  if (packet.includedDocuments.length === 0) {
    issues.push('No documents included in submission packet');
  }

  // Check for sensitive metadata leakage
  packet.includedDocuments.forEach(doc => {
    if (doc.userComments || doc.internalNotes || doc.aiAnalysis) {
      issues.push(`Document ${doc.id} contains sensitive metadata`);
    }
  });

  // Check audit metadata completeness
  if (!packet.auditMetadata || !packet.auditMetadata.generatedAt) {
    warnings.push('Audit metadata incomplete');
  }

  const valid = issues.length === 0;

  return {
    valid,
    issues,
    warnings
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PROHIBITED_PHRASES,
    sanitizeLanguage,
    convertToCarrierProfessional,
    filterDocumentsForSubmission,
    stripSensitiveMetadata,
    generateCoverNarrative,
    generateDocumentList,
    buildSubmissionPacket,
    validateSubmissionPacket
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.SubmissionPacketBuilder = {
    PROHIBITED_PHRASES,
    sanitizeLanguage,
    convertToCarrierProfessional,
    filterDocumentsForSubmission,
    stripSensitiveMetadata,
    generateCoverNarrative,
    generateDocumentList,
    buildSubmissionPacket,
    validateSubmissionPacket
  };
}

