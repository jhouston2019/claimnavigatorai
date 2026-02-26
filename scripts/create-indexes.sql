-- =====================================================
-- CREATE MISSING INDEXES
-- Run this in Supabase SQL Editor if indexes weren't created
-- =====================================================

-- Free Policy Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_email ON public.free_policy_reviews(email);
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_ip_time ON public.free_policy_reviews(client_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_created_at ON public.free_policy_reviews(created_at);

-- Abuse Detection Log Indexes
CREATE INDEX IF NOT EXISTS idx_abuse_log_event_type ON public.abuse_detection_log(event_type);
CREATE INDEX IF NOT EXISTS idx_abuse_log_severity ON public.abuse_detection_log(severity);
CREATE INDEX IF NOT EXISTS idx_abuse_log_ip ON public.abuse_detection_log(client_ip);
CREATE INDEX IF NOT EXISTS idx_abuse_log_email ON public.abuse_detection_log(email);
CREATE INDEX IF NOT EXISTS idx_abuse_log_created_at ON public.abuse_detection_log(created_at);
CREATE INDEX IF NOT EXISTS idx_abuse_log_ip_time ON public.abuse_detection_log(client_ip, created_at);

-- Email Queue Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_email ON public.email_queue(email);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON public.email_queue(status, scheduled_for) WHERE status = 'pending';

-- Email Log Indexes
CREATE INDEX IF NOT EXISTS idx_email_log_email ON public.email_log(email);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON public.email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON public.email_log(sent_at);

-- Verify all indexes created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('free_policy_reviews', 'abuse_detection_log', 'email_queue', 'email_log')
ORDER BY tablename, indexname;
