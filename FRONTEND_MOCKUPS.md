# FRONTEND MOCKUPS - COMPREHENSIVE ANALYSIS UI

**Visual mockups for Phase 3 frontend components**

---

## 🖼️ FULL PAGE LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Claim Command Pro                                    [User Menu] [Settings] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Estimate Analysis Results                                                   │
│  Claim #12345 • Uploaded Feb 27, 2026 • Region: CA-San Francisco           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 COMPREHENSIVE SUMMARY                                            │   │
│  │                                                                      │   │
│  │  Overall Assessment: ⚠️ SIGNIFICANT ISSUES FOUND                   │   │
│  │  Total Financial Impact: $25,520                                    │   │
│  │  Estimate Completeness: 85.5/100                                    │   │
│  │                                                                      │   │
│  │  Critical Issues (3)  High Priority (5)  Moderate (2)              │   │
│  │                                                                      │   │
│  │  [Download Full Report] [Export PDF] [Share with Professional]     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                │
│  │ 🔍 LOSS ANALYSIS         │  │ 📊 TRADE COMPLETENESS    │                │
│  │                          │  │                          │                │
│  │ Type: 💧 Water Damage    │  │ Integrity: 85.5/100 🟢  │                │
│  │ Severity: Level 2        │  │                          │                │
│  │ Confidence: 85%          │  │ Drywall:      85/100 🟡 │                │
│  │                          │  │ Flooring:    100/100 🟢 │                │
│  │ Missing Trades (2):      │  │ Demolition:   90/100 🟢 │                │
│  │ • Insulation (80%)       │  │ Painting:     75/100 🟡 │                │
│  │ • Trim (75%)             │  │ Cleaning:    100/100 🟢 │                │
│  │                          │  │                          │                │
│  │ [View Details]           │  │ [View Details]           │                │
│  └──────────────────────────┘  └──────────────────────────┘                │
│                                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                │
│  │ ⚖️ CODE UPGRADES         │  │ 💰 PRICING ANALYSIS      │                │
│  │                          │  │                          │                │
│  │ Total Exposure: $15,000  │  │ Variance: -$3,750 🔴    │                │
│  │ Flags: 3                 │  │ Below Market: 37.5%      │                │
│  │                          │  │                          │                │
│  │ 🔴 Roof 25% Rule         │  │ Underpriced (3):         │                │
│  │    $12,000               │  │ • Shingles: -50% 🔴     │                │
│  │                          │  │ • Drywall: -17% 🟡      │                │
│  │ 🟡 Drip Edge             │  │ • Paint: -27% 🔴        │                │
│  │    $2,000                │  │                          │                │
│  │                          │  │ Fairly Priced (2):       │                │
│  │ 🟡 Ice Shield            │  │ • Demolition ✅          │                │
│  │    $1,000                │  │ • Flooring ✅            │                │
│  │                          │  │                          │                │
│  │ [View Details]           │  │ [View Details]           │                │
│  └──────────────────────────┘  └──────────────────────────┘                │
│                                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                │
│  │ 👷 LABOR ANALYSIS        │  │ 🎯 CARRIER TACTICS       │                │
│  │                          │  │                          │                │
│  │ Labor Score: 60/100 🟡   │  │ Tactics Detected: 2      │                │
│  │ Variance: -$520          │  │ Total Impact: $6,250     │                │
│  │                          │  │ Severity: 75/100 🔴      │                │
│  │ Undervalued (1):         │  │                          │                │
│  │ • Drywall labor          │  │ 🔴 Repair vs Replace     │                │
│  │   $45/hr vs $80/hr       │  │    Impact: $6,250        │                │
│  │   -44% below market 🔴   │  │                          │                │
│  │   Impact: -$560          │  │ 🟡 Material Downgrade    │                │
│  │                          │  │    Impact: $800          │                │
│  │ Overvalued (0):          │  │                          │                │
│  │ None detected ✅         │  │ [View Counter-Arguments] │                │
│  │                          │  │                          │                │
│  │ [View Details]           │  │ [View Details]           │                │
│  └──────────────────────────┘  └──────────────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 COMPONENT MOCKUPS

### 1. Loss Expectation Card - Expanded View

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Loss Analysis                                    [Collapse ▲] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Loss Type: 💧 WATER DAMAGE                             │   │
│  │  Severity: ⚠️ Level 2 (Significant)                     │   │
│  │  Confidence: 85%  ████████████████░░░░                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Description:                                                    │
│  Significant absorption affecting structural materials (>24     │
│  hours). Typically requires extensive demolition, drywall       │
│  replacement, painting, and flooring work.                      │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Completeness Score: 87.5/100 ✅                                │
│  ████████████████░░░░ 88%                                       │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Expected Trades for Level 2 Water Damage:                      │
│                                                                  │
│  REQUIRED (Probability 90%+)                                    │
│  ✅ Demolition (95%)        ✅ Drywall (100%)                   │
│  ✅ Painting (95%)           ✅ Flooring (90%)                  │
│                                                                  │
│  COMMON (Probability 60-89%)                                    │
│  ❌ Insulation (80%) ⚠️     ❌ Trim (75%) ⚠️                    │
│  ⚠️ Cabinets (40%)          ⚠️ Electrical (50%)                │
│  ⚠️ Plumbing (60%)                                              │
│                                                                  │
│  UNLIKELY (Probability <60%)                                    │
│  ⚠️ Framing (30%)           ⚠️ Roofing (10%)                   │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  🔴 Missing Critical Trades (2):                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Insulation                                               │   │
│  │ Probability: 80% (COMMON)                                │   │
│  │ Severity: HIGH                                           │   │
│  │                                                          │   │
│  │ Impact:                                                  │   │
│  │ Insulation is typically required for Level 2 water      │   │
│  │ damage when structural materials are affected. Missing  │   │
│  │ insulation may indicate incomplete scope.                │   │
│  │                                                          │   │
│  │ Recommendation:                                          │   │
│  │ Verify if insulation was affected and needs             │   │
│  │ replacement. If affected, add to estimate.              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Trim                                                     │   │
│  │ Probability: 75% (COMMON)                                │   │
│  │ Severity: HIGH                                           │   │
│  │                                                          │   │
│  │ Impact:                                                  │   │
│  │ Trim replacement is typically needed after drywall      │   │
│  │ work. Missing trim may indicate incomplete scope.        │   │
│  │                                                          │   │
│  │ Recommendation:                                          │   │
│  │ Verify if trim was damaged and needs replacement.       │   │
│  │ If affected, add to estimate.                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  💡 What This Means:                                            │
│                                                                  │
│  Your estimate is 87.5% complete based on typical Level 2       │
│  water damage expectations. Two common trades are missing.      │
│  Verify if these trades are needed for your specific damage.    │
│                                                                  │
│  [Download Detailed Report] [Share with Contractor]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Trade Completeness Card - Expanded View

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Trade Completeness Analysis                     [Collapse ▲] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall Structural Integrity: 85.5/100 🟢 GOOD                 │
│  ████████████████░░░░ 85%                                       │
│                                                                  │
│  5 trades analyzed • 2 trades with issues • 0 critical issues   │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Trade-by-Trade Breakdown:                                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Drywall                                     85/100 🟡    │   │
│  │ ████████████████░░░░                                     │   │
│  │                                                          │   │
│  │ Items: 2 • Total Cost: $2,220                           │   │
│  │                                                          │   │
│  │ Criteria Assessment:                                     │   │
│  │ ✅ Removal present (20/20 pts)                          │   │
│  │ ✅ Replacement present (25/25 pts)                      │   │
│  │ ❌ Finish layer missing (0/15 pts) ⚠️                   │   │
│  │ ✅ Material + labor present (30/30 pts)                 │   │
│  │ ✅ Quantity consistent (10/10 pts)                      │   │
│  │                                                          │   │
│  │ Issues Found (1):                                        │   │
│  │ 🟡 HIGH: Drywall without finish layer (Painting)        │   │
│  │    Impact: Missing finish layer - incomplete work       │   │
│  │    Recommendation: Add painting to complete work        │   │
│  │                                                          │   │
│  │ Line Items:                                              │   │
│  │ • Line 2: Demolition - remove wet drywall (500 SF)     │   │
│  │ • Line 3: Drywall replacement (500 SF)                  │   │
│  │ • Line 6: Labor - drywall installation (16 HR)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Flooring                                   100/100 🟢    │   │
│  │ ████████████████████                                     │   │
│  │                                                          │   │
│  │ Items: 1 • Total Cost: $1,200                           │   │
│  │                                                          │   │
│  │ ✅ Complete - No issues detected                        │   │
│  │                                                          │   │
│  │ All criteria met:                                        │   │
│  │ ✅ Removal not required for this trade                  │   │
│  │ ✅ Installation present                                  │   │
│  │ ✅ Material + labor included                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Painting                                    75/100 🟡    │   │
│  │ ███████████████░░░░░                                     │   │
│  │                                                          │   │
│  │ Items: 1 • Total Cost: $1,250                           │   │
│  │                                                          │   │
│  │ Issues Found (1):                                        │   │
│  │ 🟡 MODERATE: Labor only - verify material included      │   │
│  │    Impact: Missing material costs                       │   │
│  │    Recommendation: Verify material is included in       │   │
│  │    labor pricing or add separate material line item     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Show All Trades (5)] [Export Breakdown] [Print Report]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Interactive Features

**Hover States:**
```
┌─────────────────────────────────────────┐
│ Drywall Installation Labor              │
│ ─────────────────────────────────────── │
│                                          │
│ Estimate Rate: $45/hr                   │
│ Market Rate: $80/hr                     │
│ Variance: -$35/hr (-44%)                │
│                                          │
│ Market Range:                            │
│ Min: $60/hr                              │
│ Avg: $80/hr ← Market Average            │
│ Max: $105/hr                             │
│                                          │
│ This rate is 44% below the market       │
│ average for CA-San Francisco.           │
│                                          │
│ [Learn More] [View Source Data]         │
└─────────────────────────────────────────┘
```

**Expandable Sections:**
```
▼ Missing Critical Trades (2)
  ┌─────────────────────────────────────┐
  │ Insulation                           │
  │ Probability: 80%                     │
  │ Severity: HIGH                       │
  │ [View Details]                       │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ Trim                                 │
  │ Probability: 75%                     │
  │ Severity: HIGH                       │
  │ [View Details]                       │
  └─────────────────────────────────────┘

▶ Common Trades (5) - Click to expand
```

**Filter Controls:**
```
┌─────────────────────────────────────────────────────┐
│ Filters:                                             │
│ [All] [Critical] [High] [Moderate] [Low]            │
│                                                      │
│ Sort by:                                             │
│ [Severity ▼] [Cost] [Trade] [Score]                │
│                                                      │
│ Show:                                                │
│ ☑ Issues Only  ☐ All Trades  ☐ Recommendations     │
└─────────────────────────────────────────────────────┘
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (1920px+)
- 2-column grid layout
- All cards visible
- Full details shown
- Side-by-side comparison

### Tablet (768px - 1919px)
- 2-column grid (stacks on smaller tablets)
- Summary card full width
- Analysis cards in pairs
- Scrollable content

### Mobile (< 768px)
- Single column layout
- Cards stack vertically
- Collapsible sections
- Swipeable cards
- Bottom navigation

---

## 🎨 DESIGN TOKENS

### Component Library
```typescript
// Card Component
interface CardProps {
  title: string;
  icon?: React.ReactNode;
  severity?: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

// Badge Component
interface BadgeProps {
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'red' | 'yellow' | 'green' | 'blue';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Metric Display Component
interface MetricProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  severity?: 'critical' | 'high' | 'moderate' | 'low' | 'success';
  tooltip?: string;
}
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### File Structure
```
app/
├── components/
│   ├── analysis/
│   │   ├── LossExpectationCard.tsx          (200 lines)
│   │   ├── TradeCompletenessCard.tsx        (250 lines)
│   │   ├── CodeUpgradesCard.tsx             (180 lines)
│   │   ├── PricingAnalysisCard.tsx          (200 lines)
│   │   ├── LaborAnalysisCard.tsx            (200 lines)
│   │   ├── CarrierTacticsCard.tsx           (220 lines)
│   │   ├── ComprehensiveSummaryCard.tsx     (180 lines)
│   │   └── index.ts                         (20 lines)
│   ├── ui/
│   │   ├── Card.tsx                         (80 lines)
│   │   ├── Badge.tsx                        (60 lines)
│   │   ├── ProgressBar.tsx                  (70 lines)
│   │   ├── Tooltip.tsx                      (50 lines)
│   │   ├── Button.tsx                       (60 lines)
│   │   ├── Metric.tsx                       (50 lines)
│   │   └── index.ts                         (20 lines)
│   └── icons/
│       ├── LossTypeIcons.tsx                (100 lines)
│       ├── SeverityIcons.tsx                (80 lines)
│       └── StatusIcons.tsx                  (60 lines)
├── hooks/
│   ├── useComprehensiveAnalysis.ts          (80 lines)
│   └── useExportReport.ts                   (60 lines)
├── utils/
│   ├── formatters.ts                        (100 lines)
│   └── exportHelpers.ts                     (120 lines)
└── styles/
    └── analysis.css                         (200 lines)
```

**Total:** ~2,500 lines of code

---

## 📊 IMPLEMENTATION SCHEDULE

### Day 1: Foundation (8 hours)
**Morning (4 hours):**
- Set up component structure
- Create base UI components (Card, Badge, ProgressBar)
- Set up design system tokens
- Create utility functions

**Afternoon (4 hours):**
- Create icon library
- Set up state management hooks
- Create formatters and helpers
- Set up CSS/styling

**Deliverables:**
- ✅ Base components working
- ✅ Design system implemented
- ✅ Utility functions ready

---

### Day 2: Loss & Trade Cards (8 hours)
**Morning (4 hours):**
- Build LossExpectationCard
- Add loss type detection display
- Add severity visualization
- Add missing trades section
- Add interactive features

**Afternoon (4 hours):**
- Build TradeCompletenessCard
- Add per-trade scoring
- Add integrity gauge
- Add issue breakdown
- Add expandable sections

**Deliverables:**
- ✅ LossExpectationCard complete
- ✅ TradeCompletenessCard complete
- ✅ Interactive features working

---

### Day 3: Financial Cards (8 hours)
**Morning (4 hours):**
- Build CodeUpgradesCard
- Add code requirement display
- Add cost breakdown
- Add priority indicators

**Afternoon (4 hours):**
- Build PricingAnalysisCard
- Add variance visualization
- Add market comparison
- Add per-item breakdown

**Deliverables:**
- ✅ CodeUpgradesCard complete
- ✅ PricingAnalysisCard complete
- ✅ Data visualization working

---

### Day 4: Labor & Tactics Cards (8 hours)
**Morning (4 hours):**
- Build LaborAnalysisCard
- Add labor score gauge
- Add rate comparison
- Add regional context

**Afternoon (4 hours):**
- Build CarrierTacticsCard
- Add tactic detection display
- Add evidence section
- Add counter-arguments

**Deliverables:**
- ✅ LaborAnalysisCard complete
- ✅ CarrierTacticsCard complete
- ✅ All 6 analysis cards done

---

### Day 5: Summary & Polish (8 hours)
**Morning (4 hours):**
- Build ComprehensiveSummaryCard
- Add executive summary
- Add quick stats
- Add action buttons
- Integrate all cards into main page

**Afternoon (4 hours):**
- Responsive design testing
- Accessibility improvements
- Performance optimization
- Bug fixes
- User testing

**Deliverables:**
- ✅ ComprehensiveSummaryCard complete
- ✅ All cards integrated
- ✅ Responsive design working
- ✅ Accessibility compliant
- ✅ Production ready

---

## 🧪 TESTING CHECKLIST

### Visual Testing
- [ ] All cards render correctly
- [ ] Colors are consistent
- [ ] Typography is readable
- [ ] Icons display properly
- [ ] Progress bars animate smoothly
- [ ] Hover states work
- [ ] Tooltips appear correctly

### Functional Testing
- [ ] Expand/collapse works
- [ ] Filters work
- [ ] Sorting works
- [ ] Export to PDF works
- [ ] Share functionality works
- [ ] Data updates correctly
- [ ] Error states display properly

### Responsive Testing
- [ ] Desktop (1920px) - Perfect
- [ ] Laptop (1440px) - Perfect
- [ ] Tablet (768px) - Good
- [ ] Mobile (375px) - Good
- [ ] Mobile landscape - Good

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Alt text on images

### Performance Testing
- [ ] Initial render <500ms
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks
- [ ] Works with 100+ items
- [ ] Export completes <5 seconds

---

## 💡 ALTERNATIVE: MINIMAL UI APPROACH

If you want to ship faster, build just the **Comprehensive Summary Card** first:

### Minimal Phase 3 (1-2 days)

**Day 1: Build Summary Card Only**
- Comprehensive Summary Dashboard
- Shows all key metrics
- Links to detailed data (JSON view)
- Export functionality

**Day 2: Polish & Deploy**
- Responsive design
- Testing
- Deploy

**Benefits:**
- ✅ Ships in 2 days instead of 5
- ✅ Users get high-level view
- ✅ Can iterate based on feedback
- ✅ Lower development cost ($800 vs $4,000)

**Tradeoffs:**
- ❌ No detailed per-trade view
- ❌ No interactive drill-down
- ❌ Less polished experience

---

## 🎯 RECOMMENDATION

### Option A: Full UI (5 days) - Best UX
**Build all 7 cards**
- Professional appearance
- Complete feature set
- Best user experience
- Higher adoption rate

**Cost:** $4,000 (40 hours)  
**Timeline:** 5 days

### Option B: Minimal UI (2 days) - Fast Ship ✅ RECOMMENDED
**Build summary card only**
- Quick to market
- Core value delivered
- Iterate based on feedback
- Lower risk

**Cost:** $800 (8 hours)  
**Timeline:** 2 days

### Option C: No UI (0 days) - Fastest
**Deploy backend only**
- Immediate value
- API works perfectly
- Build UI based on real usage
- Zero additional cost

**Cost:** $0  
**Timeline:** 0 days (deploy now)

---

## 📋 WHAT'S INCLUDED IN PHASE 3

### Components (7)
1. ✅ Loss Expectation Card - Loss type, severity, missing trades
2. ✅ Trade Completeness Card - Per-trade scoring, integrity analysis
3. ✅ Code Upgrades Card - Code requirements, cost impact
4. ✅ Pricing Analysis Card - Market comparison, variances
5. ✅ Labor Analysis Card - Labor rate validation, regional comparison
6. ✅ Carrier Tactics Card - Tactic detection, counter-arguments
7. ✅ Comprehensive Summary - Executive overview, quick stats

### Features
- ✅ Interactive expand/collapse
- ✅ Tooltips and help text
- ✅ Color-coded severity
- ✅ Progress bars and gauges
- ✅ Export to PDF
- ✅ Share functionality
- ✅ Responsive design
- ✅ Accessibility compliant

### Integration
- ✅ Integrate with existing UI
- ✅ Add region selector to upload form
- ✅ Update results display page
- ✅ Add navigation between cards
- ✅ Add print stylesheet

---

## 💰 COST BREAKDOWN

### Full UI (Option A)
- Day 1: Foundation - $800
- Day 2: Loss & Trade - $800
- Day 3: Financial - $800
- Day 4: Labor & Tactics - $800
- Day 5: Summary & Polish - $800
- **Total: $4,000**

### Minimal UI (Option B)
- Day 1: Summary Card - $400
- Day 2: Polish & Deploy - $400
- **Total: $800**

### No UI (Option C)
- **Total: $0**

---

## 🚀 FINAL RECOMMENDATION

**Go with Option B: Minimal UI (2 days)**

**Rationale:**
1. ✅ Quick to market (2 days vs 5 days)
2. ✅ Core value delivered (summary view)
3. ✅ Lower cost ($800 vs $4,000)
4. ✅ Can iterate based on real feedback
5. ✅ Reduces risk of building wrong thing

**Then:**
- Deploy and monitor for 1-2 weeks
- Collect user feedback
- Build additional cards based on what users actually want
- Iterate incrementally

---

**What would you like to do?**
1. **Option A:** Build full UI (5 days, $4,000)
2. **Option B:** Build minimal UI (2 days, $800) ✅ RECOMMENDED
3. **Option C:** Skip UI for now (0 days, $0)
