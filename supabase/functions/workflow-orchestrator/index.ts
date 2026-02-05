// LaunchPad Workflow Orchestrator
// Auto-triggers n8n workflows based on product status changes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const N8N_URL = Deno.env.get('N8N_URL') || 'https://n8n.srv1300789.hstgr.cloud'

// n8n Workflow IDs
const WORKFLOWS = {
  RESEARCH_AND_BANNERS: '844mhSDdyOFw2VjR',
  LANDING_PAGES: 'R5BNSIyOSO9fBc1D',
  // UGC_VIDEOS: 't0Hee5bhOaOqwbMv', // TODO: Get correct workflow ID from Guy
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
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload: WebhookPayload = await req.json()
    console.log('Workflow Orchestrator triggered:', payload.type, payload.record?.id)

    const product = payload.record
    const oldProduct = payload.old_record

    // Skip if not a status change
    if (payload.type === 'UPDATE' && product.status === oldProduct?.status) {
      console.log('No status change detected, skipping')
      return new Response(JSON.stringify({ message: 'No action needed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Handle status changes
    switch (product.status) {
      case 'new':
        console.log(`Product ${product.id} is NEW - triggering research & banner generation`)
        await triggerResearchAndBanners(product)
        
        // Update status to show we're processing
        await supabase
          .from('products')
          .update({ 
            status: 'banner_gen',
            metadata: { ...product.metadata, workflow_started_at: new Date().toISOString() }
          })
          .eq('id', product.id)
        break

      case 'banner_gen':
        // This status is set automatically when research starts
        // The n8n workflow will update to 'landing_page' when banners are done
        console.log(`Product ${product.id} is generating banners...`)
        break

      case 'landing_page':
        console.log(`Product ${product.id} banners complete - triggering landing page generation`)
        await triggerLandingPages(product)
        break

      case 'review':
        // Ready for Guy to review
        console.log(`Product ${product.id} is ready for review`)
        await notifyGuy(product, 'Product ready for review')
        break

      case 'ready':
        // Guy approved, ready to deploy
        console.log(`Product ${product.id} approved and ready to deploy`)
        await notifyGuy(product, 'Product approved! Ready to deploy to Shopify/Meta')
        break

      case 'live':
        // Product is live
        console.log(`Product ${product.id} is now LIVE! 🚀`)
        await notifyGuy(product, `🚀 ${product.name} is now LIVE!`)
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
    console.error('Workflow Orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// WORKFLOW TRIGGER FUNCTIONS
// ============================================

async function triggerResearchAndBanners(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-banner-gen`
  
  console.log(`Triggering Research & Banners workflow for ${product.id}`)
  
  const payload = {
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    niche: product.niche || 'General',
    language: product.language || 'English',
    country: product.country || 'United States',
    gender: product.gender || 'All',
    productImageUrl: product.product_image_url || '',
    amazonLink: product.amazon_link || '',
    competitorLink1: product.competitor_link_1 || '',
    competitorLink2: product.competitor_link_2 || '',
    supplierUrl: product.supplier_url || product.aliexpress_link || '',
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to trigger research workflow: ${response.statusText}`)
  }

  const result = await response.json()
  console.log('Research workflow triggered successfully:', result)
  return result
}

async function triggerLandingPages(product: Product) {
  const webhookUrl = `${N8N_URL}/webhook/launchpad-landing-page-gen`
  
  console.log(`Triggering Landing Pages workflow for ${product.id}`)
  
  // Get research data from product metadata (stored by research workflow)
  const researchData = product.metadata?.research || {}
  
  const payload = {
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    niche: product.niche || 'General',
    language: product.language || 'English',
    country: product.country || 'United States',
    researchData, // Pass research insights to landing page generator
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to trigger landing page workflow: ${response.statusText}`)
  }

  const result = await response.json()
  console.log('Landing page workflow triggered successfully:', result)
  return result
}

async function notifyGuy(product: Product, message: string) {
  // TODO: Integrate with Telegram Bot API to send messages to Guy
  // For now, just log
  console.log(`📱 NOTIFY GUY: ${message} | Product: ${product.name} (${product.id})`)
  
  // Could also create a notification record in the database
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
