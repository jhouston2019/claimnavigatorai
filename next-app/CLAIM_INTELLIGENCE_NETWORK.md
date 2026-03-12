# Claim Intelligence Network

## Overview

The **Claim Intelligence Network** transforms Claim Command Pro from a personal claim analysis tool into a comprehensive **Insurance Claim Intelligence Platform**. It captures anonymized data from every user scan and generates powerful industry insights.

---

## Core Concept

Every time a user runs an estimate scan or underpayment analysis, the system automatically captures anonymized claim data and stores it in a centralized intelligence database. This data is then aggregated and analyzed to provide:

- **Industry benchmarks** (average claim gaps, underpayment rates)
- **Carrier behavior patterns** (which carriers underpay the most)
- **Regional pricing intelligence** (claim costs by state/city)
- **Tactic frequency analysis** (most common denial tactics)
- **Missing scope analytics** (items most often excluded)

---

## Architecture

### Database Schema

**Table: `claim_intelligence`**

Stores anonymized claim data with no personal information.

```sql
CREATE TABLE claim_intelligence (
  id UUID PRIMARY KEY,
  carrier_name TEXT,
  state TEXT,
  city TEXT,
  claim_type TEXT,
  property_type TEXT,
  carrier_estimate_value DECIMAL,
  contractor_estimate_value DECIMAL,
  predicted_scope_value DECIMAL,
  potential_gap_value DECIMAL,
  missing_scope_items JSONB,
  detected_carrier_tactics JSONB,
  severity_score INTEGER,
  created_at TIMESTAMP
);
```

**Performance Indexes:**
- `carrier_name`
- `state`
- `city, state`
- `claim_type`
- `created_at`
- Composite: `carrier_name, state, claim_type, created_at`

**Materialized Views:**
- `carrier_statistics` - Pre-aggregated carrier metrics
- `regional_statistics` - Pre-aggregated regional pricing

---

## Data Collection

### Automatic Capture

Intelligence data is captured automatically in two places:

#### 1. Estimate Quick Scan (`/api/estimate-scan`)

```typescript
await captureClaimIntelligence({
  carrierName: scanResult.carrierName,
  state: scanResult.state,
  city: scanResult.city,
  claimType: scanResult.claimType,
  propertyType: scanResult.propertyType,
  carrierEstimateValue: scanResult.carrierEstimate,
  predictedScopeValue: scanResult.estimatedScopeHigh,
  potentialGapValue: scanResult.potentialGapHigh,
  missingScopeItems: scanResult.detectedIssues,
  detectedCarrierTactics: scanResult.carrierTactics,
  severityScore: scanResult.claimSeverityScore,
})
```

#### 2. Underpayment Detector (`/api/underpayment-detector`)

```typescript
await captureClaimIntelligence({
  carrierName: detectionResult.carrierName,
  state: detectionResult.state,
  city: detectionResult.city,
  claimType: detectionResult.claimType,
  propertyType: detectionResult.propertyType,
  carrierEstimateValue: detectionResult.carrierEstimateTotal,
  contractorEstimateValue: detectionResult.contractorEstimateTotal,
  predictedScopeValue: detectionResult.predictedScopeValue,
  potentialGapValue: detectionResult.underpaymentAmount,
  missingScopeItems: detectionResult.missingItems,
  detectedCarrierTactics: detectionResult.carrierTactics,
  severityScore: detectionResult.severityScore,
})
```

### Data Privacy

- **No personal information** is stored (no names, emails, addresses, claim numbers)
- All data is **fully anonymized**
- Only aggregated metrics are displayed
- Complies with privacy regulations

---

## Intelligence APIs

### 1. Carrier Patterns

**Endpoint:** `/api/intelligence/carrier-patterns`

**Query Parameters:**
- `carrier` (optional) - Filter by specific carrier

**Returns:**
```json
{
  "patterns": [
    {
      "carrier_name": "State Farm",
      "claim_count": 234,
      "avg_carrier_estimate": 18500,
      "avg_scope_value": 31200,
      "avg_underpayment": 12700,
      "avg_severity_score": 68
    }
  ]
}
```

### 2. Regional Pricing

**Endpoint:** `/api/intelligence/regional-pricing`

**Query Parameters:**
- `state` (optional)
- `city` (optional)
- `claim_type` (optional)

**Returns:**
```json
{
  "pricing": [
    {
      "state": "Texas",
      "city": "Houston",
      "claim_type": "Roof",
      "claim_count": 156,
      "avg_carrier_estimate": 22000,
      "avg_actual_scope": 34500,
      "avg_underpayment": 12500
    }
  ]
}
```

### 3. Tactic Frequency

**Endpoint:** `/api/intelligence/tactics`

**Returns:**
```json
{
  "tactics": [
    {
      "tactic": "wear_and_tear",
      "frequency": 342,
      "percentage": "45.2"
    },
    {
      "tactic": "pre_existing_damage",
      "frequency": 298,
      "percentage": "39.4"
    }
  ]
}
```

### 4. Missing Scope Analytics

**Endpoint:** `/api/intelligence/missing-scope`

**Returns:**
```json
{
  "missingScope": [
    {
      "item": "roof decking",
      "frequency": 412,
      "percentage": "54.3"
    },
    {
      "item": "interior paint",
      "frequency": 387,
      "percentage": "51.1"
    }
  ]
}
```

### 5. Industry Benchmarks

**Endpoint:** `/api/intelligence/benchmarks`

**Returns:**
```json
{
  "benchmarks": {
    "totalClaims": 1247,
    "averageClaimGap": 12400,
    "averageCarrierEstimate": 21500,
    "averageTrueScope": 33900,
    "averageUnderpaymentPercentage": 36.7,
    "averageSeverityScore": 64
  }
}
```

### 6. Claim Insight

**Endpoint:** `/api/intelligence/claim-insight`

**Query Parameters:**
- `claimType` (optional)
- `state` (optional)
- `carrierName` (optional)

**Returns:**
```json
{
  "insight": "Roof claims in Texas are underpaid by an average of $12,400."
}
```

---

## User-Facing Features

### 1. Intelligence Dashboard (`/dashboard/intelligence`)

**Available to:** All authenticated users

**Features:**
- Industry benchmark cards
- Carrier behavior analytics with charts
- Regional pricing intelligence
- Carrier tactic frequency (pie chart)
- Most common missing scope items (bar chart)
- Privacy notice

**Visualizations:**
- Bar charts for carrier underpayment comparison
- Pie chart for tactic distribution
- Horizontal bar chart for missing scope items
- Data tables with sortable columns

### 2. Claim Insight Panel

**Location:** Estimate scan results page

**Features:**
- Displays contextual industry insight based on:
  - Claim type
  - State/region
  - Carrier name
- Example: "Roof claims in Texas are underpaid by an average of $12,400."
- Shows "Based on analysis of thousands of anonymized claims"

**Implementation:**
```typescript
const [industryInsight, setIndustryInsight] = useState<string | null>(null)

const fetchIndustryInsight = async (scanResult: ScanResult) => {
  const params = new URLSearchParams()
  if (scanResult.claimType) params.append('claimType', scanResult.claimType)
  if (scanResult.state) params.append('state', scanResult.state)
  if (scanResult.carrierName) params.append('carrierName', scanResult.carrierName)
  
  const response = await fetch(`/api/intelligence/claim-insight?${params}`)
  const data = await response.json()
  setIndustryInsight(data.insight)
}
```

---

## Admin Features

### Admin Intelligence Dashboard (`/admin/intelligence`)

**Available to:** Admin users only

**Features:**
- **Platform Intelligence Metrics:**
  - Total claims analyzed
  - Average claim gap
  - Underpayment rate
  - Carriers tracked

- **Top Carriers by Claim Volume:**
  - Dual-axis bar chart (claims vs. gap)
  - Detailed table with rankings
  - Severity score badges

- **Carrier Tactic Distribution:**
  - Pie chart visualization
  - Frequency breakdown with percentages

- **Top Missing Scope Items:**
  - Horizontal bar chart
  - Progress bars with percentages
  - Claim count for each item

- **System Health Status:**
  - Data collection status
  - Analytics API health
  - Data privacy compliance indicator

---

## Visualizations

All charts use **Recharts** library with the existing design system:

**Color Palette:**
- Primary: `#1e3a8a` (navy)
- Blue shades: `#3b82f6`, `#60a5fa`, `#93c5fd`, `#dbeafe`
- Red (gaps): `#ef4444`
- Orange (warnings): `#f97316`
- Green (positive): `#10b981`

**Chart Types:**
1. **Bar Charts** - Carrier comparisons, regional pricing
2. **Pie Charts** - Tactic distribution
3. **Horizontal Bar Charts** - Missing scope items
4. **Data Tables** - Detailed breakdowns

---

## Performance Optimization

### Materialized Views

Pre-aggregated views for fast query performance:

```sql
CREATE MATERIALIZED VIEW carrier_statistics AS
SELECT 
  carrier_name,
  COUNT(*) as claim_count,
  AVG(carrier_estimate_value) as avg_carrier_estimate,
  AVG(predicted_scope_value) as avg_scope_value,
  AVG(potential_gap_value) as avg_underpayment,
  AVG(severity_score) as avg_severity_score
FROM claim_intelligence
WHERE carrier_name IS NOT NULL
GROUP BY carrier_name
HAVING COUNT(*) >= 5;
```

### Refresh Strategy

Materialized views should be refreshed:
- After batch data imports
- Via scheduled cron job (e.g., daily)
- Manually via admin action

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY carrier_statistics;
REFRESH MATERIALIZED VIEW CONCURRENTLY regional_statistics;
```

### Database Indexes

All critical query paths are indexed:
- Single-column indexes for common filters
- Composite indexes for complex queries
- Indexes on materialized view keys

---

## Scalability

The system is designed to handle **millions of claim records**:

1. **Efficient Aggregation Queries:**
   - Use materialized views for pre-computed metrics
   - Limit result sets to top N items
   - Use HAVING clauses to filter low-volume data

2. **Partitioning Strategy (Future):**
   - Partition by `created_at` (monthly or quarterly)
   - Improves query performance on time-based filters

3. **Caching Layer (Future):**
   - Cache API responses for 5-15 minutes
   - Invalidate on data refresh

4. **Async Processing (Future):**
   - Queue intelligence captures for background processing
   - Prevents blocking user-facing operations

---

## Use Cases

### For Homeowners

1. **Validate Their Claim:**
   - "Is my $8,000 gap typical for roof claims in my state?"
   - "Are other people seeing the same carrier tactics?"

2. **Build Confidence:**
   - Industry data validates their concerns
   - Shows they're not alone in facing underpayment

3. **Inform Negotiations:**
   - "Roof claims in Texas average $12,400 underpayment"
   - Use industry data in appeals

### For Admins

1. **Monitor Platform Health:**
   - Track total claims analyzed
   - Identify data quality issues

2. **Identify Patterns:**
   - Which carriers underpay the most?
   - Which tactics are most common?
   - Which scope items are frequently missing?

3. **Content Strategy:**
   - Create targeted SEO content around common issues
   - Write case studies about specific carrier patterns
   - Build educational resources

4. **Product Development:**
   - Prioritize features based on common pain points
   - Improve AI detection for frequent tactics
   - Add missing scope items to detection logic

---

## Integration Points

### 1. Estimate Quick Scan
- Captures data after AI analysis
- Displays industry insight on results page

### 2. Underpayment Detector
- Captures data after comprehensive analysis
- Links to intelligence dashboard

### 3. Dashboard
- New "Industry Intelligence" section
- Direct link to intelligence dashboard

### 4. Admin Panel
- New intelligence dashboard card
- Quick access to intelligence admin panel

---

## Future Enhancements

### Phase 2
- **Carrier-specific insights** on estimate analyzer
- **Regional heatmaps** showing underpayment by geography
- **Time-series analysis** (trends over time)
- **Predictive analytics** (claim outcome predictions)

### Phase 3
- **Public intelligence reports** (marketing content)
- **API access for partners** (contractors, adjusters)
- **Benchmarking tool** (compare your claim to similar claims)
- **Carrier scorecards** (public ratings)

### Phase 4
- **Machine learning models** for pattern detection
- **Anomaly detection** for unusual claims
- **Automated content generation** from intelligence data
- **Real-time alerts** for emerging patterns

---

## Deployment Checklist

### Database Setup
- [ ] Run migration: `005_add_claim_intelligence.sql`
- [ ] Verify table creation
- [ ] Verify indexes created
- [ ] Verify materialized views created
- [ ] Test RLS policies

### API Testing
- [ ] Test `/api/intelligence/carrier-patterns`
- [ ] Test `/api/intelligence/regional-pricing`
- [ ] Test `/api/intelligence/tactics`
- [ ] Test `/api/intelligence/missing-scope`
- [ ] Test `/api/intelligence/benchmarks`
- [ ] Test `/api/intelligence/claim-insight`

### UI Testing
- [ ] Test `/dashboard/intelligence` page
- [ ] Test industry insight panel on scan results
- [ ] Test `/admin/intelligence` page
- [ ] Verify charts render correctly
- [ ] Verify responsive design

### Data Capture
- [ ] Run test estimate scan
- [ ] Verify intelligence data captured
- [ ] Run test underpayment detection
- [ ] Verify intelligence data captured
- [ ] Check data anonymization

### Performance
- [ ] Test with empty database
- [ ] Test with 100 records
- [ ] Test with 1,000 records
- [ ] Test with 10,000 records
- [ ] Verify query performance < 2 seconds

---

## Technical Stack

- **Database:** PostgreSQL (Supabase)
- **Backend:** Next.js API routes
- **Frontend:** React + TypeScript
- **Charts:** Recharts
- **Styling:** TailwindCSS
- **Icons:** Lucide React

---

## Privacy Compliance

The Claim Intelligence Network is designed with privacy as a core principle:

1. **No PII Stored:**
   - No names, emails, phone numbers, addresses
   - No claim numbers or policy numbers
   - No user IDs linked to intelligence records

2. **Aggregation Only:**
   - All public-facing data is aggregated
   - Minimum thresholds for display (e.g., 5+ claims)
   - No individual claim details exposed

3. **Transparent Communication:**
   - Privacy notice on intelligence dashboard
   - Clear explanation of data usage
   - User control over data sharing (future)

4. **Secure Access:**
   - Row-level security on database
   - API authentication required
   - Admin-only access to raw data

---

## Conclusion

The **Claim Intelligence Network** transforms Claim Command Pro into a true **Insurance Claim Intelligence Platform**. By capturing and analyzing anonymized claim data, it provides:

- **Value to users** through industry insights and validation
- **Competitive advantage** through unique data assets
- **Product differentiation** as the only platform with real claim intelligence
- **Content opportunities** for SEO and marketing
- **Strategic insights** for product development

This feature positions Claim Command Pro as the **industry leader** in insurance claim intelligence.
