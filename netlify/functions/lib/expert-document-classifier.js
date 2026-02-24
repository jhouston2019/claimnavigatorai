/**
 * Expert Document Classifier
 * Deterministic classification of expert report types
 * Rule-based credential and section detection
 */

const REPORT_TYPE_KEYWORDS = {
  engineer_report: {
    primary: ['structural engineer', 'professional engineer', 'engineering report', 'structural analysis', 'structural assessment'],
    credentials: ['P.E.', 'PE #', 'PE#', 'Professional Engineer', 'Structural Engineer'],
    sections: ['STRUCTURAL FINDINGS', 'ENGINEERING ANALYSIS', 'STRUCTURAL ASSESSMENT'],
    weight: 1.0
  },
  hygienist_report: {
    primary: ['industrial hygiene', 'industrial hygienist', 'mold assessment', 'air quality', 'spore count'],
    credentials: ['CIH', 'Certified Industrial Hygienist', 'CMRS', 'CIEC'],
    sections: ['AIR SAMPLING', 'SURFACE SAMPLING', 'MOLD FINDINGS', 'REMEDIATION PROTOCOL'],
    weight: 1.0
  },
  appraisal_award: {
    primary: ['appraisal award', 'umpire decision', 'appraisal panel', 'binding award', 'appraisers agree'],
    credentials: ['Umpire', 'Appraiser', 'Neutral Appraiser'],
    sections: ['AWARD SUMMARY', 'APPRAISAL DECISION', 'DISPUTED ITEMS', 'BINDING DETERMINATION'],
    weight: 1.0
  },
  roofing_consultant_report: {
    primary: ['roofing consultant', 'roof inspection', 'roofing assessment', 'roof analysis'],
    credentials: ['HAAG', 'RRC', 'IIRC', 'Certified Roofing Inspector'],
    sections: ['ROOF INSPECTION', 'ROOFING FINDINGS', 'SHINGLE ANALYSIS', 'ROOF ASSESSMENT'],
    weight: 1.0
  },
  contractor_narrative: {
    primary: ['scope of work', 'damage assessment', 'contractor assessment', 'restoration scope', 'work scope narrative'],
    credentials: ['Licensed Contractor', 'General Contractor', 'Restoration Specialist'],
    sections: ['SCOPE OF WORK', 'DAMAGE DESCRIPTION', 'RECOMMENDED REPAIRS', 'WORK NARRATIVE'],
    weight: 0.8
  },
  causation_report: {
    primary: ['cause and origin', 'causation analysis', 'origin determination', 'cause of loss'],
    credentials: ['CFI', 'CFEI', 'Fire Investigator', 'Origin Investigator'],
    sections: ['CAUSE DETERMINATION', 'ORIGIN ANALYSIS', 'CAUSATION FINDINGS'],
    weight: 1.0
  }
};

const SECTION_HEADERS = [
  'EXECUTIVE SUMMARY',
  'SUMMARY',
  'FINDINGS',
  'CONCLUSIONS',
  'CONCLUSION',
  'OPINION',
  'RECOMMENDATIONS',
  'RECOMMENDATION',
  'LIMITATIONS',
  'LIMITATION',
  'SCOPE OF WORK',
  'METHODOLOGY',
  'METHOD',
  'ANALYSIS',
  'ASSESSMENT',
  'INSPECTION RESULTS',
  'OBSERVATIONS',
  'DISCUSSION',
  'BACKGROUND'
];

const CREDENTIAL_PATTERNS = [
  /P\.?E\.?\s*#?\s*\d+/i,
  /Professional Engineer/i,
  /Structural Engineer/i,
  /CIH/i,
  /Certified Industrial Hygienist/i,
  /CMRS/i,
  /CIEC/i,
  /HAAG/i,
  /RRC/i,
  /IIRC/i,
  /Certified Roofing Inspector/i,
  /CFI/i,
  /CFEI/i,
  /Fire Investigator/i,
  /Licensed Contractor\s*#?\s*\d+/i,
  /General Contractor/i,
  /Umpire/i,
  /Appraiser/i
];

function classifyExpertDocument(documentText) {
  const normalizedText = documentText.toLowerCase();
  const lines = documentText.split('\n');
  
  const scores = {};
  const detectedCredentials = [];
  const detectedSections = [];
  
  for (const [reportType, config] of Object.entries(REPORT_TYPE_KEYWORDS)) {
    let score = 0;
    
    for (const keyword of config.primary) {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = (normalizedText.match(regex) || []).length;
      score += matches * config.weight;
    }
    
    for (const credential of config.credentials) {
      const regex = new RegExp(credential.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (regex.test(documentText)) {
        score += 2.0 * config.weight;
      }
    }
    
    for (const section of config.sections) {
      const regex = new RegExp('^\\s*' + section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'gmi');
      if (regex.test(documentText)) {
        score += 1.5 * config.weight;
      }
    }
    
    scores[reportType] = score;
  }
  
  for (const pattern of CREDENTIAL_PATTERNS) {
    const matches = documentText.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!detectedCredentials.includes(match.trim())) {
          detectedCredentials.push(match.trim());
        }
      }
    }
  }
  
  for (const header of SECTION_HEADERS) {
    const regex = new RegExp('^\\s*' + header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*$', 'gmi');
    if (regex.test(documentText)) {
      if (!detectedSections.includes(header)) {
        detectedSections.push(header);
      }
    }
  }
  
  const sortedTypes = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
  
  const topType = sortedTypes[0];
  const secondType = sortedTypes[1];
  
  const topScore = topType[1];
  const secondScore = secondType[1];
  
  if (topScore === 0) {
    return {
      report_type: 'other_expert',
      confidence_score: 0,
      detected_credentials: detectedCredentials,
      detected_sections: detectedSections,
      classification_method: 'no_match',
      scores: scores
    };
  }
  
  const confidenceScore = topScore > 0 ? Math.min(topScore / 10, 1.0) : 0;
  
  const isAmbiguous = secondScore > 0 && (topScore - secondScore) < 2.0;
  
  return {
    report_type: topType[0],
    confidence_score: parseFloat(confidenceScore.toFixed(3)),
    detected_credentials: detectedCredentials,
    detected_sections: detectedSections,
    classification_method: 'keyword_scoring',
    is_ambiguous: isAmbiguous,
    scores: scores,
    alternative_type: isAmbiguous ? secondType[0] : null
  };
}

function extractExpertMetadata(documentText) {
  const lines = documentText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const metadata = {
    expert_name: null,
    expert_credentials: null,
    expert_company: null,
    inspection_date: null,
    report_date: null,
    property_address: null
  };
  
  const namePatterns = [
    /(?:Engineer|Hygienist|Inspector|Consultant|Appraiser|Contractor):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /(?:Prepared by|Inspected by|Authored by):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:P\.?E\.?|CIH|IIRC|RRC)/i
  ];
  
  const datePatterns = [
    /(?:Inspection Date|Date of Inspection):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i,
    /(?:Report Date|Date):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i
  ];
  
  const addressPatterns = [
    /(?:Property|Address|Location):\s*(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[A-Za-z0-9\s,]*)/i
  ];
  
  const companyPatterns = [
    /([A-Z][A-Za-z\s&]+(?:Engineering|Consulting|Restoration|Inspection|Services|Inc|LLC|Corp))/
  ];
  
  for (const line of lines.slice(0, 50)) {
    if (!metadata.expert_name) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match) {
          metadata.expert_name = match[1].trim();
          break;
        }
      }
    }
    
    if (!metadata.inspection_date) {
      const inspectionMatch = line.match(datePatterns[0]);
      if (inspectionMatch) {
        metadata.inspection_date = inspectionMatch[1];
      }
    }
    
    if (!metadata.report_date) {
      const reportMatch = line.match(datePatterns[1]);
      if (reportMatch) {
        metadata.report_date = reportMatch[1];
      }
    }
    
    if (!metadata.property_address) {
      for (const pattern of addressPatterns) {
        const match = line.match(pattern);
        if (match) {
          metadata.property_address = match[1].trim();
          break;
        }
      }
    }
    
    if (!metadata.expert_company) {
      for (const pattern of companyPatterns) {
        const match = line.match(pattern);
        if (match) {
          metadata.expert_company = match[1].trim();
          break;
        }
      }
    }
  }
  
  for (const pattern of CREDENTIAL_PATTERNS) {
    const match = documentText.match(pattern);
    if (match && !metadata.expert_credentials) {
      metadata.expert_credentials = match[0].trim();
      break;
    }
  }
  
  return metadata;
}

function detectSections(documentText) {
  const lines = documentText.split('\n');
  const sections = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const header of SECTION_HEADERS) {
      const regex = new RegExp('^' + header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*$', 'i');
      if (regex.test(line)) {
        const sectionContent = [];
        let j = i + 1;
        
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          
          const isNextHeader = SECTION_HEADERS.some(h => {
            const headerRegex = new RegExp('^' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*$', 'i');
            return headerRegex.test(nextLine);
          });
          
          if (isNextHeader) {
            break;
          }
          
          if (nextLine.length > 0) {
            sectionContent.push(nextLine);
          }
          
          j++;
          
          if (sectionContent.length > 100) break;
        }
        
        sections.push({
          header: header,
          start_line: i,
          content: sectionContent.join(' '),
          line_count: sectionContent.length
        });
        
        break;
      }
    }
  }
  
  return sections;
}

function validateExpertDocument(documentText) {
  const errors = [];
  const warnings = [];
  
  if (documentText.length < 200) {
    errors.push('Document text too short (minimum 200 characters)');
  }
  
  const hasCredentials = CREDENTIAL_PATTERNS.some(pattern => pattern.test(documentText));
  if (!hasCredentials) {
    warnings.push('No expert credentials detected');
  }
  
  const sections = detectSections(documentText);
  if (sections.length === 0) {
    warnings.push('No standard section headers detected');
  }
  
  const hasConclusion = /\b(conclusion|opinion|finding|determination)\b/i.test(documentText);
  if (!hasConclusion) {
    warnings.push('No conclusion or opinion section detected');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    has_credentials: hasCredentials,
    section_count: sections.length
  };
}

module.exports = {
  classifyExpertDocument,
  extractExpertMetadata,
  detectSections,
  validateExpertDocument
};
