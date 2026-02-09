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
