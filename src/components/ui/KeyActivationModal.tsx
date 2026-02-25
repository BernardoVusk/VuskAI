import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

interface KeyActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (key: string) => Promise<void>;
}

export const KeyActivationModal: React.FC<KeyActivationModalProps> = ({ isOpen, onClose, onActivate }) => {
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onActivate(key);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setKey('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid activation key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-1 border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.2)]">
              <div className="bg-black/40 p-6 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
                
                <div className="flex flex-col items-center mb-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
                    {success ? <CheckCircle2 className="text-emerald-400" /> : <Lock className="text-violet-400" />}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Vusk Vision Engine Locked</h2>
                  <p className="text-sm text-slate-400">Enter your activation key to access neural networks.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-violet-300 uppercase tracking-wider ml-1">Activation Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="VUSK-XXXX-XXXX-XXXX"
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 font-mono text-sm uppercase transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 size={14} />
                      Activation Successful. Initializing...
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 border-white/10 hover:bg-white/5 text-slate-400"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        disabled={isLoading || success || !key.trim()}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Activate System'}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-[10px] text-slate-600">
                        Don't have a key? <a href="#" className="text-violet-400 hover:underline">Purchase a license</a>
                    </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
