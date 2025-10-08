const { getBlob } = require("@netlify/blobs");
const fs = require('fs');
const path = require('path');

// Template mapping for different claim document types
const TEMPLATE_MAP = {
  // Claims
  'fnol': { path: 'assets/docs/claims/first-notice-of-loss.docx', name: 'First Notice of Loss' },
  'proof-of-loss': { path: 'assets/docs/claims/proof-of-loss.docx', name: 'Proof of Loss' },
  'damage-assessment': { path: 'assets/docs/claims/damage-assessment.docx', name: 'Damage Assessment' },
  'claim-sequence-guide': { path: 'assets/docs/claims/claim-sequence-guide.docx', name: 'Claim Sequence Guide' },
  'evidence-log': { path: 'assets/docs/claims/evidence-log.docx', name: 'Evidence Log' },
  
  // Legal
  'demand-letter': { path: 'assets/docs/legal/demand-letter.docx', name: 'Demand Letter' },
  'appeal-letter': { path: 'assets/docs/legal/appeal-letter.docx', name: 'Appeal Letter' },
  'complaint-letter': { path: 'assets/docs/legal/complaint-letter.docx', name: 'Complaint Letter' },
  'settlement-offer': { path: 'assets/docs/legal/settlement-offer.docx', name: 'Settlement Offer' },
  'mediation-request': { path: 'assets/docs/legal/mediation-request.docx', name: 'Mediation Request' },
  
  // Forms
  'estimate-request': { path: 'assets/docs/forms/estimate-request.docx', name: 'Estimate Request' },
  'repair-authorization': { path: 'assets/docs/forms/repair-authorization.docx', name: 'Repair Authorization' },
  'inspection-request': { path: 'assets/docs/forms/inspection-request.docx', name: 'Inspection Request' },
  'document-request': { path: 'assets/docs/forms/document-request.docx', name: 'Document Request' },
  'witness-statement': { path: 'assets/docs/forms/witness-statement.docx', name: 'Witness Statement' },
  'medical-records-request': { path: 'assets/docs/forms/medical-records-request.docx', name: 'Medical Records Request' },
  'expert-opinion-request': { path: 'assets/docs/forms/expert-opinion-request.docx', name: 'Expert Opinion Request' },
  
  // Appeals
  'internal-appeal': { path: 'assets/docs/appeals/internal-appeal.docx', name: 'Internal Appeal' },
  'external-appeal': { path: 'assets/docs/appeals/external-appeal.docx', name: 'External Appeal' },
  'regulatory-complaint': { path: 'assets/docs/appeals/regulatory-complaint.docx', name: 'Regulatory Complaint' },
  
  // Demands
  'payment-demand': { path: 'assets/docs/demands/payment-demand.docx', name: 'Payment Demand' },
  'coverage-demand': { path: 'assets/docs/demands/coverage-demand.docx', name: 'Coverage Demand' },
  'timeline-demand': { path: 'assets/docs/demands/timeline-demand.docx', name: 'Timeline Demand' }
};

exports.handler = async (event, context) => {
  // Verify Netlify Identity authentication
  if (!context.clientContext?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
    };
  }

  try {
    const { templateName, format = 'docx' } = event.queryStringParameters || {};
    
    if (!templateName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Template name is required" })
      };
    }

    const template = TEMPLATE_MAP[templateName.toLowerCase()];
    if (!template) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Template not found" })
      };
    }

    // Try to get template from Netlify Blobs first
    try {
      const blobStore = getBlob('templates');
      const templateBlob = await blobStore.get(`${templateName}.${format}`);
      
      if (templateBlob) {
        const contentType = format === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${template.name}.${format}"`,
            'Content-Length': templateBlob.length.toString()
          },
          body: templateBlob.toString('base64'),
          isBase64Encoded: true
        };
      }
    } catch (blobError) {
      console.log('Template not found in blobs, trying local filesystem');
    }

    // Fallback to local filesystem
    const templatePath = template.path.replace('.docx', `.${format}`);
    const fullPath = path.join(process.cwd(), templatePath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Template file not found" })
      };
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Store access log in blobs
    const accessLog = getBlob('access-logs');
    await accessLog.set(`${context.clientContext.user.sub}-${Date.now()}`, JSON.stringify({
      userId: context.clientContext.user.sub,
      templateName: templateName,
      format: format,
      accessedAt: new Date().toISOString()
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${template.name}.${format}"`,
        'Content-Length': fileBuffer.length.toString()
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Get template error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve template" })
    };
  }
};
