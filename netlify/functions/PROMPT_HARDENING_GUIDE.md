# Backend AI Prompt Hardening Guide — Phase 5A

## Overview

All AI backend functions must now enforce claim-grade, professional output through prompt hardening. This ensures every AI-generated response is ready-to-send, legally appropriate, and properly structured.

## What Changed

### Before Phase 5A
- AI prompts were basic and varied in quality
- No standardized professional tone enforcement
- No output validation
- Inconsistent formatting across tools

### After Phase 5A
- All prompts hardened with professional guidelines
- Mandatory output validation
- Standardized formatting requirements
- Claim-grade output guaranteed

## How to Update Backend Functions

### Step 1: Import Prompt Hardening Utility

```javascript
const { 
  hardenPrompt, 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');
```

### Step 2: Update System Prompt

**Before:**
```javascript
const systemPrompt = `You are a professional insurance claim advocate...`;
```

**After:**
```javascript
const systemMessage = getClaimGradeSystemMessage('letter'); // or 'analysis', 'report', etc.
```

### Step 3: Harden User Prompt

**Before:**
```javascript
const userPrompt = `Analyze the following...`;
```

**After:**
```javascript
let userPrompt = `Analyze the following...`;
userPrompt = enhancePromptWithContext(userPrompt, body.claimInfo || {}, 'letter');
```

### Step 4: Post-Process Response

**Before:**
```javascript
const response = await runOpenAI(systemPrompt, userPrompt, options);
return response;
```

**After:**
```javascript
const rawResponse = await runOpenAI(systemMessage.content, userPrompt, options);
const processedResponse = postProcessResponse(rawResponse, 'letter');
const validation = validateProfessionalOutput(processedResponse, 'letter');

if (!validation.pass) {
  console.warn('[AI Function] Quality issues:', validation.issues);
}

return processedResponse;
```

## Complete Example: ai-response-agent.js

```javascript
/**
 * AI Response Agent Function (PHASE 5A - Hardened)
 * Generates professional response letters to insurer communications
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');

exports.handler = async (event) => {
  // ... auth and validation code ...

  const {
    claim_type = 'general',
    insurer_name = '',
    denial_letter_text,
    tone = 'professional',
    claimInfo = {} // NEW: Claim context from frontend
  } = body;

  // Sanitize inputs
  const sanitizedText = sanitizeInput(denial_letter_text);
  const sanitizedInsurer = sanitizeInput(insurer_name);

  // PHASE 5A: Use claim-grade system message
  const systemMessage = getClaimGradeSystemMessage('letter');

  // Build user prompt
  let userPrompt = `Analyze the following insurer correspondence and draft a ${tone} response letter.

Insurer: ${sanitizedInsurer}
Claim Type: ${claim_type}

Insurer Correspondence:
${sanitizedText}

Please provide:
1. A professional subject line
2. A complete response letter body addressing all points
3. Three recommended next steps

Format your response as JSON:
{
  "subject": "Subject line here",
  "body": "Complete letter body here",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;

  // PHASE 5A: Enhance with claim context and harden
  userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'letter');

  // Call OpenAI
  const rawResponse = await runOpenAI(systemMessage.content, userPrompt, {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2000
  });

  // Parse JSON response
  let result;
  try {
    result = JSON.parse(rawResponse);
  } catch (e) {
    result = {
      subject: extractSubject(rawResponse),
      body: rawResponse,
      next_steps: []
    };
  }

  // PHASE 5A: Post-process and validate
  result.body = postProcessResponse(result.body, 'letter');
  const validation = validateProfessionalOutput(result.body, 'letter');

  if (!validation.pass) {
    console.warn('[ai-response-agent] Quality issues detected:', validation.issues);
    await LOG_EVENT('quality_warning', 'ai-response-agent', {
      issues: validation.issues,
      score: validation.score
    });
  }

  // Return result
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result,
      metadata: {
        quality_score: validation.score,
        validation_passed: validation.pass
      },
      error: null
    })
  };
};
```

## Output Types and Their Requirements

### 1. LETTER / EMAIL
- Must include salutation
- Must include closing and signature block
- Structured paragraphs
- Professional business tone
- Ready to send

### 2. ANALYSIS / REPORT
- Executive summary or key findings
- Clear section headings
- Logical organization
- Evidence-based conclusions
- Specific recommendations

### 3. CHECKLIST
- Clear, actionable items
- Logical grouping
- Priority indicators where appropriate
- Completion criteria

### 4. STRATEGY
- Situation assessment
- Multiple options with pros/cons
- Recommended approach
- Implementation steps
- Risk considerations

## Functions That Must Be Updated

### Priority 1 (User-Facing AI Tools)
1. ✅ `ai-response-agent.js` - Response letters
2. ⏳ `ai-document-generator.js` - All document types
3. ⏳ `ai-policy-review.js` - Policy analysis
4. ⏳ `ai-estimate-comparison.js` - Estimate reviews
5. ⏳ `ai-rom-estimator.js` - ROM calculations
6. ⏳ `ai-damage-assessment.js` - Damage reports
7. ⏳ `ai-negotiation-advisor.js` - Negotiation strategies

### Priority 2 (Supporting Tools)
8. ⏳ `ai-coverage-decoder.js` - Coverage analysis
9. ⏳ `ai-expert-opinion.js` - Expert opinions
10. ⏳ `ai-business-interruption.js` - BI calculations
11. ⏳ `ai-situational-advisory.js` - Advisory responses

### Priority 3 (Internal Tools)
12. ⏳ `ai-evidence-auto-tagger.js` - Evidence tagging
13. ⏳ `ai-categorize-evidence.js` - Evidence categorization
14. ⏳ `ai-timeline-analyzer.js` - Timeline analysis

## Testing Checklist

For each updated function:

- [ ] Import prompt hardening utilities
- [ ] Replace system prompt with `getClaimGradeSystemMessage()`
- [ ] Enhance user prompt with `enhancePromptWithContext()`
- [ ] Post-process response with `postProcessResponse()`
- [ ] Validate output with `validateProfessionalOutput()`
- [ ] Test with sample inputs
- [ ] Verify output is claim-grade
- [ ] Confirm proper formatting
- [ ] Check professional tone
- [ ] Validate structure (salutation, closing for letters)

## Quality Standards

All AI outputs must meet these standards:

1. **Professional Tone** - No casual language, slang, or emojis
2. **Proper Structure** - Appropriate formatting for output type
3. **Ready-to-Send** - Minimal editing required
4. **Legally Appropriate** - Qualifying language, no absolute conclusions
5. **Evidence-Based** - Support claims with reasoning
6. **Actionable** - Clear next steps or recommendations
7. **Complete** - All required elements present

## Validation Scoring

- **100 points** - Perfect, claim-grade output
- **80-99 points** - Good, minor issues
- **60-79 points** - Acceptable, needs review
- **< 60 points** - Needs improvement, log warning

## Logging and Monitoring

All quality warnings are logged:

```javascript
await LOG_EVENT('quality_warning', 'function-name', {
  issues: validation.issues,
  score: validation.score,
  user_id: user.id
});
```

Monitor these logs to identify:
- Functions that need prompt tuning
- Common quality issues
- Model performance trends

## Next Steps

1. Update all Priority 1 functions immediately
2. Test each function with real claim data
3. Monitor quality scores
4. Iterate on prompts based on feedback
5. Update Priority 2 and 3 functions
6. Document any edge cases or special handling

## Support

For questions or issues:
- Review `netlify/functions/utils/prompt-hardening.js`
- Check validation error messages
- Test with sample inputs
- Adjust prompts as needed

---

**Phase 5A Status:** In Progress  
**Last Updated:** January 6, 2026  
**Priority:** CRITICAL - All user-facing AI tools must be updated



