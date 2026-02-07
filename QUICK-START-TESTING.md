# 🚀 Quick Start: Testing New LaunchPad Features

**Your LaunchPad now has 3 new automation workflows integrated!**

---

## 🎯 What's New

Three new tabs in every product detail page:

1. **Reviews** - Generate AI product reviews
2. **UGC Scripts** - Generate video scripts for ads
3. **Shopify** - Deploy to Cellux or Glow82

---

## ⚡ Test in 5 Minutes

### Step 1: Open LaunchPad
👉 https://launchpad-app-three.vercel.app/

Login: `guy` / `123123`

### Step 2: Open Any Product
Click on any product in your list.

### Step 3: Test Reviews
1. Click the **"Reviews"** tab
2. Click **"Generate Reviews"**
3. ✅ Wait ~30 seconds
4. ✅ See 10-15 AI-generated reviews appear
5. ✅ Try exporting to CSV or copying a review

### Step 4: Test UGC Scripts
1. Click the **"UGC Scripts"** tab
2. Click **"Generate Scripts"**
3. ✅ Wait ~45 seconds
4. ✅ See 5 video script variations
5. ✅ Expand a script to see Hook → Problem → Solution → Benefits → CTA
6. ✅ Copy a section

### Step 5: Test Shopify Deployment
1. Click the **"Shopify"** tab
2. Click **"Deploy to Cellux"** or **"Deploy to Glow82"**
3. ✅ Wait ~1-2 minutes
4. ✅ See deployment status
5. ✅ Get "View on Shopify" link when complete

---

## 🔧 If Something Doesn't Work

### Check n8n Workflows Are Active

1. Go to: https://n8n.srv1300789.hstgr.cloud/workflows
2. Make sure these workflows are **ACTIVE** (toggle ON):
   - `review-generation.json`
   - `ugc-script-generation.json`
   - `shopify-deployment.json`
   - `landing-page-generation.json`

### Re-register Webhooks (if needed)

If a workflow shows "success" in n8n but nothing happens in LaunchPad:

1. Open the workflow in n8n UI
2. Click **"Save"** (this re-registers the webhook)
3. Toggle OFF → ON
4. Try again in LaunchPad

### Test Webhooks Directly

```bash
# Test Reviews
curl -X POST https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-reviews \
  -H "Content-Type: application/json" \
  -d '{"product_id":"test","user_id":"123","name":"Test Product"}'

# Test UGC
curl -X POST https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-ugc-scripts \
  -H "Content-Type: application/json" \
  -d '{"product_id":"test","user_id":"123","name":"Test Product"}'

# Test Shopify
curl -X POST https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-shopify-deploy \
  -H "Content-Type: application/json" \
  -d '{"product_id":"test","user_id":"123","name":"Test Product","shopify_store":"cellux"}'
```

If these return errors, the workflows aren't properly set up.

---

## 📊 Where Results Are Saved

All results save to Supabase in the `products` table:

- **Reviews:** `metadata.reviews` (array)
- **UGC Scripts:** `metadata.ugc_scripts` (array)
- **Shopify URL:** `metadata.shopify_product_url` (string)
- **Status/Progress:** `metadata.review_status`, `metadata.ugc_status`, etc.

Check Supabase dashboard to verify data is being saved:
👉 https://supabase.com/dashboard/project/rxtcssesqwooggydfkvs

---

## 🎉 Success Looks Like

### Reviews Tab
```
⭐⭐⭐⭐⭐ Amazing Product!
"This product changed my life..."

⭐⭐⭐⭐⭐ Best Purchase Ever
"I can't believe how well this works..."

[Export CSV] [Export JSON] [Regenerate]
```

### UGC Scripts Tab
```
🎬 SKEPTIC ANGLE
⏱️ 45-60 seconds

🎣 HOOK (3-5s)
"I was skeptical at first, but..."

[Show Full Script] [Copy]
```

### Shopify Tab
```
✅ Deployment Complete
Deployed to Cellux store
[View on Shopify →]
```

---

## 💡 Tips

- **Reviews generate fast** (~30 seconds)
- **UGC scripts take longer** (~45 seconds)
- **Shopify deployment is slowest** (~1-2 minutes)
- Results persist - refresh page and they're still there
- Can regenerate anytime (old data is replaced)
- Export reviews to use in actual product listings

---

## 🤔 Questions?

If something doesn't work:
1. Check n8n workflows are active
2. Check Supabase for data
3. Check browser console for errors (F12)
4. Test webhooks directly with cURL

Everything is deployed and ready - just needs n8n workflows to be active!

---

**Ready to test?** 👉 https://launchpad-app-three.vercel.app/
