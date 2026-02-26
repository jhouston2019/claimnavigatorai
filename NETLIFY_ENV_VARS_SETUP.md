# 🔑 NETLIFY ENVIRONMENT VARIABLES - SETUP GUIDE

**Add these environment variables to your Netlify dashboard.**

---

## 📍 WHERE TO ADD THESE

1. Go to: **https://app.netlify.com/sites/YOUR_SITE/settings/env**
2. Click: **"Add a variable"**
3. Add each key-value pair below
4. Click: **"Save"**
5. Netlify will auto-redeploy

---

## ✅ REQUIRED ENVIRONMENT VARIABLES

### 1. reCAPTCHA Secret Key
```
Key: RECAPTCHA_SECRET_KEY
Value: [Your reCAPTCHA secret key from Google]
```
**Note:** You provided this - it starts with `6LeSGnks...`

### 2. Email Provider
```
Key: EMAIL_PROVIDER
Value: sendgrid
```

### 3. SendGrid API Key
```
Key: SENDGRID_API_KEY
Value: [Your SendGrid API key]
```
**Note:** You provided this - it starts with `SG.vv16...`

### 4. From Email Address
```
Key: FROM_EMAIL
Value: info@axis-strategic-media.com
```

---

## 📋 VERIFICATION CHECKLIST

After adding the above variables:

- [ ] `RECAPTCHA_SECRET_KEY` added (starts with `6LeSGnks...`)
- [ ] `EMAIL_PROVIDER` set to `sendgrid`
- [ ] `SENDGRID_API_KEY` added (starts with `SG.`)
- [ ] `FROM_EMAIL` set to `info@axis-strategic-media.com`
- [ ] Clicked "Save"
- [ ] Netlify deployment triggered (check Deploys tab)
- [ ] Deployment completed successfully

---

## 🔍 EXISTING VARIABLES (Should Already Be Set)

These should already exist in your Netlify dashboard:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

**Do NOT delete or modify these.**

---

## 🎯 EMAIL PROVIDER EXPLANATION

**Q: Why `EMAIL_PROVIDER=sendgrid` if my email is Google-hosted?**

**A:** These are two different things:

| Component | What It Is | Your Value |
|-----------|-----------|------------|
| **Email Address** | Your "return address" | `info@axis-strategic-media.com` |
| **Email Host** | Where your inbox lives | Google Workspace |
| **Email Sending Service** | API that sends emails | SendGrid |
| **API Key** | SendGrid credentials | `SG.vv16...` |

**How it works:**
1. User completes free analysis
2. System calls SendGrid API (using your API key)
3. SendGrid sends email FROM `info@axis-strategic-media.com`
4. Email appears in user's inbox from your address
5. If user replies, it goes to your Google Workspace inbox

**Benefits of SendGrid:**
- Reliable delivery (99.9% uptime)
- Avoids spam filters
- Tracks opens/clicks
- Handles bounce management
- Free tier: 100 emails/day

---

## ✅ AFTER CONFIGURATION

Once all variables are added and deployment completes:

### Test the Free Tool:
1. Go to: **https://claimcommandpro.com/app/free-policy-analysis.html**
2. Enter email: `test@example.com`
3. Select policy type and jurisdiction
4. Paste sample policy text
5. Click "Analyze My Policy"
6. Verify:
   - ✅ No reCAPTCHA errors
   - ✅ Analysis completes
   - ✅ Results display
   - ✅ Email sent (check inbox)

### Check Logs (if issues):
1. Go to: **https://app.netlify.com/sites/YOUR_SITE/functions**
2. Click: **ai-policy-review-free**
3. View logs for errors

---

## 🚀 AFTER ADDING VARIABLES

**System Status:** 🟢 **100% READY TO LAUNCH**

All code is deployed. All security is enabled. All automation is active.

**Next steps:**
1. Add the 4 environment variables above
2. Wait for Netlify deployment (~2 min)
3. Test free tool
4. **GO LIVE** 🚀

---

## 📞 TROUBLESHOOTING

### reCAPTCHA Errors:
- Verify `RECAPTCHA_SECRET_KEY` matches the secret key from Google
- Check browser console (F12) for errors
- Ensure domain is added to reCAPTCHA admin panel

### Email Not Sending:
- Verify `SENDGRID_API_KEY` is correct
- Check SendGrid dashboard for errors
- Verify `FROM_EMAIL` is a valid email address
- Check Netlify function logs

### 500 Errors:
- Check all 4 variables are added
- Check for typos in variable names (case-sensitive)
- Check Netlify function logs for specific errors

---

## 🔒 SECURITY NOTE

**IMPORTANT:** Never commit API keys or secrets to Git. This guide shows you WHERE to add them (Netlify dashboard), not in your code repository.

The keys you provided should ONLY exist in:
- ✅ Netlify environment variables (secure)
- ❌ NOT in Git repository (public)

---

**Add the 4 variables to Netlify. Then you're live.** 🚀
