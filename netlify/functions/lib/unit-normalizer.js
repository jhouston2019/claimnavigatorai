/**
 * Unit Normalization Engine
 * Critical for accurate estimate comparison
 * Converts all units to standard base units for math
 */

// Unit conversion factors to base units
const UNIT_CONVERSIONS = {
  // Area units (base: SF - Square Feet)
  'SQ': { base: 'SF', factor: 100, category: 'area', name: 'Square' },
  'SQUARE': { base: 'SF', factor: 100, category: 'area', name: 'Square' },
  'SF': { base: 'SF', factor: 1, category: 'area', name: 'Square Foot' },
  'SY': { base: 'SF', factor: 9, category: 'area', name: 'Square Yard' },
  
  // Linear units (base: LF - Linear Feet)
  'LF': { base: 'LF', factor: 1, category: 'linear', name: 'Linear Foot' },
  'FT': { base: 'LF', factor: 1, category: 'linear', name: 'Foot' },
  'IN': { base: 'LF', factor: 0.0833, category: 'linear', name: 'Inch' },
  'YD': { base: 'LF', factor: 3, category: 'linear', name: 'Yard' },
  
  // Volume units (base: CY - Cubic Yards)
  'CY': { base: 'CY', factor: 1, category: 'volume', name: 'Cubic Yard' },
  'CF': { base: 'CY', factor: 0.037, category: 'volume', name: 'Cubic Foot' },
  
  // Count units (base: EA - Each)
  'EA': { base: 'EA', factor: 1, category: 'count', name: 'Each' },
  'EACH': { base: 'EA', factor: 1, category: 'count', name: 'Each' },
  'PC': { base: 'EA', factor: 1, category: 'count', name: 'Piece' },
  'PIECE': { base: 'EA', factor: 1, category: 'count', name: 'Piece' },
  'UNIT': { base: 'EA', factor: 1, category: 'count', name: 'Unit' },
  
  // Time units (base: HR - Hours)
  'HR': { base: 'HR', factor: 1, category: 'time', name: 'Hour' },
  'HOUR': { base: 'HR', factor: 1, category: 'time', name: 'Hour' },
  'DAY': { base: 'HR', factor: 8, category: 'time', name: 'Day' },
  
  // Weight units (base: LB - Pounds)
  'LB': { base: 'LB', factor: 1, category: 'weight', name: 'Pound' },
  'TON': { base: 'LB', factor: 2000, category: 'weight', name: 'Ton' },
  
  // Special units
  'LS': { base: 'LS', factor: 1, category: 'lumpsum', name: 'Lump Sum' },
  'LUMPSUM': { base: 'LS', factor: 1, category: 'lumpsum', name: 'Lump Sum' },
  'ALLOWANCE': { base: 'LS', factor: 1, category: 'lumpsum', name: 'Allowance' }
};

/**
 * Normalize a unit to its standard form
 * @param {string} unit - Unit to normalize
 * @returns {string} Normalized unit
 */
function normalizeUnit(unit) {
  if (!unit) return null;
  
  const upperUnit = unit.toUpperCase().trim();
  
  // Direct match
  if (UNIT_CONVERSIONS[upperUnit]) {
    return upperUnit;
  }
  
  // Try to find partial match
  for (const [key, value] of Object.entries(UNIT_CONVERSIONS)) {
    if (upperUnit.includes(key) || key.includes(upperUnit)) {
      return key;
    }
  }
  
  return upperUnit; // Return as-is if not recognized
}

/**
 * Check if two units are compatible (same category)
 * @param {string} unit1 
 * @param {string} unit2 
 * @returns {boolean}
 */
function areUnitsCompatible(unit1, unit2) {
  const norm1 = normalizeUnit(unit1);
  const norm2 = normalizeUnit(unit2);
  
  if (!norm1 || !norm2) return false;
  
  const conv1 = UNIT_CONVERSIONS[norm1];
  const conv2 = UNIT_CONVERSIONS[norm2];
  
  if (!conv1 || !conv2) return false;
  
  // Same category = compatible
  return conv1.category === conv2.category;
}

/**
 * Convert quantity from one unit to another
 * @param {number} quantity 
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @returns {number|null} Converted quantity or null if incompatible
 */
function convertQuantity(quantity, fromUnit, toUnit) {
  if (!quantity || !fromUnit || !toUnit) return null;
  
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);
  
  // Same unit, no conversion needed
  if (normFrom === normTo) return quantity;
  
  const convFrom = UNIT_CONVERSIONS[normFrom];
  const convTo = UNIT_CONVERSIONS[normTo];
  
  if (!convFrom || !convTo) return null;
  
  // Check compatibility
  if (convFrom.category !== convTo.category) {
    return null; // Cannot convert between different categories
  }
  
  // Convert to base unit, then to target unit
  const baseQuantity = quantity * convFrom.factor;
  const convertedQuantity = baseQuantity / convTo.factor;
  
  return parseFloat(convertedQuantity.toFixed(4));
}

/**
 * Normalize line item quantities to standard units
 * Critical for accurate comparison
 * @param {object} contractorItem 
 * @param {object} carrierItem 
 * @returns {object} Normalized quantities and units
 */
function normalizeLineItemUnits(contractorItem, carrierItem) {
  const contractorUnit = normalizeUnit(contractorItem.unit);
  const carrierUnit = normalizeUnit(carrierItem.unit);
  
  // Check if units are compatible
  if (!areUnitsCompatible(contractorUnit, carrierUnit)) {
    return {
      compatible: false,
      contractor_unit: contractorUnit,
      carrier_unit: carrierUnit,
      contractor_quantity: contractorItem.quantity,
      carrier_quantity: carrierItem.quantity,
      error: `Incompatible units: ${contractorUnit} vs ${carrierUnit}`
    };
  }
  
  // Determine which unit to use as standard (prefer contractor's)
  const standardUnit = contractorUnit;
  
  // Convert carrier quantity to contractor's unit
  const carrierQuantityNormalized = convertQuantity(
    carrierItem.quantity,
    carrierUnit,
    standardUnit
  );
  
  // Calculate unit prices in normalized units
  const contractorUnitPrice = contractorItem.unit_price;
  
  // Carrier unit price needs adjustment if units differ
  let carrierUnitPriceNormalized = carrierItem.unit_price;
  if (contractorUnit !== carrierUnit) {
    // Price per unit needs inverse conversion
    const convFrom = UNIT_CONVERSIONS[carrierUnit];
    const convTo = UNIT_CONVERSIONS[contractorUnit];
    carrierUnitPriceNormalized = carrierItem.unit_price * (convFrom.factor / convTo.factor);
  }
  
  return {
    compatible: true,
    standard_unit: standardUnit,
    
    // Contractor (original)
    contractor_unit_original: contractorItem.unit,
    contractor_quantity_original: contractorItem.quantity,
    contractor_unit_price_original: contractorItem.unit_price,
    
    // Carrier (original)
    carrier_unit_original: carrierItem.unit,
    carrier_quantity_original: carrierItem.quantity,
    carrier_unit_price_original: carrierItem.unit_price,
    
    // Normalized values
    contractor_quantity: contractorItem.quantity,
    contractor_unit_price: contractorUnitPrice,
    carrier_quantity: carrierQuantityNormalized,
    carrier_unit_price: carrierUnitPriceNormalized,
    
    // Conversion applied
    unit_conversion_applied: contractorUnit !== carrierUnit,
    conversion_factor: contractorUnit !== carrierUnit 
      ? UNIT_CONVERSIONS[carrierUnit].factor / UNIT_CONVERSIONS[contractorUnit].factor
      : 1
  };
}

/**
 * Calculate accurate delta with unit normalization
 * @param {object} contractorItem 
 * @param {object} carrierItem 
 * @returns {object} Delta calculations
 */
function calculateNormalizedDelta(contractorItem, carrierItem) {
  const normalized = normalizeLineItemUnits(contractorItem, carrierItem);
  
  if (!normalized.compatible) {
    return {
      error: normalized.error,
      compatible: false
    };
  }
  
  // Calculate deltas using normalized values
  const quantityDelta = normalized.contractor_quantity - normalized.carrier_quantity;
  const unitPriceDelta = normalized.contractor_unit_price - normalized.carrier_unit_price;
  
  // Calculate totals
  const contractorTotal = normalized.contractor_quantity * normalized.contractor_unit_price;
  const carrierTotal = normalized.carrier_quantity * normalized.carrier_unit_price;
  const totalDelta = contractorTotal - carrierTotal;
  
  return {
    compatible: true,
    ...normalized,
    
    // Deltas
    quantity_delta: parseFloat(quantityDelta.toFixed(4)),
    unit_price_delta: parseFloat(unitPriceDelta.toFixed(2)),
    total_delta: parseFloat(totalDelta.toFixed(2)),
    
    // Totals
    contractor_total: parseFloat(contractorTotal.toFixed(2)),
    carrier_total: parseFloat(carrierTotal.toFixed(2)),
    
    // Percentage differences
    quantity_diff_percent: normalized.carrier_quantity !== 0 
      ? parseFloat(((quantityDelta / normalized.carrier_quantity) * 100).toFixed(2))
      : 100,
    unit_price_diff_percent: normalized.carrier_unit_price !== 0
      ? parseFloat(((unitPriceDelta / normalized.carrier_unit_price) * 100).toFixed(2))
      : 100,
    total_diff_percent: carrierTotal !== 0
      ? parseFloat(((totalDelta / carrierTotal) * 100).toFixed(2))
      : 100
  };
}

/**
 * Get unit category
 * @param {string} unit 
 * @returns {string}
 */
function getUnitCategory(unit) {
  const normalized = normalizeUnit(unit);
  const conversion = UNIT_CONVERSIONS[normalized];
  return conversion ? conversion.category : 'unknown';
}

/**
 * Get unit display name
 * @param {string} unit 
 * @returns {string}
 */
function getUnitDisplayName(unit) {
  const normalized = normalizeUnit(unit);
  const conversion = UNIT_CONVERSIONS[normalized];
  return conversion ? conversion.name : unit;
}

/**
 * Format unit conversion message
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @param {number} quantity 
 * @returns {string}
 */
function formatConversionMessage(fromUnit, toUnit, quantity) {
  const converted = convertQuantity(quantity, fromUnit, toUnit);
  if (!converted) return null;
  
  return `${quantity} ${fromUnit} = ${converted} ${toUnit}`;
}

module.exports = {
  normalizeUnit,
  areUnitsCompatible,
  convertQuantity,
  normalizeLineItemUnits,
  calculateNormalizedDelta,
  getUnitCategory,
  getUnitDisplayName,
  formatConversionMessage,
  UNIT_CONVERSIONS
};
