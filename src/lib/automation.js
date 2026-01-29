/**
 * Automation Integration for LaunchPad
 * Handles n8n webhook triggers and real-time progress updates
 */

import { supabase } from './supabase'

// API proxy endpoints (avoids CORS issues)
// Uses Vercel serverless functions to proxy to n8n
const BANNER_API_URL = '/api/trigger-banners'
const MANAGE_EXECUTION_URL = '/api/manage-execution'

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

    // Prepare payload for n8n webhook
    // Matches the expected format in /api/trigger-banners.js
    const payload = {
      // Required identifiers
      id: product.id,
      user_id: product.user_id,
      name: product.name,
      
      // Core product info
      description: product.description || '',
      niche: product.niche || '',
      
      // Localization - match LaunchPad database schema
      language: product.language || product.metadata?.language || 'English',
      country: product.country || product.metadata?.country || 'US',
      gender: product.gender || product.metadata?.gender || 'All',
      target_market: product.target_market || product.country || 'US',
      
      // Research links - match LaunchPad database field names
      source_url: product.source_url || product.supplier_url || product.metadata?.aliexpress_link || '',
      amazon_link: product.amazon_link || product.metadata?.amazon_link || '',
      competitor_link_1: product.competitor_link_1 || product.metadata?.competitor_link_1 || '',
      competitor_link_2: product.competitor_link_2 || product.metadata?.competitor_link_2 || '',
      
      // Product image for banner generation
      product_image_url: product.product_image_url || product.metadata?.product_image_url || '',
      
      // Status
      status: product.status || 'new'
    }

    // Trigger banner generation via API proxy (avoids CORS)
    const response = await fetch(BANNER_API_URL, {
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

/**
 * Stop a running automation
 * Calls n8n API to stop the execution and updates product status
 */
export const stopAutomation = async (productId, executionId = null) => {
  try {
    // Get execution ID from metadata if not provided
    if (!executionId && supabase) {
      const { data } = await supabase
        .from('products')
        .select('metadata')
        .eq('id', productId)
        .single()
      executionId = data?.metadata?.n8n_execution_id
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

    // Update product status to stopped
    await updateProductAutomationStatus(productId, {
      automation_status: 'stopped',
      automation_message: 'Generation stopped by user',
      automation_stopped_at: new Date().toISOString()
    })

    return { success: true, message: 'Automation stopped' }
  } catch (error) {
    console.error('Failed to stop automation:', error)
    throw error
  }
}

/**
 * Resume a stopped automation
 * Retriggers the workflow from where it left off (or from start if no checkpoint)
 */
export const resumeAutomation = async (product) => {
  try {
    // Get current status to check for checkpoint
    const { data } = await supabase
      .from('products')
      .select('metadata')
      .eq('id', product.id)
      .single()

    const metadata = data?.metadata || {}
    const lastProgress = metadata.automation_progress || 0
    const lastStage = metadata.automation_last_stage || 'start'

    // Update status to show resuming
    await updateProductAutomationStatus(product.id, {
      automation_status: 'processing',
      automation_message: lastProgress > 0 
        ? `Resuming from ${lastProgress}%...`
        : 'Resuming generation...',
      automation_resumed_at: new Date().toISOString()
    })

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
    
    // Update status to error
    await updateProductAutomationStatus(product.id, {
      automation_status: 'error',
      automation_message: `Resume failed: ${error.message}`
    })
    
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

export default {
  triggerBannerGeneration,
  updateProductAutomationStatus,
  subscribeToAutomationUpdates,
  getAutomationStatus,
  addGeneratedBanner,
  completeAutomation,
  stopAutomation,
  resumeAutomation,
  getExecutionStatus
}
