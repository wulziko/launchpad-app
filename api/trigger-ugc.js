/**
 * Vercel Serverless Function - Proxy to n8n UGC script generation workflow
 * Triggers AI UGC video script generation
 * 
 * NOTE: Uses API execution instead of webhooks (webhooks require UI activation)
 */

const N8N_URL = 'https://n8n.srv1300789.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_ID = 'fpvbLxk8Lx2WmyTQ'; // UGC workflow

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
            niche: req.body.niche || 'General',
            country: req.body.country || 'US',
            language: req.body.language || 'English',
            targetAudience: req.body.target_audience || '',
            productImageUrl: req.body.product_image_url || '',
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
