# Per-Claim Licensing System Setup Guide

This guide explains how to set up and use the complete per-claim licensing system for Claim Navigator.

## Overview

The per-claim licensing system transforms Claim Navigator from a general tool to a claim-specific service where:
- **One payment = One claim license**
- **Each claim gets personalized documents**
- **Complete access control and audit tracking**
- **Admin monitoring and management**

## System Architecture

### 1. **Database Schema**
- `claims` table: Stores claim information and payment status
- `claim_access_logs` table: Tracks all document access and actions
- Enhanced with RLS policies for security

### 2. **Payment Flow**
- User creates claim with required information
- Stripe checkout with claim metadata
- Webhook creates claim record on successful payment
- User redirected to claim-specific dashboard

### 3. **Access Control**
- All document functions require valid claim_id
- User must own the claim and have paid status
- Complete audit trail of all actions

### 4. **Document Protection**
- Claim-specific headers and footers
- Unique document IDs for tracking
- Non-transferable watermarks

## Setup Instructions

### 1. Database Setup

Run the enhanced schema migration:
```sql
-- Execute supabase/claims-licensing-schema.sql
-- This creates the enhanced claims table and access logs
```

### 2. Environment Variables

Ensure these are set in Netlify:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 3. Stripe Webhook Configuration

1. **Create Webhook Endpoint** in Stripe Dashboard:
   - URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Get Webhook Secret** and add to environment variables

### 4. Files Created/Updated

#### New Files:
- `supabase/claims-licensing-schema.sql` - Enhanced database schema
- `netlify/functions/create-claim-checkout.js` - Claim-specific checkout
- `netlify/functions/stripe-webhook.js` - Payment webhook handler
- `netlify/functions/utils/claim-access-control.js` - Access control utilities
- `netlify/functions/admin-claims-monitor.js` - Admin monitoring
- `app/claim.html` - Claim dashboard page
- `app/admin.html` - Admin monitoring interface

#### Updated Files:
- `netlify/functions/serve-protected-document-simple.js` - Enhanced with claim access control
- `app/response-center.html` - Updated to pass claim_id
- `_redirects` - Added claim routing

## User Flow

### 1. **Claim Creation & Payment**
```
User fills claim form → Stripe checkout with metadata → Payment success → 
Webhook creates claim → Redirect to /app/claim/{claim_id}
```

### 2. **Document Access**
```
User clicks document → System validates claim access → 
Adds claimant protection → Serves personalized PDF → Logs access
```

### 3. **Claim Dashboard**
```
User accesses /app/claim/{claim_id} → Shows claim details → 
Lists available tools → Tracks recent activity
```

## API Endpoints

### 1. **Create Claim Checkout**
```
POST /.netlify/functions/create-claim-checkout
Body: {
  claimData: {
    policy_number: "POL123456",
    insured_name: "John Doe",
    insurer: "State Farm",
    date_of_loss: "2025-01-15",
    type_of_loss: "Water Damage",
    loss_location: "123 Main St, Anytown, CA 12345",
    property_type: "residential"
  },
  userEmail: "user@example.com"
}
```

### 2. **Stripe Webhook**
```
POST /.netlify/functions/stripe-webhook
Headers: {
  "stripe-signature": "webhook_signature"
}
```

### 3. **Protected Document Access**
```
GET /.netlify/functions/serve-protected-document-simple?documentPath=path&claim_id=uuid
Headers: {
  "Authorization": "Bearer jwt_token"
}
```

### 4. **Admin Monitoring**
```
GET /.netlify/functions/admin-claims-monitor?limit=50&offset=0&status=paid
Headers: {
  "Authorization": "Bearer jwt_token"
}
```

## Claim Data Structure

### Claims Table:
```sql
{
  id: "uuid",
  user_id: "uuid",
  policy_number: "POL123456",
  insured_name: "John Doe",
  insurer: "State Farm",
  date_of_loss: "2025-01-15",
  type_of_loss: "Water Damage",
  loss_location: "123 Main St, Anytown, CA 12345",
  property_type: "residential",
  status: "paid",
  stripe_session_id: "cs_...",
  stripe_payment_intent_id: "pi_...",
  amount_paid: 997.00,
  currency: "usd",
  created_at: "2025-01-15T10:30:00Z",
  updated_at: "2025-01-15T10:30:00Z"
}
```

### Access Logs:
```sql
{
  id: "uuid",
  user_id: "uuid",
  claim_id: "uuid",
  document_id: "document_slug",
  action: "downloaded",
  document_type: "template",
  timestamp: "2025-01-15T10:30:00Z",
  metadata: {
    document_path: "en/Proof of Loss.pdf",
    file_size: 245760,
    user_email: "user@example.com"
  }
}
```

## Document Protection Features

### 1. **Claimant Headers** (Top of every page):
```
Insured: John Doe | Policy #: POL123456 | Insurer: State Farm | Loss Date: Jan 15, 2025 | Location: 123 Main St, Anytown, CA 12345
```

### 2. **Claimant Footers** (Bottom of every page):
```
Generated for John Doe – Not transferable
```

### 3. **Document ID** (Bottom right):
```
Doc ID: A1B2C3D4E5F6G7H8
```

### 4. **Watermark** (Diagonal, semi-transparent):
```
Generated for John Doe
```

## Access Control Rules

### 1. **Claim Ownership**
- Users can only access their own claims
- Claims are tied to authenticated user_id

### 2. **Payment Status**
- Only claims with status "paid" or "active" can access documents
- New claims require payment completion

### 3. **Document Access**
- All document requests require valid claim_id
- Access is logged for audit purposes
- No cross-claim access allowed

### 4. **Admin Access**
- Admin interface requires authentication
- Can view all claims and access logs
- Provides monitoring and analytics

## Testing

### 1. **Test Claim Creation**
```bash
# Create a test claim checkout
curl -X POST https://your-site.netlify.app/.netlify/functions/create-claim-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "claimData": {
      "policy_number": "TEST123",
      "insured_name": "Test User",
      "insurer": "Test Insurance",
      "date_of_loss": "2025-01-15",
      "type_of_loss": "Test Loss",
      "loss_location": "123 Test St",
      "property_type": "residential"
    },
    "userEmail": "test@example.com"
  }'
```

### 2. **Test Document Access**
```bash
# Test document access with claim_id
curl -X GET "https://your-site.netlify.app/.netlify/functions/serve-protected-document-simple?documentPath=en/Proof%20of%20Loss.pdf&claim_id=CLAIM_UUID" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### 3. **Test Admin Monitoring**
```bash
# Test admin endpoint
curl -X GET "https://your-site.netlify.app/.netlify/functions/admin-claims-monitor?limit=10" \
  -H "Authorization: Bearer JWT_TOKEN"
```

## Monitoring & Analytics

### 1. **Admin Dashboard** (`/app/admin.html`)
- Total claims and revenue
- Status breakdown
- Recent activity
- Access log summaries
- Filtering and pagination

### 2. **Claim Dashboard** (`/app/claim/{claim_id}`)
- Claim details and status
- Available tools and documents
- Recent activity log
- Document access tracking

### 3. **Access Logs**
- Complete audit trail
- Document access tracking
- User activity monitoring
- Performance metrics

## Security Features

### 1. **Row Level Security (RLS)**
- Users can only access their own claims
- Admin access through service role
- Secure data isolation

### 2. **JWT Authentication**
- All API calls require valid JWT
- User identity verification
- Session management

### 3. **Webhook Security**
- Stripe signature verification
- Secure payment processing
- Tamper-proof claim creation

### 4. **Document Protection**
- Claim-specific watermarks
- Non-transferable documents
- Unique document IDs
- Access logging

## Troubleshooting

### Common Issues:

1. **Claim Not Found**
   - Check if claim_id is valid
   - Verify user owns the claim
   - Ensure claim status is "paid"

2. **Payment Not Processing**
   - Check Stripe webhook configuration
   - Verify webhook secret
   - Check webhook endpoint logs

3. **Document Access Denied**
   - Verify claim_id parameter
   - Check user authentication
   - Ensure claim is paid

4. **Admin Access Issues**
   - Verify admin authentication
   - Check RLS policies
   - Ensure proper permissions

### Debug Steps:

1. **Check Function Logs**
   ```bash
   # In Netlify dashboard, check function logs
   ```

2. **Verify Database**
   ```sql
   -- Check claims table
   SELECT * FROM claims WHERE user_id = 'USER_ID';
   
   -- Check access logs
   SELECT * FROM claim_access_logs WHERE claim_id = 'CLAIM_ID';
   ```

3. **Test Webhook**
   ```bash
   # Use Stripe CLI to test webhooks locally
   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
   ```

## Migration Notes

### From General Tool to Per-Claim System:
- Existing users will need to create claims
- Document access now requires claim_id
- Enhanced protection on all documents
- Complete audit trail implementation

### Backward Compatibility:
- Existing document protection maintained
- Gradual migration possible
- No breaking changes to core functionality

## Support

For issues or questions:
1. Check Netlify function logs
2. Verify database schema
3. Test webhook configuration
4. Check environment variables
5. Review access control policies

The per-claim licensing system provides a complete, secure, and scalable solution for claim-specific document management with full audit capabilities.
