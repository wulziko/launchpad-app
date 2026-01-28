/**
 * Vercel Serverless Function - Proxy to n8n webhook
 * This avoids CORS issues by making server-to-server requests
 */

const N8N_WEBHOOK_URL = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward the request to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'n8n webhook failed', 
        details: data 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Banner generation started',
      n8n_response: data
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger banner generation',
      message: error.message 
    });
  }
}
