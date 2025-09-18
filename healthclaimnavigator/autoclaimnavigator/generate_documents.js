// Script to generate comprehensive documents.json with 122 entries
const documents = {};

// Core Claim Documents (8)
const coreClaims = [
  { slug: "claim-form", label: "Standard Claim Form", desc: "Standard claim form for property damage and business interruption claims." },
  { slug: "proof-of-loss", label: "Proof of Loss Documentation", desc: "Comprehensive proof of loss documentation template with detailed itemization." },
  { slug: "damage-assessment", label: "Damage Assessment Report", desc: "Professional damage assessment and documentation form with photographic evidence guidelines." },
  { slug: "evidence-log", label: "Evidence Documentation Log", desc: "Systematic evidence tracking and documentation log for claim support materials." },
  { slug: "first-notice-of-loss", label: "First Notice of Loss", desc: "Initial loss notification form with immediate action items and timeline requirements." },
  { slug: "claim-sequence-guide", label: "Claim Sequence Guide", desc: "Step-by-step guide for proper claim filing sequence and documentation requirements." },
  { slug: "loss-notice", label: "Loss Notice Form", desc: "Formal loss notice with immediate reporting requirements and emergency contact information." },
  { slug: "claim-summary", label: "Claim Summary Report", desc: "Executive summary of claim details, timeline, and current status for management review." }
];

// Legal Documents (15)
const legalDocs = [
  { slug: "demand-letter", label: "Payment Demand Letter", desc: "Professional demand letter template for payment requests with legal precedent references." },
  { slug: "complaint-letter", label: "Formal Complaint Letter", desc: "Formal complaint letter for claim disputes with regulatory body notification guidelines." },
  { slug: "appeal-letter", label: "Claim Appeal Letter", desc: "Professional appeal letter for denied claims with supporting documentation requirements." },
  { slug: "mediation-request", label: "Mediation Request Form", desc: "Formal request for mediation services to resolve claim disputes amicably." },
  { slug: "settlement-offer", label: "Settlement Offer Letter", desc: "Professional settlement offer letter with negotiation terms and conditions." },
  { slug: "arbitration-request", label: "Arbitration Request", desc: "Request for binding arbitration to resolve claim disputes outside of court." },
  { slug: "cease-desist", label: "Cease and Desist Letter", desc: "Legal notice to stop specific actions or behaviors related to claim handling." },
  { slug: "breach-notice", label: "Breach of Contract Notice", desc: "Formal notice of contract breach with specific violations and remedies." },
  { slug: "bad-faith-letter", label: "Bad Faith Insurance Letter", desc: "Legal notice alleging bad faith practices with supporting documentation." },
  { slug: "coverage-opinion", label: "Coverage Opinion Request", desc: "Request for legal opinion on policy coverage interpretation and application." },
  { slug: "subrogation-notice", label: "Subrogation Notice", desc: "Notice of subrogation rights and recovery actions against third parties." },
  { slug: "liability-demand", label: "Liability Demand Letter", desc: "Demand for liability coverage and defense under insurance policy terms." },
  { slug: "declaratory-judgment", label: "Declaratory Judgment Request", desc: "Request for court declaration on policy coverage and obligations." },
  { slug: "class-action-notice", label: "Class Action Notice", desc: "Notice of class action participation and opt-out procedures." },
  { slug: "regulatory-filing", label: "Regulatory Filing Form", desc: "Formal filing with insurance regulatory authorities for claim disputes." }
];

// Financial Documents (12)
const financialDocs = [
  { slug: "payment-demand", label: "Payment Demand Letter", desc: "Formal payment demand with timeline requirements and legal consequences outlined." },
  { slug: "coverage-demand", label: "Coverage Demand Letter", desc: "Coverage demand letter for policy interpretation disputes with legal precedent citations." },
  { slug: "timeline-demand", label: "Timeline Demand Letter", desc: "Formal demand for specific timeline compliance with regulatory requirements." },
  { slug: "ale-reimbursement-request", label: "Additional Living Expenses Request", desc: "Request reimbursement for temporary housing, meals, or related living expenses." },
  { slug: "business-interruption-claim", label: "Business Interruption Claim", desc: "Comprehensive business interruption claim documentation and financial impact analysis." },
  { slug: "lost-income-calculation", label: "Lost Income Calculation", desc: "Detailed calculation of lost income and business interruption damages." },
  { slug: "expense-reimbursement", label: "Expense Reimbursement Form", desc: "Request for reimbursement of out-of-pocket expenses related to covered loss." },
  { slug: "depreciation-schedule", label: "Depreciation Schedule", desc: "Detailed depreciation calculation for property and equipment losses." },
  { slug: "replacement-cost-analysis", label: "Replacement Cost Analysis", desc: "Analysis of replacement costs versus actual cash value for property losses." },
  { slug: "contingent-business-interruption", label: "Contingent Business Interruption", desc: "Claim for business interruption due to supplier or customer property damage." },
  { slug: "extra-expense-claim", label: "Extra Expense Claim", desc: "Claim for additional expenses incurred to minimize business interruption." },
  { slug: "rental-income-loss", label: "Rental Income Loss Claim", desc: "Claim for lost rental income due to property damage or business interruption." }
];

// Forms and Requests (20)
const formsRequests = [
  { slug: "document-request", label: "Document Request Form", desc: "Formal request for additional documentation from insurer with legal basis." },
  { slug: "estimate-request", label: "Independent Estimate Request", desc: "Request for independent estimate or appraisal with qualified professional requirements." },
  { slug: "expert-opinion-request", label: "Expert Opinion Request", desc: "Request for expert opinion on damage assessment or policy interpretation." },
  { slug: "inspection-request", label: "Property Inspection Request", desc: "Request for property inspection or re-inspection with specific focus areas." },
  { slug: "medical-records-request", label: "Medical Records Request", desc: "HIPAA-compliant request for medical records related to injury claims." },
  { slug: "repair-authorization", label: "Repair Authorization Form", desc: "Authorization form for emergency repairs with cost documentation requirements." },
  { slug: "witness-statement", label: "Witness Statement Form", desc: "Comprehensive witness statement form with notarization requirements." },
  { slug: "police-report-request", label: "Police Report Request", desc: "Request for official police reports related to covered incidents." },
  { slug: "fire-department-report", label: "Fire Department Report Request", desc: "Request for fire department incident reports and investigation findings." },
  { slug: "weather-service-report", label: "Weather Service Report Request", desc: "Request for official weather service reports for weather-related claims." },
  { slug: "contractor-estimate", label: "Contractor Estimate Request", desc: "Request for detailed contractor estimates for repair and replacement costs." },
  { slug: "appraisal-request", label: "Appraisal Request Form", desc: "Request for formal appraisal process under policy appraisal clause." },
  { slug: "umpire-selection", label: "Umpire Selection Form", desc: "Form for selecting neutral umpire in appraisal process disputes." },
  { slug: "examination-under-oath", label: "Examination Under Oath Request", desc: "Request for examination under oath with legal representation guidelines." },
  { slug: "recorded-statement", label: "Recorded Statement Request", desc: "Request for recorded statement with legal rights and representation notice." },
  { slug: "surveillance-notice", label: "Surveillance Notice Response", desc: "Response to surveillance activities with privacy rights and legal protections." },
  { slug: "independent-medical-exam", label: "Independent Medical Exam Request", desc: "Request for independent medical examination with physician selection criteria." },
  { slug: "functional-capacity-eval", label: "Functional Capacity Evaluation", desc: "Request for functional capacity evaluation for disability and injury claims." },
  { slug: "vocational-assessment", label: "Vocational Assessment Request", desc: "Request for vocational assessment and earning capacity evaluation." },
  { slug: "life-care-plan", label: "Life Care Plan Request", desc: "Request for comprehensive life care plan for catastrophic injury claims." }
];

// Appeals and Disputes (10)
const appealsDisputes = [
  { slug: "internal-appeal", label: "Internal Appeal Process", desc: "Internal appeal process documentation and templates for claim reconsideration." },
  { slug: "external-appeal", label: "External Appeal Documentation", desc: "External appeal and regulatory complaint templates with filing requirements." },
  { slug: "regulatory-complaint", label: "Regulatory Complaint Form", desc: "Formal complaint to insurance regulatory body with supporting documentation." },
  { slug: "ombudsman-complaint", label: "Ombudsman Complaint", desc: "Complaint to insurance ombudsman for dispute resolution assistance." },
  { slug: "department-of-insurance", label: "Department of Insurance Complaint", desc: "Formal complaint to state department of insurance with regulatory violations." },
  { slug: "naic-complaint", label: "NAIC Complaint Form", desc: "Complaint to National Association of Insurance Commissioners for regulatory oversight." },
  { slug: "better-business-bureau", label: "Better Business Bureau Complaint", desc: "Complaint to Better Business Bureau for business practice violations." },
  { slug: "consumer-protection", label: "Consumer Protection Complaint", desc: "Complaint to consumer protection agency for unfair business practices." },
  { slug: "attorney-general", label: "Attorney General Complaint", desc: "Complaint to state attorney general for insurance law violations." },
  { slug: "federal-trade-commission", label: "FTC Complaint Form", desc: "Complaint to Federal Trade Commission for deceptive business practices." }
];

// Specialty Documents (15)
const specialtyDocs = [
  { slug: "evidence-log-excel", label: "Evidence Log Spreadsheet", desc: "Comprehensive evidence tracking spreadsheet with formulas and categorization." },
  { slug: "claim-timeline", label: "Claim Timeline Template", desc: "Detailed timeline template for documenting claim events and correspondence." },
  { slug: "correspondence-log", label: "Correspondence Log", desc: "Systematic log of all claim-related correspondence and communications." },
  { slug: "phone-call-log", label: "Phone Call Log", desc: "Detailed log of all phone conversations with claim representatives and adjusters." },
  { slug: "email-correspondence", label: "Email Correspondence Template", desc: "Professional email templates for various claim-related communications." },
  { slug: "fax-cover-sheet", label: "Fax Cover Sheet", desc: "Professional fax cover sheet for document transmission with delivery confirmation." },
  { slug: "certified-mail", label: "Certified Mail Receipt", desc: "Template for certified mail documentation with return receipt requests." },
  { slug: "affidavit-template", label: "Affidavit Template", desc: "Legal affidavit template for sworn statements and declarations." },
  { slug: "notarization-request", label: "Notarization Request Form", desc: "Request form for notarization services with identification requirements." },
  { slug: "photograph-log", label: "Photograph Documentation Log", desc: "Systematic log for photographing and documenting property damage." },
  { slug: "video-evidence", label: "Video Evidence Log", desc: "Log for video evidence documentation with chain of custody requirements." },
  { slug: "receipt-organization", label: "Receipt Organization System", desc: "System for organizing and categorizing expense receipts and invoices." },
  { slug: "inventory-list", label: "Property Inventory List", desc: "Comprehensive inventory list for personal property and business equipment." },
  { slug: "valuation-worksheet", label: "Property Valuation Worksheet", desc: "Worksheet for calculating property values and replacement costs." },
  { slug: "depreciation-calculator", label: "Depreciation Calculator", desc: "Calculator for determining depreciation on various types of property." }
];

// Property-Specific Documents (20)
const propertyDocs = [
  { slug: "residential-property", label: "Residential Property Claim", desc: "Specialized claim form for residential property damage and loss." },
  { slug: "commercial-property", label: "Commercial Property Claim", desc: "Comprehensive claim form for commercial property damage and business interruption." },
  { slug: "condo-association", label: "Condo Association Claim", desc: "Claim form for condominium association property and common area damage." },
  { slug: "homeowners-association", label: "HOA Property Claim", desc: "Claim form for homeowners association property and amenity damage." },
  { slug: "rental-property", label: "Rental Property Claim", desc: "Claim form for rental property damage with tenant notification requirements." },
  { slug: "vacation-rental", label: "Vacation Rental Claim", desc: "Specialized claim form for vacation rental property damage and loss of income." },
  { slug: "manufactured-home", label: "Manufactured Home Claim", desc: "Claim form for manufactured home damage with special valuation considerations." },
  { slug: "mobile-home", label: "Mobile Home Claim", desc: "Claim form for mobile home damage with transportation and setup costs." },
  { slug: "farm-property", label: "Farm Property Claim", desc: "Comprehensive claim form for farm property including crops, livestock, and equipment." },
  { slug: "ranch-property", label: "Ranch Property Claim", desc: "Specialized claim form for ranch property including livestock and grazing land." },
  { slug: "vineyard-property", label: "Vineyard Property Claim", desc: "Claim form for vineyard property including crops, equipment, and wine inventory." },
  { slug: "orchard-property", label: "Orchard Property Claim", desc: "Claim form for orchard property including trees, crops, and harvesting equipment." },
  { slug: "greenhouse-property", label: "Greenhouse Property Claim", desc: "Claim form for greenhouse property including structures, equipment, and plants." },
  { slug: "aquaculture-property", label: "Aquaculture Property Claim", desc: "Claim form for aquaculture property including fish, equipment, and facilities." },
  { slug: "timber-property", label: "Timber Property Claim", desc: "Claim form for timber property including trees, logging equipment, and access roads." },
  { slug: "mining-property", label: "Mining Property Claim", desc: "Claim form for mining property including equipment, facilities, and mineral rights." },
  { slug: "oil-gas-property", label: "Oil & Gas Property Claim", desc: "Claim form for oil and gas property including wells, equipment, and facilities." },
  { slug: "renewable-energy", label: "Renewable Energy Property Claim", desc: "Claim form for renewable energy property including solar, wind, and hydro facilities." },
  { slug: "telecommunications", label: "Telecommunications Property Claim", desc: "Claim form for telecommunications property including towers, equipment, and facilities." },
  { slug: "transportation-property", label: "Transportation Property Claim", desc: "Claim form for transportation property including vehicles, equipment, and facilities." }
];

// Business-Specific Documents (15)
const businessDocs = [
  { slug: "restaurant-business", label: "Restaurant Business Claim", desc: "Comprehensive claim form for restaurant business interruption and property damage." },
  { slug: "retail-business", label: "Retail Business Claim", desc: "Claim form for retail business including inventory, fixtures, and business interruption." },
  { slug: "manufacturing-business", label: "Manufacturing Business Claim", desc: "Claim form for manufacturing business including equipment, inventory, and production loss." },
  { slug: "construction-business", label: "Construction Business Claim", desc: "Claim form for construction business including equipment, materials, and project delays." },
  { slug: "healthcare-business", label: "Healthcare Business Claim", desc: "Claim form for healthcare business including equipment, facilities, and patient care interruption." },
  { slug: "professional-services", label: "Professional Services Claim", desc: "Claim form for professional services business including office equipment and client loss." },
  { slug: "technology-business", label: "Technology Business Claim", desc: "Claim form for technology business including equipment, data, and business interruption." },
  { slug: "hospitality-business", label: "Hospitality Business Claim", desc: "Claim form for hospitality business including facilities, equipment, and guest services." },
  { slug: "education-business", label: "Education Business Claim", desc: "Claim form for education business including facilities, equipment, and student services." },
  { slug: "fitness-business", label: "Fitness Business Claim", desc: "Claim form for fitness business including equipment, facilities, and membership services." },
  { slug: "beauty-business", label: "Beauty Business Claim", desc: "Claim form for beauty business including equipment, supplies, and client services." },
  { slug: "automotive-business", label: "Automotive Business Claim", desc: "Claim form for automotive business including equipment, inventory, and service interruption." },
  { slug: "agricultural-business", label: "Agricultural Business Claim", desc: "Claim form for agricultural business including crops, livestock, and equipment." },
  { slug: "transportation-business", label: "Transportation Business Claim", desc: "Claim form for transportation business including vehicles, equipment, and service interruption." },
  { slug: "warehouse-business", label: "Warehouse Business Claim", desc: "Claim form for warehouse business including inventory, equipment, and storage facilities." }
];

// Catastrophic Event Documents (7)
const catastrophicDocs = [
  { slug: "hurricane-claim", label: "Hurricane Damage Claim", desc: "Specialized claim form for hurricane damage including wind, water, and flood damage." },
  { slug: "flood-claim", label: "Flood Damage Claim", desc: "Comprehensive claim form for flood damage including property and contents." },
  { slug: "wildfire-claim", label: "Wildfire Damage Claim", desc: "Claim form for wildfire damage including property, contents, and evacuation expenses." },
  { slug: "earthquake-claim", label: "Earthquake Damage Claim", desc: "Claim form for earthquake damage including structural and contents damage." },
  { slug: "tornado-claim", label: "Tornado Damage Claim", desc: "Claim form for tornado damage including wind and debris damage." },
  { slug: "hail-claim", label: "Hail Damage Claim", desc: "Claim form for hail damage including roof, siding, and vehicle damage." },
  { slug: "winter-storm-claim", label: "Winter Storm Claim", desc: "Claim form for winter storm damage including ice, snow, and freeze damage." }
];

// Combine all document categories
const allDocs = [
  ...coreClaims,
  ...legalDocs,
  ...financialDocs,
  ...formsRequests,
  ...appealsDisputes,
  ...specialtyDocs,
  ...propertyDocs,
  ...businessDocs,
  ...catastrophicDocs
];

// Generate the documents object
allDocs.forEach(doc => {
  documents[doc.slug] = {
    slug: doc.slug,
    label: doc.label,
    description: doc.desc,
    templatePath: `/assets/docs/${doc.slug}.pdf`,
    samplePath: `/assets/docs/${doc.slug}-sample.pdf`
  };
});

// Output the JSON
console.log(JSON.stringify(documents, null, 2));
