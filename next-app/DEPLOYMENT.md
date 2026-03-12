# Deployment Guide - Claim Command Pro

## Pre-Deployment Checklist

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Navigate to SQL Editor and run the migration:
   ```sql
   -- Copy contents from supabase/migrations/001_initial_schema.sql
   ```
3. Create storage bucket:
   - Go to Storage
   - Create new bucket: `claim-documents`
   - Make it private
   - Enable RLS

4. Configure storage CORS:
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

5. Get your credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → anon/public key
   - Service Role Key: Settings → API → service_role key (keep secret!)

### 2. OpenAI Setup

1. Create account at https://platform.openai.com
2. Generate API key: https://platform.openai.com/api-keys
3. Add billing information
4. Recommended: Set usage limits

### 3. Stripe Setup

1. Create Stripe account at https://stripe.com
2. Create a product:
   - Go to Products
   - Create product: "Claim Command Pro"
   - Price: $299.00 one-time payment
   - Copy the Price ID (starts with `price_`)

3. Get API keys:
   - Publishable key: Developers → API keys → Publishable key
   - Secret key: Developers → API keys → Secret key

4. Webhook setup (after Vercel deployment):
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhook/stripe`
   - Select event: `checkout.session.completed`
   - Copy webhook signing secret

### 4. Vercel Deployment

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. Import project in Vercel:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Root Directory: `next-app`

3. Configure environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   STRIPE_PRICE_ID=your_price_id
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. Deploy!

### 5. Post-Deployment

1. Update Stripe webhook URL:
   - Use your production URL: `https://yourdomain.com/api/webhook/stripe`
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel

2. Update Supabase CORS:
   - Add your production domain to allowed origins

3. Test the flow:
   - Sign up for an account
   - Upload a test policy
   - Complete a test payment (use Stripe test cards)
   - Verify webhook processing

## Environment Variables Reference

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Supabase → Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public API key | Supabase → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Admin API key | Supabase → Settings → API |
| OPENAI_API_KEY | OpenAI API key | OpenAI → API Keys |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe public key | Stripe → Developers → API keys |
| STRIPE_SECRET_KEY | Stripe secret key | Stripe → Developers → API keys |
| STRIPE_WEBHOOK_SECRET | Webhook signing secret | Stripe → Developers → Webhooks |
| STRIPE_PRICE_ID | Product price ID | Stripe → Products |
| NEXT_PUBLIC_APP_URL | Your domain | Your Vercel deployment URL |

## Testing Stripe Payments

Use these test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## Monitoring

### Supabase
- Database: Monitor query performance
- Storage: Check usage and bandwidth
- Auth: Monitor sign-ups and sessions

### Stripe
- Dashboard: Track payments and revenue
- Webhooks: Monitor webhook delivery

### Vercel
- Analytics: Track page views and performance
- Logs: Monitor API routes and errors

## Scaling Considerations

### Database
- Monitor connection pool usage
- Add indexes for slow queries
- Consider upgrading Supabase plan

### Storage
- Monitor storage usage
- Implement file cleanup for deleted users
- Consider CDN for frequently accessed files

### API
- Monitor OpenAI API usage and costs
- Implement rate limiting if needed
- Cache common responses

## Security Checklist

- [ ] All environment variables set
- [ ] Stripe webhook signature verification enabled
- [ ] Supabase RLS policies active
- [ ] Storage bucket is private
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Service role key kept secret
- [ ] Regular security updates

## Backup Strategy

### Database
- Supabase automatic backups (Pro plan)
- Export critical data regularly
- Test restore procedures

### Files
- Supabase Storage has built-in redundancy
- Consider periodic exports of important documents

## Support Setup

1. Create support email: support@yourdomain.com
2. Set up email forwarding
3. Create admin account for support access
4. Document common issues and solutions

## Custom Domain Setup

1. Add domain in Vercel:
   - Settings → Domains
   - Add your domain
   - Configure DNS records

2. Update environment variables:
   - Change `NEXT_PUBLIC_APP_URL` to your domain

3. Update Stripe webhook URL

4. Update Supabase CORS settings

## Launch Checklist

- [ ] All features tested in production
- [ ] Payment flow working
- [ ] Email capture functioning
- [ ] Analytics tracking active
- [ ] Admin panel accessible
- [ ] SEO pages rendering
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Error tracking setup
- [ ] Support system ready
- [ ] Legal pages added (Terms, Privacy)
- [ ] Marketing materials prepared

## Troubleshooting

### Webhook not receiving events
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check Vercel function logs
4. Test with Stripe CLI

### Authentication issues
1. Verify Supabase credentials
2. Check RLS policies
3. Clear browser cache
4. Test in incognito mode

### File upload failures
1. Check storage bucket exists
2. Verify CORS settings
3. Check file size limits
4. Review storage permissions

### Payment not unlocking features
1. Check webhook processing
2. Verify database update
3. Check Stripe event logs
4. Test with Stripe test mode

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Review analytics monthly
- Update dependencies quarterly
- Backup database monthly
- Review and optimize costs monthly

### Updates
- Keep Next.js updated
- Update Supabase client library
- Update Stripe SDK
- Security patches as released

## Cost Estimation

### Monthly Costs (approximate)
- Vercel: $20-100 (Pro plan recommended)
- Supabase: $25-100 (Pro plan for backups)
- OpenAI: Variable ($50-500 depending on usage)
- Stripe: 2.9% + $0.30 per transaction
- Domain: $10-20/year

### Optimization Tips
- Cache OpenAI responses when possible
- Optimize database queries
- Use Vercel Edge Functions for simple routes
- Monitor and set OpenAI usage limits
- Implement request rate limiting

## Support Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
- OpenAI Docs: https://platform.openai.com/docs
