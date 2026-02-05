-- LaunchPad Workflow Orchestrator Trigger (CORRECT VERSION)
-- Uses pg_net extension which is available in Supabase

-- Enable pg_net extension (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop old trigger and function if they exist
DROP TRIGGER IF EXISTS products_workflow_trigger ON products;
DROP FUNCTION IF EXISTS trigger_workflow_orchestrator();

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_workflow_orchestrator()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://rxtcssesqwooggydfkvs.supabase.co/functions/v1/workflow-orchestrator';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4';
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Build payload
  IF (TG_OP = 'UPDATE') THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
  ELSE
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    );
  END IF;

  -- Call edge function using pg_net (correct schema name)
  BEGIN
    SELECT extensions.pg_net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      )::jsonb,
      body := payload::jsonb
    ) INTO request_id;
    
    RAISE LOG 'Workflow orchestrator called: request_id=%', request_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'workflow_orchestrator trigger failed: % (State: %)', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on products table
CREATE TRIGGER products_workflow_trigger
  AFTER INSERT OR UPDATE OF status ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_workflow_orchestrator();

-- Test the trigger function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'products_workflow_trigger'
  ) THEN
    RAISE NOTICE 'SUCCESS: Trigger created and active!';
  ELSE
    RAISE WARNING 'FAILED: Trigger was not created!';
  END IF;
END $$;
