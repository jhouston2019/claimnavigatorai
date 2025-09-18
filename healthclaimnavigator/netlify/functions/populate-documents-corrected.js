const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
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

    // CORRECTED: 61 unique English documents (122 total PDF files)
    const englishDocuments = [
      { slug: "additional-living-expenses-ale-reimbursement-request", label: "Additional Living Expenses (ALE) Reimbursement Request", language: "en", template_path: "en/additional-living-expenses-ale-reimbursement-request.pdf", sample_path: "en/additional-living-expenses-ale-reimbursement-request-sample.pdf" },
      { slug: "ale-interim-reimbursement-request-letter", label: "ALE Interim Reimbursement Request Letter", language: "en", template_path: "en/ale-interim-reimbursement-request-letter.pdf", sample_path: "en/ale-interim-reimbursement-request-letter-sample.pdf" },
      { slug: "arbitration-demand-letter", label: "Arbitration Demand Letter", language: "en", template_path: "en/arbitration-demand-letter.pdf", sample_path: "en/arbitration-demand-letter-sample.pdf" },
      { slug: "attorney-referral-engagement-letter", label: "Attorney Referral / Engagement Letter", language: "en", template_path: "en/attorney-referral_engagement-letter.pdf", sample_path: "en/attorney-referral_engagement-letter-sample.pdf" },
      { slug: "authorization-and-direction-to-endorse-insurance-proceeds", label: "Authorization and Direction to Endorse Insurance Proceeds", language: "en", template_path: "en/authorization-and-direction-to-endorse-insurance-proceeds.pdf", sample_path: "en/authorization-and-direction-to-endorse-insurance-proceeds-sample.pdf" },
      { slug: "authorization-for-release-of-insurance-claim-information", label: "Authorization for Release of Insurance Claim Information", language: "en", template_path: "en/authorization-for-release-of-insurance-claim-information.pdf", sample_path: "en/authorization-for-release-of-insurance-claim-information-sample.pdf" },
      { slug: "business-interruption-claim-calculation-worksheet", label: "Business Interruption Claim Calculation Worksheet", language: "en", template_path: "en/business-interruption-claim-calculation-worksheet.pdf", sample_path: "en/business-interruption-claim-calculation-worksheet-sample.pdf" },
      { slug: "business-interruption-claim-presentation", label: "Business Interruption Claim Presentation", language: "en", template_path: "en/business-interruption-claim-presentation.pdf", sample_path: "en/business-interruption-claim-presentation-sample.pdf" },
      { slug: "check-endorsement-instructions-letter", label: "Check Endorsement Instructions Letter", language: "en", template_path: "en/check-endorsement-instructions-letter.pdf", sample_path: "en/check-endorsement-instructions-letter-sample.pdf" },
      { slug: "claim-evidence-checklist", label: "Claim Evidence Checklist", language: "en", template_path: "en/claim-evidence-checklist.pdf", sample_path: "en/claim-evidence-checklist-sample.pdf" },
      { slug: "claim-expense-tracking-log", label: "Claim Expense Tracking Log", language: "en", template_path: "en/claim-expense-tracking-log.pdf", sample_path: "en/claim-expense-tracking-log-sample.pdf" },
      { slug: "claim-summary-report", label: "Claim Summary Report", language: "en", template_path: "en/claim-summary-report.pdf", sample_path: "en/claim-summary-report-sample.pdf" },
      { slug: "commercial-lease-interruption-notice-business-interruption", label: "Commercial Lease Interruption Notice (Business Interruption)", language: "en", template_path: "en/commercial-lease-interruption-notice-business-interruption.pdf", sample_path: "en/commercial-lease-interruption-notice-business-interruption-sample.pdf" },
      { slug: "commercial-tenant-damage-claim-letter", label: "Commercial Tenant Damage Claim Letter", language: "en", template_path: "en/commercial-tenant-damage-claim-letter.pdf", sample_path: "en/commercial-tenant-damage-claim-letter-sample.pdf" },
      { slug: "communication-tracking-system-with-carrier", label: "Communication Tracking System with Carrier", language: "en", template_path: "en/communication-tracking-system-with-carrier.pdf", sample_path: "en/communication-tracking-system-with-carrier-sample.pdf" },
      { slug: "complaint-for-unfair-claims-practices", label: "Complaint for Unfair Claims Practices", language: "en", template_path: "en/complaint-for-unfair-claims-practices.pdf", sample_path: "en/complaint-for-unfair-claims-practices-sample.pdf" },
      { slug: "damage-valuation-report", label: "Damage Valuation Report", language: "en", template_path: "en/damage-valuation-report.pdf", sample_path: "en/damage-valuation-report-sample.pdf" },
      { slug: "demand-for-appraisal-letter", label: "Demand for Appraisal Letter", language: "en", template_path: "en/demand-for-appraisal-letter.pdf", sample_path: "en/demand-for-appraisal-letter-sample.pdf" },
      { slug: "department-of-insurance-complaint-letter", label: "Department of Insurance Complaint Letter", language: "en", template_path: "en/department-of-insurance-complaint-letter.pdf", sample_path: "en/department-of-insurance-complaint-letter-sample.pdf" },
      { slug: "emergency-services-invoice", label: "Emergency Services Invoice", language: "en", template_path: "en/emergency-services-invoice.pdf", sample_path: "en/emergency-services-invoice-sample.pdf" },
      { slug: "evidence-and-photo-documentation-log", label: "Evidence & Photo Documentation Log", language: "en", template_path: "en/evidence-and-photo-documentation-log.pdf", sample_path: "en/evidence-and-photo-documentation-log-sample.pdf" },
      { slug: "expert-engineer-engagement-letter", label: "Expert Engineer Engagement Letter", language: "en", template_path: "en/expert-engineer-engagement-letter.pdf", sample_path: "en/expert-engineer-engagement-letter-sample.pdf" },
      { slug: "final-demand-for-payment-letter", label: "Final Demand for Payment Letter", language: "en", template_path: "en/final-demand-for-payment-letter.pdf", sample_path: "en/final-demand-for-payment-letter-sample.pdf" },
      { slug: "final-settlement-acceptance-letter", label: "Final Settlement Acceptance Letter", language: "en", template_path: "en/final-settlement-acceptance-letter.pdf", sample_path: "en/final-settlement-acceptance-letter-sample.pdf" },
      { slug: "fire-damage-claim-documentation-letter", label: "Fire Damage Claim Documentation Letter", language: "en", template_path: "en/fire-damage-claim-documentation-letter.pdf", sample_path: "en/fire-damage-claim-documentation-letter-sample.pdf" },
      { slug: "first-notice-of-loss-fnol-letter", label: "First Notice of Loss (FNOL) Letter", language: "en", template_path: "en/first-notice-of-loss-fnol-letter.pdf", sample_path: "en/first-notice-of-loss-fnol-letter-sample.pdf" },
      { slug: "flood-claim-documentation-letter", label: "Flood Claim Documentation Letter", language: "en", template_path: "en/flood-claim-documentation-letter.pdf", sample_path: "en/flood-claim-documentation-letter-sample.pdf" },
      { slug: "hurricane-windstorm-claim-documentation-letter", label: "Hurricane / Windstorm Claim Documentation Letter", language: "en", template_path: "en/hurricane_windstorm-claim-documentation-letter.pdf", sample_path: "en/hurricane_windstorm-claim-documentation-letter-sample.pdf" },
      { slug: "industrial-loss-claim-documentation-letter", label: "Industrial Loss Claim Documentation Letter", language: "en", template_path: "en/industrial-loss-claim-documentation-letter.pdf", sample_path: "en/industrial-loss-claim-documentation-letter-sample.pdf" },
      { slug: "insurance-carrier-contact-log", label: "Insurance Carrier Contact Log", language: "en", template_path: "en/insurance-carrier-contact-log.pdf", sample_path: "en/insurance-carrier-contact-log-sample.pdf" },
      { slug: "line-item-estimate-template", label: "Line-Item Estimate Template", language: "en", template_path: "en/line-item-estimate-template.pdf", sample_path: "en/line-item-estimate-sample.pdf" },
      { slug: "mold-claim-documentation-letter", label: "Mold Claim Documentation Letter", language: "en", template_path: "en/mold-claim-documentation-letter.pdf", sample_path: "en/mold-claim-documentation-letter-sample.pdf" },
      { slug: "mortgagee-notification-letter", label: "Mortgagee Notification Letter", language: "en", template_path: "en/mortgagee-notification-letter.pdf", sample_path: "en/mortgagee-notification-letter-sample.pdf" },
      { slug: "notice-of-intent-to-litigate-letter", label: "Notice of Intent to Litigate Letter", language: "en", template_path: "en/notice-of-intent-to-litigate-letter.pdf", sample_path: "en/notice-of-intent-to-litigate-letter-sample.pdf" },
      { slug: "personal-property-inventory-claim-form", label: "Personal Property Inventory Claim Form", language: "en", template_path: "en/personal-property-inventory-claim-form.pdf", sample_path: "en/personal-property-inventory-claim-form-sample.pdf" },
      { slug: "professional-estimate-for-restoration-template", label: "Professional Estimate for Restoration Template", language: "en", template_path: "en/professional-estimate-for-restoration-template.pdf", sample_path: "en/professional-estimate-for-restoration-template-sample.pdf" },
      { slug: "property-claim-submission-checklist", label: "Property Claim Submission Checklist", language: "en", template_path: "en/property-claim-submission-checklist.pdf", sample_path: "en/property-claim-submission-checklist-sample.pdf" },
      { slug: "property-damage-verification-and-documentation-letter", label: "Property Damage Verification & Documentation Letter", language: "en", template_path: "en/property-damage-verification-and-documentation-letter.pdf", sample_path: "en/property-damage-verification-and-documentation-letter-sample.pdf" },
      { slug: "property-damage-verification-and-documentation-statement", label: "Property Damage Verification & Documentation Statement", language: "en", template_path: "en/property-damage-verification-and-documentation-statement.pdf", sample_path: "en/property-damage-verification-and-documentation-statement-sample.pdf" },
      { slug: "property-inspection-scheduling-request-letter", label: "Property Inspection Scheduling Request Letter", language: "en", template_path: "en/property-inspection-scheduling-request-letter.pdf", sample_path: "en/property-inspection-scheduling-request-letter-sample.pdf" },
      { slug: "rebuttal-to-carrier-partial-denial-of-coverage-letter", label: "Rebuttal to Carrier Partial Denial of Coverage Letter", language: "en", template_path: "en/rebuttal-to-carrier-partial-denial-of-coverage-letter.pdf", sample_path: "en/rebuttal-to-carrier-partial-denial-of-coverage-letter-sample.pdf" },
      { slug: "rebuttal-to-wrongful-claim-denial-letter", label: "Rebuttal to Wrongful Claim Denial Letter", language: "en", template_path: "en/rebuttal-to-wrongful-claim-denial-letter.pdf", sample_path: "en/rebuttal-to-wrongful-claim-denial-letter-sample.pdf" },
      { slug: "request-for-advance-payment-letter", label: "Request for Advance Payment Letter", language: "en", template_path: "en/request-for-advance-payment-letter.pdf", sample_path: "en/request-for-advance-payment-letter-sample.pdf" },
      { slug: "request-for-consent-to-insurance-claim-settlement", label: "Request for Consent to Insurance Claim Settlement", language: "en", template_path: "en/request-for-consent-to-insurance-claim-settlement.pdf", sample_path: "en/request-for-consent-to-insurance-claim-settlement-sample.pdf" },
      { slug: "request-for-mediation-letter", label: "Request for Mediation Letter", language: "en", template_path: "en/request-for-mediation-letter.pdf", sample_path: "en/request-for-mediation-letter-sample.pdf" },
      { slug: "reserve-information-request-letter", label: "Reserve Information Request Letter", language: "en", template_path: "en/reserve-information-request-letter.pdf", sample_path: "en/reserve-information-request-letter-sample.pdf" },
      { slug: "residential-construction-contract", label: "Residential Construction Contract", language: "en", template_path: "en/residential-construction-contract.pdf", sample_path: "en/residential-construction-contract-sample.pdf" },
      { slug: "response-to-reservation-of-rights-letter", label: "Response to Reservation of Rights Letter", language: "en", template_path: "en/response-to-reservation-of-rights-letter.pdf", sample_path: "en/response-to-reservation-of-rights-letter-sample.pdf" },
      { slug: "restaurant-loss-claim-documentation-letter", label: "Restaurant Loss Claim Documentation Letter", language: "en", template_path: "en/restaurant-loss-claim-documentation-letter.pdf", sample_path: "en/restaurant-loss-claim-documentation-letter-sample.pdf" },
      { slug: "roof-damage-claim-documentation-letter", label: "Roof Damage Claim Documentation Letter", language: "en", template_path: "en/roof-damage-claim-documentation-letter.pdf", sample_path: "en/roof-damage-claim-documentation-letter-sample.pdf" },
      { slug: "rough-order-of-magnitude-rom-worksheet", label: "Rough Order of Magnitude (ROM) Worksheet", language: "en", template_path: "en/rough-order-of-magnitude-rom-worksheet.pdf", sample_path: "en/rough-order-of-magnitude-rom-worksheet-sample.pdf" },
      { slug: "scope-of-loss-summary", label: "Scope of Loss Summary", language: "en", template_path: "en/scope-of-loss-summary.pdf", sample_path: "en/scope-of-loss-summary-sample.pdf" },
      { slug: "settlement-negotiation-letter", label: "Settlement Negotiation Letter", language: "en", template_path: "en/settlement-negotiation-letter.pdf", sample_path: "en/settlement-negotiation-letter-sample.pdf" },
      { slug: "settlement-rejection-and-counteroffer-letter", label: "Settlement Rejection and Counteroffer Letter", language: "en", template_path: "en/settlement-rejection-and-counteroffer-letter.pdf", sample_path: "en/settlement-rejection-and-counteroffer-letter-sample.pdf" },
      { slug: "supplemental-claim-documentation-letter-detailed-template", label: "Supplemental Claim Documentation Letter (Detailed Template)", language: "en", template_path: "en/supplemental-claim-documentation-letter-detailed-template.pdf", sample_path: "en/supplemental-claim-documentation-letter-detailed-template-sample.pdf" },
      { slug: "supplemental-claim-documentation-letter", label: "Supplemental Claim Documentation Letter", language: "en", template_path: "en/supplemental-claim-documentation-letter.pdf", sample_path: "en/supplemental-claim-documentation-letter-sample.pdf" },
      { slug: "sworn-statement-in-proof-of-loss-comprehensive-template", label: "Sworn Statement in Proof of Loss (Comprehensive Template)", language: "en", template_path: "en/sworn-statement-in-proof-of-loss-comprehensive-template.pdf", sample_path: "en/sworn-statement-in-proof-of-loss-comprehensive-template-sample.pdf" },
      { slug: "sworn-statement-in-proof-of-loss", label: "Sworn Statement in Proof of Loss", language: "en", template_path: "en/sworn-statement-in-proof-of-loss.pdf", sample_path: "en/sworn-statement-in-proof-of-loss-sample.pdf" },
      { slug: "temporary-housing-lease-agreement", label: "Temporary Housing Lease Agreement", language: "en", template_path: "en/temporary-housing-lease-agreement.pdf", sample_path: "en/temporary-housing-lease-agreement-sample.pdf" },
      { slug: "vandalism-and-theft-claim-letter", label: "Vandalism and Theft Claim Letter", language: "en", template_path: "en/vandalism-and-theft-claim-letter.pdf", sample_path: "en/vandalism-and-theft-claim-letter-sample.pdf" },
      { slug: "water-damage-claim-documentation-letter", label: "Water Damage Claim Documentation Letter", language: "en", template_path: "en/water-damage-claim-documentation-letter.pdf", sample_path: "en/water-damage-claim-documentation-letter-sample.pdf" },
      { slug: "withheld-depreciation-release-request-letter", label: "Withheld Depreciation Release Request Letter", language: "en", template_path: "en/withheld-depreciation-release-request-letter.pdf", sample_path: "en/withheld-depreciation-release-request-letter-sample.pdf" }
    ];

    console.log(`Found ${englishDocuments.length} unique English documents (${englishDocuments.length * 2} total PDF files)`);

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
          uniqueEnglishDocuments: englishCount,
          totalEnglishPDFFiles: englishCount * 2,
          totalDocuments: englishCount
        },
        note: 'Each document has 2 versions: template and sample PDF files'
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
