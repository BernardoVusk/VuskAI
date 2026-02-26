import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Camera, Wand2, Film, ShoppingBag, Building2, User, Scan, Zap, Fingerprint, Loader2, Sparkles, Maximize2, Copy, Check, Lock, Unlock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { AuroraBackground } from '../components/visuals/AuroraBackground';
import { cn } from '../lib/utils';
import { useVuskAI } from '../hooks/useVuskAI';
import { AnalysisMode, AppStatus } from '../types';
import { KeyActivationModal } from '../components/ui/KeyActivationModal';
import { Sidebar } from '../components/layout/Sidebar';
import { AdminLoginModal } from '../components/admin/AdminLoginModal';

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
    isRefining
  } = useVuskAI();

  const [isCopied, setIsCopied] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [refinementText, setRefinementText] = useState('');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Simulated scanning effect
  useEffect(() => {
    if (status === AppStatus.ANALYZING) {
      const interval = setInterval(() => {
        setScanLine(prev => (prev + 1) % 100);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleCopyPrompt = () => {
    if (analysis?.suggestedPrompt) {
      navigator.clipboard.writeText(analysis.suggestedPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRefine = async () => {
    if (!refinementText.trim()) return;
    await handleRefinePrompt(refinementText);
    setRefinementText('');
  };

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
  };

  const handleUnlockRequest = (targetMode: AnalysisMode) => {
    // We could pass the target mode to the modal if we wanted to show specific messaging
    openKeyModal();
  };

  const currentSubscription = subscriptions[mode];

  return (
    <div className="relative flex min-h-screen bg-black">
      <AuroraBackground />
      
      <KeyActivationModal 
        isOpen={isKeyModalOpen} 
        onClose={closeKeyModal} 
        onActivate={activateKey} 
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar 
        currentMode={mode}
        onModeChange={handleModeChange}
        subscriptions={subscriptions}
        onUnlockRequest={handleUnlockRequest}
        onAdminClick={() => setIsAdminLoginOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-0 flex items-center justify-between flex-shrink-0">
          <div>
            <motion.h1 
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight mb-1"
            >
              {mode.replace('_', ' ')} <span className="text-violet-500">PROTOCOL</span>
            </motion.h1>
            <div className="flex items-center gap-3">
              <p className="text-slate-400 font-mono text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM READY
              </p>
              
              {/* Subscription Status Badge */}
              {currentSubscription ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 py-0.5 h-5 text-[10px]">
                  <Unlock size={10} className="mr-1" />
                  {currentSubscription.plan.replace(/_/g, ' ')}
                </Badge>
              ) : (
                 <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 py-0.5 h-5 text-[10px] cursor-pointer hover:bg-red-500/20" onClick={openKeyModal}>
                  <Lock size={10} className="mr-1" />
                  LOCKED
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Input & Preview */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <GlassCard className="flex-1 flex flex-col p-1 relative group overflow-hidden border-violet-500/20 min-h-[500px]">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
              
              {/* Header */}
              <div className="relative flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur-sm z-20 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Scan size={14} className="text-violet-400" />
                  <span className="text-xs font-mono tracking-widest text-violet-200">SOURCE_INPUT</span>
                </div>
                <div className="flex gap-1.5">
                  {[1,2,3].map(i => (
                    <div key={i} className={cn("w-1 h-1 rounded-full", i === 1 ? "bg-violet-500 animate-pulse" : "bg-violet-500/20")} />
                  ))}
                </div>
              </div>

              {/* Dropzone / Image Area */}
              <div className="flex-1 relative min-h-[300px] lg:min-h-0 bg-black/40 m-1 rounded-lg overflow-hidden flex flex-col items-center justify-center group/drop">
                
                {/* Scanning Laser Effect */}
                {status === AppStatus.ANALYZING && (
                  <motion.div 
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-violet-500 z-30 shadow-[0_0_20px_rgba(139,92,246,1)]"
                  >
                    <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-t from-violet-500/20 to-transparent" />
                  </motion.div>
                )}

                {image ? (
                  <div className="relative w-full h-full">
                    <img src={image} alt="Reference" className="w-full h-full object-contain opacity-90" />
                    {/* Tech Overlays */}
                    <div className="absolute inset-0 border-[1px] border-violet-500/10 m-4 rounded-sm pointer-events-none">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-violet-500/50" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-violet-500/50" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-500/50" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-500/50" />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:text-violet-400 transition-colors p-8 text-center"
                  >
                    <div className="w-20 h-20 border border-dashed border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover/drop:border-violet-500/50 group-hover/drop:bg-violet-500/5 transition-all duration-300">
                      <Upload size={32} />
                    </div>
                    <p className="text-sm font-medium text-white mb-2">Upload Reference Image</p>
                    <p className="text-xs font-mono text-slate-500">JPG, PNG, WEBP • MAX 10MB</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Actions */}
              <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/5 z-20 flex-shrink-0">
                <Button 
                  variant="custom"
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" 
                  onClick={handleAnalyze}
                  disabled={!image || status === AppStatus.ANALYZING}
                >
                  {status === AppStatus.ANALYZING ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" /> PROCESSING_NEURAL_LAYERS...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} className="mr-2" /> INITIATE_ANALYSIS_PROTOCOL
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Analysis & Output */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <GlassCard className="flex-1 flex flex-col p-1 relative overflow-hidden border-emerald-500/20 min-h-[500px]">
               <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
               
               {/* Header */}
               <div className="relative flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur-sm z-20 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-xs font-mono tracking-widest text-emerald-200">SYSTEM_OUTPUT</span>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  {status === AppStatus.ANALYZING ? 'ANALYZING_DATA...' : 
                   status === AppStatus.GENERATING ? 'GENERATING_ASSET...' :
                   status === AppStatus.COMPLETE ? 'TASK_COMPLETE' :
                   status === AppStatus.ERROR ? 'SYSTEM_ERROR' :
                   analysis ? 'ANALYSIS_COMPLETE' : 'AWAITING_DATA'}
                </Badge>
              </div>

              <div className="flex-1 p-6 font-mono text-sm relative min-h-[300px]">
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400/80 p-6 text-center">
                      <div className="mb-4 p-4 bg-red-500/10 rounded-full border border-red-500/20">
                          <Zap size={32} className="text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-red-400 mb-2">SYSTEM_FAILURE</h3>
                      <p className="text-xs text-red-300/70 max-w-md">{error}</p>
                      <Button onClick={resetError} variant="outline" size="sm" className="mt-6 border-red-500/30 text-red-400 hover:bg-red-500/10">
                          RESET_SYSTEM
                      </Button>
                  </div>
                )}

                {status === AppStatus.ANALYZING ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-400/80">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-2 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="text-xs tracking-[0.2em] animate-pulse">DECODING_VISUAL_MATRIX</div>
                    <div className="mt-2 text-[10px] text-emerald-500/50 font-mono">
                      {['EXTRACTING_FEATURES', 'MAPPING_TOPOLOGY', 'SYNTHESIZING_PROMPT'][Math.floor(Date.now() / 1000) % 3]}...
                    </div>
                  </div>
                ) : !analysis && !resultImage && !error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                    <Fingerprint size={48} className="mb-4 animate-pulse" />
                    <div className="text-xs tracking-[0.2em]">NO_DATA_STREAM</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Analysis Text */}
                    {analysis && !error && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                      >
                        <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-transparent" />
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="text-emerald-500">●</span> GENERATED_PROMPT_MATRIX
                          </div>
                          <button 
                            onClick={handleCopyPrompt}
                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-500/70 hover:text-emerald-400 transition-colors bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                          >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            {isCopied ? 'COPIED' : 'COPY_PROMPT'}
                          </button>
                        </div>
                        <div className="text-emerald-100/90 leading-relaxed whitespace-pre-wrap bg-black/40 p-4 rounded-lg border border-white/5 relative group/prompt">
                          {analysis.suggestedPrompt}
                        </div>
                        
                        {/* Prompt Refinement UI */}
                        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                            <span className="text-blue-400">●</span> REFINE_PROMPT_MATRIX
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={refinementText}
                              onChange={(e) => setRefinementText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                              placeholder="Enter instructions to refine the prompt..."
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                              disabled={isRefining}
                            />
                            <Button 
                              onClick={handleRefine}
                              disabled={!refinementText.trim() || isRefining}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[100px]"
                            >
                              {isRefining ? (
                                <>
                                  <Loader2 size={14} className="mr-2 animate-spin" /> UPDATING
                                </>
                              ) : (
                                "UPDATE"
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Generated Image Result */}
                    {resultImage && !error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative mt-6 group"
                      >
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                          <span className="text-violet-500">●</span> RENDER_OUTPUT
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                          <img src={resultImage} alt="Generated" className="w-full h-auto" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                            <Button size="sm" variant="outline" className="bg-black/50 backdrop-blur-md border-white/20 text-white">
                              <Maximize2 size={14} className="mr-2" /> EXPAND
                            </Button>
                            <Button size="sm" className="bg-violet-600 text-white">
                              DOWNLOAD
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Generate Action - Hidden for Architecture mode */}
              {mode !== AnalysisMode.ARCHITECTURE && (
                <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/5 z-20 flex-shrink-0">
                   <Button 
                    variant="custom"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                    onClick={handleGenerate}
                    disabled={!analysis || status === AppStatus.GENERATING || !!error}
                  >
                    {status === AppStatus.GENERATING ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" /> RENDERING_PIXELS...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="mr-2" /> GENERATE_FINAL_ASSET
                      </>
                    )}
                  </Button>
                </div>
              )}

            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VuskAI;
