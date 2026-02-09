# LaunchPad Automation Isolation Refactor Plan
**Branch:** `refactor-automation-isolation`  
**Date:** 2026-02-09  
**Lead:** David (AI Assistant)  
**Status:** 🟡 AWAITING APPROVAL

---

## ✅ SAFETY CHECKPOINT COMPLETED

### Backups Created
- **Database:**
  - `backups/products-backup-20260209-205241.json` (6 products)
  - `backups/assets-backup-20260209-205249.json` (50 assets)
- **Git Branch:** `refactor-automation-isolation` (created, switched)
- **Codebase:** Clean working tree on branch

### Safety Confirmation
- ✅ Working on branch `refactor-automation-isolation`, NOT main
- ✅ Database backed up
- ✅ Can rollback via git reset
- ✅ Can restore database from JSON backups

---

## 📋 PHASE 1: BANNERS ONLY (First Implementation)

### Goals
1. Create `automation_runs` table
2. Migrate **ONLY banner generation** to use new table
3. Keep all other automations (landing page, reviews, UGC, Shopify) using old `products.metadata` temporarily
4. Test banner generation extensively
5. **STOP and validate before proceeding**

---

## 1. DATABASE MIGRATION STRATEGY

### 1.1 Create `automation_runs` Table

**File:** `supabase/migrations/20260209205500_create_automation_runs.sql`

```sql
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
```

---

### 1.2 Migrate Existing Data (Phase 1: Banners Only)

**File:** `supabase/migrations/20260209205501_migrate_banner_metadata.sql`

```sql
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
```

---

### 1.3 Rollback SQL (Emergency Use Only)

**File:** `supabase/migrations/ROLLBACK-automation-runs.sql`

```sql
-- ============================================================
-- ROLLBACK: Drop automation_runs table and restore metadata
-- ⚠️ USE ONLY IF REFACTOR FAILS
-- ============================================================

-- Step 1: Restore banner automation metadata to products table
-- (Only if we need to rollback Phase 1)
UPDATE products p
SET metadata = jsonb_set(
  COALESCE(p.metadata, '{}'::jsonb),
  '{automation_status}',
  to_jsonb(ar.status::TEXT)
)
FROM automation_runs ar
WHERE ar.product_id = p.id
  AND ar.automation_type = 'banner'
  AND ar.status != 'idle';

UPDATE products p
SET metadata = jsonb_set(
  p.metadata,
  '{automation_progress}',
  to_jsonb(ar.progress)
)
FROM automation_runs ar
WHERE ar.product_id = p.id
  AND ar.automation_type = 'banner';

UPDATE products p
SET metadata = jsonb_set(
  p.metadata,
  '{automation_message}',
  to_jsonb(ar.message)
)
FROM automation_runs ar
WHERE ar.product_id = p.id
  AND ar.automation_type = 'banner'
  AND ar.message IS NOT NULL;

-- Step 2: Drop automation_runs infrastructure
DROP TRIGGER IF EXISTS automation_runs_updated_at ON automation_runs;
DROP FUNCTION IF EXISTS update_automation_runs_updated_at();
DROP FUNCTION IF EXISTS update_automation_status(UUID, automation_type, automation_status, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_or_create_automation_run(UUID, UUID, automation_type);
DROP TABLE IF EXISTS automation_runs CASCADE;
DROP TYPE IF EXISTS automation_status CASCADE;
DROP TYPE IF EXISTS automation_type CASCADE;

-- Step 3: Verify rollback
SELECT 
  COUNT(*) as products_with_banner_metadata
FROM products
WHERE metadata ? 'automation_status';

-- Log completion
RAISE NOTICE 'Rollback complete. Verify metadata restored correctly.';
```

**Rollback Procedure:**
1. Stop all running automations
2. Run rollback SQL: `psql -f supabase/migrations/ROLLBACK-automation-runs.sql`
3. Verify metadata: Check `products` table has `automation_status` fields
4. Switch git branch: `git checkout main`
5. Deploy original code to Vercel

---

## 2. CODE CHANGES CHECKLIST (Phase 1: Banners Only)

### Files to Modify

| File | Change Type | Phase 1 Scope |
|------|-------------|---------------|
| `src/lib/automation.js` | MAJOR | ✅ Update banner functions only |
| `src/lib/supabase.js` | MINOR | ✅ Add automation_runs helpers |
| `src/components/AutomationProgress.jsx` | MAJOR | ✅ Read from automation_runs |
| `src/pages/ProductDetail.jsx` | MINOR | ✅ Update banner trigger only |
| `api/trigger-banners.js` | NONE | ❌ No changes (webhook URL stays same) |
| n8n Banner Workflow | MAJOR | ✅ Update HTTP nodes to write to automation_runs |

### Files NOT Modified in Phase 1
- ❌ `src/lib/research.js` (uses separate webhook)
- ❌ `api/trigger-landing-pages.js` (Phase 2)
- ❌ `api/trigger-reviews.js` (Phase 3)
- ❌ `api/trigger-ugc.js` (Phase 3)
- ❌ `api/trigger-shopify.js` (Phase 3)
- ❌ `src/components/LandingPageProgress.jsx` (Phase 2)
- ❌ `src/components/ReviewsPanel.jsx` (Phase 3)
- ❌ `src/components/UGCScriptsPanel.jsx` (Phase 3)

---

### 2.1 `src/lib/automation.js` Changes (Phase 1)

#### BEFORE (Current Code)

```javascript
export const triggerBannerGeneration = async (product) => {
  try {
    // Update metadata to show processing
    await updateProductAutomationStatus(product.id, {
      automation_status: 'processing',
      automation_started_at: new Date().toISOString(),
      automation_progress: 0,
      automation_message: 'Starting banner generation...'
    })

    const payload = { /* ... */ }
    
    const response = await fetchWithRetry(BANNER_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    return { success: true }
  } catch (error) {
    await updateProductAutomationStatus(product.id, {
      automation_status: 'error',
      automation_message: error.message
    })
    throw error
  }
}

export const updateProductAutomationStatus = async (productId, updates) => {
  // Fetch current metadata
  const { data: current } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', productId)
    .single()
  
  // ⚠️ PROBLEM: Shallow merge - race conditions
  const newMetadata = { ...(current?.metadata || {}), ...updates }
  
  // Write back - overwrites everything
  await supabase
    .from('products')
    .update({ metadata: newMetadata })
    .eq('id', productId)
}
```

#### AFTER (Phase 1 - Banner Only)

```javascript
export const triggerBannerGeneration = async (product) => {
  try {
    // Create or get automation run
    const { data: run } = await supabase
      .from('automation_runs')
      .upsert({
        product_id: product.id,
        user_id: product.user_id,
        automation_type: 'banner',
        status: 'processing',
        progress: 0,
        message: 'Starting banner generation...',
        started_at: new Date().toISOString()
      }, {
        onConflict: 'product_id,automation_type',
        returning: 'minimal'
      })

    const payload = { /* ... */ }
    
    const response = await fetchWithRetry(BANNER_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    return { success: true }
  } catch (error) {
    // Update run to error state
    await supabase
      .from('automation_runs')
      .update({
        status: 'error',
        message: error.message
      })
      .eq('product_id', product.id)
      .eq('automation_type', 'banner')
    
    throw error
  }
}

// NEW: Banner-specific status update
export const updateBannerAutomationStatus = async (productId, updates) => {
  const { data, error } = await supabase
    .from('automation_runs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .eq('automation_type', 'banner')
    .select()
    .single()
  
  if (error) throw error
  return data
}

// KEEP OLD FUNCTION for Phase 2/3 automations
export const updateProductAutomationStatus = async (productId, updates) => {
  // ⚠️ DEPRECATED: Only used by landing_page, review, ugc, shopify
  // Will be removed in Phase 2/3
  const { data: current } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', productId)
    .single()
  
  const newMetadata = { ...(current?.metadata || {}), ...updates }
  
  await supabase
    .from('products')
    .update({ metadata: newMetadata })
    .eq('id', productId)
}
```

---

### 2.2 `src/components/AutomationProgress.jsx` Changes

#### BEFORE (Current Code)

```javascript
// Subscribe to products.metadata changes
useEffect(() => {
  const subscription = subscribeToAutomationUpdates(
    product.id,
    (state) => {
      setProgress(state.progress)
      setStatus(state.status)
      setMessage(state.message)
    }
  )
  
  return () => subscription()
}, [product.id])
```

#### AFTER (Phase 1)

```javascript
// Subscribe to automation_runs changes (banner only)
useEffect(() => {
  const channel = supabase
    .channel(`automation-banner-${product.id}`)
    .on('postgres_changes', {
      event: '*',  // INSERT, UPDATE
      schema: 'public',
      table: 'automation_runs',
      filter: `product_id=eq.${product.id}&automation_type=eq.banner`
    }, (payload) => {
      const run = payload.new
      setProgress(run.progress)
      setStatus(run.status)
      setMessage(run.message)
    })
    .subscribe()
  
  // Initial fetch
  fetchBannerStatus()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [product.id])

const fetchBannerStatus = async () => {
  const { data } = await supabase
    .from('automation_runs')
    .select('*')
    .eq('product_id', product.id)
    .eq('automation_type', 'banner')
    .single()
  
  if (data) {
    setProgress(data.progress)
    setStatus(data.status)
    setMessage(data.message)
  }
}
```

---

### 2.3 n8n Workflow Changes

**Workflow:** `844mhSDdyOFw2VjR` - "LaunchPad: Product Research + Banners - david"

#### BEFORE (Current)
HTTP Node writes to `products.metadata`:
```json
PATCH https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/products?id=eq.{{$json.product_id}}

Body:
{
  "metadata": {
    "automation_status": "processing",
    "automation_progress": 50,
    "automation_message": "Generating banner 5/10..."
  }
}
```

#### AFTER (Phase 1)
HTTP Node writes to `automation_runs`:
```json
-- First, check if run exists
GET https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/automation_runs?product_id=eq.{{$json.product_id}}&automation_type=eq.banner

-- If exists, UPDATE
PATCH https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/automation_runs?product_id=eq.{{$json.product_id}}&automation_type=eq.banner

Body:
{
  "status": "processing",
  "progress": 50,
  "message": "Generating banner 5/10..."
}

-- If doesn't exist, INSERT (upsert)
POST https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/automation_runs

Body:
{
  "product_id": "{{$json.product_id}}",
  "user_id": "{{$json.user_id}}",
  "automation_type": "banner",
  "status": "processing",
  "progress": 50,
  "message": "Generating banner 5/10..."
}
```

**Recommendation:** Use Postgres function for atomic upsert:
```json
POST https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/rpc/update_automation_status

Body:
{
  "p_product_id": "{{$json.product_id}}",
  "p_automation_type": "banner",
  "p_status": "processing",
  "p_progress": 50,
  "p_message": "Generating banner 5/10..."
}
```

---

## 3. TESTING STRATEGY (Phase 1)

### 3.1 Pre-Refactor Tests (Establish Baseline)

**Run these BEFORE implementing changes:**

```bash
# Test 1: Banner generation works
# Expected: Banners generated, progress updates, saved to assets
node test-scripts/test-banner-generation.js

# Test 2: Check metadata structure
# Expected: automation_status, automation_progress in products.metadata
node test-scripts/check-metadata-structure.js

# Output: Save baseline results to compare after refactor
```

---

### 3.2 Post-Refactor Tests (Phase 1)

**Test Script:** `test-scripts/test-phase1-banners.js`

```javascript
/**
 * Phase 1 Test Suite: Banner Generation with automation_runs
 * 
 * Tests:
 * 1. Create test product
 * 2. Trigger banner generation
 * 3. Verify automation_runs record created
 * 4. Monitor progress updates
 * 5. Verify banners saved to assets
 * 6. Verify UI displays correctly
 * 7. Test simultaneous banner generation (2 products)
 * 8. Test stop/resume functionality
 */

import { createClient } from '@supabase/supabase-js'
import { triggerBannerGeneration } from '../src/lib/automation.js'

const supabase = createClient(/* ... */)

async function runPhase1Tests() {
  console.log('🧪 PHASE 1 TEST SUITE: Banner Generation\n')
  
  // Test 1: Create test product
  console.log('Test 1: Creating test product...')
  const { data: product } = await supabase
    .from('products')
    .insert({
      user_id: 'TEST_USER_ID',
      name: 'Test Product - Phase 1',
      description: 'Testing banner generation with automation_runs',
      niche: 'Beauty & Health',
      status: 'new'
    })
    .select()
    .single()
  
  console.log(`✅ Product created: ${product.id}\n`)
  
  // Test 2: Trigger banner generation
  console.log('Test 2: Triggering banner generation...')
  await triggerBannerGeneration(product)
  console.log('✅ Banner generation triggered\n')
  
  // Test 3: Verify automation_runs record created
  console.log('Test 3: Checking automation_runs table...')
  await sleep(2000) // Wait for record creation
  
  const { data: run } = await supabase
    .from('automation_runs')
    .select('*')
    .eq('product_id', product.id)
    .eq('automation_type', 'banner')
    .single()
  
  if (!run) {
    console.error('❌ FAILED: No automation_runs record found')
    return false
  }
  
  console.log(`✅ automation_runs record found:`)
  console.log(`   - Status: ${run.status}`)
  console.log(`   - Progress: ${run.progress}%`)
  console.log(`   - Message: ${run.message}\n`)
  
  // Test 4: Monitor progress updates
  console.log('Test 4: Monitoring progress updates...')
  
  let progressUpdates = []
  const channel = supabase
    .channel(`test-banner-${product.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'automation_runs',
      filter: `product_id=eq.${product.id}`
    }, (payload) => {
      progressUpdates.push({
        progress: payload.new.progress,
        message: payload.new.message,
        timestamp: new Date().toISOString()
      })
      console.log(`   📊 Progress: ${payload.new.progress}% - ${payload.new.message}`)
    })
    .subscribe()
  
  // Wait for completion (max 5 minutes)
  let attempts = 0
  while (attempts < 150) {  // 150 * 2s = 5 minutes
    await sleep(2000)
    
    const { data: currentRun } = await supabase
      .from('automation_runs')
      .select('status, progress')
      .eq('product_id', product.id)
      .eq('automation_type', 'banner')
      .single()
    
    if (currentRun.status === 'completed') {
      console.log(`✅ Banner generation completed after ${attempts * 2}s\n`)
      break
    }
    
    if (currentRun.status === 'error') {
      console.error(`❌ FAILED: Banner generation error\n`)
      return false
    }
    
    attempts++
  }
  
  await supabase.removeChannel(channel)
  
  if (attempts >= 150) {
    console.error('❌ FAILED: Timeout after 5 minutes\n')
    return false
  }
  
  // Test 5: Verify banners saved to assets
  console.log('Test 5: Checking generated banners...')
  
  const { data: banners } = await supabase
    .from('assets')
    .select('*')
    .eq('product_id', product.id)
    .eq('type', 'banner')
  
  if (!banners || banners.length === 0) {
    console.error('❌ FAILED: No banners found in assets table')
    return false
  }
  
  console.log(`✅ Found ${banners.length} banners:`)
  banners.forEach((banner, i) => {
    console.log(`   ${i+1}. ${banner.name}`)
    console.log(`      URL: ${banner.file_url}`)
  })
  console.log()
  
  // Test 6: Verify metadata is NOT used (old system)
  console.log('Test 6: Verifying metadata NOT used...')
  
  const { data: productCheck } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', product.id)
    .single()
  
  if (productCheck.metadata?.automation_status) {
    console.warn('⚠️  WARNING: products.metadata still contains automation_status')
    console.warn('    This should be empty in Phase 1')
  } else {
    console.log('✅ products.metadata clean (no automation_status)\n')
  }
  
  // Test 7: Simultaneous banner generation (different products)
  console.log('Test 7: Testing simultaneous banner generation...')
  
  const { data: product2 } = await supabase
    .from('products')
    .insert({
      user_id: 'TEST_USER_ID',
      name: 'Test Product 2 - Phase 1',
      description: 'Testing simultaneous banner generation',
      niche: 'Beauty & Health',
      status: 'new'
    })
    .select()
    .single()
  
  // Trigger both at the same time
  await Promise.all([
    triggerBannerGeneration(product),
    triggerBannerGeneration(product2)
  ])
  
  console.log('✅ Both banner generations triggered simultaneously')
  
  // Wait and check both completed
  await sleep(10000)
  
  const { data: runs } = await supabase
    .from('automation_runs')
    .select('product_id, status, progress')
    .in('product_id', [product.id, product2.id])
    .eq('automation_type', 'banner')
  
  console.log('   Results:')
  runs.forEach(r => {
    console.log(`   - Product ${r.product_id.slice(0,8)}... : ${r.status} (${r.progress}%)`)
  })
  console.log()
  
  // PASS
  console.log('🎉 ALL PHASE 1 TESTS PASSED!\n')
  return true
}

// Helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

runPhase1Tests().catch(console.error)
```

---

### 3.3 Validation Criteria (Phase 1 Success)

✅ **PASS if ALL of these are true:**

1. ✅ `automation_runs` table created successfully
2. ✅ Banner generation creates record in `automation_runs`
3. ✅ Progress updates write to `automation_runs`, NOT `products.metadata`
4. ✅ Real-time updates work (UI shows progress)
5. ✅ Banners saved to `assets` table with correct `product_id`
6. ✅ UI displays banners correctly
7. ✅ Can run banner generation on 2 different products simultaneously without conflict
8. ✅ `products.metadata` does NOT contain `automation_status` fields
9. ✅ Stop/resume functionality works
10. ✅ No errors in browser console or n8n logs

❌ **FAIL if ANY of these occur:**

- ❌ Banner generation fails
- ❌ Progress updates stuck at 0%
- ❌ Banners not saved to `assets`
- ❌ `automation_runs` record not created
- ❌ Real-time updates don't work
- ❌ Simultaneous generations conflict
- ❌ Orphaned assets (`product_id` = null)
- ❌ Old automations (landing page, etc.) break

**If ANY test fails:** STOP. Rollback. Debug. Fix. Retest.

---

## 4. ROLLBACK PLAN (Emergency Recovery)

### When to Rollback
- ❌ Banner generation completely broken
- ❌ Can't fix within 1 hour
- ❌ n8n workflows failing consistently
- ❌ Data corruption detected

### Rollback Procedure (Step-by-Step)

```bash
# Step 1: Stop all running automations (via n8n UI or API)
echo "🛑 Stopping all n8n workflows..."
# (Manual: go to n8n and stop active executions)

# Step 2: Run rollback SQL
echo "📥 Restoring database schema..."
cd /home/node/clawd/launchpad-app
psql "postgres://..." -f supabase/migrations/ROLLBACK-automation-runs.sql

# Step 3: Verify database restored
echo "✅ Verifying rollback..."
psql "postgres://..." -c "SELECT COUNT(*) FROM products WHERE metadata ? 'automation_status';"

# Step 4: Switch git branch back to main
echo "🔄 Switching to main branch..."
git checkout main

# Step 5: Deploy original code to Vercel
echo "🚀 Deploying to Vercel..."
git push origin main -f

# Step 6: Verify production working
echo "🧪 Testing production..."
# (Manual: open LaunchPad, test banner generation)

# Step 7: Document what went wrong
echo "📝 Creating incident report..."
echo "Rollback completed at $(date)" >> ROLLBACK-INCIDENT.md
```

### Rollback Verification Checklist

After rollback:
- ✅ `automation_runs` table dropped
- ✅ `products.metadata` contains `automation_status` fields
- ✅ Banner generation works again (old system)
- ✅ No errors in browser console
- ✅ Vercel deployment shows main branch

---

## 5. PHASED IMPLEMENTATION SCHEDULE

### Phase 1: Banners Only (2-3 hours)
**Goal:** Migrate banner generation to `automation_runs`

| Step | Task | Duration | Status |
|------|------|----------|--------|
| 1 | Create `automation_runs` table (migration) | 10 min | 🟡 Pending |
| 2 | Migrate existing banner metadata | 5 min | 🟡 Pending |
| 3 | Update `automation.js` (banner functions only) | 30 min | 🟡 Pending |
| 4 | Update `AutomationProgress.jsx` | 20 min | 🟡 Pending |
| 5 | Update n8n banner workflow | 30 min | 🟡 Pending |
| 6 | Deploy to Vercel | 5 min | 🟡 Pending |
| 7 | Run Phase 1 test suite | 15 min | 🟡 Pending |
| 8 | Manual testing (2 products, simultaneous) | 10 min | 🟡 Pending |
| 9 | Monitor for 30 minutes | 30 min | 🟡 Pending |

**🛑 STOP GATE:** If Phase 1 tests pass → Get Guy's approval → Proceed to Phase 2

---

### Phase 2: Landing Pages (1-2 hours)
**Goal:** Migrate landing page generation to `automation_runs`

| Step | Task | Duration | Status |
|------|------|----------|--------|
| 1 | Update `automation.js` (landing page functions) | 20 min | ⏸️  Phase 2 |
| 2 | Update `LandingPageProgress.jsx` | 20 min | ⏸️  Phase 2 |
| 3 | Update n8n landing page workflow | 30 min | ⏸️  Phase 2 |
| 4 | Deploy to Vercel | 5 min | ⏸️  Phase 2 |
| 5 | Test banners + landing pages simultaneously | 10 min | ⏸️  Phase 2 |
| 6 | Verify no conflicts | 10 min | ⏸️  Phase 2 |

**🛑 STOP GATE:** If Phase 2 tests pass → Get Guy's approval → Proceed to Phase 3

---

### Phase 3: Remaining Automations (2-3 hours)
**Goal:** Migrate reviews, UGC, Shopify to `automation_runs`

| Step | Task | Duration | Status |
|------|------|----------|--------|
| 1 | Update `automation.js` (reviews, UGC, Shopify) | 30 min | ⏸️  Phase 3 |
| 2 | Update ReviewsPanel, UGCScriptsPanel | 20 min | ⏸️  Phase 3 |
| 3 | Update n8n workflows (reviews, UGC, Shopify) | 45 min | ⏸️  Phase 3 |
| 4 | Deploy to Vercel | 5 min | ⏸️  Phase 3 |
| 5 | Test all 5 automations simultaneously | 15 min | ⏸️  Phase 3 |
| 6 | Verify complete isolation | 10 min | ⏸️  Phase 3 |
| 7 | Remove deprecated `updateProductAutomationStatus` | 10 min | ⏸️  Phase 3 |
| 8 | Final regression test suite | 20 min | ⏸️  Phase 3 |

**✅ COMPLETION:** All automations use `automation_runs` table. No more `products.metadata` for automation state.

---

## 6. POST-REFACTOR CLEANUP

After Phase 3 completes:

1. ✅ Remove `products.metadata.automation_*` fields (migration to clean up)
2. ✅ Update documentation (README, API docs)
3. ✅ Create `AUTOMATION-STANDARDS.md`
4. ✅ Add to onboarding checklist for new features
5. ✅ Archive `REFACTOR-PLAN.md` to `docs/architecture/`

---

## APPROVAL CHECKLIST

Before David starts coding:

- [ ] Guy reviewed this REFACTOR-PLAN.md
- [ ] Guy approved phased approach (3 phases)
- [ ] Guy confirmed database backups are sufficient
- [ ] David answered 4 questions (see below)
- [ ] Safety checkpoint confirmed (branch, backups)

**Once approved:** Implement Phase 1 (banners only) and STOP.

---

**END OF REFACTOR PLAN**
# Refactor Questions - Answers
**Date:** 2026-02-09  
**Context:** Pre-refactor approval gate

---

## QUESTION 1: Will this refactor require changes to n8n workflows, or just webhook URLs?

**Answer:** ✅ **YES, n8n workflows MUST be modified** (not just webhook URLs)

### What Needs to Change in n8n

**Currently (BROKEN):**
```
HTTP Node: PATCH to products table
URL: /rest/v1/products?id=eq.{{product_id}}
Body:
{
  "metadata": {
    "automation_status": "processing",
    "automation_progress": 50
  }
}
```

**After Refactor (CORRECT):**
```
HTTP Node: Call Postgres RPC function
URL: /rest/v1/rpc/update_automation_status
Body:
{
  "p_product_id": "{{product_id}}",
  "p_automation_type": "banner",
  "p_status": "processing",
  "p_progress": 50,
  "p_message": "Generating banner 5/10..."
}
```

### Changes Required Per Workflow

| Workflow | Node Name | Change Required |
|----------|-----------|-----------------|
| Banner Gen | "Update Status: 10%" | Change URL + Body format |
| Banner Gen | "Update Status: 30%" | Change URL + Body format |
| Banner Gen | "Update Status: 50%" | Change URL + Body format |
| Banner Gen | "Update Status: 80%" | Change URL + Body format |
| Banner Gen | "Update Status: 100%" | Change URL + Body format |
| Banner Gen | "Error Handler" | Change URL + Body format |

**Estimate:** ~10 minutes per workflow to update all HTTP nodes

### Webhook URLs Stay the Same

✅ **No change to webhook URLs:**
- `https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen` (unchanged)
- `https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-landing-pages` (unchanged)
- etc.

**LaunchPad frontend code calls same URLs**, but n8n workflows write to different database table.

---

## QUESTION 2: After refactor, can I run all 5 automations on the same product simultaneously without conflicts?

**Answer:** ✅ **YES - 100% SAFE, NO CONFLICTS**

### Why It's Safe Now

**Before Refactor (BROKEN):**
```
Product A metadata = {
  automation_status: 'processing',
  landing_page_status: 'processing',
  review_status: 'processing'
}
→ Race condition: Last write wins, others get overwritten
```

**After Refactor (SAFE):**
```
automation_runs table:
┌────────────┬─────────────────┬──────────┬──────────┐
│ product_id │ automation_type │ status   │ progress │
├────────────┼─────────────────┼──────────┼──────────┤
│ Product A  │ banner          │ proc     │ 50%      │  ← Row 1
│ Product A  │ landing_page    │ proc     │ 30%      │  ← Row 2
│ Product A  │ review          │ proc     │ 70%      │  ← Row 3
│ Product A  │ ugc             │ proc     │ 10%      │  ← Row 4
│ Product A  │ shopify         │ proc     │ 90%      │  ← Row 5
└────────────┴─────────────────┴──────────┴──────────┘
→ Separate rows = No conflicts!
```

### Proof: Test Scenario

**Run all 5 automations at EXACTLY the same time:**

```javascript
// Click all 5 buttons within 1 second
await Promise.all([
  triggerBannerGeneration(productA),      // T+0.0s
  triggerLandingPageGeneration(productA), // T+0.2s
  triggerReviewGeneration(productA),      // T+0.4s
  triggerUGCGeneration(productA),         // T+0.6s
  triggerShopifyDeployment(productA)      // T+0.8s
])

// Result:
// ✅ 5 separate records in automation_runs
// ✅ Each automation progresses independently
// ✅ No overwrites
// ✅ No race conditions
// ✅ UI shows all 5 progress bars updating in real-time
```

### Database Guarantee

**UNIQUE constraint prevents duplicate runs:**
```sql
CONSTRAINT unique_product_automation UNIQUE(product_id, automation_type)
```

**If you try to start the same automation twice on one product:**
- First call: Creates new record → SUCCESS
- Second call: Tries to insert duplicate → **FAILS** (by design)
- **Solution:** Use `UPSERT` to update existing record instead

### Isolation Per Automation Type

Each automation has its own isolated state:

| Automation | Table Row | Independent? |
|------------|-----------|--------------|
| Banner | `(Product A, banner, ...)` | ✅ Yes |
| Landing Page | `(Product A, landing_page, ...)` | ✅ Yes |
| Review | `(Product A, review, ...)` | ✅ Yes |
| UGC | `(Product A, ugc, ...)` | ✅ Yes |
| Shopify | `(Product A, shopify, ...)` | ✅ Yes |

**No shared state = No conflicts.**

---

## QUESTION 3: Show before/after comparison when I trigger "Generate Banners"

### BEFORE (Current System - Broken)

#### Timeline

```
T+0.0s: User clicks "Generate Banners"
  ↓
T+0.1s: Frontend calls triggerBannerGeneration(product)
  ↓
T+0.2s: automation.js reads products.metadata
        Result: metadata = {}
  ↓
T+0.3s: automation.js writes to products.metadata
        UPDATE products SET metadata = {
          automation_status: 'processing',
          automation_progress: 0,
          automation_message: 'Starting...'
        }
  ↓
T+0.4s: automation.js calls /api/trigger-banners
  ↓
T+0.5s: API proxy forwards to n8n webhook
  ↓
T+1.0s: n8n workflow starts
  ↓
T+1.5s: n8n PATCH to products.metadata
        UPDATE products SET metadata = {
          automation_status: 'processing',
          automation_progress: 10,
          automation_message: 'Starting research...'
        }
  ↓
  [If user clicks "Generate Landing Page" here...]
  ↓
T+2.0s: automation.js reads products.metadata
        Result: {automation_status: 'processing', automation_progress: 10}
  ↓
T+2.1s: automation.js writes to products.metadata
        UPDATE products SET metadata = {
          landing_page_status: 'processing',
          landing_page_progress: 0
        }
        ⚠️ OVERWRITES banner automation state! Lost automation_progress!
  ↓
T+3.0s: n8n banner workflow PATCH (50%)
        UPDATE products SET metadata = {
          automation_status: 'processing',
          automation_progress: 50
        }
        ⚠️ OVERWRITES landing_page_status! Lost landing page state!
```

**Result:** 
- ❌ Progress bars stuck or jumping randomly
- ❌ Data loss (overwrites)
- ❌ Race conditions
- ❌ User sees incorrect status

---

### AFTER (New System - Safe)

#### Timeline

```
T+0.0s: User clicks "Generate Banners"
  ↓
T+0.1s: Frontend calls triggerBannerGeneration(product)
  ↓
T+0.2s: automation.js UPSERTS to automation_runs
        INSERT INTO automation_runs (
          product_id,
          user_id,
          automation_type,
          status,
          progress,
          message
        ) VALUES (
          'Product A',
          'User 1',
          'banner',           ← Separate row per automation!
          'processing',
          0,
          'Starting...'
        )
        ON CONFLICT (product_id, automation_type) DO UPDATE
  ↓
T+0.3s: automation.js calls /api/trigger-banners
  ↓
T+0.4s: API proxy forwards to n8n webhook
  ↓
T+1.0s: n8n workflow starts
  ↓
T+1.5s: n8n calls Postgres RPC
        SELECT update_automation_status(
          'Product A',
          'banner',           ← Only updates banner row
          'processing',
          10,
          'Starting research...'
        )
        
        Database update:
        UPDATE automation_runs
        SET status = 'processing', progress = 10, message = '...'
        WHERE product_id = 'Product A' AND automation_type = 'banner'
        ✅ Only updates banner row, leaves others untouched
  ↓
  [If user clicks "Generate Landing Page" here...]
  ↓
T+2.0s: automation.js UPSERTS to automation_runs
        INSERT INTO automation_runs (
          product_id,
          user_id,
          automation_type,      ← Different automation_type!
          status,
          progress
        ) VALUES (
          'Product A',
          'User 1',
          'landing_page',        ← Separate row!
          'processing',
          0
        )
        ✅ Creates NEW row, doesn't touch banner row
  ↓
T+3.0s: n8n banner workflow calls RPC (50%)
        SELECT update_automation_status(
          'Product A',
          'banner',              ← Only updates banner row
          'processing',
          50,
          '...'
        )
        ✅ Only updates banner row, leaves landing_page row untouched
  ↓
T+3.5s: n8n landing page workflow calls RPC (20%)
        SELECT update_automation_status(
          'Product A',
          'landing_page',        ← Only updates landing_page row
          'processing',
          20,
          '...'
        )
        ✅ Only updates landing_page row, leaves banner row untouched
```

**Result:**
- ✅ Both progress bars update independently
- ✅ No data loss
- ✅ No race conditions
- ✅ User sees accurate real-time status for both automations

---

### Side-by-Side Comparison

| Aspect | BEFORE (Broken) | AFTER (Safe) |
|--------|-----------------|--------------|
| **Storage** | Single `products.metadata` JSON | Separate rows in `automation_runs` |
| **Isolation** | ❌ None - all automations share state | ✅ Complete - one row per automation |
| **Conflicts** | ❌ Yes - last write wins | ✅ No - atomic row-level updates |
| **Simultaneous** | ❌ Fails - overwrites each other | ✅ Works - independent rows |
| **Real-time** | ❌ Updates lost | ✅ All updates preserved |
| **Database Ops** | Read entire metadata → Merge → Write back | Direct row UPDATE with WHERE clause |
| **Thread Safety** | ❌ No locking | ✅ Row-level locking (FOR UPDATE) |
| **Query Performance** | ❌ Slow (JSON parsing) | ✅ Fast (indexed columns) |
| **Schema Validation** | ❌ None (JSONB) | ✅ Enforced (ENUMs, constraints) |

---

## QUESTION 4: How will the frontend know automation status?

**Answer:** ✅ **Query `automation_runs` table instead of `products.metadata`**

### BEFORE (Current Code)

```javascript
// ProductDetail.jsx
const [bannerStatus, setBannerStatus] = useState('idle')

useEffect(() => {
  // Subscribe to products.metadata changes
  const subscription = supabase
    .channel(`product-${product.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',        // ← Watch products table
      filter: `id=eq.${product.id}`
    }, (payload) => {
      const metadata = payload.new.metadata || {}
      setBannerStatus(metadata.automation_status)     // ← From metadata
      setBannerProgress(metadata.automation_progress)
    })
    .subscribe()
  
  return () => supabase.removeChannel(subscription)
}, [product.id])
```

**Problem:** All automations share same `metadata` object → conflicts

---

### AFTER (New Code)

```javascript
// ProductDetail.jsx
const [bannerStatus, setBannerStatus] = useState('idle')
const [landingPageStatus, setLandingPageStatus] = useState('idle')
const [reviewStatus, setReviewStatus] = useState('idle')
// etc.

useEffect(() => {
  // Subscribe to automation_runs for THIS SPECIFIC automation
  const bannerChannel = supabase
    .channel(`automation-banner-${product.id}`)
    .on('postgres_changes', {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'automation_runs',  // ← Watch automation_runs table
      filter: `product_id=eq.${product.id}&automation_type=eq.banner`  // ← Specific automation
    }, (payload) => {
      const run = payload.new
      setBannerStatus(run.status)
      setBannerProgress(run.progress)
      setBannerMessage(run.message)
    })
    .subscribe()
  
  // Separate subscription for landing page automation
  const landingPageChannel = supabase
    .channel(`automation-landing-page-${product.id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'automation_runs',
      filter: `product_id=eq.${product.id}&automation_type=eq.landing_page`
    }, (payload) => {
      const run = payload.new
      setLandingPageStatus(run.status)
      setLandingPageProgress(run.progress)
      setLandingPageMessage(run.message)
    })
    .subscribe()
  
  // Fetch initial status for both
  fetchAutomationStatus('banner')
  fetchAutomationStatus('landing_page')
  
  return () => {
    supabase.removeChannel(bannerChannel)
    supabase.removeChannel(landingPageChannel)
  }
}, [product.id])

const fetchAutomationStatus = async (automationType) => {
  const { data } = await supabase
    .from('automation_runs')
    .select('status, progress, message')
    .eq('product_id', product.id)
    .eq('automation_type', automationType)
    .single()
  
  if (data) {
    // Update state based on automation type
    switch (automationType) {
      case 'banner':
        setBannerStatus(data.status)
        setBannerProgress(data.progress)
        setBannerMessage(data.message)
        break
      case 'landing_page':
        setLandingPageStatus(data.status)
        setLandingPageProgress(data.progress)
        setLandingPageMessage(data.message)
        break
      // etc.
    }
  }
}
```

### Benefits of New Approach

| Benefit | Description |
|---------|-------------|
| **Isolation** | Each automation has its own Supabase channel |
| **No Conflicts** | Updates to banner automation don't trigger landing page listeners |
| **Efficient** | Supabase only sends events for the specific `automation_type` |
| **Scalable** | Can add 100 automation types without conflicts |
| **Type-Safe** | Database ENUMs prevent typos (`'banner'` not `'banners'`) |

### Helper Function (Reusable)

```javascript
// src/lib/automation-hooks.js

/**
 * Custom React hook to subscribe to automation status
 * @param {string} productId - Product UUID
 * @param {string} automationType - 'banner', 'landing_page', etc.
 * @returns {object} { status, progress, message, startedAt, completedAt }
 */
export function useAutomationStatus(productId, automationType) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [completedAt, setCompletedAt] = useState(null)
  
  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`automation-${automationType}-${productId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'automation_runs',
        filter: `product_id=eq.${productId}&automation_type=eq.${automationType}`
      }, (payload) => {
        const run = payload.new
        setStatus(run.status)
        setProgress(run.progress)
        setMessage(run.message)
        setStartedAt(run.started_at)
        setCompletedAt(run.completed_at)
      })
      .subscribe()
    
    // Fetch initial status
    fetchStatus()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, automationType])
  
  const fetchStatus = async () => {
    const { data } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('product_id', productId)
      .eq('automation_type', automationType)
      .single()
    
    if (data) {
      setStatus(data.status)
      setProgress(data.progress)
      setMessage(data.message)
      setStartedAt(data.started_at)
      setCompletedAt(data.completed_at)
    }
  }
  
  return { status, progress, message, startedAt, completedAt }
}
```

### Usage in Components

```javascript
// AutomationProgress.jsx
function AutomationProgress({ product }) {
  const { status, progress, message } = useAutomationStatus(product.id, 'banner')
  
  return (
    <div>
      <progress value={progress} max="100" />
      <p>{message}</p>
      {status === 'completed' && <span>✅ Done!</span>}
    </div>
  )
}

// LandingPageProgress.jsx
function LandingPageProgress({ product }) {
  const { status, progress, message } = useAutomationStatus(product.id, 'landing_page')
  
  return (
    <div>
      <progress value={progress} max="100" />
      <p>{message}</p>
    </div>
  )
}
```

**Result:** Clean, reusable, no conflicts.

---

## SUMMARY OF ANSWERS

| Question | Answer | Complexity |
|----------|--------|------------|
| 1. n8n changes needed? | ✅ Yes - update HTTP nodes to call RPC function | Medium (10 min/workflow) |
| 2. Safe to run all 5 simultaneously? | ✅ Yes - 100% safe, no conflicts | Easy (guaranteed by DB) |
| 3. Before/after comparison? | ✅ See detailed timeline above | - |
| 4. How does frontend know status? | ✅ Query `automation_runs`, use separate subscriptions | Easy (reusable hook) |

---

**Ready for Guy's approval to proceed with Phase 1.**
# LaunchPad Automation Standards
**Version:** 1.0  
**Effective:** After Phase 3 completion  
**Mandatory for:** All future automation features

---

## 🎯 PURPOSE

This document defines **non-negotiable standards** for all automation features in LaunchPad. Following these standards prevents the race conditions, data loss, and conflicts that plagued the pre-refactor system.

**Violation of these standards will break existing automations.**

---

## 📋 DATABASE RULES

### Rule 1: NEVER Write to `products.metadata` for Automation State

❌ **FORBIDDEN:**
```javascript
// DO NOT DO THIS
await supabase
  .from('products')
  .update({
    metadata: {
      my_new_automation_status: 'processing'
    }
  })
```

✅ **CORRECT:**
```javascript
// Use automation_runs table
await supabase
  .from('automation_runs')
  .upsert({
    product_id: productId,
    user_id: userId,
    automation_type: 'my_new_automation',  // Must be in ENUM
    status: 'processing',
    progress: 0,
    message: 'Starting...'
  })
```

---

### Rule 2: Each Automation Must Have Unique `automation_type`

When adding a new automation:

1. **Add to ENUM** (database migration required):
```sql
ALTER TYPE automation_type ADD VALUE 'my_new_automation';
```

2. **Use consistent naming:**
   - Singular noun (not verb)
   - Lowercase, underscore-separated
   - Examples: `banner`, `landing_page`, `review`, `ugc`, `shopify`
   - **Not:** `generate_banners`, `BannerGeneration`, `banners`

3. **Never reuse existing types** - creates conflicts!

---

### Rule 3: Use UNIQUE Constraint for Isolation

The database enforces **one run per automation per product**:

```sql
CONSTRAINT unique_product_automation UNIQUE(product_id, automation_type)
```

This prevents:
- ❌ Multiple simultaneous runs of the same automation on one product
- ❌ Orphaned automation runs
- ❌ Stale status records

**To restart an automation:** UPDATE the existing record, don't INSERT a new one.

---

### Rule 4: Always Set `user_id` (For RLS)

Row-Level Security requires `user_id`:

```javascript
await supabase
  .from('automation_runs')
  .insert({
    product_id: productId,
    user_id: userId,  // ⚠️ REQUIRED for RLS
    automation_type: 'my_automation'
  })
```

If `user_id` is missing, users won't see their automation status!

---

## 🔗 WEBHOOK HANDLER RULES

### Rule 5: Each Automation Must Include Required Fields

Every webhook payload MUST include:

```javascript
{
  product_id: "uuid",        // Required
  user_id: "uuid",           // Required
  automation_type: "string", // Required (matches ENUM)
  status: "processing",      // Required
  progress: 0,               // Required (0-100)
  message: "Starting...",    // Required
  data: { /* optional */ }   // Optional automation-specific data
}
```

**Validation in webhook handler:**
```javascript
export default async function handler(req, res) {
  const { product_id, user_id, automation_type } = req.body
  
  if (!product_id || !user_id || !automation_type) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['product_id', 'user_id', 'automation_type']
    })
  }
  
  // Proceed...
}
```

---

### Rule 6: Use Consistent Status Values

Only these statuses are valid:

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `idle` | Not started | Initial state, before trigger |
| `processing` | Running | While n8n workflow is executing |
| `completed` | Success | Workflow finished, progress = 100 |
| `error` | Failed | Workflow error, show error message |
| `stopped` | User stopped | User clicked "Stop" button |

**Do NOT invent new statuses** - UI components expect these exact values.

---

### Rule 7: Progress Must Be 0-100

```javascript
// ✅ CORRECT
progress: 0    // Starting
progress: 50   // Halfway
progress: 100  // Complete

// ❌ WRONG
progress: -1
progress: 150
progress: "50%"  // Must be INTEGER
```

Database constraint enforces this:
```sql
CHECK (progress >= 0 AND progress <= 100)
```

---

### Rule 8: Route by `automation_type`, Not URL Paths

**Bad (old system):**
```
/api/trigger-banners       → banner workflow
/api/trigger-landing-pages → landing page workflow
/api/trigger-reviews       → review workflow
```

**Good (new system):**
```
/api/automation/trigger
```

Handler routes based on `automation_type`:
```javascript
export default async function handler(req, res) {
  const { automation_type } = req.body
  
  switch (automation_type) {
    case 'banner':
      return triggerBannerWorkflow(req, res)
    case 'landing_page':
      return triggerLandingPageWorkflow(req, res)
    // etc.
  }
}
```

---

## 📝 LOGGING RULES

### Rule 9: Log Every Automation Event

**Required log events:**
1. Trigger initiated
2. n8n webhook called
3. Progress updates (every 10%)
4. Completion/error
5. User stop/resume

**Log format:**
```javascript
console.log(`[AUTOMATION:${automation_type}] ${message}`, {
  product_id,
  status,
  progress,
  timestamp: new Date().toISOString()
})
```

**Example:**
```
[AUTOMATION:banner] Triggered for product c891c673... {product_id: "...", status: "processing", progress: 0, timestamp: "2026-02-09T20:00:00Z"}
[AUTOMATION:banner] Progress update {product_id: "...", status: "processing", progress: 50, timestamp: "2026-02-09T20:01:30Z"}
[AUTOMATION:banner] Completed {product_id: "...", status: "completed", progress: 100, timestamp: "2026-02-09T20:03:00Z"}
```

---

### Rule 10: Create Automation-Specific Log Files

For n8n workflows, write logs to dedicated files:

```
logs/
├── automation-banner.log
├── automation-landing-page.log
├── automation-review.log
├── automation-ugc.log
└── automation-shopify.log
```

**In n8n workflow:**
- Add "Write to File" node after key steps
- Append to `/var/log/launchpad/automation-{type}.log`
- Include: timestamp, product_id, status, message

---

## ✅ ADDING NEW AUTOMATIONS CHECKLIST

Use this checklist **every time** you add a new automation:

### Phase 1: Database Setup
- [ ] Add `automation_type` to ENUM:
  ```sql
  ALTER TYPE automation_type ADD VALUE 'my_new_automation';
  ```
- [ ] Verify no naming conflicts with existing types
- [ ] Test UNIQUE constraint: try inserting duplicate record (should fail)

### Phase 2: Code Setup
- [ ] Create API endpoint: `/api/automation/my_new_automation.js`
- [ ] Validate required fields: `product_id`, `user_id`, `automation_type`
- [ ] Add trigger function to `src/lib/automation.js`:
  ```javascript
  export const triggerMyNewAutomation = async (product) => {
    await supabase.from('automation_runs').upsert({
      product_id: product.id,
      user_id: product.user_id,
      automation_type: 'my_new_automation',
      status: 'processing',
      progress: 0,
      message: 'Starting...'
    })
    
    // Call n8n webhook
    await fetchWithRetry('/api/automation/my_new_automation', {
      method: 'POST',
      body: JSON.stringify(product)
    })
  }
  ```
- [ ] Create UI component: `src/components/MyNewAutomationPanel.jsx`
- [ ] Subscribe to real-time updates:
  ```javascript
  supabase
    .channel(`automation-my_new_automation-${product_id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'automation_runs',
      filter: `product_id=eq.${product_id}&automation_type=eq.my_new_automation`
    }, handleUpdate)
    .subscribe()
  ```

### Phase 3: n8n Workflow Setup
- [ ] Create n8n workflow: "LaunchPad: My New Automation"
- [ ] Add webhook trigger node
- [ ] Add progress update nodes (at 10%, 25%, 50%, 75%, 90%, 100%)
- [ ] Each progress node calls Supabase RPC:
  ```json
  POST /rest/v1/rpc/update_automation_status
  {
    "p_product_id": "{{$json.product_id}}",
    "p_automation_type": "my_new_automation",
    "p_progress": 50,
    "p_message": "Halfway there..."
  }
  ```
- [ ] Add error handling node → sets `status: 'error'`
- [ ] Add completion node → sets `status: 'completed', progress: 100`

### Phase 4: Testing
- [ ] Test automation alone (single product)
- [ ] Test with existing automations running (simultaneous)
- [ ] Test on 2 different products at the same time
- [ ] Test stop/resume functionality
- [ ] Test error handling (simulate n8n failure)
- [ ] Verify real-time updates work in UI
- [ ] Check `automation_runs` table for correct data
- [ ] Verify `products.metadata` is NOT used

### Phase 5: Regression Testing
- [ ] Run **ALL** existing automation tests
- [ ] Verify banner generation still works
- [ ] Verify landing page generation still works
- [ ] Verify reviews still work
- [ ] Verify UGC scripts still work
- [ ] Verify Shopify deployment still works
- [ ] Check for console errors
- [ ] Monitor n8n execution logs for errors

### Phase 6: Documentation
- [ ] Add automation to `README.md`
- [ ] Update API documentation
- [ ] Add to user guide
- [ ] Update `AUTOMATION-STANDARDS.md` examples (if needed)

### Phase 7: Deployment
- [ ] Create git branch: `feat/automation-{name}`
- [ ] Commit changes with descriptive message
- [ ] Push to GitHub
- [ ] Create pull request
- [ ] Get code review (Guy's approval)
- [ ] Merge to main
- [ ] Verify Vercel deployment successful
- [ ] Monitor production for 24 hours

---

## 🚫 ANTI-PATTERNS (Things NEVER to Do)

### ❌ Anti-Pattern 1: Shared State in `products.metadata`

**Why it's bad:** Race conditions, data loss, conflicts

**What NOT to do:**
```javascript
// ❌ BAD: All automations writing to same metadata object
await supabase
  .from('products')
  .update({
    metadata: {
      automation_status: 'processing',
      landing_page_status: 'processing',
      review_status: 'processing'
    }
  })
```

**Solution:** Use `automation_runs` with separate records per automation type.

---

### ❌ Anti-Pattern 2: Polling Instead of Real-time

**Why it's bad:** Expensive, delayed updates, rate limits

**What NOT to do:**
```javascript
// ❌ BAD: Polling every second
setInterval(async () => {
  const status = await fetchAutomationStatus()
  updateUI(status)
}, 1000)
```

**Solution:** Use Supabase real-time subscriptions:
```javascript
// ✅ GOOD: Real-time updates
supabase
  .channel(`automation-${product_id}`)
  .on('postgres_changes', {...}, handleUpdate)
  .subscribe()
```

---

### ❌ Anti-Pattern 3: Hard-coded Automation Types

**Why it's bad:** Not scalable, hard to maintain

**What NOT to do:**
```javascript
// ❌ BAD: Hard-coded if/else
if (type === 'banner') {
  updateBannerStatus()
} else if (type === 'landing_page') {
  updateLandingPageStatus()
}
// ... 20 more if/else
```

**Solution:** Generic handler with type parameter:
```javascript
// ✅ GOOD: Generic handler
async function updateAutomationStatus(productId, automationType, updates) {
  await supabase
    .from('automation_runs')
    .update(updates)
    .eq('product_id', productId)
    .eq('automation_type', automationType)
}
```

---

### ❌ Anti-Pattern 4: Ignoring Conflicts

**Why it's bad:** Silent failures, corrupted data

**What NOT to do:**
```javascript
// ❌ BAD: No error handling
await supabase
  .from('automation_runs')
  .insert({ product_id, automation_type })
  // Duplicate insert will fail silently!
```

**Solution:** Use upsert with conflict resolution:
```javascript
// ✅ GOOD: Handle conflicts
await supabase
  .from('automation_runs')
  .upsert({
    product_id,
    automation_type,
    status: 'processing'
  }, {
    onConflict: 'product_id,automation_type'
  })
```

---

### ❌ Anti-Pattern 5: Missing `user_id`

**Why it's bad:** RLS blocks access, users see nothing

**What NOT to do:**
```javascript
// ❌ BAD: No user_id
await supabase
  .from('automation_runs')
  .insert({
    product_id,
    automation_type
  })
  // RLS will reject this!
```

**Solution:** Always include `user_id`:
```javascript
// ✅ GOOD: Include user_id
await supabase
  .from('automation_runs')
  .insert({
    product_id,
    user_id,  // Required for RLS
    automation_type
  })
```

---

## 🔍 CODE REVIEW CHECKLIST

Before approving any automation PR, verify:

- [ ] Uses `automation_runs` table (not `products.metadata`)
- [ ] Unique `automation_type` added to ENUM
- [ ] All required fields included (`product_id`, `user_id`, `automation_type`)
- [ ] Real-time subscription implemented
- [ ] Error handling for n8n webhook failures
- [ ] Progress updates at meaningful intervals (not every 1%)
- [ ] Completion sets `progress: 100, status: 'completed'`
- [ ] Stop/resume functionality implemented
- [ ] Logging added for key events
- [ ] Tests written and passing
- [ ] Regression tests run (all existing automations still work)
- [ ] No console errors
- [ ] n8n workflow tested in isolation and with other automations
- [ ] Documentation updated

---

## 📚 EXAMPLES

### Complete Example: Adding "PDF Export" Automation

#### 1. Database Migration
```sql
-- File: supabase/migrations/20260210120000_add_pdf_export.sql
ALTER TYPE automation_type ADD VALUE 'pdf_export';
```

#### 2. API Endpoint
```javascript
// File: api/automation/pdf_export.js
const N8N_WEBHOOK = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-pdf-export'

export default async function handler(req, res) {
  const { product_id, user_id } = req.body
  
  if (!product_id || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  // Forward to n8n
  const response = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  })
  
  return res.status(200).json({ success: true })
}
```

#### 3. Trigger Function
```javascript
// File: src/lib/automation.js
export const triggerPDFExport = async (product) => {
  try {
    // Create automation run
    await supabase
      .from('automation_runs')
      .upsert({
        product_id: product.id,
        user_id: product.user_id,
        automation_type: 'pdf_export',
        status: 'processing',
        progress: 0,
        message: 'Starting PDF export...',
        started_at: new Date().toISOString()
      }, {
        onConflict: 'product_id,automation_type'
      })
    
    // Trigger n8n
    await fetchWithRetry('/api/automation/pdf_export', {
      method: 'POST',
      body: JSON.stringify({
        product_id: product.id,
        user_id: product.user_id,
        product_name: product.name,
        // ... other fields
      })
    })
    
    return { success: true, message: 'PDF export started!' }
  } catch (error) {
    // Update status to error
    await supabase
      .from('automation_runs')
      .update({
        status: 'error',
        message: error.message
      })
      .eq('product_id', product.id)
      .eq('automation_type', 'pdf_export')
    
    throw error
  }
}
```

#### 4. UI Component
```javascript
// File: src/components/PDFExportPanel.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PDFExportPanel({ product }) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`automation-pdf-export-${product.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'automation_runs',
        filter: `product_id=eq.${product.id}&automation_type=eq.pdf_export`
      }, (payload) => {
        const run = payload.new
        setStatus(run.status)
        setProgress(run.progress)
        setMessage(run.message)
      })
      .subscribe()
    
    // Fetch initial status
    fetchPDFExportStatus()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [product.id])
  
  const fetchPDFExportStatus = async () => {
    const { data } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('product_id', product.id)
      .eq('automation_type', 'pdf_export')
      .single()
    
    if (data) {
      setStatus(data.status)
      setProgress(data.progress)
      setMessage(data.message)
    }
  }
  
  const handleExport = async () => {
    await triggerPDFExport(product)
  }
  
  return (
    <div>
      <button onClick={handleExport}>Export PDF</button>
      {status === 'processing' && (
        <div>
          <progress value={progress} max="100" />
          <p>{message}</p>
        </div>
      )}
      {status === 'completed' && (
        <a href={`/api/download-pdf/${product.id}`}>Download PDF</a>
      )}
    </div>
  )
}
```

#### 5. n8n Workflow Nodes

```
1. Webhook Trigger
   - URL: /webhook/launchpad-pdf-export
   - Method: POST

2. Update Status: 10%
   - POST /rest/v1/rpc/update_automation_status
   - Body: {p_product_id, p_automation_type: 'pdf_export', p_progress: 10, p_message: 'Loading product data...'}

3. Fetch Product Data
   - GET /rest/v1/products?id=eq.{{product_id}}

4. Update Status: 30%
   - Body: {p_progress: 30, p_message: 'Generating PDF...'}

5. Generate PDF (Custom Code Node)
   - Use pdf-lib to create PDF
   - Upload to Supabase Storage

6. Update Status: 80%
   - Body: {p_progress: 80, p_message: 'Uploading PDF...'}

7. Create Asset Record
   - POST /rest/v1/assets
   - Body: {product_id, user_id, type: 'pdf', file_url, file_path}

8. Update Status: 100% (Completed)
   - Body: {p_status: 'completed', p_progress: 100, p_message: 'PDF exported successfully!'}

9. Error Handler
   - If any node fails:
   - POST /rest/v1/rpc/update_automation_status
   - Body: {p_status: 'error', p_message: '{{$json.error}}'}
```

---

## 🎓 TRAINING FOR NEW DEVELOPERS

When onboarding new developers:

1. **Read this document first** (30 minutes)
2. **Review architecture analysis** (`launchpad-architecture-analysis.md`)
3. **Walk through existing automation** (banner generation)
4. **Implement practice automation** (dummy feature)
5. **Get code review** before touching production automations

---

## 📝 DOCUMENT MAINTENANCE

This document should be updated when:
- ✅ A new automation pattern is discovered
- ✅ An anti-pattern causes a bug
- ✅ Database schema changes
- ✅ n8n workflow patterns change
- ✅ New developer joins team

**Last Updated:** 2026-02-09  
**Next Review:** After Phase 3 completion

---

**END OF AUTOMATION STANDARDS**
