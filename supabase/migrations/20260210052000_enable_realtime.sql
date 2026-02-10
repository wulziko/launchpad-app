-- ============================================================
-- ENABLE REALTIME FOR PHASE 1 TABLES
-- Required for live progress updates in LaunchPad UI
-- ============================================================

-- Enable realtime replication for automation_runs
-- This allows the frontend to receive updates when automation status changes
ALTER TABLE automation_runs REPLICA IDENTITY FULL;

-- Enable realtime replication for assets
-- This allows the frontend to receive updates when new banners are uploaded
ALTER TABLE assets REPLICA IDENTITY FULL;

-- Add tables to the realtime publication (IF NOT ALREADY ADDED)
-- This ensures Supabase realtime server publishes changes to subscribed clients

-- Check if automation_runs is already in publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'automation_runs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE automation_runs;
  END IF;
END $$;

-- Check if assets is already in publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'assets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assets;
  END IF;
END $$;

-- Verify realtime is enabled
-- (This is just for documentation - the migration will succeed either way)
COMMENT ON TABLE automation_runs IS 'Realtime enabled for live progress tracking';
COMMENT ON TABLE assets IS 'Realtime enabled for live asset uploads';
