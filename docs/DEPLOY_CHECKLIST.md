# Claim Navigator Deployment Checklist

This checklist ensures all infrastructure components are properly configured for production deployment.

## Pre-Deployment Setup

### 1. Environment Variables
Set the following environment variables in Netlify Dashboard → Site Settings → Environment Variables:

#### Required Variables
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `SUPABASE_URL` - Supabase project URL (https://your-project.supabase.co)
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_... for production)
- [ ] `SITE_URL` - Your production site URL (https://Claim Navigator.com)

#### Optional Variables
- [ ] `STRIPE_PUBLIC_KEY` - Stripe publishable key for frontend
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `JWT_SECRET` - Secret for JWT token signing
- [ ] `SENDGRID_API_KEY` - SendGrid API key for email
- [ ] `FROM_EMAIL` - Default from email address
- [ ] `SUPPORT_EMAIL` - Support contact email
- [ ] `ADMIN_EMAIL` - Admin contact email
- [ ] `GA4_ID` - Google Analytics 4 tracking ID
- [ ] `SENTRY_DSN` - Sentry DSN for error tracking
- [ ] `AFFILIATE_ID` - Affiliate tracking ID
- [ ] `ADSENSE_ID` - Google AdSense ID
- [ ] `AD_PROVIDER_KEY` - Ad provider API key
- [ ] `EMAIL_REPLY_TO` - Email reply-to address
- [ ] `CACHE_TTL` - Cache TTL in seconds (default: 3600)

### 2. Supabase Configuration

#### Database Setup
- [ ] Apply SQL migration: `supabase/migrations/20250929_claim_nav_infra.sql`
- [ ] Verify all tables are created:
  - [ ] `documents`
  - [ ] `advisories`
  - [ ] `maximize_claim_progress`
  - [ ] `tactics_usage`
  - [ ] `policy_analyses`
  - [ ] `state_rights`
  - [ ] `settlement_comparisons`
  - [ ] `negotiations`
  - [ ] `escalations`
  - [ ] `financial_calcs`
  - [ ] `user_subscriptions`
  - [ ] `usage_tracking`

#### Storage Setup
- [ ] Create storage bucket: `generated-docs` (private)
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test storage upload/download functionality

#### Authentication
- [ ] Configure Supabase Auth settings
- [ ] Set up email templates (if using email auth)
- [ ] Configure OAuth providers (if using social auth)
- [ ] Test authentication flow

### 3. Stripe Configuration

#### Payment Setup
- [ ] Create Stripe products and prices
- [ ] Configure webhook endpoints
- [ ] Set up subscription plans
- [ ] Test payment flow
- [ ] Verify webhook signature validation

#### Products to Create
- [ ] Claim Navigator DIY Toolkit
- [ ] Appeal Builder Premium Access
- [ ] Professional Lead Exchange

### 4. OpenAI Configuration
- [ ] Verify OpenAI API key is valid
- [ ] Test API connection
- [ ] Set up usage monitoring
- [ ] Configure rate limiting

## Code Quality Checks

### 1. TypeScript Compilation
```bash
npm run typecheck
```
- [ ] No TypeScript errors
- [ ] All type definitions are correct
- [ ] Import paths are resolved

### 2. Linting
```bash
npm run lint
```
- [ ] No ESLint errors
- [ ] Code follows style guidelines
- [ ] No unused variables or imports

### 3. Formatting
```bash
npm run format:check
```
- [ ] Code is properly formatted
- [ ] Consistent indentation
- [ ] Proper line endings

### 4. Smoke Tests
```bash
npm run test:smoke
```
- [ ] All smoke tests pass
- [ ] Environment variables are valid
- [ ] API connections work
- [ ] File structure is correct

## Feature Testing

### 1. Document Generator
- [ ] Generate PDF document (EN)
- [ ] Generate PDF document (ES)
- [ ] Generate DOCX document (EN)
- [ ] Generate DOCX document (ES)
- [ ] Verify signed URLs work
- [ ] Test quota enforcement

### 2. Situational Advisory
- [ ] Submit advisory request (EN)
- [ ] Submit advisory request (ES)
- [ ] Verify response format
- [ ] Test quota enforcement

### 3. Maximize Your Claim Guide
- [ ] Mark steps as complete
- [ ] Verify progress tracking
- [ ] Test guide completion

### 4. Insurance Tactics
- [ ] Expand tactic panels
- [ ] Click AI Assist buttons
- [ ] Verify usage logging

### 5. Advanced Tools
- [ ] Policy Analyzer: Upload and analyze policy
- [ ] State Rights: Look up state-specific rights
- [ ] Settlement Comparison: Compare settlement offers
- [ ] Negotiation Tools: Generate negotiation strategies
- [ ] Escalation Guide: Generate escalation strategies
- [ ] Financial Calculator: Perform financial calculations

## Security Checks

### 1. Authentication
- [ ] JWT token validation works
- [ ] Session management is secure
- [ ] User data is properly isolated

### 2. Authorization
- [ ] RLS policies are enforced
- [ ] Users can only access their own data
- [ ] Admin functions are protected

### 3. Input Validation
- [ ] All inputs are validated with Zod
- [ ] File uploads are sanitized
- [ ] SQL injection prevention

### 4. Rate Limiting
- [ ] Rate limits are enforced
- [ ] IP-based limiting works
- [ ] User-based limiting works

## Performance Checks

### 1. Function Performance
- [ ] Netlify functions respond quickly
- [ ] Database queries are optimized
- [ ] File uploads are efficient

### 2. Caching
- [ ] Static assets are cached
- [ ] API responses are cached appropriately
- [ ] CDN is configured

### 3. Monitoring
- [ ] Error tracking is set up
- [ ] Performance monitoring is active
- [ ] Logs are being collected

## Internationalization (i18n)

### 1. Language Support
- [ ] English translations are complete
- [ ] Spanish translations are complete
- [ ] Language toggle works
- [ ] AI prompts use correct language

### 2. Content Localization
- [ ] All UI text is translated
- [ ] Error messages are localized
- [ ] Date/time formatting is correct
- [ ] Currency formatting is correct

## User Experience

### 1. Navigation
- [ ] All routes are accessible
- [ ] Navigation is intuitive
- [ ] Mobile responsiveness works
- [ ] Keyboard accessibility

### 2. Error Handling
- [ ] User-friendly error messages
- [ ] Proper error boundaries
- [ ] Graceful degradation
- [ ] Loading states

### 3. Onboarding
- [ ] Clear feature explanations
- [ ] Helpful tooltips
- [ ] Progress indicators
- [ ] Success feedback

## Final Verification

### 1. Production Deployment
- [ ] Site is accessible at production URL
- [ ] All features work in production
- [ ] SSL certificate is valid
- [ ] Performance is acceptable

### 2. User Testing
- [ ] Test with real user scenarios
- [ ] Verify subscription flow
- [ ] Test payment processing
- [ ] Verify email notifications

### 3. Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Monitor performance metrics
- [ ] Track user analytics

## Post-Deployment

### 1. Documentation
- [ ] Update user documentation
- [ ] Create admin guides
- [ ] Document API endpoints
- [ ] Create troubleshooting guides

### 2. Support
- [ ] Set up support channels
- [ ] Create FAQ section
- [ ] Train support staff
- [ ] Monitor user feedback

### 3. Maintenance
- [ ] Schedule regular backups
- [ ] Plan for updates
- [ ] Monitor security updates
- [ ] Track performance trends

## Emergency Procedures

### 1. Rollback Plan
- [ ] Document rollback procedure
- [ ] Test rollback process
- [ ] Prepare rollback triggers
- [ ] Communicate with team

### 2. Incident Response
- [ ] Define incident severity levels
- [ ] Create escalation procedures
- [ ] Set up monitoring alerts
- [ ] Prepare communication templates

### 3. Data Recovery
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Verify data integrity
- [ ] Plan for data loss scenarios

## Success Criteria

- [ ] All features are functional
- [ ] Performance meets requirements
- [ ] Security is properly implemented
- [ ] User experience is smooth
- [ ] Monitoring is in place
- [ ] Documentation is complete
- [ ] Support processes are ready

## Sign-off

- [ ] Development Team Lead
- [ ] QA Team Lead
- [ ] Security Team Lead
- [ ] Product Manager
- [ ] DevOps Engineer

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** _______________
**Notes:** _______________
