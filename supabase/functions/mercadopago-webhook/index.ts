import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let type = url.searchParams.get('type') || url.searchParams.get('topic')
    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id')

    // If it's a POST request, we might get the data in the body
    let body: any = {}
    if (req.method === 'POST') {
      try {
        body = await req.json()
      } catch (e) {
        console.log("Could not parse body as JSON")
      }
    }

    const eventType = body.type || body.topic || type
    const eventId = body.data?.id || dataId

    console.log(`Received webhook: type=${eventType}, id=${eventId}`)

    // We only care about payment or subscription events
    if (!eventType || !eventId) {
      return new Response(JSON.stringify({ error: 'Missing type or id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Initialize Supabase client with SERVICE_ROLE key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch payment/subscription details from Mercado Pago
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    if (!mpAccessToken) {
      throw new Error('Missing Mercado Pago access token')
    }

    let externalReference = null
    let status = null
    let planType = 'pro' // Default to pro, adjust based on your logic

    if (eventType === 'payment') {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      })
      const paymentData = await response.json()
      externalReference = paymentData.external_reference
      status = paymentData.status
      
      // If it's a one-time payment, it might be the lifetime plan
      // You can check the amount or description to be sure
      if (paymentData.transaction_amount >= 600) {
        planType = 'lifetime'
      }
    } else if (eventType === 'subscription_preapproval' || eventType === 'subscription') {
      const response = await fetch(`https://api.mercadopago.com/preapproval/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      })
      const subData = await response.json()
      externalReference = subData.external_reference
      status = subData.status
      planType = 'pro'
    }

    console.log(`Payment status: ${status}, external_reference: ${externalReference}`)

    if (status === 'approved' || status === 'authorized') {
      if (!externalReference) {
        console.error('No external_reference found in payment data')
        return new Response(JSON.stringify({ error: 'No external_reference found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      // Update the user's profile
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: planType })
        .eq('id', externalReference)

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      console.log(`Successfully updated user ${externalReference} to plan ${planType}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
