/**
 * CALCULATE DEPRECIATION FUNCTION
 * L2 - DETERMINISTIC CALCULATION (NO AI)
 * 
 * Calculates depreciation using standard accounting formulas
 */

const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR } = require('./_utils');

/**
 * Calculate straight-line depreciation
 */
function calculateStraightLine(rcv, age, usefulLife, salvageValue = 0) {
  const depreciableBase = rcv - salvageValue;
  const annualDepreciation = depreciableBase / usefulLife;
  const totalDepreciation = annualDepreciation * age;
  const currentValue = Math.max(rcv - totalDepreciation, salvageValue);
  const depreciationRate = (annualDepreciation / rcv) * 100;
  
  return {
    method: 'Straight-Line',
    originalCost: rcv,
    salvageValue: salvageValue,
    depreciableBase: depreciableBase,
    usefulLife: usefulLife,
    age: age,
    annualDepreciation: annualDepreciation,
    totalDepreciation: totalDepreciation,
    currentValue: currentValue,
    depreciationRate: depreciationRate,
    remainingLife: Math.max(usefulLife - age, 0),
    percentDepreciated: (totalDepreciation / depreciableBase) * 100
  };
}

/**
 * Calculate declining balance depreciation
 */
function calculateDecliningBalance(rcv, age, usefulLife, salvageValue = 0) {
  const rate = 1 / usefulLife;
  let bookValue = rcv;
  let totalDepreciation = 0;
  
  // Calculate year by year
  for (let year = 0; year < age; year++) {
    const yearlyDepreciation = bookValue * rate;
    totalDepreciation += yearlyDepreciation;
    bookValue = Math.max(bookValue - yearlyDepreciation, salvageValue);
  }
  
  const currentValue = Math.max(bookValue, salvageValue);
  const depreciationRate = rate * 100;
  
  return {
    method: 'Declining Balance',
    originalCost: rcv,
    salvageValue: salvageValue,
    depreciableBase: rcv - salvageValue,
    usefulLife: usefulLife,
    age: age,
    annualDepreciationRate: depreciationRate,
    totalDepreciation: totalDepreciation,
    currentValue: currentValue,
    bookValue: bookValue,
    remainingLife: Math.max(usefulLife - age, 0),
    percentDepreciated: (totalDepreciation / rcv) * 100
  };
}

/**
 * Calculate sum of years digits depreciation
 */
function calculateSumOfYearsDigits(rcv, age, usefulLife, salvageValue = 0) {
  const depreciableBase = rcv - salvageValue;
  const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
  
  let totalDepreciation = 0;
  
  // Calculate depreciation for each year up to current age
  for (let year = 1; year <= age; year++) {
    const remainingLife = usefulLife - year + 1;
    const yearlyDepreciation = (remainingLife / sumOfYears) * depreciableBase;
    totalDepreciation += yearlyDepreciation;
  }
  
  const currentValue = Math.max(rcv - totalDepreciation, salvageValue);
  const currentYearRemainingLife = usefulLife - age;
  const currentYearDepreciation = currentYearRemainingLife > 0 
    ? (currentYearRemainingLife / sumOfYears) * depreciableBase 
    : 0;
  
  return {
    method: 'Sum of Years Digits',
    originalCost: rcv,
    salvageValue: salvageValue,
    depreciableBase: depreciableBase,
    usefulLife: usefulLife,
    age: age,
    sumOfYears: sumOfYears,
    totalDepreciation: totalDepreciation,
    currentValue: currentValue,
    currentYearDepreciation: currentYearDepreciation,
    remainingLife: Math.max(usefulLife - age, 0),
    percentDepreciated: (totalDepreciation / depreciableBase) * 100
  };
}

/**
 * Format currency
 */
function formatCurrency(value) {
  return `$${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Format percentage
 */
function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Calculate depreciation based on method
 */
function calculateDepreciation(rcv, age, usefulLife, salvageValue, method) {
  // Validate inputs
  if (rcv <= 0) {
    throw new Error('Original cost (RCV) must be greater than 0');
  }
  
  if (age < 0) {
    throw new Error('Age cannot be negative');
  }
  
  if (usefulLife <= 0) {
    throw new Error('Useful life must be greater than 0');
  }
  
  if (salvageValue < 0) {
    throw new Error('Salvage value cannot be negative');
  }
  
  if (salvageValue >= rcv) {
    throw new Error('Salvage value must be less than original cost');
  }
  
  // Calculate based on method
  let calculation;
  switch (method.toLowerCase()) {
    case 'straight-line':
      calculation = calculateStraightLine(rcv, age, usefulLife, salvageValue);
      break;
    case 'declining-balance':
      calculation = calculateDecliningBalance(rcv, age, usefulLife, salvageValue);
      break;
    case 'sum-of-years':
      calculation = calculateSumOfYearsDigits(rcv, age, usefulLife, salvageValue);
      break;
    default:
      throw new Error(`Unknown depreciation method: ${method}`);
  }
  
  // Add formatted values
  calculation.formatted = {
    originalCost: formatCurrency(calculation.originalCost),
    salvageValue: formatCurrency(calculation.salvageValue),
    depreciableBase: formatCurrency(calculation.depreciableBase),
    totalDepreciation: formatCurrency(calculation.totalDepreciation),
    currentValue: formatCurrency(calculation.currentValue),
    percentDepreciated: formatPercent(calculation.percentDepreciated)
  };
  
  // Add summary
  calculation.summary = `Using ${calculation.method} method, an asset with original cost of ${calculation.formatted.originalCost} ` +
    `and useful life of ${calculation.usefulLife} years, after ${calculation.age} years of use, ` +
    `has depreciated by ${calculation.formatted.totalDepreciation} (${calculation.formatted.percentDepreciated}). ` +
    `Current value: ${calculation.formatted.currentValue}.`;
  
  return calculation;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
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
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { 
      originalCost, 
      rcv, 
      itemAge, 
      age, 
      usefulLife, 
      salvageValue = 0, 
      depreciationMethod,
      method 
    } = body;

    // Handle field name variations
    const costValue = originalCost || rcv;
    const ageValue = itemAge || age;
    const methodValue = depreciationMethod || method;

    // Validate required fields
    if (!costValue) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'originalCost or rcv is required' 
        })
      };
    }

    if (ageValue === undefined || ageValue === null) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'age or itemAge is required' 
        })
      };
    }

    if (!usefulLife) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'usefulLife is required' 
        })
      };
    }

    if (!methodValue) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'method or depreciationMethod is required' 
        })
      };
    }

    // Convert to numbers
    const rcvNum = parseFloat(costValue);
    const ageNum = parseFloat(ageValue);
    const usefulLifeNum = parseFloat(usefulLife);
    const salvageValueNum = parseFloat(salvageValue);

    // Validate numeric values
    if (isNaN(rcvNum) || isNaN(ageNum) || isNaN(usefulLifeNum) || isNaN(salvageValueNum)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'All numeric values must be valid numbers' 
        })
      };
    }

    // Calculate depreciation
    const result = calculateDepreciation(
      rcvNum, 
      ageNum, 
      usefulLifeNum, 
      salvageValueNum, 
      methodValue
    );

    // Log event
    await LOG_EVENT('depreciation_calculated', 'calculate-depreciation', {
      method: methodValue,
      originalCost: rcvNum,
      currentValue: result.currentValue
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
        metadata: {
          calculation_method: 'deterministic',
          formula_applied: result.method,
          ai_used: false,
          calculatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('[calculate-depreciation] Error:', error);
    await LOG_ERROR('calculate-depreciation', error, { body: event.body });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to calculate depreciation'
      })
    };
  }
};


