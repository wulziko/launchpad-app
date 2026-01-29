/**
 * Vercel Serverless Function - Manage n8n executions
 * Supports: stop, status, resume
 * 
 * POST /api/manage-execution
 * Body: { action: 'stop' | 'status' | 'resume', executionId?: string, productId?: string }
 */

const N8N_BASE_URL = 'https://n8n.srv1300789.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZWRjYmM0Yi1jNmRmLTQ3YzEtYmYyMC1hNjU0ZDIzOTJhMWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NjEzNDMwfQ.lZDZI33LC7LJiH9nGHXqfraHUtu2Nt2wn2azwynvfmQ';

// Webhook for resuming from checkpoint
const N8N_RESUME_WEBHOOK = 'https://n8n.srv1300789.hstgr.cloud/webhook/launchpad-banner-gen';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, executionId, productId, product } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    switch (action) {
      case 'stop': {
        if (!executionId) {
          return res.status(400).json({ error: 'Missing executionId for stop action' });
        }

        // n8n API to stop execution
        const stopResponse = await fetch(`${N8N_BASE_URL}/api/v1/executions/${executionId}/stop`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (!stopResponse.ok) {
          // Try alternative: cancel via webhook if direct API fails
          const errorText = await stopResponse.text();
          console.error('n8n stop failed:', errorText);
          
          // Return partial success - we'll update the DB status anyway
          return res.status(200).json({ 
            success: true, 
            message: 'Execution stop requested',
            warning: 'n8n stop may not have fully succeeded',
            executionId 
          });
        }

        const stopData = await stopResponse.json().catch(() => ({}));
        return res.status(200).json({ 
          success: true, 
          message: 'Execution stopped',
          executionId,
          data: stopData
        });
      }

      case 'status': {
        if (!executionId) {
          return res.status(400).json({ error: 'Missing executionId for status action' });
        }

        const statusResponse = await fetch(`${N8N_BASE_URL}/api/v1/executions/${executionId}`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });

        if (!statusResponse.ok) {
          return res.status(statusResponse.status).json({ 
            error: 'Failed to get execution status',
            details: await statusResponse.text()
          });
        }

        const statusData = await statusResponse.json();
        return res.status(200).json({ 
          success: true, 
          execution: statusData 
        });
      }

      case 'resume': {
        // Resume triggers a new execution with checkpoint data
        if (!product || !productId) {
          return res.status(400).json({ error: 'Missing product data for resume action' });
        }

        // Trigger new execution with resume flag
        const resumeResponse = await fetch(N8N_RESUME_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product_id: productId,
            ...product,
            resume_from_checkpoint: true,
            triggered_at: new Date().toISOString(),
            trigger_source: 'launchpad-app-resume'
          })
        });

        const contentType = resumeResponse.headers.get('content-type');
        let resumeData;
        if (contentType && contentType.includes('application/json')) {
          resumeData = await resumeResponse.json();
        } else {
          resumeData = { message: await resumeResponse.text() };
        }

        if (!resumeResponse.ok) {
          return res.status(resumeResponse.status).json({ 
            error: 'Failed to resume execution',
            details: resumeData
          });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Execution resumed',
          productId,
          data: resumeData
        });
      }

      case 'list-running': {
        // Get all running executions (useful for debugging)
        const listResponse = await fetch(`${N8N_BASE_URL}/api/v1/executions?status=running&limit=50`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });

        if (!listResponse.ok) {
          return res.status(listResponse.status).json({ 
            error: 'Failed to list executions',
            details: await listResponse.text()
          });
        }

        const listData = await listResponse.json();
        return res.status(200).json({ 
          success: true, 
          executions: listData 
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('Error managing execution:', error);
    return res.status(500).json({ 
      error: 'Failed to manage execution',
      message: error.message 
    });
  }
}
