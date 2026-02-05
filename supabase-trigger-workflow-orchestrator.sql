-- LaunchPad Workflow Orchestrator Trigger
-- Automatically triggers workflows when product status changes

-- ===========================================
-- CREATE WEBHOOK TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION trigger_workflow_orchestrator()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
BEGIN
  -- Get the edge function URL (update this with your actual URL)
  webhook_url := current_setting('app.settings.workflow_orchestrator_url', TRUE);
  
  -- If not set, use default (update after deploying edge function)
  IF webhook_url IS NULL OR webhook_url = '' THEN
    webhook_url := 'https://rxtcssesqwooggydfkvs.supabase.co/functions/v1/workflow-orchestrator';
  END IF;

  -- Build payload
  IF (TG_OP = 'DELETE') THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(OLD)
    );
  ELSIF (TG_OP = 'UPDATE') THEN
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

  -- Call edge function via HTTP request
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', TRUE)
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- CREATE TRIGGER ON PRODUCTS TABLE
-- ===========================================

DROP TRIGGER IF EXISTS products_workflow_trigger ON products;

CREATE TRIGGER products_workflow_trigger
  AFTER INSERT OR UPDATE OF status ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_workflow_orchestrator();

-- ===========================================
-- GRANT PERMISSIONS
-- ===========================================

-- Ensure http extension is enabled (required for net.http_post)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- ===========================================
-- CONFIGURATION (Run these after deployment)
-- ===========================================

-- Set the edge function URL (update with your actual URL after deploying)
-- ALTER DATABASE postgres SET app.settings.workflow_orchestrator_url = 'https://rxtcssesqwooggydfkvs.supabase.co/functions/v1/workflow-orchestrator';

-- Set the service role key (for authentication)
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';

-- ===========================================
-- DONE!
-- ===========================================
-- Now whenever a product is created or its status changes,
-- the workflow orchestrator will automatically trigger!
