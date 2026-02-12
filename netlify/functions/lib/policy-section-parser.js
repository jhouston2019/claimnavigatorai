/**
 * Policy Section Parser
 * Breaks policy document into structured sections
 * Declarations, Coverage, Conditions, Endorsements, Schedules
 */

/**
 * Parse policy into structured sections
 * @param {string} policyText - Raw policy text
 * @returns {object} Structured sections
 */
function parsePolicySections(policyText) {
  const sections = {
    declarations: extractDeclarationsSection(policyText),
    coverage: extractCoverageSection(policyText),
    conditions: extractConditionsSection(policyText),
    endorsements: extractEndorsementsSection(policyText),
    schedules: extractSchedulesSection(policyText),
    exclusions: extractExclusionsSection(policyText)
  };
  
  return sections;
}

/**
 * Extract Declarations section
 */
function extractDeclarationsSection(text) {
  const patterns = [
    /DECLARATIONS?\s+PAGE(.*?)(?=SECTION|COVERAGE|CONDITIONS|ENDORSEMENT|$)/is,
    /POLICY\s+DECLARATIONS?(.*?)(?=SECTION|COVERAGE|CONDITIONS|ENDORSEMENT|$)/is,
    /DEC\s+PAGE(.*?)(?=SECTION|COVERAGE|CONDITIONS|ENDORSEMENT|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Coverage section
 */
function extractCoverageSection(text) {
  const patterns = [
    /SECTION\s+I\s+[-–—]\s+PROPERTY\s+COVERAGES?(.*?)(?=SECTION\s+II|CONDITIONS|EXCLUSIONS|ENDORSEMENT|$)/is,
    /COVERAGE\s+A\s+[-–—]\s+DWELLING(.*?)(?=SECTION|CONDITIONS|EXCLUSIONS|ENDORSEMENT|$)/is,
    /BUILDING\s+AND\s+PERSONAL\s+PROPERTY\s+COVERAGE\s+FORM(.*?)(?=CONDITIONS|EXCLUSIONS|ENDORSEMENT|$)/is,
    /PROPERTY\s+COVERAGE(.*?)(?=CONDITIONS|EXCLUSIONS|ENDORSEMENT|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Conditions section
 */
function extractConditionsSection(text) {
  const patterns = [
    /CONDITIONS?(.*?)(?=SECTION|ENDORSEMENT|SCHEDULE|$)/is,
    /POLICY\s+CONDITIONS?(.*?)(?=SECTION|ENDORSEMENT|SCHEDULE|$)/is,
    /GENERAL\s+CONDITIONS?(.*?)(?=SECTION|ENDORSEMENT|SCHEDULE|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Endorsements section
 */
function extractEndorsementsSection(text) {
  const patterns = [
    /ENDORSEMENTS?(.*?)(?=SCHEDULE|$)/is,
    /FORMS\s+AND\s+ENDORSEMENTS?(.*?)(?=SCHEDULE|$)/is,
    /POLICY\s+ENDORSEMENTS?(.*?)(?=SCHEDULE|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Schedules section
 */
function extractSchedulesSection(text) {
  const patterns = [
    /SCHEDULE\s+OF\s+LOCATIONS?(.*?)(?=ENDORSEMENT|CONDITIONS|$)/is,
    /LOCATION\s+SCHEDULE(.*?)(?=ENDORSEMENT|CONDITIONS|$)/is,
    /SCHEDULE\s+OF\s+COVERAGES?(.*?)(?=ENDORSEMENT|CONDITIONS|$)/is,
    /SCHEDULE(.*?)(?=ENDORSEMENT|CONDITIONS|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Exclusions section
 */
function extractExclusionsSection(text) {
  const patterns = [
    /EXCLUSIONS?(.*?)(?=CONDITIONS|ENDORSEMENT|SCHEDULE|$)/is,
    /WHAT\s+IS\s+NOT\s+COVERED(.*?)(?=CONDITIONS|ENDORSEMENT|SCHEDULE|$)/is,
    /WE\s+DO\s+NOT\s+COVER(.*?)(?=CONDITIONS|ENDORSEMENT|SCHEDULE|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Generic section extractor
 */
function extractSection(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract coverage letter sections (A, B, C, D, E, F)
 */
function extractCoverageLetters(text) {
  const coverages = {};
  
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const nextLetter = letters[i + 1];
    
    let pattern;
    if (nextLetter) {
      pattern = new RegExp(`COVERAGE\\s+${letter}\\s+[-–—](.*?)(?=COVERAGE\\s+${nextLetter}|SECTION|CONDITIONS|EXCLUSIONS)`, 'is');
    } else {
      pattern = new RegExp(`COVERAGE\\s+${letter}\\s+[-–—](.*?)(?=SECTION|CONDITIONS|EXCLUSIONS|ENDORSEMENT)`, 'is');
    }
    
    const match = text.match(pattern);
    if (match && match[1]) {
      coverages[letter] = match[1].trim();
    }
  }
  
  return coverages;
}

/**
 * Extract commercial property coverage sections
 */
function extractCommercialCoverageSections(text) {
  return {
    building: extractBuildingCoverage(text),
    business_personal_property: extractBusinessPersonalPropertyCoverage(text),
    loss_of_income: extractLossOfIncomeCoverage(text),
    extra_expense: extractExtraExpenseCoverage(text)
  };
}

/**
 * Extract Building coverage section
 */
function extractBuildingCoverage(text) {
  const patterns = [
    /BUILDING\s+COVERAGE(.*?)(?=BUSINESS\s+PERSONAL\s+PROPERTY|YOUR\s+BUSINESS\s+PERSONAL|CONDITIONS|$)/is,
    /COVERAGE\s+A\s+[-–—]\s+BUILDING(.*?)(?=COVERAGE\s+B|BUSINESS\s+PERSONAL|CONDITIONS|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Business Personal Property coverage section
 */
function extractBusinessPersonalPropertyCoverage(text) {
  const patterns = [
    /BUSINESS\s+PERSONAL\s+PROPERTY\s+COVERAGE(.*?)(?=LOSS\s+OF\s+INCOME|EXTRA\s+EXPENSE|CONDITIONS|$)/is,
    /YOUR\s+BUSINESS\s+PERSONAL\s+PROPERTY(.*?)(?=LOSS\s+OF\s+INCOME|EXTRA\s+EXPENSE|CONDITIONS|$)/is,
    /COVERAGE\s+B\s+[-–—]\s+BUSINESS\s+PERSONAL(.*?)(?=COVERAGE\s+C|LOSS\s+OF\s+INCOME|CONDITIONS|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Loss of Income coverage section
 */
function extractLossOfIncomeCoverage(text) {
  const patterns = [
    /LOSS\s+OF\s+INCOME\s+COVERAGE(.*?)(?=EXTRA\s+EXPENSE|CONDITIONS|EXCLUSIONS|$)/is,
    /BUSINESS\s+INCOME\s+COVERAGE(.*?)(?=EXTRA\s+EXPENSE|CONDITIONS|EXCLUSIONS|$)/is,
    /COVERAGE\s+C\s+[-–—]\s+BUSINESS\s+INCOME(.*?)(?=COVERAGE\s+D|EXTRA\s+EXPENSE|CONDITIONS|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Extract Extra Expense coverage section
 */
function extractExtraExpenseCoverage(text) {
  const patterns = [
    /EXTRA\s+EXPENSE\s+COVERAGE(.*?)(?=CONDITIONS|EXCLUSIONS|ENDORSEMENT|$)/is,
    /COVERAGE\s+D\s+[-–—]\s+EXTRA\s+EXPENSE(.*?)(?=CONDITIONS|EXCLUSIONS|ENDORSEMENT|$)/is
  ];
  
  return extractSection(text, patterns);
}

/**
 * Find all endorsement titles
 */
function extractEndorsementTitles(text) {
  const titles = [];
  
  // Pattern: ENDORSEMENT followed by title in caps
  const pattern = /ENDORSEMENT[:\s]+([A-Z][A-Z\s&-]+?)(?:\n|POLICY|THIS|THE|WE|YOU|$)/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const title = match[1].trim();
    if (title.length > 5 && title.length < 100) {
      titles.push(title);
    }
  }
  
  return titles;
}

module.exports = {
  parsePolicySections,
  extractDeclarationsSection,
  extractCoverageSection,
  extractConditionsSection,
  extractEndorsementsSection,
  extractSchedulesSection,
  extractExclusionsSection,
  extractCoverageLetters,
  extractCommercialCoverageSections,
  extractEndorsementTitles
};
