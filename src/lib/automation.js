/**
 * Automation Integration for LaunchPad
 * Handles n8n webhook triggers and real-time progress updates
 */

import { supabase } from './supabase'
import { fetchWithRetry } from './retry'

// API proxy endpoints (avoids CORS issues)
// Uses Vercel serverless functions to proxy to n8n
const BANNER_API_URL = '/api/trigger-banners'
const MANAGE_EXECUTION_URL = '/api/manage-execution'

/**
 * Trigger n8n workflow for a product
 * This is called when product status changes to trigger automation
 * PHASE 1: Uses automation_runs table (not products.metadata)
 */
export const triggerBannerGeneration = async (product) => {
  try {
    // Create or update automation run in automation_runs table
    const { error: upsertError } = await supabase
      .from('automation_runs')
      .upsert({
        product_id: product.id,
        user_id: product.user_id,
        automation_type: 'banner',
        status: 'processing',
        progress: 0,
        message: 'Starting banner generation...',
        started_at: new Date().toISOString()
      }, {
        onConflict: 'product_id,automation_type'
      })
    
    if (upsertError) throw upsertError

    // Prepare payload for n8n webhook
    // IMPORTANT: metadata fields take priority since that's where the real data is stored
    const meta = product.metadata || {}
    
    // Debug: log what we're sending
    console.log('[automation] Building payload from product:', {
      id: product.id,
      name: product.name,
      'meta.language': meta.language,
      'product.language': product.language,
      'meta.product_image_url': meta.product_image_url,
      'product.product_image_url': product.product_image_url,
      'meta.amazon_link': meta.amazon_link,
    })
    
    const payload = {
      // Required identifiers
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      
      // Core product info
      description: product.description || '',
      niche: product.niche || meta.niche || '',
      
      // Localization - METADATA FIRST (main columns often have defaults/nulls)
      language: meta.language || product.language || 'English',
      country: meta.country || product.country || 'US',
      gender: meta.gender || product.gender || 'All',
      target_market: meta.country || product.target_market || product.country || 'US',
      
      // Research links - METADATA FIRST
      source_url: meta.aliexpress_link || product.source_url || product.supplier_url || '',
      amazon_link: meta.amazon_link || product.amazon_link || '',
      competitor_link_1: meta.competitor_link_1 || product.competitor_link_1 || '',
      competitor_link_2: meta.competitor_link_2 || product.competitor_link_2 || '',
      
      // Product image - METADATA FIRST (main column is often null)
      product_image_url: meta.product_image_url || product.product_image_url || '',
      
      // Status
      status: product.status || 'new'
    }

    // Trigger banner generation via API proxy (avoids CORS) with retry logic
    const response = await fetchWithRetry(
      BANNER_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, max, delay) => {
          console.log(`[Banner Gen] Retry ${attempt}/${max} in ${delay}ms...`)
        }
      }
    )

    return { success: true, message: 'Banner generation started!' }
  } catch (error) {
    console.error('Failed to trigger banner generation:', error)
    
    // Update automation_runs status to error (Phase 1)
    await supabase
      .from('automation_runs')
      .update({
        status: 'error',
        message: error.message
      })
      .eq('product_id', product.id)
      .eq('automation_type', 'banner')
    
    throw error
  }
}

/**
 * Update banner automation status (Phase 1: Uses automation_runs table)
 */
export const updateBannerAutomationStatus = async (productId, updates) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from('automation_runs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .eq('automation_type', 'banner')
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Update product automation status (DEPRECATED for banners in Phase 1)
 * This is called by both the frontend and n8n (via Supabase REST API)
 * ⚠️ PHASE 1: Only used by landing_page, review, ugc, shopify automations
 * ⚠️ Will be removed in Phase 2/3 when all automations use automation_runs
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
 * PHASE 1: Watches automation_runs (for banner progress) and assets (for new banners)
 * Returns an unsubscribe function
 */
export const subscribeToAutomationUpdates = (productId, callback) => {
  if (!supabase) {
    console.warn('[Automation] Supabase not configured, cannot subscribe to updates')
    return () => {}
  }

  console.log('[Automation] Setting up real-time subscription for product:', productId)

  // Track latest state to merge updates
  let latestState = {
    status: 'idle',
    progress: 0,
    message: '',
    banners: []
  }

  // Helper to fetch latest banners
  const fetchBanners = async () => {
    console.log('[Automation] Fetching banners for product:', productId)
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('product_id', productId)
      .eq('type', 'banner')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('[Automation] Error fetching banners:', error)
      return []
    }
    
    console.log('[Automation] Found banners:', data?.length || 0)
    return (data || []).map(asset => ({
      id: asset.id,
      url: asset.file_url,
      name: asset.name,
      created_at: asset.created_at,
      metadata: asset.metadata
    }))
  }

  const channelName = `automation-banner-${productId}`
  console.log('[Automation] Creating channel:', channelName)

  const channel = supabase
    .channel(channelName)
    // PHASE 1: Watch automation_runs for banner progress (not products.metadata)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE
        schema: 'public',
        table: 'automation_runs',
        filter: `product_id=eq.${productId}&automation_type=eq.banner`
      },
      async (payload) => {
        console.log('[Automation] Received automation_runs update:', payload)
        const run = payload.new
        
        // Fetch latest banners from assets
        const banners = await fetchBanners()
        
        latestState = {
          status: run.status || latestState.status,
          progress: run.progress || latestState.progress,
          message: run.message || latestState.message,
          startedAt: run.started_at,
          completedAt: run.completed_at,
          banners: banners,
        }
        console.log('[Automation] Updated state:', latestState)
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
        console.log('[Automation] Received asset insert:', payload)
        if (payload.new.type === 'banner') {
          // Fetch all banners to get complete list
          const banners = await fetchBanners()
          latestState.banners = banners
          console.log('[Automation] Updated banners, total:', banners.length)
          callback(latestState)
        }
      }
    )
    .subscribe((status) => {
      console.log('[Automation] Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('✅ [Automation] Successfully subscribed to real-time updates')
      } else if (status === 'CLOSED') {
        console.error('❌ [Automation] Subscription closed')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ [Automation] Channel error - check RLS policies and realtime settings')
      }
    })

  // Return unsubscribe function
  return () => {
    console.log('[Automation] Unsubscribing from channel:', channelName)
    supabase.removeChannel(channel)
  }
}

/**
 * Get automation status for a product
 * PHASE 1: Fetches from automation_runs (for banner progress) and assets (for generated banners)
 */
export const getAutomationStatus = async (productId) => {
  if (!supabase) return null
  
  // Fetch automation_runs and assets in parallel
  const [runResult, assetsResult] = await Promise.all([
    supabase
      .from('automation_runs')
      .select('*')
      .eq('product_id', productId)
      .eq('automation_type', 'banner')
      .maybeSingle(), // Returns null if no record, doesn't throw error
    supabase
      .from('assets')
      .select('*')
      .eq('product_id', productId)
      .eq('type', 'banner')
      .order('created_at', { ascending: true })
  ])

  if (runResult.error && runResult.error.code !== 'PGRST116') {
    throw runResult.error
  }
  
  const run = runResult.data || {}
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
    status: run.status || 'idle',
    progress: run.progress || 0,
    message: run.message || '',
    startedAt: run.started_at,
    completedAt: run.completed_at,
    banners: banners, // From assets table (source of truth)
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

/**
 * Stop a running automation
 * PHASE 1: Updates automation_runs for banners
 */
export const stopAutomation = async (productId, executionId = null) => {
  try {
    // Get execution ID from automation_runs if not provided (Phase 1)
    if (!executionId && supabase) {
      const { data } = await supabase
        .from('automation_runs')
        .select('n8n_execution_id')
        .eq('product_id', productId)
        .eq('automation_type', 'banner')
        .single()
      executionId = data?.n8n_execution_id
    }

    // Try to stop n8n execution if we have an ID
    if (executionId) {
      try {
        const response = await fetch(MANAGE_EXECUTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop', executionId })
        })
        
        if (!response.ok) {
          console.warn('n8n stop request failed, but continuing with status update')
        }
      } catch (e) {
        console.warn('Failed to stop n8n execution:', e)
      }
    }

    // Update automation_runs status to stopped (Phase 1)
    await supabase
      .from('automation_runs')
      .update({
        status: 'stopped',
        message: 'Generation stopped by user',
        stopped_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('automation_type', 'banner')

    return { success: true, message: 'Automation stopped' }
  } catch (error) {
    console.error('Failed to stop automation:', error)
    throw error
  }
}

/**
 * Resume a stopped automation
 * PHASE 1: Uses automation_runs for banners
 */
export const resumeAutomation = async (product) => {
  try {
    // Get current status from automation_runs (Phase 1)
    const { data } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('product_id', product.id)
      .eq('automation_type', 'banner')
      .single()

    const lastProgress = data?.progress || 0

    // Update status to show resuming
    await supabase
      .from('automation_runs')
      .update({
        status: 'processing',
        message: lastProgress > 0 
          ? `Resuming from ${lastProgress}%...`
          : 'Resuming generation...'
      })
      .eq('product_id', product.id)
      .eq('automation_type', 'banner')

    // Call resume endpoint
    const response = await fetch(MANAGE_EXECUTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'resume',
        productId: product.id,
        product: {
          ...product,
          resume_from_progress: lastProgress,
          resume_from_stage: lastStage
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to resume automation')
    }

    return { success: true, message: 'Automation resumed' }
  } catch (error) {
    console.error('Failed to resume automation:', error)
    
    // Update automation_runs status to error (Phase 1)
    await supabase
      .from('automation_runs')
      .update({
        status: 'error',
        message: `Resume failed: ${error.message}`
      })
      .eq('product_id', product.id)
      .eq('automation_type', 'banner')
    
    throw error
  }
}

/**
 * Get n8n execution status
 */
export const getExecutionStatus = async (executionId) => {
  try {
    const response = await fetch(MANAGE_EXECUTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', executionId })
    })

    if (!response.ok) {
      throw new Error('Failed to get execution status')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get execution status:', error)
    throw error
  }
}

/**
 * Trigger landing page generation (Product Page + Advertorial)
 */
export const triggerLandingPageGeneration = async (product) => {
  try {
    // Update status to show processing
    await updateProductAutomationStatus(product.id, {
      landing_page_status: 'processing',
      landing_page_started_at: new Date().toISOString(),
      landing_page_progress: 0,
      landing_page_message: 'Starting landing page generation...'
    })

    // Prepare payload (same structure as banner generation)
    const meta = product.metadata || {}
    const payload = {
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      description: product.description || '',
      niche: product.niche || meta.niche || '',
      language: meta.language || product.language || 'English',
      country: meta.country || product.country || 'US',
      gender: meta.gender || product.gender || 'All',
      target_market: meta.country || product.target_market || 'US',
      source_url: meta.aliexpress_link || product.source_url || '',
      amazon_link: meta.amazon_link || product.amazon_link || '',
      competitor_link_1: meta.competitor_link_1 || '',
      competitor_link_2: meta.competitor_link_2 || '',
      product_image_url: meta.product_image_url || '',
      status: product.status || 'landing_page'
    }

    // Trigger via API proxy with retry logic
    const response = await fetchWithRetry(
      '/api/trigger-landing-pages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, max, delay) => {
          console.log(`[Landing Page] Retry ${attempt}/${max} in ${delay}ms...`)
        }
      }
    )

    return { success: true, message: 'Landing page generation started!' }
  } catch (error) {
    console.error('Failed to trigger landing page generation:', error)
    await updateProductAutomationStatus(product.id, {
      landing_page_status: 'error',
      landing_page_message: error.message
    })
    throw error
  }
}

/**
 * Get landing page status
 */
export const getLandingPageStatus = async (productId) => {
  if (!supabase) return null
  
  const [productResult, assetsResult] = await Promise.all([
    supabase.from('products').select('metadata').eq('id', productId).single(),
    supabase.from('assets').select('*').eq('product_id', productId).eq('type', 'landing_page')
  ])

  if (productResult.error) throw productResult.error
  
  const metadata = productResult.data?.metadata || {}
  const pages = (assetsResult.data || []).map(asset => ({
    id: asset.id,
    url: asset.file_url,
    name: asset.name,
    page_type: asset.metadata?.page_type || 'unknown',
    created_at: asset.created_at
  }))
  
  return {
    status: metadata.landing_page_status || 'idle',
    progress: metadata.landing_page_progress || 0,
    message: metadata.landing_page_message || '',
    startedAt: metadata.landing_page_started_at,
    completedAt: metadata.landing_page_completed_at,
    pages: pages
  }
}

/**
 * Trigger review generation
 */
export const triggerReviewGeneration = async (product) => {
  try {
    await updateProductAutomationStatus(product.id, {
      review_status: 'processing',
      review_started_at: new Date().toISOString(),
      review_progress: 0,
      review_message: 'Generating product reviews...'
    })

    const meta = product.metadata || {}
    const payload = {
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      description: product.description || '',
      niche: product.niche || meta.niche || '',
      language: meta.language || product.language || 'English',
      country: meta.country || product.country || 'US',
      product_image_url: meta.product_image_url || product.product_image_url || ''
    }

    const response = await fetchWithRetry(
      '/api/trigger-reviews',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, max, delay) => {
          console.log(`[Reviews] Retry ${attempt}/${max} in ${delay}ms...`)
        }
      }
    )

    return { success: true, message: 'Review generation started!' }
  } catch (error) {
    console.error('Failed to trigger review generation:', error)
    await updateProductAutomationStatus(product.id, {
      review_status: 'error',
      review_message: error.message
    })
    throw error
  }
}

/**
 * Trigger UGC script generation
 */
export const triggerUGCGeneration = async (product) => {
  try {
    await updateProductAutomationStatus(product.id, {
      ugc_status: 'processing',
      ugc_started_at: new Date().toISOString(),
      ugc_progress: 0,
      ugc_message: 'Generating UGC video scripts...'
    })

    const meta = product.metadata || {}
    const payload = {
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      description: product.description || '',
      niche: product.niche || meta.niche || '',
      language: meta.language || product.language || 'English',
      country: meta.country || product.country || 'US',
      target_audience: product.targetAudience || meta.targetAudience || '',
      product_image_url: meta.product_image_url || product.product_image_url || ''
    }

    const response = await fetchWithRetry(
      '/api/trigger-ugc',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, max, delay) => {
          console.log(`[UGC Scripts] Retry ${attempt}/${max} in ${delay}ms...`)
        }
      }
    )

    return { success: true, message: 'UGC script generation started!' }
  } catch (error) {
    console.error('Failed to trigger UGC generation:', error)
    await updateProductAutomationStatus(product.id, {
      ugc_status: 'error',
      ugc_message: error.message
    })
    throw error
  }
}

/**
 * Trigger Shopify deployment
 */
export const triggerShopifyDeployment = async (product, shopifyStore = 'cellux') => {
  try {
    await updateProductAutomationStatus(product.id, {
      shopify_status: 'processing',
      shopify_started_at: new Date().toISOString(),
      shopify_progress: 0,
      shopify_message: `Deploying to Shopify (${shopifyStore})...`
    })

    const meta = product.metadata || {}
    const payload = {
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      description: product.description || '',
      price: product.price || 0,
      niche: product.niche || meta.niche || '',
      shopify_store: shopifyStore, // 'cellux' or 'glow82'
      product_image_url: meta.product_image_url || product.product_image_url || '',
      landing_page_url: meta.generated_landing_page_url || '',
      generated_banners: meta.generated_banners || []
    }

    const response = await fetchWithRetry(
      '/api/trigger-shopify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, max, delay) => {
          console.log(`[Shopify Deploy] Retry ${attempt}/${max} in ${delay}ms...`)
        }
      }
    )

    return { success: true, message: 'Shopify deployment started!' }
  } catch (error) {
    console.error('Failed to trigger Shopify deployment:', error)
    await updateProductAutomationStatus(product.id, {
      shopify_status: 'error',
      shopify_message: error.message
    })
    throw error
  }
}

export default {
  triggerBannerGeneration,
  triggerLandingPageGeneration,
  triggerReviewGeneration,
  triggerUGCGeneration,
  triggerShopifyDeployment,
  updateBannerAutomationStatus, // Phase 1: New function for banners
  updateProductAutomationStatus, // Deprecated for banners, kept for other automations
  subscribeToAutomationUpdates,
  getAutomationStatus,
  getLandingPageStatus,
  addGeneratedBanner,
  completeAutomation,
  stopAutomation,
  resumeAutomation,
  getExecutionStatus
}
