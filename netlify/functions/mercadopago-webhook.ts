import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Mercado Pago sends the ID in different formats depending on the event type
    const eventType = body.type || body.topic || event.queryStringParameters?.type || event.queryStringParameters?.topic;
    const eventId = body.data?.id || event.queryStringParameters?.['data.id'] || event.queryStringParameters?.id;

    console.log(`Received webhook: type=${eventType}, id=${eventId}`);

    if (!eventType || !eventId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing type or id' }) };
    }

    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      throw new Error('Missing Mercado Pago access token');
    }

    let externalReference = null;
    let status = null;
    let planType = 'pro'; // Default to pro

    // Fetch payment/subscription details from Mercado Pago
    if (eventType === 'payment') {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      });
      const paymentData = await response.json();
      
      externalReference = paymentData.external_reference;
      status = paymentData.status;
      
      // Determine plan type based on transaction amount or description
      // Assuming lifetime is around R$ 699,00
      if (paymentData.transaction_amount >= 600 || 
          paymentData.description?.toLowerCase().includes('vitalício') || 
          paymentData.description?.toLowerCase().includes('lifetime')) {
        planType = 'lifetime';
      } else {
        planType = 'pro';
      }
    } else if (eventType === 'subscription_preapproval' || eventType === 'subscription') {
      const response = await fetch(`https://api.mercadopago.com/preapproval/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      });
      const subData = await response.json();
      
      externalReference = subData.external_reference;
      status = subData.status;
      
      // Subscriptions are usually 'pro', but check reason just in case
      if (subData.reason?.toLowerCase().includes('vitalício') || 
          subData.reason?.toLowerCase().includes('lifetime')) {
         planType = 'lifetime';
      } else {
         planType = 'pro';
      }
    } else {
      // Ignore other events, but return 200 to acknowledge receipt
      return { statusCode: 200, body: JSON.stringify({ message: 'Event ignored' }) };
    }

    console.log(`Payment status: ${status}, external_reference: ${externalReference}, planType: ${planType}`);

    if (status === 'approved' || status === 'authorized') {
      if (!externalReference) {
        console.error('No external_reference found in payment data');
        return { statusCode: 400, body: JSON.stringify({ error: 'No external_reference found' }) };
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }

      // Initialize Supabase client with SERVICE_ROLE key to bypass RLS
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Update the user's profile
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ plan_type: planType })
        .eq('id', externalReference);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log(`Successfully updated user ${externalReference} to plan ${planType}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
