const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Allow both GET and POST methods
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
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

    // Simple document data - just the essential fields
    const englishDocuments = [
      { slug: "additional-living-expenses-ale-reimbursement-request", label: "Additional Living Expenses (ALE) Reimbursement Request", language: "en", template_path: "additional-living-expenses-ale-reimbursement-request.pdf", sample_path: "additional-living-expenses-ale-reimbursement-request-sample.pdf" },
      { slug: "ale-interim-reimbursement-request-letter", label: "ALE Interim Reimbursement Request Letter", language: "en", template_path: "ale-interim-reimbursement-request-letter.pdf", sample_path: "ale-interim-reimbursement-request-letter-sample.pdf" },
      { slug: "arbitration-demand-letter", label: "Arbitration Demand Letter", language: "en", template_path: "arbitration-demand-letter.pdf", sample_path: "arbitration-demand-letter-sample.pdf" },
      { slug: "attorney-referralengagement-letter", label: "Attorney Referral / Engagement Letter", language: "en", template_path: "attorney-referral_engagement-letter.pdf", sample_path: "attorney-referral_engagement-letter-sample.pdf" },
      { slug: "authorization-and-direction-to-endorse-insurance-proceeds", label: "Authorization and Direction to Endorse Insurance Proceeds", language: "en", template_path: "authorization-and-direction-to-endorse-insurance-proceeds.pdf", sample_path: "authorization-and-direction-to-endorse-insurance-proceeds-sample.pdf" },
      { slug: "authorization-for-release-of-insurance-claim-information", label: "Authorization for Release of Insurance Claim Information", language: "en", template_path: "authorization-for-release-of-insurance-claim-information.pdf", sample_path: "authorization-for-release-of-insurance-claim-information-sample.pdf" },
      { slug: "business-interruption-claim-calculation-worksheet", label: "Business Interruption Claim Calculation Worksheet", language: "en", template_path: "business-interruption-claim-calculation-worksheet.pdf", sample_path: "business-interruption-claim-calculation-worksheet-sample.pdf" },
      { slug: "business-interruption-claim-presentation", label: "Business Interruption Claim Presentation", language: "en", template_path: "business-interruption-claim-presentation.pdf", sample_path: "business-interruption-claim-presentation-sample.pdf" },
      { slug: "check-endorsement-instructions-letter", label: "Check Endorsement Instructions Letter", language: "en", template_path: "check-endorsement-instructions-letter.pdf", sample_path: "check-endorsement-instructions-letter-sample.pdf" },
      { slug: "claim-evidence-checklist", label: "Claim Evidence Checklist", language: "en", template_path: "claim-evidence-checklist.pdf", sample_path: "claim-evidence-checklist-sample.pdf" },
      { slug: "claim-expense-tracking-log", label: "Claim Expense Tracking Log", language: "en", template_path: "claim-expense-tracking-log.pdf", sample_path: "claim-expense-tracking-log-sample.pdf" },
      { slug: "claim-summary-report", label: "Claim Summary Report", language: "en", template_path: "claim-summary-report.pdf", sample_path: "claim-summary-report-sample.pdf" },
      { slug: "commercial-lease-interruption-notice-business-interruption", label: "Commercial Lease Interruption Notice (Business Interruption)", language: "en", template_path: "commercial-lease-interruption-notice-business-interruption.pdf", sample_path: "commercial-lease-interruption-notice-business-interruption-sample.pdf" },
      { slug: "commercial-tenant-damage-claim-letter", label: "Commercial Tenant Damage Claim Letter", language: "en", template_path: "commercial-tenant-damage-claim-letter.pdf", sample_path: "commercial-tenant-damage-claim-letter-sample.pdf" },
      { slug: "communication-tracking-system-with-carrier", label: "Communication Tracking System with Carrier", language: "en", template_path: "communication-tracking-system-with-carrier.pdf", sample_path: "communication-tracking-system-with-carrier-sample.pdf" },
      { slug: "complaint-for-unfair-claims-practices", label: "Complaint for Unfair Claims Practices", language: "en", template_path: "complaint-for-unfair-claims-practices.pdf", sample_path: "complaint-for-unfair-claims-practices-sample.pdf" },
      { slug: "damage-valuation-report", label: "Damage Valuation Report", language: "en", template_path: "damage-valuation-report.pdf", sample_path: "damage-valuation-report-sample.pdf" },
      { slug: "demand-for-appraisal-letter", label: "Demand for Appraisal Letter", language: "en", template_path: "demand-for-appraisal-letter.pdf", sample_path: "demand-for-appraisal-letter-sample.pdf" },
      { slug: "department-of-insurance-complaint-letter", label: "Department of Insurance Complaint Letter", language: "en", template_path: "department-of-insurance-complaint-letter.pdf", sample_path: "department-of-insurance-complaint-letter-sample.pdf" },
      { slug: "emergency-services-invoice", label: "Emergency Services Invoice", language: "en", template_path: "emergency-services-invoice.pdf", sample_path: "emergency-services-invoice-sample.pdf" },
      { slug: "evidence-and-photo-documentation-log", label: "Evidence & Photo Documentation Log", language: "en", template_path: "evidence-and-photo-documentation-log.pdf", sample_path: "evidence-and-photo-documentation-log-sample.pdf" },
      { slug: "expert-engineer-engagement-letter", label: "Expert Engineer Engagement Letter", language: "en", template_path: "expert-engineer-engagement-letter.pdf", sample_path: "expert-engineer-engagement-letter-sample.pdf" },
      { slug: "final-demand-for-payment-letter", label: "Final Demand for Payment Letter", language: "en", template_path: "final-demand-for-payment-letter.pdf", sample_path: "final-demand-for-payment-letter-sample.pdf" },
      { slug: "final-settlement-acceptance-letter", label: "Final Settlement Acceptance Letter", language: "en", template_path: "final-settlement-acceptance-letter.pdf", sample_path: "final-settlement-acceptance-letter-sample.pdf" },
      { slug: "fire-damage-claim-documentation-letter", label: "Fire Damage Claim Documentation Letter", language: "en", template_path: "fire-damage-claim-documentation-letter.pdf", sample_path: "fire-damage-claim-documentation-letter-sample.pdf" },
      { slug: "first-notice-of-loss-fnol-letter", label: "First Notice of Loss (FNOL) Letter", language: "en", template_path: "first-notice-of-loss-fnol-letter.pdf", sample_path: "first-notice-of-loss-fnol-letter-sample.pdf" },
      { slug: "flood-claim-documentation-letter", label: "Flood Claim Documentation Letter", language: "en", template_path: "flood-claim-documentation-letter.pdf", sample_path: "flood-claim-documentation-letter-sample.pdf" },
      { slug: "hurricanewindstorm-claim-documentation-letter", label: "Hurricane / Windstorm Claim Documentation Letter", language: "en", template_path: "hurricane_windstorm-claim-documentation-letter.pdf", sample_path: "hurricane_windstorm-claim-documentation-letter-sample.pdf" },
      { slug: "industrial-loss-claim-documentation-letter", label: "Industrial Loss Claim Documentation Letter", language: "en", template_path: "industrial-loss-claim-documentation-letter.pdf", sample_path: "industrial-loss-claim-documentation-letter-sample.pdf" },
      { slug: "insurance-carrier-contact-log", label: "Insurance Carrier Contact Log", language: "en", template_path: "insurance-carrier-contact-log.pdf", sample_path: "insurance-carrier-contact-log-sample.pdf" },
      { slug: "line-item-estimate", label: "Line-Item Estimate Template", language: "en", template_path: "line-item-estimate.pdf", sample_path: "line-item-estimate-sample.pdf" },
      { slug: "line-item-estimate-template", label: "Line-Item Estimate Template", language: "en", template_path: "line-item-estimate-template.pdf", sample_path: "line-item-estimate-template-sample.pdf" },
      { slug: "mold-claim-documentation-letter", label: "Mold Claim Documentation Letter", language: "en", template_path: "mold-claim-documentation-letter.pdf", sample_path: "mold-claim-documentation-letter-sample.pdf" },
      { slug: "mortgagee-notification-letter", label: "Mortgagee Notification Letter", language: "en", template_path: "mortgagee-notification-letter.pdf", sample_path: "mortgagee-notification-letter-sample.pdf" },
      { slug: "notice-of-intent-to-litigate-letter", label: "Notice of Intent to Litigate Letter", language: "en", template_path: "notice-of-intent-to-litigate-letter.pdf", sample_path: "notice-of-intent-to-litigate-letter-sample.pdf" },
      { slug: "personal-property-inventory-claim-form", label: "Personal Property Inventory Claim Form", language: "en", template_path: "personal-property-inventory-claim-form.pdf", sample_path: "personal-property-inventory-claim-form-sample.pdf" },
      { slug: "professional-estimate-for-restoration-template", label: "Professional Estimate for Restoration Template", language: "en", template_path: "professional-estimate-for-restoration-template.pdf", sample_path: "professional-estimate-for-restoration-template-sample.pdf" },
      { slug: "property-claim-submission-checklist", label: "Property Claim Submission Checklist", language: "en", template_path: "property-claim-submission-checklist.pdf", sample_path: "property-claim-submission-checklist-sample.pdf" },
      { slug: "property-damage-verification-and-documentation-letter", label: "Property Damage Verification & Documentation Letter", language: "en", template_path: "property-damage-verification-and-documentation-letter.pdf", sample_path: "property-damage-verification-and-documentation-letter-sample.pdf" },
      { slug: "property-damage-verification-and-documentation-statement", label: "Property Damage Verification & Documentation Statement", language: "en", template_path: "property-damage-verification-and-documentation-statement.pdf", sample_path: "property-damage-verification-and-documentation-statement-sample.pdf" },
      { slug: "property-inspection-scheduling-request-letter", label: "Property Inspection Scheduling Request Letter", language: "en", template_path: "property-inspection-scheduling-request-letter.pdf", sample_path: "property-inspection-scheduling-request-letter-sample.pdf" },
      { slug: "rebuttal-to-carrier-partial-denial-of-coverage-letter", label: "Rebuttal to Carrier Partial Denial of Coverage Letter", language: "en", template_path: "rebuttal-to-carrier-partial-denial-of-coverage-letter.pdf", sample_path: "rebuttal-to-carrier-partial-denial-of-coverage-letter-sample.pdf" },
      { slug: "rebuttal-to-wrongful-claim-denial-letter", label: "Rebuttal to Wrongful Claim Denial Letter", language: "en", template_path: "rebuttal-to-wrongful-claim-denial-letter.pdf", sample_path: "rebuttal-to-wrongful-claim-denial-letter-sample.pdf" },
      { slug: "request-for-advance-payment-letter", label: "Request for Advance Payment Letter", language: "en", template_path: "request-for-advance-payment-letter.pdf", sample_path: "request-for-advance-payment-letter-sample.pdf" },
      { slug: "request-for-consent-to-insurance-claim-settlement", label: "Request for Consent to Insurance Claim Settlement", language: "en", template_path: "request-for-consent-to-insurance-claim-settlement.pdf", sample_path: "request-for-consent-to-insurance-claim-settlement-sample.pdf" },
      { slug: "request-for-mediation-letter", label: "Request for Mediation Letter", language: "en", template_path: "request-for-mediation-letter.pdf", sample_path: "request-for-mediation-letter-sample.pdf" },
      { slug: "reserve-information-request-letter", label: "Reserve Information Request Letter", language: "en", template_path: "reserve-information-request-letter.pdf", sample_path: "reserve-information-request-letter-sample.pdf" },
      { slug: "residential-construction-contract", label: "Residential Construction Contract", language: "en", template_path: "residential-construction-contract.pdf", sample_path: "residential-construction-contract-sample.pdf" },
      { slug: "response-to-reservation-of-rights-letter", label: "Response to Reservation of Rights Letter", language: "en", template_path: "response-to-reservation-of-rights-letter.pdf", sample_path: "response-to-reservation-of-rights-letter-sample.pdf" },
      { slug: "restaurant-loss-claim-documentation-letter", label: "Restaurant Loss Claim Documentation Letter", language: "en", template_path: "restaurant-loss-claim-documentation-letter.pdf", sample_path: "restaurant-loss-claim-documentation-letter-sample.pdf" },
      { slug: "roof-damage-claim-documentation-letter", label: "Roof Damage Claim Documentation Letter", language: "en", template_path: "roof-damage-claim-documentation-letter.pdf", sample_path: "roof-damage-claim-documentation-letter-sample.pdf" },
      { slug: "rough-order-of-magnitude-rom-worksheet", label: "Rough Order of Magnitude (ROM) Worksheet", language: "en", template_path: "rough-order-of-magnitude-rom-worksheet.pdf", sample_path: "rough-order-of-magnitude-rom-worksheet-sample.pdf" },
      { slug: "scope-of-loss-summary", label: "Scope of Loss Summary", language: "en", template_path: "scope-of-loss-summary.pdf", sample_path: "scope-of-loss-summary-sample.pdf" },
      { slug: "settlement-negotiation-letter", label: "Settlement Negotiation Letter", language: "en", template_path: "settlement-negotiation-letter.pdf", sample_path: "settlement-negotiation-letter-sample.pdf" },
      { slug: "settlement-rejection-and-counteroffer-letter", label: "Settlement Rejection and Counteroffer Letter", language: "en", template_path: "settlement-rejection-and-counteroffer-letter.pdf", sample_path: "settlement-rejection-and-counteroffer-letter-sample.pdf" },
      { slug: "supplemental-claim-documentation-letter-detailed-template", label: "Supplemental Claim Documentation Letter (Detailed Template)", language: "en", template_path: "supplemental-claim-documentation-letter-detailed-template.pdf", sample_path: "supplemental-claim-documentation-letter-detailed-template-sample.pdf" },
      { slug: "supplemental-claim-documentation-letter", label: "Supplemental Claim Documentation Letter", language: "en", template_path: "supplemental-claim-documentation-letter.pdf", sample_path: "supplemental-claim-documentation-letter-sample.pdf" },
      { slug: "sworn-statement-in-proof-of-loss-comprehensive-template", label: "Sworn Statement in Proof of Loss (Comprehensive Template)", language: "en", template_path: "sworn-statement-in-proof-of-loss-comprehensive-template.pdf", sample_path: "sworn-statement-in-proof-of-loss-comprehensive-template-sample.pdf" },
      { slug: "sworn-statement-in-proof-of-loss", label: "Sworn Statement in Proof of Loss", language: "en", template_path: "sworn-statement-in-proof-of-loss.pdf", sample_path: "sworn-statement-in-proof-of-loss-sample.pdf" },
      { slug: "temporary-housing-lease-agreement", label: "Temporary Housing Lease Agreement", language: "en", template_path: "temporary-housing-lease-agreement.pdf", sample_path: "temporary-housing-lease-agreement-sample.pdf" },
      { slug: "vandalism-and-theft-claim-letter", label: "Vandalism and Theft Claim Letter", language: "en", template_path: "vandalism-and-theft-claim-letter.pdf", sample_path: "vandalism-and-theft-claim-letter-sample.pdf" },
      { slug: "water-damage-claim-documentation-letter", label: "Water Damage Claim Documentation Letter", language: "en", template_path: "water-damage-claim-documentation-letter.pdf", sample_path: "water-damage-claim-documentation-letter-sample.pdf" },
      { slug: "withheld-depreciation-release-request-letter", label: "Withheld Depreciation Release Request Letter", language: "en", template_path: "withheld-depreciation-release-request-letter.pdf", sample_path: "withheld-depreciation-release-request-letter-sample.pdf" }
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
