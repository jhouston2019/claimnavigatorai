/**
 * ESTIMATE DELTA ENGINE
 * Compares submitted estimate vs carrier estimate using existing estimate engine
 * 
 * CRITICAL CONSTRAINTS:
 * - MUST USE existing estimate-engine.js
 * - Structural comparison only
 * - No valuation judgments
 * - No "underpaid" language
 * - No coverage interpretation
 */

const EstimateEngine = require('./estimate-engine');

// ============================================================================
// DELTA ANALYSIS
// ============================================================================

/**
 * Compares two estimates and identifies differences
 * @param {Object} params - Comparison parameters
 * @returns {Object} Delta analysis
 */
function compareEstimates(params) {
  const {
    originalEstimate,
    carrierEstimate
  } = params;

  // Analyze both estimates using the canonical engine
  const originalAnalysis = EstimateEngine.analyzeEstimate({
    estimateText: originalEstimate.text || '',
    lineItems: originalEstimate.lineItems || [],
    userInput: 'Original estimate',
    metadata: { source: 'original' }
  });

  const carrierAnalysis = EstimateEngine.analyzeEstimate({
    estimateText: carrierEstimate.text || '',
    lineItems: carrierEstimate.lineItems || [],
    userInput: 'Carrier estimate',
    metadata: { source: 'carrier' }
  });

  // Extract line items for comparison
  const originalItems = extractLineItems(originalEstimate);
  const carrierItems = extractLineItems(carrierEstimate);

  // Identify removed line items
  const removedLineItems = findRemovedItems(originalItems, carrierItems);

  // Identify reduced quantities
  const reducedQuantities = findReducedQuantities(originalItems, carrierItems);

  // Identify category omissions
  const categoryOmissions = findCategoryOmissions(originalItems, carrierItems);

  // Check for valuation changes
  const valuationChangesPresent = detectValuationChanges(
    originalEstimate,
    carrierEstimate
  );

  // Determine if scope regression occurred
  const scopeRegressionDetected = 
    removedLineItems.length > 0 ||
    reducedQuantities.length > 0 ||
    categoryOmissions.length > 0;

  return {
    removedLineItems,
    reducedQuantities,
    categoryOmissions,
    valuationChangesPresent,
    scopeRegressionDetected,
    originalAnalysis: {
      classification: originalAnalysis.classification,
      lineItemCount: originalItems.length
    },
    carrierAnalysis: {
      classification: carrierAnalysis.classification,
      lineItemCount: carrierItems.length
    },
    metadata: {
      comparedAt: new Date().toISOString(),
      originalTotal: calculateTotal(originalItems),
      carrierTotal: calculateTotal(carrierItems)
    }
  };
}

/**
 * Extracts line items from estimate
 * @param {Object} estimate - Estimate object
 * @returns {Array} Line items
 */
function extractLineItems(estimate) {
  if (estimate.lineItems && Array.isArray(estimate.lineItems)) {
    return estimate.lineItems;
  }

  // Parse from text if lineItems not provided
  if (estimate.text) {
    return parseLineItemsFromText(estimate.text);
  }

  return [];
}

/**
 * Parses line items from estimate text
 * @param {string} text - Estimate text
 * @returns {Array} Parsed line items
 */
function parseLineItemsFromText(text) {
  const items = [];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    // Simple line item detection (can be enhanced)
    const lineNumber = index + 1;
    
    // Look for patterns like "1. Item description" or "Item - $1000"
    const itemMatch = line.match(/^[\d.]+\s+(.+?)(?:\s+[-–]\s+)?\$?([\d,]+\.?\d*)?/);
    
    if (itemMatch) {
      const description = itemMatch[1].trim();
      const amount = itemMatch[2] ? parseFloat(itemMatch[2].replace(/,/g, '')) : 0;
      
      items.push({
        lineNumber,
        description,
        amount,
        originalLine: line.trim()
      });
    }
  });

  return items;
}

/**
 * Finds items present in original but not in carrier estimate
 * @param {Array} originalItems - Original line items
 * @param {Array} carrierItems - Carrier line items
 * @returns {Array} Removed items
 */
function findRemovedItems(originalItems, carrierItems) {
  const removed = [];
  
  originalItems.forEach(origItem => {
    const found = carrierItems.some(carrierItem => 
      isSimilarItem(origItem, carrierItem)
    );
    
    if (!found) {
      removed.push({
        lineNumber: origItem.lineNumber,
        description: origItem.description,
        amount: origItem.amount
      });
    }
  });

  return removed;
}

/**
 * Finds items with reduced quantities
 * @param {Array} originalItems - Original line items
 * @param {Array} carrierItems - Carrier line items
 * @returns {Array} Reduced items
 */
function findReducedQuantities(originalItems, carrierItems) {
  const reduced = [];

  originalItems.forEach(origItem => {
    const matchingCarrierItem = carrierItems.find(carrierItem =>
      isSimilarItem(origItem, carrierItem)
    );

    if (matchingCarrierItem) {
      const origQty = extractQuantity(origItem);
      const carrierQty = extractQuantity(matchingCarrierItem);

      if (origQty > carrierQty) {
        reduced.push({
          lineNumber: origItem.lineNumber,
          description: origItem.description,
          before: origQty,
          after: carrierQty
        });
      }
    }
  });

  return reduced;
}

/**
 * Finds category-level omissions
 * @param {Array} originalItems - Original line items
 * @param {Array} carrierItems - Carrier line items
 * @returns {Array} Category omissions
 */
function findCategoryOmissions(originalItems, carrierItems) {
  const omissions = [];
  
  // Extract categories from original
  const originalCategories = extractCategories(originalItems);
  const carrierCategories = extractCategories(carrierItems);

  originalCategories.forEach(category => {
    if (!carrierCategories.includes(category)) {
      const itemsInCategory = originalItems.filter(item =>
        categorizeItem(item) === category
      );

      omissions.push({
        category,
        issue: `Category not present in carrier estimate`,
        affectedItemCount: itemsInCategory.length
      });
    }
  });

  return omissions;
}

/**
 * Detects if valuation changes are present
 * @param {Object} originalEstimate - Original estimate
 * @param {Object} carrierEstimate - Carrier estimate
 * @returns {boolean} True if valuation changes detected
 */
function detectValuationChanges(originalEstimate, carrierEstimate) {
  const originalTotal = originalEstimate.total || 
    calculateTotal(extractLineItems(originalEstimate));
  
  const carrierTotal = carrierEstimate.total || 
    calculateTotal(extractLineItems(carrierEstimate));

  // If totals differ by more than $1, valuation changes present
  return Math.abs(originalTotal - carrierTotal) > 1;
}

/**
 * Checks if two items are similar (same item, possibly different amounts)
 * @param {Object} item1 - First item
 * @param {Object} item2 - Second item
 * @returns {boolean} True if similar
 */
function isSimilarItem(item1, item2) {
  const desc1 = (item1.description || '').toLowerCase().trim();
  const desc2 = (item2.description || '').toLowerCase().trim();

  // Exact match
  if (desc1 === desc2) return true;

  // Fuzzy match (contains or similar)
  if (desc1.includes(desc2) || desc2.includes(desc1)) return true;

  // Check for common significant keywords (must share primary subject)
  const keywords1 = desc1.split(/\s+/).filter(w => w.length > 3);
  const keywords2 = desc2.split(/\s+/).filter(w => w.length > 3);
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  
  // Must have at least 2 common keywords AND one must be a primary noun
  const primaryNouns = ['roof', 'siding', 'window', 'door', 'floor', 'paint', 'drywall', 'cabinet'];
  const hasPrimaryMatch = commonKeywords.some(k => primaryNouns.includes(k));
  
  if (commonKeywords.length >= 2 && hasPrimaryMatch) return true;

  // Calculate similarity
  const similarity = calculateSimilarity(desc1, desc2);
  return similarity > 0.7;
}

/**
 * Calculates string similarity (simple implementation)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculates Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Extracts quantity from line item
 * @param {Object} item - Line item
 * @returns {number} Quantity
 */
function extractQuantity(item) {
  if (item.quantity) return item.quantity;
  if (item.qty) return item.qty;

  // Try to extract from description
  const qtyMatch = (item.description || '').match(/(\d+)\s*(sq\.?\s*ft|sf|units?|ea)/i);
  return qtyMatch ? parseInt(qtyMatch[1]) : 1;
}

/**
 * Extracts categories from items
 * @param {Array} items - Line items
 * @returns {Array} Unique categories
 */
function extractCategories(items) {
  const categories = items.map(item => categorizeItem(item));
  return [...new Set(categories)];
}

/**
 * Categorizes a line item
 * @param {Object} item - Line item
 * @returns {string} Category
 */
function categorizeItem(item) {
  const desc = (item.description || '').toLowerCase();

  if (desc.includes('roof')) return 'Roofing';
  if (desc.includes('siding')) return 'Siding';
  if (desc.includes('window')) return 'Windows';
  if (desc.includes('door')) return 'Doors';
  if (desc.includes('floor')) return 'Flooring';
  if (desc.includes('paint')) return 'Painting';
  if (desc.includes('drywall') || desc.includes('sheetrock')) return 'Drywall';
  if (desc.includes('cabinet')) return 'Cabinets';
  if (desc.includes('counter')) return 'Countertops';
  if (desc.includes('hvac') || desc.includes('heating') || desc.includes('cooling')) return 'HVAC';
  if (desc.includes('plumb')) return 'Plumbing';
  if (desc.includes('electric')) return 'Electrical';

  return 'Other';
}

/**
 * Calculates total from line items
 * @param {Array} items - Line items
 * @returns {number} Total
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Gets delta summary
 * @param {Object} delta - Delta analysis result
 * @returns {string} Summary
 */
function getDeltaSummary(delta) {
  const parts = [];

  if (delta.removedLineItems.length > 0) {
    parts.push(`${delta.removedLineItems.length} line item(s) removed`);
  }

  if (delta.reducedQuantities.length > 0) {
    parts.push(`${delta.reducedQuantities.length} quantity reduction(s)`);
  }

  if (delta.categoryOmissions.length > 0) {
    parts.push(`${delta.categoryOmissions.length} category omission(s)`);
  }

  if (delta.valuationChangesPresent) {
    parts.push('Valuation changes present');
  }

  if (parts.length === 0) {
    return 'No significant differences detected';
  }

  return parts.join(', ');
}

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (Netlify Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    compareEstimates,
    getDeltaSummary
  };
}

// For Browser
if (typeof window !== 'undefined') {
  window.EstimateDeltaEngine = {
    compareEstimates,
    getDeltaSummary
  };
}

