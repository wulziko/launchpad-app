// Research automation utilities

const N8N_RESEARCH_WEBHOOK = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-research'

/**
 * Trigger AI product research workflow
 * @param {Object} product - Product object from Supabase
 * @returns {Promise<Object>} Response from n8n webhook
 */
export async function triggerProductResearch(product) {
  if (!product?.id) {
    throw new Error('Product ID is required')
  }

  const payload = {
    productId: product.id,
    productName: product.name || 'Untitled Product',
    productDescription: product.description || '',
    niche: product.niche || product.metadata?.niche || '',
    amazonLink: product.amazon_link || product.metadata?.amazon_link || '',
    competitorLink1: product.competitor_link_1 || product.metadata?.competitor_link_1 || '',
    competitorLink2: product.competitor_link_2 || product.metadata?.competitor_link_2 || '',
    supplierUrl: product.aliexpress_link || product.metadata?.aliexpress_link || '',
    productImageUrl: product.product_image_url || product.metadata?.product_image_url || '',
    country: product.country || product.metadata?.country || 'United States',
  }

  console.log('[Research] Triggering research for product:', product.id, payload)

  const response = await fetch(N8N_RESEARCH_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Research] Failed to trigger:', error)
    throw new Error(`Failed to trigger research: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('[Research] Triggered successfully:', data)
  
  return data
}

/**
 * Stop ongoing research
 * @param {string} productId - Product ID
 * @returns {Promise<Object>}
 */
export async function stopProductResearch(productId) {
  const response = await fetch(N8N_RESEARCH_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'stop',
      productId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to stop research: ${response.statusText}`)
  }

  return response.json()
}
