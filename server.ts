import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize Stripe and Supabase
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // apiVersion: '2024-12-18.acacia', // Let library default to installed version
  });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
  // WARNING: For the webhook to write to the database bypassing RLS, you MUST use the SERVICE_ROLE_KEY.
  // The ANON_KEY will likely fail if RLS is enabled.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'your-service-role-key';
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Webhook database updates may fail due to RLS policies.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Middleware for raw body parsing (needed for Stripe webhook verification)
  app.use('/api/webhook', express.raw({ type: 'application/json' }));
  
  // Standard middleware for other routes
  app.use(cors());
  app.use(express.static('public'));
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
      next();
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });

  // --- API Routes ---
  
  // Image Analysis Endpoint (Replacing Netlify function)
  app.post('/api/analyze-image', async (req, res) => {
    res.status(410).json({ error: 'This endpoint is deprecated. Use frontend Gemini integration.' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create Checkout Session Endpoint
  app.post('/api/create-checkout-session', express.json(), async (req, res) => {
    const { plan, email, userId } = req.body;

    if (!plan || !email) {
      return res.status(400).json({ error: 'Plan and email are required' });
    }

    let priceInCents = 0;
    let productName = '';
    let description = '';

    switch (plan) {
      case 'starter':
        priceInCents = 9700; // R$ 97.00
        productName = 'ArchRender AI - Starter';
        description = '200 renders/mês • Presets profissionais';
        break;
      case 'pro':
        priceInCents = 14700; // R$ 147.00
        productName = 'ArchRender AI - Pro';
        description = '500 renders/mês • Presets premium • Prioridade';
        break;
      default:
        return res.status(400).json({ error: 'Invalid plan' });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            // For now, I'll use the product ID if possible or keep the dynamic price logic but with 365 days
            price_data: {
              currency: 'brl',
              product: 'prod_U4og5gOwkeVi1v',
              unit_amount: 49700, // Example price for a year, adjust as needed
              recurring: {
                interval: 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          metadata: {
            tab: 'architecture',
            plan: plan,
            userId: userId,
          }
        },
        success_url: `${req.headers.origin}/arch-viz?success=true&plan=${plan}`,
        cancel_url: `${req.headers.origin}/arch-viz?canceled=true`,
        customer_email: email,
        metadata: {
          tab: 'architecture',
          plan: plan,
          userId: userId,
          duration_days: '365' 
        },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe Webhook Endpoint
  app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (!sig || !endpointSecret) {
        throw new Error('Missing Stripe signature or webhook secret');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id || session.metadata?.userId;
          const userEmail = session.customer_details?.email;
          const metadata = session.metadata || {};

          let targetUserId = userId;

          if (!targetUserId && userEmail) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', userEmail)
              .single();
            if (userData) targetUserId = userData.id;
          }

          if (targetUserId) {
            const tab = (metadata.tab || 'architecture').toLowerCase();
            
            // Check if this is the yearly product
            let durationDays = 30;
            try {
              const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
              const isYearly = lineItems.data.some(item => 
                item.price?.product === 'prod_U4og5gOwkeVi1v' || 
                (typeof item.price?.product === 'object' && item.price?.product?.id === 'prod_U4og5gOwkeVi1v')
              );
              if (isYearly) {
                durationDays = 365;
              } else {
                durationDays = parseInt(metadata.duration_days || '30', 10);
              }
            } catch (e) {
              console.error('Error fetching line items:', e);
              durationDays = parseInt(metadata.duration_days || '30', 10);
            }

            const now = new Date();
            const newExpiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            const updates: any = {};
            const field = `${tab}_expiry`;
            updates[field] = newExpiryDate.toISOString();

            await supabase.from('profiles').update(updates).eq('id', targetUserId);
            console.log(`Initial setup: Updated ${field} for user ${targetUserId} with ${durationDays} days`);
          }
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const userId = subscription.metadata.userId || subscription.metadata.client_reference_id;
            const tab = (subscription.metadata.tab || 'architecture').toLowerCase();

            if (userId) {
              const now = new Date();
              
              // Determine renewal duration based on subscription items
              let renewalDays = 32; // Default for monthly
              const isYearly = subscription.items.data.some(item => 
                item.price?.product === 'prod_U4og5gOwkeVi1v' || 
                (typeof item.price?.product === 'object' && item.price?.product?.id === 'prod_U4og5gOwkeVi1v')
              );
              
              if (isYearly) {
                renewalDays = 367; // 1 year + grace period
              }

              const newExpiryDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000);
              
              const updates: any = {};
              const field = `${tab}_expiry`;
              updates[field] = newExpiryDate.toISOString();

              await supabase.from('profiles').update(updates).eq('id', userId);
              console.log(`Renewal: Updated ${field} for user ${userId} with ${renewalDays} days`);
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId || subscription.metadata.client_reference_id;
          const tab = (subscription.metadata.tab || 'architecture').toLowerCase();

          if (userId) {
            const updates: any = {};
            const field = `${tab}_expiry`;
            // Set expiry to past to block access
            updates[field] = new Date(0).toISOString();

            await supabase.from('profiles').update(updates).eq('id', userId);
            console.log(`Cancelled: Revoked ${field} for user ${userId}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (err: any) {
      console.error('Error processing webhook event:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.json({ received: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if needed, though usually handled by build output)
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
