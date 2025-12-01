-- ===============================
-- FIX audit_log TABLE
-- ===============================

ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS error_code text;

ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();



-- ===============================
-- FIX api_usage_logs TABLE
-- ===============================

ALTER TABLE api_usage_logs
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();



-- ===============================
-- FIX ai_cost_tracking TABLE
-- ===============================

ALTER TABLE ai_cost_tracking
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();



-- ===============================
-- FIX system_events TABLE
-- ===============================

ALTER TABLE system_events
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();



