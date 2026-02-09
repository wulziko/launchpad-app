# n8n Workflow Update Instructions - Phase 1
**Workflow:** ✔️ LaunchPad: Product Research + Banners - david  
**Workflow ID:** 844mhSDdyOFw2VjR  
**Date:** 2026-02-09

## ⚠️ CRITICAL

The n8n API cannot reliably update workflows (webhooks don't register properly). You MUST update this workflow manually in the n8n UI.

---

## Changes Required

**Only ONE node needs to be updated:** `Increment & Check Counter`

This node currently writes banner progress to `products.metadata`. It needs to write to `automation_runs` table instead.

---

## Step-by-Step Instructions

### 1. Open the Workflow

1. Go to https://n8n.srv1300789.hstgr.cloud
2. Log in
3. Open workflow: **✔️ LaunchPad: Product Research + Banners - david**

### 2. Find the Node

Scroll to the right end of the workflow and click on the node named:
**"Increment & Check Counter"**

(It's a Code node, positioned after "Create Asset Record")

### 3. Replace the Code

**DELETE the existing code** and replace it with this:

```javascript
/**
 * PHASE 1: Update automation_runs table (not products.metadata)
 * Increments banner count and sets completion status
 */
const assetData = $input.first().json;
const normalizeData = $('Normalize Input').first().json;
const productId = normalizeData.product_id;
const userId = normalizeData.user_id;
const totalExpected = 10;

const supabaseUrl = 'https://rxtcssesqwooggydfkvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4';

console.log('=== INCREMENT BANNER COUNTER (PHASE 1) ===');
console.log('Product ID:', productId);

// Get current automation_runs record
const getCurrentRun = await this.helpers.httpRequest({
  method: 'GET',
  url: `${supabaseUrl}/rest/v1/automation_runs?product_id=eq.${productId}&automation_type=eq.banner&select=*`,
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey
  },
  json: true
});

let currentBannersCompleted = 0;
const runs = getCurrentRun;

if (runs && runs.length > 0) {
  // Extract from metadata if exists
  currentBannersCompleted = runs[0].metadata?.completed_banners || 0;
}

const newCount = currentBannersCompleted + 1;
const progress = Math.round((newCount / totalExpected) * 100);
const isComplete = newCount >= totalExpected;

console.log(`Banner ${newCount}/${totalExpected} complete (${progress}%)`);
console.log('Is Complete:', isComplete);

// Build update for automation_runs
const updateData = {
  status: isComplete ? 'completed' : 'processing',
  progress: progress,
  message: isComplete 
    ? `Complete! Generated ${newCount} banners`
    : `Creating banners... (${newCount}/${totalExpected})`,
  metadata: {
    completed_banners: newCount
  }
};

if (isComplete) {
  updateData.completed_at = new Date().toISOString();
}

console.log('Update data:', JSON.stringify(updateData, null, 2));

// Update automation_runs record
try {
  // Upsert to automation_runs table
  const upsertResponse = await this.helpers.httpRequest({
    method: 'POST',
    url: `${supabaseUrl}/rest/v1/automation_runs`,
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: {
      product_id: productId,
      user_id: userId,
      automation_type: 'banner',
      ...updateData
    },
    json: true
  });
  
  console.log('✅ automation_runs updated successfully');
  
  if (isComplete) {
    console.log('✅ STATUS SET TO COMPLETED');
    console.log('Verify:', JSON.stringify(upsertResponse));
  }
  
} catch (error) {
  console.error('❌ Update failed:', error.message);
  throw new Error(`Failed to update automation_runs: ${error.message}`);
}

return {
  json: {
    product_id: productId,
    completed_count: newCount,
    total_expected: totalExpected,
    is_complete: isComplete,
    automation_status: updateData.status,
    asset: assetData
  }
};
```

### 4. Save and Activate

1. Click **"Save"** in the top right
2. Ensure the workflow is **Active** (toggle should be ON/green)
3. Close the editor

---

## What Changed?

**BEFORE:**
- Read from `products.metadata` 
- Wrote banner count to `products.metadata.automation_completed_banners`
- Updated `products.metadata.automation_status`, `automation_progress`, `automation_message`

**AFTER:**
- Reads from `automation_runs` table (where `automation_type = 'banner'`)
- Writes banner count to `automation_runs.metadata.completed_banners`
- Updates `automation_runs.status`, `progress`, `message`

---

## Testing After Update

After saving the workflow:

1. Open LaunchPad app: https://launchpad.yourdomain.com
2. Create a test product
3. Click "Generate Banners"
4. Watch the AutomationProgress component
5. Verify:
   - Progress bar updates in real-time
   - Message updates (e.g., "Creating banners... (3/10)")
   - Completion shows "Complete! Generated 10 banners"
   - Banners appear in the UI

---

## Troubleshooting

### Progress not updating?

1. Open browser console (F12)
2. Check for errors
3. Verify automation_runs table has a record:
   ```sql
   SELECT * FROM automation_runs 
   WHERE product_id = 'YOUR_PRODUCT_ID' 
   AND automation_type = 'banner';
   ```

### Workflow failing?

1. Open n8n workflow
2. Click "Executions" tab
3. Find the failed execution
4. Check the "Increment & Check Counter" node logs
5. Look for error messages

---

## Rollback (If Needed)

If something breaks, you can rollback by reverting the node code to the old version that writes to `products.metadata`.

The old code is backed up in `/tmp/workflow.json` on the server.

---

**Last Updated:** 2026-02-09  
**Updated By:** David (AI Assistant)
