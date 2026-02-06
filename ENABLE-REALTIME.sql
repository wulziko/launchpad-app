-- ========================================
-- LaunchPad Real-Time Enable Script
-- ========================================
-- Run this in Supabase SQL Editor to enable real-time updates
-- Dashboard: https://supabase.com/dashboard/project/rxtcssesqwooggydfkvs/sql/new

-- Enable real-time for products table
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Enable real-time for assets table  
ALTER PUBLICATION supabase_realtime ADD TABLE assets;

-- Verify it worked
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('products', 'assets');

-- Should return 2 rows (one for products, one for assets)
-- If you see them, real-time is enabled! ✅
