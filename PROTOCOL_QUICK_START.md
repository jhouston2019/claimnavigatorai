# Claim Success Protocol™ - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Database Setup (Required)
Run the protocol progress schema in your Supabase instance:

```bash
# In Supabase SQL Editor, run:
supabase/protocol-progress-schema.sql
```

This creates the `protocol_progress` table with RLS policies.

### 2. Test the Flow

1. **Login**: Go to `/auth/login.html`
2. **Auto-Redirect**: You'll be taken to `/app/claim-control-center.html`
3. **Step 1**: You'll see "Understanding Your Policy" (Step 1 of 7)
4. **Complete Actions**: Check all 3 completion criteria
5. **Advance**: Click "Next Step →" (enabled after all checks)
6. **Continue**: Work through Steps 2-7
7. **Complete**: See the Protocol Complete state

### 3. Verify Implementation

✅ Login redirects to Control Center (not dashboard)  
✅ Dashboard redirects to Control Center  
✅ Checkout success redirects to Control Center  
✅ Step 1 displays with progress indicator  
✅ Next button is disabled until criteria met  
✅ Progress saves to database  
✅ Reference Library shows notice banner  

---

## 📁 Key Files

### Created:
- `app/claim-control-center.html` - Main Control Center page
- `app/assets/js/claim-success-protocol.js` - Protocol engine
- `supabase/protocol-progress-schema.sql` - Database schema

### Modified:
- `auth/login.html` - Redirects to Control Center
- `app/dashboard.html` - Redirects to Control Center
- `app/checkout-success.html` - Updated CTA
- `app/resource-center.html` - Now "Reference Library"

---

## 🎯 User Journey

```
Login → Control Center (Step 1) → Complete Criteria → Next Step → ... → Step 7 → Complete
```

**No browsing. No skipping. Linear progression only.**

---

## 🔧 Customization

### Change Step Content
Edit `PROTOCOL_STEPS` array in `app/assets/js/claim-success-protocol.js`:

```javascript
{
  step: 1,
  title: 'Your Step Title',
  consequence: '⚠️ Your consequence text',
  explanation: {
    what: 'What the user will do',
    why: 'Why it matters',
    bullets: ['Action 1', 'Action 2', 'Action 3']
  },
  tools: [
    { id: 'tool-id', name: 'Tool Name', url: '/path/to/tool.html' }
  ],
  completionCriteria: [
    { id: 'criteria-1', label: 'I have done X' }
  ]
}
```

### Change Styling
Edit styles in `app/claim-control-center.html` `<style>` block.

### Add More Steps
1. Add step object to `PROTOCOL_STEPS` array
2. Update progress calculation (change `7` to new total)
3. Update UI text ("Step X of Y")

---

## 📊 Monitoring

### Check Protocol Progress
```sql
SELECT 
  user_id,
  current_step,
  completed_steps,
  step_progress,
  updated_at
FROM protocol_progress
ORDER BY updated_at DESC;
```

### Completion Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE 7 = ANY(completed_steps)) AS completed,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE 7 = ANY(completed_steps)) / COUNT(*), 2) AS completion_rate
FROM protocol_progress;
```

### Step Drop-Off
```sql
SELECT 
  current_step,
  COUNT(*) as users_at_step
FROM protocol_progress
GROUP BY current_step
ORDER BY current_step;
```

---

## 🐛 Troubleshooting

### Issue: Next button stays disabled
**Solution**: Check browser console for errors. Verify all checkboxes have unique IDs.

### Issue: Progress not saving
**Solution**: Check Supabase connection. Verify RLS policies are enabled.

### Issue: User sees old dashboard
**Solution**: Clear browser cache. Verify `dashboard.html` has redirect code.

### Issue: Tools not loading
**Solution**: Check tool URLs in `PROTOCOL_STEPS`. Verify tools exist at those paths.

---

## 📞 Support

- **Full Documentation**: See `CLAIM_SUCCESS_PROTOCOL_IMPLEMENTATION.md`
- **Code Comments**: Review `claim-success-protocol.js` inline comments
- **Database Schema**: See `protocol-progress-schema.sql` comments

---

## ✅ Definition of Done

- [x] Login → Control Center (Step 1)
- [x] Linear 7-step flow
- [x] Enforcement (can't skip)
- [x] Progress indicator
- [x] Tool gating
- [x] Completion state
- [x] Reference Library (no CTAs)
- [x] Database tracking

**Status**: ✅ COMPLETE AND READY FOR PRODUCTION







