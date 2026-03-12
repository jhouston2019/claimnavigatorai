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

### 1. High-Conversion Landing Page ✓
- Compelling hero with authority positioning
- Carrier phrase recognition section
- 90-day claim timeline education
- Case studies showcase
- Multiple conversion CTAs

### 2. Free Policy Analysis Tool ✓
- PDF upload with drag-and-drop
- AI-powered extraction (OpenAI GPT-4)
- Coverage triggers identification
- Documentation requirements
- Proof of loss obligations
- Policy exclusions
- Dispute risk assessment
- Email capture for leads

### 3. Insurance Claim Underpayment Detector ✓
**NEW COMPREHENSIVE TOOL**
- Upload carrier estimate, contractor estimate, photos, and policy
- AI analyzes all documents together
- Calculates underpayment range (low/high estimates)
- Confidence scoring
- Missing scope items detection
- Labor rate issue identification
- Documentation gap analysis
- Coverage issue detection
- Prioritized recommended actions
- Professional PDF export

### 4. Insurance Estimate Analyzer ✓
- Compare carrier vs contractor estimates
- Identify pricing discrepancies
- Detect missing scope items
- Generate claim gap report
- PDF export

### 5. Claim Documentation Packet Generator ✓
- Structured claim information form
- Scope documentation
- Evidence checklist builder
- Dispute letter template
- Proof of loss structure
- Export to PDF and Word (.docx)

### 6. AI Claim Strategy Advisor ✓
- Input claim type and carrier position
- Describe current issues
- AI generates personalized recommendations:
  - Evidence to gather
  - Documentation strategy
  - Response tactics
  - Timeline considerations

### 7. User Dashboard ✓
- Account status display
- Quick access to all tools
- Upcoming deadline tracking with urgency alerts
- Recent claims list
- Days-until-deadline calculator
- Claim status tracking

### 8. Case Study Publishing System ✓
- Admin panel for CRUD operations
- Fields: property type, claim type, carrier offer, final settlement, timeline, description
- Published status control
- Automatic percentage calculation
- Display on landing page

### 9. SEO Authority Article System ✓
- Full CMS for content management
- Dynamic routing: `/guides/[slug]`
- Fields: slug, title, meta description, content (HTML), published status
- Integrated CTAs for conversion
- Pre-built templates for common topics:
  - Insurance Claim Underpayment
  - How to Challenge an Insurance Estimate
  - Proof of Loss Explained
  - What Wear and Tear Means
  - How Adjusters Write Estimates
  - How to Read Xactimate Estimates

### 10. Email Capture & CRM ✓
- Capture points throughout platform
- Store in database with source tracking
- Ready for automation (Resend API integrated)
- Welcome emails
- Policy analysis notifications
- Purchase confirmations

### 11. Partner Referral System ✓
- Unique referral codes
- Cookie-based tracking (30-day attribution)
- Referral landing pages: `/partner/[code]`
- Conversion tracking in database
- Partner and referral tables

### 12. Stripe Payment System ✓
- $299 one-time payment
- Secure Stripe Checkout
- Webhook handling for automatic fulfillment
- Feature unlocking on payment
- Payment records in database
- Success page with auto-redirect

### 13. Admin Analytics Dashboard ✓
- Total users and paid users
- Total revenue
- Conversion rate
- Policy analyses count
- Estimate analyses count
- Documentation packets created
- Recent activity feed
- Event tracking

## 🏗️ Tech Stack

```
Frontend:        Next.js 14, React, TailwindCSS, TypeScript
Backend:         Next.js API Routes (Serverless)
Database:        Supabase PostgreSQL
AI:              OpenAI GPT-4 Turbo
File Storage:    Supabase Storage (encrypted)
Authentication:  Supabase Auth
Payments:        Stripe
PDF Generation:  PDFKit
Word Export:     docx
Email:           Resend API
Charts:          Recharts
Icons:           Lucide React
Hosting:         Vercel-compatible
```

## 📁 Project Structure

```
next-app/
├── src/
│   ├── app/                              # Next.js 14 App Router
│   │   ├── page.tsx                      # Landing page
│   │   ├── layout.tsx                    # Root layout
│   │   ├── globals.css                   # Global styles
│   │   ├── policy-analysis/              # Free policy tool
│   │   │   ├── page.tsx
│   │   │   └── results/page.tsx
│   │   ├── underpayment-detector/        # NEW: Comprehensive detector
│   │   │   ├── page.tsx
│   │   │   └── results/page.tsx
│   │   ├── estimate-analyzer/            # Estimate comparison
│   │   │   ├── page.tsx
│   │   │   └── results/page.tsx
│   │   ├── documentation-builder/        # Doc packet builder
│   │   │   ├── page.tsx
│   │   │   └── results/page.tsx
│   │   ├── strategy-advisor/             # AI recommendations
│   │   │   └── page.tsx
│   │   ├── dashboard/                    # User dashboard
│   │   │   └── page.tsx
│   │   ├── login/                        # Authentication
│   │   │   └── page.tsx
│   │   ├── pricing/                      # Pricing page
│   │   │   └── page.tsx
│   │   ├── success/                      # Post-payment
│   │   │   └── page.tsx
│   │   ├── admin/                        # Admin panel
│   │   │   ├── page.tsx
│   │   │   ├── case-studies/page.tsx
│   │   │   ├── seo-pages/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── guides/[slug]/                # SEO pages
│   │   │   └── page.tsx
│   │   ├── partner/[code]/               # Referral landing
│   │   │   └── page.tsx
│   │   └── api/                          # API Routes
│   │       ├── policy-analysis/
│   │       ├── underpayment-detector/    # NEW
│   │       ├── estimate-analysis/
│   │       ├── documentation-packet/
│   │       ├── strategy-advisor/
│   │       ├── create-checkout/
│   │       ├── webhook/stripe/
│   │       └── admin/
│   ├── components/                       # React Components
│   │   └── landing/
│   │       ├── HeroSection.tsx
│   │       ├── CarrierPhrasesSection.tsx
│   │       ├── ClaimTimelineSection.tsx
│   │       ├── CaseStudiesSection.tsx
│   │       └── CTASection.tsx
│   ├── lib/                              # Core utilities
│   │   ├── supabase.ts                  # Database client
│   │   ├── openai.ts                    # AI integration
│   │   ├── stripe.ts                    # Payment processing
│   │   ├── pdf.ts                       # PDF generation
│   │   ├── storage.ts                   # File storage
│   │   └── email.ts                     # Email service (NEW)
│   └── middleware.ts                     # Referral tracking
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql       # Main schema
│       └── 002_add_underpayment_detection.sql  # NEW
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.example
└── README.md
```

## 🗄️ Database Schema

### Core Tables
- `profiles` - User accounts with payment status
- `claims` - User claims tracking
- `policy_analyses` - Policy analysis results
- `estimate_analyses` - Estimate comparisons
- `underpayment_detections` - **NEW** Comprehensive underpayment analysis
- `documents` - File tracking
- `documentation_packets` - Generated packets
- `deadlines` - Claim deadlines

### Content Tables
- `case_studies` - Success stories
- `seo_pages` - SEO content

### Business Tables
- `partners` - Referral partners
- `referrals` - Referral tracking
- `payments` - Payment records
- `email_captures` - Lead generation
- `analytics_events` - Event tracking

All tables include Row-Level Security (RLS) policies.

## 🔐 Security Features

✅ Supabase Authentication  
✅ Row-Level Security on all tables  
✅ Encrypted file storage  
✅ Secure API routes with auth checks  
✅ Stripe webhook signature verification  
✅ Environment variable protection  
✅ User data isolation  
✅ HTTPS enforcement (production)

## 💳 Payment System

**Product**: Claim Command Pro  
**Price**: $299 (one-time)

**Payment Flow**:
1. User clicks upgrade
2. Stripe Checkout session created
3. Payment processed securely
4. Webhook updates database
5. Features unlocked automatically
6. Confirmation email sent
7. Redirect to dashboard

## 📧 Email Integration

**Resend API** integrated for:
- Welcome emails
- Policy analysis notifications
- Purchase confirmations
- Automated sequences (ready to configure)

## 🎨 Design System

**Colors:**
- Primary: Deep Blue (#0056e0)
- Background: White, Light Gray
- Accents: Green, Red, Yellow

**Typography:**
- Font Family: Inter
- Professional legal-tech aesthetic

**Components:**
- Consistent card design
- Primary/secondary buttons
- Form inputs with focus states
- Responsive layouts
- Loading states
- Error handling

## 🚀 Deployment to Vercel

### Step 1: Supabase Setup
1. Create project at https://supabase.com
2. Run migrations from `supabase/migrations/`
3. Create storage bucket: `claim-documents` (private)
4. Get API keys from Settings → API

### Step 2: OpenAI Setup
1. Get API key from https://platform.openai.com
2. Set usage limits (recommended)

### Step 3: Stripe Setup
1. Create product: "Claim Command Pro" - $299
2. Get Price ID
3. Get API keys (publishable and secret)

### Step 4: Resend Setup
1. Create account at https://resend.com
2. Get API key
3. Verify domain (optional but recommended)

### Step 5: Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Deploy Claim Command Pro"
git push

# Import in Vercel
# Set environment variables
# Deploy
```

### Step 6: Configure Webhook
1. Add Stripe webhook: `https://yourdomain.com/api/webhook/stripe`
2. Select event: `checkout.session.completed`
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel

## 🔧 Environment Variables

```env
# Supabase (3 variables)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (1 variable)
OPENAI_API_KEY=

# Stripe (4 variables)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# App (1 variable)
NEXT_PUBLIC_APP_URL=

# Email (2 variables)
RESEND_API_KEY=
FROM_EMAIL=
```

## 📊 Admin Features

Access at `/admin`:
- **Dashboard** - Key metrics and revenue
- **Case Studies** - Create/edit success stories
- **SEO Pages** - Manage content pages
- **Analytics** - Detailed event tracking

## 🎯 User Flows

### Free User
1. Land on homepage
2. Upload policy (free)
3. View analysis results
4. See upgrade CTA
5. Optional: Create account

### Paid User
1. Sign up / Login
2. Purchase $299 product
3. Access dashboard
4. Use underpayment detector
5. Analyze estimates
6. Build documentation
7. Get AI strategy advice
8. Track deadlines

## 🧪 Testing

### Test Stripe Payments
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry, any 3-digit CVC

### Test Features
1. Policy analysis (free, no login)
2. Create account
3. Test payment flow
4. Upload test estimates
5. Generate documentation
6. Check dashboard
7. Verify email capture

## 📈 Analytics Tracking

**Events tracked:**
- `policy_analysis_completed`
- `estimate_analysis_completed`
- `underpayment_detection_completed`
- `documentation_packet_created`
- `strategy_advisor_used`
- `purchase_completed`

## 🔄 API Endpoints

### Public
- `POST /api/policy-analysis` - Analyze policy (free)
- `GET /api/policy-analysis/[id]` - Get results

### Authenticated (Premium)
- `POST /api/underpayment-detector` - Comprehensive detection
- `GET /api/underpayment-detector/[id]` - Get results
- `GET /api/underpayment-detector/[id]/pdf` - Download PDF
- `POST /api/estimate-analysis` - Analyze estimates
- `POST /api/documentation-packet` - Create packet
- `POST /api/strategy-advisor` - Get AI advice
- `POST /api/create-checkout` - Start payment

### Webhooks
- `POST /api/webhook/stripe` - Handle payments

### Admin
- `GET /api/admin/stats` - Dashboard metrics
- `GET /api/admin/analytics/events` - Event log

## 💰 Pricing Model

**Free Tier:**
- Policy analysis
- View results
- Email capture

**Pro Tier ($299 one-time):**
- Underpayment detector
- Estimate analyzer
- Documentation builder
- AI strategy advisor
- Deadline tracking
- Unlimited usage
- Lifetime access

**Value Proposition:**
- Public adjusters: 15% fee ($7,500 on $50k claim)
- Claim Command Pro: $299 flat fee
- Savings: $7,201

## 🎨 UI Design

**Professional Legal-Tech Aesthetic:**
- Clean, trustworthy design
- Deep blue primary color
- White and light gray backgrounds
- Inter font family
- Consistent spacing and typography
- Responsive across all devices

## 🔒 Security

- All uploaded documents encrypted in Supabase Storage
- Private per user (RLS policies)
- User can delete their own documents
- Secure authentication flow
- Protected API routes
- Webhook signature verification

## 📱 Responsive Design

Fully responsive across:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🚦 Status: Production Ready

✅ All features implemented  
✅ Security configured  
✅ Payment system integrated  
✅ Email system ready  
✅ Admin panel complete  
✅ Documentation comprehensive  
✅ Deployment ready  

## 📞 Support

For setup assistance or questions, refer to:
- This README
- DEPLOYMENT.md
- FEATURES.md
- PROJECT_SUMMARY.md

## 🎯 Next Steps

1. Configure environment variables
2. Run Supabase migrations
3. Test locally
4. Deploy to Vercel
5. Configure Stripe webhook
6. Add initial case studies
7. Create SEO content pages
8. Launch!

## 📄 License

Proprietary - All rights reserved
