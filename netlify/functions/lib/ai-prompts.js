/**
 * AI Prompt Templates for Claim Command Center
 * All prompts return structured JSON only - no prose
 */

/**
 * Policy Analysis Prompt
 * Extracts structured coverage information from insurance policy
 */
const POLICY_ANALYSIS_PROMPT = `You are an insurance policy analysis expert. Analyze the provided insurance policy document and extract structured coverage information.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Extract the following information:

{
  "coverage_limits": {
    "dwelling": number,
    "contents": number,
    "ale": number,
    "ordinance_law": number,
    "other_structures": number,
    "liability": number,
    "medical_payments": number
  },
  "deductible": {
    "amount": number,
    "type": "flat" | "percentage" | "hurricane" | "wind_hail",
    "percentage_value": number | null,
    "applies_to": string
  },
  "settlement_type": "ACV" | "RCV" | "Functional_RCV",
  "ale_limit": {
    "amount": number,
    "time_limit_months": number,
    "percentage_of_dwelling": number | null
  },
  "ordinance_law": {
    "included": boolean,
    "limit": number,
    "percentage_of_dwelling": number | null,
    "covers_increased_cost": boolean,
    "covers_demolition": boolean,
    "covers_undamaged_portion": boolean
  },
  "code_upgrade_coverage": {
    "included": boolean,
    "limit": number,
    "specific_endorsements": string[]
  },
  "special_provisions": {
    "matching_coverage": boolean,
    "guaranteed_replacement_cost": boolean,
    "extended_replacement_cost": boolean,
    "extended_percentage": number | null,
    "water_backup": boolean,
    "water_backup_limit": number | null,
    "equipment_breakdown": boolean,
    "identity_theft": boolean
  },
  "exclusions": string[],
  "limitations": string[],
  "endorsements": string[],
  "risk_notes": string[],
  "policy_number": string,
  "policy_period": {
    "start_date": string,
    "end_date": string
  },
  "insured_name": string,
  "property_address": string,
  "carrier_name": string
}

If any field cannot be determined from the document, use null for numbers, false for booleans, or empty arrays for arrays.

Return ONLY the JSON object. No additional text.`;

/**
 * Estimate Comparison Prompt
 * Compares contractor and carrier estimates line by line
 */
const ESTIMATE_COMPARISON_PROMPT = `You are an insurance estimate analysis expert. Compare the contractor estimate and carrier estimate line by line.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Analyze and return:

{
  "contractor_total": number,
  "carrier_total": number,
  "underpayment_estimate": number,
  "missing_items": [
    {
      "description": string,
      "category": string,
      "contractor_quantity": number,
      "contractor_unit_price": number,
      "contractor_total": number,
      "reason_missing": string
    }
  ],
  "quantity_discrepancies": [
    {
      "description": string,
      "category": string,
      "contractor_quantity": number,
      "carrier_quantity": number,
      "quantity_difference": number,
      "contractor_unit_price": number,
      "carrier_unit_price": number,
      "amount_difference": number
    }
  ],
  "pricing_discrepancies": [
    {
      "description": string,
      "category": string,
      "quantity": number,
      "contractor_unit_price": number,
      "carrier_unit_price": number,
      "price_difference": number,
      "amount_difference": number,
      "reason": string
    }
  ],
  "material_differences": [
    {
      "description": string,
      "contractor_material": string,
      "carrier_material": string,
      "quality_difference": string,
      "amount_difference": number
    }
  ],
  "scope_omissions": [
    {
      "description": string,
      "category": string,
      "contractor_scope": string,
      "carrier_scope": string,
      "estimated_value": number,
      "justification": string
    }
  ],
  "category_breakdown": {
    "roofing": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "siding": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "interior": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "electrical": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "plumbing": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "hvac": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "other": {
      "contractor": number,
      "carrier": number,
      "difference": number
    }
  },
  "summary": {
    "total_discrepancies": number,
    "largest_single_discrepancy": number,
    "most_common_issue": string,
    "priority_items": string[]
  }
}

Return ONLY the JSON object. No additional text.`;

/**
 * Supplement Letter Generation Prompt
 */
const SUPPLEMENT_LETTER_PROMPT = `You are an insurance claim supplement letter expert. Generate a professional supplement letter based on the discrepancies identified.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Generate:

{
  "letter_html": string,
  "letter_markdown": string,
  "subject_line": string,
  "key_points": string[],
  "total_supplement_amount": number,
  "itemized_requests": [
    {
      "item_number": number,
      "description": string,
      "justification": string,
      "policy_reference": string | null,
      "amount": number
    }
  ],
  "policy_citations": [
    {
      "section": string,
      "text": string,
      "relevance": string
    }
  ],
  "supporting_documents_required": string[],
  "deadline_suggested": string
}

The letter_html should be a complete, professional HTML letter with:
- Proper header with date and claim number
- Professional greeting
- Clear itemized list of supplement items
- Policy citations where applicable
- Professional closing
- Request for response within 15 business days

The letter_markdown should be the same content in markdown format.

Return ONLY the JSON object. No additional text.`;

/**
 * Settlement Analysis Prompt
 */
const SETTLEMENT_ANALYSIS_PROMPT = `You are an insurance settlement analysis expert. Analyze the settlement letter and extract all financial details.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Extract and calculate:

{
  "settlement_breakdown": {
    "rcv_total": number,
    "acv_paid": number,
    "depreciation_withheld": number,
    "deductible_applied": number,
    "prior_payments": number,
    "net_payment": number
  },
  "category_breakdown": {
    "structure": {
      "rcv": number,
      "acv": number,
      "depreciation": number
    },
    "contents": {
      "rcv": number,
      "acv": number,
      "depreciation": number
    },
    "ale": {
      "total": number,
      "paid": number,
      "remaining": number
    },
    "other": {
      "rcv": number,
      "acv": number,
      "depreciation": number
    }
  },
  "payment_schedule": [
    {
      "payment_number": number,
      "amount": number,
      "date": string,
      "type": string,
      "status": string
    }
  ],
  "depreciation_recovery": {
    "total_withheld": number,
    "recoverable": number,
    "conditions": string[],
    "deadline": string | null
  },
  "discrepancies": [
    {
      "description": string,
      "expected_amount": number,
      "actual_amount": number,
      "difference": number,
      "severity": "low" | "medium" | "high"
    }
  ],
  "red_flags": string[],
  "action_items": string[],
  "recovery_opportunities": [
    {
      "description": string,
      "estimated_value": number,
      "action_required": string,
      "deadline": string | null
    }
  ]
}

Return ONLY the JSON object. No additional text.`;

/**
 * Release Analysis Prompt
 */
const RELEASE_ANALYSIS_PROMPT = `You are an insurance release document analysis expert. Analyze the release language for problematic clauses.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Analyze and return:

{
  "broad_release_detected": boolean,
  "release_scope": "specific_claim" | "all_claims" | "all_claims_and_future" | "unclear",
  "flagged_clauses": [
    {
      "clause_text": string,
      "risk_level": "low" | "medium" | "high" | "critical",
      "issue": string,
      "recommendation": string
    }
  ],
  "waived_rights": string[],
  "future_claims_affected": boolean,
  "bad_faith_waiver": boolean,
  "attorney_fees_waiver": boolean,
  "unknown_damages_waiver": boolean,
  "risk_summary": {
    "overall_risk": "low" | "medium" | "high" | "critical",
    "safe_to_sign": boolean,
    "conditions_for_signing": string[],
    "recommended_modifications": string[]
  },
  "specific_concerns": [
    {
      "concern": string,
      "impact": string,
      "severity": "low" | "medium" | "high" | "critical"
    }
  ],
  "acceptable_language": string[],
  "unacceptable_language": string[],
  "revision_suggestions": [
    {
      "original_text": string,
      "suggested_revision": string,
      "reason": string
    }
  ]
}

Return ONLY the JSON object. No additional text.`;

/**
 * Demand Letter Generation Prompt
 */
const DEMAND_LETTER_PROMPT = `You are an insurance demand letter expert. Generate a formal, professional demand letter based on the claim data.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Generate:

{
  "letter_html": string,
  "letter_markdown": string,
  "subject_line": string,
  "total_demand_amount": number,
  "demand_breakdown": [
    {
      "category": string,
      "description": string,
      "amount": number,
      "justification": string,
      "policy_reference": string | null
    }
  ],
  "policy_citations": [
    {
      "section": string,
      "provision": string,
      "relevance": string,
      "quote": string
    }
  ],
  "legal_basis": string[],
  "timeline": {
    "loss_date": string,
    "claim_filed": string,
    "inspection_date": string,
    "initial_offer": string,
    "days_elapsed": number
  },
  "response_deadline": string,
  "consequences_statement": string,
  "supporting_evidence": string[],
  "key_arguments": string[]
}

The letter_html should be a complete, formal demand letter with:
- Professional letterhead format
- Date and claim number
- Formal greeting
- Clear statement of demand
- Detailed breakdown of amounts owed
- Policy citations and legal basis
- Timeline of events
- Response deadline (15 business days)
- Statement of consequences for non-compliance
- Professional closing
- Request for written response

The letter_markdown should be the same content in markdown format.

Return ONLY the JSON object. No additional text.`;

/**
 * Code Analysis Prompt
 */
const CODE_ANALYSIS_PROMPT = `You are a building code and ordinance law expert. Analyze the damage and identify code upgrade requirements.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Analyze and return:

{
  "code_upgrades_required": [
    {
      "system": string,
      "current_code": string,
      "existing_condition": string,
      "required_upgrade": string,
      "estimated_cost": number,
      "justification": string,
      "code_reference": string
    }
  ],
  "ordinance_law_triggers": [
    {
      "trigger_type": string,
      "threshold": string,
      "current_damage_percentage": number,
      "triggered": boolean,
      "coverage_available": boolean,
      "estimated_cost": number
    }
  ],
  "total_code_upgrade_cost": number,
  "total_ordinance_law_cost": number,
  "policy_coverage_analysis": {
    "ordinance_law_limit": number,
    "code_upgrade_limit": number,
    "total_available": number,
    "total_needed": number,
    "coverage_gap": number
  },
  "required_documentation": string[],
  "building_department_requirements": string[],
  "recommendations": string[]
}

Return ONLY the JSON object. No additional text.`;

/**
 * Helper function to build policy analysis prompt with document text
 */
function buildPolicyAnalysisPrompt(policyText) {
  return `${POLICY_ANALYSIS_PROMPT}

POLICY DOCUMENT TEXT:
${policyText}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build estimate comparison prompt
 */
function buildEstimateComparisonPrompt(contractorText, carrierText) {
  return `${ESTIMATE_COMPARISON_PROMPT}

CONTRACTOR ESTIMATE:
${contractorText}

CARRIER ESTIMATE:
${carrierText}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build supplement letter prompt
 */
function buildSupplementLetterPrompt(discrepancyData, policyData, claimInfo) {
  return `${SUPPLEMENT_LETTER_PROMPT}

CLAIM INFORMATION:
Claim Number: ${claimInfo.claim_number}
Insured Name: ${claimInfo.insured_name}
Policy Number: ${claimInfo.policy_number}
Carrier: ${claimInfo.carrier}
Date of Loss: ${claimInfo.loss_date}
Adjuster: ${claimInfo.adjuster_name}

DISCREPANCY DATA:
${JSON.stringify(discrepancyData, null, 2)}

POLICY COVERAGE DATA:
${JSON.stringify(policyData, null, 2)}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build settlement analysis prompt
 */
function buildSettlementAnalysisPrompt(settlementText, estimateData) {
  return `${SETTLEMENT_ANALYSIS_PROMPT}

SETTLEMENT LETTER TEXT:
${settlementText}

ESTIMATE DATA FOR COMPARISON:
${JSON.stringify(estimateData, null, 2)}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build release analysis prompt
 */
function buildReleaseAnalysisPrompt(releaseText) {
  return `${RELEASE_ANALYSIS_PROMPT}

RELEASE DOCUMENT TEXT:
${releaseText}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build demand letter prompt
 */
function buildDemandLetterPrompt(claimInfo, discrepancyData, policyData, financialData) {
  return `${DEMAND_LETTER_PROMPT}

CLAIM INFORMATION:
${JSON.stringify(claimInfo, null, 2)}

DISCREPANCY DATA:
${JSON.stringify(discrepancyData, null, 2)}

POLICY COVERAGE DATA:
${JSON.stringify(policyData, null, 2)}

FINANCIAL SUMMARY:
${JSON.stringify(financialData, null, 2)}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build code analysis prompt
 */
function buildCodeAnalysisPrompt(damageDescription, contractorEstimate, policyData) {
  return `${CODE_ANALYSIS_PROMPT}

DAMAGE DESCRIPTION:
${damageDescription}

CONTRACTOR ESTIMATE:
${contractorEstimate}

POLICY COVERAGE:
${JSON.stringify(policyData, null, 2)}

Return ONLY the JSON object.`;
}

module.exports = {
  POLICY_ANALYSIS_PROMPT,
  ESTIMATE_COMPARISON_PROMPT,
  SUPPLEMENT_LETTER_PROMPT,
  SETTLEMENT_ANALYSIS_PROMPT,
  RELEASE_ANALYSIS_PROMPT,
  DEMAND_LETTER_PROMPT,
  CODE_ANALYSIS_PROMPT,
  buildPolicyAnalysisPrompt,
  buildEstimateComparisonPrompt,
  buildSupplementLetterPrompt,
  buildSettlementAnalysisPrompt,
  buildReleaseAnalysisPrompt,
  buildDemandLetterPrompt,
  buildCodeAnalysisPrompt
};
