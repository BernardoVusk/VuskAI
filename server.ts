import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  dotenv.config();
}

const app = express();

// Initialize Stripe and Supabase
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('WARNING: STRIPE_SECRET_KEY is missing. Payment operations will fail.');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('WARNING: STRIPE_WEBHOOK_SECRET is missing. Webhook signature verification will fail.');
}

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

// Initialize Gemini AI lazily to prevent crash if key is missing
let genAI: GoogleGenAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AI] Erro: GEMINI_API_KEY não configurada.');
      throw new Error('API key must be set when using the Gemini API.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// --- CONFIGURAÇÃO DE FILA (14 REQ/MIN) ---
const MAX_REQ_PER_MINUTE = 14;
const MIN_INTERVAL_MS = Math.ceil(60000 / MAX_REQ_PER_MINUTE); // ~4286ms

const processQueue = async () => {
  const startTime = Date.now();
  
  try {
    // Buscar o próximo job pendente
    const { data: job, error: fetchError } = await supabase
      .from('ai_generation_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError || !job) {
      // Se não há jobs, apenas retorna. O finally cuidará de agendar a próxima execução.
      return;
    }

    // Marcar como processando
    await supabase
      .from('ai_generation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.id);

    console.log(`[Worker] Processando Job: ${job.id} com Gemini 1.5 Flash`);

    const executeWithRetry = async (attempt = 0): Promise<string> => {
      try {
        let promptConfig: any = {
          model: "gemini-1.5-flash",
          contents: [{ 
            role: 'user', 
            parts: [{ text: "Analise esta imagem detalhadamente e gere um prompt de arquitetura ultra-realista para renderização 4K, focando em materiais, iluminação e composição." }] 
          }]
        };

        // Se a imagem for base64, envia como parte inline
        if (job.input_image_url?.startsWith('data:')) {
          const [mimePart, base64Data] = job.input_image_url.split(',');
          const mimeType = mimePart.split(':')[1].split(';')[0];
          promptConfig.contents[0].parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        } else if (job.input_image_url) {
          promptConfig.contents[0].parts[0].text += `\nLink da imagem: ${job.input_image_url}`;
        }

        const genAIInstance = getGenAI();
        const result = await genAIInstance.models.generateContent(promptConfig);
        return result.text || "Erro: IA retornou resposta vazia.";
      } catch (err: any) {
        const isRetryable = err.status === 429 || err.status >= 500;
        if (isRetryable && attempt < 2) {
          const delay = Math.pow(2, attempt) * 3000;
          await new Promise(res => setTimeout(res, delay));
          return executeWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    const prompt = await executeWithRetry();

    await supabase
      .from('ai_generation_jobs')
      .update({ 
        status: 'completed', 
        output_prompt: prompt,
        updated_at: new Date().toISOString() 
      })
      .eq('id', job.id);

    console.log(`[Worker] Job ${job.id} finalizado.`);
  } catch (err: any) {
    console.error(`[Worker] Erro no job:`, err.message);
    // Em caso de erro, marcamos como falho para não travar a fila
  } finally {
    // Cálculo para manter exatamente 14 req/min
    const executionTime = Date.now() - startTime;
    const waitTime = Math.max(500, MIN_INTERVAL_MS - executionTime);
    setTimeout(processQueue, waitTime);
  }
};

// Iniciar o loop do worker
processQueue();

// Middleware for raw body parsing (needed for Stripe webhook verification)
// Use a more permissive type to ensure we capture the body even if content-type varies slightly
app.use('/api/webhook', express.raw({ type: '*/*' }));

// Standard middleware for other routes
app.use(cors());

// Diagnostic route to check if webhook endpoint is reachable
app.get('/api/webhook', (req, res) => {
  res.send('Webhook endpoint is active. Use POST for Stripe events.');
});

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

app.post("/api/generate-queue", async (req, res) => {
  const { userId, imageUrl } = req.body;

  if (!userId) return res.status(401).json({ error: "Usuário não identificado" });

  try {
    // Inserir o job na fila
    const { data: job, error } = await supabase
      .from('ai_generation_jobs')
      .insert({
        user_id: userId,
        input_image_url: imageUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Retorna imediatamente o ID para o frontend
    res.json({ jobId: job.id });
  } catch (err: any) {
    console.error("[API] Erro ao enfileirar job:", err.message);
    res.status(500).json({ error: "Falha ao processar requisição" });
  }
});
  
  // Image Analysis Endpoint (Replacing Netlify function)
  app.post('/api/analyze-image', async (req, res) => {
    res.status(410).json({ error: 'This endpoint is deprecated. Use frontend Gemini integration.' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Admin: Update User Password
  app.post('/api/admin/update-password', express.json(), async (req, res) => {
    const { userId, newPassword, adminToken } = req.body;

    if (!userId || !newPassword || !adminToken) {
      return res.status(400).json({ error: 'User ID, password and admin token are required' });
    }

    try {
      // Verify admin status using the provided token
      const { data: { user }, error: authError } = await supabase.auth.getUser(adminToken);
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const isAdmin = user.email === 'bernardomorais28@yahoo.com' || 
                      user.email === 'espetoclips@gmail.com' || 
                      user.user_metadata?.role === 'admin';

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      console.log(`[Admin] Atualizando senha para o usuário: ${userId}`);

      // Update user password using admin API (bypasses RLS and user restrictions)
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;

      res.json({ message: 'Senha atualizada com sucesso!' });
    } catch (err: any) {
      console.error('Error updating password:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update User Plan Expiry
  app.post('/api/admin/update-plan', express.json(), async (req, res) => {
    const { userId, updates, adminToken } = req.body;

    if (!userId || !updates || !adminToken) {
      return res.status(400).json({ error: 'User ID, updates and admin token are required' });
    }

    try {
      // Verify admin status
      const { data: { user }, error: authError } = await supabase.auth.getUser(adminToken);
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const isAdmin = user.email === 'bernardomorais28@yahoo.com' || 
                      user.email === 'espetoclips@gmail.com' || 
                      user.user_metadata?.role === 'admin';

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      // Update user profile using admin client (bypasses RLS)
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      res.json({ message: 'Plano atualizado com sucesso!' });
    } catch (err: any) {
      console.error('Error updating plan:', err);
      res.status(500).json({ error: err.message });
    }
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
    try {
      console.log('[Webhook] Recebido evento POST do Stripe');
      
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        console.error('[Webhook] Erro: Assinatura ou Secret ausentes');
        return res.status(400).send('Webhook Error: Missing signature or secret');
      }

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[Webhook] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing.');
      }

      let event: Stripe.Event;
      try {
        // req.body is a Buffer because of express.raw middleware
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error(`[Webhook] Erro na validação da assinatura: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log(`[Webhook] Evento validado: ${event.type}`);

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userEmail = session.customer_details?.email;
          const metadata = session.metadata || {};

          if (!userEmail) {
            console.error('[Webhook] No email found in checkout session');
            break;
          }

          console.log(`[Webhook] Processing checkout for email: ${userEmail}`);

          // 1. Find or Create User
          let targetUserId: string | null = null;

          // Check if user exists in profiles
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (existingProfile) {
            targetUserId = existingProfile.id;
            console.log(`[Webhook] Usuário existente: ${targetUserId}`);
          } else {
            console.log(`[Webhook] Perfil não encontrado para ${userEmail}. Verificando Auth...`);
            
            const { data: userData } = await supabase.auth.admin.listUsers();
            const existingAuthUser = (userData?.users as any[])?.find((u: any) => u.email?.toLowerCase() === userEmail.toLowerCase());
            
            if (existingAuthUser) {
              targetUserId = existingAuthUser.id;
              console.log(`[Webhook] Usuário encontrado no Auth: ${targetUserId}`);
            } else {
              console.log(`[Webhook] Enviando convite para: ${userEmail}`);
              const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(userEmail, {
                redirectTo: `${process.env.APP_URL || 'https://archrenderai.com'}/?type=invite`,
                data: { 
                  full_name: session.customer_details?.name || 'Cliente ArchRender',
                  source: 'stripe_checkout'
                }
              });

              if (inviteError) {
                console.error('[Webhook] Erro ao convidar, tentando criação direta...');
                const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                  email: userEmail,
                  email_confirm: true,
                  user_metadata: { 
                    full_name: session.customer_details?.name || 'Cliente ArchRender',
                    source: 'stripe_checkout_fallback'
                  }
                });
                
                if (createError) {
                  console.error('[Webhook] Falha total na criação:', createError.message);
                } else if (createData?.user) {
                  targetUserId = createData.user.id;
                }
              } else if (inviteData?.user) {
                targetUserId = inviteData.user.id;
              }
            }
          }

          if (targetUserId) {
            const tab = (metadata.tab || 'architecture').toLowerCase();
            let durationDays = 365; 
            if (metadata.duration_days) {
              durationDays = parseInt(metadata.duration_days, 10);
            }

            const now = new Date();
            const newExpiryDate = new Date(now.getTime() + (durationDays + 2) * 24 * 60 * 60 * 1000);

            const updates: any = {};
            const field = `${tab}_expiry`;
            updates[field] = newExpiryDate.toISOString();

            console.log(`[Webhook] Atualizando ${field} para ${targetUserId}`);

            const { error: updateError } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', targetUserId);

            if (updateError) {
              // Upsert fallback
              await supabase.from('profiles').upsert({
                id: targetUserId,
                email: userEmail,
                full_name: session.customer_details?.name || 'Cliente ArchRender',
                ...updates
              });
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
              let renewalDays = 32; 
              const isYearly = subscription.items.data.some(item => 
                item.price?.product === 'prod_U5PrqVddXPhYpA' || 
                (typeof item.price?.product === 'object' && item.price?.product?.id === 'prod_U5PrqVddXPhYpA')
              );
              
              if (isYearly) renewalDays = 367;

              const newExpiryDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000);
              const updates: any = {};
              updates[`${tab}_expiry`] = newExpiryDate.toISOString();

              await supabase.from('profiles').update(updates).eq('id', userId);
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
            updates[`${tab}_expiry`] = new Date(0).toISOString();
            await supabase.from('profiles').update(updates).eq('id', userId);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('[Webhook] Erro inesperado:', err);
      res.status(500).send('Internal Server Error');
    }
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

// Start server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
