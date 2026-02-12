# Estimate Review Pro Engine - Quick Start Guide

## 🚀 DEPLOYMENT STEPS

### 1. Run Database Migration

```bash
# Apply the new schema
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260212_estimate_engine_schema.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/20260212_estimate_engine_schema.sql`
3. Run

### 2. Deploy New API Endpoint

The new endpoint is already in your Netlify functions folder:
- `netlify/functions/analyze-estimates-v2.js`

Deploy to Netlify:
```bash
git add .
git commit -m "Add Estimate Review Pro Engine v2"
git push origin main
```

Netlify will auto-deploy.

### 3. Update Frontend

Already updated in `claim-command-center.html`:
- Now calls `/analyze-estimates-v2` instead of `/analyze-estimates`

### 4. Test the Engine

Run the test suite:
```bash
cd "d:\Axis\Axis Projects - Projects\Projects - Stage 1\claim navigator ai 3"
node tests/estimate-parser.test.js
```

Expected output:
```
✅ ALL TESTS PASSED - ENGINE IS DETERMINISTIC
```

---

## 📊 USAGE

### API Call

```javascript
const response = await fetch('/.netlify/functions/analyze-estimates-v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    claim_id: 'your-claim-uuid',
    contractor_estimate_pdf_url: 'https://storage.supabase.co/...',
    carrier_estimate_pdf_url: 'https://storage.supabase.co/...',
    contractor_document_id: 'doc-uuid-1',
    carrier_document_id: 'doc-uuid-2'
  })
});

const result = await response.json();
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "comparison": {
      "contractor_total": 5352.50,
      "carrier_total": 3822.00,
      "underpayment_estimate": 1530.50,
      "net_difference": 1530.50
    },
    "discrepancies": [
      {
        "discrepancy_type": "pricing_difference",
        "line_item_description": "Architectural shingles",
        "contractor_quantity": 25.00,
        "carrier_quantity": 25.00,
        "contractor_unit_price": 95.00,
        "carrier_unit_price": 75.00,
        "difference_amount": 500.00,
        "match_method": "fuzzy",
        "match_confidence": 0.92
      }
    ],
    "stats": {
      "parsing": {
        "contractor_lines": 10,
        "carrier_lines": 9,
        "contractor_parse_rate": 80.00
      },
      "matching": {
        "exact_matches": 2,
        "fuzzy_matches": 3,
        "category_matches": 2,
        "semantic_matches": 1
      }
    },
    "processing_time_ms": 3542,
    "engine_version": "2.0",
    "method": "deterministic"
  }
}
```

---

## 🗄️ DATABASE QUERIES

### Get Line Items

```sql
SELECT 
  line_number,
  description,
  quantity,
  unit,
  unit_price,
  total,
  category,
  parsed_by,
  confidence_score
FROM claim_estimate_line_items
WHERE claim_id = 'your-claim-id'
AND estimate_type = 'contractor'
ORDER BY line_number;
```

### Get Discrepancies

```sql
SELECT 
  discrepancy_type,
  line_item_description,
  contractor_quantity,
  carrier_quantity,
  contractor_unit_price,
  carrier_unit_price,
  difference_amount,
  match_method,
  match_confidence
FROM claim_estimate_discrepancies
WHERE claim_id = 'your-claim-id'
ORDER BY ABS(difference_amount) DESC;
```

### Calculate Underpayment

```sql
SELECT 
  SUM(difference_amount) as underpayment,
  COUNT(*) as total_discrepancies
FROM claim_estimate_discrepancies
WHERE claim_id = 'your-claim-id'
AND difference_amount > 0;
```

---

## 🧪 TESTING

### Run Full Test Suite

```bash
node tests/estimate-parser.test.js
```

### Test Individual Components

```javascript
const { parseEstimate } = require('./netlify/functions/lib/estimate-parser');
const { matchLineItems } = require('./netlify/functions/lib/estimate-matcher');
const { reconcileEstimates } = require('./netlify/functions/lib/estimate-reconciler');

// Test parser
const pdfText = "Tear off shingles  25 SQ  $3.50  $87.50";
const parsed = parseEstimate(pdfText, 'contractor');
console.log(parsed.lineItems);

// Test matcher
const matches = matchLineItems(contractorItems, carrierItems);
console.log(matches.stats);

// Test reconciler
const reconciliation = reconcileEstimates(matches.matches, [], []);
console.log(reconciliation.totals);
```

---

## 🔍 DEBUGGING

### Check Parser Output

```javascript
// Add logging to estimate-parser.js
console.log('[Parser] Extracted:', {
  quantity,
  unit,
  unit_price,
  total,
  parsed_by: 'regex'
});
```

### Check Matching Stats

```javascript
// In analyze-estimates-v2.js
console.log('[Matcher] Stats:', {
  exact_matches: matchResult.stats.exact_matches,
  fuzzy_matches: matchResult.stats.fuzzy_matches,
  unmatched_contractor: matchResult.unmatchedContractor.length
});
```

### Verify Math

```javascript
// In estimate-reconciler.js
console.log('[Reconciler] Totals:', {
  contractor_total: reconciliation.totals.contractor_total,
  carrier_total: reconciliation.totals.carrier_total,
  underpayment: reconciliation.totals.underpayment_amount
});

// Validate
const validation = validateReconciliation(reconciliation);
console.log('[Validation]:', validation);
```

---

## 📈 MONITORING

### Key Metrics to Track

1. **Parse Success Rate**
   - Target: >80%
   - Query: `SELECT AVG(parse_success_rate) FROM claim_estimate_metadata`

2. **Match Rate**
   - Target: >70% matched
   - Query: `SELECT AVG(matched_lines / total_contractor_lines) FROM claim_estimate_comparison`

3. **Processing Time**
   - Target: <5000ms
   - Query: `SELECT AVG(processing_duration_ms) FROM claim_estimate_comparison`

4. **AI Fallback Usage**
   - Target: <20% of matches
   - Query: `SELECT AVG(semantic_matches / matched_lines) FROM claim_estimate_comparison`

---

## 🚨 TROUBLESHOOTING

### Issue: Low Parse Success Rate

**Cause:** PDF format not recognized by regex patterns

**Solution:** Add new parsing strategy to `estimate-parser.js`:

```javascript
function parseCustomFormat(line, lineNumber, section) {
  // Add your custom regex pattern here
  const pattern = /your-pattern-here/;
  // ...
}

// Add to strategies array
const strategies = [
  parseStandardFormat,
  parseXactimateFormat,
  parseTabularFormat,
  parseCompactFormat,
  parseCustomFormat  // ← Add here
];
```

### Issue: Low Match Rate

**Cause:** Descriptions too different between estimates

**Solution:** 
1. Check fuzzy match threshold (currently 85%)
2. Lower threshold in `estimate-matcher.js`:

```javascript
const threshold = 0.80; // Lower from 0.85
```

### Issue: Underpayment Doesn't Match Expected

**Cause:** Math validation failed

**Solution:** Run validation:

```javascript
const validation = validateReconciliation(reconciliation);
console.log(validation.errors);
```

---

## 📚 DOCUMENTATION

- **Technical Spec:** `ESTIMATE_ENGINE_SPEC.md`
- **Proof of Commercial Grade:** `ESTIMATE_ENGINE_PROOF.md`
- **This Guide:** `ESTIMATE_ENGINE_QUICKSTART.md`

---

## ✅ CHECKLIST

Before going live:

- [ ] Database migration applied
- [ ] API endpoint deployed
- [ ] Frontend updated
- [ ] Test suite passes
- [ ] Sample estimates tested
- [ ] Monitoring set up
- [ ] Error logging configured
- [ ] Backup strategy in place

---

## 🎯 NEXT STEPS

1. **Deploy to production**
2. **Test with real estimates**
3. **Monitor performance metrics**
4. **Adjust thresholds if needed**
5. **Add custom parsing patterns for specific formats**
6. **Optimize matching algorithm based on usage**

---

## 💡 TIPS

### Improve Parse Rate

- Add more regex patterns for common formats
- Use OCR for scanned PDFs
- Allow manual line item entry for edge cases

### Improve Match Rate

- Train on historical data
- Add industry-specific synonyms
- Allow manual matching for unmatched items

### Optimize Performance

- Cache parsed results
- Batch process multiple estimates
- Use database indexes effectively

---

## 📞 SUPPORT

For issues or questions:
1. Check test suite output
2. Review logs in Netlify Functions
3. Query database for debugging
4. Refer to technical documentation

---

*Ready to deploy. Ready to scale. Ready for production.*
