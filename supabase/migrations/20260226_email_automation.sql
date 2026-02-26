-- =====================================================
-- EMAIL AUTOMATION SYSTEM
-- Queue and logging for automated email sequences
-- =====================================================

-- Email Queue Table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'results', 'education', 'case_study', 'urgency'
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    data JSONB, -- Analysis data for email personalization
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Log Table
CREATE TABLE IF NOT EXISTS public.email_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'clicked')),
    provider TEXT, -- 'sendgrid', 'mailgun', 'resend'
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    metadata JSONB
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_email ON public.email_queue(email);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON public.email_queue(status, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_log_email ON public.email_log(email);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON public.email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON public.email_log(sent_at);

-- Add comments
COMMENT ON TABLE public.email_queue IS 'Queue for scheduled automated emails in nurture sequence';
COMMENT ON TABLE public.email_log IS 'Log of all emails sent, including delivery and engagement metrics';
