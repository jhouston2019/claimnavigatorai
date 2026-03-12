-- Add estimate scans table for free Quick Scan tool
CREATE TABLE public.estimate_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  scan_result JSONB NOT NULL,
  converted_to_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_estimate_scans_email ON public.estimate_scans(email);
CREATE INDEX idx_estimate_scans_created_at ON public.estimate_scans(created_at);
CREATE INDEX idx_estimate_scans_converted ON public.estimate_scans(converted_to_paid);

-- Track conversion from scan to paid
CREATE TABLE public.scan_conversions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scan_id UUID REFERENCES public.estimate_scans(id),
  user_id UUID REFERENCES public.profiles(id),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_scan_conversions_scan_id ON public.scan_conversions(scan_id);
CREATE INDEX idx_scan_conversions_user_id ON public.scan_conversions(user_id);
