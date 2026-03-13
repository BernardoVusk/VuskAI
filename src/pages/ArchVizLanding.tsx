import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Video, 
  Layout, 
  Infinity as InfinityIcon, 
  CheckCircle2, 
  Play,
  Presentation,
  LogOut,
  Loader2,
  Check,
  Menu,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { ComparisonSlider } from '../components/ui/ComparisonSlider';
import { supabase } from '../lib/supabaseClient';
import * as fbq from '../lib/pixel';

// Image URLs
const LOGO_URL = "https://i.imgur.com/ptDOAO8.png"; 

gsap.registerPlugin(ScrollTrigger);

const ArchVizLanding = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [spots, setSpots] = useState(14);
  const [timeLeft, setTimeLeft] = useState(899); // 14:59
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Global error handler to catch circular structure errors from third-party scripts
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('Converting circular structure to JSON') || 
          event.error?.message?.includes('Converting circular structure to JSON')) {
        event.preventDefault();
        console.warn('Caught and suppressed circular structure error from third-party script.');
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Converting circular structure to JSON')) {
        event.preventDefault();
        console.warn('Caught and suppressed circular structure rejection from third-party script.');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Interactive States
  const [sliderPercent, setSliderPercent] = useState(50);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState({
    id: 'maquete',
    beforeImg: 'https://i.imgur.com/n3HXpNO.png',
    afterImg: 'https://i.imgur.com/muSLxSC.png',
    prompt: 'Maquete arquitetônica detalhada de residência contemporânea, iluminação de estúdio, materiais realistas, base de madeira, foco seletivo, 8k.'
  });

  const [activeIdentity, setActiveIdentity] = useState({
    id: 'minimalista',
    beforeImg: 'https://i.imgur.com/n3HXpNO.png',
    afterImg: 'https://i.imgur.com/muSLxSC.png',
    label: 'Minimalista'
  });

  const styles = [
    { 
      id: 'maquete', 
      label: 'Maquete', 
      beforeImg: 'https://i.imgur.com/n3HXpNO.png', 
      afterImg: 'https://i.imgur.com/muSLxSC.png', 
      prompt: 'Maquete arquitetônica detalhada de residência contemporânea, iluminação de estúdio, materiais realistas, base de madeira, foco seletivo, 8k.' 
    },
    { 
      id: 'humanizada', 
      label: 'Planta Baixa Humanizada', 
      beforeImg: 'https://i.imgur.com/1RXnx6V.png', 
      afterImg: 'https://i.imgur.com/RRiJicQ.png', 
      prompt: 'Planta baixa humanizada artística, mobiliário moderno, texturas de piso realistas, sombras suaves, layout funcional, renderização profissional.' 
    },
    { 
      id: '3d', 
      label: 'Planta Baixa em 3D', 
      beforeImg: 'https://i.imgur.com/JqsrHaZ.png', 
      afterImg: 'https://i.imgur.com/G42060i.png', 
      prompt: 'Planta baixa 3D isométrica, paredes brancas, iluminação natural vinda das janelas, decoração minimalista, visualização arquitetônica clara.' 
    },
    { 
      id: 'tecnico', 
      label: 'Detalhamento Técnico', 
      beforeImg: 'https://i.imgur.com/AbYbcc5.png', 
      afterImg: 'https://i.imgur.com/J0tZQHf.png', 
      prompt: 'Corte técnico arquitetônico detalhado, hachuras precisas, anotações de materiais, desenho técnico profissional, estilo CAD limpo.' 
    }
  ];

  const identities = [
    { 
      id: 'minimalista', 
      label: 'Minimalista', 
      beforeImg: 'https://i.imgur.com/n3HXpNO.png', 
      afterImg: 'https://i.imgur.com/muSLxSC.png', 
    },
    { 
      id: 'industrial', 
      label: 'Industrial', 
      beforeImg: 'https://i.imgur.com/1RXnx6V.png', 
      afterImg: 'https://i.imgur.com/RRiJicQ.png', 
    },
    { 
      id: 'escandinavo', 
      label: 'Escandinavo', 
      beforeImg: 'https://i.imgur.com/JqsrHaZ.png', 
      afterImg: 'https://i.imgur.com/G42060i.png', 
    },
    { 
      id: 'biofilico', 
      label: 'Biofílico', 
      beforeImg: 'https://i.imgur.com/AbYbcc5.png', 
      afterImg: 'https://i.imgur.com/J0tZQHf.png', 
    }
  ];

  const slides = [
    "https://i.imgur.com/bGytswi.png",
    "https://i.imgur.com/CX0WWqe.png",
    "https://i.imgur.com/uOyJzCC.png",
    "https://i.imgur.com/HlLgShR.png",
    "https://i.imgur.com/SvGznM4.png",
    "https://i.imgur.com/lStXhng.png",
    "https://i.imgur.com/OZgQ7gS.png",
    "https://i.imgur.com/5nWNO8C.png",
    "https://i.imgur.com/S1KVMXJ.png",
    "https://i.imgur.com/BjqxaMe.png"
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      const plan = params.get('plan') || 'annual';
      fbq.event('Purchase', {
        value: 297.00,
        currency: 'BRL',
        content_name: `ArchRender AI - ${plan}`,
        content_category: 'Architecture Software'
      });
    }
  }, [location]);

  useEffect(() => {
    const spotsInterval = setInterval(() => {
      setSpots(prev => {
        if (prev <= 3) return 3;
        if (Math.random() > 0.6) return prev - 1;
        return prev;
      });
    }, 20000);

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(spotsInterval);
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=invite') || hash.includes('type=recovery') || hash.includes('type=signup'))) {
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
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        delay: 0.2
      });
      gsap.from('.hero-sub', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.4
      });
      gsap.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.6
      });
      gsap.from('.hero-visual', {
        scale: 0.95,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.8
      });

      gsap.utils.toArray('.section-reveal').forEach((el: any) => {
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none"
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out"
        });
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubscribe = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      fbq.event('InitiateCheckout', {
        content_name: `ArchRender AI - ${plan}`,
        content_category: 'Architecture Software',
        value: 297.00,
        currency: 'BRL'
      });
      const stripeLink = 'https://buy.stripe.com/00wbIVbcu3iV1pRc6G1gs09';
      const url = new URL(stripeLink);
      if (user) {
        url.searchParams.append('client_reference_id', user.id);
        if (user.email) url.searchParams.append('prefilled_email', user.email);
      }
      window.open(url.toString(), '_blank');
    } catch (error: any) {
      console.error('Subscription Error:', error?.message || String(error));
      alert('Erro ao redirecionar para o pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    const container = e.currentTarget.getBoundingClientRect();
    const x = ('touches' in e) ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = x - container.left;
    const percent = Math.min(Math.max((relativeX / container.width) * 100, 0), 100);
    setSliderPercent(percent);
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-blue-500/10">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* WHATSAPP PLUGIN */}
      <a 
        href="https://wa.me/5531993111420" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full shadow-2xl fixed bottom-8 right-8 z-[60] hover:scale-110 transition-transform"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>

      {/* HEADER */}
      <header id="header" className="fixed top-0 left-0 w-full z-50 transition-all duration-300 py-4 px-6 md:px-12">
        <nav className="max-w-7xl mx-auto flex items-center justify-between nav-blur rounded-2xl px-4 md:px-6 h-16 md:h-20 border border-border shadow-sm relative">
          <a href="/" className="flex items-center h-full relative w-52 md:w-56">
            <img 
              src={LOGO_URL} 
              alt="ArchRender AI" 
              className="h-32 md:h-36 w-auto object-contain max-w-none absolute left-0 top-1/2 -translate-y-1/2" 
              referrerPolicy="no-referrer" 
            />
          </a>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#ferramentas" className="hover:text-black transition-colors">Ferramentas</a>
            <a href="#beneficios" className="hover:text-black transition-colors">Benefícios</a>
            <a href="#biblioteca" className="hover:text-black transition-colors">Biblioteca</a>
            <a href="#identidade" className="hover:text-black transition-colors">AI Identidade</a>
            <a href="#oferta" className="hover:text-black transition-colors">Oferta</a>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/arch-render" className="bg-black text-white text-xs md:text-sm font-bold px-4 md:px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-black/5">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-slate-400 hover:text-black transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="bg-black text-white text-xs md:text-sm font-bold px-4 md:px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-black/5"
              >
                Entrar
              </button>
            )}
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-black"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center gap-6 text-xl font-bold md:hidden"
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full border border-border"
              >
                <X className="w-6 h-6" />
              </button>
              <a href="#ferramentas" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-8 hover:text-blue-500 transition-colors">Ferramentas</a>
              <a href="#beneficios" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-8 hover:text-blue-500 transition-colors">Benefícios</a>
              <a href="#biblioteca" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-8 hover:text-blue-500 transition-colors">Biblioteca</a>
              <a href="#identidade" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-8 hover:text-blue-500 transition-colors">AI Identidade</a>
              <a href="#oferta" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-8 hover:text-blue-500 transition-colors">Oferta</a>
              <button 
                onClick={() => { 
                  handleSubscribe('annual');
                  setIsMobileMenuOpen(false); 
                }}
                className="bg-black text-white px-10 py-4 rounded-2xl text-lg mt-6 shadow-xl shadow-black/10"
              >
                Começar Agora
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-border rounded-full shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Não somos uma IA de render</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-border rounded-full shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">somos um sistema completo para aceleração de projetos</span>
            </div>
          </div>
          
          <h1 className="hero-title text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] px-2">
            A ferramenta <br /> <span className="text-blue-500">tudo em 1</span> para arquitetos
          </h1>
          
          <p className="hero-sub text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            A ferramenta definitiva para arquitetos que querem ganhar tempo, impressionar clientes e fechar mais vendas usando o poder da IA.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={() => handleSubscribe('annual')}
              className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-black/10 text-center"
            >
              Começar agora
            </button>
          </div>

          <div className="hero-visual relative max-w-5xl mx-auto rounded-[32px] overflow-hidden border border-border shadow-2xl bg-slate-50 p-2">
            <div className="rounded-[24px] overflow-hidden aspect-video bg-zinc-100 relative">
              <iframe 
                src="https://scripts.converteai.net/35b97f86-a3d7-4c78-8f8b-e06ab21b1829/players/69aefbdf7d6df7c08d8f62a1/embed.html" 
                id="69aefbdf7d6df7c08d8f62a1" 
                style={{ border: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                allow="autoplay; fullscreen" 
                allowFullScreen
                title="Vturb Video Player"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* 1. TUDO O QUE VOCÊ PRECISA */}
      <section id="ferramentas" className="py-16 md:py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20 section-reveal">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Tudo o que você precisa.</h2>
            <p className="text-slate-500 text-base md:text-lg">Ferramentas completas para escalar seu negócio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tool 1 */}
            <div className="card-hover p-8 rounded-[32px] bg-white border border-border section-reveal flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-border">
                  <Layout className="w-7 h-7 text-black" />
                </div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Render 4K</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Renderização Profissional</h3>
              <p className="text-slate-500 leading-relaxed mb-8">Imagens com texturas e iluminação realistas que parecem fotos reais do projeto finalizado.</p>
              <ComparisonSlider 
                beforeImage="https://i.imgur.com/2sV7uN5.png"
                afterImage="https://i.imgur.com/XlqBtsA.png"
                className="mt-auto aspect-video"
              />
            </div>

            {/* Tool 2 */}
            <div className="card-hover p-8 rounded-[32px] bg-white border border-border section-reveal flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-border">
                  <Video className="w-7 h-7 text-black" />
                </div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Vídeo IA</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Vídeos Cinematográficos</h3>
              <p className="text-slate-500 leading-relaxed mb-8">Crie tours virtuais e animações de revelação em segundos, sem precisar de hardware potente.</p>
              <div 
                className="mt-auto rounded-2xl overflow-hidden aspect-video bg-black relative group cursor-pointer"
                onMouseEnter={() => videoRef.current?.play()}
                onMouseLeave={() => {
                  if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                  }
                }}
              >
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                  muted 
                  loop 
                  playsInline
                  preload="metadata"
                  poster="https://i.imgur.com/odCjiFh.jpg"
                >
                  <source src="https://i.imgur.com/odCjiFh.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <Play className="w-6 h-6 text-black fill-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tool 3 */}
            <div className="card-hover p-8 rounded-[32px] bg-white border border-border section-reveal flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-border">
                  <Presentation className="w-7 h-7 text-black" />
                </div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Slides</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Apresentações de Elite</h3>
              <p className="text-slate-500 leading-relaxed mb-2">A plataforma monta sua apresentação comercial completa, pronta para ser enviada ao cliente.</p>
              <div className="relative group">
                <div className="rounded-2xl overflow-hidden aspect-video bg-zinc-100 carousel-container relative">
                  <div className="carousel-track h-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {slides.map((src, i) => (
                      <div key={i} className="shrink-0 w-full h-full">
                        <img 
                          src={src} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                          alt={`Slide ${i + 1}`} 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsSlideModalOpen(true)}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Ver em tela cheia"
                  >
                    <Maximize2 className="w-5 h-5 text-black" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {slides.map((_, i) => (
                    <div 
                      key={i} 
                      className={`carousel-dot ${currentSlide === i ? 'active' : ''}`} 
                      onClick={() => setCurrentSlide(i)}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tool 4 */}
            <div className="card-hover p-8 rounded-[32px] bg-white border border-border section-reveal flex flex-col group">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-border">
                  <InfinityIcon className="w-7 h-7 text-black" />
                </div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Biblioteca</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Biblioteca de Estilos</h3>
              <p className="text-slate-500 leading-relaxed mb-8">Explore estilos infinitos. Clique nos estilos abaixo para ver a mágica acontecer.</p>
              
              <div className="mt-auto relative">
                <div className="mb-6">
                  <ComparisonSlider 
                    key={activeStyle.id}
                    beforeImage={activeStyle.beforeImg}
                    afterImage={activeStyle.afterImg}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button 
                      key={style.id}
                      className={`style-pill ${activeStyle.id === style.id ? 'active' : ''}`} 
                      onClick={() => setActiveStyle(style as any)}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tool 5 - AI IDENTIDADE */}
            <div id="identidade" className="card-hover p-8 rounded-[32px] bg-white border border-border section-reveal flex flex-col group">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-border">
                  <Fingerprint className="w-7 h-7 text-black" />
                </div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">AI Identidade</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">AI - IDENTIDADE</h3>
              <p className="text-slate-500 leading-relaxed mb-8">Defina a identidade visual única do seu projeto. Selecione uma identidade abaixo para visualizar.</p>
              
              <div className="mt-auto relative">
                <div className="mb-6">
                  <ComparisonSlider 
                    key={activeIdentity.id}
                    beforeImage={activeIdentity.beforeImg}
                    afterImage={activeIdentity.afterImg}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {identities.map((identity) => (
                    <button 
                      key={identity.id}
                      className={`style-pill ${activeIdentity.id === identity.id ? 'active' : ''}`} 
                      onClick={() => setActiveIdentity(identity as any)}
                    >
                      {identity.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PERFEITO PARA VOCÊ QUE */}
      <section id="beneficios" className="py-16 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20 section-reveal">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Perfeito para você que...</h2>
            <p className="text-slate-500 text-base md:text-lg">Focamos no seu resultado, não na tecnologia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="benefit-card p-8 rounded-3xl bg-slate-50 border border-border section-reveal">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                Não quer aprender IA, quer receber pronto
              </h3>
              <p className="text-slate-500 leading-relaxed">Arquiteto não é da área de TI. Você quer explorar sua criatividade e ganhar tempo, não lidar com configurações complexas. Nossa ferramenta interpreta sua imagem inteira e sabe exatamente o que compõe ela.</p>
            </div>

            <div className="benefit-card p-8 rounded-3xl bg-slate-50 border border-border section-reveal">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">📸</span>
                Quer impressionar nos projetos e redes sociais
              </h3>
              <p className="text-slate-500 leading-relaxed">Conteúdo de alta qualidade, com agilidade e sem distorções do projeto real. Mantenha a fidelidade do seu design enquanto gera imagens que param o scroll.</p>
            </div>

            <div className="benefit-card p-8 rounded-3xl bg-slate-50 border border-border section-reveal">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                Deseja automatizar o processo de venda
              </h3>
              <p className="text-slate-500 leading-relaxed">Vendas tomam tempo e energia. Garanta agilidade e qualidade que impressionam clientes com inovação e rapidez, fechando muito mais vendas e focando no que importa.</p>
            </div>

            <div className="benefit-card p-8 rounded-3xl bg-slate-50 border border-border section-reveal">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">♾️</span>
                Busca liberdade total e uso ilimitado
              </h3>
              <p className="text-slate-500 leading-relaxed">Sem tokens, sem medo de errar. Crie infinitas variações, teste e explore sem limites. Aceitamos desde plantas baixas até modelos 3D de qualquer ângulo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NOSSA BIBLIOTECA */}
      <section id="biblioteca" className="py-16 md:py-32 px-6 bg-black text-white rounded-[32px] md:rounded-[48px] mx-4 md:mx-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20 section-reveal">
            <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight mb-6">Nossa Biblioteca</h2>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">Explore centenas de imagens e vídeos super criativos e exclusivos para arquitetura e design.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {styles.map((style) => (
              <div key={style.id} className="section-reveal group">
                <div className="mb-4 flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">{style.label}</p>
                </div>
                <ComparisonSlider 
                  beforeImage={style.beforeImg}
                  afterImage={style.afterImg}
                  className="aspect-square bg-zinc-900 rounded-2xl border border-white/10"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. OFERTA */}
      <section id="oferta" className="py-16 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16 section-reveal">
            <div className="inline-block px-4 py-1 mb-6 bg-blue-500/10 text-blue-500 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Oferta Exclusiva de Lançamento
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Garanta seu acesso antecipado</h2>
            <p className="text-slate-500 text-base md:text-lg">O valor oficial será lançado em Abril. Aproveite o desconto de pré-lançamento hoje.</p>
          </div>

          <div className="price-tag rounded-[40px] p-8 md:p-16 text-white relative overflow-hidden section-reveal shadow-2xl bg-black">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Renderizações Ilimitadas
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Vídeos Cinematográficos
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Criador de Apresentações de Elite
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Biblioteca Exclusiva de Prompts
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Suporte VIP Prioritário
                  </li>
                  <li className="flex items-center gap-3 text-sm opacity-60">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Sem Fidelidade ou Multas
                  </li>
                </ul>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-xs font-semibold">Garantia Incondicional de 7 Dias</p>
                </div>
              </div>

              <div className="text-center md:text-right">
                <p className="text-zinc-400 text-sm line-through mb-2">De R$ 997,00 / ano</p>
                
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-[0.3em] font-bold text-blue-500 mb-2">Por apenas</p>
                  <div className="flex items-baseline justify-center md:justify-end gap-2 flex-wrap">
                    <span className="text-2xl font-bold">R$</span>
                    <span className="text-5xl sm:text-7xl font-extrabold tracking-tighter">24,00</span>
                    <span className="text-xl font-bold text-zinc-400">/mês</span>
                  </div>
                  <p className="text-zinc-400 text-sm mt-2">Apenas R$ 297,00 no plano anual</p>
                </div>

                <button 
                  onClick={() => handleSubscribe('annual')}
                  disabled={loadingPlan === 'annual'}
                  className="w-full bg-white text-black py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                >
                  {loadingPlan === 'annual' ? <Loader2 className="animate-spin" /> : 'Começar agora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE FULLSCREEN MODAL */}
      <AnimatePresence>
        {isSlideModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setIsSlideModalOpen(false)}
              className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={slides[currentSlide]} 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer" 
                alt={`Slide ${currentSlide + 1}`} 
              />
              
              {/* Navigation Controls in Modal */}
              <button 
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                {slides.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-8 bg-blue-500' : 'w-1.5 bg-white/30'}`}
                  ></div>
                ))}
              </div>
            </div>
            
            <p className="text-white/50 mt-8 font-medium tracking-widest uppercase text-xs">
              Slide {currentSlide + 1} de {slides.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src={LOGO_URL} alt="ArchRender AI" className="h-10 md:h-16 w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Acelerando a criatividade arquitetônica através da inteligência artificial. O futuro da visualização começa aqui.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Produto</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-black">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-black">Galeria</a></li>
                <li><a href="#" className="hover:text-black">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Empresa</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-black">Sobre nós</a></li>
                <li><a href="#" className="hover:text-black">Blog</a></li>
                <li><a href="#" className="hover:text-black">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm">&copy; 2026 ArchRender AI. Todos os direitos reservados.</p>
            <div className="flex gap-8 text-slate-500 text-sm">
              <a href="#" className="hover:text-black">Privacidade</a>
              <a href="#" className="hover:text-black">Termos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArchVizLanding;
