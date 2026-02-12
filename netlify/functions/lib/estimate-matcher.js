/**
 * Estimate Matcher - Deterministic Line Item Matching Algorithm
 * Exact → Fuzzy → Category → Semantic (AI fallback only)
 */

/**
 * Match contractor and carrier line items
 * @param {Array} contractorItems - Parsed contractor line items
 * @param {Array} carrierItems - Parsed carrier line items
 * @returns {Array} Array of matches with confidence scores
 */
function matchLineItems(contractorItems, carrierItems) {
  const matches = [];
  const unmatchedContractor = [...contractorItems];
  const unmatchedCarrier = [...carrierItems];
  
  // Filter out totals/subtotals
  const contractorLines = contractorItems.filter(item => 
    !item.is_total && !item.is_subtotal && !item.is_tax
  );
  const carrierLines = carrierItems.filter(item => 
    !item.is_total && !item.is_subtotal && !item.is_tax
  );
  
  // Phase 1: Exact matches
  const exactMatches = findExactMatches(contractorLines, carrierLines);
  matches.push(...exactMatches);
  
  // Remove matched items
  removeMatchedItems(unmatchedContractor, exactMatches.map(m => m.contractor));
  removeMatchedItems(unmatchedCarrier, exactMatches.map(m => m.carrier));
  
  // Phase 2: Fuzzy matches (Levenshtein distance)
  const fuzzyMatches = findFuzzyMatches(
    unmatchedContractor.filter(i => !i.is_total && !i.is_subtotal),
    unmatchedCarrier.filter(i => !i.is_total && !i.is_subtotal)
  );
  matches.push(...fuzzyMatches);
  
  // Remove matched items
  removeMatchedItems(unmatchedContractor, fuzzyMatches.map(m => m.contractor));
  removeMatchedItems(unmatchedCarrier, fuzzyMatches.map(m => m.carrier));
  
  // Phase 3: Category + Unit matches
  const categoryMatches = findCategoryMatches(
    unmatchedContractor.filter(i => !i.is_total && !i.is_subtotal),
    unmatchedCarrier.filter(i => !i.is_total && !i.is_subtotal)
  );
  matches.push(...categoryMatches);
  
  // Remove matched items
  removeMatchedItems(unmatchedContractor, categoryMatches.map(m => m.contractor));
  removeMatchedItems(unmatchedCarrier, categoryMatches.map(m => m.carrier));
  
  return {
    matches,
    unmatchedContractor: unmatchedContractor.filter(i => !i.is_total && !i.is_subtotal),
    unmatchedCarrier: unmatchedCarrier.filter(i => !i.is_total && !i.is_subtotal),
    stats: {
      total_contractor: contractorLines.length,
      total_carrier: carrierLines.length,
      exact_matches: exactMatches.length,
      fuzzy_matches: fuzzyMatches.length,
      category_matches: categoryMatches.length,
      total_matched: matches.length,
      unmatched_contractor: unmatchedContractor.filter(i => !i.is_total && !i.is_subtotal).length,
      unmatched_carrier: unmatchedCarrier.filter(i => !i.is_total && !i.is_subtotal).length
    }
  };
}

/**
 * Phase 1: Find exact matches
 * Normalized description must match exactly
 */
function findExactMatches(contractorItems, carrierItems) {
  const matches = [];
  
  for (const cItem of contractorItems) {
    const exactMatch = carrierItems.find(caItem => 
      caItem.description_normalized === cItem.description_normalized &&
      !caItem._matched
    );
    
    if (exactMatch) {
      matches.push({
        contractor: cItem,
        carrier: exactMatch,
        match_method: 'exact',
        match_confidence: 1.00
      });
      exactMatch._matched = true;
      cItem._matched = true;
    }
  }
  
  return matches;
}

/**
 * Phase 2: Find fuzzy matches using Levenshtein distance
 * Threshold: 85% similarity
 */
function findFuzzyMatches(contractorItems, carrierItems) {
  const matches = [];
  const threshold = 0.85;
  
  for (const cItem of contractorItems) {
    if (cItem._matched) continue;
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const caItem of carrierItems) {
      if (caItem._matched) continue;
      
      const similarity = calculateSimilarity(
        cItem.description_normalized,
        caItem.description_normalized
      );
      
      if (similarity >= threshold && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = caItem;
      }
    }
    
    if (bestMatch) {
      matches.push({
        contractor: cItem,
        carrier: bestMatch,
        match_method: 'fuzzy',
        match_confidence: parseFloat(bestScore.toFixed(2))
      });
      bestMatch._matched = true;
      cItem._matched = true;
    }
  }
  
  return matches;
}

/**
 * Phase 3: Find category + unit matches
 * Same category, same unit, similar quantity
 */
function findCategoryMatches(contractorItems, carrierItems) {
  const matches = [];
  
  for (const cItem of contractorItems) {
    if (cItem._matched) continue;
    
    const candidates = carrierItems.filter(caItem => 
      !caItem._matched &&
      caItem.category === cItem.category &&
      caItem.unit === cItem.unit
    );
    
    if (candidates.length === 0) continue;
    
    // Find best match by quantity similarity
    let bestMatch = null;
    let bestScore = 0;
    
    for (const candidate of candidates) {
      const qtyRatio = Math.min(cItem.quantity, candidate.quantity) / 
                       Math.max(cItem.quantity, candidate.quantity);
      
      if (qtyRatio >= 0.7 && qtyRatio > bestScore) {
        bestScore = qtyRatio;
        bestMatch = candidate;
      }
    }
    
    if (bestMatch) {
      matches.push({
        contractor: cItem,
        carrier: bestMatch,
        match_method: 'category',
        match_confidence: parseFloat((bestScore * 0.75).toFixed(2)) // Max 0.75 for category matches
      });
      bestMatch._matched = true;
      cItem._matched = true;
    }
  }
  
  return matches;
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns value between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Remove matched items from array
 */
function removeMatchedItems(array, matchedItems) {
  for (const item of matchedItems) {
    const index = array.findIndex(i => i.line_number === item.line_number);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
}

/**
 * AI Semantic Matching (fallback only) WITH DECISION TRACE LOGGING
 * Only called for unmatched items after deterministic attempts
 */
async function semanticMatch(unmatchedContractor, unmatchedCarrier, openaiClient) {
  if (unmatchedContractor.length === 0 || unmatchedCarrier.length === 0) {
    return { matches: [], traces: [] };
  }
  
  // Limit to top 20 unmatched items to avoid token limits
  const contractorSubset = unmatchedContractor.slice(0, 20);
  const carrierSubset = unmatchedCarrier.slice(0, 20);
  
  const prompt = buildSemanticMatchPrompt(contractorSubset, carrierSubset);
  const traces = []; // Store AI decision traces
  
  try {
    const startTime = Date.now();
    
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a construction estimate matching expert. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const processingTime = Date.now() - startTime;
    const response = JSON.parse(completion.choices[0].message.content);
    
    // Convert AI matches to standard format
    const matches = [];
    for (const match of response.matches || []) {
      const contractor = contractorSubset.find(i => i.line_number === match.contractor_line);
      const carrier = carrierSubset.find(i => i.line_number === match.carrier_line);
      
      if (contractor && carrier && match.confidence >= 0.6) {
        matches.push({
          contractor,
          carrier,
          match_method: 'semantic',
          match_confidence: match.confidence
        });
        
        // LOG AI DECISION TRACE
        traces.push({
          timestamp: new Date().toISOString(),
          match_type: 'semantic',
          contractor_line: contractor.line_number,
          contractor_description: contractor.description,
          carrier_line: carrier.line_number,
          carrier_description: carrier.description,
          ai_confidence: match.confidence,
          ai_reason: match.reason || 'No reason provided',
          ai_model: 'gpt-4-turbo-preview',
          processing_time_ms: processingTime,
          prompt_tokens: completion.usage?.prompt_tokens || null,
          completion_tokens: completion.usage?.completion_tokens || null,
          total_tokens: completion.usage?.total_tokens || null,
          raw_ai_response: match // Store full AI response for audit
        });
      }
    }
    
    return { matches, traces };
  } catch (error) {
    console.error('Semantic matching failed:', error);
    
    // Log error trace
    traces.push({
      timestamp: new Date().toISOString(),
      match_type: 'semantic',
      error: error.message,
      ai_model: 'gpt-4-turbo-preview',
      status: 'failed'
    });
    
    return { matches: [], traces };
  }
}

/**
 * Build prompt for AI semantic matching
 */
function buildSemanticMatchPrompt(contractorItems, carrierItems) {
  return `Match these unmatched line items semantically.

CONTRACTOR ITEMS:
${contractorItems.map(i => `Line ${i.line_number}: ${i.description} (${i.quantity} ${i.unit} @ $${i.unit_price})`).join('\n')}

CARRIER ITEMS:
${carrierItems.map(i => `Line ${i.line_number}: ${i.description} (${i.quantity} ${i.unit} @ $${i.unit_price})`).join('\n')}

Return JSON with possible matches:
{
  "matches": [
    {
      "contractor_line": number,
      "carrier_line": number,
      "confidence": 0.0-1.0,
      "reason": "why these match"
    }
  ]
}

Only include matches with confidence >= 0.6.`;
}

module.exports = {
  matchLineItems,
  semanticMatch,
  calculateSimilarity,
  levenshteinDistance
};
