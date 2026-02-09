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
