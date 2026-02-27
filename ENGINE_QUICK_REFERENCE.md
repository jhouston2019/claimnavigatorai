# CLAIM COMMAND PRO - ENGINE QUICK REFERENCE

**Quick reference for all estimate analysis engines**

---

## 🔍 LOSS EXPECTATION ENGINE

**File:** `netlify/functions/lib/loss-expectation-engine.js`

### Usage
```javascript
const LossExpectationEngine = require('./lib/loss-expectation-engine');

const result = LossExpectationEngine.analyzeLossExpectation({
  lineItems: [
    { description: 'Drying equipment', quantity: 3, unit: 'DAY', total: 450 },
    { description: 'Drywall replacement', quantity: 500, unit: 'SF', total: 1500 }
  ],
  totalCost: 5150,
  metadata: {}
});
```

### Output
```javascript
{
  success: true,
  lossType: 'WATER',           // WATER, FIRE, WIND, HAIL, COLLISION
  severity: 'LEVEL_2',          // Varies by loss type
  confidence: 0.85,             // 0.0 - 1.0
  expectedTrades: {
    name: 'Level 2 Water Damage (Significant)',
    description: '...',
    required: [...],            // Trades with 0.90+ probability
    common: [...],              // Trades with 0.60-0.89 probability
    unlikely: [...]             // Trades with <0.60 probability
  },
  missingTrades: [              // Critical trades not found
    {
      trade: 'PNT',
      tradeName: 'Painting',
      probability: 0.95,
      severity: 'CRITICAL',
      impact: 'Required trade missing'
    }
  ],
  completenessScore: 85.5       // 0-100
}
```

### Supported Loss Types
- **WATER:** LEVEL_1, LEVEL_2, LEVEL_3, CATEGORY_3
- **FIRE:** LIGHT, MODERATE, HEAVY
- **WIND:** MINOR, MAJOR
- **HAIL:** MINOR, MAJOR
- **COLLISION:** MINOR, MAJOR

---

## 📊 TRADE COMPLETENESS ENGINE

**File:** `netlify/functions/lib/trade-completeness-engine.js`

### Usage
```javascript
const TradeCompletenessEngine = require('./lib/trade-completeness-engine');

const result = TradeCompletenessEngine.analyzeTradeCompleteness({
  lineItems: [
    { description: 'Remove drywall', quantity: 500, unit: 'SF', total: 750 },
    { description: 'Install drywall', quantity: 500, unit: 'SF', total: 1500 }
  ],
  metadata: {}
});
```

### Output
```javascript
{
  success: true,
  integrityScore: 85.5,         // 0-100 overall score
  integrityLevel: 'GOOD',       // EXCELLENT, GOOD, FAIR, POOR, CRITICAL
  integrityDescription: 'Minor completeness issues',
  tradeScores: [
    {
      trade: 'Drywall',
      tradeCode: 'DRY',
      score: 85,                // 0-100 per trade
      issues: [
        {
          criterion: 'finish_missing',
          severity: 'HIGH',
          description: 'Drywall without finish layer (Painting)',
          impact: 'Missing finish layer',
          recommendation: 'Add Painting to complete work'
        }
      ],
      itemCount: 2,
      hasRemoval: true,
      hasInstall: true
    }
  ],
  criticalIssues: [...],        // Severity = CRITICAL
  highIssues: [...],            // Severity = HIGH
  moderateIssues: [...],        // Severity = MODERATE
  summary: {
    total_trades: 5,
    trades_with_issues: 2,
    critical_issues_count: 0,
    high_issues_count: 1,
    moderate_issues_count: 2,
    average_trade_score: 87.5
  }
}
```

### 5 Scoring Criteria
1. **Removal present** (if needed) - 20 points
2. **Replacement present** (if removal found) - 25 points
3. **Finish layer present** (e.g., paint after drywall) - 15 points
4. **Material + labor present** - 15 points each
5. **Quantity consistency** (removal ≈ installation) - 10 points

---

## 🔧 CODE UPGRADE ENGINE

**File:** `netlify/functions/lib/code-upgrade-engine.js`

### Usage
```javascript
const CodeUpgradeEngine = require('./lib/code-upgrade-engine');

const result = CodeUpgradeEngine.analyzeCodeUpgrades({
  lineItems: [...],
  reconciliation: {},
  exposure: {},
  propertyMetadata: { roof_size: 2500 },
  regionalData: { climate: 'cold' }
});
```

### Output
```javascript
{
  codeUpgradeFlags: [
    {
      triggered: true,
      issue: 'Roof 25% Rule Triggered',
      category: 'code_compliance',
      priority: 'high',
      explanation: '28.5% of roof affected. Building codes require full roof replacement when 25%+ is damaged.',
      estimatedCostImpact: 15000.00,
      calculation: { ... }
    }
  ],
  totalCodeUpgradeExposure: 15000.00,
  flagCount: 1
}
```

### Detected Code Items
1. Roof 25% replacement rule
2. Drip edge (IRC R905.2.8.5)
3. Ice & water shield (IRC R905.2.7.1)
4. Ventilation compliance
5. Insulation R-value upgrades
6. Electrical code upgrades
7. Plumbing code upgrades

---

## 💰 PRICING VALIDATION ENGINE

**File:** `netlify/functions/lib/pricing-validation-engine.js`

### Usage
```javascript
const PricingValidationEngine = require('./lib/pricing-validation-engine');

const result = await PricingValidationEngine.validatePricing({
  lineItems: [
    { description: 'Asphalt shingles install', quantity: 25, unit: 'SQ', unit_price: 250, total: 6250 }
  ],
  state: 'CA',
  metadata: {}
});
```

### Output
```javascript
{
  totalVariance: -3750.00,      // Negative = underpriced
  variancePercentage: -37.5,
  overpriced: [],
  underpriced: [
    {
      lineNumber: 1,
      description: 'Asphalt shingles install',
      estimatePrice: 250,
      marketPrice: 500,           // Adjusted for CA
      variance: -250,
      variancePercentage: -50.0,
      severity: 'CRITICAL',
      explanation: 'Priced 50.0% below market rate'
    }
  ],
  marketComparison: {
    estimateTotal: 6250,
    marketTotal: 10000,
    variance: -3750
  },
  regionalMultiplier: 1.25,     // CA adjustment
  confidence: 85
}
```

---

## 📉 DEPRECIATION VALIDATOR

**File:** `netlify/functions/lib/depreciation-validator.js`

### Usage
```javascript
const DepreciationValidator = require('./lib/depreciation-validator');

const result = DepreciationValidator.validateDepreciation(
  carrierDepreciation,
  contractorData,
  policyData
);
```

### Output
```javascript
{
  valid: false,
  issues: [
    {
      type: 'excessive_depreciation',
      severity: 'high',
      message: 'Depreciation rate of 65% is unusually high. Industry standard is typically 20-40%.',
      impact: 4500.00
    }
  ],
  recommendations: [
    'Request justification for 65% depreciation rate or adjustment to industry standard (25-30%).'
  ],
  total_impact: 4500.00,
  depreciation_summary: {
    applied: 15000.00,
    withheld: 15000.00,
    recoverable: 15000.00,
    rate: 65
  }
}
```

---

## 👷 LABOR RATE VALIDATOR

**File:** `netlify/functions/lib/labor-rate-validator.js` (TO BE CREATED)

### Usage
```javascript
const LaborRateValidator = require('./lib/labor-rate-validator');

const result = await LaborRateValidator.validateLaborRates({
  lineItems: [
    { description: 'Electrician labor', quantity: 8, unit: 'HR', unit_price: 45, total: 360 }
  ],
  region: 'CA-San Francisco',
  metadata: {}
});
```

### Output
```javascript
{
  success: true,
  totalLaborCost: 360.00,
  laborVariance: -520.00,       // Negative = underpaid
  undervaluedLabor: [
    {
      lineNumber: 1,
      description: 'Electrician labor',
      trade: 'Electrician',
      estimateRate: 45.00,
      marketRate: { min: 85, avg: 110, max: 140 },
      variance: -65.00,
      variancePercentage: -59.1,
      severity: 'CRITICAL',
      issue: 'Labor rate 59.1% below market average',
      impact: 520.00,
      recommendation: 'Verify labor rate. Market average for Electrician in CA-San Francisco is $110/hr'
    }
  ],
  overvaluedLabor: [],
  laborScore: 60,               // 0-100
  region: 'CA-San Francisco'
}
```

---

## 🎯 CARRIER TACTIC DETECTOR

**File:** `netlify/functions/lib/carrier-tactic-detector.js`

### Usage
```javascript
const CarrierTacticDetector = require('./lib/carrier-tactic-detector');

const result = await CarrierTacticDetector.detectCarrierTactics({
  contractorItems: [...],
  carrierItems: [...],
  matchedPairs: [...],
  metadata: {}
});
```

### Output
```javascript
{
  tacticsDetected: [
    {
      type: 'repair_vs_replace',
      severity: 'high',
      description: 'Roofing shingles',
      contractor_scope: 'Replace',
      carrier_scope: 'Repair',
      contractor_total: 8750.00,
      carrier_total: 2500.00,
      reduction_amount: 6250.00,
      message: 'Carrier changed scope from "replace" to "repair" to reduce payment',
      recommendation: 'Challenge scope reduction. If item cannot be properly repaired, replacement is required.',
      policy_basis: 'Policy requires restoration to pre-loss condition'
    }
  ],
  totalImpact: 6250.00,
  severityScore: 75,            // 0-100 (higher = more tactics)
  recommendations: [...]
}
```

### Detected Tactics
1. Scope reduction (repair vs replace)
2. Material downgrade
3. Labor rate suppression
4. Code upgrade denial
5. Depreciation tactics
6. Causation challenges
7. Coverage limitations
8. Documentation burden

---

## 🔄 INTEGRATION EXAMPLE

### Full Pipeline
```javascript
// Step 1: Parse estimate
const EstimateEngine = require('./app/assets/js/intelligence/estimate-engine');
const engineResult = EstimateEngine.analyzeEstimate({ ... });

// Step 2: Loss expectation
const LossExpectationEngine = require('./lib/loss-expectation-engine');
const lossExpectation = LossExpectationEngine.analyzeLossExpectation({ ... });

// Step 3: Trade completeness
const TradeCompletenessEngine = require('./lib/trade-completeness-engine');
const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({ ... });

// Step 4: Code upgrades
const CodeUpgradeEngine = require('./lib/code-upgrade-engine');
const codeUpgrades = CodeUpgradeEngine.analyzeCodeUpgrades({ ... });

// Step 5: Pricing validation
const PricingValidationEngine = require('./lib/pricing-validation-engine');
const pricingAnalysis = await PricingValidationEngine.validatePricing({ ... });

// Step 6: Depreciation validation
const DepreciationValidator = require('./lib/depreciation-validator');
const depreciationAnalysis = DepreciationValidator.validateDepreciation({ ... });

// Step 7: Labor validation
const LaborRateValidator = require('./lib/labor-rate-validator');
const laborAnalysis = await LaborRateValidator.validateLaborRates({ ... });

// Step 8: Carrier tactics
const CarrierTacticDetector = require('./lib/carrier-tactic-detector');
const carrierTactics = await CarrierTacticDetector.detectCarrierTactics({ ... });

// Combine results
const comprehensiveAnalysis = {
  ...engineResult,
  lossExpectation,
  tradeCompleteness,
  codeUpgrades,
  pricingAnalysis,
  depreciationAnalysis,
  laborAnalysis,
  carrierTactics
};
```

---

## 📋 CHECKLIST FOR INTEGRATION

### Before Integration
- [ ] All engines created
- [ ] All engines tested individually
- [ ] Database migrations applied
- [ ] Line item extraction working

### During Integration
- [ ] Import all engines
- [ ] Call engines in sequence
- [ ] Handle errors gracefully
- [ ] Combine results properly
- [ ] Update response format

### After Integration
- [ ] Integration tests passing
- [ ] Performance acceptable (<20s)
- [ ] Error handling working
- [ ] Logging complete
- [ ] Documentation updated

---

**Last Updated:** February 27, 2026  
**Version:** 2.0  
**Status:** Ready for Integration
