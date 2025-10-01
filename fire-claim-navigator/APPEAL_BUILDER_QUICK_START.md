# Appeal Builder Quick Start Guide

## 🚀 **Ready to Launch in 15 Minutes!**

Since your Supabase and Stripe are already set up, here's exactly what you need to do to get the Appeal Builder running:

## ⚡ **Step 1: Database Setup (2 minutes)**

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of:
-- supabase/complete_appeal_builder_setup.sql
```

**Or run this quick command:**
```bash
# If you have the Supabase CLI installed
supabase db reset --linked
```

## ⚡ **Step 2: Stripe Product Setup (3 minutes)**

1. **Go to Stripe Dashboard** → Products
2. **Click "Add Product"**
3. **Fill in:**
   - **Name:** `Appeal Builder - Premium Access`
   - **Description:** `Generate a complete, customized appeal letter + evidence package`
   - **Price:** `$249.00 USD`
   - **Billing:** `One time`
4. **Save the product**

## ⚡ **Step 3: Test the System (5 minutes)**

1. **Visit your site:** `https://yourdomain.com/app/response-center.html`
2. **Click "Appeal Builder" tab**
3. **You should see the paywall screen**
4. **Click "Purchase Appeal for $249"**
5. **Complete Stripe checkout**
6. **Return to see the form wizard**

## ⚡ **Step 4: Test Letter Generation (5 minutes)**

1. **Fill out the 6-step form:**
   - Policyholder info
   - Claim details
   - Appeal type & reason
   - Supporting documents (optional)
   - Additional notes
   - Review & generate

2. **Click "Generate Appeal"**
3. **Wait for AI processing (30-60 seconds)**
4. **Download your PDF and DOCX files**

## 🎯 **What You'll Have:**

✅ **Complete paywall system** - Users must purchase to access  
✅ **6-step form wizard** - Professional data collection  
✅ **AI letter generation** - GPT-4 powered appeals in 4 languages  
✅ **File downloads** - PDF and DOCX formats  
✅ **Appeal tracking** - Status management and deadlines  
✅ **Partner integration** - Professional service referrals  

## 🔧 **Troubleshooting:**

### If you see "No active appeal found":
- The database migration didn't run properly
- Run the SQL setup script again

### If Stripe checkout fails:
- Check your Stripe product is created
- Verify webhook endpoint is configured
- Check environment variables in Netlify

### If letter generation fails:
- Verify OpenAI API key is set
- Check API quota/credits
- Look at Netlify function logs

## 📊 **Expected Results:**

- **Paywall displays** for users without appeals
- **Purchase flow** redirects to Stripe
- **Form wizard** appears after successful payment
- **AI generates** professional appeal letters
- **Files download** as PDF and DOCX
- **Appeal tracker** shows status and deadlines

## 🚨 **Critical Success Factors:**

1. **Database migration** must run successfully
2. **Stripe product** must be created and active
3. **Environment variables** must be set in Netlify
4. **Webhook endpoint** must be configured in Stripe

## 🎉 **You're Done!**

Once these steps are complete, you have a fully functional Appeal Builder system that can:
- Generate $249 in revenue per appeal
- Create professional insurance appeal letters
- Support multiple languages
- Track appeal status and deadlines
- Integrate with professional partners

**Total setup time: ~15 minutes**  
**Revenue potential: $249 per appeal**  
**System ready for production use**

---

## 📞 **Need Help?**

- Check `APPEAL_BUILDER_IMPLEMENTATION.md` for detailed docs
- Run `node scripts/setup-appeal-builder.js` for system diagnostics
- Test with `https://yourdomain.com/.netlify/functions/test-appeal-builder`

**The Appeal Builder is now ready to generate revenue! 🚀**


