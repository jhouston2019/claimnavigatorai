/**
 * Limitation & Disclaimer Detector
 * Identifies scope limitations in expert reports
 * Rule-based extraction only
 */

const LIMITATION_PHRASES = {
  inspection_scope: {
    phrases: [
      'visual inspection only',
      'visual inspection',
      'limited to visual inspection',
      'non-invasive inspection',
      'no destructive testing',
      'no invasive testing',
      'accessible areas only',
      'limited access',
      'limited to accessible areas'
    ],
    severity: 'high'
  },
  testing_scope: {
    phrases: [
      'no testing performed',
      'no laboratory testing',
      'no material testing',
      'no structural calculations',
      'no engineering calculations',
      'no load calculations',
      'no moisture testing',
      'no air sampling'
    ],
    severity: 'high'
  },
  area_scope: {
    phrases: [
      'limited to',
      'confined to',
      'restricted to',
      'only inspected',
      'did not inspect',
      'was not inspected',
      'were not inspected',
      'not included in scope',
      'outside scope of work'
    ],
    severity: 'medium'
  },
  further_investigation: {
    phrases: [
      'further investigation required',
      'additional testing required',
      'requires further analysis',
      'pending further investigation',
      'subject to further testing',
      'recommend additional investigation',
      'recommend further testing',
      'additional analysis needed'
    ],
    severity: 'high'
  },
  hidden_damage: {
    phrases: [
      'hidden damage may exist',
      'concealed damage',
      'damage may be present',
      'may be present in',
      'not visible',
      'behind walls',
      'within cavities',
      'beneath surfaces'
    ],
    severity: 'critical'
  },
  qualification: {
    phrases: [
      'based on information provided',
      'assuming',
      'if accurate',
      'subject to verification',
      'pending confirmation',
      'contingent upon',
      'provided that'
    ],
    severity: 'medium'
  }
};

const DISCLAIMER_KEYWORDS = [
  'limitation',
  'limited',
  'disclaimer',
  'scope',
  'not responsible',
  'no warranty',
  'not liable',
  'subject to',
  'contingent',
  'assumes no liability'
];

function detectLimitations(narrativeData, sections) {
  const limitations = [];
  
  const limitationSections = sections.filter(s => 
    /limitation|disclaimer|scope|exclusion/i.test(s.header)
  );
  
  if (limitationSections.length > 0) {
    for (const section of limitationSections) {
      const sectionLimitations = extractLimitationsFromText(section.content);
      limitations.push(...sectionLimitations.map(l => ({
        ...l,
        source: 'limitation_section',
        section: section.header
      })));
    }
  }
  
  for (const sentenceObj of narrativeData.sentences) {
    const sentence = sentenceObj.text;
    const lowerSentence = sentence.toLowerCase();
    
    const hasDisclaimerKeyword = DISCLAIMER_KEYWORDS.some(keyword => 
      lowerSentence.includes(keyword)
    );
    
    if (hasDisclaimerKeyword) {
      const sentenceLimitations = extractLimitationsFromText(sentence);
      limitations.push(...sentenceLimitations.map(l => ({
        ...l,
        source: 'inline_statement',
        sentence_index: sentenceObj.index
      })));
    }
  }
  
  const uniqueLimitations = deduplicateLimitations(limitations);
  
  const severityScore = calculateSeverityScore(uniqueLimitations);
  
  return {
    limitations: uniqueLimitations,
    limitation_count: uniqueLimitations.length,
    severity_score: severityScore,
    has_critical_limitations: uniqueLimitations.some(l => l.severity === 'critical')
  };
}

function extractLimitationsFromText(text) {
  const limitations = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, config] of Object.entries(LIMITATION_PHRASES)) {
    for (const phrase of config.phrases) {
      if (lowerText.includes(phrase)) {
        const context = extractLimitationContext(text, phrase);
        
        limitations.push({
          category: category,
          phrase: phrase,
          severity: config.severity,
          context: context,
          full_text: text
        });
      }
    }
  }
  
  return limitations;
}

function extractLimitationContext(text, phrase) {
  const lowerText = text.toLowerCase();
  const phraseIndex = lowerText.indexOf(phrase);
  
  if (phraseIndex === -1) {
    return text.substring(0, 150);
  }
  
  const start = Math.max(0, phraseIndex - 50);
  const end = Math.min(text.length, phraseIndex + phrase.length + 100);
  
  return text.substring(start, end).trim();
}

function deduplicateLimitations(limitations) {
  const seen = new Set();
  const unique = [];
  
  for (const limitation of limitations) {
    const key = `${limitation.category}:${limitation.phrase}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(limitation);
    }
  }
  
  return unique;
}

function calculateSeverityScore(limitations) {
  if (limitations.length === 0) {
    return 0;
  }
  
  const severityWeights = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  
  const totalWeight = limitations.reduce((sum, limitation) => {
    return sum + (severityWeights[limitation.severity] || 0);
  }, 0);
  
  const maxPossibleWeight = limitations.length * 4;
  
  const normalizedScore = totalWeight / maxPossibleWeight;
  
  return parseFloat(normalizedScore.toFixed(3));
}

function extractScopeQualifiers(narrativeData) {
  const qualifiers = [];
  
  for (const sentenceObj of narrativeData.qualification_statements) {
    qualifiers.push({
      sentence: sentenceObj.sentence,
      index: sentenceObj.index,
      qualification_phrases: sentenceObj.qualification_phrases
    });
  }
  
  return qualifiers;
}

module.exports = {
  detectLimitations,
  extractLimitationsFromText,
  extractScopeQualifiers,
  calculateSeverityScore
};
