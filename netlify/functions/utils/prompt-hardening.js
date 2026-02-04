/**
 * Prompt Hardening Utility
 * 
 * Enforces professional, claim-grade output from all AI functions.
 * Ensures responses are ready-to-send, legally appropriate, and properly structured.
 */

/**
 * Professional tone guidelines for all AI outputs
 */
const PROFESSIONAL_TONE_GUIDELINES = `
CRITICAL OUTPUT REQUIREMENTS:
- Write in professional adjuster/legal tone
- Avoid casual language, slang, or informal expressions
- Use precise, technical terminology appropriate for insurance claims
- Maintain respectful, assertive tone without being aggressive
- Produce ready-to-send content that requires minimal editing
- Include proper document structure (salutation, body, closing for letters)
- Cite policy language, regulations, or industry standards where applicable
- Avoid making absolute legal conclusions - use "appears to," "suggests," "indicates"
- Never use emojis, exclamation points (except in appropriate contexts), or casual punctuation
`;

/**
 * Letter-specific formatting requirements
 */
const LETTER_FORMAT_REQUIREMENTS = `
LETTER FORMAT REQUIREMENTS:
- Begin with proper salutation (e.g., "Dear [Name]," or "To Whom It May Concern:")
- Use structured paragraphs with clear topic sentences
- Include professional closing (e.g., "Sincerely," "Respectfully," "Best regards,")
- Add signature block placeholder: [Signature]\n[Insured Name]\n[Date]
- Use formal business letter conventions
- Maintain consistent tone throughout
`;

/**
 * Analysis-specific requirements
 */
const ANALYSIS_FORMAT_REQUIREMENTS = `
ANALYSIS FORMAT REQUIREMENTS:
- Begin with executive summary or key findings
- Use clear section headings
- Present findings in logical order
- Support conclusions with evidence or reasoning
- Include specific recommendations or next steps
- Use bullet points or numbered lists for clarity
- Maintain objective, analytical tone
`;

/**
 * Harden prompt for professional output
 * 
 * @param {string} basePrompt - Original prompt
 * @param {string} outputType - Type of output (letter, analysis, email, report, etc.)
 * @returns {string} Hardened prompt with professional guidelines
 */
export function hardenPrompt(basePrompt, outputType = 'analysis') {
  let hardenedPrompt = basePrompt;

  // Add professional tone guidelines to all prompts
  hardenedPrompt += `\n\n${PROFESSIONAL_TONE_GUIDELINES}`;

  // Add format-specific requirements
  switch (outputType.toLowerCase()) {
    case 'letter':
    case 'email':
      hardenedPrompt += `\n\n${LETTER_FORMAT_REQUIREMENTS}`;
      break;
    
    case 'analysis':
    case 'report':
    case 'review':
      hardenedPrompt += `\n\n${ANALYSIS_FORMAT_REQUIREMENTS}`;
      break;
  }

  // Add disclaimer requirement
  hardenedPrompt += `\n\nIMPORTANT: Do not include disclaimers in the output - they will be added automatically by the system.`;

  return hardenedPrompt;
}

/**
 * Create system message for claim-grade output
 */
export function getClaimGradeSystemMessage(outputType = 'analysis') {
  return {
    role: 'system',
    content: `You are a professional insurance claim analyst and documentation specialist. Your role is to produce claim-grade, professional outputs that can be used directly in insurance claim proceedings.

KEY PRINCIPLES:
1. Professional Tone: Write as an experienced adjuster or legal professional
2. Precision: Use specific, technical language appropriate for insurance claims
3. Evidence-Based: Support all conclusions with reasoning or evidence
4. Actionable: Provide clear recommendations and next steps
5. Ready-to-Send: Output should require minimal editing
6. Legally Appropriate: Avoid absolute legal conclusions; use qualifying language
7. Structured: Use proper formatting for ${outputType}s

OUTPUT TYPE: ${outputType.toUpperCase()}

${outputType === 'letter' || outputType === 'email' ? LETTER_FORMAT_REQUIREMENTS : ''}
${outputType === 'analysis' || outputType === 'report' ? ANALYSIS_FORMAT_REQUIREMENTS : ''}

${PROFESSIONAL_TONE_GUIDELINES}

Remember: This output will be saved to the claimant's permanent claim journal and may be submitted to insurance carriers, attorneys, or regulators. Quality and professionalism are paramount.`
  };
}

/**
 * Validate AI response for professional standards
 * 
 * @param {string} response - AI-generated response
 * @param {string} outputType - Expected output type
 * @returns {Object} Validation result with pass/fail and issues
 */
export function validateProfessionalOutput(response, outputType = 'analysis') {
  const issues = [];

  // Check for casual language
  const casualPhrases = [
    /\b(hey|hi there|yo|sup)\b/i,
    /\b(gonna|wanna|gotta)\b/i,
    /\b(awesome|cool|neat)\b/i,
    /😀|😊|👍|🎉/g, // Emojis
    /!{2,}/g, // Multiple exclamation points
  ];

  casualPhrases.forEach((pattern, index) => {
    if (pattern.test(response)) {
      issues.push(`Contains casual language or inappropriate punctuation (pattern ${index + 1})`);
    }
  });

  // Check for letter format requirements
  if (outputType === 'letter' || outputType === 'email') {
    if (!/^(Dear|To Whom)/i.test(response.trim())) {
      issues.push('Letter missing proper salutation');
    }
    if (!/\n(Sincerely|Respectfully|Best regards|Regards)/i.test(response)) {
      issues.push('Letter missing professional closing');
    }
  }

  // Check minimum length (professional outputs should be substantive)
  if (response.trim().length < 100) {
    issues.push('Response too short for professional output');
  }

  // Check for proper paragraph structure
  const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length < 2 && response.length > 200) {
    issues.push('Lacks proper paragraph structure');
  }

  return {
    pass: issues.length === 0,
    issues: issues,
    score: Math.max(0, 100 - (issues.length * 20))
  };
}

/**
 * Post-process AI response to ensure professional standards
 * 
 * @param {string} response - Raw AI response
 * @param {string} outputType - Output type
 * @returns {string} Cleaned and formatted response
 */
export function postProcessResponse(response, outputType = 'analysis') {
  let processed = response;

  // Remove any system-generated disclaimers (we add our own)
  processed = processed.replace(/\n*\*\*Disclaimer:.*$/is, '');
  processed = processed.replace(/\n*Note: This .*legal advice.*$/is, '');

  // Remove excessive whitespace
  processed = processed.replace(/\n{3,}/g, '\n\n');
  processed = processed.trim();

  // Ensure proper letter format if needed
  if (outputType === 'letter' || outputType === 'email') {
    // Ensure there's a blank line after salutation
    processed = processed.replace(/^(Dear [^,]+,)\n([^\n])/i, '$1\n\n$2');
    
    // Ensure there's a blank line before closing
    processed = processed.replace(/([^\n])\n(Sincerely|Respectfully|Best regards)/i, '$1\n\n$2');
  }

  return processed;
}

/**
 * Create enhanced prompt with claim context
 * 
 * @param {string} basePrompt - Base prompt
 * @param {Object} claimInfo - Claim context information
 * @param {string} outputType - Output type
 * @returns {string} Enhanced prompt with context
 */
export function enhancePromptWithContext(basePrompt, claimInfo = {}, outputType = 'analysis') {
  let enhanced = basePrompt;

  // Add claim context if available
  if (claimInfo && Object.keys(claimInfo).length > 0) {
    enhanced += '\n\nCLAIM CONTEXT:\n';
    
    if (claimInfo.insuredName) {
      enhanced += `- Insured: ${claimInfo.insuredName}\n`;
    }
    if (claimInfo.claimNumber) {
      enhanced += `- Claim Number: ${claimInfo.claimNumber}\n`;
    }
    if (claimInfo.carrier) {
      enhanced += `- Insurance Carrier: ${claimInfo.carrier}\n`;
    }
    if (claimInfo.dateOfLoss) {
      enhanced += `- Date of Loss: ${claimInfo.dateOfLoss}\n`;
    }
    if (claimInfo.policyNumber) {
      enhanced += `- Policy Number: ${claimInfo.policyNumber}\n`;
    }
  }

  // Harden with professional guidelines
  enhanced = hardenPrompt(enhanced, outputType);

  return enhanced;
}

/**
 * Wrap AI call with professional output enforcement
 * 
 * @param {Function} aiCallFunction - Function that calls OpenAI
 * @param {string} outputType - Expected output type
 * @returns {Function} Wrapped function with validation
 */
export function withProfessionalOutput(aiCallFunction, outputType = 'analysis') {
  return async (...args) => {
    // Call original AI function
    const response = await aiCallFunction(...args);

    // Validate response
    const validation = validateProfessionalOutput(response, outputType);
    
    if (!validation.pass) {
      console.warn('[PromptHardening] Quality issues detected:', validation.issues);
      // Log but don't fail - allow response through with warning
    }

    // Post-process response
    const processed = postProcessResponse(response, outputType);

    return processed;
  };
}



