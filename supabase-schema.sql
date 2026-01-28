-- LaunchPad Database Schema
-- Run this in Supabase SQL Editor (SQL Editor → New query → Paste → Run)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PRODUCTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'banner_gen', 'landing_page', 'review', 'ready', 'live', 'paused')),
  source_url TEXT,
  niche VARCHAR(100),
  target_market VARCHAR(50),
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  supplier_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ===========================================
-- ASSETS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('banner', 'landing_page', 'image', 'video', 'copy', 'other')),
  name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_path TEXT,
  thumbnail_url TEXT,
  content TEXT, -- For text-based assets like copy
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_product_id ON assets(product_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- ===========================================
-- AUTOMATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS automations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'n8n' CHECK (type IN ('n8n', 'zapier', 'make', 'custom')),
  trigger_type VARCHAR(50) CHECK (trigger_type IN ('status_change', 'manual', 'scheduled', 'webhook')),
  trigger_config JSONB DEFAULT '{}',
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);

-- ===========================================
-- AUTOMATION LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  trigger_data JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON automation_logs(user_id);

-- ===========================================
-- USER SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  shopify_store_url TEXT,
  shopify_api_key TEXT,
  n8n_webhook_base_url TEXT,
  default_target_market VARCHAR(50),
  notifications_enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Assets policies
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (auth.uid() = user_id);

-- Automations policies
CREATE POLICY "Users can view own automations" ON automations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automations" ON automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations" ON automations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations" ON automations
  FOR DELETE USING (auth.uid() = user_id);

-- Automation logs policies
CREATE POLICY "Users can view own automation logs" ON automation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation logs" ON automation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================
-- Run these in a separate query or via Supabase Dashboard

-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Storage policies (allow authenticated users to manage their own files)
-- CREATE POLICY "Users can upload assets" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'assets' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can view own assets" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'assets' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete own assets" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'assets' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ===========================================
-- DONE!
-- ===========================================
-- Your database is now set up with:
-- ✅ Products table (with status workflow)
-- ✅ Assets table (banners, landing pages, etc.)
-- ✅ Automations table (n8n webhook configs)
-- ✅ Automation logs
-- ✅ User settings
-- ✅ Row Level Security (users can only see their own data)
-- ✅ Auto-updating timestamps
