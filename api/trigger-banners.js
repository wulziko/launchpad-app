/**
 * Vercel Serverless Function - Proxy to n8n webhook
 * Triggers landing page generation for LaunchPad products
 * 
 * Expected body:
 * {
 *   id: string (product UUID),
 *   user_id: string (user UUID),
 *   name: string (product name),
 *   niche: string,
 *   country: string,
 *   language: string,
 *   gender: string,
 *   amazon_link: string,
 *   competitor_link_1: string,
 *   competitor_link_2: string,
 *   product_image_url: string,
 *   source_url: string (aliexpress/supplier),
 *   status: string
 * }
 */

const N8N_WEBHOOK_URL = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate required fields
  const { id, user_id, name } = req.body;
  if (!id || !user_id || !name) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['id', 'user_id', 'name']
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
        // Product identification - workflow expects "product_id"
        product_id: req.body.id,
        user_id: req.body.user_id,
        name: req.body.name,
        product_name: req.body.name, // alias for compatibility
        
        // Core fields for AI research
        niche: req.body.niche || 'General',
        country: req.body.country || 'US',
        language: req.body.language || 'English',
        gender: req.body.gender || 'All',
        target_market: req.body.target_market || req.body.country || 'US',
        
        // Links for research - workflow expects "aliexpress_link"
        amazon_link: req.body.amazon_link || '',
        aliexpress_link: req.body.source_url || req.body.aliexpress_link || '',
        competitor_link_1: req.body.competitor_link_1 || '',
        competitor_link_2: req.body.competitor_link_2 || '',
        
        // Product image
        product_image_url: req.body.product_image_url || '',
        
        // Status
        status: req.body.status || 'new',
        
        // Trigger metadata
        triggered_at: new Date().toISOString(),
        trigger_source: 'launchpad-app'
      }),
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
      return res.status(response.status).json({ 
        error: 'n8n webhook failed', 
        details: data 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Landing page generation started',
      product_id: id,
      n8n_response: data
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger landing page generation',
      message: error.message 
    });
  }
}
