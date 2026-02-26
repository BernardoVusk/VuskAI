import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Upload, Wand2, Sliders, Shield, ChevronDown, ChevronUp, User, LogOut, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { supabase } from '../lib/supabaseClient';

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

  const handleSubscribe = async (plan: 'starter' | 'pro') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setLoadingPlan(plan);
    try {
      let stripeLink = '';
      if (plan === 'starter') {
        stripeLink = 'https://buy.stripe.com/test_aFacMZ9JPaO27sI8xEcfK01';
      } else if (plan === 'pro') {
        // Substitua este link pelo link de pagamento real do plano Pro
        stripeLink = 'https://buy.stripe.com/test_pro_placeholder'; 
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
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#05070D]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20" />
            <span>ArchRender <span className="text-violet-400">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
              <a href="#how-it-works" className="hover:text-white transition-colors">Como funciona</a>
              <a href="#presets" className="hover:text-white transition-colors">Estilos</a>
              <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
            </div>

            {user ? (
              <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                <div className="flex items-center gap-3">
                  <div className="text-right hidden lg:block">
                    <div className="text-xs font-bold text-white">
                      {user.user_metadata?.full_name?.split(' ')[0] || 'Conta'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {user.email?.split('@')[0]}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-[1px] shadow-lg shadow-violet-500/20">
                    <div className="w-full h-full rounded-full bg-[#0B1221] flex items-center justify-center text-xs font-bold text-white">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  </div>
                </div>

                <Link 
                  to="/vusk-ai"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
                >
                  Abrir App
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Login
                </button>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
                >
                  Começar — R$ 97/mês
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Transforme sua planta baixa em um render profissional em segundos.
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl mb-8">
              Sem modelagem 3D. Sem perder horas. Você envia a imagem e gera uma visualização ultra realista pronta para apresentar ao cliente.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Funciona com planta baixa, desenho técnico, CAD exportado e até foto do ambiente.",
                "Estilos prontos: moderno, luxo, industrial, minimalista.",
                "Ajuste materiais, iluminação e câmera com prompt guiado."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="mt-0.5 w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center border border-violet-500/30 shrink-0">
                    <Check className="w-3.5 h-3.5 text-violet-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-300">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <a 
                href="#pricing"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
              >
                Começar agora — R$ 97/mês
              </a>
              <a 
                href="#examples"
                className="px-6 py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-semibold hover:bg-white/10 transition-all"
              >
                Ver exemplos
              </a>
            </div>
            
            <p className="text-xs text-slate-500 font-medium">
              Pagamento seguro • Cancele quando quiser • Acesso imediato
            </p>
          </div>

          {/* Before/After Placeholder Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-500/20 blur-3xl rounded-full opacity-50" />
            <div className="relative border border-white/10 rounded-2xl bg-[#0B1221]/80 backdrop-blur-sm p-4 shadow-2xl">
              <div className="h-[420px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exemplo</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-300">
                    Antes → Depois
                  </span>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-3 p-3">
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-xs font-medium text-slate-500">
                    Planta (Antes)
                  </div>
                  <div className="rounded-lg border border-dashed border-violet-500/20 bg-violet-500/5 flex items-center justify-center text-xs font-medium text-violet-400">
                    Render (Depois)
                  </div>
                </div>

                <div className="p-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                  <span>Arraste para comparar</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section id="examples" className="py-24 border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">Veja o antes e depois em 5 segundos</h2>
          <p className="text-slate-400 mb-12 max-w-2xl">
            A mesma planta vira uma imagem que vende o projeto — e acelera a aprovação do cliente.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-[#0B1221]">
                <div className="h-48 rounded-xl bg-white/5 mb-3 flex items-center justify-center text-slate-600 text-sm">
                  Slider Antes/Depois {i}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 rounded-lg bg-white/5 flex items-center justify-center text-slate-700 text-xs">Antes</div>
                  <div className="h-24 rounded-lg bg-violet-500/5 flex items-center justify-center text-violet-900/40 text-xs">Depois</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">Como funciona (simples de verdade)</h2>
          <p className="text-slate-400 mb-12">Upload → ajuste → render final. Sem dor de cabeça.</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Upload, title: "Envie a imagem", desc: "Planta baixa, desenho técnico, CAD exportado ou foto do ambiente." },
              { icon: Wand2, title: "A IA entende o projeto", desc: "Gera a estrutura do prompt + estilo base para visualização arquitetônica." },
              { icon: Sliders, title: "Você ajusta e gera", desc: "Troque materiais, iluminação, ângulo e estilo de câmera — e gere o render." }
            ].map((step, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-[#0B1221]">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 font-bold text-xl">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center md:text-left">
            <a 
              href="#pricing"
              className="inline-flex px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors"
            >
              Quero testar agora
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Split */}
      <section className="py-24 border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">Menos horas no 3D. Mais aprovação de cliente.</h2>
          <p className="text-slate-400 mb-12">Você compra tempo e entrega. O cliente compra visão.</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-4 rounded-2xl border border-white/5 bg-[#0B1221]">
              <div className="h-[340px] rounded-xl bg-gradient-to-br from-violet-900/20 to-black flex items-center justify-center text-slate-600">
                Imagem Render Placeholder
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-white/5 bg-[#0B1221] flex flex-col justify-center">
              <ul className="space-y-4">
                {[
                  { title: "⚡ Acelere entregas", desc: "Reduza tempo de visualização por projeto." },
                  { title: "🧠 Não precisa “aprender IA”", desc: "O prompt já sai pronto e editável." },
                  { title: "🎯 Impressione o cliente", desc: "Imagem pronta para apresentação." },
                  { title: "📸 Consistência visual", desc: "Presets de câmera e iluminação." },
                  { title: "🏠 Feito para arquitetura", desc: "Interiores e exteriores." }
                ].map((item, i) => (
                  <li key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <b className="block text-white mb-1">{item.title}</b>
                    <span className="text-slate-400 text-sm">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Presets */}
      <section id="presets" className="py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">Escolha o estilo em 1 clique</h2>
          <p className="text-slate-400 mb-12">Presets pensados para projetos reais no Brasil.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Moderno Clean", desc: "Apto compacto • luz natural" },
              { name: "Alto Padrão", desc: "Luxo • materiais premium" },
              { name: "Industrial", desc: "Cimento • metal • contraste" },
              { name: "Escandinavo", desc: "Madeira • claro • clean" },
              { name: "Casa de Praia", desc: "Luz suave • leveza" },
              { name: "Noturno", desc: "Luz quente • clima" }
            ].map((preset, i) => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-[#0B1221] hover:border-violet-500/30 transition-colors group cursor-pointer">
                <div className="h-32 rounded-lg bg-white/5 mb-3 group-hover:bg-violet-500/10 transition-colors" />
                <div className="font-bold text-sm mb-1">{preset.name}</div>
                <div className="text-xs text-slate-500">{preset.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">Assinatura simples. Cancele quando quiser.</h2>
          <p className="text-slate-400 mb-12">Comece no Starter e suba quando ganhar volume.</p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-2xl border border-white/5 bg-[#0B1221]">
              <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Básico</div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">R$ 97</span>
                <span className="text-slate-500 font-medium">/ mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-slate-400">
                <li>• 200 renders/mês</li>
                <li>• Presets profissionais</li>
                <li>• Editor de prompt guiado</li>
                <li>• Atualizações contínuas</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('starter')}
                disabled={loadingPlan === 'starter'}
                className="flex items-center justify-center w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {loadingPlan === 'starter' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Assinar agora'}
              </button>
            </div>

            {/* Pro */}
            <div className="relative p-6 rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-900/20 to-[#0B1221] md:-translate-y-4">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-xs font-bold text-violet-300">
                Recomendado
              </div>
              <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Melhor custo-benefício</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">R$ 147</span>
                <span className="text-slate-500 font-medium">/ mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                <li>• 500 renders/mês</li>
                <li>• Presets premium</li>
                <li>• Prioridade de geração</li>
                <li>• Suporte prioritário</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('pro')}
                disabled={loadingPlan === 'pro'}
                className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50"
              >
                {loadingPlan === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Assinar Pro'}
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl border border-white/5 bg-[#0B1221]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Para escritórios</div>
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold tracking-tight">Sob consulta</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-slate-400">
                <li>• Alto volume</li>
                <li>• Onboarding do time</li>
                <li>• Presets custom</li>
                <li>• Atendimento dedicado</li>
              </ul>
              <a href="#" className="flex items-center justify-center w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-slate-300 font-bold">
                Falar no WhatsApp
              </a>
            </div>
          </div>

          <div className="text-center mt-8 text-xs text-slate-500 font-medium">
            Garantia de 7 dias • Pagamento seguro • Acesso imediato
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-12 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-[#0B1221] flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Garantia de satisfação (7 dias)</h3>
              <p className="text-slate-400 leading-relaxed">
                Se você não curtir os resultados nos primeiros 7 dias, é só pedir reembolso. Sem letras miúdas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Perguntas frequentes</h2>
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

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-indigo-900/20" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="p-10 rounded-3xl border border-violet-500/30 bg-[#0B1221]/80 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Pare de perder horas no 3D só para “mostrar uma ideia”.
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Envie a imagem do seu projeto e gere renders que vendem o conceito.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <a 
                href="#pricing"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
              >
                Começar agora — R$ 97/mês
              </a>
              <a 
                href="#examples"
                className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-semibold hover:bg-white/10 transition-all"
              >
                Ver exemplos
              </a>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Pagamento seguro • Acesso imediato • Suporte
            </div>
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
