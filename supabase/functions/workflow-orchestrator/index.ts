// LaunchPad Workflow Orchestrator - Uses n8n Execution API
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const N8N_URL = Deno.env.get('N8N_URL') || 'https://n8n.srv1300789.hstgr.cloud'
const N8N_API_KEY = Deno.env.get('N8N_API_KEY')!

// Workflow IDs
const WORKFLOWS = {
  RESEARCH: 'kTmXHsTOD1sj5IoJ',
  BANNERS: '844mhSDdyOFw2VjR',
  LANDING_PAGES: 'R5BNSIyOSO9fBc1D',
  UGC_VIDEOS: 'h9mRhwnd1aJVJv6g',
  REVIEWS: 'Jb92xEYVD2uzZmLy',
}

interface Product {
  id: string
  name: string
  description?: string
  status: string
  niche?: string
  language?: string
  country?: string
  gender?: string
  metadata?: any
  [key: string]: any
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
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
    const product = payload.record
    const oldProduct = payload.old_record

    console.log('🎯 Workflow trigger:', payload.type, product.id, 'status:', product.status)

    // Skip if not a status change
    if (payload.type === 'UPDATE' && product.status === oldProduct?.status) {
      return new Response(JSON.stringify({ message: 'No status change' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ============================================
    // STATUS: NEW → RESEARCHING
    // ============================================
    if (product.status === 'new') {
      console.log('📊 New product → researching')
      
      // Update status first
      await supabase
        .from('products')
        .update({ 
          status: 'researching',
          metadata: { 
            ...product.metadata, 
            workflow_started_at: new Date().toISOString()
          }
        })
        .eq('id', product.id)
      
      // Trigger research workflow via n8n API
      console.log('🚀 Triggering research workflow...')
      
      const researchPayload = {
        productId: product.id,
        productName: product.name,
        productDescription: product.description || '',
        niche: product.niche || product.metadata?.niche || 'General',
        amazonLink: product.amazon_link || product.metadata?.amazon_link || '',
        competitorLink1: product.competitor_link_1 || product.metadata?.competitor_link_1 || '',
        competitorLink2: product.competitor_link_2 || product.metadata?.competitor_link_2 || '',
        supplierUrl: product.supplier_url || product.metadata?.supplier_url || '',
        country: product.country || product.metadata?.country || 'United States',
      }

      try {
        const researchResult = await fetch(`${N8N_URL}/webhook/launchpad-research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(researchPayload),
        })
        
        console.log('Research workflow response:', researchResult.status)
        
        if (!researchResult.ok) {
          console.error('Research workflow failed:', await researchResult.text())
        }
      } catch (error) {
        console.error('Research workflow error:', error.message)
        // Don't fail the whole function - continue anyway
      }
      
      return new Response(
        JSON.stringify({ success: true, product_id: product.id, status: 'researching' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // STATUS: APPROVED → BANNER_GEN
    // ============================================
    if (product.status === 'approved') {
      console.log('✅ Approved → banner_gen')
      
      await supabase
        .from('products')
        .update({ 
          status: 'banner_gen',
          metadata: { 
            ...product.metadata, 
            approved_at: new Date().toISOString()
          }
        })
        .eq('id', product.id)
      
      // Trigger banner generation
      console.log('🚀 Triggering banner generation...')
      
      const researchData = product.metadata?.research || {}
      const bannerPayload = {
        productId: product.id,
        productName: product.name,
        productDescription: product.description || '',
        niche: product.niche || product.metadata?.niche || 'General',
        language: product.language || product.metadata?.language || 'English',
        country: product.country || product.metadata?.country || 'United States',
        gender: product.gender || product.metadata?.gender || 'All',
        productImageUrl: product.product_image_url || product.metadata?.product_image_url || '',
        painPoints: researchData.painPoints || '',
        sellingAngles: researchData.sellingAngles || '',
        creativeRecommendations: researchData.creativeRecommendations || '',
      }

      try {
        const bannerResult = await fetch(`${N8N_URL}/webhook/launchpad-banner-gen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bannerPayload),
        })
        
        console.log('Banner workflow response:', bannerResult.status)
        
        if (!bannerResult.ok) {
          console.error('Banner workflow failed:', await bannerResult.text())
        }
      } catch (error) {
        console.error('Banner workflow error:', error.message)
      }

      // Trigger UGC generation in parallel
      console.log('🚀 Triggering UGC generation...')
      
      const ugcPayload = {
        productId: product.id,
        productName: product.name,
        productDescription: product.description || '',
        niche: product.niche || product.metadata?.niche || 'General',
        productImage: product.product_image_url || product.metadata?.product_image_url || '',
        targetGender: product.gender || product.metadata?.gender || 'All',
        targetCountry: product.country || product.metadata?.country || 'United States',
        amazonLink: product.amazon_link || product.metadata?.amazon_link || '',
        competitorLink: product.competitor_link_1 || product.metadata?.competitor_link_1 || '',
        painPoints: researchData.painPoints || '',
        sellingAngles: researchData.sellingAngles || '',
      }

      try {
        const ugcResult = await fetch(`${N8N_URL}/webhook/launchpad-ugc-gen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ugcPayload),
        })
        
        console.log('UGC workflow response:', ugcResult.status)
        
        if (!ugcResult.ok) {
          console.error('UGC workflow failed:', await ugcResult.text())
        }
      } catch (error) {
        console.error('UGC workflow error:', error.message)
      }
      
      return new Response(
        JSON.stringify({ success: true, product_id: product.id, status: 'banner_gen' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // For other statuses, just acknowledge
    return new Response(
      JSON.stringify({ 
        success: true, 
        product_id: product.id,
        status: product.status,
        message: 'Status received, no action taken'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
