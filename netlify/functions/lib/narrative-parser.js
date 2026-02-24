/**
 * Narrative Parser Engine
 * Deterministic NLP for expert report text analysis
 * Preserves negations, qualifiers, and conditionals
 */

const wink = require('wink-nlp');
const model = require('wink-eng-lite-web-model');

const nlp = wink(model);

const NEGATION_WORDS = ['not', 'no', 'never', 'neither', 'nor', 'none', 'nobody', 'nothing', 'nowhere', 'cannot', 'can\'t', 'won\'t', 'wouldn\'t', 'shouldn\'t', 'couldn\'t', 'doesn\'t', 'don\'t', 'didn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t'];

const CONDITIONAL_WORDS = ['if', 'unless', 'provided', 'assuming', 'subject to', 'contingent', 'may', 'might', 'could', 'would', 'should'];

const QUALIFICATION_PHRASES = [
  'in my opinion',
  'in my professional opinion',
  'based on my analysis',
  'based on my inspection',
  'based on limited inspection',
  'visual inspection only',
  'to the best of my knowledge',
  'appears to be',
  'seems to',
  'likely',
  'probably',
  'possibly',
  'suggests',
  'indicates',
  'consistent with',
  'inconsistent with',
  'subject to further testing',
  'pending further investigation',
  'requires additional analysis'
];

const MEASUREMENT_PATTERNS = [
  { name: 'percentage', pattern: /(\d+(?:\.\d+)?)\s*%/g, unit: '%' },
  { name: 'square_feet', pattern: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:SF|SQ\.?\s*FT\.?|square feet)/gi, unit: 'SF' },
  { name: 'linear_feet', pattern: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:LF|LIN\.?\s*FT\.?|linear feet)/gi, unit: 'LF' },
  { name: 'moisture_content', pattern: /(\d+(?:\.\d+)?)\s*%?\s*(?:MC|moisture content)/gi, unit: '% MC' },
  { name: 'spore_count', pattern: /(\d+(?:,\d{3})*)\s*(?:spores?\/m³|spores? per cubic meter)/gi, unit: 'spores/m³' },
  { name: 'crack_width', pattern: /(\d+\/\d+)"\s*(?:crack|width)/gi, unit: 'inches' },
  { name: 'inches', pattern: /(\d+(?:\.\d+)?)\s*(?:inches?|in\.?|")/g, unit: 'inches' },
  { name: 'feet', pattern: /(\d+(?:\.\d+)?)\s*(?:feet|ft\.?|')/g, unit: 'feet' },
  { name: 'dollars', pattern: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, unit: 'USD' }
];

function parseNarrative(documentText) {
  const doc = nlp.readDoc(documentText);
  
  const sentences = doc.sentences().out();
  
  const parsedSentences = sentences.map((sentence, index) => {
    return {
      index: index,
      text: sentence,
      has_negation: detectNegation(sentence),
      has_conditional: detectConditional(sentence),
      has_qualification: detectQualification(sentence),
      measurements: extractMeasurementsFromSentence(sentence)
    };
  });
  
  const allMeasurements = extractAllMeasurements(documentText);
  
  const negatedStatements = parsedSentences
    .filter(s => s.has_negation)
    .map(s => ({
      sentence: s.text,
      index: s.index,
      negation_words: findNegationWords(s.text)
    }));
  
  const conditionalStatements = parsedSentences
    .filter(s => s.has_conditional)
    .map(s => ({
      sentence: s.text,
      index: s.index,
      conditional_words: findConditionalWords(s.text)
    }));
  
  const qualificationStatements = parsedSentences
    .filter(s => s.has_qualification)
    .map(s => ({
      sentence: s.text,
      index: s.index,
      qualification_phrases: findQualificationPhrases(s.text)
    }));
  
  return {
    sentence_count: sentences.length,
    sentences: parsedSentences,
    measurements: allMeasurements,
    negated_statements: negatedStatements,
    conditional_statements: conditionalStatements,
    qualification_statements: qualificationStatements
  };
}

function detectNegation(sentence) {
  const lowerSentence = sentence.toLowerCase();
  return NEGATION_WORDS.some(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'i');
    return regex.test(lowerSentence);
  });
}

function detectConditional(sentence) {
  const lowerSentence = sentence.toLowerCase();
  return CONDITIONAL_WORDS.some(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'i');
    return regex.test(lowerSentence);
  });
}

function detectQualification(sentence) {
  const lowerSentence = sentence.toLowerCase();
  return QUALIFICATION_PHRASES.some(phrase => lowerSentence.includes(phrase));
}

function findNegationWords(sentence) {
  const lowerSentence = sentence.toLowerCase();
  const found = [];
  
  for (const word of NEGATION_WORDS) {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const matches = sentence.match(regex);
    if (matches) {
      found.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  return [...new Set(found)];
}

function findConditionalWords(sentence) {
  const lowerSentence = sentence.toLowerCase();
  const found = [];
  
  for (const word of CONDITIONAL_WORDS) {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const matches = sentence.match(regex);
    if (matches) {
      found.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  return [...new Set(found)];
}

function findQualificationPhrases(sentence) {
  const lowerSentence = sentence.toLowerCase();
  const found = [];
  
  for (const phrase of QUALIFICATION_PHRASES) {
    if (lowerSentence.includes(phrase)) {
      found.push(phrase);
    }
  }
  
  return found;
}

function extractMeasurementsFromSentence(sentence) {
  const measurements = [];
  
  for (const pattern of MEASUREMENT_PATTERNS) {
    const matches = [...sentence.matchAll(pattern.pattern)];
    
    for (const match of matches) {
      measurements.push({
        type: pattern.name,
        value: match[1].replace(/,/g, ''),
        unit: pattern.unit,
        raw_text: match[0]
      });
    }
  }
  
  return measurements;
}

function extractAllMeasurements(documentText) {
  const allMeasurements = [];
  
  for (const pattern of MEASUREMENT_PATTERNS) {
    const matches = [...documentText.matchAll(pattern.pattern)];
    
    for (const match of matches) {
      allMeasurements.push({
        type: pattern.name,
        value: match[1].replace(/,/g, ''),
        unit: pattern.unit,
        raw_text: match[0],
        context: extractContext(documentText, match.index, 50)
      });
    }
  }
  
  return allMeasurements;
}

function extractContext(text, position, radius) {
  const start = Math.max(0, position - radius);
  const end = Math.min(text.length, position + radius);
  return text.substring(start, end).trim();
}

function extractKeyPhrases(documentText) {
  const doc = nlp.readDoc(documentText);
  
  const entities = doc.entities().out();
  
  const nounPhrases = [];
  const sentences = doc.sentences();
  
  sentences.each(sentence => {
    const tokens = sentence.tokens();
    let currentPhrase = [];
    
    tokens.each(token => {
      const pos = token.out(nlp.its.pos);
      if (pos === 'NOUN' || pos === 'ADJ' || pos === 'PROPN') {
        currentPhrase.push(token.out());
      } else {
        if (currentPhrase.length >= 2) {
          nounPhrases.push(currentPhrase.join(' '));
        }
        currentPhrase = [];
      }
    });
    
    if (currentPhrase.length >= 2) {
      nounPhrases.push(currentPhrase.join(' '));
    }
  });
  
  return {
    entities: entities,
    noun_phrases: [...new Set(nounPhrases)]
  };
}

module.exports = {
  parseNarrative,
  detectNegation,
  detectConditional,
  detectQualification,
  extractAllMeasurements,
  extractKeyPhrases
};
