-- LaunchPad Workflow Orchestrator Trigger (Simplified)
-- Run this in Supabase SQL Editor

-- Enable HTTP extension (required for calling edge functions)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_workflow_orchestrator()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://rxtcssesqwooggydfkvs.supabase.co/functions/v1/workflow-orchestrator';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4';
  payload JSONB;
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

  -- Call edge function
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'workflow_orchestrator trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS products_workflow_trigger ON products;

-- Create trigger on products table
CREATE TRIGGER products_workflow_trigger
  AFTER INSERT OR UPDATE OF status ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_workflow_orchestrator();

-- Done! Test by creating a product in LaunchPad
