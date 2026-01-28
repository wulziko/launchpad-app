/**
 * Automation Integration for LaunchPad
 * Handles n8n webhook triggers and real-time progress updates
 */

import { supabase } from './supabase'

// n8n webhook configuration
const N8N_BASE_URL = 'https://n8n.srv1300789.hstgr.cloud'
const N8N_WEBHOOK_PATH = '/webhook/launchpad-banner-gen'

/**
 * Trigger n8n workflow for a product
 * This is called when product status changes to trigger automation
 */
export const triggerBannerGeneration = async (product) => {
  try {
    // First, update product status to show it's processing
    await updateProductAutomationStatus(product.id, {
      automation_status: 'processing',
      automation_started_at: new Date().toISOString(),
      automation_progress: 0,
      automation_message: 'Starting banner generation...'
    })

    // Prepare payload for n8n
    // Product ID is the universal connector - can be used to link with any 3rd party
    const payload = {
      // Universal Product ID - links to all external systems
      product_id: product.id,
      
      // Core product info
      name: product.name,
      description: product.description || '',
      niche: product.niche || '',
      
      // Localization
      language: product.language || product.metadata?.language || 'English',
      country: product.country || product.metadata?.country || 'United States',
      gender: product.gender || product.metadata?.gender || 'All',
      target_audience: product.targetAudience || product.metadata?.targetAudience || '',
      
      // Research links
      amazon_link: product.amazon_link || product.metadata?.amazon_link || '',
      competitor_link_1: product.competitor_link_1 || product.metadata?.competitor_link_1 || '',
      competitor_link_2: product.competitor_link_2 || product.metadata?.competitor_link_2 || '',
      
      // Product image for banner generation
      product_image_url: product.product_image_url || product.metadata?.product_image_url || '',
      
      // External IDs for 3rd party integrations (future-proofing)
      external_ids: product.external_ids || product.metadata?.external_ids || {},
      
      // Supabase config for n8n to update progress
      supabase_url: import.meta.env.VITE_SUPABASE_URL,
      supabase_project_ref: 'rxtcssesqwooggydfkvs',
    }

    // Trigger n8n webhook
    const response = await fetch(`${N8N_BASE_URL}${N8N_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`)
    }

    return { success: true, message: 'Banner generation started!' }
  } catch (error) {
    console.error('Failed to trigger banner generation:', error)
    
    // Update status to error
    await updateProductAutomationStatus(product.id, {
      automation_status: 'error',
      automation_message: error.message
    })
    
    throw error
  }
}

/**
 * Update product automation status
 * This is called by both the frontend and n8n (via Supabase REST API)
 */
export const updateProductAutomationStatus = async (productId, updates) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Fetch current metadata and merge manually
  const { data: current, error: fetchError } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', productId)
    .single()
  
  if (fetchError) throw fetchError
  
  const newMetadata = { ...(current?.metadata || {}), ...updates }
  
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({ 
      metadata: newMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .select()
    .single()
  
  if (updateError) throw updateError
  return updated
}

/**
 * Subscribe to real-time automation updates for a product
 * Watches both products (for progress) and assets (for new banners)
 * Returns an unsubscribe function
 */
export const subscribeToAutomationUpdates = (productId, callback) => {
  if (!supabase) {
    console.warn('Supabase not configured, cannot subscribe to updates')
    return () => {}
  }

  // Track latest state to merge updates
  let latestState = {
    status: 'idle',
    progress: 0,
    message: '',
    banners: []
  }

  // Helper to fetch latest banners
  const fetchBanners = async () => {
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('product_id', productId)
      .eq('type', 'banner')
      .order('created_at', { ascending: true })
    
    return (data || []).map(asset => ({
      id: asset.id,
      url: asset.file_url,
      name: asset.name,
      created_at: asset.created_at,
      metadata: asset.metadata
    }))
  }

  const channel = supabase
    .channel(`product-automation-${productId}`)
    // Watch product updates (for progress)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
        filter: `id=eq.${productId}`
      },
      async (payload) => {
        const metadata = payload.new.metadata || {}
        
        // Fetch latest banners from assets
        const banners = await fetchBanners()
        
        latestState = {
          status: metadata.automation_status || latestState.status,
          progress: metadata.automation_progress || latestState.progress,
          message: metadata.automation_message || latestState.message,
          startedAt: metadata.automation_started_at,
          completedAt: metadata.automation_completed_at,
          banners: banners,
          landingPageUrl: metadata.generated_landing_page_url,
        }
        callback(latestState)
      }
    )
    // Watch asset inserts (for new banners)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'assets',
        filter: `product_id=eq.${productId}`
      },
      async (payload) => {
        if (payload.new.type === 'banner') {
          // Fetch all banners to get complete list
          const banners = await fetchBanners()
          latestState.banners = banners
          callback(latestState)
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get automation status for a product
 * Fetches both metadata (for progress) and assets (for generated banners)
 */
export const getAutomationStatus = async (productId) => {
  if (!supabase) return null
  
  // Fetch product metadata and assets in parallel
  const [productResult, assetsResult] = await Promise.all([
    supabase
      .from('products')
      .select('metadata')
      .eq('id', productId)
      .single(),
    supabase
      .from('assets')
      .select('*')
      .eq('product_id', productId)
      .eq('type', 'banner')
      .order('created_at', { ascending: true })
  ])

  if (productResult.error) throw productResult.error
  
  const metadata = productResult.data?.metadata || {}
  const assets = assetsResult.data || []
  
  // Map assets to banner format for the UI
  const banners = assets.map(asset => ({
    id: asset.id,
    url: asset.file_url,
    name: asset.name,
    created_at: asset.created_at,
    metadata: asset.metadata
  }))
  
  return {
    status: metadata.automation_status || 'idle',
    progress: metadata.automation_progress || 0,
    message: metadata.automation_message || '',
    startedAt: metadata.automation_started_at,
    completedAt: metadata.automation_completed_at,
    banners: banners, // From assets table (source of truth)
    landingPageUrl: metadata.generated_landing_page_url,
  }
}

/**
 * Add generated banner to product
 * Called by n8n when a banner is generated
 */
export const addGeneratedBanner = async (productId, banner) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  // Get current banners
  const { data: current } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', productId)
    .single()
  
  const currentBanners = current?.metadata?.generated_banners || []
  const newBanners = [...currentBanners, {
    ...banner,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  }]
  
  return updateProductAutomationStatus(productId, {
    generated_banners: newBanners
  })
}

/**
 * Mark automation as complete
 */
export const completeAutomation = async (productId, results = {}) => {
  return updateProductAutomationStatus(productId, {
    automation_status: 'completed',
    automation_progress: 100,
    automation_message: 'Generation complete!',
    automation_completed_at: new Date().toISOString(),
    ...results
  })
}

export default {
  triggerBannerGeneration,
  updateProductAutomationStatus,
  subscribeToAutomationUpdates,
  getAutomationStatus,
  addGeneratedBanner,
  completeAutomation
}
