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
        className="relative w-full max-w-md bg-zinc-950/80 border border-violet-500/30 rounded-[32px] p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-md overflow-hidden group"
      >
        {/* Neon Border Glow Effect */}
        <div className="absolute inset-0 border border-blue-500/20 rounded-[32px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon Header */}
          <div className="mb-6 relative">
            <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Lock size={32} className="text-violet-400" />
            </div>
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center"
            >
              <Zap size={14} className="text-blue-400" />
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldAlert size={14} className="text-violet-500" />
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-violet-500 uppercase">
                Protocolo de Segurança
              </span>
            </div>
            
            <h2 className="text-2xl font-display font-bold tracking-tighter text-white uppercase leading-tight">
              PROTOCOLO DE ACESSO RESTRITO
            </h2>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto">
              Este módulo neural requer uma assinatura ativa para processamento de síntese. 
              Desbloqueie o acesso premium para continuar.
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onActivate}
            className="w-full h-14 bg-white text-black hover:bg-slate-200 rounded-2xl font-bold text-sm tracking-tight flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
          >
            <Zap size={18} fill="currentColor" />
            ATIVAR ACESSO PREMIUM
          </Button>

          {/* Footer Info */}
          <div className="mt-6 flex items-center gap-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            <span>Encrypted_Session</span>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <span>vusk_neural_lock_v2</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
