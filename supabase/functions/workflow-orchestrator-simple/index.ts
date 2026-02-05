// SIMPLIFIED Workflow Orchestrator - Works WITHOUT n8n webhooks
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Product {
  id: string
  name: string
  status: string
  metadata?: any
  [key: string]: any
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Product
  old_record?: Product
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload: WebhookPayload = await req.json()
    const product = payload.record
    const oldProduct = payload.old_record

    console.log('🎯 Workflow trigger:', payload.type, product.id, 'status:', product.status)

    // Skip if not a status change
    if (payload.type === 'UPDATE' && product.status === oldProduct?.status) {
      return new Response(JSON.stringify({ message: 'No status change' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // IMMEDIATE STATUS TRANSITIONS (no n8n dependency)
    if (product.status === 'new') {
      console.log('📊 New product → researching')
      
      await supabase
        .from('products')
        .update({ 
          status: 'researching',
          metadata: { 
            ...product.metadata, 
            workflow_started_at: new Date().toISOString(),
            note: 'Auto-transitioned by orchestrator'
          }
        })
        .eq('id', product.id)
      
      // TODO: Call n8n research workflow here when webhooks work
      
      return new Response(
        JSON.stringify({ success: true, product_id: product.id, status: 'researching' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (product.status === 'approved') {
      console.log('✅ Approved → banner_gen')
      
      await supabase
        .from('products')
        .update({ 
          status: 'banner_gen',
          metadata: { 
            ...product.metadata, 
            approved_at: new Date().toISOString()
          }
        })
        .eq('id', product.id)
      
      // TODO: Call n8n banner workflow
      
      return new Response(
        JSON.stringify({ success: true, product_id: product.id, status: 'banner_gen' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // For other statuses, just acknowledge
    return new Response(
      JSON.stringify({ 
        success: true, 
        product_id: product.id,
        status: product.status,
        message: 'Status received, no action taken'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
