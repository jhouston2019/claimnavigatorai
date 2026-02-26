-- =====================================================
-- ABUSE DETECTION LOG
-- Track suspicious activity and security events
-- =====================================================

CREATE TABLE IF NOT EXISTS public.abuse_detection_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'rate_limit', 'recaptcha_fail', 'disposable_email', 'ip_cluster', 'budget_exceeded'
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
