const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { docKey, inputs } = JSON.parse(event.body || '{}');
    
    if (!docKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing docKey parameter' })
      };
    }

    // Route to appropriate document generator
    const result = await generateDocument(docKey, inputs);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Document generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Document generation failed',
        message: error.message 
      })
    };
  }
};

async function generateDocument(docKey, inputs) {
  // Document generation routing
  switch (docKey) {
    case 'proof-of-loss':
      return await generateProofOfLoss(inputs);
    case 'demand-letter':
      return await generateDemandLetter(inputs);
    case 'appeal-letter':
      return await generateAppealLetter(inputs);
    case 'damage-assessment':
      return await generateDamageAssessment(inputs);
    case 'business-interruption-claim':
      return await generateBusinessInterruptionClaim(inputs);
    case 'depreciation-schedule':
      return await generateDepreciationSchedule(inputs);
    case 'claim-timeline':
      return await generateClaimTimeline(inputs);
    case 'evidence-log':
      return await generateEvidenceLog(inputs);
    case 'settlement-offer':
      return await generateSettlementOffer(inputs);
    case 'expense-reimbursement':
      return await generateExpenseReimbursement(inputs);
    case 'appraisal-request':
      return await generateAppraisalRequest(inputs);
    case 'regulatory-complaint':
      return await generateRegulatoryComplaint(inputs);
    case 'hurricane-claim':
      return await generateHurricaneClaim(inputs);
    case 'flood-claim':
      return await generateFloodClaim(inputs);
    case 'wildfire-claim':
      return await generateWildfireClaim(inputs);
    case 'earthquake-claim':
      return await generateEarthquakeClaim(inputs);
    case 'residential-property':
      return await generateResidentialProperty(inputs);
    case 'commercial-property':
      return await generateCommercialProperty(inputs);
    case 'restaurant-business':
      return await generateRestaurantBusiness(inputs);
    case 'retail-business':
      return await generateRetailBusiness(inputs);
    case 'manufacturing-business':
      return await generateManufacturingBusiness(inputs);
    case 'healthcare-business':
      return await generateHealthcareBusiness(inputs);
    case 'professional-services':
      return await generateProfessionalServices(inputs);
    case 'technology-business':
      return await generateTechnologyBusiness(inputs);
    case 'hospitality-business':
      return await generateHospitalityBusiness(inputs);
    case 'education-business':
      return await generateEducationBusiness(inputs);
    case 'fitness-business':
      return await generateFitnessBusiness(inputs);
    case 'beauty-business':
      return await generateBeautyBusiness(inputs);
    case 'automotive-business':
      return await generateAutomotiveBusiness(inputs);
    case 'agricultural-business':
      return await generateAgriculturalBusiness(inputs);
    case 'transportation-business':
      return await generateTransportationBusiness(inputs);
    case 'warehouse-business':
      return await generateWarehouseBusiness(inputs);
    case 'tornado-claim':
      return await generateTornadoClaim(inputs);
    case 'hail-claim':
      return await generateHailClaim(inputs);
    case 'winter-storm-claim':
      return await generateWinterStormClaim(inputs);
    case 'condo-association':
      return await generateCondoAssociation(inputs);
    case 'homeowners-association':
      return await generateHomeownersAssociation(inputs);
    case 'rental-property':
      return await generateRentalProperty(inputs);
    case 'vacation-rental':
      return await generateVacationRental(inputs);
    case 'manufactured-home':
      return await generateManufacturedHome(inputs);
    case 'mobile-home':
      return await generateMobileHome(inputs);
    case 'farm-property':
      return await generateFarmProperty(inputs);
    case 'ranch-property':
      return await generateRanchProperty(inputs);
    case 'vineyard-property':
      return await generateVineyardProperty(inputs);
    case 'orchard-property':
      return await generateOrchardProperty(inputs);
    case 'greenhouse-property':
      return await generateGreenhouseProperty(inputs);
    case 'aquaculture-property':
      return await generateAquacultureProperty(inputs);
    case 'timber-property':
      return await generateTimberProperty(inputs);
    case 'mining-property':
      return await generateMiningProperty(inputs);
    case 'oil-gas-property':
      return await generateOilGasProperty(inputs);
    case 'renewable-energy':
      return await generateRenewableEnergy(inputs);
    case 'telecommunications':
      return await generateTelecommunications(inputs);
    case 'transportation-property':
      return await generateTransportationProperty(inputs);
    default:
      return await generateGenericDocument(docKey, inputs);
  }
}

// Document generation functions
async function generateProofOfLoss(inputs) {
  const prompt = `Generate a comprehensive Proof of Loss Documentation for the following claim:

Claimant: ${inputs.claimantName}
Policy Number: ${inputs.policyNumber}
Claim Number: ${inputs.claimNumber}
Loss Date: ${inputs.lossDate}
Property Address: ${inputs.propertyAddress}
Estimated Loss: $${inputs.estimatedLoss}
Description: ${inputs.lossDescription}
Contact: ${inputs.contactPhone || 'Not provided'} / ${inputs.contactEmail || 'Not provided'}

Create a professional, legally sound proof of loss document that includes:
1. Proper header with all claim information
2. Detailed description of the loss
3. Itemized list of damaged property
4. Supporting documentation requirements
5. Professional formatting suitable for insurance submission

Format as HTML with proper styling for professional presentation.`;

  return await generateWithAI(prompt, 'Proof of Loss Documentation');
}

async function generateDemandLetter(inputs) {
  const prompt = `Generate a professional Payment Demand Letter with the following details:

Insurer: ${inputs.insurerName}
Claim Number: ${inputs.claimNumber}
Policy Number: ${inputs.policyNumber}
Disputed Amount: $${inputs.disputedAmount}
Reason for Demand: ${inputs.reason}
Response Deadline: ${inputs.deadline || '30'} days
Legal References: ${inputs.legalRefs || 'Standard insurance law'}

Create a formal demand letter that includes:
1. Professional letterhead format
2. Clear statement of the demand
3. Legal basis for the claim
4. Specific timeline for response
5. Consequences of non-compliance
6. Professional closing

Format as HTML with proper styling for legal correspondence.`;

  return await generateWithAI(prompt, 'Payment Demand Letter');
}

async function generateAppealLetter(inputs) {
  const prompt = `Generate a professional Claim Appeal Letter with the following details:

Insurer: ${inputs.insurerName}
Claim Number: ${inputs.claimNumber}
Denial Date: ${inputs.denialDate}
Denial Reason: ${inputs.denialReason}
Appeal Basis: ${inputs.appealBasis}
Supporting Evidence: ${inputs.supportingEvidence || 'See attached documentation'}
Legal Authority: ${inputs.legalAuthority || 'Policy terms and applicable law'}

Create a compelling appeal letter that includes:
1. Professional letterhead
2. Clear statement of the appeal
3. Detailed rebuttal of denial reasons
4. Supporting legal and factual arguments
5. Request for reconsideration
6. Professional closing

Format as HTML with proper styling for legal correspondence.`;

  return await generateWithAI(prompt, 'Claim Appeal Letter');
}

async function generateDamageAssessment(inputs) {
  const prompt = `Generate a professional Damage Assessment Report with the following details:

Property Address: ${inputs.propertyAddress}
Assessment Date: ${inputs.assessmentDate}
Assessor: ${inputs.assessorName}
License: ${inputs.assessorLicense || 'Not provided'}
Damage Type: ${inputs.damageType}
Description: ${inputs.damageDescription}
Repair Cost: $${inputs.repairCost}
Replacement Cost: $${inputs.replacementCost || 'Not provided'}
Photos Taken: ${inputs.photosTaken || 'Not specified'}

Create a comprehensive assessment report that includes:
1. Professional report header
2. Property and assessment details
3. Detailed damage description
4. Cost analysis and estimates
5. Recommendations for repair/replacement
6. Supporting documentation requirements

Format as HTML with proper styling for professional reports.`;

  return await generateWithAI(prompt, 'Damage Assessment Report');
}

async function generateBusinessInterruptionClaim(inputs) {
  const prompt = `Generate a comprehensive Business Interruption Claim with the following details:

Business Name: ${inputs.businessName}
Business Type: ${inputs.businessType}
Interruption Start: ${inputs.interruptionStart}
Interruption End: ${inputs.interruptionEnd || 'Ongoing'}
Monthly Revenue (Pre-Loss): $${inputs.monthlyRevenue}
Lost Revenue: $${inputs.lostRevenue}
Continuing Expenses: $${inputs.continuingExpenses}
Extra Expenses: $${inputs.extraExpenses || 'Not applicable'}
Recovery Plan: ${inputs.recoveryPlan || 'Under development'}

Create a detailed business interruption claim that includes:
1. Business and claim information
2. Financial impact analysis
3. Revenue loss calculations
4. Expense documentation
5. Recovery timeline
6. Supporting financial records

Format as HTML with proper styling for financial documentation.`;

  return await generateWithAI(prompt, 'Business Interruption Claim');
}

async function generateDepreciationSchedule(inputs) {
  const prompt = `Generate a detailed Depreciation Schedule with the following details:

Property Type: ${inputs.propertyType}
Original Cost: $${inputs.originalCost}
Purchase Date: ${inputs.purchaseDate}
Useful Life: ${inputs.usefulLife} years
Current Age: ${inputs.currentAge} years
Replacement Cost: $${inputs.replacementCost}
Depreciation Method: ${inputs.depreciationMethod}
Condition: ${inputs.condition}

Create a comprehensive depreciation schedule that includes:
1. Property and cost information
2. Depreciation calculations
3. Current value assessment
4. Replacement cost analysis
5. Condition-based adjustments
6. Professional formatting for insurance purposes

Format as HTML with proper styling for financial documentation.`;

  return await generateWithAI(prompt, 'Depreciation Schedule');
}

async function generateClaimTimeline(inputs) {
  const prompt = `Generate a detailed Claim Timeline with the following details:

Claim Number: ${inputs.claimNumber}
Policy Number: ${inputs.policyNumber}
Loss Date: ${inputs.lossDate}
First Notice Date: ${inputs.firstNoticeDate}
Key Events: ${inputs.keyEvents}
Correspondence Log: ${inputs.correspondenceLog || 'See attached correspondence'}
Important Deadlines: ${inputs.deadlines || 'See policy terms'}

Create a comprehensive timeline that includes:
1. Chronological event listing
2. Key milestone tracking
3. Correspondence documentation
4. Deadline management
5. Status updates
6. Professional formatting

Format as HTML with proper styling for timeline documentation.`;

  return await generateWithAI(prompt, 'Claim Timeline');
}

async function generateEvidenceLog(inputs) {
  const prompt = `Generate a systematic Evidence Documentation Log with the following details:

Claim Number: ${inputs.claimNumber}
Evidence Type: ${inputs.evidenceType}
Description: ${inputs.evidenceDescription}
Date Collected: ${inputs.dateCollected}
Collected By: ${inputs.collectedBy}
Storage Location: ${inputs.storageLocation || 'Secure storage'}
Chain of Custody: ${inputs.chainOfCustody || 'Maintained throughout'}

Create a comprehensive evidence log that includes:
1. Evidence identification
2. Collection details
3. Storage information
4. Chain of custody tracking
5. Access controls
6. Professional formatting

Format as HTML with proper styling for legal documentation.`;

  return await generateWithAI(prompt, 'Evidence Documentation Log');
}

async function generateSettlementOffer(inputs) {
  const prompt = `Generate a professional Settlement Offer Letter with the following details:

Insurer: ${inputs.insurerName}
Claim Number: ${inputs.claimNumber}
Settlement Amount: $${inputs.settlementAmount}
Offer Terms: ${inputs.offerTerms}
Acceptance Deadline: ${inputs.acceptanceDeadline}
Conditions: ${inputs.conditions || 'Standard settlement conditions'}
Legal Consequences: ${inputs.legalConsequences || 'Final resolution of claim'}

Create a formal settlement offer that includes:
1. Professional letterhead
2. Clear offer terms
3. Acceptance requirements
4. Legal implications
5. Timeline for response
6. Professional closing

Format as HTML with proper styling for legal correspondence.`;

  return await generateWithAI(prompt, 'Settlement Offer Letter');
}

async function generateExpenseReimbursement(inputs) {
  const prompt = `Generate a detailed Expense Reimbursement Form with the following details:

Claimant: ${inputs.claimantName}
Claim Number: ${inputs.claimNumber}
Expense Category: ${inputs.expenseCategory}
Total Amount: $${inputs.totalAmount}
Expense Details: ${inputs.expenseDetails}
Receipts Attached: ${inputs.receiptsAttached ? 'Yes' : 'No'}
Date Range: ${inputs.dateRange}

Create a comprehensive reimbursement form that includes:
1. Claim and claimant information
2. Detailed expense breakdown
3. Category classification
4. Receipt documentation
5. Approval requirements
6. Professional formatting

Format as HTML with proper styling for financial documentation.`;

  return await generateWithAI(prompt, 'Expense Reimbursement Form');
}

async function generateAppraisalRequest(inputs) {
  const prompt = `Generate a formal Appraisal Request Form with the following details:

Insurer: ${inputs.insurerName}
Claim Number: ${inputs.claimNumber}
Disputed Amount: $${inputs.disputedAmount}
Dispute Basis: ${inputs.disputeBasis}
Preferred Appraiser: ${inputs.preferredAppraiser || 'To be determined'}
Appraisal Scope: ${inputs.appraisalScope}
Timeline Request: ${inputs.timelineRequest || '30 days'}

Create a comprehensive appraisal request that includes:
1. Formal request structure
2. Dispute documentation
3. Appraisal requirements
4. Timeline specifications
5. Professional qualifications
6. Legal framework

Format as HTML with proper styling for formal requests.`;

  return await generateWithAI(prompt, 'Appraisal Request Form');
}

async function generateRegulatoryComplaint(inputs) {
  const prompt = `Generate a formal Regulatory Complaint Form with the following details:

Insurer: ${inputs.insurerName}
Claim Number: ${inputs.claimNumber}
Complaint Type: ${inputs.complaintType}
Violation Description: ${inputs.violationDescription}
Supporting Evidence: ${inputs.supportingEvidence}
Regulatory Authority: ${inputs.regulatoryAuthority}
Remedy Sought: ${inputs.remedySought}

Create a comprehensive regulatory complaint that includes:
1. Formal complaint structure
2. Violation documentation
3. Legal basis for complaint
4. Supporting evidence
5. Remedy requests
6. Professional formatting

Format as HTML with proper styling for regulatory submissions.`;

  return await generateWithAI(prompt, 'Regulatory Complaint Form');
}

// Catastrophic Event Document Generators
async function generateHurricaneClaim(inputs) {
  const prompt = `Generate a specialized Hurricane Damage Claim with the following details:

Hurricane Name: ${inputs.hurricaneName}
Property Address: ${inputs.propertyAddress}
Damage Date: ${inputs.damageDate}
Wind Damage: ${inputs.windDamage}
Water Damage: ${inputs.waterDamage || 'Not applicable'}
Flood Damage: ${inputs.floodDamage || 'Not applicable'}
Evacuation Expenses: $${inputs.evacuationExpenses || 'Not applicable'}
Temporary Housing: ${inputs.temporaryHousing || 'Not required'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a comprehensive hurricane claim that includes:
1. Hurricane-specific damage assessment
2. Wind and water damage documentation
3. Evacuation expense tracking
4. Temporary housing needs
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for catastrophic event documentation.`;

  return await generateWithAI(prompt, 'Hurricane Damage Claim');
}

async function generateFloodClaim(inputs) {
  const prompt = `Generate a comprehensive Flood Damage Claim with the following details:

Property Address: ${inputs.propertyAddress}
Flood Date: ${inputs.floodDate}
Water Level: ${inputs.waterLevel} inches
Flood Source: ${inputs.floodSource}
Property Damage: ${inputs.propertyDamage}
Contents Damage: ${inputs.contentsDamage}
Cleanup Costs: $${inputs.cleanupCosts || 'Not provided'}
Prevention Measures: ${inputs.preventionMeasures || 'Not applicable'}

Create a detailed flood claim that includes:
1. Flood-specific damage assessment
2. Water level documentation
3. Property and contents damage
4. Cleanup cost analysis
5. Prevention measures
6. Professional formatting

Format as HTML with proper styling for flood damage documentation.`;

  return await generateWithAI(prompt, 'Flood Damage Claim');
}

async function generateWildfireClaim(inputs) {
  const prompt = `Generate a comprehensive Wildfire Damage Claim with the following details:

Fire Name: ${inputs.fireName}
Property Address: ${inputs.propertyAddress}
Fire Date: ${inputs.fireDate}
Fire Damage: ${inputs.fireDamage}
Smoke Damage: ${inputs.smokeDamage || 'Not applicable'}
Evacuation Required: ${inputs.evacuationRequired ? 'Yes' : 'No'}
Evacuation Expenses: $${inputs.evacuationExpenses || 'Not applicable'}
Air Quality Impact: ${inputs.airQualityImpact || 'Not assessed'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed wildfire claim that includes:
1. Fire-specific damage assessment
2. Direct fire damage documentation
3. Smoke damage evaluation
4. Evacuation expense tracking
5. Air quality considerations
6. Professional formatting

Format as HTML with proper styling for wildfire damage documentation.`;

  return await generateWithAI(prompt, 'Wildfire Damage Claim');
}

async function generateEarthquakeClaim(inputs) {
  const prompt = `Generate a comprehensive Earthquake Damage Claim with the following details:

Property Address: ${inputs.propertyAddress}
Earthquake Date: ${inputs.earthquakeDate}
Magnitude: ${inputs.magnitude || 'Not specified'}
Structural Damage: ${inputs.structuralDamage}
Contents Damage: ${inputs.contentsDamage}
Foundation Issues: ${inputs.foundationIssues || 'Not applicable'}
Utility Damage: ${inputs.utilityDamage || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed earthquake claim that includes:
1. Earthquake-specific damage assessment
2. Structural damage documentation
3. Contents damage evaluation
4. Foundation and utility damage
5. Seismic activity documentation
6. Professional formatting

Format as HTML with proper styling for earthquake damage documentation.`;

  return await generateWithAI(prompt, 'Earthquake Damage Claim');
}

// Property-Specific Document Generators
async function generateResidentialProperty(inputs) {
  const prompt = `Generate a specialized Residential Property Claim with the following details:

Property Address: ${inputs.propertyAddress}
Property Type: ${inputs.propertyType}
Year Built: ${inputs.yearBuilt || 'Not specified'}
Square Footage: ${inputs.squareFootage || 'Not specified'}
Damage Type: ${inputs.damageType}
Damage Description: ${inputs.damageDescription}
Repair Cost: $${inputs.repairCost}
Temporary Housing Needed: ${inputs.temporaryHousing ? 'Yes' : 'No'}

Create a comprehensive residential property claim that includes:
1. Property-specific damage assessment
2. Home characteristics documentation
3. Damage type and description
4. Repair cost analysis
5. Temporary housing needs
6. Professional formatting

Format as HTML with proper styling for residential property documentation.`;

  return await generateWithAI(prompt, 'Residential Property Claim');
}

async function generateCommercialProperty(inputs) {
  const prompt = `Generate a comprehensive Commercial Property Claim with the following details:

Business Name: ${inputs.businessName}
Property Address: ${inputs.propertyAddress}
Business Type: ${inputs.businessType}
Damage Type: ${inputs.damageType}
Property Damage: ${inputs.propertyDamage}
Business Interruption: ${inputs.businessInterruption || 'Not applicable'}
Lost Revenue: $${inputs.lostRevenue || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed commercial property claim that includes:
1. Business and property information
2. Commercial-specific damage assessment
3. Business interruption analysis
4. Revenue impact evaluation
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for commercial property documentation.`;

  return await generateWithAI(prompt, 'Commercial Property Claim');
}

// Business-Specific Document Generators
async function generateRestaurantBusiness(inputs) {
  const prompt = `Generate a comprehensive Restaurant Business Claim with the following details:

Restaurant Name: ${inputs.restaurantName}
Restaurant Address: ${inputs.restaurantAddress}
Cuisine Type: ${inputs.cuisineType || 'Not specified'}
Seating Capacity: ${inputs.seatingCapacity || 'Not specified'}
Damage Type: ${inputs.damageType}
Food Loss: ${inputs.foodLoss || 'Not applicable'}
Equipment Damage: ${inputs.equipmentDamage}
Lost Revenue: $${inputs.lostRevenue || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed restaurant business claim that includes:
1. Restaurant-specific information
2. Food service damage assessment
3. Equipment damage documentation
4. Food loss evaluation
5. Revenue impact analysis
6. Professional formatting

Format as HTML with proper styling for restaurant business documentation.`;

  return await generateWithAI(prompt, 'Restaurant Business Claim');
}

async function generateRetailBusiness(inputs) {
  const prompt = `Generate a comprehensive Retail Business Claim with the following details:

Store Name: ${inputs.storeName}
Store Address: ${inputs.storeAddress}
Store Type: ${inputs.storeType}
Damage Type: ${inputs.damageType}
Inventory Loss: ${inputs.inventoryLoss || 'Not applicable'}
Fixture Damage: ${inputs.fixtureDamage || 'Not applicable'}
Lost Sales: $${inputs.lostSales || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed retail business claim that includes:
1. Retail-specific information
2. Inventory damage assessment
3. Fixture damage documentation
4. Sales impact analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for retail business documentation.`;

  return await generateWithAI(prompt, 'Retail Business Claim');
}

async function generateManufacturingBusiness(inputs) {
  const prompt = `Generate a comprehensive Manufacturing Business Claim with the following details:

Company Name: ${inputs.companyName}
Facility Address: ${inputs.facilityAddress}
Product Type: ${inputs.productType}
Damage Type: ${inputs.damageType}
Equipment Damage: ${inputs.equipmentDamage}
Production Loss: ${inputs.productionLoss || 'Not applicable'}
Raw Material Loss: ${inputs.rawMaterialLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed manufacturing business claim that includes:
1. Manufacturing-specific information
2. Equipment damage assessment
3. Production loss documentation
4. Raw material impact
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for manufacturing business documentation.`;

  return await generateWithAI(prompt, 'Manufacturing Business Claim');
}

async function generateHealthcareBusiness(inputs) {
  const prompt = `Generate a comprehensive Healthcare Business Claim with the following details:

Healthcare Facility Name: ${inputs.facilityName}
Facility Address: ${inputs.facilityAddress}
Facility Type: ${inputs.facilityType}
Damage Type: ${inputs.damageType}
Medical Equipment Loss: ${inputs.medicalEquipmentLoss || 'Not applicable'}
Patient Care Impact: ${inputs.patientCareImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed healthcare business claim that includes:
1. Healthcare facility information
2. Medical equipment damage assessment
3. Patient care impact documentation
4. Healthcare-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for healthcare business documentation.`;

  return await generateWithAI(prompt, 'Healthcare Business Claim');
}

async function generateProfessionalServices(inputs) {
  const prompt = `Generate a comprehensive Professional Services Claim with the following details:

Firm Name: ${inputs.firmName}
Office Address: ${inputs.officeAddress}
Service Type: ${inputs.serviceType}
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Client Impact: ${inputs.clientImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed professional services claim that includes:
1. Professional services information
2. Office equipment damage assessment
3. Client impact documentation
4. Professional liability considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for professional services documentation.`;

  return await generateWithAI(prompt, 'Professional Services Claim');
}

async function generateTechnologyBusiness(inputs) {
  const prompt = `Generate a comprehensive Technology Business Claim with the following details:

Company Name: ${inputs.companyName}
Office Address: ${inputs.officeAddress}
Technology Type: ${inputs.technologyType}
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Data Loss: ${inputs.dataLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed technology business claim that includes:
1. Technology business information
2. Equipment damage assessment
3. Data loss documentation
4. Cybersecurity considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for technology business documentation.`;

  return await generateWithAI(prompt, 'Technology Business Claim');
}

async function generateHospitalityBusiness(inputs) {
  const prompt = `Generate a comprehensive Hospitality Business Claim with the following details:

Property Name: ${inputs.propertyName}
Property Address: ${inputs.propertyAddress}
Property Type: ${inputs.propertyType}
Room Count: ${inputs.roomCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Guest Impact: ${inputs.guestImpact || 'Not applicable'}
Lost Revenue: $${inputs.lostRevenue || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed hospitality business claim that includes:
1. Hospitality property information
2. Guest service impact assessment
3. Revenue loss documentation
4. Hospitality-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for hospitality business documentation.`;

  return await generateWithAI(prompt, 'Hospitality Business Claim');
}

async function generateEducationBusiness(inputs) {
  const prompt = `Generate a comprehensive Education Business Claim with the following details:

Institution Name: ${inputs.institutionName}
Campus Address: ${inputs.campusAddress}
Institution Type: ${inputs.institutionType}
Student Count: ${inputs.studentCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Educational Impact: ${inputs.educationalImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed education business claim that includes:
1. Educational institution information
2. Educational impact assessment
3. Student service documentation
4. Education-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for education business documentation.`;

  return await generateWithAI(prompt, 'Education Business Claim');
}

async function generateFitnessBusiness(inputs) {
  const prompt = `Generate a comprehensive Fitness Business Claim with the following details:

Gym Name: ${inputs.gymName}
Gym Address: ${inputs.gymAddress}
Gym Type: ${inputs.gymType}
Member Count: ${inputs.memberCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Member Impact: ${inputs.memberImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed fitness business claim that includes:
1. Fitness facility information
2. Equipment damage assessment
3. Member impact documentation
4. Fitness-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for fitness business documentation.`;

  return await generateWithAI(prompt, 'Fitness Business Claim');
}

async function generateBeautyBusiness(inputs) {
  const prompt = `Generate a comprehensive Beauty Business Claim with the following details:

Salon Name: ${inputs.salonName}
Salon Address: ${inputs.salonAddress}
Service Type: ${inputs.serviceType}
Station Count: ${inputs.stationCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Client Impact: ${inputs.clientImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed beauty business claim that includes:
1. Beauty salon information
2. Equipment damage assessment
3. Client impact documentation
4. Beauty industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for beauty business documentation.`;

  return await generateWithAI(prompt, 'Beauty Business Claim');
}

async function generateAutomotiveBusiness(inputs) {
  const prompt = `Generate a comprehensive Automotive Business Claim with the following details:

Business Name: ${inputs.businessName}
Business Address: ${inputs.businessAddress}
Service Type: ${inputs.serviceType}
Bay Count: ${inputs.bayCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Customer Impact: ${inputs.customerImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed automotive business claim that includes:
1. Automotive business information
2. Equipment damage assessment
3. Customer impact documentation
4. Automotive industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for automotive business documentation.`;

  return await generateWithAI(prompt, 'Automotive Business Claim');
}

async function generateAgriculturalBusiness(inputs) {
  const prompt = `Generate a comprehensive Agricultural Business Claim with the following details:

Farm Name: ${inputs.farmName}
Farm Address: ${inputs.farmAddress}
Farm Type: ${inputs.farmType}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Crop Loss: ${inputs.cropLoss || 'Not applicable'}
Livestock Loss: ${inputs.livestockLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed agricultural business claim that includes:
1. Agricultural business information
2. Crop and livestock damage assessment
3. Farm equipment documentation
4. Agricultural industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for agricultural business documentation.`;

  return await generateWithAI(prompt, 'Agricultural Business Claim');
}

async function generateTransportationBusiness(inputs) {
  const prompt = `Generate a comprehensive Transportation Business Claim with the following details:

Company Name: ${inputs.companyName}
Company Address: ${inputs.companyAddress}
Transport Type: ${inputs.transportType}
Vehicle Count: ${inputs.vehicleCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Vehicle Loss: ${inputs.vehicleLoss || 'Not applicable'}
Service Impact: ${inputs.serviceImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed transportation business claim that includes:
1. Transportation business information
2. Vehicle damage assessment
3. Service impact documentation
4. Transportation industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for transportation business documentation.`;

  return await generateWithAI(prompt, 'Transportation Business Claim');
}

async function generateWarehouseBusiness(inputs) {
  const prompt = `Generate a comprehensive Warehouse Business Claim with the following details:

Warehouse Name: ${inputs.warehouseName}
Warehouse Address: ${inputs.warehouseAddress}
Warehouse Type: ${inputs.warehouseType}
Square Footage: ${inputs.squareFootage || 'Not specified'}
Damage Type: ${inputs.damageType}
Inventory Loss: ${inputs.inventoryLoss || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed warehouse business claim that includes:
1. Warehouse business information
2. Inventory damage assessment
3. Equipment damage documentation
4. Warehouse industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for warehouse business documentation.`;

  return await generateWithAI(prompt, 'Warehouse Business Claim');
}

// Additional catastrophic event generators
async function generateTornadoClaim(inputs) {
  const prompt = `Generate a comprehensive Tornado Damage Claim with the following details:

Property Address: ${inputs.propertyAddress}
Tornado Date: ${inputs.tornadoDate}
Wind Speed: ${inputs.windSpeed || 'Not specified'} mph
Wind Damage: ${inputs.windDamage}
Debris Damage: ${inputs.debrisDamage || 'Not applicable'}
Structural Damage: ${inputs.structuralDamage || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed tornado claim that includes:
1. Tornado-specific damage assessment
2. Wind damage documentation
3. Debris impact evaluation
4. Structural damage analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for tornado damage documentation.`;

  return await generateWithAI(prompt, 'Tornado Damage Claim');
}

async function generateHailClaim(inputs) {
  const prompt = `Generate a comprehensive Hail Damage Claim with the following details:

Property Address: ${inputs.propertyAddress}
Hail Date: ${inputs.hailDate}
Hail Size: ${inputs.hailSize || 'Not specified'} inches
Roof Damage: ${inputs.roofDamage}
Siding Damage: ${inputs.sidingDamage || 'Not applicable'}
Vehicle Damage: ${inputs.vehicleDamage || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed hail claim that includes:
1. Hail-specific damage assessment
2. Roof damage documentation
3. Siding damage evaluation
4. Vehicle damage analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for hail damage documentation.`;

  return await generateWithAI(prompt, 'Hail Damage Claim');
}

async function generateWinterStormClaim(inputs) {
  const prompt = `Generate a comprehensive Winter Storm Claim with the following details:

Property Address: ${inputs.propertyAddress}
Storm Date: ${inputs.stormDate}
Low Temperature: ${inputs.lowTemperature || 'Not specified'}°F
Ice Damage: ${inputs.iceDamage || 'Not applicable'}
Snow Damage: ${inputs.snowDamage || 'Not applicable'}
Freeze Damage: ${inputs.freezeDamage || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed winter storm claim that includes:
1. Winter storm-specific damage assessment
2. Ice damage documentation
3. Snow damage evaluation
4. Freeze damage analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for winter storm damage documentation.`;

  return await generateWithAI(prompt, 'Winter Storm Claim');
}

// Property-specific generators
async function generateCondoAssociation(inputs) {
  const prompt = `Generate a comprehensive Condo Association Claim with the following details:

Association Name: ${inputs.associationName}
Property Address: ${inputs.propertyAddress}
Unit Count: ${inputs.unitCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Common Area Damage: ${inputs.commonAreaDamage}
Unit Impact: ${inputs.unitImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed condo association claim that includes:
1. Association information
2. Common area damage assessment
3. Unit impact documentation
4. Condo-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for condo association documentation.`;

  return await generateWithAI(prompt, 'Condo Association Claim');
}

async function generateHomeownersAssociation(inputs) {
  const prompt = `Generate a comprehensive HOA Property Claim with the following details:

HOA Name: ${inputs.hoaName}
Property Address: ${inputs.propertyAddress}
Home Count: ${inputs.homeCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Amenity Damage: ${inputs.amenityDamage || 'Not applicable'}
Member Impact: ${inputs.memberImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed HOA property claim that includes:
1. HOA information
2. Amenity damage assessment
3. Member impact documentation
4. HOA-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for HOA property documentation.`;

  return await generateWithAI(prompt, 'HOA Property Claim');
}

async function generateRentalProperty(inputs) {
  const prompt = `Generate a comprehensive Rental Property Claim with the following details:

Property Address: ${inputs.propertyAddress}
Property Type: ${inputs.propertyType}
Unit Count: ${inputs.unitCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Unit Damage: ${inputs.unitDamage || 'Not applicable'}
Tenant Impact: ${inputs.tenantImpact || 'Not applicable'}
Rental Income Loss: $${inputs.rentalIncomeLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed rental property claim that includes:
1. Rental property information
2. Unit damage assessment
3. Tenant impact documentation
4. Rental income loss analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for rental property documentation.`;

  return await generateWithAI(prompt, 'Rental Property Claim');
}

async function generateVacationRental(inputs) {
  const prompt = `Generate a comprehensive Vacation Rental Claim with the following details:

Property Address: ${inputs.propertyAddress}
Property Type: ${inputs.propertyType}
Bedroom Count: ${inputs.bedroomCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Furnishing Loss: ${inputs.furnishingLoss || 'Not applicable'}
Guest Impact: ${inputs.guestImpact || 'Not applicable'}
Lost Rental Income: $${inputs.lostRentalIncome || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed vacation rental claim that includes:
1. Vacation rental information
2. Furnishing damage assessment
3. Guest impact documentation
4. Rental income loss analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for vacation rental documentation.`;

  return await generateWithAI(prompt, 'Vacation Rental Claim');
}

async function generateManufacturedHome(inputs) {
  const prompt = `Generate a comprehensive Manufactured Home Claim with the following details:

Property Address: ${inputs.propertyAddress}
Home Year: ${inputs.homeYear || 'Not specified'}
Home Size: ${inputs.homeSize || 'Not specified'} sq ft
Damage Type: ${inputs.damageType}
Structural Damage: ${inputs.structuralDamage}
Transportation Costs: $${inputs.transportationCosts || 'Not applicable'}
Setup Costs: $${inputs.setupCosts || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed manufactured home claim that includes:
1. Manufactured home information
2. Structural damage assessment
3. Transportation cost documentation
4. Setup cost analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for manufactured home documentation.`;

  return await generateWithAI(prompt, 'Manufactured Home Claim');
}

async function generateMobileHome(inputs) {
  const prompt = `Generate a comprehensive Mobile Home Claim with the following details:

Property Address: ${inputs.propertyAddress}
Home Year: ${inputs.homeYear || 'Not specified'}
Home Size: ${inputs.homeSize || 'Not specified'} sq ft
Damage Type: ${inputs.damageType}
Structural Damage: ${inputs.structuralDamage}
Transportation Costs: $${inputs.transportationCosts || 'Not applicable'}
Setup Costs: $${inputs.setupCosts || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed mobile home claim that includes:
1. Mobile home information
2. Structural damage assessment
3. Transportation cost documentation
4. Setup cost analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for mobile home documentation.`;

  return await generateWithAI(prompt, 'Mobile Home Claim');
}

async function generateFarmProperty(inputs) {
  const prompt = `Generate a comprehensive Farm Property Claim with the following details:

Farm Name: ${inputs.farmName}
Farm Address: ${inputs.farmAddress}
Farm Type: ${inputs.farmType}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Crop Loss: ${inputs.cropLoss || 'Not applicable'}
Livestock Loss: ${inputs.livestockLoss || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed farm property claim that includes:
1. Farm property information
2. Crop damage assessment
3. Livestock loss documentation
4. Equipment damage analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for farm property documentation.`;

  return await generateWithAI(prompt, 'Farm Property Claim');
}

async function generateRanchProperty(inputs) {
  const prompt = `Generate a comprehensive Ranch Property Claim with the following details:

Ranch Name: ${inputs.ranchName}
Ranch Address: ${inputs.ranchAddress}
Ranch Type: ${inputs.ranchType}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Livestock Loss: ${inputs.livestockLoss || 'Not applicable'}
Grazing Impact: ${inputs.grazingImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed ranch property claim that includes:
1. Ranch property information
2. Livestock damage assessment
3. Grazing impact documentation
4. Ranch-specific considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for ranch property documentation.`;

  return await generateWithAI(prompt, 'Ranch Property Claim');
}

async function generateVineyardProperty(inputs) {
  const prompt = `Generate a comprehensive Vineyard Property Claim with the following details:

Vineyard Name: ${inputs.vineyardName}
Vineyard Address: ${inputs.vineyardAddress}
Grape Varieties: ${inputs.grapeVarieties || 'Not specified'}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Vine Loss: ${inputs.vineLoss || 'Not applicable'}
Wine Loss: ${inputs.wineLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed vineyard property claim that includes:
1. Vineyard property information
2. Vine damage assessment
3. Wine loss documentation
4. Viticulture considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for vineyard property documentation.`;

  return await generateWithAI(prompt, 'Vineyard Property Claim');
}

async function generateOrchardProperty(inputs) {
  const prompt = `Generate a comprehensive Orchard Property Claim with the following details:

Orchard Name: ${inputs.orchardName}
Orchard Address: ${inputs.orchardAddress}
Tree Types: ${inputs.treeTypes || 'Not specified'}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Tree Loss: ${inputs.treeLoss || 'Not applicable'}
Crop Loss: ${inputs.cropLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed orchard property claim that includes:
1. Orchard property information
2. Tree damage assessment
3. Crop loss documentation
4. Horticulture considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for orchard property documentation.`;

  return await generateWithAI(prompt, 'Orchard Property Claim');
}

async function generateGreenhouseProperty(inputs) {
  const prompt = `Generate a comprehensive Greenhouse Property Claim with the following details:

Greenhouse Name: ${inputs.greenhouseName}
Greenhouse Address: ${inputs.greenhouseAddress}
Greenhouse Type: ${inputs.greenhouseType}
Square Footage: ${inputs.squareFootage || 'Not specified'}
Damage Type: ${inputs.damageType}
Structure Damage: ${inputs.structureDamage || 'Not applicable'}
Plant Loss: ${inputs.plantLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed greenhouse property claim that includes:
1. Greenhouse property information
2. Structure damage assessment
3. Plant loss documentation
4. Horticulture considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for greenhouse property documentation.`;

  return await generateWithAI(prompt, 'Greenhouse Property Claim');
}

async function generateAquacultureProperty(inputs) {
  const prompt = `Generate a comprehensive Aquaculture Property Claim with the following details:

Aquaculture Name: ${inputs.aquacultureName}
Aquaculture Address: ${inputs.aquacultureAddress}
Fish Types: ${inputs.fishTypes || 'Not specified'}
Pond Count: ${inputs.pondCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Fish Loss: ${inputs.fishLoss || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed aquaculture property claim that includes:
1. Aquaculture property information
2. Fish damage assessment
3. Equipment loss documentation
4. Aquaculture considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for aquaculture property documentation.`;

  return await generateWithAI(prompt, 'Aquaculture Property Claim');
}

async function generateTimberProperty(inputs) {
  const prompt = `Generate a comprehensive Timber Property Claim with the following details:

Timber Property Name: ${inputs.timberPropertyName}
Property Address: ${inputs.propertyAddress}
Tree Types: ${inputs.treeTypes || 'Not specified'}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Tree Loss: ${inputs.treeLoss || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed timber property claim that includes:
1. Timber property information
2. Tree damage assessment
3. Equipment loss documentation
4. Forestry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for timber property documentation.`;

  return await generateWithAI(prompt, 'Timber Property Claim');
}

async function generateMiningProperty(inputs) {
  const prompt = `Generate a comprehensive Mining Property Claim with the following details:

Mining Property Name: ${inputs.miningPropertyName}
Property Address: ${inputs.propertyAddress}
Mining Type: ${inputs.miningType}
Acres: ${inputs.acres || 'Not specified'}
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Facility Loss: ${inputs.facilityLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed mining property claim that includes:
1. Mining property information
2. Equipment damage assessment
3. Facility loss documentation
4. Mining industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for mining property documentation.`;

  return await generateWithAI(prompt, 'Mining Property Claim');
}

async function generateOilGasProperty(inputs) {
  const prompt = `Generate a comprehensive Oil & Gas Property Claim with the following details:

Property Name: ${inputs.propertyName}
Property Address: ${inputs.propertyAddress}
Well Count: ${inputs.wellCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Well Damage: ${inputs.wellDamage || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Production Loss: ${inputs.productionLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed oil & gas property claim that includes:
1. Oil & gas property information
2. Well damage assessment
3. Equipment loss documentation
4. Production impact analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for oil & gas property documentation.`;

  return await generateWithAI(prompt, 'Oil & Gas Property Claim');
}

async function generateRenewableEnergy(inputs) {
  const prompt = `Generate a comprehensive Renewable Energy Property Claim with the following details:

Energy Property Name: ${inputs.energyPropertyName}
Property Address: ${inputs.propertyAddress}
Energy Type: ${inputs.energyType}
Capacity: ${inputs.capacity || 'Not specified'} MW
Damage Type: ${inputs.damageType}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Production Loss: ${inputs.productionLoss || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed renewable energy property claim that includes:
1. Renewable energy property information
2. Equipment damage assessment
3. Production loss documentation
4. Energy industry considerations
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for renewable energy property documentation.`;

  return await generateWithAI(prompt, 'Renewable Energy Property Claim');
}

async function generateTelecommunications(inputs) {
  const prompt = `Generate a comprehensive Telecommunications Property Claim with the following details:

Telecom Property Name: ${inputs.telecomPropertyName}
Property Address: ${inputs.propertyAddress}
Tower Height: ${inputs.towerHeight || 'Not specified'} ft
Damage Type: ${inputs.damageType}
Tower Damage: ${inputs.towerDamage || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Service Impact: ${inputs.serviceImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed telecommunications property claim that includes:
1. Telecommunications property information
2. Tower damage assessment
3. Equipment loss documentation
4. Service impact analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for telecommunications property documentation.`;

  return await generateWithAI(prompt, 'Telecommunications Property Claim');
}

async function generateTransportationProperty(inputs) {
  const prompt = `Generate a comprehensive Transportation Property Claim with the following details:

Transportation Property Name: ${inputs.transportPropertyName}
Property Address: ${inputs.propertyAddress}
Vehicle Count: ${inputs.vehicleCount || 'Not specified'}
Damage Type: ${inputs.damageType}
Vehicle Loss: ${inputs.vehicleLoss || 'Not applicable'}
Equipment Loss: ${inputs.equipmentLoss || 'Not applicable'}
Service Impact: ${inputs.serviceImpact || 'Not applicable'}
Estimated Total Loss: $${inputs.estimatedTotalLoss}

Create a detailed transportation property claim that includes:
1. Transportation property information
2. Vehicle damage assessment
3. Equipment loss documentation
4. Service impact analysis
5. Total loss calculations
6. Professional formatting

Format as HTML with proper styling for transportation property documentation.`;

  return await generateWithAI(prompt, 'Transportation Property Claim');
}

// Generic document generator for any document type
async function generateGenericDocument(docKey, inputs) {
  const prompt = `Generate a professional insurance claim document for "${docKey}" with the following information:

${Object.entries(inputs).map(([key, value]) => `${key}: ${value}`).join('\n')}

Create a comprehensive, professional document that includes:
1. Proper document header and formatting
2. All provided information organized clearly
3. Professional language and structure
4. Appropriate legal and insurance terminology
5. Clear sections and formatting
6. Professional presentation suitable for insurance submission

Format as HTML with proper styling for professional presentation.`;

  return await generateWithAI(prompt, `${docKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Document`);
}

// AI generation helper function
async function generateWithAI(prompt, documentType) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal document generator specializing in insurance claims. Generate professional, legally sound documents that protect policyholder rights. Always format output as clean HTML with proper styling for professional presentation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    const generatedContent = completion.choices[0].message.content;
    
    return {
      success: true,
      document: generatedContent,
      content: generatedContent,
      documentType: documentType,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate document with AI');
  }
}
