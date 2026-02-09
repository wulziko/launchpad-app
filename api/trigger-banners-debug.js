/**
 * Vercel Serverless Function - Proxy to n8n webhook (WITH DEBUG LOGGING)
 */

const N8N_WEBHOOK_URL = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen';

export default async function handler(req, res) {
  // Debug: Log incoming request
  console.log('[trigger-banners] Incoming request:', {
    method: req.method,
    bodyKeys: Object.keys(req.body || {}),
    body: JSON.stringify(req.body).substring(0, 200)
  });

  // Only allow POST
  if (req.method !== 'POST') {
    console.log('[trigger-banners] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate required fields
  const { id, user_id, name } = req.body;
  
  console.log('[trigger-banners] Required fields check:', {
    hasId: !!id,
    hasUserId: !!user_id,
    hasName: !!name,
    id: id,
    user_id: user_id,
    name: name
  });
  
  if (!id || !user_id || !name) {
    const error = {
      error: 'Missing required fields',
      required: ['id', 'user_id', 'name'],
      received: { id: !!id, user_id: !!user_id, name: !!name }
    };
    console.log('[trigger-banners] Validation failed:', error);
    return res.status(400).json(error);
  }

  try {
    const webhookPayload = {
      // Product identification - workflow expects "product_id"
      product_id: req.body.id,
      user_id: req.body.user_id,
      name: req.body.name,
      product_name: req.body.name,
      
      // Core fields
      niche: req.body.niche || 'General',
      country: req.body.country || 'US',
      language: req.body.language || 'English',
      gender: req.body.gender || 'All',
      target_market: req.body.target_market || req.body.country || 'US',
      
      // Links
      amazon_link: req.body.amazon_link || '',
      aliexpress_link: req.body.source_url || req.body.aliexpress_link || '',
      competitor_link_1: req.body.competitor_link_1 || '',
      competitor_link_2: req.body.competitor_link_2 || '',
      
      // Product image
      product_image_url: req.body.product_image_url || '',
      
      // Status
      status: req.body.status || 'new',
      
      // Metadata
      triggered_at: new Date().toISOString(),
      trigger_source: 'launchpad-app'
    };

    console.log('[trigger-banners] Calling n8n webhook with payload keys:', Object.keys(webhookPayload));

    // Forward the request to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log('[trigger-banners] n8n response:', {
      status: response.status,
      ok: response.ok
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      console.log('[trigger-banners] n8n webhook failed:', {
        status: response.status,
        data: data
      });
      return res.status(response.status).json({ 
        error: 'n8n webhook failed', 
        details: data 
      });
    }

    console.log('[trigger-banners] Success!');

    return res.status(200).json({ 
      success: true, 
      message: 'Banner generation started',
      product_id: id,
      n8n_response: data
    });

  } catch (error) {
    console.error('[trigger-banners] Exception:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger banner generation',
      message: error.message 
    });
  }
}
