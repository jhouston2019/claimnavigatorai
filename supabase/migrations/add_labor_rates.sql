-- ============================================================================
-- LABOR RATES TABLE
-- Stores regional labor rates for validation
-- ============================================================================

CREATE TABLE IF NOT EXISTS labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL,
  region TEXT NOT NULL,
  min_rate NUMERIC NOT NULL,
  avg_rate NUMERIC NOT NULL,
  max_rate NUMERIC NOT NULL,
  unit TEXT DEFAULT 'per hour',
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  metadata JSONB,
  CONSTRAINT labor_rates_unique UNIQUE (trade, region, effective_date)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_labor_trade_region ON labor_rates(trade, region);
CREATE INDEX IF NOT EXISTS idx_labor_effective_date ON labor_rates(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_labor_region ON labor_rates(region);
CREATE INDEX IF NOT EXISTS idx_labor_trade ON labor_rates(trade);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read labor rates
CREATE POLICY "Allow authenticated users to read labor rates"
  ON labor_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Only service role can modify labor rates"
  ON labor_rates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SEED DATA - CALIFORNIA
-- ============================================================================

INSERT INTO labor_rates (trade, region, min_rate, avg_rate, max_rate, effective_date, source) VALUES
  -- San Francisco
  ('General Contractor', 'CA-San Francisco', 85, 110, 145, '2026-01-01', 'market_data'),
  ('Carpenter', 'CA-San Francisco', 75, 95, 125, '2026-01-01', 'market_data'),
  ('Electrician', 'CA-San Francisco', 85, 110, 140, '2026-01-01', 'market_data'),
  ('Plumber', 'CA-San Francisco', 80, 105, 135, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'CA-San Francisco', 75, 95, 125, '2026-01-01', 'market_data'),
  ('Painter', 'CA-San Francisco', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'CA-San Francisco', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'CA-San Francisco', 55, 75, 100, '2026-01-01', 'market_data'),
  ('Roofer', 'CA-San Francisco', 65, 85, 110, '2026-01-01', 'market_data'),
  
  -- Los Angeles
  ('General Contractor', 'CA-Los Angeles', 80, 105, 140, '2026-01-01', 'market_data'),
  ('Carpenter', 'CA-Los Angeles', 70, 90, 120, '2026-01-01', 'market_data'),
  ('Electrician', 'CA-Los Angeles', 80, 105, 135, '2026-01-01', 'market_data'),
  ('Plumber', 'CA-Los Angeles', 75, 100, 130, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'CA-Los Angeles', 70, 90, 120, '2026-01-01', 'market_data'),
  ('Painter', 'CA-Los Angeles', 50, 70, 90, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'CA-Los Angeles', 55, 75, 100, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'CA-Los Angeles', 50, 70, 95, '2026-01-01', 'market_data'),
  ('Roofer', 'CA-Los Angeles', 60, 80, 105, '2026-01-01', 'market_data'),
  
  -- San Diego
  ('General Contractor', 'CA-San Diego', 75, 100, 130, '2026-01-01', 'market_data'),
  ('Carpenter', 'CA-San Diego', 65, 85, 115, '2026-01-01', 'market_data'),
  ('Electrician', 'CA-San Diego', 75, 100, 130, '2026-01-01', 'market_data'),
  ('Plumber', 'CA-San Diego', 70, 95, 125, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'CA-San Diego', 65, 85, 115, '2026-01-01', 'market_data'),
  ('Painter', 'CA-San Diego', 48, 65, 85, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'CA-San Diego', 52, 70, 95, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'CA-San Diego', 48, 65, 90, '2026-01-01', 'market_data'),
  ('Roofer', 'CA-San Diego', 58, 75, 100, '2026-01-01', 'market_data')
ON CONFLICT (trade, region, effective_date) DO NOTHING;

-- ============================================================================
-- SEED DATA - TEXAS
-- ============================================================================

INSERT INTO labor_rates (trade, region, min_rate, avg_rate, max_rate, effective_date, source) VALUES
  -- Houston
  ('General Contractor', 'TX-Houston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Carpenter', 'TX-Houston', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Electrician', 'TX-Houston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Plumber', 'TX-Houston', 50, 70, 90, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'TX-Houston', 50, 65, 85, '2026-01-01', 'market_data'),
  ('Painter', 'TX-Houston', 35, 50, 65, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'TX-Houston', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'TX-Houston', 35, 50, 70, '2026-01-01', 'market_data'),
  ('Roofer', 'TX-Houston', 45, 60, 80, '2026-01-01', 'market_data'),
  
  -- Dallas
  ('General Contractor', 'TX-Dallas', 58, 78, 98, '2026-01-01', 'market_data'),
  ('Carpenter', 'TX-Dallas', 48, 68, 88, '2026-01-01', 'market_data'),
  ('Electrician', 'TX-Dallas', 58, 78, 98, '2026-01-01', 'market_data'),
  ('Plumber', 'TX-Dallas', 52, 72, 92, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'TX-Dallas', 52, 68, 88, '2026-01-01', 'market_data'),
  ('Painter', 'TX-Dallas', 38, 52, 68, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'TX-Dallas', 42, 58, 72, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'TX-Dallas', 38, 52, 72, '2026-01-01', 'market_data'),
  ('Roofer', 'TX-Dallas', 48, 62, 82, '2026-01-01', 'market_data'),
  
  -- Austin
  ('General Contractor', 'TX-Austin', 60, 80, 100, '2026-01-01', 'market_data'),
  ('Carpenter', 'TX-Austin', 50, 70, 90, '2026-01-01', 'market_data'),
  ('Electrician', 'TX-Austin', 60, 80, 100, '2026-01-01', 'market_data'),
  ('Plumber', 'TX-Austin', 55, 75, 95, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'TX-Austin', 55, 70, 90, '2026-01-01', 'market_data'),
  ('Painter', 'TX-Austin', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'TX-Austin', 45, 60, 75, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'TX-Austin', 40, 55, 75, '2026-01-01', 'market_data'),
  ('Roofer', 'TX-Austin', 50, 65, 85, '2026-01-01', 'market_data')
ON CONFLICT (trade, region, effective_date) DO NOTHING;

-- ============================================================================
-- SEED DATA - OTHER MAJOR MARKETS
-- ============================================================================

INSERT INTO labor_rates (trade, region, min_rate, avg_rate, max_rate, effective_date, source) VALUES
  -- New York City
  ('General Contractor', 'NY-New York City', 90, 115, 150, '2026-01-01', 'market_data'),
  ('Carpenter', 'NY-New York City', 80, 100, 130, '2026-01-01', 'market_data'),
  ('Electrician', 'NY-New York City', 90, 115, 145, '2026-01-01', 'market_data'),
  ('Plumber', 'NY-New York City', 85, 110, 140, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'NY-New York City', 80, 100, 130, '2026-01-01', 'market_data'),
  ('Painter', 'NY-New York City', 60, 80, 100, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'NY-New York City', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'NY-New York City', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Roofer', 'NY-New York City', 70, 90, 115, '2026-01-01', 'market_data'),
  
  -- Chicago
  ('General Contractor', 'IL-Chicago', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Carpenter', 'IL-Chicago', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Electrician', 'IL-Chicago', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Plumber', 'IL-Chicago', 60, 80, 105, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'IL-Chicago', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Painter', 'IL-Chicago', 40, 60, 75, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'IL-Chicago', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'IL-Chicago', 40, 60, 80, '2026-01-01', 'market_data'),
  ('Roofer', 'IL-Chicago', 50, 70, 90, '2026-01-01', 'market_data'),
  
  -- Miami
  ('General Contractor', 'FL-Miami', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Carpenter', 'FL-Miami', 50, 70, 90, '2026-01-01', 'market_data'),
  ('Electrician', 'FL-Miami', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Plumber', 'FL-Miami', 55, 75, 100, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'FL-Miami', 55, 70, 90, '2026-01-01', 'market_data'),
  ('Painter', 'FL-Miami', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'FL-Miami', 45, 60, 75, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'FL-Miami', 40, 55, 75, '2026-01-01', 'market_data'),
  ('Roofer', 'FL-Miami', 50, 65, 85, '2026-01-01', 'market_data'),
  
  -- Seattle
  ('General Contractor', 'WA-Seattle', 75, 100, 130, '2026-01-01', 'market_data'),
  ('Carpenter', 'WA-Seattle', 65, 85, 115, '2026-01-01', 'market_data'),
  ('Electrician', 'WA-Seattle', 75, 100, 130, '2026-01-01', 'market_data'),
  ('Plumber', 'WA-Seattle', 70, 95, 125, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'WA-Seattle', 65, 85, 115, '2026-01-01', 'market_data'),
  ('Painter', 'WA-Seattle', 50, 70, 90, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'WA-Seattle', 55, 75, 100, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'WA-Seattle', 50, 70, 95, '2026-01-01', 'market_data'),
  ('Roofer', 'WA-Seattle', 60, 80, 105, '2026-01-01', 'market_data'),
  
  -- Denver
  ('General Contractor', 'CO-Denver', 62, 82, 107, '2026-01-01', 'market_data'),
  ('Carpenter', 'CO-Denver', 52, 72, 92, '2026-01-01', 'market_data'),
  ('Electrician', 'CO-Denver', 62, 82, 107, '2026-01-01', 'market_data'),
  ('Plumber', 'CO-Denver', 58, 78, 103, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'CO-Denver', 55, 72, 92, '2026-01-01', 'market_data'),
  ('Painter', 'CO-Denver', 42, 58, 73, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'CO-Denver', 48, 63, 83, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'CO-Denver', 42, 58, 78, '2026-01-01', 'market_data'),
  ('Roofer', 'CO-Denver', 52, 68, 88, '2026-01-01', 'market_data'),
  
  -- Phoenix
  ('General Contractor', 'AZ-Phoenix', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Carpenter', 'AZ-Phoenix', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Electrician', 'AZ-Phoenix', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Plumber', 'AZ-Phoenix', 50, 70, 90, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'AZ-Phoenix', 50, 65, 85, '2026-01-01', 'market_data'),
  ('Painter', 'AZ-Phoenix', 35, 50, 65, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'AZ-Phoenix', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'AZ-Phoenix', 35, 50, 70, '2026-01-01', 'market_data'),
  ('Roofer', 'AZ-Phoenix', 45, 60, 80, '2026-01-01', 'market_data'),
  
  -- Atlanta
  ('General Contractor', 'GA-Atlanta', 58, 78, 100, '2026-01-01', 'market_data'),
  ('Carpenter', 'GA-Atlanta', 48, 68, 88, '2026-01-01', 'market_data'),
  ('Electrician', 'GA-Atlanta', 58, 78, 100, '2026-01-01', 'market_data'),
  ('Plumber', 'GA-Atlanta', 52, 72, 95, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'GA-Atlanta', 52, 68, 88, '2026-01-01', 'market_data'),
  ('Painter', 'GA-Atlanta', 38, 53, 68, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'GA-Atlanta', 42, 58, 73, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'GA-Atlanta', 38, 53, 73, '2026-01-01', 'market_data'),
  ('Roofer', 'GA-Atlanta', 48, 63, 83, '2026-01-01', 'market_data'),
  
  -- Boston
  ('General Contractor', 'MA-Boston', 80, 105, 135, '2026-01-01', 'market_data'),
  ('Carpenter', 'MA-Boston', 70, 90, 120, '2026-01-01', 'market_data'),
  ('Electrician', 'MA-Boston', 80, 105, 135, '2026-01-01', 'market_data'),
  ('Plumber', 'MA-Boston', 75, 100, 130, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'MA-Boston', 70, 90, 120, '2026-01-01', 'market_data'),
  ('Painter', 'MA-Boston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'MA-Boston', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'MA-Boston', 55, 75, 100, '2026-01-01', 'market_data'),
  ('Roofer', 'MA-Boston', 65, 85, 110, '2026-01-01', 'market_data'),
  
  -- Portland
  ('General Contractor', 'OR-Portland', 68, 90, 118, '2026-01-01', 'market_data'),
  ('Carpenter', 'OR-Portland', 58, 78, 103, '2026-01-01', 'market_data'),
  ('Electrician', 'OR-Portland', 68, 90, 118, '2026-01-01', 'market_data'),
  ('Plumber', 'OR-Portland', 63, 85, 113, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'OR-Portland', 60, 78, 103, '2026-01-01', 'market_data'),
  ('Painter', 'OR-Portland', 45, 63, 83, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'OR-Portland', 50, 68, 90, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'OR-Portland', 45, 63, 88, '2026-01-01', 'market_data'),
  ('Roofer', 'OR-Portland', 55, 73, 95, '2026-01-01', 'market_data'),
  
  -- Charlotte
  ('General Contractor', 'NC-Charlotte', 54, 72, 92, '2026-01-01', 'market_data'),
  ('Carpenter', 'NC-Charlotte', 44, 62, 80, '2026-01-01', 'market_data'),
  ('Electrician', 'NC-Charlotte', 54, 72, 92, '2026-01-01', 'market_data'),
  ('Plumber', 'NC-Charlotte', 48, 67, 87, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'NC-Charlotte', 48, 62, 80, '2026-01-01', 'market_data'),
  ('Painter', 'NC-Charlotte', 34, 48, 62, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'NC-Charlotte', 38, 53, 67, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'NC-Charlotte', 34, 48, 67, '2026-01-01', 'market_data'),
  ('Roofer', 'NC-Charlotte', 44, 58, 77, '2026-01-01', 'market_data'),
  
  -- Nashville
  ('General Contractor', 'TN-Nashville', 52, 70, 88, '2026-01-01', 'market_data'),
  ('Carpenter', 'TN-Nashville', 42, 60, 78, '2026-01-01', 'market_data'),
  ('Electrician', 'TN-Nashville', 52, 70, 88, '2026-01-01', 'market_data'),
  ('Plumber', 'TN-Nashville', 47, 65, 83, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'TN-Nashville', 47, 60, 78, '2026-01-01', 'market_data'),
  ('Painter', 'TN-Nashville', 32, 47, 60, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'TN-Nashville', 37, 50, 65, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'TN-Nashville', 32, 47, 65, '2026-01-01', 'market_data'),
  ('Roofer', 'TN-Nashville', 42, 56, 73, '2026-01-01', 'market_data'),
  
  -- Orlando
  ('General Contractor', 'FL-Orlando', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Carpenter', 'FL-Orlando', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Electrician', 'FL-Orlando', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Plumber', 'FL-Orlando', 50, 70, 90, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'FL-Orlando', 50, 65, 85, '2026-01-01', 'market_data'),
  ('Painter', 'FL-Orlando', 35, 50, 65, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'FL-Orlando', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'FL-Orlando', 35, 50, 70, '2026-01-01', 'market_data'),
  ('Roofer', 'FL-Orlando', 45, 60, 80, '2026-01-01', 'market_data')
ON CONFLICT (trade, region, effective_date) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify data was inserted
-- SELECT region, COUNT(*) as trade_count 
-- FROM labor_rates 
-- GROUP BY region 
-- ORDER BY region;

-- Check specific region
-- SELECT * FROM labor_rates WHERE region = 'CA-San Francisco' ORDER BY trade;
