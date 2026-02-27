import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover', // Use a stable version
});

const supabaseUrl = process.env.SUPABASE_URL || '';
// WARNING: For the webhook to write to the database bypassing RLS, you MUST use the SERVICE_ROLE_KEY.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return { statusCode: 400, body: 'Missing signature or secret' };
  }

  let stripeEvent: Stripe.Event;

  try {
    // Netlify functions provide the raw body as a string in event.body
    // Sometimes it's base64 encoded depending on headers
    const rawBody = event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : event.body!;
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle the checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    
    // O ID do usuário que passamos no link de pagamento
    const userId = session.client_reference_id;

    if (userId) {
      console.log(`Processing purchase for user ID ${userId}`);
      try {
        // Obter os itens da sessão para saber qual produto foi comprado
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items'],
        });

        const productId = sessionWithLineItems.line_items?.data[0]?.price?.product as string;
        
        let durationDays = 30; // default
        
        if (productId === 'prod_U3E2ifOzafgWGf=' || productId === 'prod_U3E2ifOzafgWGf') {
           durationDays = 30; // Mensal
        } else if (productId === 'prod_U2tG41c3kqvP95') {
           durationDays = 180; // Trimestral (180 dias)
        } else if (productId === 'prod_U3E50YPdiGLs85') {
           durationDays = 180; // Semestral (180 dias)
        }

        const now = new Date();
        const newExpiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ architecture_expiry: newExpiryDate.toISOString() })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user in Supabase:', updateError);
          return { statusCode: 500, body: 'Failed to update user' };
        }
        
        console.log(`Successfully updated architecture_expiry for user ID ${userId} with ${durationDays} days`);
      } catch (err) {
        console.error('Error processing webhook logic:', err);
        return { statusCode: 500, body: 'Internal Server Error' };
      }
    } else {
      console.warn('Missing client_reference_id in session. Cannot activate plan.');
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
