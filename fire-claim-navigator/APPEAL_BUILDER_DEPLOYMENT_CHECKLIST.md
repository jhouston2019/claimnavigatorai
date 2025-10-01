# Appeal Builder Deployment Checklist

## Pre-Deployment Setup

### 1. Database Migration
- [ ] Run `supabase/add_appeals_column.sql` migration
- [ ] Verify `entitlements.appeals` column exists
- [ ] Confirm `appeal-documents` storage bucket is created
- [ ] Test RLS policies for storage bucket

### 2. Environment Variables
- [ ] `STRIPE_SECRET_KEY` - Live Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret
- [ ] `OPENAI_API_KEY` - OpenAI API key with sufficient quota
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key

### 3. Stripe Configuration
- [ ] Create "Appeal Builder - Premium Access" product
- [ ] Set price to $249.00 USD
- [ ] Configure webhook endpoint: `https://yourdomain.com/.netlify/functions/stripe-webhook`
- [ ] Enable `checkout.session.completed` event
- [ ] Test webhook with Stripe CLI or dashboard

### 4. File Structure Verification
- [ ] `app/AppealBuilder.js` exists and is properly formatted
- [ ] `data/affiliates.json` contains partner data
- [ ] All Netlify functions are deployed
- [ ] Response center includes Appeal Builder tab

## Testing Checklist

### 1. Paywall Functionality
- [ ] Paywall displays for users without appeals
- [ ] Purchase button redirects to Stripe checkout
- [ ] Successful payment activates appeal access
- [ ] Failed payment shows appropriate error

### 2. Form Wizard
- [ ] All 6 steps render correctly
- [ ] Form validation works for required fields
- [ ] File upload accepts valid formats
- [ ] Progress bar updates correctly
- [ ] Navigation between steps works

### 3. Letter Generation
- [ ] OpenAI API integration works
- [ ] Letters generate in all 4 languages
- [ ] PDF and DOCX files are created
- [ ] Files are uploaded to Supabase storage
- [ ] Download links work correctly

### 4. Appeal Tracker
- [ ] Appeals display in tracker
- [ ] Status updates work
- [ ] Deadlines calculate correctly
- [ ] Used/available status shows properly

### 5. Partner Links
- [ ] Affiliate links load from JSON
- [ ] Links open in new tabs
- [ ] Only show for users with active appeals

## Production Verification

### 1. Payment Flow
- [ ] Test with real Stripe test cards
- [ ] Verify webhook receives events
- [ ] Confirm appeals are activated after payment
- [ ] Check transaction logging

### 2. Error Handling
- [ ] Test with invalid form data
- [ ] Test with OpenAI API failures
- [ ] Test with storage upload failures
- [ ] Verify error messages are user-friendly

### 3. Performance
- [ ] Letter generation completes within 30 seconds
- [ ] File uploads work for large documents
- [ ] UI remains responsive during processing
- [ ] No memory leaks in long sessions

### 4. Security
- [ ] Users can only access their own appeals
- [ ] File downloads are properly secured
- [ ] No sensitive data in client-side code
- [ ] Webhook signature verification works

## Post-Deployment Monitoring

### 1. Analytics Setup
- [ ] Stripe dashboard shows appeal sales
- [ ] Supabase logs show successful generations
- [ ] Error tracking for failed operations
- [ ] User engagement metrics

### 2. Support Documentation
- [ ] User guide for appeal generation
- [ ] Troubleshooting common issues
- [ ] Contact information for support
- [ ] FAQ for payment and technical issues

### 3. Backup & Recovery
- [ ] Database backups include appeals data
- [ ] Generated files are backed up
- [ ] Recovery procedures documented
- [ ] Test restore procedures

## Success Metrics

### Week 1 Targets
- [ ] 5+ successful appeal purchases
- [ ] 90%+ successful letter generation rate
- [ ] <5% payment failure rate
- [ ] <2 second average page load time

### Month 1 Targets
- [ ] 50+ appeal purchases
- [ ] $12,000+ revenue from appeals
- [ ] 95%+ user satisfaction score
- [ ] <1% critical error rate

## Rollback Plan

### If Issues Arise
1. [ ] Disable Appeal Builder tab in response center
2. [ ] Pause Stripe webhook processing
3. [ ] Notify users of temporary unavailability
4. [ ] Investigate and fix issues
5. [ ] Re-enable after verification

### Emergency Contacts
- [ ] Stripe support for payment issues
- [ ] OpenAI support for API issues
- [ ] Supabase support for database issues
- [ ] Development team for code issues

---

## 🚀 Ready for Launch!

Once all items are checked, the Appeal Builder system is ready for production use. Monitor closely for the first 48 hours and be prepared to address any issues quickly.
