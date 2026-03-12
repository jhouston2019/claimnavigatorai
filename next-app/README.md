# Claim Command Pro - Insurance Claim Intelligence Platform

A complete production-ready SaaS platform that helps homeowners detect insurance claim underpayments and generate professional documentation to support their claims.

## 🚀 Quick Start

```bash
cd next-app
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✨ Complete Feature Set

### FREE TOOLS (Lead Generation)

#### 1. Estimate Quick Scan ⚡ NEW
**Route**: `/estimate-scan`

**Purpose**: Free conversion tool that drives upgrades

**Features**:
- Upload estimate (PDF/DOC/DOCX)
- Email capture
- LIMITED AI analysis (60 seconds)
- Shows partial results:
  - Claim gap detected alert
  - Potential underpayment range
  - Top 3-5 issues (not all)
  - Claim severity score (0-100)
  - Timeline risk assessment
  - Carrier tactic detection
- Blurred full report preview
- Strong upgrade CTA
- Conversion tracking

**Conversion Flow**:
```
Upload → Analyze → Show Gap → Lock Full Report → Upgrade ($299)
```

#### 2. Free Policy Analysis
**Route**: `/policy-analysis`

**Features**:
- PDF upload
- AI extraction of coverage requirements
- Email capture
- Results display with upgrade CTA

### PAID FEATURES (Command Center - $299)

#### 3. Insurance Claim Underpayment Detector
**Route**: `/underpayment-detector`

**Features**:
- Upload carrier estimate, contractor estimate, photos, policy
- FULL AI analysis
- Comprehensive underpayment calculation
- Complete issue detection
- PDF export

#### 4. Insurance Estimate Analyzer
**Route**: `/estimate-analyzer`

**Features**:
- Compare estimates line-by-line
- Identify all pricing discrepancies
- Generate complete gap report
- PDF export

#### 5. Documentation Packet Generator
**Route**: `/documentation-builder`

**Features**:
- Structured claim documentation
- Evidence checklist
- Dispute letter templates
- Export to PDF and Word

#### 6. AI Claim Strategy Advisor
**Route**: `/strategy-advisor`

**Features**:
- Personalized recommendations
- Evidence gathering guidance
- Response tactics
- Timeline planning

#### 7. User Dashboard
**Route**: `/dashboard`

**Features**:
- Claim tracking
- Deadline reminders
- Document management
- Quick access to all tools

### ADMIN FEATURES

#### 8. Admin Dashboard
**Route**: `/admin`

**Metrics**:
- Total users & paid users
- Revenue tracking
- Conversion rates
- **NEW**: Estimate scan funnel
  - Total scans
  - Scan conversions
  - Scan → Paid rate

#### 9. Case Study Management
**Route**: `/admin/case-studies`

#### 10. SEO Content Management
**Route**: `/admin/seo-pages`

**Features**:
- Create/edit SEO pages
- One-click default page creation
- Publish/unpublish control

#### 11. Analytics Dashboard
**Route**: `/admin/analytics`

**Features**:
- Event tracking
- User behavior analysis
- Feature usage stats

### BUSINESS FEATURES

#### 12. Email Capture & CRM
- Captures at multiple points
- Stores with source tracking
- Resend API integration
- Automated email sequences

#### 13. Partner Referral System
- Unique referral codes
- Cookie-based tracking
- Conversion attribution

#### 14. Stripe Payment System
- $299 one-time payment
- Secure checkout
- Webhook fulfillment
- Automatic feature unlocking

## 🎯 Conversion Funnel

### Free → Paid Journey

```
ENTRY POINTS:
├─ Landing page → Estimate Scan
├─ Landing page → Policy Analysis  
└─ SEO pages → Free tools

FREE TOOLS:
├─ Estimate Quick Scan (NEW - Primary converter)
│   └─ Shows gap → Creates urgency → Upgrade CTA
└─ Policy Analysis
    └─ Shows requirements → Upgrade CTA

UPGRADE DECISION:
└─ Pricing page (tracks source)
    └─ Stripe checkout

POST-PURCHASE:
└─ Success page → Dashboard → Full Command Center
```

## 📊 Database Schema

### New Tables (Estimate Scan)
```sql
estimate_scans
  - id (UUID)
  - email (TEXT) 
  - file_name (TEXT)
  - file_size (INTEGER)
  - scan_result (JSONB)
  - converted_to_paid (BOOLEAN)
  - created_at (TIMESTAMP)

scan_conversions
  - id (UUID)
  - scan_id (UUID FK)
  - user_id (UUID FK)
  - converted_at (TIMESTAMP)
```

### Existing Tables
- profiles
- claims
- policy_analyses
- estimate_analyses
- underpayment_detections
- documents
- documentation_packets
- case_studies
- seo_pages
- partners
- referrals
- payments
- deadlines
- email_captures
- analytics_events

## 🔧 Tech Stack

```
Frontend:        Next.js 14, React, TypeScript, TailwindCSS
Backend:         Next.js API Routes
Database:        Supabase PostgreSQL
AI:              OpenAI GPT-4 Turbo
Storage:         Supabase Storage
Auth:            Supabase Auth
Payments:        Stripe
PDF:             PDFKit
Word:            docx
Email:           Resend API
Charts:          Recharts
Icons:           Lucide React
Hosting:         Vercel
```

## 🎨 UI Design

**Professional Legal-Tech Aesthetic:**
- Deep blue primary (#0056e0)
- White and light gray backgrounds
- Inter font family
- Clean, trustworthy design
- Conversion-optimized layouts

## 🚀 Deployment

### Environment Variables (11 required)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
FROM_EMAIL=
```

### Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Deploy Claim Command Pro"
git push

# Import in Vercel
# Set environment variables
# Deploy
```

## 📈 Expected Performance

### Conversion Funnel Metrics
- **Landing page → Scan**: 25-35%
- **Scan completion**: 70-80%
- **Scan → Pricing page**: 40-50%
- **Scan → Purchase**: 12-18%

### Revenue Projection
- 100 scans/month
- 15% conversion = 15 customers
- 15 × $299 = **$4,485/month**
- **$53,820/year** from scan funnel

## 🔐 Security

- Email-only access (no password for scan)
- Secure file upload
- Private scan results
- Encrypted storage
- RLS policies on all tables
- Stripe webhook verification

## 📱 Responsive Design

Fully responsive:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)

## 🎯 Marketing Strategy

### Free Tool Promotion
- SEO optimize `/estimate-scan` page
- Google Ads → Estimate scan landing
- Facebook Ads → "Scan your estimate free"
- Content marketing about underpayment

### Email Nurture
- Immediate: Scan results
- Day 1: Education about underpayment
- Day 3: Case study + offer
- Day 7: Urgency message
- Day 14: Last chance

### Retargeting
- Show ads to scan users
- Highlight their specific gap amount
- Testimonials from similar claims

## 📊 Analytics Events

**Tracked**:
- `estimate_scan_completed`
- `checkout_initiated` (with source)
- `scan_to_paid_conversion`
- `purchase_completed`

**Admin Dashboard Shows**:
- Scan funnel performance
- Conversion rates by source
- Revenue attribution

## 🚦 Status: PRODUCTION READY

✅ All features implemented  
✅ Conversion funnel optimized  
✅ Analytics tracking complete  
✅ Security configured  
✅ Documentation comprehensive  
✅ Ready to deploy  

## 📞 Support

See documentation:
- `README.md` - This file
- `DEPLOYMENT.md` - Deployment guide
- `ESTIMATE_SCAN_FEATURE.md` - Scan feature details
- `FEATURES.md` - Complete feature list

## 💡 Key Innovation

The **Estimate Quick Scan** is the primary conversion driver:
- Free to use (no friction)
- Shows real value (gap detection)
- Creates urgency (partial results)
- Strong CTA (unlock full analysis)
- Tracks conversions (attribution)

This tool alone can drive 50%+ of revenue by converting free users into paid customers.
