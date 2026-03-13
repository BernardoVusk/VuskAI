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
  CheckCircle2,
  Sun,
  SunMedium,
  Sunrise,
  Cloud,
  CloudFog,
  Moon,
  Snowflake,
  CloudRain,
  Rainbow
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { AuroraBackground } from '../components/visuals/AuroraBackground';
import { NeuralGrid } from '../components/visuals/NeuralGrid';
import { cn } from '../lib/utils';
import { useArchRender } from '../hooks/useArchRender';
import { AnalysisMode, AppStatus } from '../types';
import { KeyActivationModal } from '../components/ui/KeyActivationModal';
import { Sidebar } from '../components/layout/Sidebar';
import { KeyGenerator } from '../components/admin/KeyGenerator';
import { UserManagement } from '../components/admin/UserManagement';
import { Academy } from '../components/academy/Academy';
import { Library } from '../components/library/Library';
import { Settings } from '../components/auth/Settings';
const LOGO_URL = "https://i.imgur.com/ptDOAO8.png";

const ArchRender = () => {
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
    logout,
    clearImage
  } = useArchRender();

  const [isCopied, setIsCopied] = useState(false);
  const [isVideoPromptCopied, setIsVideoPromptCopied] = useState(false);
  const [selectedVideoStyle, setSelectedVideoStyle] = useState('');
  const [refinementText, setRefinementText] = useState('');
  const [archVizSubTab, setArchVizSubTab] = useState<'ai' | 'prompts' | 'aulas'>('ai');
  const [adminSubTab, setAdminSubTab] = useState<'keys' | 'users'>('keys');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    { id: 'midday', name: "Meio-dia", prompt: "Bright midday sun, create blue sky, high contrast, sharp shadows", icon: SunMedium },
    { id: 'sunrise', name: "Nascer do Sol", prompt: "Sunrise light, soft morning atmosphere, cool blue and pink tones", icon: Sunrise },
    { id: 'cloudy', name: "Nublado", prompt: "Overcast sky, soft diffused lighting, moody grey clouds", icon: Cloud },
    { id: 'foggy', name: "Neblina", prompt: "Dense fog, misty atmosphere, ethereal lighting, low visibility", icon: CloudFog },
    { id: 'night', name: "Noite", prompt: "Night scene, deep blue sky, artificial lighting, glowing windows", icon: Moon },
    { id: 'snow', name: "Neve", prompt: "Snowing, winter atmosphere, white landscape, cold lighting", icon: Snowflake },
    { id: 'rain', name: "Chuva", prompt: "Raining, wet surfaces, reflections, moody atmosphere", icon: CloudRain },
    { id: 'after_rain', name: "Pós-Chuva", prompt: "After the rain, rainbow in the sky, wet asphalt, fresh atmosphere", icon: Rainbow },
    { id: 'storm', name: "Tempestade", prompt: "Stormy weather, lightning flashes, dark dramatic sky, heavy rain", icon: Zap },
  ];

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
    <div className="relative flex min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-500/10 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-dot-slate-900/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      </div>
      
      <KeyActivationModal 
        isOpen={isKeyModalOpen} 
        onClose={closeKeyModal} 
        onActivate={activateKey} 
      />

      {/* Sidebar Navigation - Floating Style */}
      <div className="hidden lg:block fixed left-6 top-6 bottom-6 z-50">
        <Sidebar 
          currentMode={mode}
          onModeChange={handleModeChange}
          subscriptions={subscriptions}
          onUnlockRequest={handleUnlockRequest}
          onLogout={logout}
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-[60] flex items-center px-6">
          <img src={LOGO_URL} alt="ArchRender AI" className="h-24 w-auto" />
        </div>
        <Sidebar 
          currentMode={mode}
          onModeChange={handleModeChange}
          subscriptions={subscriptions}
          onUnlockRequest={handleUnlockRequest}
          onLogout={logout}
          isAdmin={isAdmin}
        />
      </div>

      {/* Arch Viz Secondary Sidebar */}
      <AnimatePresence>
        {mode === AnalysisMode.ARCHITECTURE && (
          <motion.div
            key="arch-nav"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="hidden lg:flex fixed left-[280px] top-6 bottom-6 w-[220px] z-40 flex-col border border-slate-200 bg-white/80 backdrop-blur-3xl p-6 rounded-[32px] shadow-2xl"
          >
            <div className="mb-10 px-2">
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Ferramentas</div>
            </div>
            
            <div className="space-y-3">
              {[
                { id: 'ai', label: 'Gerador AI', icon: Terminal },
                { id: 'prompts', label: 'Biblioteca', icon: Layout },
                { id: 'aulas', label: 'ArchRender Academy', icon: BookOpen },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setArchVizSubTab(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden active:scale-[0.98]",
                    archVizSubTab === item.id 
                      ? "bg-black text-white shadow-xl" 
                      : "text-slate-500 hover:text-black hover:bg-slate-50"
                  )}
                >
                  <item.icon 
                    size={18} 
                    className={cn(
                      "transition-transform duration-500 group-hover:scale-110",
                      archVizSubTab === item.id ? "text-white" : "text-slate-400 group-hover:text-blue-500"
                    )} 
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  
                  {archVizSubTab === item.id && (
                    <motion.div
                      layoutId="archviz-subtab-pill"
                      className="absolute inset-0 bg-black -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 p-4 md:p-8 pt-24 md:pt-8 relative z-10 flex flex-col min-h-screen transition-all duration-500 pb-32 lg:pb-8",
        mode === AnalysisMode.ARCHITECTURE ? "lg:ml-[520px]" : "lg:ml-[280px]"
      )}>
        
        {/* Header - Editorial Style */}
        <header className="mb-8 md:mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 relative z-10">
          <motion.div
            key={mode}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Neural_Processing_Active
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-fluid-9xl font-black tracking-tighter leading-[0.85] text-slate-900 uppercase">
              {mode === AnalysisMode.ARCHITECTURE && archVizSubTab !== 'ai' 
                ? archVizSubTab
                : mode.split('_')[0]}
              <span className="block text-blue-600 opacity-20">Engine_v3</span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-end gap-4 w-full md:w-auto"
          >
            {currentSubscription ? (
              <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white border border-emerald-100 shadow-xl shadow-emerald-500/5 w-full md:w-auto justify-center md:justify-start">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Unlock size={14} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Acesso Pro Ativo</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{calculateRemainingDays(currentSubscription.expiresAt)} dias restantes</div>
                </div>
              </div>
            ) : (
              <button 
                onClick={openKeyModal}
                className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-black text-white shadow-2xl shadow-black/20 hover:bg-slate-900 transition-all group w-full md:w-auto justify-center md:justify-start active:scale-95 hover:-translate-y-1"
              >
                <Lock size={16} className="text-white/50 group-hover:text-white transition-colors" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">
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
                    ? "bg-black text-white border-black" 
                    : "bg-white text-slate-500 border-slate-200"
                )}
              >
                <item.icon size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Grid */}
        <div className="relative flex-1 flex flex-col">
          {/* Content Wrapper */}
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-700",
            !currentSubscription && mode !== AnalysisMode.ADMIN_KEYS && mode !== AnalysisMode.SETTINGS ? "blur-2xl pointer-events-none opacity-50 grayscale" : ""
          )}>
            <AnimatePresence key={mode} mode="wait">
              {mode === AnalysisMode.ADMIN_KEYS ? (
            <motion.div
              key="admin-keys"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col"
            >
              <GlassCard className="flex-1 p-8 overflow-auto border-slate-200 bg-white rounded-[32px] shadow-2xl">
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Terminal size={24} className="text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">Painel_Administrativo</h2>
                        <p className="text-slate-400 font-mono text-[10px] tracking-[0.3em] uppercase">System_Control_Module</p>
                      </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setAdminSubTab('keys')}
                        className={cn(
                          "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          adminSubTab === 'keys' ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Gerador de Chaves
                      </button>
                      <button 
                        onClick={() => setAdminSubTab('users')}
                        className={cn(
                          "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          adminSubTab === 'users' ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Gestão de Usuários
                      </button>
                    </div>
                  </div>
                  
                  {adminSubTab === 'keys' ? <KeyGenerator /> : <UserManagement />}
                </div>
              </GlassCard>
            </motion.div>
          ) : mode === AnalysisMode.SETTINGS ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <Settings />
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
            ) : (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col"
              >
                <Library isAdmin={isAdmin} />
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
                  <GlassCard className="flex-1 flex flex-col p-0 relative group overflow-hidden border-x-0 md:border-x border-slate-200 bg-white md:rounded-[32px] rounded-none shadow-2xl">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                    <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[length:30px_30px]" />
                    
                    {/* Panel Header */}
                    <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 z-20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                          <Scan size={16} className="text-slate-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-900">Imagem de Referência</div>
                        </div>
                      </div>
                    </div>

                    {/* Dropzone Area */}
                    <div className="flex-1 relative md:m-4 md:rounded-[24px] overflow-hidden bg-slate-50 border-y md:border border-slate-200 group/drop">
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
                            <img src={image} alt="Reference" className="w-full h-full object-cover md:object-contain md:rounded-lg shadow-xl" />
                            
                            {/* Delete Image Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearImage();
                              }}
                              className="absolute top-4 right-4 z-40 p-3 md:p-2 rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:text-red-500 hover:bg-white transition-all shadow-lg active:scale-90"
                              title="Remove Image"
                            >
                              <X size={20} className="md:w-4 md:h-4" />
                            </button>
                            
                            {/* Tech HUD Overlay - Hidden on mobile for edge-to-edge */}
                            <div className="hidden md:block absolute inset-6 border border-slate-900/5 rounded-lg pointer-events-none">
                              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-blue-500/30" />
                              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-blue-500/30" />
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-blue-500/30" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-blue-500/30" />
                            </div>

                            {/* Scanning Laser */}
                            {status === AppStatus.ANALYZING && (
                              <motion.div 
                                initial={{ top: "0%" }}
                                animate={{ top: "100%" }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                className="absolute left-0 right-0 h-[1px] bg-blue-500 z-30 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
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
                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group/upload active:bg-slate-100 transition-colors"
                          >
                            <div className="relative mb-8">
                              <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-150 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-500" />
                              <div className="relative w-24 h-24 rounded-3xl border border-slate-200 bg-white flex items-center justify-center group-hover/upload:border-blue-500/50 group-hover/upload:bg-blue-500/5 transition-all duration-500 shadow-sm">
                                <Upload size={32} className="text-slate-400 group-hover/upload:text-blue-500 group-hover/upload:scale-110 transition-all" />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">Carregar Imagem</h3>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arraste ou clique para selecionar</p>
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
                          "w-full h-14 sm:h-16 rounded-2xl text-sm font-bold transition-all duration-500 active:scale-[0.98] uppercase tracking-widest",
                          !image || status === AppStatus.ANALYZING 
                            ? "bg-slate-100 text-slate-400 border border-slate-200" 
                            : "bg-black text-white hover:bg-slate-900 shadow-xl"
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
                  <GlassCard className="flex-1 flex flex-col p-0 relative overflow-hidden border-slate-200 bg-white rounded-[32px] shadow-2xl">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[length:30px_30px]" />

                    {/* Panel Header */}
                    <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 z-20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                          <Cpu size={16} className="text-slate-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-900">Resultado da IA</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
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
                            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-6">
                              <Zap size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Erro no Sistema</h3>
                            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">{error}</p>
                            <Button 
                              onClick={resetError} 
                              variant="outline" 
                              className="rounded-xl border-slate-200 text-slate-900 hover:bg-slate-50 px-8"
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
                              <div className="w-24 h-24 border-2 border-emerald-100 rounded-full animate-spin border-t-emerald-500" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Globe size={32} className="text-emerald-500/30 animate-pulse" />
                              </div>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
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
                            className="absolute inset-0 flex flex-col items-center justify-center text-slate-300"
                          >
                            <Sparkles size={48} className="mb-6 opacity-50" />
                            <div className="text-xs font-bold uppercase tracking-widest">Aguardando análise</div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                          >
                            {/* Prompt Section */}
                            {analysis && (
                              <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Prompt_Sugerido</h4>
                                  </div>
                                  <button 
                                    onClick={handleCopyPrompt}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 hover:text-black transition-all active:scale-95 shadow-sm"
                                  >
                                    {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    {isCopied ? 'Copiado' : 'Copiar'}
                                  </button>
                                </div>
                                
                                <div className="relative group/prompt">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[24px] blur opacity-0 group-hover/prompt:opacity-100 transition duration-500" />
                                  <div className="relative bg-white border border-slate-200 p-6 rounded-[24px] text-sm leading-relaxed text-slate-700 font-medium shadow-sm">
                                    {analysis.suggestedPrompt}
                                  </div>
                                </div>
                                
                                {/* Video Style Prompts Section */}
                                <div className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-200/60 backdrop-blur-sm">
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                      <Video size={18} className="text-slate-600" />
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none mb-1">Presets_Cinematográficos</div>
                                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">Otimizado para Veo & Sora</div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="relative group/select">
                                      <select 
                                        value={selectedVideoStyle}
                                        onChange={(e) => setSelectedVideoStyle(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer font-bold shadow-sm"
                                      >
                                        <option value="" disabled>Selecione um estilo de vídeo...</option>
                                        {videoStyles.map((cat) => (
                                          <optgroup key={cat.category} label={cat.category} className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            {cat.styles.map((style) => (
                                              <option key={style.name} value={style.prompt} className="text-sm text-slate-900 font-bold">
                                                {style.name}
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-blue-500 transition-colors">
                                        <ChevronDown size={18} />
                                      </div>
                                    </div>
 
                                    <AnimatePresence>
                                      {selectedVideoStyle && (
                                        <motion.div 
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="pt-2 space-y-4">
                                            <div className="bg-white/50 border border-slate-200 p-5 rounded-2xl text-xs leading-relaxed text-slate-600 font-medium italic">
                                              "{selectedVideoStyle}"
                                            </div>
                                            <Button 
                                              onClick={() => handleCopyVideoPrompt(selectedVideoStyle)}
                                              className="w-full bg-black text-white hover:bg-slate-900 rounded-2xl py-5 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 transition-all hover:-translate-y-1 active:scale-95"
                                            >
                                              {isVideoPromptCopied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                              {isVideoPromptCopied ? 'Prompt Copiado!' : 'Copiar Prompt de Vídeo'}
                                            </Button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>

                                {/* Weather & Time Presets Section */}
                                <div className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-200/60 backdrop-blur-sm">
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                      <Cloud size={18} className="text-slate-600" />
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none mb-1">Clima_e_Horário</div>
                                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">Ajuste a atmosfera da cena</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {weatherPresets.map((preset) => (
                                      <button
                                        key={preset.id}
                                        onClick={() => handleRefinePrompt(`Mude o clima/horário para: ${preset.prompt}`)}
                                        disabled={isRefining}
                                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200/50 hover:border-blue-500/30 hover:bg-blue-50/50 transition-all group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                      >
                                        <preset.icon size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors text-center">{preset.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Refinement UI */}
                                <div className="p-6 rounded-[32px] bg-blue-50/30 border border-blue-100/50">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900 mb-4">Refinar_Análise</div>
                                  <div className="flex gap-3">
                                    <div className="relative flex-1">
                                      <input
                                        type="text"
                                        value={refinementText}
                                        onChange={(e) => setRefinementText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                        placeholder="Ex: Adicione mais vegetação..."
                                        className="w-full bg-white border border-blue-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold shadow-sm"
                                        disabled={isRefining}
                                      />
                                    </div>
                                    <Button 
                                      onClick={handleRefine}
                                      disabled={!refinementText.trim() || isRefining}
                                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                      {isRefining ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                                    </Button>
                                  </div>
                                </div>
                              </section>
                            )}

                            {/* Image Output Section */}
                            {resultImage && (
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Resultado_Visual</h4>
                                </div>
                                <div className="relative group/asset rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl bg-white p-2">
                                  <div className="relative rounded-[24px] overflow-hidden">
                                    <img src={resultImage} alt="Generated" className="w-full h-auto" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/asset:opacity-100 transition-all duration-500 flex items-end justify-between p-8">
                                      <Button size="sm" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-xl hover:bg-white/20 font-bold text-[10px] uppercase tracking-widest">
                                        <Maximize2 size={14} className="mr-2" /> Expandir
                                      </Button>
                                      <Button size="sm" className="bg-white text-black font-black rounded-xl px-8 py-4 hover:bg-slate-100 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl">
                                        Download
                                      </Button>
                                    </div>
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
                      <div className="p-6 border-t border-slate-100 bg-slate-50">
                        <Button 
                          variant="custom"
                          className={cn(
                            "w-full h-16 rounded-2xl text-sm font-bold transition-all duration-500 uppercase tracking-widest",
                            status === AppStatus.GENERATING 
                              ? "bg-slate-100 text-slate-400 border border-slate-200" 
                              : "bg-black text-white hover:bg-slate-900 shadow-xl hover:-translate-y-1"
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

      {/* Locked Overlay */}
      <AnimatePresence>
        {!currentSubscription && mode !== AnalysisMode.ADMIN_KEYS && mode !== AnalysisMode.SETTINGS && (
          <motion.div 
            key="locked-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[30] flex flex-col items-center justify-center p-8 text-center bg-white/60 backdrop-blur-2xl rounded-[32px] border border-slate-200 shadow-2xl m-4 md:m-8"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-white border-2 border-red-100 flex items-center justify-center shadow-xl">
                <Lock size={40} className="text-red-500" />
              </div>
            </div>
            
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-4 text-slate-900">Módulo Bloqueado</h3>
            <p className="text-slate-500 font-bold text-xs max-w-md uppercase tracking-[0.2em] leading-relaxed mb-10">
              Acesso restrito detectado. <br/>
              Ative sua licença para desbloquear o motor de renderização.
            </p>
            
            <Button 
              onClick={openKeyModal}
              className="bg-black text-white hover:bg-slate-900 rounded-2xl px-16 py-5 font-bold text-sm uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:-translate-y-1 transition-all active:scale-95"
            >
              Ativar Acesso Agora
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </main>
</div>
);
};

export default ArchRender;
