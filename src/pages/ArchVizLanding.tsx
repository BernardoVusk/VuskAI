import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Zap, 
  Video, 
  Layout, 
  Infinity as InfinityIcon, 
  CheckCircle2, 
  Star,
  ChevronRight,
  Image,
  Play,
  Presentation,
  ArrowUp,
  LogOut,
  Loader2,
  Check,
  Ruler,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { supabase } from '../lib/supabaseClient';
import * as fbq from '../lib/pixel';

// Image URLs - Replace these with your hosted image links
const LOGO_URL = "https://i.imgur.com/JeRxE3T.png"; 
const BEFORE_IMG_URL = "https://i.imgur.com/EjeHM68.png"; 
const AFTER_IMG_URL = "https://i.imgur.com/5REtrHc.png"; 

gsap.registerPlugin(ScrollTrigger);

const ArchVizLanding = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [spots, setSpots] = useState(14);
  const [timeLeft, setTimeLeft] = useState(899); // 14:59
  const headerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Check for success parameter to track Purchase
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      const plan = params.get('plan') || 'lifetime';
      // Values based on your Stripe configuration
      const value = 497.00; 
      fbq.event('Purchase', {
        value: value,
        currency: 'BRL',
        content_name: `ArchRender AI - ${plan}`,
        content_category: 'Architecture Software'
      });
    }
  }, [location]);

  useEffect(() => {
    // Dynamic spots counter: 14 to 3
    const spotsInterval = setInterval(() => {
      setSpots(prev => {
        if (prev <= 3) return 3;
        if (Math.random() > 0.6) return prev - 1;
        return prev;
      });
    }, 20000);

    // Countdown timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(spotsInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Automatically open AuthModal if we detect an invitation or recovery hash
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=invite') || hash.includes('type=recovery') || hash.includes('type=signup'))) {
        console.log('Invitation/Recovery detected, opening AuthModal');
        // Small delay to ensure the UI is ready
        setTimeout(() => setIsAuthOpen(true), 500);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-title', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.2
      });

      gsap.from('.hero-sub', {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: 'power3.out'
      });

      gsap.from('.hero-cta', {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        delay: 0.8,
        ease: 'back.out(1.7)'
      });

      gsap.utils.toArray('.reveal-up').forEach((elem: any) => {
        gsap.to(elem, {
          scrollTrigger: {
            trigger: elem,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out'
        });
      });

      ScrollTrigger.create({
        start: 'top -80',
        onUpdate: (self) => {
          if (self.direction === 1) {
            gsap.to(headerRef.current, { y: -100, duration: 0.3 });
          } else {
            gsap.to(headerRef.current, { y: 0, duration: 0.3, backgroundColor: 'rgba(5, 5, 5, 0.8)' });
          }
        }
      });
    });

    return () => ctx.revert();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubscribe = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      // Track InitiateCheckout
      fbq.event('InitiateCheckout', {
        content_name: `ArchRender AI - ${plan}`,
        content_category: 'Architecture Software',
        value: 497.00,
        currency: 'BRL'
      });

      // Use the provided Stripe link
      const stripeLink = 'https://buy.stripe.com/3cIaER80i3iVecD4Ee1gs08';
      const url = new URL(stripeLink);
      
      if (user) {
        url.searchParams.append('client_reference_id', user.id);
        if (user.email) url.searchParams.append('prefilled_email', user.email);
      }
      
      window.open(url.toString(), '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao redirecionar para o pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      {/* Top Announcement Bar */}
      <div className="fixed top-0 left-0 w-full z-[60] bg-emerald-500/10 backdrop-blur-md border-b border-emerald-500/20 py-2 md:py-3 px-4 h-10 md:h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
          <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 animate-pulse">
            OFERTA DE LANÇAMENTO: Restam apenas <span className="text-white bg-emerald-500 px-2 py-0.5 rounded mx-1">{spots}</span> vagas com 51% OFF
          </p>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
            <span className="text-[10px] font-mono font-bold text-white tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <header 
        ref={headerRef}
        className="fixed top-10 md:top-12 left-0 w-full z-50 px-4 md:px-6 py-2 transition-all duration-300 backdrop-blur-md border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center relative h-full w-32 md:w-48">
            <img 
              src={LOGO_URL} 
              alt="ArchRender AI" 
              className="h-20 md:h-44 w-auto object-contain max-w-none absolute left-0 top-1/2 -translate-y-1/2 z-10" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = '<span class="text-xl font-black tracking-tighter text-white">ARCHRENDER<span class="text-emerald-500">AI</span></span>';
                }
              }}
            />
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#ferramentas" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Ferramentas</a>
            <a href="#pipeline" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Processo</a>
            <a href="#diferenciais" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Diferenciais</a>
            <a href="#depoimentos" className="hover:text-white transition-colors uppercase tracking-widest text-[10px]">Depoimentos</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/arch-render" 
                    className="btn-primary text-[10px] md:text-xs py-2 px-4 md:px-6 uppercase tracking-widest font-bold"
                  >
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="btn-primary flex items-center gap-2 group text-[10px] md:text-sm py-2 md:py-2.5 px-4 md:px-6 uppercase tracking-widest font-bold"
                >
                  <span>Acesso Ilimitado</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            <button 
              className="lg:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 w-full bg-dark/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-6 py-8 flex flex-col gap-6">
            <a href="#ferramentas" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white uppercase tracking-[0.2em] text-xs font-bold">Ferramentas</a>
            <a href="#pipeline" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white uppercase tracking-[0.2em] text-xs font-bold">Processo</a>
            <a href="#diferenciais" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white uppercase tracking-[0.2em] text-xs font-bold">Diferenciais</a>
            <a href="#depoimentos" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white uppercase tracking-[0.2em] text-xs font-bold">Depoimentos</a>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
              {user ? (
                <>
                  <Link 
                    to="/arch-render" 
                    className="btn-primary text-center py-3 uppercase tracking-widest font-bold text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-white/40 hover:text-white text-xs uppercase tracking-widest font-bold py-2">
                    Sair
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                  className="btn-primary py-3 uppercase tracking-widest font-bold text-xs"
                >
                  Acesso Ilimitado
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col items-center justify-center px-4 md:px-6 pt-40 md:pt-52 pb-20 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxury Interior" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/40 to-dark"></div>
        </div>

        <div ref={heroRef} className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-6 hero-sub">
            <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            A Revolução da Apresentação Arquitetônica
          </div>
          
          <h1 className="text-[1.5rem] sm:text-4xl md:text-6xl lg:text-[4rem] font-display font-black tracking-[-0.03em] leading-[1.1] md:leading-[0.95] mb-6 md:mb-10 hero-title uppercase break-words">
            O sistema <br className="hidden sm:block" />
            perfeito de <br className="hidden sm:block" />
            aceleração e <br className="hidden sm:block" />
            fechamento <br className="hidden sm:block" />
            de projetos
          </h1>

          <div className="text-[8px] md:text-xs font-bold text-white/60 mb-6 md:mb-12 hero-sub tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-2 md:gap-3 uppercase">
            <div className="w-4 h-4 flex items-center justify-center">
              <Ruler className="w-3.5 h-3.5 opacity-50" />
            </div>
            Para arquitetos e designers de interiores
          </div>
          
          <p className="text-[11px] md:text-base text-white/50 max-w-2xl mx-auto mb-8 md:mb-12 hero-sub leading-relaxed px-2 md:px-0">
            O ArchRender AI cuida de toda a parte técnica das suas apresentações para que você foque no que realmente importa: prospectar e faturar.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 hero-cta px-4 md:px-0 relative">
            <div className="relative group">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4 z-20 bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-xl shadow-red-600/20 uppercase tracking-widest"
              >
                OFERTA LIMITADA -51%
              </motion.div>
              <button 
                onClick={() => handleSubscribe('lifetime')}
                disabled={loadingPlan === 'lifetime'}
                className="btn-primary text-sm md:text-lg px-8 md:px-12 py-4 md:py-5 w-full sm:w-auto text-center uppercase tracking-widest font-black flex items-center justify-center gap-3"
              >
                {loadingPlan === 'lifetime' ? <Loader2 className="animate-spin" /> : (
                  <>
                    <span>Começar Agora — R$ 41</span>
                  </>
                )}
              </button>
            </div>
            <a 
              href="#pipeline"
              className="glass px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-sm md:text-lg hover:bg-white/10 transition-all w-full sm:w-auto text-center uppercase tracking-widest"
            >
              Ver Demonstração
            </a>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2 hero-sub">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                {94 - (14 - spots)}/100 vagas preenchidas
              </span>
              <span className="text-white/20">|</span>
              <span className="text-white/40">Preço final: <span className="font-mono text-white">R$ 41/mês</span></span>
            </div>
            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest">O preço subirá para R$ 84 em breve</p>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-4 opacity-40">
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-center max-w-xs leading-relaxed flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            Arquitetos estão usando para fechar até 3-5 projetos extras por semana
          </span>
        </div>
      </section>

      {/* Authority Marquee */}
      <section className="py-12 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="flex justify-center mb-6 opacity-40">
          <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black">Tecnologias Integradas</span>
        </div>
        <div className="marquee-content flex gap-12 md:gap-24 items-center">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
              <span className="text-xl md:text-3xl font-sans font-bold whitespace-nowrap tracking-tighter">Wanx</span>
              <span className="text-xl md:text-3xl font-sans font-bold whitespace-nowrap tracking-tighter">Hunyuan</span>
              <span className="text-xl md:text-3xl font-sans font-bold whitespace-nowrap tracking-tighter">OpenAI</span>
              <span className="text-xl md:text-3xl font-sans font-bold whitespace-nowrap tracking-tighter">Gemini</span>
              <span className="text-xl md:text-3xl font-sans font-bold whitespace-nowrap tracking-tighter">Kling</span>
              <span className="text-xl md:text-3xl font-sans font-bold whitespace-nowrap tracking-tighter">Claude</span>
            </div>
          ))}
        </div>
      </section>

      {/* Transformation Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto reveal-up">
          <div className="glass p-6 sm:p-10 md:p-20 rounded-2xl sm:rounded-[3rem] relative overflow-hidden border border-white/10">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-12">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Eficiência Máxima
              </div>
              
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div>
                  <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-[5rem] font-display font-bold mb-8 leading-[1.1] md:leading-[1] tracking-tight">
                    Vamos <br className="hidden sm:block" />
                    automatizar <br className="hidden sm:block" />
                    todos os <br className="hidden sm:block" />
                    processos <br className="hidden sm:block" />
                    de venda
                  </h2>
                </div>
                
                <div className="space-y-10">
                  <div className="w-12 h-[1px] bg-white/20"></div>
                  <div className="space-y-8">
                    <p className="text-lg md:text-xl text-white/50 leading-relaxed">
                      Para que você tenha tempo para focar no que realmente importa para o crescimento e faturamento de sua empresa: 
                    </p>
                    <div className="border-l border-white/20 pl-8">
                      <p className="text-lg md:text-xl text-white italic leading-relaxed">
                        na captação e apresentação para novos clientes e no desenvolvimento dos projetos já fechados.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pt-6">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-7 h-7 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black">Fluxo 100% Otimizado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="ferramentas" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal-up">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">O Poder do ArchRender AI</h2>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto">
              Três ferramentas integradas para transformar seu fluxo de trabalho de dias em segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Render Ultra Realista",
                desc: "Transforme plantas baixas, cortes ou modelos 3D em imagens de ultra qualidade em segundos. Fidelidade total sem distorções.",
                icon: <Zap className="w-5 h-5" />,
                img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop"
              },
              {
                title: "Vídeos Cinematográficos",
                desc: "Crie tours 360°, simulações de drone e construção em lote. Vídeos que impressionam e vendem o projeto antes mesmo da obra.",
                icon: <Video className="w-5 h-5" />,
                video: "https://player.vimeo.com/video/1169908340?autoplay=1&loop=1&muted=1&background=1"
              },
              {
                title: "Apresentações de Elite",
                desc: "Slides automáticos com logotipo, detalhes do cliente e oferta. Uma apresentação profissional completa em um clique.",
                icon: <Layout className="w-5 h-5" />,
                img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
              }
            ].map((feature, i) => (
              <div key={i} className="bento-card reveal-up group p-6 sm:p-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 mb-8 group-hover:bg-white/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-sans font-bold mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-8">
                  {feature.desc}
                </p>
                <div className="rounded-2xl overflow-hidden aspect-video bg-white/5 relative">
                  {feature.video ? (
                    <iframe
                      src={feature.video}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none scale-[3.5]"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <img src={feature.img} alt={feature.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Automation Summary */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto reveal-up">
          <div className="glass p-8 sm:p-12 md:p-20 rounded-2xl sm:rounded-[3rem] text-center border border-white/10">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold mb-12 md:mb-16 tracking-tight max-w-3xl mx-auto">
              3 processos que antes tomavam tempo, agora totalmente automatizados
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12 md:mb-16">
              {[
                { label: "Gere Imagens", sub: "Ultra realismo em segundos", num: "01" },
                { label: "Gere Vídeos", sub: "Tours cinematográficos", num: "02" },
                { label: "Apresentações", sub: "Slides de elite automáticos", num: "03" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 mb-4 md:mb-6">
                    {item.num}
                  </div>
                  <h4 className="text-lg md:text-xl font-sans font-bold mb-2">{item.label}</h4>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-8">
              <Check className="w-4 h-4" /> Tudo com pouquíssimos cliques, em poucos segundos
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <span>Uso Ilimitado</span>
              <span>•</span>
              <span>Personalização</span>
              <span>•</span>
              <span>Detalhamento Completo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Creation Pipeline Showcase */}
      <section id="pipeline" className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 reveal-up">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase mb-6 tracking-[0.3em]">
                <Zap className="w-4 h-4" /> Pipeline de Produção
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold mb-8 tracking-tight leading-tight">Do Conceito à Entrega Final</h2>
              <p className="text-white/40 text-base md:text-xl leading-relaxed">
                Nossa IA não apenas gera imagens; ela cuida de todo o fluxo de trabalho do arquiteto moderno.
              </p>
            </div>
            <div className="hidden md:flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 font-black text-xs">0{i}</div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Image Before/After */}
            <div className="reveal-up group">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-black">Etapa 01</span>
                  <h3 className="text-xl font-sans font-bold tracking-tight">Renderização Realista</h3>
                </div>
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 h-full relative overflow-hidden border-r border-white/20">
                    <img 
                      src={BEFORE_IMG_URL} 
                      alt="Before" 
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Sketch / Base</div>
                  </div>
                  <div className="w-1/2 h-full relative overflow-hidden">
                    <img 
                      src={AFTER_IMG_URL} 
                      alt="After" 
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-emerald-500 px-3 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest">IA Render</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Video Generation */}
            <div className="reveal-up group">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-black">Etapa 02</span>
                  <h3 className="text-xl font-sans font-bold tracking-tight">Animação Cinematográfica</h3>
                </div>
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                <iframe
                  src="https://player.vimeo.com/video/1169908340?autoplay=1&loop=1&muted=1&background=1"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none scale-[2.2] opacity-60"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-all cursor-pointer">
                  <Play className="w-6 h-6 fill-white" />
                </div>
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Video IA (4K)</div>
              </div>
            </div>

            {/* Step 3: Presentation Carousel */}
            <div className="reveal-up group">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-black">Etapa 03</span>
                  <h3 className="text-xl font-sans font-bold tracking-tight">Apresentação de Impacto</h3>
                </div>
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
                <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 overflow-hidden relative">
                   <img 
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop" 
                    alt="Slide 1" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6">
                    <div className="w-12 h-1 bg-emerald-500 mb-4"></div>
                    <h4 className="text-lg font-sans font-bold tracking-tight">Conceito Minimalista</h4>
                    <p className="text-[8px] text-white/40 mt-1 uppercase tracking-[0.3em] font-black">Slide 01 de 12</p>
                  </div>
                </div>
                <div className="h-20 flex gap-4">
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/5 overflow-hidden opacity-50">
                    <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop" alt="Slide 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/5 overflow-hidden opacity-50">
                    <img src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1000&auto=format&fit=crop" alt="Slide 3" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators (Bento Grid) */}
      <section id="diferenciais" className="py-20 md:py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-10 reveal-up">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold mb-6 md:mb-8 tracking-tight">Por que somos diferentes?</h2>
              <p className="text-white/40 text-base md:text-xl leading-relaxed">
                Não somos apenas mais uma IA. Somos um sistema desenhado para o crescimento do seu escritório.
              </p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-black tracking-[0.4em] uppercase text-white/30">
              <div className="w-16 h-[1px] bg-white/10"></div>
              Diferenciais Exclusivos
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Large Card */}
            <div className="md:col-span-8 bento-card reveal-up flex flex-col md:flex-row gap-8 md:gap-10 items-center overflow-hidden p-6 sm:p-10 md:p-12">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-[8px] font-black text-white/30 uppercase mb-4 md:mb-6 tracking-[0.3em]">
                  <InfinityIcon className="w-3 h-3" /> Uso Ilimitado
                </div>
                <h3 className="text-xl sm:text-2xl md:text-4xl font-sans font-bold mb-4 md:mb-6 tracking-tight">🚀 Sem Tokens, Sem Limites</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Esqueça a preocupação com créditos. Use nossa ferramenta de forma ilimitada. Errou? Refaça em segundos sem custo adicional.
                </p>
              </div>
              <div className="w-full md:w-1/2 h-48 sm:h-64 rounded-2xl bg-white/5 flex flex-col items-center justify-center relative overflow-hidden p-6 sm:p-8 border border-white/5">
                <div className="text-[8px] font-black text-white/20 mb-2 md:mb-4 uppercase tracking-[0.4em]">Gerações Hoje</div>
                <div className="text-5xl sm:text-7xl font-sans font-bold text-white">∞</div>
                <div className="mt-4 md:mt-8 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-6 sm:w-8 h-1 rounded-full bg-emerald-500/20"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Small Card */}
            <div className="md:col-span-4 bento-card reveal-up flex flex-col justify-between p-6 sm:p-10 md:p-12 border-emerald-500/20">
              <div>
                <h3 className="text-xl sm:text-2xl font-sans font-bold mb-4 tracking-tight flex items-center gap-3">
                  <span className="text-2xl">💎</span> Preço Acessível
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Tecnologia de ponta com o melhor custo-benefício do mercado brasileiro.
                </p>
              </div>
              <div className="mt-6 md:mt-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest">APENAS {spots} VAGAS</span>
                  <span className="text-sm text-white/20 line-through font-bold">R$ 83</span>
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tighter">
                  R$ 41<span className="text-sm text-white/20 font-sans tracking-normal">/mês</span>
                </div>
                <p className="mt-4 text-[8px] text-white/20 font-black uppercase tracking-widest">Preço garantido para os primeiros 100</p>
              </div>
            </div>

            {/* Small Card */}
            <div className="md:col-span-4 bento-card reveal-up p-6 sm:p-10 md:p-12">
              <h3 className="text-xl sm:text-2xl font-sans font-bold mb-4 tracking-tight">🧠 Análise Inteligente</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Nossa IA analisa qualquer ângulo ou iluminação automaticamente. Sem necessidade de prompts complexos.
              </p>
            </div>

            {/* Middle Card (Visual) */}
            <div className="md:col-span-4 bento-card reveal-up p-8 flex flex-col justify-center">
              <div className="glass p-6 rounded-2xl font-mono text-[8px] text-white/30 leading-relaxed">
                <div className="flex gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                </div>
                <p>/imagine architecture_luxury_interior --v 6.0 --stylize 750...</p>
              </div>
            </div>

            {/* Small Card */}
            <div className="md:col-span-4 bento-card reveal-up p-6 sm:p-10 md:p-12">
              <h3 className="text-xl sm:text-2xl font-sans font-bold mb-4 tracking-tight">🎉 Prompts Personalizáveis</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Enviamos o prompt de criação para você. Tenha controle total, crie variações e use em outras ferramentas se desejar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20 reveal-up">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">Quem usa, aprova</h2>
            <p className="text-white/40 text-base md:text-xl">Resultados reais de profissionais que transformaram seus escritórios.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: "Mariana Silva",
                role: "Arquiteta Autônoma",
                text: "Antes eu levava 3 dias para uma apresentação. Com o ArchRender AI, entrego em 15 minutos e fechei 4 clientes só na última semana.",
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop"
              },
              {
                name: "Ricardo Mendes",
                role: "Diretor de Design",
                text: "O diferencial do uso ilimitado é absurdo. Minha equipe testa dezenas de variações sem medo de gastar tokens. O faturamento subiu 40%.",
                img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop"
              },
              {
                name: "Juliana Costa",
                role: "Designer de Interiores",
                text: "A qualidade dos vídeos cinematográficos deixa os clientes boquiabertos. É impossível não fechar o projeto depois de ver a apresentação.",
                img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop"
              }
            ].map((item, i) => (
              <div key={i} className="bento-card reveal-up p-6 sm:p-10">
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-lg italic text-white/70 mb-10 leading-relaxed font-medium">"{item.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={item.img} alt={item.name} className="w-12 h-12 rounded-full object-cover grayscale border border-white/10" referrerPolicy="no-referrer" />
                  <div>
                    <div className="font-bold text-base tracking-tight">{item.name}</div>
                    <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto glass rounded-2xl sm:rounded-[3rem] p-8 sm:p-12 md:p-24 text-center relative overflow-hidden reveal-up">
          <div className="absolute inset-0 z-0 opacity-10">
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
              alt="Background" 
              className="w-full h-full object-cover grayscale"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold mb-8 leading-[1.1] tracking-tight">Pronto para escalar seu escritório?</h2>
            <p className="text-base md:text-xl text-white/50 mb-12 max-w-2xl mx-auto">
              Junte-se a centenas de arquitetos que já estão usando a IA para vender mais e trabalhar menos.
            </p>
            
            <div className="flex items-center justify-center -space-x-3 mb-12">
              {[
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=100&auto=format&fit=crop"
              ].map((src, i) => (
                <img 
                  key={i}
                  src={src} 
                  alt={`User ${i + 1}`} 
                  className="w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-dark object-cover grayscale"
                  referrerPolicy="no-referrer"
                />
              ))}
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-dark bg-indigo-600 flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleSubscribe('lifetime')}
              disabled={loadingPlan === 'lifetime'}
              className="btn-primary text-base sm:text-lg md:text-2xl px-8 sm:px-12 py-4 sm:py-6 group inline-flex items-center justify-center font-bold tracking-tight w-full sm:w-auto"
            >
              {loadingPlan === 'lifetime' ? <Loader2 className="animate-spin" /> : 'Quero Acesso Anual Agora'}
              <ChevronRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform w-5 h-5 md:w-8 md:h-8" />
            </button>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                <span className="flex items-center gap-2">
                  <X className="w-3 h-3 text-red-500 rotate-45" /> Restam apenas {spots} das 100 vagas promocionais
                </span>
              </div>
              <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '86%' }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            <div className="mt-10 text-[8px] md:text-[10px] text-white/20 flex flex-wrap items-center justify-center gap-6 font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sem fidelidade</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Suporte 24/7</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Curso Incluso</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-dark">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center">
            <img 
              src={LOGO_URL} 
              alt="ArchRender AI" 
              className="h-20 md:h-28 w-auto opacity-50 hover:opacity-100 transition-opacity" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = '<span class="text-xl font-black tracking-tighter text-white">ARCHRENDER<span class="text-emerald-500">AI</span></span>';
                }
              }}
            />
          </div>
          
          <div className="text-white/20 text-[10px] text-center md:text-left font-medium">
            <p>© 2026 ArchRender AI. Todos os direitos reservados.</p>
            <div className="mt-2 flex flex-col md:flex-row gap-4 md:gap-8 uppercase tracking-widest font-black">
              <p>Contato: +55 31 99311-1420</p>
              <p>E-mail: suporte@archrenderai.com</p>
            </div>
          </div>
          
          <div className="flex gap-6 text-white/30 text-[8px] font-black uppercase tracking-[0.3em]">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/5531993111420"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 md:w-20 md:h-20 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        aria-label="Contato via WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-8 h-8 md:w-10 md:h-10 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-6 bg-white text-black px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl pointer-events-none hidden md:block uppercase tracking-widest">
          Fale Conosco
        </span>
      </a>

      {/* Back to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-28 md:right-36 z-[60] w-12 h-12 md:w-16 md:h-16 glass rounded-full flex items-center justify-center shadow-2xl hover:bg-white/10 transition-all group"
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="w-5 h-5 md:w-6 md:h-6 text-white/70 group-hover:text-white transition-colors" />
      </button>
    </div>
  );
};

export default ArchVizLanding;
