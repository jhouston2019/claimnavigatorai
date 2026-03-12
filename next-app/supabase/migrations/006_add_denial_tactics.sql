-- Create denial_tactics table for SEO pages targeting insurance denial language
CREATE TABLE public.denial_tactics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tactic_name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  what_it_means TEXT,
  why_insurers_use_it TEXT,
  how_to_challenge TEXT,
  common_claim_types JSONB,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  scan_conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_denial_tactics_slug ON public.denial_tactics(slug);
CREATE INDEX idx_denial_tactics_published ON public.denial_tactics(is_published);
CREATE INDEX idx_denial_tactics_created ON public.denial_tactics(created_at DESC);
CREATE INDEX idx_denial_tactics_views ON public.denial_tactics(view_count DESC);

-- Row Level Security
ALTER TABLE public.denial_tactics ENABLE ROW LEVEL SECURITY;

-- Public can read published tactics
CREATE POLICY "Public can read published denial tactics"
  ON public.denial_tactics
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can read all tactics
CREATE POLICY "Authenticated users can read all denial tactics"
  ON public.denial_tactics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can do everything
CREATE POLICY "Service role can manage denial tactics"
  ON public.denial_tactics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create related_tactics junction table for internal linking
CREATE TABLE public.related_denial_tactics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tactic_id UUID REFERENCES public.denial_tactics(id) ON DELETE CASCADE,
  related_tactic_id UUID REFERENCES public.denial_tactics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tactic_id, related_tactic_id)
);

CREATE INDEX idx_related_denial_tactics_tactic ON public.related_denial_tactics(tactic_id);
CREATE INDEX idx_related_denial_tactics_related ON public.related_denial_tactics(related_tactic_id);

ALTER TABLE public.related_denial_tactics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read related denial tactics"
  ON public.related_denial_tactics
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_denial_tactics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_denial_tactics_updated_at
  BEFORE UPDATE ON public.denial_tactics
  FOR EACH ROW
  EXECUTE FUNCTION update_denial_tactics_updated_at();

-- Comments
COMMENT ON TABLE public.denial_tactics IS 'SEO pages for insurance denial tactics';
COMMENT ON COLUMN public.denial_tactics.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN public.denial_tactics.tactic_name IS 'Display name of the denial tactic';
COMMENT ON COLUMN public.denial_tactics.what_it_means IS 'Explanation of the insurer argument';
COMMENT ON COLUMN public.denial_tactics.why_insurers_use_it IS 'Why adjusters use this tactic';
COMMENT ON COLUMN public.denial_tactics.how_to_challenge IS 'Documentation required to challenge';
COMMENT ON COLUMN public.denial_tactics.common_claim_types IS 'Array of claim types where this appears';
