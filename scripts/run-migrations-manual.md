# Manual Migration Instructions

If the automated script doesn't work, you can run the migrations manually in the Supabase dashboard.

## Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com/project/bnxvfxtpsxgfpltflyrr/sql
2. Click "New Query"

## Step 2: Run Migration 1 - Free Policy Reviews Table

Copy and paste this entire SQL block:

```sql
-- =====================================================
-- FREE POLICY REVIEWS TRACKING
-- Track usage for 1-per-email limit on landing page
-- =====================================================

CREATE TABLE IF NOT EXISTS public.free_policy_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    client_ip TEXT,
    policy_type TEXT,
    jurisdiction TEXT,
    analysis_result JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for fast lookups (1-per-email check)
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_email ON public.free_policy_reviews(email);

-- Create index on client_ip + created_at for rate limiting
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_ip_time ON public.free_policy_reviews(client_ip, created_at);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_created_at ON public.free_policy_reviews(created_at);

-- Add comment
COMMENT ON TABLE public.free_policy_reviews IS 'Tracks free policy review usage for landing page lead magnet (1 per email limit)';
```

Click "Run" and verify you see: "Success. No rows returned"

## Step 3: Run Migration 2 - Abuse Detection Log

Copy and paste this entire SQL block:

```sql
-- =====================================================
-- ABUSE DETECTION LOG
-- Track suspicious activity and security events
-- =====================================================

CREATE TABLE IF NOT EXISTS public.abuse_detection_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    client_ip TEXT,
    email TEXT,
    user_agent TEXT,
    recaptcha_score NUMERIC(3,2),
    request_count INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_abuse_log_event_type ON public.abuse_detection_log(event_type);
CREATE INDEX IF NOT EXISTS idx_abuse_log_severity ON public.abuse_detection_log(severity);
CREATE INDEX IF NOT EXISTS idx_abuse_log_ip ON public.abuse_detection_log(client_ip);
CREATE INDEX IF NOT EXISTS idx_abuse_log_email ON public.abuse_detection_log(email);
CREATE INDEX IF NOT EXISTS idx_abuse_log_created_at ON public.abuse_detection_log(created_at);

-- Create composite index for IP + time queries
CREATE INDEX IF NOT EXISTS idx_abuse_log_ip_time ON public.abuse_detection_log(client_ip, created_at);

-- Add comment
COMMENT ON TABLE public.abuse_detection_log IS 'Tracks suspicious activity and security events for abuse detection and monitoring';
```

Click "Run" and verify you see: "Success. No rows returned"

## Step 4: Verify Tables Created

Run this query to verify both tables exist:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('free_policy_reviews', 'abuse_detection_log')
ORDER BY table_name;
```

You should see:
```
table_name              | column_count
------------------------+-------------
abuse_detection_log     | 9
free_policy_reviews     | 7
```

## Step 5: Test Tables

Run these test queries:

```sql
-- Test free_policy_reviews table
SELECT COUNT(*) as total_reviews FROM free_policy_reviews;

-- Test abuse_detection_log table
SELECT COUNT(*) as total_abuse_events FROM abuse_detection_log;
```

Both should return 0 (empty tables, which is correct for new installation).

## ✅ Done!

Your database is now ready for the free policy review system.

## Troubleshooting

### Error: "relation already exists"
This is fine - it means the table was already created. You can ignore this error.

### Error: "permission denied"
Make sure you're using the service role key, not the anon key.

### Error: "syntax error"
Make sure you copied the entire SQL block, including all semicolons.

### Still Having Issues?
1. Check Supabase logs: https://app.supabase.com/project/bnxvfxtpsxgfpltflyrr/logs
2. Verify your project is active
3. Try running migrations one statement at a time
