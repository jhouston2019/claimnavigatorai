/**
 * Opinion Extraction Engine
 * Deterministic extraction of expert conclusions and causation statements
 * Preserves negations and qualifiers
 */

const CAUSATION_PHRASES = {
  positive: [
    'caused by',
    'attributable to',
    'result of',
    'resulting from',
    'due to',
    'because of',
    'consistent with',
    'indicative of',
    'evidence of',
    'supports',
    'confirms'
  ],
  negative: [
    'not caused by',
    'not attributable to',
    'not consistent with',
    'inconsistent with',
    'not indicative of',
    'no evidence of',
    'does not support',
    'contradicts',
    'rules out'
  ]
};

const COVERED_PERIL_KEYWORDS = [
  'wind',
  'windstorm',
  'hurricane',
  'tornado',
  'hail',
  'storm',
  'lightning',
  'fire',
  'smoke',
  'explosion',
  'water damage',
  'burst pipe',
  'sudden',
  'accidental',
  'covered peril',
  'insured event'
];

const EXCLUDED_CAUSE_KEYWORDS = [
  'wear and tear',
  'deterioration',
  'gradual',
  'settlement',
  'earth movement',
  'soil',
  'pre-existing',
  'maintenance',
  'neglect',
  'age',
  'long-term',
  'chronic',
  'excluded peril'
];

const OPINION_MARKERS = [
  'in my opinion',
  'in my professional opinion',
  'it is my opinion',
  'i believe',
  'i conclude',
  'my conclusion',
  'my assessment',
  'my determination',
  'my finding',
  'based on my analysis',
  'based on my experience'
];

function extractOpinions(narrativeData) {
  const { sentences } = narrativeData;
  
  const opinions = [];
  const causationStatements = [];
  
  for (const sentenceObj of sentences) {
    const sentence = sentenceObj.text;
    const lowerSentence = sentence.toLowerCase();
    
    const hasOpinionMarker = OPINION_MARKERS.some(marker => lowerSentence.includes(marker));
    
    if (hasOpinionMarker) {
      opinions.push({
        sentence: sentence,
        index: sentenceObj.index,
        opinion_type: 'explicit',
        markers: OPINION_MARKERS.filter(m => lowerSentence.includes(m))
      });
    }
    
    const causationResult = detectCausation(sentence, sentenceObj);
    if (causationResult) {
      causationStatements.push(causationResult);
    }
  }
  
  const overallCausation = determineCausationOpinion(causationStatements);
  
  return {
    opinions: opinions,
    causation_statements: causationStatements,
    causation_opinion: overallCausation.opinion,
    causation_confidence: overallCausation.confidence,
    opinion_count: opinions.length
  };
}

function detectCausation(sentence, sentenceObj) {
  const lowerSentence = sentence.toLowerCase();
  
  let causationType = null;
  let matchedPhrase = null;
  let isNegated = sentenceObj.has_negation;
  
  for (const phrase of CAUSATION_PHRASES.negative) {
    if (lowerSentence.includes(phrase)) {
      causationType = 'negative';
      matchedPhrase = phrase;
      break;
    }
  }
  
  if (!causationType) {
    for (const phrase of CAUSATION_PHRASES.positive) {
      if (lowerSentence.includes(phrase)) {
        causationType = 'positive';
        matchedPhrase = phrase;
        break;
      }
    }
  }
  
  if (!causationType) {
    return null;
  }
  
  const mentionsCoveredPeril = COVERED_PERIL_KEYWORDS.some(keyword => 
    lowerSentence.includes(keyword)
  );
  
  const mentionsExcludedCause = EXCLUDED_CAUSE_KEYWORDS.some(keyword => 
    lowerSentence.includes(keyword)
  );
  
  let opinion = 'indeterminate';
  
  if (causationType === 'positive' && mentionsCoveredPeril && !isNegated) {
    opinion = 'covered';
  } else if (causationType === 'negative' && mentionsCoveredPeril) {
    opinion = 'not_covered';
  } else if (causationType === 'positive' && mentionsExcludedCause && !isNegated) {
    opinion = 'not_covered';
  } else if (causationType === 'negative' && mentionsExcludedCause) {
    opinion = 'covered';
  }
  
  return {
    sentence: sentence,
    index: sentenceObj.index,
    causation_type: causationType,
    matched_phrase: matchedPhrase,
    is_negated: isNegated,
    mentions_covered_peril: mentionsCoveredPeril,
    mentions_excluded_cause: mentionsExcludedCause,
    opinion: opinion,
    has_qualification: sentenceObj.has_qualification
  };
}

function determineCausationOpinion(causationStatements) {
  if (causationStatements.length === 0) {
    return {
      opinion: 'not_stated',
      confidence: 'none'
    };
  }
  
  const coveredCount = causationStatements.filter(s => s.opinion === 'covered').length;
  const notCoveredCount = causationStatements.filter(s => s.opinion === 'not_covered').length;
  const indeterminateCount = causationStatements.filter(s => s.opinion === 'indeterminate').length;
  
  const totalStatements = causationStatements.length;
  
  if (notCoveredCount > coveredCount && notCoveredCount >= totalStatements * 0.6) {
    const confidence = notCoveredCount === totalStatements ? 'strong' : 'moderate';
    return { opinion: 'not_covered', confidence };
  }
  
  if (coveredCount > notCoveredCount && coveredCount >= totalStatements * 0.6) {
    const confidence = coveredCount === totalStatements ? 'strong' : 'moderate';
    return { opinion: 'covered', confidence };
  }
  
  if (indeterminateCount >= totalStatements * 0.5) {
    return { opinion: 'indeterminate', confidence: 'weak' };
  }
  
  return { opinion: 'indeterminate', confidence: 'weak' };
}

function extractConclusions(documentText, sections) {
  const conclusionSections = sections.filter(s => 
    /conclusion|opinion|determination|finding/i.test(s.header)
  );
  
  if (conclusionSections.length === 0) {
    return [];
  }
  
  const conclusions = [];
  
  for (const section of conclusionSections) {
    const sectionSentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sectionSentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20) {
        conclusions.push({
          section: section.header,
          sentence: trimmed,
          has_negation: detectNegation(trimmed),
          has_qualification: detectQualification(trimmed)
        });
      }
    }
  }
  
  return conclusions;
}

function extractRecommendations(documentText, sections) {
  const recommendationSections = sections.filter(s => 
    /recommendation|suggest|advise|should|must|require/i.test(s.header)
  );
  
  if (recommendationSections.length === 0) {
    return [];
  }
  
  const recommendations = [];
  
  for (const section of recommendationSections) {
    const sectionSentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sectionSentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20) {
        const lowerSentence = trimmed.toLowerCase();
        const isRecommendation = /\b(recommend|suggest|should|must|require|advise)\b/i.test(trimmed);
        
        if (isRecommendation) {
          recommendations.push({
            section: section.header,
            recommendation: trimmed,
            priority: determinePriority(trimmed)
          });
        }
      }
    }
  }
  
  return recommendations;
}

function determinePriority(recommendation) {
  const lowerRec = recommendation.toLowerCase();
  
  if (lowerRec.includes('must') || lowerRec.includes('required') || lowerRec.includes('critical')) {
    return 'high';
  }
  
  if (lowerRec.includes('should') || lowerRec.includes('recommend')) {
    return 'medium';
  }
  
  return 'low';
}

module.exports = {
  extractOpinions,
  extractConclusions,
  extractRecommendations,
  detectCausation,
  determineCausationOpinion
};
