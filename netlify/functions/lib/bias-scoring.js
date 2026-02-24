/**
 * Bias Scoring Engine
 * Rule-based detection of carrier-aligned vs policyholder-aligned language
 * No AI - deterministic phrase matching only
 */

const CARRIER_ALIGNED_PHRASES = {
  wear_and_tear: {
    phrases: [
      'wear and tear',
      'normal wear',
      'expected wear',
      'age-related wear',
      'typical wear'
    ],
    weight: 2.0
  },
  deterioration: {
    phrases: [
      'deterioration',
      'deteriorated',
      'deteriorating',
      'long-term deterioration',
      'gradual deterioration',
      'progressive deterioration'
    ],
    weight: 2.0
  },
  pre_existing: {
    phrases: [
      'pre-existing',
      'preexisting',
      'pre existing',
      'prior damage',
      'previous damage',
      'existing condition',
      'prior to loss'
    ],
    weight: 2.5
  },
  settlement: {
    phrases: [
      'settlement',
      'soil settlement',
      'foundation settlement',
      'settling',
      'settled'
    ],
    weight: 2.0
  },
  gradual: {
    phrases: [
      'gradual',
      'gradually',
      'over time',
      'long-term',
      'chronic',
      'ongoing',
      'progressive'
    ],
    weight: 1.5
  },
  maintenance: {
    phrases: [
      'lack of maintenance',
      'poor maintenance',
      'deferred maintenance',
      'maintenance issue',
      'maintenance related',
      'neglect'
    ],
    weight: 2.5
  },
  excluded: {
    phrases: [
      'not storm-related',
      'not weather-related',
      'not covered',
      'excluded peril',
      'excluded cause',
      'earth movement',
      'soil movement'
    ],
    weight: 3.0
  }
};

const POLICYHOLDER_ALIGNED_PHRASES = {
  storm_damage: {
    phrases: [
      'wind uplift',
      'wind damage',
      'storm event',
      'storm damage',
      'weather event',
      'windstorm',
      'hurricane damage'
    ],
    weight: 2.0
  },
  sudden: {
    phrases: [
      'sudden damage',
      'sudden event',
      'acute failure',
      'abrupt',
      'immediate',
      'rapid onset',
      'single event'
    ],
    weight: 2.0
  },
  covered_peril: {
    phrases: [
      'covered peril',
      'insured event',
      'covered event',
      'covered loss',
      'insured loss',
      'covered damage'
    ],
    weight: 3.0
  },
  code_upgrade: {
    phrases: [
      'code upgrade required',
      'code compliance required',
      'building code requires',
      'code mandates',
      'required by code',
      'code enforcement'
    ],
    weight: 2.5
  },
  matching: {
    phrases: [
      'matching required',
      'cannot match',
      'discontinued',
      'no longer available',
      'matching coverage',
      'like kind and quality'
    ],
    weight: 2.0
  },
  structural: {
    phrases: [
      'structural damage',
      'structural failure',
      'structural compromise',
      'load-bearing',
      'structural integrity'
    ],
    weight: 1.5
  }
};

function calculateBiasScore(documentText, narrativeData) {
  const lowerText = documentText.toLowerCase();
  
  const carrierMatches = [];
  let carrierScore = 0;
  
  for (const [category, config] of Object.entries(CARRIER_ALIGNED_PHRASES)) {
    for (const phrase of config.phrases) {
      const regex = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      const matches = documentText.match(regex);
      
      if (matches) {
        const count = matches.length;
        carrierScore += count * config.weight;
        
        carrierMatches.push({
          category: category,
          phrase: phrase,
          count: count,
          weight: config.weight,
          contribution: count * config.weight
        });
      }
    }
  }
  
  const policyholderMatches = [];
  let policyholderScore = 0;
  
  for (const [category, config] of Object.entries(POLICYHOLDER_ALIGNED_PHRASES)) {
    for (const phrase of config.phrases) {
      const regex = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      const matches = documentText.match(regex);
      
      if (matches) {
        const count = matches.length;
        policyholderScore += count * config.weight;
        
        policyholderMatches.push({
          category: category,
          phrase: phrase,
          count: count,
          weight: config.weight,
          contribution: count * config.weight
        });
      }
    }
  }
  
  const totalScore = carrierScore + policyholderScore;
  
  let biasScore = 0;
  if (totalScore > 0) {
    biasScore = (carrierScore - policyholderScore) / totalScore;
  }
  
  biasScore = Math.max(-1, Math.min(1, biasScore));
  
  let biasClassification = 'neutral';
  if (biasScore > 0.3) {
    biasClassification = 'carrier_aligned';
  } else if (biasScore < -0.3) {
    biasClassification = 'policyholder_aligned';
  }
  
  return {
    bias_score: parseFloat(biasScore.toFixed(3)),
    bias_classification: biasClassification,
    carrier_score: carrierScore,
    policyholder_score: policyholderScore,
    carrier_aligned_phrases: carrierMatches,
    policyholder_aligned_phrases: policyholderMatches,
    total_phrase_matches: carrierMatches.length + policyholderMatches.length
  };
}

function analyzeToneBalance(narrativeData) {
  const { sentences } = narrativeData;
  
  let carrierSentences = 0;
  let policyholderSentences = 0;
  let neutralSentences = 0;
  
  for (const sentenceObj of sentences) {
    const sentence = sentenceObj.text.toLowerCase();
    
    const hasCarrierPhrase = Object.values(CARRIER_ALIGNED_PHRASES).some(config =>
      config.phrases.some(phrase => sentence.includes(phrase))
    );
    
    const hasPolicyholderPhrase = Object.values(POLICYHOLDER_ALIGNED_PHRASES).some(config =>
      config.phrases.some(phrase => sentence.includes(phrase))
    );
    
    if (hasCarrierPhrase && !hasPolicyholderPhrase) {
      carrierSentences++;
    } else if (hasPolicyholderPhrase && !hasCarrierPhrase) {
      policyholderSentences++;
    } else {
      neutralSentences++;
    }
  }
  
  const totalSentences = sentences.length;
  
  return {
    carrier_sentence_percent: totalSentences > 0 ? (carrierSentences / totalSentences * 100).toFixed(1) : 0,
    policyholder_sentence_percent: totalSentences > 0 ? (policyholderSentences / totalSentences * 100).toFixed(1) : 0,
    neutral_sentence_percent: totalSentences > 0 ? (neutralSentences / totalSentences * 100).toFixed(1) : 0,
    carrier_sentence_count: carrierSentences,
    policyholder_sentence_count: policyholderSentences,
    neutral_sentence_count: neutralSentences
  };
}

function detectHedgingLanguage(narrativeData) {
  const hedgingPhrases = [
    'may be',
    'might be',
    'could be',
    'possibly',
    'perhaps',
    'appears to',
    'seems to',
    'suggests',
    'indicates',
    'likely',
    'probably',
    'potentially'
  ];
  
  const hedgingSentences = [];
  
  for (const sentenceObj of narrativeData.sentences) {
    const sentence = sentenceObj.text;
    const lowerSentence = sentence.toLowerCase();
    
    const matchedPhrases = hedgingPhrases.filter(phrase => lowerSentence.includes(phrase));
    
    if (matchedPhrases.length > 0) {
      hedgingSentences.push({
        sentence: sentence,
        index: sentenceObj.index,
        hedging_phrases: matchedPhrases
      });
    }
  }
  
  const hedgingScore = narrativeData.sentence_count > 0 
    ? hedgingSentences.length / narrativeData.sentence_count 
    : 0;
  
  return {
    hedging_sentence_count: hedgingSentences.length,
    hedging_score: parseFloat(hedgingScore.toFixed(3)),
    hedging_sentences: hedgingSentences
  };
}

module.exports = {
  calculateBiasScore,
  analyzeToneBalance,
  detectHedgingLanguage
};
