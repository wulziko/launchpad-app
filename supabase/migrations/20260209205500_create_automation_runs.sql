-- ============================================================
-- AUTOMATION RUNS TABLE
-- Replaces products.metadata for automation state tracking
-- ============================================================

-- Create ENUM for automation types
CREATE TYPE automation_type AS ENUM (
  'banner',
  'landing_page',
  'review',
  'ugc',
  'shopify'
);

-- Create ENUM for automation status
CREATE TYPE automation_status AS ENUM (
  'idle',
  'processing',
  'completed',
  'error',
  'stopped'
);

-- Create automation_runs table
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Automation identification
  automation_type automation_type NOT NULL,
  
  -- Status tracking
  status automation_status NOT NULL DEFAULT 'idle',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message TEXT,
  
  -- External tracking
  n8n_execution_id TEXT,
  n8n_workflow_id TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_product_automation UNIQUE(product_id, automation_type),
  CONSTRAINT valid_progress CHECK (
    (status = 'completed' AND progress = 100) OR 
    (status != 'completed')
  )
);

-- Indexes for performance
CREATE INDEX idx_automation_runs_product_id ON automation_runs(product_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_type ON automation_runs(automation_type);
CREATE INDEX idx_automation_runs_product_type ON automation_runs(product_id, automation_type);

-- Enable Row Level Security
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own automation runs"
  ON automation_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation runs"
  ON automation_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation runs"
  ON automation_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
  ON automation_runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_automation_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_runs_updated_at
  BEFORE UPDATE ON automation_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_runs_updated_at();

-- Helper function: Get or create automation run
CREATE OR REPLACE FUNCTION get_or_create_automation_run(
  p_product_id UUID,
  p_user_id UUID,
  p_automation_type automation_type
) RETURNS automation_runs AS $$
DECLARE
  v_run automation_runs;
BEGIN
  -- Try to get existing run
  SELECT * INTO v_run
  FROM automation_runs
  WHERE product_id = p_product_id
    AND automation_type = p_automation_type;
  
  -- Create if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO automation_runs (product_id, user_id, automation_type)
    VALUES (p_product_id, p_user_id, p_automation_type)
    RETURNING * INTO v_run;
  END IF;
  
  RETURN v_run;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Update automation status (atomic)
CREATE OR REPLACE FUNCTION update_automation_status(
  p_product_id UUID,
  p_automation_type automation_type,
  p_status automation_status DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_n8n_execution_id TEXT DEFAULT NULL
) RETURNS automation_runs AS $$
DECLARE
  v_run automation_runs;
BEGIN
  -- Lock row for update
  SELECT * INTO v_run
  FROM automation_runs
  WHERE product_id = p_product_id
    AND automation_type = p_automation_type
  FOR UPDATE;
  
  -- Update only provided fields
  UPDATE automation_runs SET
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    message = COALESCE(p_message, message),
    n8n_execution_id = COALESCE(p_n8n_execution_id, n8n_execution_id),
    started_at = CASE 
      WHEN p_status = 'processing' AND started_at IS NULL THEN NOW()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN p_status = 'completed' THEN NOW()
      ELSE completed_at
    END,
    stopped_at = CASE
      WHEN p_status = 'stopped' THEN NOW()
      ELSE stopped_at
    END,
    updated_at = NOW()
  WHERE product_id = p_product_id
    AND automation_type = p_automation_type
  RETURNING * INTO v_run;
  
  RETURN v_run;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON automation_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_runs TO service_role;
GRANT EXECUTE ON FUNCTION get_or_create_automation_run TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_automation_status TO authenticated, service_role;

-- Comments
COMMENT ON TABLE automation_runs IS 'Tracks state of product automations (banners, landing pages, etc)';
COMMENT ON COLUMN automation_runs.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN automation_runs.n8n_execution_id IS 'n8n execution ID for tracking/stopping';
COMMENT ON FUNCTION get_or_create_automation_run IS 'Gets existing or creates new automation run';
COMMENT ON FUNCTION update_automation_status IS 'Atomically updates automation status (thread-safe)';
