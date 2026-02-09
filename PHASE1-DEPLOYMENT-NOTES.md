# Phase 1 Deployment Notes
**Date:** 2026-02-09  
**Status:** ✅ READY FOR TESTING

---

## ✅ COMPLETED STEPS

### 1. Database Migration
- ✅ Created `automation_runs` table with ENUMs (automation_type, automation_status)
- ✅ Added RLS policies for user access control
- ✅ Created helper functions:
  - `get_or_create_automation_run(product_id, user_id, automation_type)`
  - `update_automation_status(product_id, automation_type, status, progress, message)`
- ✅ Migrated existing banner metadata from `products.metadata` to `automation_runs`
- ✅ Verified table exists and has data (1 record found)

### 2. Code Updates
- ✅ Updated `src/lib/automation.js`:
  - `triggerBannerGeneration()` → writes to `automation_runs`
  - `updateBannerAutomationStatus()` → new function for banner-specific updates
  - `subscribeToAutomationUpdates()` → reads from `automation_runs` (filter: automation_type=banner)
  - Kept `updateProductAutomationStatus()` for Phase 2/3 automations
- ✅ `src/components/AutomationProgress.jsx` already uses `subscribeToAutomationUpdates()`
- ✅ Committed changes to branch `refactor-automation-isolation`

### 3. n8n Workflow Update
- ✅ Workflow: `844mhSDdyOFw2VjR` - "✔️ LaunchPad: Product Research + Banners - david"
- ✅ Updated "Increment & Check Counter" node:
  - Now reads from `automation_runs` table (NOT `products.metadata`)
  - Uses atomic RPC function `update_automation_status()` for thread-safe updates
  - Counts banners from `assets` table (source of truth)
  - Updates `automation_runs` with progress/status
  - Still updates `products.status` to 'landing_page' when complete
- ✅ Updated via n8n API at 2026-02-09T21:39:47.635Z

---

## ⚠️ CRITICAL: MANUAL STEP REQUIRED

### **YOU MUST OPEN n8n WORKFLOW IN UI AND SAVE IT**

**Why:** Workflows updated via API **DON'T REGISTER WEBHOOKS**. The webhook trigger won't work until you manually save in the UI.

**Steps:**
1. Open n8n: https://n8n.srv1300789.hstgr.cloud
2. Navigate to workflow: `844mhSDdyOFw2VjR`
3. Click "Save" button (even though nothing changed)
4. Toggle "Active" OFF and back ON
5. Test webhook:
   ```bash
   curl -X POST https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen \
     -H "Content-Type: application/json" \
     -d '{"product_id":"test","user_id":"test","name":"Test Product"}'
   ```
6. Check n8n logs - should see execution start

**Reference:** See `/home/node/clawd/launchpad-app/REFACTOR-PLAN.md` Section 2.3

---

## 📋 TESTING CHECKLIST

### Before Deployment
- [ ] Open n8n workflow in UI and click "Save"
- [ ] Test webhook responds (curl test above)
- [ ] Verify `automation_runs` table structure in Supabase dashboard

### After Vercel Deployment
- [ ] Create test product in LaunchPad
- [ ] Click "Generate Banners" button
- [ ] Verify:
  - ✅ `automation_runs` record created with `automation_type='banner'`
  - ✅ Status updates from `idle` → `processing`
  - ✅ Progress updates in real-time (UI shows percentage)
  - ✅ Banners appear in assets table with `type='banner'`
  - ✅ Final status = `completed`, progress = 100
  - ✅ No errors in browser console
  - ✅ No errors in n8n execution logs

### Simultaneous Generation Test
- [ ] Create 2 test products (Product A, Product B)
- [ ] Click "Generate Banners" on **BOTH** within 5 seconds
- [ ] Verify:
  - ✅ Both have separate records in `automation_runs`
  - ✅ Both progress independently (no overwrites)
  - ✅ Both complete successfully
  - ✅ No conflicts or race conditions

### Phase 2/3 Compatibility Test
- [ ] Trigger landing page generation (uses OLD system - `products.metadata`)
- [ ] Verify:
  - ✅ Landing page generation still works
  - ✅ Uses `products.metadata.landing_page_status`
  - ✅ Does NOT conflict with banner automation
  - ✅ Can run simultaneously with banner generation

---

## 🔍 DATABASE VERIFICATION QUERIES

Run these in Supabase SQL Editor to verify Phase 1:

```sql
-- 1. Check automation_runs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'automation_runs'
ORDER BY ordinal_position;

-- 2. Check ENUM values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'automation_type'::regtype;

SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'automation_status'::regtype;

-- 3. List all automation runs
SELECT 
  id,
  product_id,
  automation_type,
  status,
  progress,
  message,
  created_at,
  updated_at
FROM automation_runs
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Count banners by product (should match automation_runs progress)
SELECT 
  p.id,
  p.name,
  ar.status,
  ar.progress,
  COUNT(a.id) as banner_count
FROM products p
LEFT JOIN automation_runs ar ON p.id = ar.product_id AND ar.automation_type = 'banner'
LEFT JOIN assets a ON p.id = a.product_id AND a.type = 'banner'
GROUP BY p.id, p.name, ar.status, ar.progress
HAVING COUNT(a.id) > 0 OR ar.status IS NOT NULL;

-- 5. Verify RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'automation_runs';
```

---

## 📊 SUCCESS CRITERIA

**Phase 1 is successful if ALL of these are true:**

- ✅ Banner generation creates record in `automation_runs` (NOT `products.metadata`)
- ✅ Progress updates write to `automation_runs.progress` and `automation_runs.message`
- ✅ Real-time updates work in UI (progress bar updates smoothly)
- ✅ Banners saved to `assets` table with correct `product_id` and `type='banner'`
- ✅ Final status = `completed`, progress = 100%
- ✅ Can run banner generation on 2 products simultaneously without conflicts
- ✅ `products.metadata` does NOT contain `automation_status` for new banner generations
- ✅ Landing page automation still works (uses old `products.metadata` system)
- ✅ No errors in browser console
- ✅ No errors in n8n execution logs

---

## 🚀 DEPLOYMENT COMMANDS

### Deploy to Vercel
```bash
cd /home/node/clawd/launchpad-app
git push origin refactor-automation-isolation
# Vercel will auto-deploy from branch
```

**Vercel URL:** https://launchpad-app-git-refactor-automation-isolation-guys-projects-xxx.vercel.app

### Monitor Deployment
- Vercel Dashboard: https://vercel.com/guys-projects/launchpad-app
- Check deployment logs for errors
- Test immediately after deployment goes live

---

## ⏭️ NEXT STEPS (Phase 2 - NOT STARTED YET)

**DO NOT proceed to Phase 2 until:**
1. Phase 1 tests all pass (see checklist above)
2. You've used the app for 24 hours with no issues
3. You explicitly approve moving to Phase 2

**Phase 2 Scope:**
- Migrate landing page generation to `automation_runs`
- Update `triggerLandingPageGeneration()` function
- Update n8n landing page workflow
- Test banners + landing pages running simultaneously

---

## 🔄 ROLLBACK PROCEDURE

If anything goes wrong:

```bash
cd /home/node/clawd/launchpad-app

# 1. Stop all n8n workflows
# (Manual: go to n8n and stop active executions)

# 2. Switch back to main branch
git checkout main

# 3. Deploy main branch to Vercel
git push origin main -f

# 4. Run rollback SQL (if needed)
# (See: supabase/migrations/ROLLBACK-automation-runs.sql)
# This restores products.metadata from automation_runs

# 5. Verify rollback
# - Banner generation works again (old system)
# - No errors in console
```

---

**END OF PHASE 1 DEPLOYMENT NOTES**
