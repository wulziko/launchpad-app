/**
 * Automation Integration for LaunchPad
 * Handles n8n webhook triggers and real-time progress updates
 */

import { supabase } from './supabase'

// n8n webhook configuration
const N8N_BASE_URL = 'https://n8n.srv1300789.hstgr.cloud'
const N8N_WEBHOOK_PATH = '/webhook/launchpad' // We'll set this up in n8n

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
    const payload = {
      product_id: product.id,
      product_name: product.name,
      description: product.description,
      niche: product.niche,
      target_market: product.market,
      language: product.metadata?.language || 'English',
      country: product.metadata?.country || 'United States',
      gender: product.metadata?.gender || 'All',
      amazon_link: product.metadata?.amazon_link || '',
      competitor_link_1: product.metadata?.competitor_link_1 || '',
      competitor_link_2: product.metadata?.competitor_link_2 || '',
      product_image_url: product.metadata?.product_image_url || '',
      // Callback URL for n8n to send results back
      callback_url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_product_automation`,
      supabase_url: import.meta.env.VITE_SUPABASE_URL,
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
 * Returns an unsubscribe function
 */
export const subscribeToAutomationUpdates = (productId, callback) => {
  if (!supabase) {
    console.warn('Supabase not configured, cannot subscribe to updates')
    return () => {}
  }

  const channel = supabase
    .channel(`product-automation-${productId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
        filter: `id=eq.${productId}`
      },
      (payload) => {
        const metadata = payload.new.metadata || {}
        callback({
          status: metadata.automation_status,
          progress: metadata.automation_progress,
          message: metadata.automation_message,
          startedAt: metadata.automation_started_at,
          completedAt: metadata.automation_completed_at,
          banners: metadata.generated_banners || [],
          landingPageUrl: metadata.generated_landing_page_url,
        })
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
 */
export const getAutomationStatus = async (productId) => {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', productId)
    .single()

  if (error) throw error
  
  const metadata = data?.metadata || {}
  return {
    status: metadata.automation_status || 'idle',
    progress: metadata.automation_progress || 0,
    message: metadata.automation_message || '',
    startedAt: metadata.automation_started_at,
    completedAt: metadata.automation_completed_at,
    banners: metadata.generated_banners || [],
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
