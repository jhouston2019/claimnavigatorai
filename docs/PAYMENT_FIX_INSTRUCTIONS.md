# PAYMENT SYSTEM - FIX INSTRUCTIONS

**Status:** 1 critical bug blocking payment system  
**Fix Time:** 5 minutes  
**Impact:** HIGH - Users can't get access after paying

---

## 🔴 CRITICAL FIX #1: Webhook Field Name

### The Problem
The webhook handler uses the wrong database field name when creating claims after payment.

### The Fix

**File:** `netlify/functions/stripe-webhook.js`

**Line 66** - Change this:
```javascript
const { data: newClaim, error: claimError } = await supabase
  .from('claims')
  .insert({
    user_id: userId,
    unlocked_via_stripe_session_id: sessionId,  // ❌ WRONG
    status: 'active',
    claim_data: {}
  })
```

**To this:**
```javascript
const { data: newClaim, error: claimError } = await supabase
  .from('claims')
  .insert({
    user_id: userId,
    stripe_session_id: sessionId,  // ✅ CORRECT
    status: 'active',
    claim_data: {}
  })
```

**Why:** The database schema defines the field as `stripe_session_id`, not `unlocked_via_stripe_session_id`.

---

## ⚠️ RECOMMENDED FIX #2: Remove Fake Checkout

### The Problem
`/app/checkout.html` uses localStorage to fake a payment, confusing users.

### The Fix

**Option A: Delete the file**
```bash
# Remove fake checkout
rm app/checkout.html
```

**Option B: Redirect to real checkout**

Replace entire contents of `app/checkout.html` with:
```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/paywall/locked.html">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to checkout...</p>
  <script>window.location.href = '/paywall/locked.html';</script>
</body>
</html>
```

**Why:** Prevents users from thinking they paid when they didn't.

---

## ⚠️ RECOMMENDED FIX #3: Make Claim Fields Nullable

### The Problem
Webhook creates claims without required fields like `policy_number`, `insured_name`, etc.

### The Fix

Run this SQL in Supabase SQL Editor:

```sql
-- Make claim fields nullable so webhook can create minimal claims
ALTER TABLE claims 
  ALTER COLUMN policy_number DROP NOT NULL,
  ALTER COLUMN insured_name DROP NOT NULL,
  ALTER COLUMN insurer DROP NOT NULL,
  ALTER COLUMN date_of_loss DROP NOT NULL,
  ALTER COLUMN type_of_loss DROP NOT NULL,
  ALTER COLUMN loss_location DROP NOT NULL,
  ALTER COLUMN property_type DROP NOT NULL;

-- Add default values
ALTER TABLE claims 
  ALTER COLUMN policy_number SET DEFAULT 'PENDING',
  ALTER COLUMN insured_name SET DEFAULT 'PENDING',
  ALTER COLUMN insurer SET DEFAULT 'PENDING',
  ALTER COLUMN type_of_loss SET DEFAULT 'PENDING',
  ALTER COLUMN property_type SET DEFAULT 'residential';
```

**Why:** Allows webhook to create claim immediately, user can fill in details later.

---

## 🧪 TESTING INSTRUCTIONS

### 1. Test Payment Flow

**Test Card:** `4242 4242 4242 4242`  
**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

### 2. Test Steps

1. **Start Test:**
   - Open browser in incognito mode
   - Go to your site
   - Click "Sign Up" and create test account

2. **Trigger Payment:**
   - Navigate to `/paywall/locked.html`
   - Click "Unlock Claim - $99"
   - Should redirect to Stripe checkout

3. **Complete Payment:**
   - Enter test card: `4242 4242 4242 4242`
   - Fill in other fields
   - Click "Pay"

4. **Verify Success:**
   - Should redirect to `/claim/success.html`
   - Should see "Payment Confirmed"
   - Should auto-redirect to Claim Management Center

5. **Verify Access:**
   - Try accessing a paid tool
   - Should NOT see paywall
   - Should see tool content

6. **Check Database:**
   - Open Supabase → Table Editor → `claims`
   - Should see new claim with:
     - `user_id`: your test user ID
     - `stripe_session_id`: cs_test_...
     - `status`: 'active'

### 3. Test Failure Scenarios

**Test Declined Card:** `4000 0000 0000 0002`
- Should show error on Stripe page
- Should NOT create claim
- User should NOT get access

**Test Insufficient Funds:** `4000 0000 0000 9995`
- Should show error on Stripe page
- Should NOT create claim

---

## 🚀 DEPLOYMENT STEPS

### 1. Make Code Changes
```bash
# Edit the webhook file
# Fix line 66 as shown above
```

### 2. Commit and Push
```bash
git add netlify/functions/stripe-webhook.js
git commit -m "Fix: Correct webhook field name for stripe_session_id"
git push origin main
```

### 3. Netlify Auto-Deploy
- Netlify will automatically deploy
- Wait ~2 minutes for build to complete
- Check deploy log for any errors

### 4. Verify Deployment
- Check Netlify deploy log shows "Published"
- Visit your site to confirm it's live

---

## 🔍 VERIFICATION CHECKLIST

After deploying fixes, verify:

- [ ] Webhook file deployed with correct field name
- [ ] Test payment completes successfully
- [ ] Claim created in database with `stripe_session_id`
- [ ] User redirected to success page
- [ ] User can access paid tools
- [ ] Non-paying users still blocked
- [ ] Webhook logs show no errors (check Netlify Functions logs)
- [ ] Stripe dashboard shows successful payment
- [ ] Database shows active claim

---

## 🐛 TROUBLESHOOTING

### Issue: Payment succeeds but no access granted

**Check:**
1. Netlify Functions logs for webhook errors
2. Supabase logs for database errors
3. Verify webhook is registered in Stripe Dashboard
4. Check `STRIPE_WEBHOOK_SECRET` matches Stripe

**Fix:**
- Ensure webhook URL is: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
- Ensure webhook listens for: `checkout.session.completed`

### Issue: Checkout button does nothing

**Check:**
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Verify `STRIPE_SECRET_KEY` is set in Netlify

**Fix:**
- Check `/app/assets/js/stripe-checkout.js` is loaded
- Verify user is authenticated before checkout

### Issue: Database INSERT fails

**Check:**
1. Supabase logs for constraint violations
2. Verify claim fields are nullable (Fix #3 above)
3. Check user_id exists in auth.users table

**Fix:**
- Run SQL from Fix #3 to make fields nullable

---

## 📞 SUPPORT RESOURCES

**Stripe Dashboard:** https://dashboard.stripe.com/  
**Netlify Dashboard:** https://app.netlify.com/  
**Supabase Dashboard:** https://supabase.com/dashboard/  

**Webhook Logs:**
- Netlify: Site → Functions → stripe-webhook → Logs
- Stripe: Dashboard → Developers → Webhooks → [Your webhook] → Events

**Test Mode:**
- All test transactions visible in Stripe Dashboard
- No real money charged
- Use test cards only

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:
1. ✅ User clicks "Unlock Claim"
2. ✅ Redirected to Stripe checkout
3. ✅ Enters test card and pays
4. ✅ Redirected to success page
5. ✅ Can access all paid tools
6. ✅ Claim appears in database
7. ✅ No errors in logs

**After this:** Switch to live Stripe keys and you're production-ready!

---

**Last Updated:** January 7, 2026  
**Next Step:** Fix webhook field name and test!

