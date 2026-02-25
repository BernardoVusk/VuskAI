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
      
      // Extract metadata
      // Expected metadata: { tab: 'identity' | 'architecture' | 'marketplace', duration_days: '30' }
      const tabName = session.metadata?.tab; 
      const durationDays = parseInt(session.metadata?.duration_days || '0', 10);
      const userEmail = session.customer_details?.email;

      if (userEmail && tabName && durationDays > 0) {
        console.log(`Processing purchase for ${userEmail}: ${tabName} for ${durationDays} days`);

        try {
          // 1. Check if user exists
          const { data: existingUser, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

          // PGRST116 is "No rows found" - handled by checking existingUser
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            return res.status(500).send('Database error');
          }

          // Calculate new expiry date
          const now = new Date();
          const newExpiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          // Map tab name to column name
          let columnToUpdate = '';
          switch (tabName.toLowerCase()) {
            case 'identity':
              columnToUpdate = 'identity_expiry';
              break;
            case 'architecture':
              columnToUpdate = 'architecture_expiry';
              break;
            case 'marketplace':
              columnToUpdate = 'marketplace_expiry';
              break;
            default:
              console.warn(`Unknown tab name: ${tabName}`);
              return res.status(400).send('Invalid tab name in metadata');
          }

          if (existingUser) {
            // Update existing user
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ [columnToUpdate]: newExpiryDate.toISOString() })
              .eq('email', userEmail);

            if (updateError) {
              console.error('Error updating user:', updateError);
              return res.status(500).send('Failed to update user');
            }
            console.log(`Updated expiry for ${userEmail}`);
          } else {
            // Create new user
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                email: userEmail,
                [columnToUpdate]: newExpiryDate.toISOString(),
              });

            if (insertError) {
              console.error('Error creating user:', insertError);
              return res.status(500).send('Failed to create user');
            }
            console.log(`Created new profile for ${userEmail}`);
          }

        } catch (err) {
          console.error('Error processing webhook logic:', err);
          return res.status(500).send('Internal Server Error');
        }
      } else {
        console.warn('Missing required metadata or email in session');
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
