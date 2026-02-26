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
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // --- API Routes ---

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
            price_data: {
              currency: 'brl',
              product_data: {
                name: productName,
                description: description,
              },
              unit_amount: priceInCents,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/arch-viz?success=true&plan=${plan}`,
        cancel_url: `${req.headers.origin}/arch-viz?canceled=true`,
        customer_email: email,
        metadata: {
          tab: 'architecture', // Using 'architecture' as the tab/feature name based on previous webhook logic
          plan: plan,
          userId: userId,
          duration_days: '30' // For webhook logic compatibility
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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.client_reference_id;
      const userEmail = session.customer_details?.email;

      // If client_reference_id is present, we assume it's the architecture plan from the payment link
      if (userId) {
        console.log(`Processing purchase for user ID ${userId}`);
        try {
          // Calculate new expiry date (e.g., 30 days for monthly plan)
          const durationDays = 30;
          const now = new Date();
          const newExpiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ architecture_expiry: newExpiryDate.toISOString() })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating user:', updateError);
            return res.status(500).send('Failed to update user');
          }
          console.log(`Updated architecture_expiry for user ID ${userId}`);
        } catch (err) {
          console.error('Error processing webhook logic:', err);
          return res.status(500).send('Internal Server Error');
        }
      } else {
        console.warn('Missing client_reference_id in session. Cannot activate plan.');
      }
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
