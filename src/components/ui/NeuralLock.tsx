import React from 'react';
import { motion } from 'motion/react';
import { Lock, Zap, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface NeuralLockProps {
  isActive: boolean;
  onActivate?: () => void;
}

export const NeuralLock: React.FC<NeuralLockProps> = ({ isActive, onActivate }) => {
  if (isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] flex items-center justify-center p-6 rounded-[32px] overflow-hidden"
    >
      {/* Intense Backdrop Blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" />
      
      {/* Glassmorphism Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        className="relative w-full max-w-md bg-white/90 border border-indigo-100 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(99,102,241,0.1)] backdrop-blur-md overflow-hidden group"
      >
        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 border border-indigo-500/5 rounded-[32px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon Header */}
          <div className="mb-6 relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Lock size={32} className="text-indigo-600" />
            </div>
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center"
            >
              <Zap size={14} className="text-indigo-600" />
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldAlert size={14} className="text-indigo-500" />
              <span className="text-[10px] font-semibold tracking-tight text-indigo-500 uppercase">
                Segurança ArchRender
              </span>
            </div>
            
            <h2 className="text-2xl font-semibold tracking-tighter text-zinc-900 uppercase leading-tight">
              Acesso Restrito
            </h2>
            
            <p className="text-sm text-zinc-500 leading-relaxed max-w-[280px] mx-auto">
              Este módulo requer uma assinatura ativa para processamento. 
              Desbloqueie o acesso premium para continuar.
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onActivate}
            className="w-full h-14 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-semibold text-sm tracking-tight flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Zap size={18} fill="currentColor" />
            ATIVAR ACESSO PREMIUM
          </Button>

          {/* Footer Info */}
          <div className="mt-6 flex items-center gap-4 text-[9px] font-medium text-zinc-400 uppercase tracking-tight">
            <span>Sessão Criptografada</span>
            <div className="w-1 h-1 rounded-full bg-zinc-200" />
            <span>ArchRender Engine v5.0</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
