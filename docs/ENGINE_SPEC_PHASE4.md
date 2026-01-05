# Claim Navigator SaaS Engine Specification - Phase 4
**Generated:** 2025-01-27  
**Purpose:** Complete architecture and implementation guide for transforming Claim Navigator into a production SaaS platform

---

## CURRENT SITE STRUCTURE

### Root Structure
```
Claim Navigator/
├── index.html                    # Landing page (marketing)
├── app/                          # Application directory
│   ├── index.html               # App home
│   ├── login.html               # ✅ EXISTS - Supabase auth
│   ├── register.html            # ✅ EXISTS - Supabase auth
│   ├── dashboard.html           # ❌ NEEDS CREATION
│   ├── resource-center.html     # Resource hub
│   ├── assets/
│   │   ├── css/                 # Stylesheets
│   │   ├── js/                  # JavaScript modules
│   │   └── images/              # Images
│   └── tools/                   # ❌ NEEDS CREATION - Tool pages
├── netlify/
│   └── functions/               # ✅ EXISTS - Netlify Functions
├── supabase/
│   └── schema.sql               # ✅ EXISTS - Partial schema
└── package.json                 # ✅ EXISTS - Dependencies configured
```

### Existing Infrastructure

**✅ Already Implemented:**
- Supabase client setup (`app/assets/js/supabase.js`)
- Auth utilities (`assets/js/auth-utils.js`)
- Login/Register pages with Supabase integration
- Stripe checkout function (`netlify/functions/checkout.js`)
- Stripe webhook handler (`netlify/functions/stripe-webhook.js`)
- Some AI functions (`netlify/functions/aiResponseAgent.js`, etc.)
- Basic Supabase schema (partial)
- PDF generation utilities (`pdf-lib` in dependencies)

**❌ Needs Implementation:**
- Unified Supabase schema for SaaS tables
- Dashboard page and logic
- Unified auth.js module
- Tool pages (AI Response Agent, Document Generator, etc.)
- Payment gating logic
- Complete AI function suite
- Evidence organizer with file uploads
- Timeline/deadline tracker integration

---

## ARCHITECTURE OVERVIEW

### Frontend (Static HTML/JS)
- **Location:** `/app/` directory
- **Styling:** Existing CSS files (preserved)
- **JavaScript:** ES6 modules in `/app/assets/js/`
- **Auth:** Supabase Auth client-side
- **State:** Supabase database queries

### Backend (Netlify Functions)
- **Location:** `/netlify/functions/`
- **Runtime:** Node.js 18+
- **AI:** OpenAI API (via functions)
- **PDF:** pdf-lib library
- **Auth:** Supabase service role (server-side)

### Database (Supabase)
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage buckets
- **Database:** PostgreSQL with RLS

### Payments (Stripe)
- **Checkout:** Stripe Checkout Sessions
- **Webhooks:** Netlify Function handler
- **Gating:** Payment status in Supabase

---

## DATA FLOW

### User Registration Flow
```
User → /app/register.html
  → Supabase Auth signUp()
  → Create profile in users_profile table
  → Redirect to /app/dashboard.html
```

### Payment Flow
```
User → /app/pricing.html or index.html CTA
  → Click "Get Full Access"
  → POST /netlify/functions/create-checkout-session
  → Stripe Checkout Session created
  → User completes payment
  → Stripe webhook → /netlify/functions/stripe-webhook
  → Update payments table in Supabase
  → User redirected to /app/checkout-success.html
  → Access granted
```

### AI Tool Usage Flow
```
Logged-in User → /app/tools/ai-response-agent.html
  → Fill form (claim type, insurer, denial text, tone)
  → POST /netlify/functions/ai-response-agent
  → Function validates auth + payment
  → OpenAI API call
  → Return JSON (subject, body, next steps)
  → Display result
  → User clicks "Save to Documents"
  → Insert into documents table
  → User clicks "Download PDF"
  → POST /netlify/functions/generate-pdf
  → PDF generated and returned
```

### Document Storage Flow
```
User creates document via tool
  → Save button clicked
  → Insert into documents table (user_id, type, content)
  → Document appears in dashboard
  → User can view/edit/delete
```

### Evidence Upload Flow
```
User → /app/tools/evidence-organizer.html
  → Select files (photos, receipts, estimates)
  → Upload to Supabase Storage bucket: evidence/
  → Insert metadata into evidence_items table
  → Files organized by category
  → Linked to documents if needed
```

---

## SUPABASE SCHEMA

### Tables Required

#### 1. users_profile
```sql
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'response_letter', 'proof_of_loss', 'demand_letter', etc.
  title TEXT NOT NULL,
  content TEXT, -- Full document text
  metadata JSONB, -- Additional structured data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. evidence_items
```sql
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'estimate', 'invoice', 'photo', 'email', 'receipt'
  file_url TEXT, -- Supabase Storage URL
  file_name TEXT,
  file_size INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. policy_summaries
```sql
CREATE TABLE policy_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_policy_url TEXT, -- Supabase Storage URL if uploaded
  summary_json JSONB NOT NULL, -- Structured summary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. deadlines
```sql
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE NOT NULL,
  source TEXT, -- 'state_law', 'policy', 'carrier_letter', 'ai_suggested'
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'canceled'
  plan TEXT, -- 'claim_navigator_toolkit'
  amount_paid INTEGER, -- in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables must have RLS enabled with policies:
- Users can only SELECT/INSERT/UPDATE/DELETE their own records
- Service role can access all records (for functions)

---

## NETLIFY FUNCTIONS

### Required Functions

#### 1. `/netlify/functions/create-checkout-session.js`
- **Purpose:** Create Stripe Checkout session
- **Method:** POST
- **Input:** `{ priceId: string, userEmail?: string }`
- **Output:** `{ url: string }` (checkout URL)
- **Auth:** Optional (can be called before login)

#### 2. `/netlify/functions/stripe-webhook.js`
- **Purpose:** Handle Stripe webhook events
- **Method:** POST
- **Events:** `checkout.session.completed`
- **Actions:** Update payments table, grant access

#### 3. `/netlify/functions/ai-response-agent.js`
- **Purpose:** Generate AI response letters
- **Method:** POST
- **Input:** `{ claim_type, insurer_name, denial_letter_text, tone }`
- **Output:** `{ subject, body, next_steps }`
- **Auth:** Required (Bearer token)

#### 4. `/netlify/functions/ai-document-generator.js`
- **Purpose:** Generate documents from templates
- **Method:** POST
- **Input:** `{ template_type, user_inputs }`
- **Output:** `{ document_text, subject_line }`
- **Auth:** Required

#### 5. `/netlify/functions/ai-coverage-decoder.js`
- **Purpose:** Analyze insurance policy
- **Method:** POST
- **Input:** `{ policy_text }`
- **Output:** `{ summary, limits, deductibles, exclusions, deadlines }`
- **Auth:** Required

#### 6. `/netlify/functions/ai-timeline-analyzer.js`
- **Purpose:** Analyze claim timeline and suggest deadlines
- **Method:** POST
- **Input:** `{ key_dates }`
- **Output:** `{ suggested_deadlines }`
- **Auth:** Required

#### 7. `/netlify/functions/generate-pdf.js`
- **Purpose:** Generate PDF from document content
- **Method:** POST
- **Input:** `{ document_content, metadata }`
- **Output:** PDF file (binary)
- **Auth:** Required

#### 8. `/netlify/functions/check-payment-status.js`
- **Purpose:** Check if user has paid access
- **Method:** GET
- **Input:** User ID from auth token
- **Output:** `{ has_access: boolean, payment_status: string }`
- **Auth:** Required

---

## ENVIRONMENT VARIABLES

### Required Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CLAIM_NAVIGATOR=price_...

# OpenAI
OPENAI_API_KEY=sk-...

# Site
SITE_URL=https://Claim Navigator.com
```

---

## KEY PAGES & FLOWS

### 1. Landing → Pricing → Checkout → Dashboard
```
index.html (landing)
  → Click "Get Your Claim Toolkit"
  → /app/pricing.html
  → Click "Purchase"
  → Stripe Checkout
  → /app/checkout-success.html
  → /app/dashboard.html
```

### 2. Register → Dashboard
```
/app/register.html
  → Supabase signUp()
  → Create profile
  → /app/dashboard.html
```

### 3. Login → Dashboard
```
/app/login.html
  → Supabase signIn()
  → /app/dashboard.html
```

### 4. Dashboard → Tools
```
/app/dashboard.html
  → Click tool card
  → /app/tools/[tool-name].html
  → Use tool
  → Save to documents
  → Return to dashboard
```

---

## FILE STRUCTURE ADDITIONS

### New Files to Create

```
app/
├── dashboard.html                    # Main dashboard
├── checkout-success.html             # Payment success page
├── pricing.html                      # Pricing page (if not exists)
├── tools/
│   ├── ai-response-agent.html
│   ├── document-generator.html
│   ├── proof-of-loss.html
│   ├── evidence-organizer.html
│   ├── coverage-decoder.html
│   └── timeline-deadlines.html
└── assets/js/
    ├── auth.js                       # Unified auth module
    ├── dashboard.js                   # Dashboard logic
    └── supabase-client.js            # Supabase client singleton

netlify/functions/
├── create-checkout-session.js        # Stripe checkout
├── check-payment-status.js          # Payment gating
├── ai-response-agent.js              # AI response generator
├── ai-document-generator.js          # Document generator
├── ai-coverage-decoder.js            # Policy analyzer
├── ai-timeline-analyzer.js           # Timeline analyzer
└── generate-pdf.js                    # PDF generator

supabase/
└── schema-phase4.sql                 # Complete SaaS schema

docs/
└── ENGINE_SPEC_PHASE4.md             # This file
```

---

## IMPLEMENTATION STEPS

1. ✅ **Analyze existing structure** (this document)
2. ⏳ **Create/update config files** (env.example, netlify.toml)
3. ⏳ **Create unified Supabase schema**
4. ⏳ **Create unified auth.js module**
5. ⏳ **Enhance login/register pages**
6. ⏳ **Create dashboard page**
7. ⏳ **Create/enhance Stripe functions**
8. ⏳ **Create AI Netlify Functions**
9. ⏳ **Create PDF generation function**
10. ⏳ **Create tool pages**
11. ⏳ **Update navigation**
12. ⏳ **Add access control**

---

## SECURITY CONSIDERATIONS

1. **Never expose secrets to client**
   - Service role key only in Netlify Functions
   - OpenAI API key only in functions
   - Stripe secret key only in functions

2. **Row Level Security (RLS)**
   - All Supabase tables have RLS enabled
   - Users can only access their own data

3. **Authentication**
   - All protected routes check auth
   - All functions validate Bearer tokens

4. **Payment Gating**
   - Check payment status before AI calls
   - Graceful degradation for unpaid users

---

## LOCAL DEVELOPMENT

### Setup
```bash
# Install dependencies
npm install

# Copy env.example to .env
cp env.example .env
# Fill in your values

# Run Netlify Dev
npm run dev
# or
netlify dev
```

### Testing
- Use Stripe test keys
- Use Supabase local instance (optional)
- Test auth flows
- Test payment flows
- Test AI functions

---

## DEPLOYMENT CHECKLIST

- [ ] All environment variables set in Netlify
- [ ] Supabase schema applied
- [ ] Stripe webhook configured
- [ ] RLS policies tested
- [ ] All functions deployed
- [ ] Auth flows tested
- [ ] Payment flows tested
- [ ] AI functions tested
- [ ] PDF generation tested
- [ ] Dashboard loads correctly
- [ ] Tool pages functional

---

**END OF ENGINE SPECIFICATION**



