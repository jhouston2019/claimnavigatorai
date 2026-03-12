# Claim Command Pro

A production-ready SaaS web application that helps homeowners and property owners identify insurance claim underpayments and generate structured documentation to support their claims.

## Features

### 1. Marketing Landing Page
- High-conversion hero section with compelling copy
- Carrier phrase recognition section
- Claim timeline education
- Case studies showcase
- Multiple CTAs throughout

### 2. Free Policy Analysis Tool
- PDF upload and parsing
- AI-powered policy analysis using OpenAI
- Extracts coverage triggers, documentation requirements, and dispute risks
- Email capture for lead generation

### 3. Claim Gap Report Generator
- Upload carrier and contractor estimates
- AI analysis to identify missing scope items
- Pricing discrepancy detection
- PDF export of gap report

### 4. Insurance Estimate Analyzer
- Compare multiple estimates
- Identify coverage trigger issues
- Generate detailed analysis reports

### 5. Documentation Packet Builder
- Structured claim documentation creation
- Evidence checklist management
- Dispute letter templates
- Export to PDF and Word formats

### 6. User Dashboard
- Claim status tracking
- Deadline reminders
- Document management
- Quick access to all tools

### 7. AI Claim Strategy Advisor
- Personalized recommendations
- Evidence gathering guidance
- Response tactics
- Timeline considerations

### 8. Case Study System
- Admin panel for case study management
- Public display on landing page
- Conversion-focused presentation

### 9. SEO Authority Pages
- Dynamic content management system
- SEO-optimized article pages
- Integrated CTAs for conversion

### 10. Email Capture & CRM
- Email collection throughout user journey
- Analytics tracking for all captures
- Ready for email automation integration

### 11. Partner Referral System
- Unique referral codes
- Conversion tracking
- Cookie-based attribution

### 12. Stripe Payment Integration
- $299 one-time payment
- Secure checkout flow
- Webhook handling for fulfillment
- Automatic feature unlocking

### 13. Admin Analytics Dashboard
- User metrics
- Revenue tracking
- Conversion rate monitoring
- Event analytics

### 14. Security Features
- Supabase authentication
- Row-level security policies
- Encrypted file storage
- Secure API routes

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI API (GPT-4)
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **PDF Generation**: PDFKit
- **Word Documents**: docx library
- **Authentication**: Supabase Auth
- **Hosting**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- OpenAI API key
- Stripe account

### Installation

1. Clone the repository
2. Navigate to the next-app directory:
   ```bash
   cd next-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

5. Set up Supabase:
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/001_initial_schema.sql`
   - Create a storage bucket named `claim-documents`
   - Enable RLS policies

6. Set up Stripe:
   - Create a product in Stripe for $299
   - Copy the Price ID to your `.env` file
   - Set up webhook endpoint: `/api/webhook/stripe`

7. Run the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

Run the SQL migration in your Supabase SQL editor:

```sql
-- See supabase/migrations/001_initial_schema.sql
```

This creates:
- User profiles with payment status
- Claims and estimates tables
- Document storage tracking
- Case studies and SEO pages
- Partner referral system
- Analytics events
- Row-level security policies

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Stripe Webhook Setup

After deployment:
1. Add your production webhook URL in Stripe Dashboard
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

### Supabase Storage

Configure CORS in Supabase Storage:
```json
[
  {
    "allowedOrigins": ["https://yourdomain.com"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

## Project Structure

```
next-app/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── page.tsx           # Landing page
│   │   ├── policy-analysis/   # Free policy tool
│   │   ├── estimate-analyzer/ # Estimate comparison
│   │   ├── documentation-builder/
│   │   ├── dashboard/         # User dashboard
│   │   ├── strategy-advisor/  # AI recommendations
│   │   ├── admin/             # Admin panel
│   │   ├── guides/            # SEO pages
│   │   ├── pricing/           # Pricing page
│   │   ├── login/             # Authentication
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── landing/           # Landing page sections
│   └── lib/                   # Utilities
│       ├── supabase.ts        # Supabase client
│       ├── openai.ts          # OpenAI integration
│       ├── stripe.ts          # Stripe integration
│       ├── pdf.ts             # PDF generation
│       └── storage.ts         # File storage
├── supabase/
│   └── migrations/            # Database migrations
├── public/                    # Static assets
└── package.json
```

## Key Features Implementation

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. Profile automatically created via database trigger
3. Row-level security ensures data privacy

### Payment Flow
1. User clicks "Upgrade to Pro"
2. Stripe Checkout session created
3. User completes payment
4. Webhook updates user profile
5. Features automatically unlocked

### Policy Analysis Flow
1. User uploads policy PDF
2. Text extracted from PDF
3. OpenAI analyzes and extracts key information
4. Results stored in database
5. Email captured for marketing

### Estimate Analysis Flow
1. User uploads carrier estimate (+ optional contractor estimate)
2. AI compares and identifies gaps
3. Gap report generated with financial summary
4. PDF export available

## Admin Access

Access the admin dashboard at `/admin` to:
- View analytics and metrics
- Manage case studies
- Create SEO content pages
- Monitor user activity

## API Routes

- `POST /api/policy-analysis` - Analyze insurance policy
- `POST /api/estimate-analysis` - Compare estimates
- `POST /api/documentation-packet` - Generate documentation
- `POST /api/strategy-advisor` - Get AI recommendations
- `POST /api/create-checkout` - Create Stripe checkout
- `POST /api/webhook/stripe` - Handle Stripe webhooks
- `GET /api/admin/stats` - Get admin statistics

## Security Considerations

- All API routes check authentication
- Row-level security on all database tables
- Files stored with user-specific paths
- Stripe webhook signature verification
- Environment variables for sensitive data
- HTTPS required in production

## Performance Optimizations

- Next.js 14 App Router with React Server Components
- Static generation for SEO pages
- Optimized images and assets
- Database indexes on frequently queried columns
- Efficient PDF generation

## Support

For issues or questions, contact support@claimcommandpro.com

## License

Proprietary - All rights reserved
