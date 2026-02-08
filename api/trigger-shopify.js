/**
 * Vercel Serverless Function - Proxy to n8n Shopify deployment workflow
 * Triggers product deployment to Shopify store
 * 
 * NOTE: Uses API execution instead of webhooks (webhooks require UI activation)
 */

const N8N_URL = 'https://n8n.srv1300789.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_ID = 'ERsflpyBzGCZefpD'; // Shopify workflow

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
    // Trigger workflow via API (works without webhook registration)
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify({
        workflowData: {
          // Simulate webhook body structure
          body: {
            productId: req.body.id,
            userId: req.body.user_id,
            productName: req.body.name,
            productDescription: req.body.description || '',
            price: req.body.price || 0,
            shopifyStore: req.body.shopify_store,
            niche: req.body.niche || 'General',
            productImageUrl: req.body.product_image_url || '',
            landingPageUrl: req.body.landing_page_url || '',
            generatedBanners: req.body.generated_banners || [],
            triggeredAt: new Date().toISOString(),
            triggerSource: 'launchpad-app'
          }
        }
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
