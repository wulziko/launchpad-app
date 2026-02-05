-- FINAL TRIGGER FIX - Use pg_net (Supabase recommended)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rxtcssesqwooggydfkvs/sql/new

-- Enable pg_net extension (Supabase's async HTTP client)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop broken trigger and function
DROP TRIGGER IF EXISTS products_workflow_trigger ON products;
DROP FUNCTION IF EXISTS trigger_workflow_orchestrator CASCADE;

-- Create trigger function using pg_net
CREATE OR REPLACE FUNCTION trigger_workflow_orchestrator()
RETURNS TRIGGER AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Call edge function using net.http_post (pg_net)
  SELECT net.http_post(
    url := 'https://rxtcssesqwooggydfkvs.supabase.co/functions/v1/workflow-orchestrator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4'
    ),
    body := CASE 
      WHEN TG_OP = 'UPDATE' THEN
        jsonb_build_object(
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', to_jsonb(NEW),
          'old_record', to_jsonb(OLD)
        )
      ELSE
        jsonb_build_object(
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', to_jsonb(NEW)
        )
    END
  ) INTO request_id;

  RAISE LOG 'Workflow orchestrator triggered: request_id=%', request_id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail
  RAISE WARNING 'Workflow trigger failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER products_workflow_trigger
  AFTER INSERT OR UPDATE OF status ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_workflow_orchestrator();

-- Verify trigger was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'products_workflow_trigger'
    AND c.relname = 'products'
  ) THEN
    RAISE NOTICE '✅ SUCCESS! Trigger is now active and will call edge function on product status changes.';
  ELSE
    RAISE EXCEPTION '❌ FAILED! Trigger was not created properly.';
  END IF;
END $$;
