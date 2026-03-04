import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  dotenv.config();
}

const app = express();

// Initialize Stripe and Supabase
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  // apiVersion: '2024-12-18.acacia', // Let library default to installed version
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
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

// Only serve static files if not in Netlify
if (!process.env.NETLIFY) {
  app.use(express.static('public'));
}

app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook' || req.originalUrl.includes('/api/webhook')) {
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
              product: 'prod_U5PrqVddXPhYpA',
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
    let body = req.body;

    // Handle raw body in serverless environments (Netlify)
    if (process.env.NETLIFY && req.body && Buffer.isBuffer(req.body)) {
      body = req.body;
    } else if (process.env.NETLIFY && (req as any).rawBody) {
      body = (req as any).rawBody;
    }

    try {
      if (!sig || !endpointSecret) {
        throw new Error('Missing Stripe signature or webhook secret');
      }
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userEmail = session.customer_details?.email;
          const metadata = session.metadata || {};

          if (!userEmail) {
            console.error('No email found in checkout session');
            break;
          }

          console.log(`Processing checkout for email: ${userEmail}`);

          // 1. Find or Create User
          let targetUserId: string | null = null;

          // Check if user exists in profiles (which mirrors auth.users)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

          if (existingProfile) {
            targetUserId = existingProfile.id;
            console.log(`Found existing user: ${targetUserId}`);
          } else {
            // Create new user via invitation
            console.log(`User not found. Inviting: ${userEmail}`);
            const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(userEmail, {
              data: { 
                full_name: session.customer_details?.name || 'Cliente ArchRender',
                source: 'stripe_checkout'
              }
            });

            if (inviteError) {
              console.error('Error inviting user:', inviteError);
              // Fallback: maybe they exist in auth but not profiles? 
              // (Unlikely with trigger, but let's be safe)
              break;
            }

            if (inviteData?.user) {
              targetUserId = inviteData.user.id;
              console.log(`Invited new user: ${targetUserId}`);
              
              // Small delay to ensure the trigger has finished creating the profile
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          if (targetUserId) {
            const tab = (metadata.tab || 'architecture').toLowerCase();
            
            // Determine duration (Default to 365 for this specific product or check metadata)
            let durationDays = 365; // Default to 1 year for the main offer
            
            if (metadata.duration_days) {
              durationDays = parseInt(metadata.duration_days, 10);
            }

            const now = new Date();
            const newExpiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            const updates: any = {};
            const field = `${tab}_expiry`;
            updates[field] = newExpiryDate.toISOString();

            const { error: updateError } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', targetUserId);

            if (updateError) {
              console.error(`Error updating profile for ${targetUserId}:`, updateError);
            } else {
              console.log(`Successfully updated ${field} for user ${targetUserId} with ${durationDays} days`);
            }
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
                item.price?.product === 'prod_U5PrqVddXPhYpA' || 
                (typeof item.price?.product === 'object' && item.price?.product?.id === 'prod_U5PrqVddXPhYpA')
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

// Vite middleware for development (only if not in Netlify/Production)
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  const setupVite = async () => {
    try {
      const viteModuleName = 'vite';
      const { createServer: createViteServer } = await import(viteModuleName);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite could not be loaded:', e);
    }
  };
  setupVite();
} else {
  // Serve static files in production
  app.use(express.static('dist'));
}

// Export the app for serverless functions
export default app;

// Only listen if running directly (not as a function)
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
