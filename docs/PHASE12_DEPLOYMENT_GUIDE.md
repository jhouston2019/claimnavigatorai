# Phase 12 Deployment Guide
## AI Console Database Setup & Access Validation

**Date:** 2025-01-28  
**Status:** Ready for Deployment

---

## Overview

This guide walks through deploying the AI Console database migrations and setting up initial admin access.

---

## Step 1: Run Database Migrations

### Option A: Via Supabase Dashboard

1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/phase12_ai_console.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click **Run** to execute

### Option B: Via Supabase CLI

```bash
# If using Supabase CLI
supabase db push
```

### Option C: Manual Execution

Execute the SQL from `phase12_ai_console.sql` in your Supabase SQL editor.

---

## Step 2: Create Initial Admin User

### Find Your User UUID

1. In Supabase dashboard, go to **Authentication > Users**
2. Find your user account
3. Copy the **UUID** (not the email)

### Update Seeder File

1. Open `supabase/migrations/phase12_admin_seed.sql`
2. Replace `YOUR_SUPABASE_USER_UUID` with your actual UUID
3. Replace `YOUR_EMAIL` with your actual email address

### Run Seeder

1. In Supabase SQL Editor, paste the updated SQL
2. Click **Run**

**Example:**
```sql
INSERT INTO ai_admins (user_id, email, role)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',  -- Your actual UUID
  'admin@example.com',                       -- Your actual email
  'superadmin'
)
ON CONFLICT (user_id) DO NOTHING;
```

---

## Step 3: Verify Database Setup

Run this query in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ai_%'
ORDER BY table_name;
```

You should see:
- `ai_admins`
- `ai_change_log`
- `ai_example_versions`
- `ai_output_format_versions`
- `ai_prompt_versions`
- `ai_ruleset_versions`

---

## Step 4: Verify Admin Access

### Check Admin User

```sql
SELECT id, email, role, created_at 
FROM ai_admins;
```

You should see your user listed with `role = 'superadmin'`.

### Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'ai_%';
```

All tables should show `rowsecurity = true`.

---

## Step 5: Test AI Console Access

### Via Browser

1. Navigate to: `https://your-domain.netlify.app/app/admin/ai-console/index.html`
2. You should see the AI Console dashboard
3. If you see "Access Denied", check:
   - Your user UUID matches in `ai_admins` table
   - Your role is `'superadmin'`
   - You're logged in with the correct Supabase account

### Via API

Use the test script:

```bash
# Set environment variables
export NETLIFY_SITE_URL="https://your-site.netlify.app"
export SUPABASE_AUTH_TOKEN="your-auth-token"

# Run test
bash scripts/ai-console-test.sh
```

---

## Step 6: Troubleshooting

### Issue: "Access Denied" Error

**Check:**
1. User exists in `ai_admins` table:
   ```sql
   SELECT * FROM ai_admins WHERE email = 'your-email@example.com';
   ```

2. User UUID matches:
   ```sql
   -- Get your current user UUID
   SELECT auth.uid();
   
   -- Check if it matches admin table
   SELECT * FROM ai_admins WHERE user_id = auth.uid();
   ```

3. Role is correct:
   ```sql
   SELECT role FROM ai_admins WHERE user_id = auth.uid();
   -- Should return 'superadmin', 'admin', or 'editor'
   ```

### Issue: Tables Not Found

**Solution:**
- Re-run `phase12_ai_console.sql` migration
- Check for SQL errors in Supabase dashboard
- Verify you're in the correct database

### Issue: RLS Blocking Access

**Solution:**
- Verify RLS policies are created:
  ```sql
  SELECT * FROM pg_policies WHERE tablename LIKE 'ai_%';
  ```
- If policies are missing, re-run the migration

### Issue: API Returns 401/403

**Check:**
1. Auth token is valid and not expired
2. Token belongs to a user in `ai_admins` table
3. User role allows the operation

---

## Step 7: Add Additional Admins

Once you have superadmin access, you can add more admins:

### Via SQL

```sql
-- Add an admin (requires superadmin role)
INSERT INTO ai_admins (user_id, email, role)
VALUES (
  'user-uuid-here',
  'admin@example.com',
  'admin'  -- or 'editor' for limited access
)
ON CONFLICT (user_id) DO NOTHING;
```

### Via Supabase Dashboard

1. Go to **Table Editor > ai_admins**
2. Click **Insert > Insert row**
3. Fill in:
   - `user_id`: UUID from auth.users
   - `email`: User's email
   - `role`: 'admin' or 'editor'
4. Save

---

## Step 8: Verify Full Functionality

### Test Prompts Management

1. Go to `/app/admin/ai-console/prompts.html`
2. Select a tool from dropdown
3. Edit the prompt
4. Click "Save & Version"
5. Verify version increments

### Test Rulesets

1. Go to `/app/admin/ai-console/rules.html`
2. Select or create a ruleset
3. Edit JSON
4. Save and verify versioning

### Test Version History

1. Go to `/app/admin/ai-console/versions.html`
2. Select a tool/type
3. View version history
4. Test rollback functionality

### Test Audit Log

```sql
SELECT * FROM ai_change_log 
ORDER BY timestamp DESC 
LIMIT 10;
```

You should see entries for any saves/rollbacks you performed.

---

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] RLS policies are correctly configured
- [ ] Only admins can access version tables
- [ ] Only superadmins can manage admin users
- [ ] Audit log captures all changes
- [ ] User UUIDs are correctly mapped

---

## Next Steps

After successful deployment:

1. **Populate Initial Versions**: Load existing configs into version tables
2. **Test Rollback**: Verify rollback functionality works
3. **Monitor Audit Log**: Check that changes are being logged
4. **Add Team Admins**: Add additional admin users as needed

---

## Support

If you encounter issues:

1. Check Supabase logs for SQL errors
2. Verify RLS policies are active
3. Confirm user UUID matches in `ai_admins`
4. Review `ai_change_log` for recent activity
5. Test with the provided test script

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-01-28


