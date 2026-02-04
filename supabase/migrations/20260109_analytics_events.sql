-- Analytics Events Table
-- Stores all user interaction and conversion events

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_properties JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_claim_id ON analytics_events(claim_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- Composite index for user event history
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON analytics_events(user_id, created_at DESC);

-- Composite index for claim event history
CREATE INDEX IF NOT EXISTS idx_analytics_claim_created ON analytics_events(claim_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to analytics_events"
  ON analytics_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own analytics
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Comment
COMMENT ON TABLE analytics_events IS 'Stores all user interaction and conversion tracking events';
COMMENT ON COLUMN analytics_events.event_name IS 'Name of the event (e.g., checkout_initiated, step_completed)';
COMMENT ON COLUMN analytics_events.event_properties IS 'JSON object containing all event properties and metadata';
COMMENT ON COLUMN analytics_events.user_id IS 'Reference to the user who triggered the event (nullable for anonymous events)';
COMMENT ON COLUMN analytics_events.claim_id IS 'Reference to the claim associated with the event (nullable)';


