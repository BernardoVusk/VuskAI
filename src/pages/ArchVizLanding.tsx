import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Upload, Wand2, Sliders, Shield, ChevronDown, ChevronUp, User, LogOut, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { supabase } from '../lib/supabaseClient';
import { ImageComparisonSlider } from '../components/ui/ImageComparisonSlider';

const ArchVizLanding = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'mensal' | 'trimestral' | 'semestral') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setLoadingPlan(plan);
    try {
      let stripeLink = '';
      if (plan === 'mensal') {
        stripeLink = 'https://buy.stripe.com/test_9B6cMZ9JP2hw8wM4hocfK03';
      } else if (plan === 'trimestral') {
        stripeLink = 'https://buy.stripe.com/test_00weV7cW13lAdR67tAcfK04'; 
      } else if (plan === 'semestral') {
        stripeLink = 'https://buy.stripe.com/test_00wbIV4pvcWa7sI6pwcfK05';
      }

      if (stripeLink) {
        const url = new URL(stripeLink);
        url.searchParams.append('client_reference_id', user.id);
        if (user.email) {
          url.searchParams.append('prefilled_email', user.email);
        }
        // Stripe Checkout não permite ser aberto dentro de iframes (como o preview do AI Studio)
        // Por isso, precisamos abrir em uma nova aba
        window.open(url.toString(), '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao redirecionar para o pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-200 font-sans selection:bg-violet-500/30">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/logo.png.png" alt="VuskVision" className="h-14 md:h-16 object-contain" />
          </motion.div>
          
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[11px] font-medium uppercase tracking-widest text-slate-400">
              <a href="#how-it-works" className="hover:text-white transition-colors duration-300">Processo</a>
              <a href="#presets" className="hover:text-white transition-colors duration-300">Estilos</a>
              <a href="#pricing" className="hover:text-white transition-colors duration-300">Planos</a>
            </div>

            {user ? (
              <div className="flex items-center gap-6 pl-10 border-l border-white/10">
                <Link 
                  to="/vusk-ai"
                  className="group relative px-6 py-2.5 overflow-hidden rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Dashboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-400 transition-colors duration-300"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  Login
                </button>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="relative px-8 py-3 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all duration-500 hover:-translate-y-1"
                >
                  Começar agora
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section: The Monolith */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 mb-8">
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-violet-400 uppercase">Protocolo_Ativo_v6.0</span>
            </div>

            <h1 className="text-5xl md:text-8xl leading-[1.1] tracking-tight text-white mb-8 uppercase">
              O padrão profissional de prompt para <span className="text-slate-500">visualização arquitetônica.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
              Transforme planta ou desenho técnico em um prompt estruturado, pronto para gerar renders consistentes em qualquer IA.
            </p>

            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="group relative px-10 py-5 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Gerar meu prompt <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
              </div>

              <div className="flex items-center gap-8 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-700" /> Sem engine própria</span>
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-700" /> Sem limite de geração</span>
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-700" /> Total controle</span>
              </div>

              <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
                Uso profissional. Cancelamento simples.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Visual Proof: The Interactive Stage */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-7xl mx-auto px-6 mt-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ImageComparisonSlider 
              imageBefore="/antescomponente1.jpeg"
              imageAfter="/depoiscomponente1.png"
              beforeLabel="Sketch"
              afterLabel="Final"
            />
            <ImageComparisonSlider 
              imageBefore="/plantatecnica.png"
              imageAfter="/renderprofissional.png.png"
              beforeLabel="Sketch"
              afterLabel="Final"
            />
            <ImageComparisonSlider 
              imageBefore="/antescomponente3.jpeg"
              imageAfter="/depoiscomponente3.png"
              beforeLabel="Sketch"
              afterLabel="Final"
            />
          </div>
        </motion.div>
      </section>

      {/* POSICIONAMENTO: The Authority Section */}
      <section className="relative py-32 overflow-hidden bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl tracking-tighter text-white mb-8 leading-[1.1]">
                Render consistente começa com <span className="text-slate-500">estrutura.</span>
              </h2>
              <div className="space-y-6 text-lg md:text-xl text-slate-400 leading-relaxed">
                <p>
                  A maioria dos resultados inconsistentes não acontece por falha da IA.
                </p>
                <p className="text-white font-medium">
                  Acontece por falta de estrutura no prompt.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                "Materialidade",
                "Iluminação",
                "Lente e enquadramento",
                "Atmosfera",
                "Linguagem arquitetônica"
              ].map((item, i) => (
                <div key={i} className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    <span className="text-sm font-mono uppercase tracking-widest text-slate-300">{item}</span>
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2 p-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 mt-4">
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Nós organizamos tecnicamente cada detalhe para que o resultado seja previsível e profissional.
                </p>
                <div className="flex flex-wrap gap-4">
                  {["Recebe o prompt completo", "Pode editar", "Pode salvar", "Pode reutilizar"].map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA: The Workflow Section */}
      <section id="how-it-works" className="relative py-32 bg-[#050505] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl tracking-tighter text-white mb-6">Processo direto. Resultado previsível.</h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                step: "01", 
                title: "Envie sua planta, CAD ou imagem", 
                desc: "O sistema analisa a geometria e os volumes do seu projeto original." 
              },
              { 
                step: "02", 
                title: "Receba o prompt estruturado", 
                desc: "Transformamos dados técnicos em linguagem de alta fidelidade para IA." 
              },
              { 
                step: "03", 
                title: "Gere na IA de sua preferência", 
                desc: "Midjourney, Stable Diffusion ou Vizcom. Você tem o controle total." 
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="text-[80px] font-bold text-white/[0.03] leading-none mb-[-40px] transition-colors duration-500 group-hover:text-violet-500/10">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-[1px] bg-white/5" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFÓLIO CURADO: Visual Proof */}
      <section id="portfolio" className="relative py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl tracking-tighter text-white mb-6">Consistência visual aplicada a projetos reais.</h2>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-[0.2em]">Proof_of_Concept_v6.0</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Moderno Clean", before: "Planta Técnica", after: "Render Minimalista" },
              { title: "Alto Padrão", before: "Desenho CAD", after: "Render Premium" },
              { title: "Industrial", before: "Foto Local", after: "Render Loft" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative rounded-[24px] overflow-hidden border border-white/5 bg-[#0A0A0A]"
              >
                <div className="aspect-[4/5] relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  
                  {/* Visual Placeholder for Before/After */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full grid grid-cols-2">
                      <div className="bg-white/[0.02] border-r border-white/5 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest -rotate-90">{item.before}</span>
                      </div>
                      <div className="bg-violet-500/[0.02] flex items-center justify-center">
                        <span className="text-[10px] font-mono text-violet-500/40 uppercase tracking-widest -rotate-90">{item.after}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 z-20">
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Prompt Estruturado</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-12 text-center text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
            Todos os renders foram gerados externamente, utilizando o prompt estruturado pela plataforma.
          </p>
        </div>
      </section>

      {/* ESTILOS BASE: The Presets Section */}
      <section id="presets" className="relative py-32 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.4fr_0.6fr] gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl tracking-tighter text-white mb-8 leading-tight">
                Presets desenvolvidos para <span className="text-violet-500">arquitetura.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-10">
                Projetado para projetos reais, não imagens conceituais aleatórias. Cada estilo já organiza tecnicamente o seu workflow.
              </p>
              
              <div className="space-y-4">
                {[
                  "Paleta de materiais",
                  "Temperatura de luz",
                  "Tipo de lente",
                  "Escala e proporção",
                  "Atmosfera final"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm font-mono text-slate-300 uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-violet-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                "Moderno Clean", "Alto Padrão", "Industrial", 
                "Escandinavo", "Minimalista", "Noturno"
              ].map((name, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 group cursor-pointer"
                >
                  <div className="aspect-square rounded-xl bg-white/[0.03] mb-4 group-hover:bg-violet-500/10 transition-colors duration-500" />
                  <div className="font-bold text-xs text-white uppercase tracking-widest">{name}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAL: Independent by Design */}
      <section className="relative py-32 bg-[#050505] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative p-12 md:p-20 rounded-[48px] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.05)_0%,transparent_70%)]" />
            
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-3xl md:text-5xl tracking-tighter text-white mb-8">Independente por design.</h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                A plataforma não gera imagens. Ela entrega o padrão técnico que permite gerar imagens onde você preferir.
              </p>

              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { title: "Liberdade de escolha", desc: "Use qualquer engine de IA do mercado." },
                  { title: "Continuidade de workflow", desc: "Integre ao seu processo atual sem fricção." },
                  { title: "Escalabilidade", desc: "Gere prompts sem limitações artificiais." }
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="w-8 h-[1px] bg-violet-500" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 inline-flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Controle total sobre o resultado final</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É: Target Audience */}
      <section className="relative py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl tracking-tighter text-white mb-6">Arquitetos e escritórios que buscam o próximo nível.</h2>
              <p className="text-slate-500 text-sm font-mono uppercase tracking-[0.2em]">Target_Profile_v6.0</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Já utilizam IA",
              "Buscam consistência visual",
              "Querem previsibilidade",
              "Valorizam controle técnico"
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors duration-500">
                <div className="text-violet-500 mb-6">
                  <Check className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white uppercase tracking-widest leading-tight">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing: Refactored for Premium Aesthetic */}
      <section id="pricing" className="relative py-32 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl tracking-tighter text-white mb-6">Assinatura simples. Cancele quando quiser.</h2>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-[0.2em]">Pricing_Structure_v6.0</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Mensal */}
            <div className="group p-10 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-8">Plano_Mensal</div>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-bold text-white tracking-tighter">R$ 147</span>
                <span className="text-slate-500 text-sm font-mono uppercase">/mês</span>
              </div>
              <ul className="space-y-4 mb-12">
                {["+1500 prompt/mês", "Presets profissionais", "Editor guiado", "Atualizações"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-slate-400 font-mono uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-slate-700" /> {feat}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribe('mensal')}
                disabled={loadingPlan === 'mensal'}
                className="w-full py-4 rounded-2xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 disabled:opacity-50"
              >
                {loadingPlan === 'mensal' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Começar agora'}
              </button>
            </div>

            {/* Trimestral - Featured */}
            <div className="relative p-10 rounded-[32px] border border-violet-500/30 bg-gradient-to-b from-violet-500/10 to-transparent md:-translate-y-8 shadow-[0_30px_60px_rgba(139,92,246,0.1)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-500 text-white text-[10px] font-bold uppercase tracking-widest">
                Mais Popular
              </div>
              <div className="text-[10px] font-mono text-violet-400 uppercase tracking-[0.2em] mb-8">Plano_Trimestral</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-600 line-through tracking-tighter">R$110</span>
                <span className="text-5xl font-bold text-white tracking-tighter">R$92</span>
                <span className="text-slate-500 text-sm font-mono uppercase">/mês</span>
              </div>
              <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-10">+ 3 MESES GRÁTIS</div>
              <ul className="space-y-4 mb-12">
                {["+3500 prompt/mês", "Presets premium", "Prioridade neural", "Prompts Premium"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-white font-mono uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-violet-500" /> {feat}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribe('trimestral')}
                disabled={loadingPlan === 'trimestral'}
                className="w-full py-4 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-50"
              >
                {loadingPlan === 'trimestral' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Assinar Pro'}
              </button>
            </div>

            {/* Semestral */}
            <div className="group p-10 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-8">Plano_Semestral</div>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-bold text-white tracking-tighter">R$ 99</span>
                <span className="text-slate-500 text-sm font-mono uppercase">/mês</span>
              </div>
              <ul className="space-y-4 mb-12">
                {["Alto volume", "Presets custom", "Atendimento VIP", "Controle total"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-slate-400 font-mono uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-slate-700" /> {feat}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribe('semestral')}
                disabled={loadingPlan === 'semestral'}
                className="w-full py-4 rounded-2xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 disabled:opacity-50"
              >
                {loadingPlan === 'semestral' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Começar agora'}
              </button>
            </div>
          </div>

          <div className="text-center mt-16 text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
            Garantia de 7 dias • Pagamento seguro • Acesso imediato
          </div>
        </div>
      </section>

      {/* CTA FINAL: The Closing */}
      <section className="relative py-40 bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-7xl tracking-tighter text-white mb-8">Controle técnico.<br />Resultado previsível.</h2>
            <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto">
              Desenvolvido para uso profissional. Eleve o padrão das suas apresentações hoje mesmo.
            </p>
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="group relative px-12 py-6 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Começar agora <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl mb-8 text-center">Perguntas frequentes</h2>
          <div className="space-y-3">
            {[
              { q: "Preciso saber usar IA?", a: "Não. A ArchRender AI já entrega o prompt estruturado. Você só escolhe o estilo e ajusta detalhes." },
              { q: "Posso usar planta baixa e desenho técnico?", a: "Sim. Planta, técnico, CAD exportado e até foto de ambiente." },
              { q: "Isso substitui modelagem 3D?", a: "Para visualização e apresentação rápida ao cliente, sim. Para execução hiper técnica, é complementar." },
              { q: "Dá pra trocar materiais e iluminação?", a: "Sim. Você ajusta piso, parede, luz, clima, câmera e mais no prompt guiado." },
              { q: "Posso cancelar quando quiser?", a: "Sim. Cancelamento simples dentro da sua conta." }
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-[#0B1221] overflow-hidden">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-200 hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>
                {openFaq === i && (
                  <div className="p-4 pt-0 text-slate-400 text-sm leading-relaxed border-t border-white/5 bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>© {new Date().getFullYear()} ArchRender AI</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Termos</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-300 transition-colors">WhatsApp</a>
            <a href="mailto:suporte@archrender.ai" className="hover:text-slate-300 transition-colors">suporte@archrender.ai</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArchVizLanding;
