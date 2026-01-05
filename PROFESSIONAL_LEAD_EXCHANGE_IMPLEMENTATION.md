# Professional Lead Exchange Implementation

This document outlines the complete implementation of the Professional Lead Exchange system for Claim Navigator.

## Overview

The Professional Lead Exchange is a B2B platform that allows insurance professionals (public adjusters, attorneys, contractors, consultants) to purchase claim leads from policyholders who have submitted their information through the intake form.

## Architecture

### Database Schema

The system uses the following Supabase tables:

1. **leads** - Stores claim information from policyholders
2. **professionals** - Stores professional user profiles
3. **professional_transactions** - Tracks all purchases and payments

### Key Features

1. **Role-Based Access Control**
   - Professionals must have `role = 'professional'` to access the dashboard
   - Policyholders continue using the existing intake flow
   - Automatic redirection based on user role

2. **Lead Management**
   - Anonymized lead display until purchase
   - Full contact details revealed after payment
   - Lead status tracking (new, claimed, expired)

3. **Payment System**
   - Stripe integration for secure payments
   - Credit system for bulk purchases
   - Transaction tracking and audit trail

4. **Notifications**
   - Email alerts to professionals when new leads are available
   - State-based targeting for relevant professionals

## File Structure

### New Files Created

```
app/
├── professional-dashboard.html          # Main professional dashboard
├── register-professional.html           # Professional registration page

netlify/functions/
├── create-lead-checkout.js              # Stripe checkout for individual leads
├── create-credits-checkout.js           # Stripe checkout for credit packs
├── professional-webhook.js              # Stripe webhook handler
├── notify-new-lead.js                   # Email notifications for new leads
├── create-lead.js                       # Create new leads from intake
├── register-professional.js             # Register new professionals

supabase/
└── professional-lead-exchange-schema.sql # Complete database schema
```

### Modified Files

```
index.html                               # Added "For Professionals" button
```

## Database Schema

### Leads Table
```sql
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    insured_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_loss DATE NOT NULL,
    type_of_loss TEXT NOT NULL,
    insurer TEXT NOT NULL,
    status TEXT NOT NULL,
    property_type TEXT NOT NULL,
    loss_location TEXT NOT NULL,
    lead_status TEXT DEFAULT 'new',
    claimed_by UUID REFERENCES auth.users(id),
    price NUMERIC DEFAULT 249,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Professionals Table
```sql
CREATE TABLE professionals (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT DEFAULT 'professional',
    credits NUMERIC DEFAULT 0,
    company_name TEXT,
    specialty TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Professional Transactions Table
```sql
CREATE TABLE professional_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES auth.users(id),
    lead_id UUID REFERENCES leads(id),
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    credits NUMERIC DEFAULT 0,
    stripe_session_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row-Level Security (RLS) Policies

### Leads Table Policies
- Professionals can view anonymized fields of all leads
- Professionals can view full details only for leads they purchased
- Service role can insert and update leads

### Professionals Table Policies
- Professionals can only view and update their own profile
- Service role can manage all professionals

### Professional Transactions Table Policies
- Professionals can view their own transactions
- Service role can manage all transactions

## User Flow

### Professional Registration
1. User clicks "For Professionals" on homepage
2. Redirected to professional dashboard
3. If not registered as professional, redirected to registration page
4. User fills out professional registration form
5. Account created with `role = 'professional'`
6. Redirected to professional dashboard

### Lead Purchase Flow
1. Professional views anonymized leads in dashboard
2. Clicks "Buy Lead" button
3. Redirected to Stripe checkout
4. Payment processed
5. Webhook updates database
6. Lead status changed to "claimed"
7. Professional can view full contact details

### Credit Purchase Flow
1. Professional views account tab
2. Selects credit pack
3. Redirected to Stripe checkout
4. Payment processed
5. Credits added to account
6. Can use credits for future lead purchases

## API Endpoints

### Lead Management
- `POST /.netlify/functions/create-lead` - Create new lead from intake
- `POST /.netlify/functions/notify-new-lead` - Send notifications for new leads

### Professional Management
- `POST /.netlify/functions/register-professional` - Register new professional

### Payment Processing
- `POST /.netlify/functions/create-lead-checkout` - Create Stripe session for lead purchase
- `POST /.netlify/functions/create-credits-checkout` - Create Stripe session for credit purchase
- `POST /.netlify/functions/professional-webhook` - Handle Stripe webhooks

## Environment Variables Required

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Site URL
URL=https://yourdomain.com
```

## Security Features

1. **Authentication Required**
   - All professional functions require valid Supabase session
   - Role-based access control

2. **Data Protection**
   - Row-Level Security policies
   - Anonymized lead display until purchase
   - Secure payment processing via Stripe

3. **Input Validation**
   - Required field validation
   - Data type checking
   - SQL injection prevention via parameterized queries

## Testing Checklist

### Professional Registration
- [ ] User can access professional dashboard
- [ ] Non-professionals redirected to registration
- [ ] Registration form validation works
- [ ] Successful registration redirects to dashboard

### Lead Management
- [ ] Leads display with anonymized information
- [ ] Lead purchase flow works end-to-end
- [ ] Full contact details revealed after purchase
- [ ] Lead status updates correctly

### Payment System
- [ ] Stripe checkout sessions create successfully
- [ ] Webhook processes payments correctly
- [ ] Credits system works
- [ ] Transaction tracking functions

### Notifications
- [ ] New lead notifications sent to professionals
- [ ] State-based targeting works
- [ ] Email formatting is correct

## Deployment Steps

1. **Database Setup**
   ```sql
   -- Run the schema file in Supabase SQL editor
   \i supabase/professional-lead-exchange-schema.sql
   ```

2. **Environment Variables**
   - Set all required environment variables in Netlify
   - Configure Stripe webhook endpoint

3. **Stripe Configuration**
   - Set up webhook endpoint: `https://yourdomain.com/.netlify/functions/professional-webhook`
   - Configure success/cancel URLs

4. **Email Configuration**
   - Set up SendGrid account
   - Configure email templates

## Monitoring and Maintenance

### Key Metrics to Track
- Lead conversion rates
- Professional registration rates
- Payment success rates
- Email delivery rates

### Regular Maintenance
- Monitor failed webhook deliveries
- Check email bounce rates
- Review transaction logs
- Update lead pricing as needed

## Future Enhancements

1. **Advanced Filtering**
   - Filter leads by specialty
   - Geographic radius search
   - Date range filtering

2. **Lead Quality Scoring**
   - AI-powered lead scoring
   - Professional ratings
   - Success rate tracking

3. **Communication Tools**
   - In-app messaging
   - Lead follow-up tracking
   - CRM integration

4. **Analytics Dashboard**
   - Professional performance metrics
   - Lead source tracking
   - Revenue analytics

## Support and Troubleshooting

### Common Issues
1. **Authentication Errors**
   - Check Supabase session validity
   - Verify RLS policies

2. **Payment Failures**
   - Check Stripe webhook configuration
   - Verify environment variables

3. **Email Delivery Issues**
   - Check SendGrid configuration
   - Verify email addresses

### Debug Tools
- Supabase dashboard for database queries
- Stripe dashboard for payment logs
- Netlify function logs for API debugging
- Browser developer tools for frontend issues
