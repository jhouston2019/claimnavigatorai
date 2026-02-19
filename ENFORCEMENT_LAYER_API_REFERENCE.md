# 📘 **ENFORCEMENT LAYER API REFERENCE**

## **Quick Start Guide for Developers**

---

## **🔧 ENDPOINTS**

### **1. Analyze Estimates (with Enforcement Layers)**

**Endpoint:** `POST /analyze-estimates-v2`

**Request:**
```javascript
{
  "claim_id": "uuid",
  "contractor_estimate_pdf_url": "https://...",
  "carrier_estimate_pdf_url": "https://...",
  "property_metadata": {
    "roof_size": 100,
    "address": "123 Main St"
  },
  "regional_data": {
    "climate": "cold",
    "state": "MN"
  },
  "carrier_name": "State Farm"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    // FINANCIAL EXPOSURE
    "exposure": {
      "totalProjectedRecovery": 10000,
      "totalProjectedRecoveryWithEnforcement": 15000,
      "rcvDeltaTotal": 8000,
      "acvDeltaTotal": 6000,
      "recoverableDepreciationTotal": 2000,
      "opExposure": {
        "qualifiesForOP": true,
        "opAmount": 2000,
        "tradesDetected": ["Roofing", "Siding", "Drywall"],
        "tradeCount": 3
      },
      "categoryBreakdown": [ /* ... */ ],
      "structuredLineItemDeltas": [ /* ... */ ]
    },
    
    // ENFORCEMENT LAYERS
    "enforcement": {
      "totalProjectedRecoveryWithEnforcement": 15000,
      "codeUpgrades": {
        "totalCodeUpgradeExposure": 3000,
        "flagCount": 2,
        "codeUpgradeFlags": [
          {
            "issue": "Roof 25% Rule Triggered",
            "priority": "high",
            "explanation": "30% of roof affected...",
            "estimatedCostImpact": 2625,
            "calculation": { /* ... */ }
          }
        ]
      },
      "coverageCrosswalk": {
        "coverageExposureAdjustments": 2000,
        "conflictCount": 1,
        "coverageConflicts": [
          {
            "issue": "Ordinance & Law Coverage Available",
            "category": "coverage_enhancement",
            "priority": "high",
            "explanation": "Policy includes 25% O&L coverage..."
          }
        ]
      },
      "carrierPatterns": {
        "carrierName": "State Farm",
        "patternCount": 2,
        "severityScore": 5,
        "riskLevel": "high",
        "patternFlags": [
          {
            "pattern": "Systemic O&P Omission",
            "category": "op_omission",
            "confidence": "high",
            "explanation": "Carrier omitted O&P...",
            "severity": 3
          }
        ]
      }
    }
  }
}
```

---

### **2. Generate Supplement Packet**

**Endpoint:** `POST /generate-supplement-packet`

**Request:**
```javascript
{
  "claimId": "uuid",
  "exposure": { /* exposure object from analyze-estimates-v2 */ },
  "codeUpgrades": { /* from enforcement.codeUpgrades */ },
  "coverageConflicts": { /* from enforcement.coverageCrosswalk */ },
  "patternFlags": { /* from enforcement.carrierPatterns */ },
  "reconciliation": { /* full reconciliation object */ },
  "format": "json" // or "html", "pdf-ready", "supplement-ready"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "supplementPacket": {
      "claimId": "uuid",
      "generatedAt": "2026-02-14T12:00:00Z",
      "totalSupplementRequest": 15000,
      "executiveSummary": {
        "totalSupplementRequest": 15000,
        "summary": "This supplement request totals $15,000...",
        "keyFindings": [
          "Estimate Discrepancy: $8,000 in underpaid line items",
          "Overhead & Profit: $2,000 (multi-trade project)",
          "Code Upgrades: $3,000 (2 requirements)",
          "Coverage Adjustments: $2,000 (1 conflicts)"
        ],
        "recommendation": "Approve supplement request in full..."
      },
      "financialBreakdown": { /* ... */ },
      "categoryExposureTable": [ /* ... */ ],
      "oAndPJustification": { /* ... */ },
      "codeUpgradeJustification": { /* ... */ },
      "policyConflictSection": { /* ... */ },
      "carrierPatternSection": { /* ... */ },
      "structuredLineItemAppendix": [ /* ... */ ]
    },
    "totalSupplementRequest": 15000,
    "format": "json",
    "stored": true
  }
}
```

---

## **🗄️ DATABASE QUERIES**

### **Get Enforcement Report**

```sql
SELECT * FROM claim_enforcement_reports
WHERE claim_id = 'uuid'
AND user_id = auth.uid();
```

**Or use helper function:**
```sql
SELECT get_enforcement_report('claim-uuid');
```

### **Get Supplement Packet**

```sql
SELECT * FROM claim_supplement_packets
WHERE claim_id = 'uuid'
AND user_id = auth.uid();
```

**Or use helper function:**
```sql
SELECT get_supplement_packet('claim-uuid');
```

### **Get Carrier Pattern Statistics**

```sql
SELECT get_carrier_pattern_stats('State Farm');
```

**Returns:**
```json
{
  "carrier_name": "State Farm",
  "total_claims": 15,
  "avg_severity_score": 6.2,
  "risk_level_distribution": {
    "low": 3,
    "medium": 5,
    "high": 5,
    "critical": 2
  },
  "avg_pattern_count": 2.8
}
```

---

## **🧪 TESTING**

### **Run All Tests**

```bash
# Code Upgrade Engine
node tests/code-upgrade-engine.test.js

# Policy Crosswalk Engine
node tests/policy-crosswalk.test.js

# Carrier Pattern Engine
node tests/carrier-pattern-engine.test.js

# Supplement Packet Generator
node tests/supplement-packet.test.js
```

### **Run All Tests at Once**

```bash
node tests/code-upgrade-engine.test.js && \
node tests/policy-crosswalk.test.js && \
node tests/carrier-pattern-engine.test.js && \
node tests/supplement-packet.test.js
```

---

## **📦 IMPORTING MODULES**

### **Backend (Netlify Functions)**

```javascript
// Code Upgrade Engine
const { analyzeCodeUpgrades } = require('./lib/code-upgrade-engine');

// Policy Crosswalk Engine
const { analyzePolicyCrosswalk } = require('./lib/policy-estimate-crosswalk');

// Carrier Pattern Engine
const { analyzeCarrierPatterns } = require('./lib/carrier-pattern-engine');

// Use in your function
const codeUpgrades = analyzeCodeUpgrades({
  lineItems: contractorParsed.lineItems,
  reconciliation: reconciliation,
  exposure: exposureSummary,
  propertyMetadata: body.property_metadata || {},
  regionalData: body.regional_data || {}
});
```

### **Frontend (JavaScript)**

```javascript
// Access enforcement data from API response
const enforcement = response.data.enforcement;

// Code upgrades
const codeUpgrades = enforcement.codeUpgrades;
console.log(`Code Upgrade Exposure: $${codeUpgrades.totalCodeUpgradeExposure}`);

// Coverage conflicts
const coverageCrosswalk = enforcement.coverageCrosswalk;
console.log(`Coverage Conflicts: ${coverageCrosswalk.conflictCount}`);

// Carrier patterns
const carrierPatterns = enforcement.carrierPatterns;
console.log(`Carrier Risk Level: ${carrierPatterns.riskLevel}`);
```

---

## **🎨 FRONTEND RENDERING**

### **Display Enforcement Breakdown**

```javascript
// In your component
renderEstimateComparison() {
  const enforcement = this.data.enforcement || {};
  const codeUpgrades = enforcement.codeUpgrades || {};
  const coverageCrosswalk = enforcement.coverageCrosswalk || {};
  const carrierPatterns = enforcement.carrierPatterns || {};
  
  return `
    <div class="output-subsection">
      <h4>Enforcement Layer Breakdown</h4>
      <div class="output-grid">
        <div class="output-card">
          <div class="output-label">Base Exposure</div>
          <div class="output-value">${formatCurrency(exposure.totalProjectedRecovery)}</div>
        </div>
        ${codeUpgrades.totalCodeUpgradeExposure > 0 ? `
          <div class="output-card highlight-warning">
            <div class="output-label">Code Upgrades</div>
            <div class="output-value">${formatCurrency(codeUpgrades.totalCodeUpgradeExposure)}</div>
            <div class="output-sublabel">${codeUpgrades.flagCount} requirement(s)</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
```

---

## **🔍 DEBUGGING**

### **Enable Verbose Logging**

```javascript
// In analyze-estimates-v2.js
console.log('[Enforcement] Code Upgrades:', codeUpgrades);
console.log('[Enforcement] Coverage Crosswalk:', coverageCrosswalk);
console.log('[Enforcement] Carrier Patterns:', carrierPatterns);
console.log('[Enforcement] Total with Enforcement:', totalProjectedRecoveryWithEnforcement);
```

### **Validate Calculations**

```javascript
// Verify total calculation
const calculatedTotal = 
  exposure.totalProjectedRecovery +
  codeUpgrades.totalCodeUpgradeExposure +
  coverageCrosswalk.coverageExposureAdjustments;

console.assert(
  calculatedTotal === totalProjectedRecoveryWithEnforcement,
  'Total mismatch!'
);
```

---

## **⚙️ CONFIGURATION**

### **Regional Data**

```javascript
const regionalData = {
  climate: 'cold', // or 'warm', 'moderate'
  state: 'MN', // Two-letter state code
  // Optional:
  building_code_year: 2021,
  seismic_zone: false
};
```

### **Property Metadata**

```javascript
const propertyMetadata = {
  roof_size: 100, // Total roof size in SQ
  // Optional:
  year_built: 1985,
  square_footage: 2500,
  stories: 2
};
```

---

## **📊 DATA STRUCTURES**

### **Code Upgrade Flag**

```typescript
interface CodeUpgradeFlag {
  triggered: boolean;
  issue: string;
  category: 'code_compliance';
  priority: 'high' | 'medium' | 'low';
  explanation: string;
  estimatedCostImpact: number;
  calculation: {
    // Varies by rule
  };
}
```

### **Coverage Conflict**

```typescript
interface CoverageConflict {
  triggered: boolean;
  issue: string;
  category: 'coverage_conflict' | 'coverage_enhancement' | 'coverage_limitation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  exposureAdjustment: number; // Can be positive or negative
}
```

### **Carrier Pattern**

```typescript
interface CarrierPattern {
  detected: boolean;
  pattern: string;
  category: 'op_omission' | 'labor_depreciation' | 'price_suppression' | 'category_omission' | 'variance';
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  severity: number; // 1-3
}
```

---

## **🚨 ERROR HANDLING**

### **Common Errors**

**1. Missing Property Metadata**
```javascript
// Graceful fallback
const propertyMetadata = body.property_metadata || {};
const roofSize = propertyMetadata.roof_size || (totalRoofingQuantity * 4);
```

**2. Missing Regional Data**
```javascript
// Graceful fallback
const regionalData = body.regional_data || {};
const climate = regionalData.climate || 'moderate';
```

**3. No Policy Data**
```javascript
// Returns empty conflicts
const coverageCrosswalk = analyzePolicyCrosswalk({
  parsedPolicy: {}, // Empty policy
  reconciliation: reconciliation,
  exposure: exposureSummary,
  lineItems: lineItems
});
// Result: { conflictCount: 0, coverageExposureAdjustments: 0 }
```

---

## **🎯 BEST PRACTICES**

### **1. Always Validate Totals**

```javascript
const totalProjectedRecoveryWithEnforcement = 
  exposure.totalProjectedRecovery +
  codeUpgrades.totalCodeUpgradeExposure +
  coverageCrosswalk.coverageExposureAdjustments;

// Store in multiple places for consistency
```

### **2. Handle Missing Data Gracefully**

```javascript
const codeUpgrades = enforcement.codeUpgrades || {
  totalCodeUpgradeExposure: 0,
  flagCount: 0,
  codeUpgradeFlags: []
};
```

### **3. Preserve Determinism**

```javascript
// GOOD: Deterministic
const cost = quantity * unitPrice;

// BAD: Non-deterministic
const cost = Math.random() * 1000;
```

### **4. Document Calculations**

```javascript
const opAmount = baseSubtotal * 0.20; // 20% O&P (10% OH + 10% Profit)
```

### **5. Test Edge Cases**

```javascript
// Test with zero values
// Test with negative adjustments
// Test with missing data
// Test with extreme values
```

---

## **📚 REFERENCE LINKS**

- **Main Documentation:** `ENFORCEMENT_LAYER_UPGRADE.md`
- **ERP Parity Docs:** `TRUE_ERP_PARITY_ACHIEVED.md`
- **Original Upgrade:** `FINANCIAL_EXPOSURE_ENGINE_UPGRADE.md`
- **Database Schema:** `supabase/migrations/20260214_enforcement_layers.sql`

---

## **🆘 SUPPORT**

### **Common Questions**

**Q: Why is my code upgrade exposure $0?**  
A: Check if roofing items exist in `lineItems` and if `propertyMetadata.roof_size` is provided.

**Q: Why are carrier patterns not detected?**  
A: Patterns require specific conditions (e.g., O&P omission, >12% price variance). Not all claims will have patterns.

**Q: Can coverage adjustments be negative?**  
A: Yes! Sublimit conflicts result in negative adjustments (reducing recovery).

**Q: Is AI used in financial calculations?**  
A: NO. AI is only used for narrative text drafting. All financial math is deterministic.

---

**END OF API REFERENCE**

*Last Updated: February 14, 2026*  
*Version: 3.0*
