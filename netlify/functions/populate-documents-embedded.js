const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow this function to run in development or with admin access
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Embedded document data - English documents (63 documents)
    const englishDocuments = [
      { slug: "additional-living-expenses-ale-reimbursement-request", label: "Additional Living Expenses (ALE) Reimbursement Request", description: "Request reimbursement for temporary housing, meals, or related living expenses.", language: "en", template_path: "additional-living-expenses-ale-reimbursement-request.pdf", sample_path: "additional-living-expenses-ale-reimbursement-request-sample.pdf" },
      { slug: "ale-interim-reimbursement-request-letter", label: "ALE Interim Reimbursement Request Letter", description: "Request for interim reimbursement of ALE costs.", language: "en", template_path: "ale-interim-reimbursement-request-letter.pdf", sample_path: "ale-interim-reimbursement-request-letter-sample.pdf" },
      { slug: "arbitration-demand-letter", label: "Arbitration Demand Letter", description: "Letter demanding arbitration to resolve a claim dispute.", language: "en", template_path: "arbitration-demand-letter.pdf", sample_path: "arbitration-demand-letter-sample.pdf" },
      { slug: "attorney-referralengagement-letter", label: "Attorney Referral / Engagement Letter", description: "Referral or engagement letter template for attorney involvement in a claim.", language: "en", template_path: "attorney-referral_engagement-letter.pdf", sample_path: "attorney-referral_engagement-letter-sample.pdf" },
      { slug: "authorization-and-direction-to-endorse-insurance-proceeds", label: "Authorization and Direction to Endorse Insurance Proceeds", description: "Provides authorization and direction to endorse insurance proceeds to the policyholder.", language: "en", template_path: "authorization-and-direction-to-endorse-insurance-proceeds.pdf", sample_path: "authorization-and-direction-to-endorse-insurance-proceeds-sample.pdf" },
      { slug: "authorization-for-release-of-insurance-claim-information", label: "Authorization for Release of Insurance Claim Information", description: "Authorizes release of insurance claim information to a designated party.", language: "en", template_path: "authorization-for-release-of-insurance-claim-information.pdf", sample_path: "authorization-for-release-of-insurance-claim-information-sample.pdf" },
      { slug: "business-interruption-claim-calculation-worksheet", label: "Business Interruption Claim Calculation Worksheet", description: "Worksheet to calculate business interruption claim values and losses.", language: "en", template_path: "business-interruption-claim-calculation-worksheet.pdf", sample_path: "business-interruption-claim-calculation-worksheet-sample.pdf" },
      { slug: "business-interruption-claim-presentation", label: "Business Interruption Claim Presentation", description: "Presentation template for documenting and presenting business interruption claims.", language: "en", template_path: "business-interruption-claim-presentation.pdf", sample_path: "business-interruption-claim-presentation-sample.pdf" },
      { slug: "check-endorsement-instructions-letter", label: "Check Endorsement Instructions Letter", description: "Provides instructions for endorsing insurance claim checks.", language: "en", template_path: "check-endorsement-instructions-letter.pdf", sample_path: "check-endorsement-instructions-letter-sample.pdf" },
      { slug: "claim-evidence-checklist", label: "Claim Evidence Checklist", description: "Checklist to ensure evidence is documented and maintained for a claim.", language: "en", template_path: "claim-evidence-checklist.pdf", sample_path: "claim-evidence-checklist-sample.pdf" },
      { slug: "claim-expense-tracking-log", label: "Claim Expense Tracking Log", description: "Template for tracking all expenses related to a claim.", language: "en", template_path: "claim-expense-tracking-log.pdf", sample_path: "claim-expense-tracking-log-sample.pdf" },
      { slug: "claim-summary-report", label: "Claim Summary Report", description: "Summarizes claim details, documentation, and current status.", language: "en", template_path: "claim-summary-report.pdf", sample_path: "claim-summary-report-sample.pdf" },
      { slug: "commercial-lease-interruption-notice-business-interruption", label: "Commercial Lease Interruption Notice (Business Interruption)", description: "Notice template for commercial lease interruption due to business interruption.", language: "en", template_path: "commercial-lease-interruption-notice-business-interruption.pdf", sample_path: "commercial-lease-interruption-notice-business-interruption-sample.pdf" },
      { slug: "commercial-tenant-damage-claim-letter", label: "Commercial Tenant Damage Claim Letter", description: "Letter template for commercial tenant damage claims.", language: "en", template_path: "commercial-tenant-damage-claim-letter.pdf", sample_path: "commercial-tenant-damage-claim-letter-sample.pdf" },
      { slug: "communication-tracking-system-with-carrier", label: "Communication Tracking System with Carrier", description: "System for tracking communications with an insurance carrier.", language: "en", template_path: "communication-tracking-system-with-carrier.pdf", sample_path: "communication-tracking-system-with-carrier-sample.pdf" },
      { slug: "complaint-for-unfair-claims-practices", label: "Complaint for Unfair Claims Practices", description: "Formal complaint regarding unfair claims practices by an insurer.", language: "en", template_path: "complaint-for-unfair-claims-practices.pdf", sample_path: "complaint-for-unfair-claims-practices-sample.pdf" },
      { slug: "damage-valuation-report", label: "Damage Valuation Report", description: "Detailed report valuing damages to property and associated costs for claims.", language: "en", template_path: "damage-valuation-report.pdf", sample_path: "damage-valuation-report-sample.pdf" },
      { slug: "demand-for-appraisal-letter", label: "Demand for Appraisal Letter", description: "Requests a formal appraisal process to resolve claim disputes.", language: "en", template_path: "demand-for-appraisal-letter.pdf", sample_path: "demand-for-appraisal-letter-sample.pdf" },
      { slug: "department-of-insurance-complaint-letter", label: "Department of Insurance Complaint Letter", description: "Formal complaint letter to the Department of Insurance regarding claim handling or other claim issues.", language: "en", template_path: "department-of-insurance-complaint-letter.pdf", sample_path: "department-of-insurance-complaint-letter-sample.pdf" },
      { slug: "emergency-services-invoice", label: "Emergency Services Invoice", description: "Invoice template for documenting emergency services rendered after a loss.", language: "en", template_path: "emergency-services-invoice.pdf", sample_path: "emergency-services-invoice-sample.pdf" },
      { slug: "evidence-and-photo-documentation-log", label: "Evidence & Photo Documentation Log", description: "Log for documenting photos and evidence related to the claim.", language: "en", template_path: "evidence-and-photo-documentation-log.pdf", sample_path: "evidence-and-photo-documentation-log-sample.pdf" },
      { slug: "expert-engineer-engagement-letter", label: "Expert Engineer Engagement Letter", description: "Engagement letter for hiring an expert engineer in support of a claim.", language: "en", template_path: "expert-engineer-engagement-letter.pdf", sample_path: "expert-engineer-engagement-letter-sample.pdf" },
      { slug: "final-demand-for-payment-letter", label: "Final Demand for Payment Letter", description: "Final request to the insurer demanding claim payment.", language: "en", template_path: "final-demand-for-payment-letter.pdf", sample_path: "final-demand-for-payment-letter-sample.pdf" },
      { slug: "final-settlement-acceptance-letter", label: "Final Settlement Acceptance Letter", description: "Letter accepting the insurer's final settlement offer.", language: "en", template_path: "final-settlement-acceptance-letter.pdf", sample_path: "final-settlement-acceptance-letter-sample.pdf" },
      { slug: "fire-damage-claim-documentation-letter", label: "Fire Damage Claim Documentation Letter", description: "Letter template for documenting property fire damage.", language: "en", template_path: "fire-damage-claim-documentation-letter.pdf", sample_path: "fire-damage-claim-documentation-letter-sample.pdf" },
      { slug: "first-notice-of-loss-fnol-letter", label: "First Notice of Loss (FNOL) Letter", description: "Initial letter to notify the insurer of a loss event.", language: "en", template_path: "first-notice-of-loss-fnol-letter.pdf", sample_path: "first-notice-of-loss-fnol-letter-sample.pdf" },
      { slug: "flood-claim-documentation-letter", label: "Flood Claim Documentation Letter", description: "Letter template for documenting flood-related damages.", language: "en", template_path: "flood-claim-documentation-letter.pdf", sample_path: "flood-claim-documentation-letter-sample.pdf" },
      { slug: "hurricanewindstorm-claim-documentation-letter", label: "Hurricane / Windstorm Claim Documentation Letter", description: "Letter template for documenting hurricane and windstorm damage.", language: "en", template_path: "hurricane_windstorm-claim-documentation-letter.pdf", sample_path: "hurricane_windstorm-claim-documentation-letter-sample.pdf" },
      { slug: "industrial-loss-claim-documentation-letter", label: "Industrial Loss Claim Documentation Letter", description: "Letter template for documenting industrial loss and related damages.", language: "en", template_path: "industrial-loss-claim-documentation-letter.pdf", sample_path: "industrial-loss-claim-documentation-letter-sample.pdf" },
      { slug: "insurance-carrier-contact-log", label: "Insurance Carrier Contact Log", description: "Log template for recording communications with an insurance carrier.", language: "en", template_path: "insurance-carrier-contact-log.pdf", sample_path: "insurance-carrier-contact-log-sample.pdf" },
      { slug: "line-item-estimate", label: "Line-Item Estimate Template", description: "Template for creating line-item repair or replacement estimates.", language: "en", template_path: "line-item-estimate.pdf", sample_path: "line-item-estimate-sample.pdf" },
      { slug: "line-item-estimate-template", label: "Line-Item Estimate Template", description: "Template for creating line-item repair or replacement estimates.", language: "en", template_path: "line-item-estimate-template.pdf", sample_path: "line-item-estimate-template-sample.pdf" },
      { slug: "mold-claim-documentation-letter", label: "Mold Claim Documentation Letter", description: "Letter template for documenting mold-related damage claims.", language: "en", template_path: "mold-claim-documentation-letter.pdf", sample_path: "mold-claim-documentation-letter-sample.pdf" },
      { slug: "mortgagee-notification-letter", label: "Mortgagee Notification Letter", description: "Letter notifying mortgagee of claim activity or proceeds.", language: "en", template_path: "mortgagee-notification-letter.pdf", sample_path: "mortgagee-notification-letter-sample.pdf" },
      { slug: "notice-of-intent-to-litigate-letter", label: "Notice of Intent to Litigate Letter", description: "Formal letter notifying the insurer of intent to pursue litigation.", language: "en", template_path: "notice-of-intent-to-litigate-letter.pdf", sample_path: "notice-of-intent-to-litigate-letter-sample.pdf" },
      { slug: "personal-property-inventory-claim-form", label: "Personal Property Inventory Claim Form", description: "Form for listing and documenting personal property loss claims.", language: "en", template_path: "personal-property-inventory-claim-form.pdf", sample_path: "personal-property-inventory-claim-form-sample.pdf" },
      { slug: "professional-estimate-for-restoration-template", label: "Professional Estimate for Restoration Template", description: "Template for creating a professional estimate for property restoration.", language: "en", template_path: "professional-estimate-for-restoration-template.pdf", sample_path: "professional-estimate-for-restoration-template-sample.pdf" },
      { slug: "property-claim-submission-checklist", label: "Property Claim Submission Checklist", description: "Checklist to ensure all documents are included in a claim submission.", language: "en", template_path: "property-claim-submission-checklist.pdf", sample_path: "property-claim-submission-checklist-sample.pdf" },
      { slug: "property-damage-verification-and-documentation-letter", label: "Property Damage Verification & Documentation Letter", description: "Letter verifying property damage and documenting details for a claim.", language: "en", template_path: "property-damage-verification-and-documentation-letter.pdf", sample_path: "property-damage-verification-and-documentation-letter-sample.pdf" },
      { slug: "property-damage-verification-and-documentation-statement", label: "Property Damage Verification & Documentation Statement", description: "Formal statement of property damage verification and documentation.", language: "en", template_path: "property-damage-verification-and-documentation-statement.pdf", sample_path: "property-damage-verification-and-documentation-statement-sample.pdf" },
      { slug: "property-inspection-scheduling-request-letter", label: "Property Inspection Scheduling Request Letter", description: "Letter template requesting a property inspection or re-inspection.", language: "en", template_path: "property-inspection-scheduling-request-letter.pdf", sample_path: "property-inspection-scheduling-request-letter-sample.pdf" },
      { slug: "rebuttal-to-carrier-partial-denial-of-coverage-letter", label: "Rebuttal to Carrier Partial Denial of Coverage Letter", description: "Responds to a carrier's partial denial of coverage.", language: "en", template_path: "rebuttal-to-carrier-partial-denial-of-coverage-letter.pdf", sample_path: "rebuttal-to-carrier-partial-denial-of-coverage-letter-sample.pdf" },
      { slug: "rebuttal-to-wrongful-claim-denial-letter", label: "Rebuttal to Wrongful Claim Denial Letter", description: "Formal rebuttal letter challenging a wrongful claim denial.", language: "en", template_path: "rebuttal-to-wrongful-claim-denial-letter.pdf", sample_path: "rebuttal-to-wrongful-claim-denial-letter-sample.pdf" },
      { slug: "request-for-advance-payment-letter", label: "Request for Advance Payment Letter", description: "Requests an advance payment from the insurance carrier.", language: "en", template_path: "request-for-advance-payment-letter.pdf", sample_path: "request-for-advance-payment-letter-sample.pdf" },
      { slug: "request-for-consent-to-insurance-claim-settlement", label: "Request for Consent to Insurance Claim Settlement", description: "Requests consent from relevant parties for settlement of an insurance claim.", language: "en", template_path: "request-for-consent-to-insurance-claim-settlement.pdf", sample_path: "request-for-consent-to-insurance-claim-settlement-sample.pdf" },
      { slug: "request-for-mediation-letter", label: "Request for Mediation Letter", description: "Requests mediation to resolve a claim dispute.", language: "en", template_path: "request-for-mediation-letter.pdf", sample_path: "request-for-mediation-letter-sample.pdf" },
      { slug: "reserve-information-request-letter", label: "Reserve Information Request Letter", description: "Requests information from the insurer regarding claim reserves.", language: "en", template_path: "reserve-information-request-letter.pdf", sample_path: "reserve-information-request-letter-sample.pdf" },
      { slug: "residential-construction-contract", label: "Residential Construction Contract", description: "Standard construction contract template for residential property repairs.", language: "en", template_path: "residential-construction-contract.pdf", sample_path: "residential-construction-contract-sample.pdf" },
      { slug: "response-to-reservation-of-rights-letter", label: "Response to Reservation of Rights Letter", description: "Responds to an insurer's reservation of rights letter.", language: "en", template_path: "response-to-reservation-of-rights-letter.pdf", sample_path: "response-to-reservation-of-rights-letter-sample.pdf" },
      { slug: "restaurant-loss-claim-documentation-letter", label: "Restaurant Loss Claim Documentation Letter", description: "Letter template for documenting restaurant loss claims, including spoilage or interruption.", language: "en", template_path: "restaurant-loss-claim-documentation-letter.pdf", sample_path: "restaurant-loss-claim-documentation-letter-sample.pdf" },
      { slug: "roof-damage-claim-documentation-letter", label: "Roof Damage Claim Documentation Letter", description: "Letter template for documenting roof damage claims.", language: "en", template_path: "roof-damage-claim-documentation-letter.pdf", sample_path: "roof-damage-claim-documentation-letter-sample.pdf" },
      { slug: "rough-order-of-magnitude-rom-worksheet", label: "Rough Order of Magnitude (ROM) Worksheet", description: "Worksheet for estimating the rough order of magnitude for claim costs.", language: "en", template_path: "rough-order-of-magnitude-rom-worksheet.pdf", sample_path: "rough-order-of-magnitude-rom-worksheet-sample.pdf" },
      { slug: "scope-of-loss-summary", label: "Scope of Loss Summary", description: "Summary of scope of loss including damages and estimated costs.", language: "en", template_path: "scope-of-loss-summary.pdf", sample_path: "scope-of-loss-summary-sample.pdf" },
      { slug: "settlement-negotiation-letter", label: "Settlement Negotiation Letter", description: "Letter for negotiating a settlement with the insurance carrier.", language: "en", template_path: "settlement-negotiation-letter.pdf", sample_path: "settlement-negotiation-letter-sample.pdf" },
      { slug: "settlement-rejection-and-counteroffer-letter", label: "Settlement Rejection and Counteroffer Letter", description: "Letter rejecting an insurer's settlement offer and presenting a counteroffer.", language: "en", template_path: "settlement-rejection-and-counteroffer-letter.pdf", sample_path: "settlement-rejection-and-counteroffer-letter-sample.pdf" },
      { slug: "supplemental-claim-documentation-letter-detailed-template", label: "Supplemental Claim Documentation Letter (Detailed Template)", description: "Detailed template for submitting supplemental claim documentation.", language: "en", template_path: "supplemental-claim-documentation-letter-detailed-template.pdf", sample_path: "supplemental-claim-documentation-letter-detailed-template-sample.pdf" },
      { slug: "supplemental-claim-documentation-letter", label: "Supplemental Claim Documentation Letter", description: "Template for submitting supplemental claim documentation.", language: "en", template_path: "supplemental-claim-documentation-letter.pdf", sample_path: "supplemental-claim-documentation-letter-sample.pdf" },
      { slug: "sworn-statement-in-proof-of-loss-comprehensive-template", label: "Sworn Statement in Proof of Loss (Comprehensive Template)", description: "Comprehensive version of the proof of loss sworn statement.", language: "en", template_path: "sworn-statement-in-proof-of-loss-comprehensive-template.pdf", sample_path: "sworn-statement-in-proof-of-loss-comprehensive-template-sample.pdf" },
      { slug: "sworn-statement-in-proof-of-loss", label: "Sworn Statement in Proof of Loss", description: "Official sworn statement certifying the details of a loss.", language: "en", template_path: "sworn-statement-in-proof-of-loss.pdf", sample_path: "sworn-statement-in-proof-of-loss-sample.pdf" },
      { slug: "temporary-housing-lease-agreement", label: "Temporary Housing Lease Agreement", description: "Lease agreement template for temporary housing arrangements.", language: "en", template_path: "temporary-housing-lease-agreement.pdf", sample_path: "temporary-housing-lease-agreement-sample.pdf" },
      { slug: "vandalism-and-theft-claim-letter", label: "Vandalism and Theft Claim Letter", description: "Letter template for documenting vandalism and theft damages.", language: "en", template_path: "vandalism-and-theft-claim-letter.pdf", sample_path: "vandalism-and-theft-claim-letter-sample.pdf" },
      { slug: "water-damage-claim-documentation-letter", label: "Water Damage Claim Documentation Letter", description: "Letter template for documenting water damage to property.", language: "en", template_path: "water-damage-claim-documentation-letter.pdf", sample_path: "water-damage-claim-documentation-letter-sample.pdf" },
      { slug: "withheld-depreciation-release-request-letter", label: "Withheld Depreciation Release Request Letter", description: "Request release of withheld depreciation from the insurer.", language: "en", template_path: "withheld-depreciation-release-request-letter.pdf", sample_path: "withheld-depreciation-release-request-letter-sample.pdf" }
    ];

    console.log(`Found ${englishDocuments.length} English documents`);

    // Clear existing documents
    console.log('Clearing existing documents...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('Error clearing documents:', deleteError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to clear existing documents', details: deleteError.message })
      };
    }

    // Insert English documents
    console.log('Inserting English documents...');
    const { data: englishData, error: englishError } = await supabase
      .from('documents')
      .insert(englishDocuments);

    if (englishError) {
      console.error('Error inserting English documents:', englishError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to insert English documents', details: englishError.message })
      };
    }

    // Verify the insertion
    const { data: allDocs, error: verifyError } = await supabase
      .from('documents')
      .select('language')
      .order('language');

    if (verifyError) {
      console.error('Error verifying documents:', verifyError);
    }

    const englishCount = allDocs ? allDocs.filter(doc => doc.language === 'en').length : 0;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Documents populated successfully',
        counts: {
          english: englishCount,
          total: englishCount
        }
      })
    };

  } catch (error) {
    console.error('Error populating documents:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
