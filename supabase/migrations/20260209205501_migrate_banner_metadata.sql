-- ============================================================
-- MIGRATE BANNER AUTOMATION DATA FROM products.metadata
-- Phase 1: Banners only
-- ============================================================

-- Migrate banner automation state for products that have it
INSERT INTO automation_runs (
  product_id,
  user_id,
  automation_type,
  status,
  progress,
  message,
  n8n_execution_id,
  started_at,
  completed_at,
  stopped_at,
  created_at,
  updated_at
)
SELECT
  p.id AS product_id,
  p.user_id,
  'banner'::automation_type AS automation_type,
  
  -- Map old status values to new ENUM
  CASE 
    WHEN p.metadata->>'automation_status' = 'processing' THEN 'processing'::automation_status
    WHEN p.metadata->>'automation_status' = 'completed' THEN 'completed'::automation_status
    WHEN p.metadata->>'automation_status' = 'error' THEN 'error'::automation_status
    WHEN p.metadata->>'automation_status' = 'stopped' THEN 'stopped'::automation_status
    ELSE 'idle'::automation_status
  END AS status,
  
  -- Extract progress (default 0 if NULL or invalid)
  COALESCE(
    NULLIF((p.metadata->>'automation_progress')::INTEGER, NULL),
    0
  ) AS progress,
  
  -- Extract message
  p.metadata->>'automation_message' AS message,
  
  -- Extract n8n execution ID
  p.metadata->>'n8n_execution_id' AS n8n_execution_id,
  
  -- Extract timestamps
  NULLIF(p.metadata->>'automation_started_at', '')::TIMESTAMP WITH TIME ZONE AS started_at,
  NULLIF(p.metadata->>'automation_completed_at', '')::TIMESTAMP WITH TIME ZONE AS completed_at,
  NULLIF(p.metadata->>'automation_stopped_at', '')::TIMESTAMP WITH TIME ZONE AS stopped_at,
  
  -- Default created_at to product created_at
  p.created_at,
  
  -- Default updated_at to now
  NOW() AS updated_at
FROM products p
WHERE 
  -- Only migrate if banner automation metadata exists
  p.metadata ? 'automation_status'
ON CONFLICT (product_id, automation_type) DO NOTHING;

-- Log migration results
DO $$
DECLARE
  v_migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_migrated_count
  FROM automation_runs
  WHERE automation_type = 'banner';
  
  RAISE NOTICE 'Migrated % banner automation records to automation_runs', v_migrated_count;
END $$;
