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
    let planType = 'pro';
    let monthsToAdd = 0;

    // Fetch payment details from Mercado Pago
    // We only care about one-time payments now
    if (eventType === 'payment') {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      });
      const paymentData = await response.json();
      
      externalReference = paymentData.external_reference;
      status = paymentData.status;
      
      const amount = paymentData.transaction_amount;
      const description = (paymentData.description || '').toLowerCase();
      
      // Determine plan type and duration based on transaction amount or description
      if (amount >= 600 || description.includes('vitalício') || description.includes('lifetime')) {
        planType = 'lifetime';
      } else if (amount >= 90 || description.includes('1 ano') || description.includes('12 meses')) {
        monthsToAdd = 12;
      } else if (amount >= 45 || description.includes('6 meses')) {
        monthsToAdd = 6;
      } else if (amount >= 25 || description.includes('3 meses')) {
        monthsToAdd = 3;
      } else {
        // Default to 1 month for smaller amounts
        monthsToAdd = 1;
      }
    } else {
      // Ignore subscriptions or other events
      return { statusCode: 200, body: JSON.stringify({ message: 'Event ignored' }) };
    }

    console.log(`Payment status: ${status}, external_reference: ${externalReference}, planType: ${planType}, monthsToAdd: ${monthsToAdd}`);

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

      // Fetch current profile to calculate new expiration date
      const { data: currentProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('premium_expires_at, plan_type')
        .eq('id', externalReference)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }

      let newExpiresAt = null;

      if (planType === 'pro' && monthsToAdd > 0) {
        const now = new Date();
        let baseDate = now;

        // If user already has an active premium expiration in the future, add to it
        if (currentProfile?.premium_expires_at) {
          const currentExpires = new Date(currentProfile.premium_expires_at);
          if (currentExpires > now) {
            baseDate = currentExpires;
          }
        }

        // Add the purchased months
        baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
        newExpiresAt = baseDate.toISOString();
      }

      // Update the user's profile
      const updateData: any = { plan_type: planType };
      if (newExpiresAt) {
        updateData.premium_expires_at = newExpiresAt;
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', externalReference);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      console.log(`Successfully updated user ${externalReference} to plan ${planType}, expires at: ${newExpiresAt}`);
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
