# ⚡ QUICK CONFIGURATION GUIDE

**Time to launch:** 15 minutes

---

## 1️⃣ reCAPTCHA Setup (7 min)

### Get Keys:
1. Go to: https://www.google.com/recaptcha/admin/create
2. Select: **reCAPTCHA v3**
3. Add domains:
   - `claimcommandpro.com`
   - `localhost` (for testing)
4. Copy both keys

### Configure Netlify:
1. Go to: https://app.netlify.com/sites/YOUR_SITE/settings/env
2. Click "Add a variable"
3. Add:
   ```
   Key: RECAPTCHA_SECRET_KEY
   Value: [paste your secret key]
   ```
4. Click "Save"

### Update Frontend:
**File:** `app/free-policy-analysis.html` (line 9)

**Find:**
```javascript
const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY';
```

**Replace with:**
```javascript
const RECAPTCHA_SITE_KEY = '6Lc...your-actual-site-key';
```

**Commit:**
```bash
git add app/free-policy-analysis.html
git commit -m "Configure reCAPTCHA site key"
git push
```

✅ **reCAPTCHA configured**

---

## 2️⃣ Email Provider Setup (8 min)

### Option A: SendGrid (Recommended)

**Sign up:**
1. Go to: https://signup.sendgrid.com/
2. Create account (free tier: 100 emails/day)

**Get API key:**
1. Settings → API Keys
2. Click "Create API Key"
3. Name: "Claim Command Pro"
4. Permissions: "Full Access"
5. Copy key (starts with `SG.`)

**Configure Netlify:**
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@claimcommandpro.com
```

### Option B: Resend (Modern Alternative)

**Sign up:**
1. Go to: https://resend.com/signup
2. Create account

**Get API key:**
1. Settings → API Keys
2. Create key
3. Copy key (starts with `re_`)

**Configure Netlify:**
```
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx
```

### Option C: Mailgun (Enterprise)

**Sign up:**
1. Go to: https://signup.mailgun.com/
2. Add domain: `mg.claimcommandpro.com`

**Get API key:**
1. Settings → API Keys
2. Copy Private API Key

**Configure Netlify:**
```
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxx
MAILGUN_DOMAIN=mg.claimcommandpro.com
```

✅ **Email provider configured**

---

## 3️⃣ Verify Deployment (2 min)

After adding env vars, Netlify auto-redeploys.

**Check deployment:**
1. Go to: https://app.netlify.com/sites/YOUR_SITE/deploys
2. Wait for "Published" status
3. Test: https://claimcommandpro.com/app/free-policy-analysis.html

**Test free tool:**
1. Enter email
2. Upload policy
3. Submit
4. Verify:
   - reCAPTCHA works (no errors)
   - Analysis completes
   - Results display
   - Email received (check inbox)

✅ **System operational**

---

## 🎯 OPTIONAL: Performance Optimization (3 min)

**Create indexes for faster queries:**

1. Go to: https://app.supabase.com/project/bnxvfxtpsxgfpltflyrr/sql
2. Copy contents of: `scripts/create-indexes.sql`
3. Paste into SQL Editor
4. Click "Run"

This improves query performance for:
- Email lookups (1-per-email check)
- IP rate limiting
- Abuse detection
- Email queue processing

**Not required** - system works without indexes, just slower.

---

## ✅ LAUNCH CHECKLIST

- [ ] reCAPTCHA keys obtained
- [ ] RECAPTCHA_SECRET_KEY added to Netlify
- [ ] Site key updated in `app/free-policy-analysis.html`
- [ ] Committed and pushed
- [ ] Email provider chosen
- [ ] Email API key added to Netlify
- [ ] Deployment verified
- [ ] Free tool tested
- [ ] Email received
- [ ] Optional: Indexes created

**When all checked:** 🚀 **READY TO LAUNCH**

---

## 🚨 CRITICAL ENV VARS SUMMARY

**Required in Netlify:**
```bash
# Supabase (already configured)
SUPABASE_URL=https://bnxvfxtpsxgfpltflyrr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[already set]

# OpenAI (already configured)
OPENAI_API_KEY=[already set]

# reCAPTCHA (NEEDED)
RECAPTCHA_SECRET_KEY=your_secret_key_here

# Email Provider (NEEDED - choose one)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@claimcommandpro.com
```

---

## 📞 SUPPORT

**If you get stuck:**
1. Check Netlify function logs
2. Check Supabase logs
3. Check browser console (F12)
4. Verify all env vars are set

**Common issues:**
- reCAPTCHA fails → Check site key matches secret key
- Email not sending → Check API key is valid
- 1-per-email not working → Check database migration ran

---

**Total time:** 15 minutes → **LAUNCH READY** 🚀
