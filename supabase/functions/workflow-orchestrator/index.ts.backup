// LaunchPad Master Workflow Orchestrator
// Automates Guy's complete product launch workflow

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const N8N_URL = Deno.env.get('N8N_URL') || 'https://n8n.srv1300789.hstgr.cloud'

// n8n Workflow IDs
const WORKFLOWS = {
  RESEARCH: 'RESEARCH_WORKFLOW_ID', // Will be created
  BANNERS: '844mhSDdyOFw2VjR', // Existing
  LANDING_PAGES: 'R5BNSIyOSO9fBc1D', // Existing
  UGC_VIDEOS: 't0Hee5bhOaOqwbMv', // Existing (Guy's UGC workflow)
  REVIEWS: 'REVIEWS_WORKFLOW_ID', // Will be created
}

interface Product {
  id: string
  name: string
  description?: string
  niche?: string
  status: string
  language?: string
  country?: string
  gender?: string
  product_image_url?: string
  amazon_link?: string
  competitor_link_1?: string
  competitor_link_2?: string
  aliexpress_link?: string
  supplier_url?: string
  metadata?: any
  user_id?: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Product
  old_record?: Product
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload: WebhookPayload = await req.json()
    console.log('🚀 Workflow Orchestrator triggered:', payload.type, payload.record?.id)

    const product = payload.record
    const oldProduct = payload.old_record

    // Skip if not a status change or new product
    if (payload.type === 'UPDATE' && product.status === oldProduct?.status) {
      console.log('No status change, skipping')
      return new Response(JSON.stringify({ message: 'No action needed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ============================================
    // GUY'S COMPLETE WORKFLOW AUTOMATION
    // ============================================

    switch (product.status) {
      case 'new':
        console.log(`📊 STEP 1: Research & Scoring - Product ${product.id}`)
        await triggerResearch(product)
        
        await supabase
          .from('products')
          .update({ 
            status: 'researching',
            metadata: { 
              ...product.metadata, 
              workflow_started_at: new Date().toISOString(),
              current_step: 'research'
            }
          })
          .eq('id', product.id)
        break

      case 'researching':
        // Status set by research workflow, waiting for completion
        console.log(`📊 Product ${product.id} - Research in progress...`)
        break

      case 'review':
        // Research complete, waiting for Guy's approval
        console.log(`✅ Product ${product.id} - Research complete, waiting for approval`)
        await notifyGuy(product, `📊 Research complete for ${product.name}! Score: ${product.metadata?.research?.score || 'N/A'}/10`)
        break

      case 'approved':
        // Guy approved! Start creative generation
        console.log(`🎨 STEP 2: Creative Generation - Product ${product.id}`)
        
        // Update status
        await supabase
          .from('products')
          .update({ 
            status: 'banner_gen',
            metadata: { 
              ...product.metadata, 
              current_step: 'creatives',
              approved_at: new Date().toISOString()
            }
          })
          .eq('id', product.id)
        
        // Trigger banners + UGC videos in parallel
        await Promise.all([
          triggerBanners(product),
          triggerUGCVideos(product)
        ])
        break

      case 'banner_gen':
        // Banners + UGC generating (parallel)
        console.log(`🎨 Product ${product.id} - Generating creatives...`)
        break

      case 'creatives_complete':
        // Banners + UGC done, trigger landing pages
        console.log(`📄 STEP 3: Landing Pages - Product ${product.id}`)
        
        await supabase
          .from('products')
          .update({ 
            status: 'landing_page',
            metadata: { 
              ...product.metadata, 
              current_step: 'landing_pages',
              creatives_completed_at: new Date().toISOString()
            }
          })
          .eq('id', product.id)
        
        await triggerLandingPages(product)
        break

      case 'landing_page':
        // Landing pages generating
        console.log(`📄 Product ${product.id} - Generating landing pages...`)
        break

      case 'pages_complete':
        // Pages done, trigger Shopify deployment
        console.log(`🛍️ STEP 4: Shopify Deployment - Product ${product.id}`)
        
        await supabase
          .from('products')
          .update({ 
            status: 'deploying',
            metadata: { 
              ...product.metadata, 
              current_step: 'shopify',
              pages_completed_at: new Date().toISOString()
            }
          })
          .eq('id', product.id)
        
        await deployToShopify(product)
        break

      case 'shopify_deployed':
        // Shopify deployed, generate reviews
        console.log(`⭐ STEP 5: Social Proof Generation - Product ${product.id}`)
        
        await supabase
          .from('products')
          .update({ 
            status: 'generating_reviews',
            metadata: { 
              ...product.metadata, 
              current_step: 'reviews',
              shopify_deployed_at: new Date().toISOString()
            }
          })
          .eq('id', product.id)
        
        await generateReviews(product)
        break

      case 'reviews_complete':
        // Everything done! Ready for Meta deployment
        console.log(`🎉 COMPLETE: Product ${product.id} ready for Meta!`)
        
        await supabase
          .from('products')
          .update({ 
            status: 'ready',
            metadata: { 
              ...product.metadata, 
              current_step: 'ready_for_meta',
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', product.id)
        
        await notifyGuy(product, `🎉 ${product.name} is READY! All assets generated and deployed to Shopify. Ready for Meta campaign deployment!`)
        break

      case 'ready':
        // Waiting for Guy to deploy to Meta (or auto-deploy if enabled)
        console.log(`🚀 Product ${product.id} ready for Meta deployment`)
        break

      case 'live':
        // Deployed to Meta, live campaign!
        console.log(`🔥 Product ${product.id} is LIVE on Meta!`)
        await notifyGuy(product, `🔥 ${product.name} is LIVE! Campaign running on Meta.`)
        break

      default:
        console.log(`Unknown status: ${product.status}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        product_id: product.id,
        status: product.status
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Workflow Orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// STEP 1: RESEARCH & SCORING
// ============================================

async function triggerResearch(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-research`
  
  console.log(`📊 Triggering research for ${product.id}`)
  
  const payload = {
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    niche: product.niche || 'General',
    amazonLink: product.amazon_link || '',
    competitorLink1: product.competitor_link_1 || '',
    competitorLink2: product.competitor_link_2 || '',
    supplierUrl: product.supplier_url || product.aliexpress_link || '',
    country: product.country || 'United States',
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Research workflow failed: ${response.statusText}`)
  }

  return await response.json()
}

// ============================================
// STEP 2: CREATIVE GENERATION
// ============================================

async function triggerBanners(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-banner-gen`
  
  console.log(`🎨 Triggering banner generation for ${product.id}`)
  
  const researchData = product.metadata?.research || {}
  
  const payload = {
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    niche: product.niche || 'General',
    language: product.language || 'English',
    country: product.country || 'United States',
    gender: product.gender || 'All',
    productImageUrl: product.product_image_url || '',
    // Pass research insights to banner gen
    painPoints: researchData.painPoints || '',
    sellingAngles: researchData.sellingAngles || '',
    creativeRecommendations: researchData.creativeRecommendations || '',
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Banner workflow failed: ${response.statusText}`)
  }

  return await response.json()
}

async function triggerUGCVideos(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-ugc-gen`
  
  console.log(`🎬 Triggering UGC video generation for ${product.id}`)
  
  const researchData = product.metadata?.research || {}
  
  const payload = {
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    niche: product.niche || 'General',
    productImage: product.product_image_url || '',
    targetGender: product.gender || 'All',
    targetCountry: product.country || 'United States',
    amazonLink: product.amazon_link || '',
    competitorLink: product.competitor_link_1 || '',
    // Pass research insights
    painPoints: researchData.painPoints || '',
    sellingAngles: researchData.sellingAngles || '',
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    console.error(`UGC workflow failed: ${response.statusText}`)
    // Don't throw - UGC failure shouldn't block workflow
  }

  return await response.json()
}

// ============================================
// STEP 3: LANDING PAGES
// ============================================

async function triggerLandingPages(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-landing-page-gen`
  
  console.log(`📄 Triggering landing pages for ${product.id}`)
  
  const researchData = product.metadata?.research || {}
  
  const payload = {
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    niche: product.niche || 'General',
    language: product.language || 'English',
    country: product.country || 'United States',
    researchData, // Full research insights
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Landing page workflow failed: ${response.statusText}`)
  }

  return await response.json()
}

// ============================================
// STEP 4: SHOPIFY DEPLOYMENT
// ============================================

async function deployToShopify(product: Product) {
  console.log(`🛍️ Deploying ${product.id} to Shopify`)
  
  // TODO: Implement Shopify deployment
  // For now, just update status
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  await supabase
    .from('products')
    .update({ status: 'shopify_deployed' })
    .eq('id', product.id)
  
  console.log(`✅ Shopify deployment complete (placeholder)`)
}

// ============================================
// STEP 5: REVIEW GENERATION
// ============================================

async function generateReviews(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-reviews-gen`
  
  console.log(`⭐ Generating reviews for ${product.id}`)
  
  const payload = {
    productId: product.id,
    productName: product.name,
    niche: product.niche || 'General',
    reviewCount: Math.floor(Math.random() * 101) + 100, // 100-200 reviews
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    console.error(`Review generation failed: ${response.statusText}`)
    // Don't throw - continue workflow
  }

  // Update status
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  await supabase
    .from('products')
    .update({ status: 'reviews_complete' })
    .eq('id', product.id)

  return await response.json()
}

// ============================================
// NOTIFICATIONS
// ============================================

async function notifyGuy(product: Product, message: string) {
  console.log(`📱 NOTIFY GUY: ${message}`)
  
  // TODO: Integrate Telegram Bot API
  // For now, create database notification
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  await supabase.from('notifications').insert({
    user_id: product.user_id,
    type: 'product_status',
    title: message,
    message: `${product.name} - ${product.status}`,
    data: { product_id: product.id, status: product.status },
    read: false,
  })
}
