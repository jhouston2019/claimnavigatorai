-- Phase 12: Admin Seeder
-- TEMPORARY FILE - Replace YOUR_SUPABASE_USER_UUID and YOUR_EMAIL before running
-- 
-- To find your user UUID:
-- 1. Log into your Supabase dashboard
-- 2. Go to Authentication > Users
-- 3. Find your user and copy the UUID
-- 4. Replace YOUR_SUPABASE_USER_UUID below
--
-- Replace YOUR_EMAIL with your actual email address

-- Insert initial superadmin user
-- IMPORTANT: Replace the placeholder values before running this migration
INSERT INTO ai_admins (user_id, email, role)
VALUES (
  'YOUR_SUPABASE_USER_UUID',  -- Replace with your actual Supabase user UUID
  'YOUR_EMAIL',                -- Replace with your actual email address
  'superadmin'
)
ON CONFLICT (user_id) DO NOTHING;

-- Note: After running this migration, you can add additional admins via:
-- INSERT INTO ai_admins (user_id, email, role) VALUES (...);
-- Or through the Supabase dashboard SQL editor


