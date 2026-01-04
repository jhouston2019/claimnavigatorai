# ESTIMATE ENGINE - QUICK REFERENCE

## 🎯 WHAT HAPPENED

Estimate Review Pro's estimate intelligence is now Claim Navigator's estimate intelligence.

**One Engine. Four Steps. Zero Divergence.**

---

## 📍 WHERE IS THE ENGINE?

**Location:** `app/assets/js/intelligence/estimate-engine.js`

**This is the ONLY place estimate logic exists.**

---

## 🔌 HOW STEPS USE IT

| Step | What It Does | Backend Function | Engine Call |
|------|--------------|------------------|-------------|
| **4** | Estimate Quality Review | `ai-estimate-comparison.js` | `EstimateEngine.analyzeEstimate()` |
| **5** | Estimate Comparison | `ai-estimate-comparison.js` | `EstimateEngine.analyzeEstimate()` |
| **9** | Coverage Alignment | `coverage-alignment-estimate.js` | `EstimateEngine.analyzeEstimate()` |
| **13** | Supplement Analysis | `supplement-analysis-estimate.js` | `EstimateEngine.analyzeEstimate()` |

---

## 🧪 HOW TO TEST

```bash
node tests/estimate-engine-parity-test.js
```

**Expected Result:**
```
✅ Passed: 6
❌ Failed: 0
🎉 ALL TESTS PASSED!
```

---

## 🔧 HOW TO MODIFY

**To change estimate behavior:**

1. Edit `app/assets/js/intelligence/estimate-engine.js` ONLY
2. Run tests: `node tests/estimate-engine-parity-test.js`
3. Deploy

**Changes automatically affect all 4 steps.**

**DO NOT:**
- ❌ Edit individual step functions for estimate logic
- ❌ Add estimate logic outside the engine
- ❌ Create parallel estimate analysis paths

---

## 📊 ENGINE CAPABILITIES

### Input
```javascript
EstimateEngine.analyzeEstimate({
  estimateText: "...",      // Raw estimate text
  lineItems: [],            // Optional parsed line items
  userInput: "...",         // Optional user notes
  metadata: {}              // Optional context
})
```

### Output
```javascript
{
  success: true,
  status: 'SUCCESS',
  classification: {
    classification: 'PROPERTY',  // or AUTO, COMMERCIAL
    confidence: 'HIGH',           // or MEDIUM
    scores: { property: 8, auto: 2, commercial: 1 }
  },
  analysis: {
    totalLineItems: 10,
    includedCategories: [...],
    missingCategories: [...],
    zeroQuantityItems: [...],
    potentialUnderScoping: [...],
    observations: [...]
  },
  report: {
    title: '...',
    summary: '...',
    includedItems: '...',
    potentialOmissions: '...',
    potentialUnderScoping: '...',
    limitations: '...'
  }
}
```

---

## 🛡️ SAFETY GUARDRAILS

**Automatically blocks:**
- Negotiation requests
- Coverage interpretation
- Legal advice
- Pricing opinions
- Advocacy language
- Entitlement claims

**Refusal is automatic.** No configuration needed.

---

## 🚀 DEPLOYMENT

**Files to Deploy:**
```
app/assets/js/intelligence/estimate-engine.js
netlify/functions/ai-estimate-comparison.js
netlify/functions/coverage-alignment-estimate.js
netlify/functions/supplement-analysis-estimate.js
```

**No Other Changes Required:**
- ✅ Frontend unchanged
- ✅ Database unchanged
- ✅ Config unchanged
- ✅ Auth unchanged

---

## 📞 TROUBLESHOOTING

### "Classification failed"
- Check if estimate has 3+ recognizable keywords
- Verify estimate text is not empty
- Check for ambiguous content (mixed types)

### "Guardrails blocked request"
- Review user input for prohibited phrases
- Check estimate text for advocacy language
- Verify no negotiation/legal requests

### "Analysis returned unexpected results"
- Run parity tests
- Check engine version
- Verify input format

---

## 📈 MONITORING

**Key Metrics:**
- Classification accuracy
- Guardrail trigger rate
- Analysis completion time
- Error rate by step

**Logs:**
- All analysis calls logged via `LOG_EVENT`
- Errors logged via `LOG_ERROR`
- Usage tracked via `LOG_USAGE`

---

## ✅ SUCCESS CRITERIA

**Engine is working correctly if:**
1. ✅ All parity tests pass
2. ✅ Classifications match expected types
3. ✅ Guardrails block prohibited content
4. ✅ Output is neutral and factual
5. ✅ No recommendations or advice in output
6. ✅ All 4 steps produce consistent results

---

## 🔒 CRITICAL RULES

**DO NOT:**
1. ❌ Remove safety guardrails
2. ❌ Add free-form chat features
3. ❌ Provide recommendations or advice
4. ❌ Interpret coverage or pricing
5. ❌ Use advocacy language
6. ❌ Change temperature above 0.2
7. ❌ Create duplicate estimate logic

**These constraints are non-negotiable for system safety.**

---

## 📚 DOCUMENTATION

- **Full Report:** `ESTIMATE_ENGINE_SUBSUMPTION_COMPLETE.md`
- **This Reference:** `ESTIMATE_ENGINE_QUICK_REFERENCE.md`
- **Engine Code:** `app/assets/js/intelligence/estimate-engine.js`
- **Tests:** `tests/estimate-engine-parity-test.js`

---

## 🎉 SUMMARY

**Before:** Multiple estimate logic paths, inconsistent behavior  
**After:** Single canonical engine, identical behavior across all steps

**Result:** Claim Navigator estimate analysis = Estimate Review Pro estimate analysis

**Status:** ✅ COMPLETE AND VERIFIED

