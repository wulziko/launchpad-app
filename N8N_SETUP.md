# n8n + LaunchPad Integration Setup

## Overview

This document explains how to set up the n8n workflow integration with LaunchPad for automated landing page generation.

## Architecture

```
LaunchPad App → Vercel API Proxy → n8n Webhook → AI Processing → Supabase
     ↓                                                              ↓
  [Trigger]                                                   [Assets + Status]
```

## Workflow Created

- **Workflow ID:** `RE5QY77wdr7b3Obu`
- **Name:** LaunchPad - Landing Page Generator
- **Webhook URL:** `https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen`
- **Status:** ✅ Active

## What the Workflow Does

1. **Receives webhook** from LaunchPad when user clicks "Generate Banners"
2. **AI Research** - Analyzes product using Gemini 3 Pro (OpenRouter)
3. **Content Generation** - Creates advertorial + product page with Claude Sonnet
4. **HTML Building** - Constructs responsive landing pages
5. **Saves to Supabase** - Stores generated assets
6. **Updates Product Status** - Changes status to "review"

## Required Environment Variables in n8n

You need to set these in n8n (Settings → Environments → Variables):

```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NDUsImV4cCI6MjA4NTE2MDg0NX0.qz9EB3Vy12FRFiJbdymsj2VWn2Z8XnBsBnI5kECwEo0

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dGNzc2VzcXdvb2dneWRma3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4NDg0NSwiZXhwIjoyMDg1MTYwODQ1fQ.m0HFvrjSXy9XpBJlk_TelO6xig3XqsHlJJnPQysytL4
```

## LaunchPad Fields Mapping

| LaunchPad Database | n8n Workflow | Description |
|-------------------|--------------|-------------|
| `id` | `product_id` | Product UUID |
| `user_id` | `user_id` | Owner's user UUID |
| `name` | `product_name` | Product name |
| `niche` | `niche` | Product category |
| `country` | `country` | Target country |
| `language` | `language` | Output language |
| `gender` | `gender` | Target gender |
| `amazon_link` | `amazon_link` | Amazon research link |
| `competitor_link_1` | `competitor_link_1` | Competitor #1 |
| `competitor_link_2` | `competitor_link_2` | Competitor #2 |
| `source_url` | `aliexpress_link` | Supplier/AliExpress |
| `product_image_url` | `product_image` | Main product image |
| `status` | `status` | Current status |

## API Endpoint

LaunchPad uses a Vercel serverless function to proxy requests:

```
POST /api/trigger-banners
Content-Type: application/json

{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Product Name",
  "niche": "Beauty",
  "country": "US",
  "language": "English",
  "gender": "Female",
  "amazon_link": "https://...",
  "competitor_link_1": "https://...",
  "competitor_link_2": "https://...",
  "product_image_url": "https://...",
  "source_url": "https://...",
  "status": "new"
}
```

## Testing

1. Go to LaunchPad app
2. Create a product with filled fields (especially links + image)
3. Click "Generate Banners" button on product detail page
4. Watch the progress bar
5. Check Supabase `assets` table for generated content

## Troubleshooting

### Webhook not receiving data
- Check n8n workflow is active
- Verify webhook URL in `/api/trigger-banners.js`

### AI not generating content
- Check OpenRouter credentials in n8n
- Verify model availability (gemini-3-pro, claude-sonnet-4)

### Supabase not updating
- Verify environment variables are set in n8n
- Check RLS policies allow service_role to write

## Files Modified

- `/api/trigger-banners.js` - Updated API proxy
- `/src/lib/automation.js` - Updated trigger function
- `/vercel.json` - Added n8n to CSP
- `/n8n-launchpad-workflow.json` - Workflow definition

---

Last updated: 2026-01-28
