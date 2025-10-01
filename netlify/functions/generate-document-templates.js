exports.handler = async (event) => {
  try {
    // Parse request body
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Invalid JSON in request body" 
        })
      };
    }

    const { documentType, userData = {}, claimData = {} } = requestData;

    if (!documentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Document type is required" 
        })
      };
    }

    console.log("Generating document template:", documentType);

    // Document templates
    const templates = {
      'proof-of-loss': generateProofOfLoss(userData, claimData),
      'appeal-letter': generateAppealLetter(userData, claimData),
      'demand-letter': generateDemandLetter(userData, claimData),
      'damage-inventory': generateDamageInventory(userData, claimData),
      'claim-timeline': generateClaimTimeline(userData, claimData),
      'repair-cost-worksheet': generateRepairCostWorksheet(userData, claimData),
      'out-of-pocket-log': generateOutOfPocketLog(userData, claimData),
      'appraisal-demand': generateAppraisalDemand(userData, claimData),
      'notice-of-delay': generateNoticeOfDelay(userData, claimData),
      'coverage-clarification': generateCoverageClarification(userData, claimData),
      'notice-of-claim': generateNoticeOfClaim(userData, claimData),
      'claim-diary': generateClaimDiary(userData, claimData),
      'medical-expense-summary': generateMedicalExpenseSummary(userData, claimData),
      'follow-up-letter': generateFollowUpLetter(userData, claimData),
      'policy-clarification': generatePolicyClarification(userData, claimData),
      'proof-of-mitigation': generateProofOfMitigation(userData, claimData),
      'expert-support-letter': generateExpertSupportLetter(userData, claimData),
      'notice-of-intent-to-litigate': generateNoticeOfIntentToLitigate(userData, claimData),
      'photograph-log': generatePhotographLog(userData, claimData),
      'document-index': generateDocumentIndex(userData, claimData),
      'comparative-estimates': generateComparativeEstimates(userData, claimData),
      'settlement-comparison': generateSettlementComparison(userData, claimData)
    };

    const template = templates[documentType];
    if (!template) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Unknown document type: " + documentType 
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        document: {
          type: documentType,
          title: template.title,
          content: template.content,
          instructions: template.instructions,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error("Error in generate-document-templates:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      })
    };
  }
};

// Document template generators
function generateProofOfLoss(userData, claimData) {
  return {
    title: "Proof of Loss Statement",
    content: `
PROOF OF LOSS STATEMENT

Policyholder Information:
Name: ${userData.name || '[Your Name]'}
Address: ${userData.address || '[Your Address]'}
Phone: ${userData.phone || '[Your Phone]'}
Email: ${userData.email || '[Your Email]'}

Policy Information:
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Insurance Company: ${claimData.insuranceCompany || '[Insurance Company]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

LOSS DETAILS:
I, ${userData.name || '[Your Name]'}, being duly sworn, depose and say:

1. On ${claimData.dateOfLoss || '[Date of Loss]'}, I suffered a loss to my property located at ${userData.address || '[Property Address]'}.

2. The cause of loss was: ${claimData.causeOfLoss || '[Cause of Loss - e.g., fire, water damage, theft, etc.]'}

3. The following items were damaged or lost:
${claimData.damagedItems || '[List all damaged/lost items with descriptions and values]'}

4. The total amount of my loss is: $${claimData.totalLoss || '[Total Loss Amount]'}

5. I have not made any false statements in this proof of loss.

6. I understand that any false statements may result in denial of coverage and potential criminal prosecution.

Signature: _________________________ Date: ___________

Notary Public: _____________________ Date: ___________
    `,
    instructions: "Complete all sections, have notarized, and submit within the required timeframe."
  };
}

function generateAppealLetter(userData, claimData) {
  return {
    title: "Appeal Letter for Denied/Underpaid Claim",
    content: `
[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Insurance Company Name]
[Claims Department Address]
[City, State ZIP]

RE: Appeal of Claim Denial/Underpayment
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Claim Number: ${claimData.claimNumber || '[Claim Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

Dear Claims Manager:

I am writing to formally appeal the ${claimData.denialReason || 'denial/underpayment'} of my insurance claim referenced above.

GROUNDS FOR APPEAL:

1. Policy Coverage: My policy clearly covers this type of loss under [specific policy language].

2. Documentation: I have provided all requested documentation including:
   - Proof of loss statement
   - Photographs of damage
   - Repair estimates
   - Receipts for expenses

3. Expert Opinion: I have obtained professional estimates that support my claim amount of $${claimData.claimAmount || '[Claim Amount]'}.

4. Legal Precedent: Similar cases have been covered under identical policy language.

REQUESTED ACTION:
I request that you:
1. Reconsider my claim based on the additional information provided
2. Provide a detailed explanation if coverage is still denied
3. Allow me to present my case to a supervisor or appeals committee

I am prepared to provide any additional documentation or information you may require. Please respond within 15 business days.

Sincerely,
${userData.name || '[Your Name]'}

Enclosures: [List all supporting documents]
    `,
    instructions: "Customize the grounds for appeal based on your specific situation and policy language."
  };
}

function generateDemandLetter(userData, claimData) {
  return {
    title: "Demand Letter for Payment",
    content: `
[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Insurance Company Name]
[Claims Department Address]
[City, State ZIP]

RE: Demand for Payment
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Claim Number: ${claimData.claimNumber || '[Claim Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

Dear Claims Manager:

I am writing to demand immediate payment of my insurance claim in the amount of $${claimData.demandAmount || '[Demand Amount]'}.

CLAIM SUMMARY:
- Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}
- Cause of Loss: ${claimData.causeOfLoss || '[Cause of Loss]'}
- Total Damages: $${claimData.totalDamages || '[Total Damages]'}
- Amount Paid to Date: $${claimData.amountPaid || '[Amount Paid]'}
- Outstanding Balance: $${claimData.outstandingBalance || '[Outstanding Balance]'}

DOCUMENTATION PROVIDED:
I have submitted all required documentation including:
- Proof of loss statement
- Photographs of damage
- Professional repair estimates
- Receipts for expenses

LEGAL BASIS:
Under the terms of my policy, you are obligated to pay for covered losses. The delay in payment is causing me financial hardship and may constitute bad faith.

DEMAND:
I demand that you:
1. Pay the outstanding balance of $${claimData.outstandingBalance || '[Outstanding Balance]'} within 10 business days
2. Provide written confirmation of payment
3. Explain any remaining disputes in writing

If payment is not received within 10 business days, I will be forced to pursue all available legal remedies.

Sincerely,
${userData.name || '[Your Name]'}

CC: [Your Attorney, if applicable]
    `,
    instructions: "Send via certified mail with return receipt requested. Keep copies of all correspondence."
  };
}

function generateDamageInventory(userData, claimData) {
  return {
    title: "Damage Inventory Sheet",
    content: `
DAMAGE INVENTORY SHEET

Policyholder: ${userData.name || '[Your Name]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}
Location: ${userData.address || '[Property Address]'}

ITEMIZED DAMAGE LIST:

Room/Area: ${claimData.room || '[Room/Area]'}

| Item Description | Quantity | Condition Before Loss | Condition After Loss | Replacement Cost | Age | Depreciation | Actual Cash Value |
|------------------|----------|----------------------|---------------------|------------------|-----|--------------|------------------|
| ${claimData.item1 || '[Item 1]'} | ${claimData.qty1 || '[Qty]'} | ${claimData.condition1 || '[Good/Fair/Poor]'} | ${claimData.damage1 || '[Damaged/Destroyed]'} | $${claimData.cost1 || '[Cost]'} | ${claimData.age1 || '[Age]'} | ${claimData.depreciation1 || '[%]'} | $${claimData.acv1 || '[ACV]'} |
| ${claimData.item2 || '[Item 2]'} | ${claimData.qty2 || '[Qty]'} | ${claimData.condition2 || '[Good/Fair/Poor]'} | ${claimData.damage2 || '[Damaged/Destroyed]'} | $${claimData.cost2 || '[Cost]'} | ${claimData.age2 || '[Age]'} | ${claimData.depreciation2 || '[%]'} | $${claimData.acv2 || '[ACV]'} |
| ${claimData.item3 || '[Item 3]'} | ${claimData.qty3 || '[Qty]'} | ${claimData.condition3 || '[Good/Fair/Poor]'} | ${claimData.damage3 || '[Damaged/Destroyed]'} | $${claimData.cost3 || '[Cost]'} | ${claimData.age3 || '[Age]'} | ${claimData.depreciation3 || '[%]'} | $${claimData.acv3 || '[ACV]'} |

TOTAL REPLACEMENT COST: $${claimData.totalReplacementCost || '[Total]'}
TOTAL ACTUAL CASH VALUE: $${claimData.totalACV || '[Total ACV]'}

SUPPORTING DOCUMENTATION:
- Photographs of damaged items
- Receipts for original purchases
- Professional appraisals
- Repair estimates

Signature: _________________________ Date: ___________
    `,
    instructions: "Include photographs of each damaged item. Obtain professional appraisals for valuable items."
  };
}

function generateClaimTimeline(userData, claimData) {
  return {
    title: "Claim Timeline / Diary",
    content: `
CLAIM TIMELINE / DIARY

Policyholder: ${userData.name || '[Your Name]'}
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

CHRONOLOGICAL EVENTS:

| Date | Time | Event | Action Taken | Contact Person | Phone/Email | Notes |
|------|------|-------|--------------|----------------|-------------|-------|
| ${claimData.dateOfLoss || '[Date of Loss]'} | ${claimData.timeOfLoss || '[Time]'} | Loss occurred | ${claimData.initialAction || '[Action taken]'} | ${claimData.contact1 || '[Contact]'} | ${claimData.phone1 || '[Phone]'} | ${claimData.notes1 || '[Notes]'} |
| ${claimData.dateReported || '[Date Reported]'} | ${claimData.timeReported || '[Time]'} | Claim reported | ${claimData.reportAction || '[Action taken]'} | ${claimData.contact2 || '[Contact]'} | ${claimData.phone2 || '[Phone]'} | ${claimData.notes2 || '[Notes]'} |
| ${claimData.dateInspection || '[Date of Inspection]'} | ${claimData.timeInspection || '[Time]'} | Inspection scheduled | ${claimData.inspectionAction || '[Action taken]'} | ${claimData.contact3 || '[Contact]'} | ${claimData.phone3 || '[Phone]'} | ${claimData.notes3 || '[Notes]'} |
| ${claimData.dateEstimate || '[Date of Estimate]'} | ${claimData.timeEstimate || '[Time]'} | Estimate received | ${claimData.estimateAction || '[Action taken]'} | ${claimData.contact4 || '[Contact]'} | ${claimData.phone4 || '[Phone]'} | ${claimData.notes4 || '[Notes]'} |

DEADLINES TO TRACK:
- Proof of Loss Due: ${claimData.proofOfLossDeadline || '[Date]'}
- Policy Expiration: ${claimData.policyExpiration || '[Date]'}
- Statute of Limitations: ${claimData.statuteOfLimitations || '[Date]'}

COMMUNICATION LOG:
[Record all phone calls, emails, and letters with insurance company]

NEXT STEPS:
1. ${claimData.nextStep1 || '[Next action item]'}
2. ${claimData.nextStep2 || '[Next action item]'}
3. ${claimData.nextStep3 || '[Next action item]'}

Signature: _________________________ Date: ___________
    `,
    instructions: "Update this timeline regularly. Keep copies of all correspondence and document all communications."
  };
}

function generateRepairCostWorksheet(userData, claimData) {
  return {
    title: "Repair or Replacement Cost Worksheet",
    content: `
REPAIR OR REPLACEMENT COST WORKSHEET

Property Address: ${userData.address || '[Property Address]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}
Date Prepared: ${new Date().toLocaleDateString()}

REPAIR COST BREAKDOWN:

STRUCTURAL REPAIRS:
| Item | Description | Quantity | Unit Cost | Total Cost | Contractor | Date |
|------|-------------|----------|-----------|------------|------------|------|
| ${claimData.structural1 || '[Item]'} | ${claimData.desc1 || '[Description]'} | ${claimData.qty1 || '[Qty]'} | $${claimData.unitCost1 || '[Cost]'} | $${claimData.totalCost1 || '[Total]'} | ${claimData.contractor1 || '[Contractor]'} | ${claimData.date1 || '[Date]'} |
| ${claimData.structural2 || '[Item]'} | ${claimData.desc2 || '[Description]'} | ${claimData.qty2 || '[Qty]'} | $${claimData.unitCost2 || '[Cost]'} | $${claimData.totalCost2 || '[Total]'} | ${claimData.contractor2 || '[Contractor]'} | ${claimData.date2 || '[Date]'} |

INTERIOR REPAIRS:
| Item | Description | Quantity | Unit Cost | Total Cost | Contractor | Date |
|------|-------------|----------|-----------|------------|------------|------|
| ${claimData.interior1 || '[Item]'} | ${claimData.desc3 || '[Description]'} | ${claimData.qty3 || '[Qty]'} | $${claimData.unitCost3 || '[Cost]'} | $${claimData.totalCost3 || '[Total]'} | ${claimData.contractor3 || '[Contractor]'} | ${claimData.date3 || '[Date]'} |

ELECTRICAL/PLUMBING:
| Item | Description | Quantity | Unit Cost | Total Cost | Contractor | Date |
|------|-------------|----------|-----------|------------|------------|------|
| ${claimData.electrical1 || '[Item]'} | ${claimData.desc4 || '[Description]'} | ${claimData.qty4 || '[Qty]'} | $${claimData.unitCost4 || '[Cost]'} | $${claimData.totalCost4 || '[Total]'} | ${claimData.contractor4 || '[Contractor]'} | ${claimData.date4 || '[Date]'} |

TOTALS:
Structural Repairs: $${claimData.structuralTotal || '[Total]'}
Interior Repairs: $${claimData.interiorTotal || '[Total]'}
Electrical/Plumbing: $${claimData.electricalTotal || '[Total]'}
Materials: $${claimData.materialsTotal || '[Total]'}
Labor: $${claimData.laborTotal || '[Total]'}
Permits: $${claimData.permitsTotal || '[Total]'}
Contingency (10%): $${claimData.contingencyTotal || '[Total]'}

GRAND TOTAL: $${claimData.grandTotal || '[Grand Total]'}

SUPPORTING DOCUMENTS:
- Contractor estimates (3 required)
- Material specifications
- Building permits
- Code upgrade requirements

Prepared by: ${userData.name || '[Your Name]'}
Date: ${new Date().toLocaleDateString()}
    `,
    instructions: "Obtain at least 3 contractor estimates. Include material specifications and code requirements."
  };
}

function generateOutOfPocketLog(userData, claimData) {
  return {
    title: "Out-of-Pocket Expense Log",
    content: `
OUT-OF-POCKET EXPENSE LOG

Policyholder: ${userData.name || '[Your Name]'}
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

EXPENSE TRACKING:

| Date | Category | Description | Amount | Receipt # | Purpose | Reimbursable |
|------|----------|-------------|--------|-----------|---------|--------------|
| ${claimData.date1 || '[Date]'} | ${claimData.category1 || '[Category]'} | ${claimData.description1 || '[Description]'} | $${claimData.amount1 || '[Amount]'} | ${claimData.receipt1 || '[Receipt #]'} | ${claimData.purpose1 || '[Purpose]'} | ${claimData.reimbursable1 || '[Yes/No]'} |
| ${claimData.date2 || '[Date]'} | ${claimData.category2 || '[Category]'} | ${claimData.description2 || '[Description]'} | $${claimData.amount2 || '[Amount]'} | ${claimData.receipt2 || '[Receipt #]'} | ${claimData.purpose2 || '[Purpose]'} | ${claimData.reimbursable2 || '[Yes/No]'} |
| ${claimData.date3 || '[Date]'} | ${claimData.category3 || '[Category]'} | ${claimData.description3 || '[Description]'} | $${claimData.amount3 || '[Amount]'} | ${claimData.receipt3 || '[Receipt #]'} | ${claimData.purpose3 || '[Purpose]'} | ${claimData.reimbursable3 || '[Yes/No]'} |

CATEGORIES:
- Temporary Housing (ALE)
- Meals (ALE)
- Transportation
- Storage
- Security
- Emergency Repairs
- Other

TOTALS:
Total Expenses: $${claimData.totalExpenses || '[Total]'}
Reimbursable Amount: $${claimData.reimbursableAmount || '[Total]'}
Non-Reimbursable: $${claimData.nonReimbursable || '[Total]'}

SUPPORTING DOCUMENTS:
- Receipts for all expenses
- Bank statements
- Credit card statements
- Invoices

Signature: _________________________ Date: ___________
    `,
    instructions: "Keep all receipts and documentation. Some expenses may be covered under Additional Living Expenses (ALE)."
  };
}

function generateAppraisalDemand(userData, claimData) {
  return {
    title: "Appraisal Demand Letter",
    content: `
[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Insurance Company Name]
[Claims Department Address]
[City, State ZIP]

RE: Demand for Appraisal
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Claim Number: ${claimData.claimNumber || '[Claim Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

Dear Claims Manager:

I am writing to formally demand appraisal under the terms of my insurance policy regarding the above-referenced claim.

DISPUTE:
We have a disagreement regarding the amount of loss. Your company has offered $${claimData.insuranceOffer || '[Insurance Offer]'}, while my estimate is $${claimData.claimantEstimate || '[Claimant Estimate]'}. This represents a difference of $${claimData.difference || '[Difference]'}.

POLICY PROVISION:
My policy contains the following appraisal clause:
"Appraisal. If you and we fail to agree on the amount of loss, either may demand an appraisal of the loss. In this event, each party will select a competent and disinterested appraiser..."

DEMAND FOR APPRAISAL:
I hereby demand that you participate in the appraisal process as follows:

1. Each party will select a competent and disinterested appraiser within 20 days of this demand
2. The appraisers will select a competent and disinterested umpire
3. The appraisers will determine the amount of loss
4. If the appraisers fail to agree, they will submit their differences to the umpire
5. The decision of any two will be binding

I will select my appraiser within 20 days of your receipt of this letter. Please confirm your participation and provide the name and contact information of your selected appraiser.

Sincerely,
${userData.name || '[Your Name]'}

Enclosures: Policy copy, claim documentation
    `,
    instructions: "Send via certified mail. The appraisal process is binding and may be your best option for resolving valuation disputes."
  };
}

function generateNoticeOfDelay(userData, claimData) {
  return {
    title: "Notice of Delay Complaint",
    content: `
[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Insurance Company Name]
[Claims Department Address]
[City, State ZIP]

RE: Notice of Delay Complaint
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Claim Number: ${claimData.claimNumber || '[Claim Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

Dear Claims Manager:

I am writing to formally complain about the unreasonable delay in processing my insurance claim.

DELAY DETAILS:
- Claim reported: ${claimData.dateReported || '[Date Reported]'}
- Days since reported: ${claimData.daysSinceReported || '[Days]'}
- Last communication: ${claimData.lastCommunication || '[Date]'}
- Days since last communication: ${claimData.daysSinceLastCommunication || '[Days]'}

UNREASONABLE DELAYS:
1. Initial response delay: ${claimData.initialDelay || '[Days]'} days
2. Inspection delay: ${claimData.inspectionDelay || '[Days]'} days
3. Estimate delay: ${claimData.estimateDelay || '[Days]'} days
4. Payment delay: ${claimData.paymentDelay || '[Days]'} days

LEGAL VIOLATIONS:
This delay may constitute violations of:
- Unfair Claims Settlement Practices Act
- State insurance regulations
- Bad faith insurance practices

DEMAND:
I demand that you:
1. Immediately process my claim
2. Provide a written explanation for the delay
3. Pay all amounts due within 10 business days
4. Compensate me for any additional expenses caused by the delay

If this matter is not resolved promptly, I will file a complaint with the state insurance department and pursue all available legal remedies.

Sincerely,
${userData.name || '[Your Name]'}

CC: State Insurance Department
    `,
    instructions: "Send via certified mail. Consider filing a complaint with your state insurance department."
  };
}

function generateCoverageClarification(userData, claimData) {
  return {
    title: "Coverage Clarification Request",
    content: `
[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Insurance Company Name]
[Claims Department Address]
[City, State ZIP]

RE: Request for Coverage Clarification
Policy Number: ${claimData.policyNumber || '[Policy Number]'}
Claim Number: ${claimData.claimNumber || '[Claim Number]'}
Date of Loss: ${claimData.dateOfLoss || '[Date of Loss]'}

Dear Claims Manager:

I am writing to request clarification regarding the coverage for my claim referenced above.

SPECIFIC QUESTIONS:

1. Coverage Determination:
   - Is this loss covered under my policy?
   - If not, please cite the specific policy language that excludes coverage
   - What additional information do you need to make a coverage determination?

2. Policy Limits:
   - What are the applicable policy limits for this type of loss?
   - Are there any sublimits that apply?
   - What is the remaining coverage available?

3. Deductible:
   - What is the applicable deductible?
   - Has the deductible been applied correctly?
   - Are there any deductible waivers that apply?

4. Exclusions:
   - Are there any exclusions that might apply to this loss?
   - If so, please explain how they apply to my specific situation
   - What evidence would overcome these exclusions?

5. Additional Coverage:
   - Are there any additional coverages that might apply?
   - What about code upgrade coverage?
   - What about ordinance and law coverage?

REQUEST:
Please provide written responses to all questions above within 15 business days. I need this information to understand my coverage and make informed decisions about my claim.

Sincerely,
${userData.name || '[Your Name]'}

Enclosures: Policy copy, claim documentation
    `,
    instructions: "Request specific policy language citations. Keep copies of all correspondence."
  };
}

// Additional template functions would continue here...
function generateNoticeOfClaim(userData, claimData) {
  return {
    title: "Notice of Claim",
    content: `NOTICE OF CLAIM - Basic template structure`,
    instructions: "Complete with specific loss details"
  };
}

function generateClaimDiary(userData, claimData) {
  return {
    title: "Claim Diary",
    content: `CLAIM DIARY - Basic template structure`,
    instructions: "Maintain detailed chronological record"
  };
}

function generateMedicalExpenseSummary(userData, claimData) {
  return {
    title: "Medical Expense Summary",
    content: `MEDICAL EXPENSE SUMMARY - Basic template structure`,
    instructions: "Consolidate all healthcare expenses"
  };
}

function generateFollowUpLetter(userData, claimData) {
  return {
    title: "Follow-Up Letter",
    content: `FOLLOW-UP LETTER - Basic template structure`,
    instructions: "Professional follow-up communication"
  };
}

function generatePolicyClarification(userData, claimData) {
  return {
    title: "Policy Clarification Request",
    content: `POLICY CLARIFICATION REQUEST - Basic template structure`,
    instructions: "Request specific policy interpretations"
  };
}

function generateProofOfMitigation(userData, claimData) {
  return {
    title: "Proof of Mitigation Letter",
    content: `PROOF OF MITIGATION LETTER - Basic template structure`,
    instructions: "Document efforts to minimize loss"
  };
}

function generateExpertSupportLetter(userData, claimData) {
  return {
    title: "Expert Support Letter",
    content: `EXPERT SUPPORT LETTER - Basic template structure`,
    instructions: "Professional expert opinion letter"
  };
}

function generateNoticeOfIntentToLitigate(userData, claimData) {
  return {
    title: "Notice of Intent to Litigate",
    content: `NOTICE OF INTENT TO LITIGATE - Basic template structure`,
    instructions: "Formal legal escalation notice"
  };
}

function generatePhotographLog(userData, claimData) {
  return {
    title: "Photograph Log",
    content: `PHOTOGRAPH LOG - Basic template structure`,
    instructions: "Document all damage photographs"
  };
}

function generateDocumentIndex(userData, claimData) {
  return {
    title: "Document Index",
    content: `DOCUMENT INDEX - Basic template structure`,
    instructions: "Comprehensive document inventory"
  };
}

function generateComparativeEstimates(userData, claimData) {
  return {
    title: "Comparative Estimates",
    content: `COMPARATIVE ESTIMATES - Basic template structure`,
    instructions: "Compare multiple contractor estimates"
  };
}

function generateSettlementComparison(userData, claimData) {
  return {
    title: "Settlement Comparison Sheet",
    content: `SETTLEMENT COMPARISON SHEET - Basic template structure`,
    instructions: "Compare insurer offer vs. claim value"
  };
}
