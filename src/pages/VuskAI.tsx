import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Wand2, 
  Scan, 
  Zap, 
  Fingerprint, 
  Loader2, 
  Sparkles, 
  Maximize2, 
  Copy, 
  Check, 
  Lock, 
  Unlock,
  Plus,
  ArrowRight,
  Activity,
  Cpu,
  Globe,
  Video,
  ChevronDown,
  Layout,
  BookOpen,
  Terminal,
  X,
  Sun,
  Sunrise,
  Cloud,
  CloudFog,
  Moon,
  Snowflake,
  CloudRain
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { AuroraBackground } from '../components/visuals/AuroraBackground';
import { NeuralGrid } from '../components/visuals/NeuralGrid';
import { cn } from '../lib/utils';
import { useVuskAI } from '../hooks/useVuskAI';
import { AnalysisMode, AppStatus } from '../types';
import { KeyActivationModal } from '../components/ui/KeyActivationModal';
import { Sidebar } from '../components/layout/Sidebar';
import { KeyGenerator } from '../components/admin/KeyGenerator';
import { Academy } from '../components/academy/Academy';
import { Library } from '../components/library/Library';
import { VideoPromptManager } from '../components/admin/VideoPromptManager';
import { NeuralLock } from '../components/ui/NeuralLock';
import { supabase } from '../lib/supabaseClient';
const LOGO_URL = "https://i.imgur.com/ptDOAO8.png";

const VuskAI = () => {
  const {
    mode,
    image,
    analysis,
    status,
    resultImage,
    error,
    subscriptions,
    isKeyModalOpen,
    setMode,
    handleImageUpload,
    handleAnalyze,
    handleGenerate,
    fileInputRef,
    resetError,
    activateKey,
    closeKeyModal,
    openKeyModal,
    checkSubscription,
    handleRefinePrompt,
    isRefining,
    isAdmin,
    clearImage
  } = useVuskAI();

  const [isCopied, setIsCopied] = useState(false);
  const [isVideoPromptCopied, setIsVideoPromptCopied] = useState(false);
  const [selectedVideoStyle, setSelectedVideoStyle] = useState('');
  const [isVideoManagerOpen, setIsVideoManagerOpen] = useState(false);
  const [dbVideoStyles, setDbVideoStyles] = useState<any[]>([]);
  const [refinementText, setRefinementText] = useState('');
  const [archVizSubTab, setArchVizSubTab] = useState<'ai' | 'prompts' | 'aulas'>('ai');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDbVideoStyles();
  }, []);

  const fetchDbVideoStyles = async () => {
    try {
      const { data, error } = await supabase
        .from('video_prompts')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) {
        // Table might not exist yet, ignore silently or log
        console.log('Video prompts table might not exist yet');
        return;
      }

      if (data) {
        // Group by category
        const grouped = data.reduce((acc: any[], item: any) => {
          const cat = acc.find(c => c.category === item.category);
          if (cat) {
            cat.styles.push({ name: item.name, prompt: item.prompt });
          } else {
            acc.push({ category: item.category, styles: [{ name: item.name, prompt: item.prompt }] });
          }
          return acc;
        }, []);
        setDbVideoStyles(grouped);
      }
    } catch (err) {
      console.error('Error fetching db video styles:', err);
    }
  };

  const handleCopyPrompt = () => {
    if (analysis?.suggestedPrompt) {
      navigator.clipboard.writeText(analysis.suggestedPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCopyVideoPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setIsVideoPromptCopied(true);
    setTimeout(() => setIsVideoPromptCopied(false), 2000);
  };

  const videoStyles = [
    {
      category: "Geral",
      styles: [
        {
          name: "Construção Passo a Passo (Evolution Timelapse)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Fast-paced construction timelapse. From the foundation up, modular steel beams and panels fly into place, perfectly matching the final structure of the reference image. Ray-traced reflections on the existing glass panels as they are installed. High-end architectural visualization, stable camera, 8k, photorealistic."
        },
        {
          name: "Estilo: Cinematográfico (Slow Drone Orbit)",
          prompt: "Maintain absolute architectural fidelity of the attached image. A slow, cinematic 180-degree drone orbit around the building in the uploaded image. Preserve all materials, window placements, and structural details exactly as shown. The camera movement is smooth with a subtle parallax effect. Lighting is golden hour with realistic reflections on the existing glass surfaces. Keep the building's geometry identical to the reference image throughout the shot. 4k, professional cinematography."
        },
        {
          name: "Estilo: Transição Dia para Noite (Atmospheric Transition)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Static camera, day-to-night transition. The sun sets, casting realistic shadows, while interior and exterior lights turn on sequentially. Ray-traced reflections on the existing glass panels shifting from sky blue to warm interior glows. No structural morphing, exact geometric consistency, hyper-realistic, 24fps."
        },
        {
          name: "Estilo Apresentação Técnica (Slow Zoom & Detail Focus)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Slow, steady dolly zoom into the facade. Focus on high-quality texture mapping and material finishes. Ray-traced reflections on the existing glass panels providing depth and realism. Architectural photography style, sharp focus on every beam and window alignment, 8k, extremely detailed."
        }
      ]
    },
    {
      category: "Interiores",
      styles: [
        {
          name: "Estilo: Walkthrough Cinematográfico (Fluxo de Espaço)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Slow and elegant steadicam glide through the room, moving forward to create a sense of depth. Ray-traced reflections on the existing glass panels and polished floor surfaces. Natural sunlight shifts subtly across the furniture textures. No distortion of furniture or wall geometry. Ultra-realistic, 8k, architectural cinematic film."
        },
        {
          name: "Estilo: Atmosfera e Iluminação (Day-to-Night Interior)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Static camera view focusing on the living area. A smooth transition from bright daylight to a cozy evening atmosphere. Interior lamps, LED strips, and recessed lighting turn on sequentially with realistic glow. Ray-traced reflections on the existing glass panels and mirrors reflecting the new light sources. High dynamic range, soft shadows, photorealistic."
        },
        {
          name: "Estilo: Close-up de Materiais (Foco em Texturas)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Slow, macro-style dolly zoom focusing on the material finishes and textures. Ray-traced reflections on the existing glass panels and metallic fixtures. Subtle dust motes dancing in the light beams. The geometry of the cabinetry and decor remains perfectly still and consistent. Architectural photography style, sharp focus, 8k, extremely detailed."
        },
        {
          name: "Estilo: Interior com Vida (Movimento Sutil)",
          prompt: "Maintain absolute architectural fidelity of the attached image. Subtle secondary motion: a gentle breeze moves the curtains slightly and fireplace embers glow softly. Ray-traced reflections on the existing glass panels reacting to the flickering firelight. The structural elements and furniture remain 100% faithful to the source image. Atmospheric, peaceful, hyper-realistic, 24fps."
        }
      ]
    }
  ];

  const weatherPresets = [
    { id: 'sunset', name: "Pôr do Sol", prompt: "Golden hour, sunset lighting, warm orange glow, long shadows", icon: Sun },
    { id: 'sunrise', name: "Nascer do Sol", prompt: "Sunrise light, soft morning atmosphere, cool blue and pink tones", icon: Sunrise },
    { id: 'cloudy', name: "Nublado", prompt: "Overcast sky, soft diffused lighting, moody grey clouds", icon: Cloud },
    { id: 'foggy', name: "Neblina", prompt: "Dense fog, misty atmosphere, ethereal lighting, low visibility", icon: CloudFog },
    { id: 'night', name: "Noite", prompt: "Night scene, deep blue sky, artificial lighting, glowing windows", icon: Moon },
    { id: 'snow', name: "Neve", prompt: "Snowing, winter atmosphere, white landscape, cold lighting", icon: Snowflake },
    { id: 'rain', name: "Chuva", prompt: "Raining, wet surfaces, reflections, moody atmosphere", icon: CloudRain },
    { id: 'storm', name: "Tempestade", prompt: "Stormy weather, lightning flashes, dark dramatic sky, heavy rain", icon: Zap },
  ];

  const allVideoStyles = [...videoStyles, ...dbVideoStyles];

  const handleRefine = async () => {
    if (!refinementText.trim()) return;
    await handleRefinePrompt(refinementText);
    setRefinementText('');
  };

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
  };

  const handleUnlockRequest = (targetMode: AnalysisMode) => {
    openKeyModal();
  };

  const currentSubscription = subscriptions[mode];

  const calculateRemainingDays = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (!mounted) return null;

  return (
    <div className="relative flex min-h-screen bg-[#020204] text-white selection:bg-violet-500/30 overflow-hidden">
      <AuroraBackground />
      <NeuralGrid />
      
      <KeyActivationModal 
        isOpen={isKeyModalOpen} 
        onClose={closeKeyModal} 
        onActivate={activateKey} 
      />

      {/* Video Prompt Manager Modal */}
      <AnimatePresence>
        {isVideoManagerOpen && (
          <VideoPromptManager 
            onClose={() => setIsVideoManagerOpen(false)} 
            onUpdate={fetchDbVideoStyles}
            defaultStyles={videoStyles}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation - Floating Style */}
      <div className="hidden lg:block fixed left-6 top-6 bottom-6 z-50">
        <Sidebar 
          currentMode={mode}
          onModeChange={handleModeChange}
          subscriptions={subscriptions}
          onUnlockRequest={handleUnlockRequest}
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 h-20 bg-[#020204]/80 backdrop-blur-xl border-b border-white/5 z-[60] flex items-center px-6">
          <img src={LOGO_URL} alt="ArchRender AI" className="h-24 w-auto" />
        </div>
        <Sidebar 
          currentMode={mode}
          onModeChange={handleModeChange}
          subscriptions={subscriptions}
          onUnlockRequest={handleUnlockRequest}
          isAdmin={isAdmin}
        />
      </div>

      {/* Arch Viz Secondary Sidebar */}
      <AnimatePresence>
        {mode === AnalysisMode.ARCHITECTURE && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="hidden lg:flex fixed left-[280px] top-6 bottom-6 w-[200px] z-40 flex-col border border-[oklch(100%_0_0_/_0.1)] bg-[oklch(20%_0.01_250_/_0.4)] backdrop-blur-2xl p-4 rounded-[32px] shadow-xl"
          >
            <div className="mb-8 px-2 pt-2">
              <div className="text-xs font-semibold tracking-tight text-slate-400">Ferramentas</div>
            </div>
            
            <div className="space-y-2">
              {[
                { id: 'ai', label: 'Gerador AI', icon: Terminal },
                { id: 'prompts', label: 'Biblioteca', icon: Layout },
                { id: 'aulas', label: 'Vusk Academy', icon: BookOpen },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setArchVizSubTab(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                    archVizSubTab === item.id 
                      ? "bg-white/10 text-white border border-white/10" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 p-4 md:p-8 pt-24 md:pt-8 relative z-10 flex flex-col min-h-screen transition-all duration-500 pb-32 lg:pb-8",
        mode === AnalysisMode.ARCHITECTURE ? "lg:ml-[480px]" : "lg:ml-[280px]"
      )}>
        
        {/* Header - Editorial Style */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <motion.div
            key={mode}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Sparkles size={14} className="text-violet-400" />
                Inteligência Artificial
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-fluid-8xl font-display tracking-tighter leading-none break-words">
              {mode === AnalysisMode.ARCHITECTURE && archVizSubTab !== 'ai' 
                ? archVizSubTab.charAt(0).toUpperCase() + archVizSubTab.slice(1)
                : mode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-end gap-2 w-full md:w-auto"
          >
            {currentSubscription ? (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md w-full md:w-auto justify-center md:justify-start">
                <Unlock size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  Acesso Pro Ativo • {calculateRemainingDays(currentSubscription.expiresAt)} dias restantes
                </span>
              </div>
            ) : (
              <button 
                onClick={openKeyModal}
                className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group w-full md:w-auto justify-center md:justify-start active:scale-95"
              >
                <Lock size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  Ativar Acesso Premium
                </span>
              </button>
            )}
          </motion.div>
        </header>

        {/* Mobile Sub-tab Switcher for ArchViz */}
        {mode === AnalysisMode.ARCHITECTURE && (
          <div className="lg:hidden flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'ai', label: 'Gerador AI', icon: Terminal },
              { id: 'prompts', label: 'Biblioteca', icon: Layout },
              { id: 'aulas', label: 'Academy', icon: BookOpen },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setArchVizSubTab(item.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap active:scale-95",
                  archVizSubTab === item.id 
                    ? "bg-white/10 text-white border-white/20" 
                    : "bg-white/5 text-slate-500 border-white/5"
                )}
              >
                <item.icon size={14} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Grid */}
        <div className="relative flex-1 flex flex-col">
          <NeuralLock 
            isActive={!!currentSubscription?.isActive} 
            onActivate={openKeyModal} 
          />
          
          <AnimatePresence mode="wait">
            {mode === AnalysisMode.ADMIN_KEYS ? (
            <motion.div
              key="admin-keys"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col"
            >
              <GlassCard className="flex-1 p-8 overflow-auto border-white/5 bg-black/40 backdrop-blur-3xl rounded-[32px] shadow-2xl">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Terminal size={24} className="text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display tracking-tighter uppercase">Key_Generator_Module</h2>
                      <p className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase">System_Administrative_Access</p>
                    </div>
                  </div>
                  <KeyGenerator />
                </div>
              </GlassCard>
            </motion.div>
          ) : mode === AnalysisMode.ARCHITECTURE && archVizSubTab !== 'ai' ? (
            archVizSubTab === 'aulas' ? (
              <motion.div
                key="academy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col"
              >
                <Academy isAdmin={isAdmin} />
              </motion.div>
            ) : archVizSubTab === 'prompts' ? (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col"
              >
                <Library isAdmin={isAdmin} />
              </motion.div>
            ) : (
              <motion.div
                key={archVizSubTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-8">
                  <Layout size={40} className="text-violet-400" />
                </div>
                <h2 className="text-4xl font-display tracking-tighter uppercase mb-4">Módulo em Desenvolvimento</h2>
                <p className="text-slate-400 font-mono text-sm max-w-md uppercase tracking-widest leading-relaxed">
                  Nossos engenheiros neurais estão sintetizando este módulo. <br/>
                  Acesso em breve para assinantes PRO.
                </p>
                <div className="mt-12 flex gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              key="ai-content"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {/* Left Column: Input & Preview - Bento Span 2x2 */}
              <div className="md:col-span-2 lg:row-span-2 flex flex-col">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1 flex flex-col -mx-4 md:mx-0"
                >
                  <GlassCard className="flex-1 flex flex-col p-0 relative group overflow-hidden border-x-0 md:border-x border-[oklch(100%_0_0_/_0.1)] bg-[oklch(20%_0.01_250_/_0.4)] backdrop-blur-3xl md:rounded-[32px] rounded-none shadow-2xl">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                    <div className="absolute inset-0 bg-grid-white/[0.01] bg-[length:30px_30px]" />
                    
                    {/* Panel Header */}
                    <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-white/5 z-20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Scan size={16} className="text-slate-300" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Imagem de Referência</div>
                        </div>
                      </div>
                    </div>

                    {/* Dropzone Area */}
                    <div className="flex-1 relative md:m-4 md:rounded-[24px] overflow-hidden bg-[#050505] border-y md:border border-white/5 group/drop">
                      <AnimatePresence mode="wait">
                        {image ? (
                          <motion.div 
                            key="preview"
                            layout
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full h-full flex items-center justify-center p-0 md:p-4"
                          >
                            <img src={image} alt="Reference" className="w-full h-full object-cover md:object-contain md:rounded-lg shadow-2xl" />
                            
                            {/* Delete Image Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearImage();
                              }}
                              className="absolute top-4 right-4 z-40 p-3 md:p-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/40 transition-all backdrop-blur-md active:scale-90"
                              title="Remove Image"
                            >
                              <X size={20} className="md:w-4 md:h-4" />
                            </button>
                            
                            {/* Tech HUD Overlay - Hidden on mobile for edge-to-edge */}
                            <div className="hidden md:block absolute inset-6 border border-white/10 rounded-lg pointer-events-none">
                              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-violet-500/50" />
                              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-violet-500/50" />
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-violet-500/50" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-violet-500/50" />
                            </div>

                            {/* Scanning Laser */}
                            {status === AppStatus.ANALYZING && (
                              <motion.div 
                                initial={{ top: "0%" }}
                                animate={{ top: "100%" }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                className="absolute left-0 right-0 h-[1px] bg-violet-400 z-30 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                              />
                            )}
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group/upload active:bg-white/5 transition-colors"
                          >
                            <div className="relative mb-8">
                              <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-500" />
                              <div className="relative w-24 h-24 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center group-hover/upload:border-violet-500/50 group-hover/upload:bg-violet-500/10 transition-all duration-500">
                                <Upload size={32} className="text-slate-400 group-hover/upload:text-violet-400 group-hover/upload:scale-110 transition-all" />
                              </div>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2 tracking-tight">Carregar Imagem</h3>
                            <p className="text-xs text-slate-500">Arraste ou clique para selecionar</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>

                    {/* Action Button Area */}
                    <div className="p-4 sm:p-6 pt-2">
                      <Button 
                        variant="custom"
                        className={cn(
                          "w-full h-14 sm:h-16 rounded-2xl text-sm font-semibold transition-all duration-500 active:scale-[0.98]",
                          !image || status === AppStatus.ANALYZING 
                            ? "bg-white/5 text-slate-500 border border-white/5" 
                            : "bg-white text-black hover:bg-slate-200 shadow-xl"
                        )}
                        onClick={handleAnalyze}
                        disabled={!image || status === AppStatus.ANALYZING}
                      >
                        {status === AppStatus.ANALYZING ? (
                          <div className="flex items-center gap-3">
                            <Loader2 size={18} className="animate-spin" />
                            <span>Analisando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Wand2 size={18} />
                            <span>Analisar Imagem</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>

              {/* Right Column: Analysis & Output - Bento Span 2x2 */}
              <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <GlassCard className="flex-1 flex flex-col p-0 relative overflow-hidden border-[oklch(100%_0_0_/_0.1)] bg-[oklch(20%_0.01_250_/_0.4)] backdrop-blur-3xl rounded-[32px] shadow-2xl">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    <div className="absolute inset-0 bg-grid-white/[0.01] bg-[length:30px_30px]" />

                    {/* Panel Header */}
                    <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-white/5 z-20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Cpu size={16} className="text-slate-300" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Resultado da IA</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/10 text-slate-300 bg-white/5 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-medium">
                        {status === AppStatus.ANALYZING ? 'ANALISANDO...' : 
                         status === AppStatus.GENERATING ? 'GERANDO...' :
                         status === AppStatus.COMPLETE ? 'CONCLUÍDO' :
                         status === AppStatus.ERROR ? 'ERRO NO SISTEMA' :
                         analysis ? 'PRONTO' : 'AGUARDANDO'}
                      </Badge>
                    </div>

                    {/* Output Content */}
                    <div className="flex-1 p-4 sm:p-8 relative overflow-y-auto custom-scrollbar">
                      <AnimatePresence mode="wait">
                        {error ? (
                          <motion.div 
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                          >
                            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                              <Zap size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Erro no Sistema</h3>
                            <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">{error}</p>
                            <Button 
                              onClick={resetError} 
                              variant="outline" 
                              className="rounded-xl border-white/10 text-white hover:bg-white/5 px-8"
                            >
                              Tentar Novamente
                            </Button>
                          </motion.div>
                        ) : status === AppStatus.ANALYZING ? (
                          <motion.div 
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                          >
                            <div className="relative mb-8">
                              <div className="w-24 h-24 border-2 border-emerald-500/10 rounded-full animate-spin border-t-emerald-500" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Globe size={32} className="text-emerald-500/50 animate-pulse" />
                              </div>
                            </div>
                            <div className="text-xs font-medium text-slate-400 animate-pulse">
                              Processando camadas visuais...
                            </div>
                            <div className="mt-4 flex gap-1">
                              {[1,2,3].map(i => (
                                <motion.div 
                                  key={i}
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                />
                              ))}
                            </div>
                          </motion.div>
                        ) : !analysis && !resultImage ? (
                          <motion.div 
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-slate-600"
                          >
                            <Sparkles size={48} className="mb-6 opacity-20" />
                            <div className="text-sm font-medium">Aguardando análise</div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-10"
                          >
                            {/* Prompt Section */}
                            {analysis && (
                              <section>
                                  <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                                    <h4 className="text-xs font-semibold text-slate-300">Prompt Sugerido</h4>
                                  </div>
                                  <button 
                                    onClick={handleCopyPrompt}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
                                  >
                                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                    {isCopied ? 'Copiado' : 'Copiar'}
                                  </button>
                                </div>
                                
                                <div className="relative group/prompt">
                                  <div className="relative bg-white/5 border border-white/10 p-6 rounded-2xl text-sm leading-relaxed text-slate-200">
                                    {analysis.suggestedPrompt}
                                  </div>
                                </div>
                                
                                {/* Video Style Prompts Section */}
                                <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10">
                                  <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Video size={16} className="text-slate-300" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold text-white">Prompts para Vídeo</div>
                                        <div className="text-[10px] text-slate-500">Presets cinematográficos</div>
                                      </div>
                                    </div>
                                    {isAdmin && (
                                      <button 
                                        onClick={() => setIsVideoManagerOpen(true)}
                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                        title="Gerenciar Presets"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="space-y-4">
                                    <div className="relative">
                                      <select 
                                        value={selectedVideoStyle}
                                        onChange={(e) => setSelectedVideoStyle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-white/30 transition-all cursor-pointer"
                                      >
                                        <option value="" disabled>Selecione um estilo de vídeo...</option>
                                        {allVideoStyles.map((cat, idx) => (
                                          <optgroup key={`${cat.category}-${idx}`} label={cat.category} className="bg-zinc-900 text-slate-400 text-xs">
                                            {cat.styles.map((style: any, sIdx: number) => (
                                              <option key={`${style.name}-${sIdx}`} value={style.prompt} className="text-sm text-white">
                                                {style.name}
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                    </div>

                                    {selectedVideoStyle && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                      >
                                        <div className="bg-black/60 border border-white/5 p-4 rounded-xl text-xs leading-relaxed text-slate-300">
                                          {selectedVideoStyle}
                                        </div>
                                        <Button 
                                          onClick={() => handleCopyVideoPrompt(selectedVideoStyle)}
                                          className="w-full bg-white text-black hover:bg-slate-200 rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-xs"
                                        >
                                          {isVideoPromptCopied ? <Check size={14} /> : <Copy size={14} />}
                                          {isVideoPromptCopied ? 'Copiado!' : 'Copiar Prompt de Vídeo'}
                                        </Button>
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Weather & Time Presets Section */}
                                <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                      <Cloud size={16} className="text-slate-300" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold text-white">Clima e Horário</div>
                                      <div className="text-[10px] text-slate-500">Ajuste a atmosfera da cena</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {weatherPresets.map((preset) => (
                                      <button
                                        key={preset.id}
                                        onClick={() => handleRefinePrompt(`Mude o clima/horário para: ${preset.prompt}`)}
                                        disabled={isRefining}
                                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <preset.icon size={18} className="text-slate-400 group-hover:text-violet-400 transition-colors" />
                                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-white transition-colors">{preset.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Refinement UI */}
                                <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                                  <div className="text-xs font-semibold text-slate-300 mb-4">Refinar Resultado</div>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                      type="text"
                                      value={refinementText}
                                      onChange={(e) => setRefinementText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                      placeholder="Ex: Mude a iluminação..."
                                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition-all"
                                      disabled={isRefining}
                                    />
                                    <Button 
                                      onClick={handleRefine}
                                      disabled={!refinementText.trim() || isRefining}
                                      className="bg-white text-black hover:bg-slate-200 rounded-xl px-6 h-12 sm:h-auto"
                                    >
                                      {isRefining ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                    </Button>
                                  </div>
                                </div>
                              </section>
                            )}

                            {/* Image Output Section */}
                            {resultImage && (
                              <section>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <h4 className="text-xs font-semibold text-slate-300">Resultado Visual</h4>
                                </div>
                                <div className="relative group/asset rounded-[24px] overflow-hidden border border-white/10 shadow-3xl">
                                  <img src={resultImage} alt="Generated" className="w-full h-auto" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/asset:opacity-100 transition-all duration-500 flex items-end justify-between p-6">
                                    <Button size="sm" variant="outline" className="bg-white/5 backdrop-blur-md border-white/10 text-white rounded-xl">
                                      <Maximize2 size={14} className="mr-2" /> Expandir
                                    </Button>
                                    <Button size="sm" className="bg-white text-black font-bold rounded-xl px-6">
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              </section>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom Action - Hidden for Architecture mode */}
                    {mode !== AnalysisMode.ARCHITECTURE && analysis && !resultImage && (
                      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-xl">
                        <Button 
                          variant="custom"
                          className={cn(
                            "w-full h-16 rounded-2xl text-sm font-bold transition-all duration-500",
                            status === AppStatus.GENERATING 
                              ? "bg-white/5 text-slate-500 border border-white/5" 
                              : "bg-white text-black hover:bg-slate-200 shadow-xl hover:-translate-y-1"
                          )}
                          onClick={handleGenerate}
                          disabled={status === AppStatus.GENERATING || !!error}
                        >
                          {status === AppStatus.GENERATING ? (
                            <div className="flex items-center gap-3">
                              <Loader2 size={18} className="animate-spin" />
                              <span>Gerando Imagem...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Sparkles size={18} />
                              <span>Gerar Imagem Final</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  </div>
);
};

export default VuskAI;
