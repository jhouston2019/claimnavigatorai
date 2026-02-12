/**
 * Policy Form Detection Engine
 * Detects ISO form numbers and policy types
 * NO SUMMARIES - STRUCTURED DATA ONLY
 */

/**
 * Detect policy forms and type
 * @param {string} policyText - Normalized policy text
 * @returns {object} Form detection results
 */
function detectPolicyForms(policyText) {
  const formNumbers = extractFormNumbers(policyText);
  const policyType = determinePolicyType(formNumbers, policyText);
  
  return {
    policy_type: policyType,
    form_numbers: formNumbers,
    primary_form: formNumbers[0] || null
  };
}

/**
 * Extract ISO form numbers
 * Pattern: [A-Z]{2} \d{2} \d{2}
 * Examples: HO 00 03, CP 00 10, DP 00 03
 */
function extractFormNumbers(text) {
  const formNumbers = [];
  
  // Pattern 1: Standard ISO format (HO 00 03)
  const pattern1 = /\b([A-Z]{2})\s?(\d{2})\s?(\d{2})\b/g;
  let match;
  
  while ((match = pattern1.exec(text)) !== null) {
    const formNumber = `${match[1]} ${match[2]} ${match[3]}`;
    
    // Only include valid insurance form prefixes
    if (isValidFormPrefix(match[1])) {
      if (!formNumbers.includes(formNumber)) {
        formNumbers.push(formNumber);
      }
    }
  }
  
  return formNumbers;
}

/**
 * Check if form prefix is valid insurance form
 */
function isValidFormPrefix(prefix) {
  const validPrefixes = [
    'HO', // Homeowners
    'DP', // Dwelling Property
    'CP', // Commercial Property
    'BP', // Businessowners
    'CG', // Commercial General Liability
    'CA', // Commercial Auto
    'IL', // Inland Marine
    'CR', // Crime
    'DS', // Difference in Conditions
    'MH', // Mobile Home
    'PP', // Personal Property
    'IM'  // Installation Floater
  ];
  
  return validPrefixes.includes(prefix);
}

/**
 * Determine policy type from form numbers
 */
function determinePolicyType(formNumbers, text) {
  // Check form numbers first
  for (const form of formNumbers) {
    const prefix = form.substring(0, 2);
    
    switch (prefix) {
      case 'HO':
        return 'HO';
      case 'DP':
        return 'DP';
      case 'CP':
        return 'CP';
      case 'BP':
        return 'BOP';
    }
  }
  
  // Fallback: Check text for policy type indicators
  if (/homeowner|ho-?3|ho-?5/i.test(text)) {
    return 'HO';
  }
  
  if (/dwelling\s+property|dp-?3/i.test(text)) {
    return 'DP';
  }
  
  if (/commercial\s+property|building\s+and\s+personal\s+property\s+coverage/i.test(text)) {
    return 'CP';
  }
  
  if (/businessowners|business\s+owners|bop/i.test(text)) {
    return 'BOP';
  }
  
  return 'OTHER';
}

/**
 * Get policy type description
 */
function getPolicyTypeDescription(policyType) {
  const descriptions = {
    'HO': 'Homeowners Policy',
    'DP': 'Dwelling Property Policy',
    'CP': 'Commercial Property Policy',
    'BOP': 'Businessowners Policy',
    'OTHER': 'Other Policy Type'
  };
  
  return descriptions[policyType] || 'Unknown';
}

/**
 * Detect specific form variants
 */
function detectFormVariants(formNumbers) {
  const variants = {
    ho3: formNumbers.some(f => f.includes('HO 00 03')),
    ho5: formNumbers.some(f => f.includes('HO 00 05')),
    dp3: formNumbers.some(f => f.includes('DP 00 03')),
    cp0010: formNumbers.some(f => f.includes('CP 00 10')),
    cp1030: formNumbers.some(f => f.includes('CP 10 30')),
    bp0003: formNumbers.some(f => f.includes('BP 00 03'))
  };
  
  return variants;
}

/**
 * Determine coverage basis from form
 */
function determineCoverageBasis(formNumbers, text) {
  const variants = detectFormVariants(formNumbers);
  
  // HO-3 and HO-5 are open peril for dwelling
  if (variants.ho3 || variants.ho5) {
    return 'open_peril';
  }
  
  // DP-3 is open peril
  if (variants.dp3) {
    return 'open_peril';
  }
  
  // CP 00 10 is special form (open peril for building)
  if (variants.cp0010) {
    return 'special_form';
  }
  
  // CP 10 30 is causes of loss - special form
  if (variants.cp1030) {
    return 'special_form';
  }
  
  // Check text for coverage basis
  if (/special\s+form|open\s+peril|all\s+risk/i.test(text)) {
    return 'open_peril';
  }
  
  if (/broad\s+form/i.test(text)) {
    return 'broad_form';
  }
  
  if (/basic\s+form|named\s+peril/i.test(text)) {
    return 'named_peril';
  }
  
  return null;
}

module.exports = {
  detectPolicyForms,
  extractFormNumbers,
  determinePolicyType,
  getPolicyTypeDescription,
  detectFormVariants,
  determineCoverageBasis
};
