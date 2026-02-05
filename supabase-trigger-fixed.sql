-- LaunchPad Workflow Orchestrator Trigger (FIXED VERSION)
-- This version uses supabase_functions.http_request instead of net.http_post

-- Drop old trigger and function if they exist
DROP TRIGGER IF EXISTS products_workflow_trigger ON products;
DROP FUNCTION IF EXISTS trigger_workflow_orchestrator();

-- Create trigger function using supabase_functions
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

  -- Call edge function using supabase_functions schema
  -- This is async and won't block the transaction
  BEGIN
    SELECT supabase_functions.http_request(
      url := webhook_url,
      method := 'POST',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := payload::text
    ) INTO request_id;
    
    RAISE LOG 'Workflow orchestrator called successfully: request_id=%', request_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'workflow_orchestrator trigger failed: % %', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on products table
CREATE TRIGGER products_workflow_trigger
  AFTER INSERT OR UPDATE OF status ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_workflow_orchestrator();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;

-- Done!
SELECT 'Trigger created successfully!' AS result;
