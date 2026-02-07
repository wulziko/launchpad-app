/**
 * Vercel Serverless Function - Proxy to n8n UGC script generation workflow
 * Triggers AI UGC video script generation
 */

const N8N_WEBHOOK_URL = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-ugc-scripts';

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
        // Product identification
        product_id: req.body.id,
        user_id: req.body.user_id,
        name: req.body.name,
        product_name: req.body.name,
        description: req.body.description || '',
        
        // Localization
        niche: req.body.niche || 'General',
        country: req.body.country || 'US',
        language: req.body.language || 'English',
        target_audience: req.body.target_audience || '',
        
        // Product image for context
        product_image_url: req.body.product_image_url || '',
        
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
      message: 'UGC script generation started',
      product_id: id,
      n8n_response: data
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger UGC generation',
      message: error.message 
    });
  }
}
