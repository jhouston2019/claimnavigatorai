-- State Authority Views Logging Schema
-- This migration creates the state_views table for tracking page views and user engagement

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- State views logging table
CREATE TABLE IF NOT EXISTS state_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT,
  claim_type TEXT,
  user_id TEXT,
  page_url TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_state_views_state ON state_views(state);
CREATE INDEX IF NOT EXISTS idx_state_views_claim_type ON state_views(claim_type);
CREATE INDEX IF NOT EXISTS idx_state_views_user_id ON state_views(user_id);
CREATE INDEX IF NOT EXISTS idx_state_views_viewed_at ON state_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_state_views_state_claim ON state_views(state, claim_type);

-- Add comments
COMMENT ON TABLE state_views IS 'Tracks user views of state authority guides and pillar pages';
COMMENT ON COLUMN state_views.state IS 'State abbreviation or name';
COMMENT ON COLUMN state_views.claim_type IS 'Type of claim guide viewed (fire, water, wind, etc.)';
COMMENT ON COLUMN state_views.page_url IS 'URL of the page viewed';


