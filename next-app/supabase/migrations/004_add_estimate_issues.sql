-- Create estimate_issues table for programmatic SEO
CREATE TABLE public.estimate_issues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  issue_name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  why_it_happens TEXT,
  cost_impact TEXT,
  detection_method TEXT,
  repair_example TEXT,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  scan_conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Related issues junction table
CREATE TABLE public.related_issues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  issue_id UUID REFERENCES public.estimate_issues(id) ON DELETE CASCADE,
  related_issue_id UUID REFERENCES public.estimate_issues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(issue_id, related_issue_id)
);

-- Row Level Security (public read for published)
ALTER TABLE public.estimate_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published issues" 
  ON public.estimate_issues 
  FOR SELECT 
  USING (is_published = TRUE);

CREATE POLICY "Service role can manage issues"
  ON public.estimate_issues
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_estimate_issues_slug ON public.estimate_issues(slug);
CREATE INDEX idx_estimate_issues_published ON public.estimate_issues(is_published);
CREATE INDEX idx_estimate_issues_view_count ON public.estimate_issues(view_count DESC);
CREATE INDEX idx_related_issues_issue_id ON public.related_issues(issue_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estimate_issues_updated_at
  BEFORE UPDATE ON public.estimate_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
