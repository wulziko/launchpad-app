/**
 * Vercel Serverless Function - Proxy to n8n Shopify deployment workflow
 * Triggers product deployment to Shopify store
 */

const N8N_WEBHOOK_URL = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-shopify-deploy';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate required fields
  const { id, user_id, name, shopify_store } = req.body;
  if (!id || !user_id || !name || !shopify_store) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['id', 'user_id', 'name', 'shopify_store']
    });
  }

  try {
    // Forward the request to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Product identification
        product_id: req.body.id,
        user_id: req.body.user_id,
        name: req.body.name,
        product_name: req.body.name,
        description: req.body.description || '',
        price: req.body.price || 0,
        
        // Store selection
        shopify_store: req.body.shopify_store, // 'cellux' or 'glow82'
        
        // Product data
        niche: req.body.niche || 'General',
        product_image_url: req.body.product_image_url || '',
        landing_page_url: req.body.landing_page_url || '',
        
        // Generated assets
        generated_banners: req.body.generated_banners || [],
        
        // Trigger metadata
        triggered_at: new Date().toISOString(),
        trigger_source: 'launchpad-app'
      }),
    });

    // Handle response
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'n8n webhook failed', 
        details: data 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Shopify deployment started to ${req.body.shopify_store}`,
      product_id: id,
      shopify_store: req.body.shopify_store,
      n8n_response: data
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger Shopify deployment',
      message: error.message 
    });
  }
}
