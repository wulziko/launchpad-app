# n8n Workflow Update Guide - Phase 1
**Workflow:** ✔️ LaunchPad: Product Research + Banners - david  
**Workflow ID:** 844mhSDdyOFw2VjR  
**Date:** 2026-02-09

---

## ⚠️ CRITICAL: Manual Update Required

**Why manual?** Workflows updated via n8n API don't register webhooks properly. You must update in the n8n UI and click "Save" to generate webhook IDs.

---

## 🎯 What Needs to Change

The workflow currently writes automation status to `products.metadata` (old system). We need to update it to write to `automation_runs` table (new system, Phase 1).

**Node to update:** `Increment & Check Counter`

---

## 📝 Step-by-Step Instructions

### Step 1: Open Workflow in n8n UI

1. Go to https://n8n.srv1300789.hstgr.cloud
2. Navigate to **Workflows**
3. Open: **✔️ LaunchPad: Product Research + Banners - david**

---

### Step 2: Locate the "Increment & Check Counter" Node

This is the last node in the workflow (far right).

---

### Step 3: Replace the Code

**Current Code** (writes to `products.metadata`):

```javascript
// Build update metadata
const updateMeta = {
  ...currentMeta,
  automation_completed_banners: currentCount,
  automation_progress: isComplete ? 100 : Math.min(progress, 95),
  automation_message: isComplete 
    ? `Complete! Generated ${currentCount} banners` 
    : `Creating banners... (${currentCount}/${totalExpected})`,
  automation_status: isComplete ? 'completed' : 'processing'
};

if (isComplete) {
  updateMeta.automation_completed_at = new Date().toISOString();
}

// Build update body
const updateBody = {
  metadata: updateMeta
};

if (isComplete) {
  updateBody.status = 'landing_page';
}

// Update product
const updateResponse = await this.helpers.httpRequest({
  method: 'PATCH',
  url: `${supabaseUrl}/rest/v1/products?id=eq.${productId}`,
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: updateBody,
  json: true
});
```

**NEW Code** (writes to `automation_runs`):

```javascript
// PHASE 1: Update automation_runs table instead of products.metadata
const userId = $('Normalize Input').first().json.user_id;

// Build update for automation_runs
const automationUpdate = {
  status: isComplete ? 'completed' : 'processing',
  progress: isComplete ? 100 : Math.min(progress, 95),
  message: isComplete 
    ? `Complete! Generated ${currentCount} banners` 
    : `Creating banners... (${currentCount}/${totalExpected})`
};

if (isComplete) {
  automationUpdate.completed_at = new Date().toISOString();
}

console.log('🎯 PHASE 1: Updating automation_runs table');
console.log('Status:', automationUpdate.status);
console.log('Progress:', automationUpdate.progress);

// Update automation_runs using Postgres RPC function
try {
  const rpcResponse = await this.helpers.httpRequest({
    method: 'POST',
    url: `${supabaseUrl}/rest/v1/rpc/update_automation_status`,
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: {
      p_product_id: productId,
      p_automation_type: 'banner',
      p_status: automationUpdate.status,
      p_progress: automationUpdate.progress,
      p_message: automationUpdate.message
    },
    json: true
  });
  
  console.log('✅ automation_runs updated successfully');
  if (isComplete) {
    console.log('✅ BANNER GENERATION COMPLETED!');
  }
  
} catch (error) {
  console.error('❌ Failed to update automation_runs:', error.message);
  throw new Error(`Failed to update automation_runs: ${error.message}`);
}

// If complete, also update product status to 'landing_page' (for workflow progression)
if (isComplete) {
  try {
    await this.helpers.httpRequest({
      method: 'PATCH',
      url: `${supabaseUrl}/rest/v1/products?id=eq.${productId}`,
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'landing_page'
      },
      json: true
    });
    console.log('✅ Product status updated to landing_page');
  } catch (error) {
    console.warn('⚠️ Failed to update product status (non-critical):', error.message);
  }
}
```

---

### Step 4: Find and Replace the Exact Section

1. Click on the **Increment & Check Counter** node
2. Scroll to the section that starts with `// Build update metadata`
3. **Replace ONLY** the section from `// Build update metadata` to the end of the `httpRequest` call
4. **Keep** the first part (variables, getting current metadata)
5. **Keep** the final return statement

**Full Updated Code for "Increment & Check Counter" Node:**

```javascript
/**
 * PHASE 1: Increment counter and update automation_runs table
 */
const assetData = $input.first().json;
const productId = $('Normalize Input').first().json.product_id;
const userId = $('Normalize Input').first().json.user_id;
const totalExpected = 10;

const supabaseUrl = 'https://rxtcssesqwooggydfkvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4';

console.log('=== INCREMENT & CHECK COUNTER (PHASE 1) ===');
console.log('Product ID:', productId);

// Get current automation_runs record to check progress
const { data: currentRun } = await this.helpers.httpRequest({
  method: 'GET',
  url: `${supabaseUrl}/rest/v1/automation_runs?product_id=eq.${productId}&automation_type=eq.banner`,
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey
  },
  json: true
});

// Count how many banners have been created so far
const { data: existingBanners } = await this.helpers.httpRequest({
  method: 'GET',
  url: `${supabaseUrl}/rest/v1/assets?product_id=eq.${productId}&type=eq.banner&select=id`,
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey
  },
  json: true
});

const currentCount = existingBanners ? existingBanners.length : 0;
const progress = Math.round((currentCount / totalExpected) * 100);
const isComplete = currentCount >= totalExpected;

console.log(`Banner ${currentCount}/${totalExpected} complete (${progress}%)`);
console.log('Is Complete:', isComplete);

// Build update for automation_runs
const automationUpdate = {
  status: isComplete ? 'completed' : 'processing',
  progress: isComplete ? 100 : Math.min(progress, 95),
  message: isComplete 
    ? `Complete! Generated ${currentCount} banners` 
    : `Creating banners... (${currentCount}/${totalExpected})`
};

console.log('🎯 PHASE 1: Updating automation_runs table');
console.log('Status:', automationUpdate.status);
console.log('Progress:', automationUpdate.progress);

// Update automation_runs using Postgres RPC function
try {
  const rpcResponse = await this.helpers.httpRequest({
    method: 'POST',
    url: `${supabaseUrl}/rest/v1/rpc/update_automation_status`,
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: {
      p_product_id: productId,
      p_automation_type: 'banner',
      p_status: automationUpdate.status,
      p_progress: automationUpdate.progress,
      p_message: automationUpdate.message
    },
    json: true
  });
  
  console.log('✅ automation_runs updated successfully');
  if (isComplete) {
    console.log('✅ BANNER GENERATION COMPLETED!');
  }
  
} catch (error) {
  console.error('❌ Failed to update automation_runs:', error.message);
  throw new Error(`Failed to update automation_runs: ${error.message}`);
}

// If complete, also update product status to 'landing_page' (for workflow progression)
if (isComplete) {
  try {
    await this.helpers.httpRequest({
      method: 'PATCH',
      url: `${supabaseUrl}/rest/v1/products?id=eq.${productId}`,
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'landing_page'
      },
      json: true
    });
    console.log('✅ Product status updated to landing_page');
  } catch (error) {
    console.warn('⚠️ Failed to update product status (non-critical):', error.message);
  }
}

return {
  json: {
    product_id: productId,
    completed_count: currentCount,
    total_expected: totalExpected,
    is_complete: isComplete,
    automation_status: automationUpdate.status,
    asset: assetData
  }
};
```

---

### Step 5: Save and Test

1. Click **Save** (top right)
2. Toggle workflow **Active OFF** then **ON**
3. Test with a real product:
   ```bash
   # From terminal or Postman
   curl -X POST https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen \
     -H "Content-Type: application/json" \
     -d '{
       "id": "YOUR_TEST_PRODUCT_ID",
       "user_id": "YOUR_USER_ID",
       "name": "Test Product",
       "niche": "Beauty & Health",
       "country": "US",
       "language": "English",
       "gender": "All"
     }'
   ```

---

## ✅ Verification Checklist

After updating, verify:

- [ ] Workflow saves without errors
- [ ] Webhook URL is still `launchpad-banner-gen`
- [ ] Test execution shows logs: "🎯 PHASE 1: Updating automation_runs table"
- [ ] In Supabase, check `automation_runs` table has new record
- [ ] In LaunchPad UI, progress bar updates in real-time
- [ ] No errors in browser console
- [ ] Banner generation completes successfully

---

## 🚨 Rollback (If Needed)

If something breaks:

1. Open workflow in n8n
2. Click **Executions** (left sidebar)
3. Find last successful execution BEFORE your changes
4. Copy the old "Increment & Check Counter" code
5. Paste it back
6. Save and toggle Active OFF/ON

Original code is backed up in this file (see "Current Code" section above).

---

## 📞 Support

If you encounter issues:
- Check n8n execution logs for errors
- Verify Supabase RPC function exists: `update_automation_status`
- Confirm `automation_runs` table exists with correct schema
- Review Phase 1 migration status

**Database Connection String:**
```
https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/
```

**Test RPC Function:**
```bash
curl -X POST https://rxtcssesqwooggydfkvs.supabase.co/rest/v1/rpc/update_automation_status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4" \
  -H "Content-Type: application/json" \
  -d '{
    "p_product_id": "YOUR_PRODUCT_ID",
    "p_automation_type": "banner",
    "p_status": "processing",
    "p_progress": 50,
    "p_message": "Test update"
  }'
```

---

**END OF GUIDE**
