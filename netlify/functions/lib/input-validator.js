/**
 * Structured Input Enforcement and Validation
 * Enforces structured input formats for estimates and policies
 * Reduces AI hallucination risk and improves analysis precision
 */

/**
 * Validate estimate structure
 */
function validateEstimateStructure(estimateText) {
  const validation = {
    valid: false,
    errors: [],
    warnings: [],
    quality_score: 0,
    structure: {
      has_line_items: false,
      has_quantities: false,
      has_unit_prices: false,
      has_totals: false,
      has_categories: false,
      has_grand_total: false,
      line_item_count: 0,
      format_type: 'unknown'
    }
  };
  
  if (!estimateText || estimateText.trim().length < 50) {
    validation.errors.push('Estimate text is too short or empty');
    return validation;
  }
  
  // Check for line items with quantities and prices
  const lineItemPatterns = [
    /\d+\s+(SF|SQ|LF|FT|EA|PC|HR|CY|SY)\s+[@$]\s*\$?\d+\.?\d*/gi,
    /\$\d+\.?\d*\s+\d+\s+(SF|SQ|LF|FT|EA|PC|HR|CY|SY)/gi,
    /.+\s+\d+\.?\d+\s+(SF|SQ|LF|FT|EA|PC|HR|CY|SY)\s+\$\d+\.?\d+\s+\$\d+\.?\d+/gi
  ];
  
  let lineItemMatches = 0;
  for (const pattern of lineItemPatterns) {
    const matches = estimateText.match(pattern);
    if (matches) {
      lineItemMatches += matches.length;
    }
  }
  
  validation.structure.line_item_count = lineItemMatches;
  validation.structure.has_line_items = lineItemMatches > 0;
  
  // Check for quantities
  const quantityPattern = /\d+\.?\d*\s+(SF|SQ|LF|FT|EA|PC|HR|CY|SY)/gi;
  validation.structure.has_quantities = quantityPattern.test(estimateText);
  
  // Check for prices
  const pricePattern = /\$\d+\.?\d+/g;
  const priceMatches = estimateText.match(pricePattern);
  validation.structure.has_unit_prices = priceMatches && priceMatches.length >= 3;
  
  // Check for totals
  const totalPattern = /(total|subtotal|grand total):\s*\$\d+\.?\d+/gi;
  validation.structure.has_totals = totalPattern.test(estimateText);
  
  // Check for grand total
  const grandTotalPattern = /(grand total|total amount|total cost):\s*\$\d+\.?\d+/gi;
  validation.structure.has_grand_total = grandTotalPattern.test(estimateText);
  
  // Check for categories/sections
  const categoryKeywords = ['roofing', 'siding', 'interior', 'exterior', 'plumbing', 'electrical', 'hvac', 'flooring', 'framing'];
  validation.structure.has_categories = categoryKeywords.some(kw => 
    estimateText.toLowerCase().includes(kw)
  );
  
  // Determine format type
  if (estimateText.includes('\t')) {
    validation.structure.format_type = 'tabular';
  } else if (/RCV|ACV|O&P/i.test(estimateText)) {
    validation.structure.format_type = 'xactimate';
  } else if (lineItemMatches > 0) {
    validation.structure.format_type = 'standard';
  }
  
  // Calculate quality score
  let score = 0;
  if (validation.structure.has_line_items) score += 30;
  if (validation.structure.has_quantities) score += 20;
  if (validation.structure.has_unit_prices) score += 20;
  if (validation.structure.has_totals) score += 10;
  if (validation.structure.has_categories) score += 10;
  if (validation.structure.has_grand_total) score += 10;
  
  validation.quality_score = score;
  
  // Generate errors and warnings
  if (!validation.structure.has_line_items) {
    validation.errors.push('No structured line items detected. Estimate must contain line items with descriptions, quantities, and prices.');
  }
  
  if (!validation.structure.has_quantities) {
    validation.warnings.push('Quantities not clearly identified. Analysis accuracy may be reduced.');
  }
  
  if (!validation.structure.has_unit_prices) {
    validation.warnings.push('Unit prices not clearly identified. Pricing validation will be limited.');
  }
  
  if (!validation.structure.has_grand_total) {
    validation.warnings.push('Grand total not found. Financial reconciliation may be incomplete.');
  }
  
  if (validation.structure.line_item_count < 5) {
    validation.warnings.push(`Only ${validation.structure.line_item_count} line items detected. Estimate may be incomplete or poorly formatted.`);
  }
  
  // Determine if valid
  validation.valid = validation.errors.length === 0 && validation.quality_score >= 50;
  
  return validation;
}

/**
 * Validate policy structure
 */
function validatePolicyStructure(policyText) {
  const validation = {
    valid: false,
    errors: [],
    warnings: [],
    quality_score: 0,
    structure: {
      has_declarations_page: false,
      has_coverage_limits: false,
      has_deductible: false,
      has_endorsements: false,
      has_form_numbers: false,
      has_policy_number: false,
      has_insured_name: false,
      has_property_address: false,
      policy_type: 'unknown',
      form_numbers: []
    }
  };
  
  if (!policyText || policyText.trim().length < 100) {
    validation.errors.push('Policy text is too short or empty');
    return validation;
  }
  
  // Check for declarations page indicators
  const declarationsKeywords = ['declarations', 'dec page', 'policy declarations', 'coverage summary'];
  validation.structure.has_declarations_page = declarationsKeywords.some(kw => 
    policyText.toLowerCase().includes(kw)
  );
  
  // Check for coverage limits
  const coveragePattern = /(coverage [a-d]|dwelling|contents|personal property|loss of use|ale):\s*\$\d+/gi;
  const coverageMatches = policyText.match(coveragePattern);
  validation.structure.has_coverage_limits = coverageMatches && coverageMatches.length >= 2;
  
  // Check for deductible
  const deductiblePattern = /deductible:\s*\$\d+/gi;
  validation.structure.has_deductible = deductiblePattern.test(policyText);
  
  // Check for endorsements
  const endorsementKeywords = ['endorsement', 'rider', 'amendment', 'special provisions'];
  validation.structure.has_endorsements = endorsementKeywords.some(kw => 
    policyText.toLowerCase().includes(kw)
  );
  
  // Check for form numbers
  const formPattern = /(HO|DP|CP|BP)\s*\d{2}\s*\d{2}/gi;
  const formMatches = policyText.match(formPattern);
  validation.structure.has_form_numbers = formMatches && formMatches.length > 0;
  if (formMatches) {
    validation.structure.form_numbers = formMatches;
  }
  
  // Check for policy number
  const policyNumberPattern = /policy\s*(number|#):\s*[\w\d-]+/gi;
  validation.structure.has_policy_number = policyNumberPattern.test(policyText);
  
  // Check for insured name
  const insuredPattern = /(named insured|insured name|policyholder):/gi;
  validation.structure.has_insured_name = insuredPattern.test(policyText);
  
  // Check for property address
  const addressPattern = /(property address|location|premises):/gi;
  validation.structure.has_property_address = addressPattern.test(policyText);
  
  // Determine policy type
  if (formMatches) {
    const firstForm = formMatches[0].toUpperCase();
    if (firstForm.startsWith('HO')) {
      validation.structure.policy_type = 'homeowners';
    } else if (firstForm.startsWith('DP')) {
      validation.structure.policy_type = 'dwelling';
    } else if (firstForm.startsWith('CP')) {
      validation.structure.policy_type = 'commercial_property';
    } else if (firstForm.startsWith('BP')) {
      validation.structure.policy_type = 'businessowners';
    }
  }
  
  // Calculate quality score
  let score = 0;
  if (validation.structure.has_declarations_page) score += 15;
  if (validation.structure.has_coverage_limits) score += 25;
  if (validation.structure.has_deductible) score += 15;
  if (validation.structure.has_endorsements) score += 10;
  if (validation.structure.has_form_numbers) score += 15;
  if (validation.structure.has_policy_number) score += 10;
  if (validation.structure.has_insured_name) score += 5;
  if (validation.structure.has_property_address) score += 5;
  
  validation.quality_score = score;
  
  // Generate errors and warnings
  if (!validation.structure.has_coverage_limits) {
    validation.errors.push('No coverage limits detected. Policy must include Coverage A, B, C, D limits or Building/BPP limits.');
  }
  
  if (!validation.structure.has_deductible) {
    validation.warnings.push('Deductible not clearly identified. Analysis may be incomplete.');
  }
  
  if (!validation.structure.has_form_numbers) {
    validation.warnings.push('Policy form numbers not detected. Policy type identification may be inaccurate.');
  }
  
  if (!validation.structure.has_declarations_page) {
    validation.warnings.push('Declarations page not clearly identified. Ensure you have uploaded the complete policy including declarations.');
  }
  
  if (validation.structure.policy_type === 'unknown') {
    validation.warnings.push('Policy type could not be determined. Analysis may use generic assumptions.');
  }
  
  // Determine if valid
  validation.valid = validation.errors.length === 0 && validation.quality_score >= 40;
  
  return validation;
}

/**
 * Validate line item structure
 */
function validateLineItemStructure(lineItem) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Required fields
  if (!lineItem.description || lineItem.description.trim().length === 0) {
    validation.errors.push('Description is required');
    validation.valid = false;
  }
  
  if (lineItem.quantity === undefined || lineItem.quantity === null) {
    validation.errors.push('Quantity is required');
    validation.valid = false;
  }
  
  if (!lineItem.unit || lineItem.unit.trim().length === 0) {
    validation.errors.push('Unit is required');
    validation.valid = false;
  }
  
  if (lineItem.unit_price === undefined || lineItem.unit_price === null) {
    validation.errors.push('Unit price is required');
    validation.valid = false;
  }
  
  if (lineItem.total === undefined || lineItem.total === null) {
    validation.errors.push('Total is required');
    validation.valid = false;
  }
  
  // Validate numeric fields
  if (lineItem.quantity < 0) {
    validation.errors.push('Quantity cannot be negative');
    validation.valid = false;
  }
  
  if (lineItem.unit_price < 0) {
    validation.errors.push('Unit price cannot be negative');
    validation.valid = false;
  }
  
  if (lineItem.total < 0) {
    validation.errors.push('Total cannot be negative');
    validation.valid = false;
  }
  
  // Validate math
  const expectedTotal = lineItem.quantity * lineItem.unit_price;
  const tolerance = Math.max(expectedTotal * 0.01, 0.01);
  
  if (Math.abs(lineItem.total - expectedTotal) > tolerance) {
    validation.warnings.push(`Math validation failed: ${lineItem.quantity} × $${lineItem.unit_price} should equal $${expectedTotal.toFixed(2)}, but total is $${lineItem.total.toFixed(2)}`);
  }
  
  // Validate unit
  const validUnits = ['SF', 'SQ', 'LF', 'FT', 'EA', 'PC', 'HR', 'CY', 'SY', 'LS', 'LOT', 'DAY'];
  if (!validUnits.includes(lineItem.unit.toUpperCase())) {
    validation.warnings.push(`Non-standard unit: ${lineItem.unit}. Standard units are: ${validUnits.join(', ')}`);
  }
  
  return validation;
}

/**
 * Validate policy coverage data
 */
function validatePolicyCoverageData(coverageData) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    completeness_score: 0
  };
  
  // Required fields for residential
  if (coverageData.policy_type === 'HO' || coverageData.policy_type === 'DP') {
    if (!coverageData.dwelling_limit || coverageData.dwelling_limit <= 0) {
      validation.errors.push('Dwelling limit (Coverage A) is required for homeowners/dwelling policies');
      validation.valid = false;
    } else {
      validation.completeness_score += 25;
    }
    
    if (coverageData.contents_limit && coverageData.contents_limit > 0) {
      validation.completeness_score += 15;
    } else {
      validation.warnings.push('Contents limit (Coverage C) not specified');
    }
    
    if (coverageData.ale_limit && coverageData.ale_limit > 0) {
      validation.completeness_score += 10;
    } else {
      validation.warnings.push('ALE limit (Coverage D) not specified');
    }
  }
  
  // Required fields for commercial
  if (coverageData.policy_type === 'CP' || coverageData.policy_type === 'BOP') {
    if (!coverageData.building_limit || coverageData.building_limit <= 0) {
      validation.errors.push('Building limit is required for commercial property policies');
      validation.valid = false;
    } else {
      validation.completeness_score += 25;
    }
    
    if (coverageData.business_personal_property_limit && coverageData.business_personal_property_limit > 0) {
      validation.completeness_score += 15;
    }
  }
  
  // Deductible validation
  if (!coverageData.deductible || coverageData.deductible <= 0) {
    validation.warnings.push('Deductible not specified or invalid');
  } else {
    validation.completeness_score += 15;
  }
  
  // Settlement type validation
  if (!coverageData.settlement_type || !['ACV', 'RCV', 'MIXED'].includes(coverageData.settlement_type)) {
    validation.warnings.push('Settlement type not specified or invalid. Should be ACV, RCV, or MIXED.');
  } else {
    validation.completeness_score += 15;
  }
  
  // Coinsurance validation for commercial
  if (coverageData.policy_type === 'CP' || coverageData.policy_type === 'BOP') {
    if (coverageData.coinsurance_percent && (coverageData.coinsurance_percent < 0 || coverageData.coinsurance_percent > 100)) {
      validation.errors.push('Coinsurance percent must be between 0 and 100');
      validation.valid = false;
    }
    
    if (coverageData.coinsurance_percent > 0) {
      validation.completeness_score += 10;
    }
  }
  
  // Ordinance & Law validation
  if (coverageData.ordinance_law_percent) {
    if (coverageData.ordinance_law_percent < 0 || coverageData.ordinance_law_percent > 100) {
      validation.errors.push('Ordinance & Law percent must be between 0 and 100');
      validation.valid = false;
    } else {
      validation.completeness_score += 10;
    }
  }
  
  return validation;
}

/**
 * Extract structured data from estimate with validation
 */
function extractStructuredEstimate(estimateText) {
  const validation = validateEstimateStructure(estimateText);
  
  if (!validation.valid) {
    return {
      success: false,
      validation,
      data: null
    };
  }
  
  return {
    success: true,
    validation,
    data: {
      text: estimateText,
      format_type: validation.structure.format_type,
      line_item_count: validation.structure.line_item_count,
      quality_score: validation.quality_score
    }
  };
}

/**
 * Generate input quality report
 */
function generateInputQualityReport(estimateValidation, policyValidation) {
  const report = {
    estimate: {
      quality_score: estimateValidation?.quality_score || 0,
      valid: estimateValidation?.valid || false,
      errors: estimateValidation?.errors || [],
      warnings: estimateValidation?.warnings || [],
      structure: estimateValidation?.structure || {}
    },
    policy: {
      quality_score: policyValidation?.completeness_score || 0,
      valid: policyValidation?.valid || false,
      errors: policyValidation?.errors || [],
      warnings: policyValidation?.warnings || []
    },
    overall_quality: 'unknown',
    recommendations: []
  };
  
  // Calculate overall quality
  const avgScore = (report.estimate.quality_score + report.policy.quality_score) / 2;
  
  if (avgScore >= 80) {
    report.overall_quality = 'excellent';
  } else if (avgScore >= 60) {
    report.overall_quality = 'good';
  } else if (avgScore >= 40) {
    report.overall_quality = 'fair';
  } else {
    report.overall_quality = 'poor';
  }
  
  // Generate recommendations
  if (report.estimate.quality_score < 50) {
    report.recommendations.push({
      priority: 'high',
      category: 'input_quality',
      title: 'Estimate Format Quality Issue',
      description: 'Estimate does not contain clearly structured line items',
      action: 'Request contractor provide estimate in standard format with line items, quantities, unit prices, and totals',
      impact: 'Analysis accuracy will be significantly reduced with poor input quality'
    });
  }
  
  if (report.policy.quality_score < 40) {
    report.recommendations.push({
      priority: 'high',
      category: 'input_quality',
      title: 'Policy Document Incomplete',
      description: 'Policy document missing critical information',
      action: 'Ensure you have uploaded the complete policy including declarations page and all endorsements',
      impact: 'Policy analysis will be incomplete without full policy documentation'
    });
  }
  
  if (report.estimate.warnings.length > 0 || report.policy.warnings.length > 0) {
    report.recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      title: 'Input Quality Warnings',
      description: `${report.estimate.warnings.length + report.policy.warnings.length} warnings detected in input documents`,
      action: 'Review warnings and consider providing higher-quality source documents for improved analysis',
      impact: 'Some analysis features may be limited due to input quality issues'
    });
  }
  
  return report;
}

/**
 * Enforce minimum input requirements
 */
function enforceMinimumRequirements(estimateText, policyText) {
  const errors = [];
  
  // Estimate requirements
  if (!estimateText || estimateText.trim().length < 50) {
    errors.push({
      field: 'estimate',
      message: 'Estimate text is required and must be at least 50 characters',
      code: 'ESTIMATE_REQUIRED'
    });
  }
  
  // Policy requirements
  if (!policyText || policyText.trim().length < 100) {
    errors.push({
      field: 'policy',
      message: 'Policy text is required and must be at least 100 characters',
      code: 'POLICY_REQUIRED'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate file upload
 */
function validateFileUpload(file, fileType) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Check file size
  const maxSize = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSize) {
    validation.errors.push(`File size exceeds maximum of 15MB`);
    validation.valid = false;
  }
  
  // Check file type
  const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    validation.errors.push(`File type ${file.type} not supported. Allowed types: PDF, TXT, DOC, DOCX`);
    validation.valid = false;
  }
  
  // Check file name
  if (file.name.length > 255) {
    validation.warnings.push('File name is very long. Consider using a shorter name.');
  }
  
  return validation;
}

/**
 * Sanitize input text
 */
function sanitizeInput(text) {
  if (!text) return '';
  
  // Remove potentially malicious content
  let sanitized = text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Normalize whitespace
  sanitized = sanitized
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .trim();
  
  return sanitized;
}

/**
 * Validate claim context data
 */
function validateClaimContext(claimData) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Validate claim_id
  if (!claimData.claim_id) {
    validation.errors.push('claim_id is required');
    validation.valid = false;
  }
  
  // Validate state (for geo-pricing)
  if (!claimData.state) {
    validation.warnings.push('State not provided. Geographic pricing adjustments will use default rates.');
  }
  
  // Validate loss date
  if (!claimData.date_of_loss) {
    validation.warnings.push('Date of loss not provided. Age-based depreciation analysis may be limited.');
  }
  
  // Validate property type
  if (!claimData.property_type) {
    validation.warnings.push('Property type not specified. Analysis will use generic assumptions.');
  }
  
  return validation;
}

module.exports = {
  validateEstimateStructure,
  validatePolicyStructure,
  validateLineItemStructure,
  validatePolicyCoverageData,
  extractStructuredEstimate,
  generateInputQualityReport,
  enforceMinimumRequirements,
  validateFileUpload,
  sanitizeInput,
  validateClaimContext
};
