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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-1 border-indigo-500/30 shadow-2xl">
              <div className="bg-white p-6 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                
                <div className="flex flex-col items-center mb-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100">
                    {success ? <CheckCircle2 className="text-emerald-600" /> : <Lock className="text-indigo-600" />}
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-1 tracking-tight">Acesso Restrito</h2>
                  <p className="text-sm text-zinc-500">Insira sua chave de ativação para liberar as ferramentas.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-tight text-zinc-400 ml-1">Chave de Ativação</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="VUSK-XXXX-XXXX-XXXX"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-all font-medium"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-tight">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 uppercase tracking-tight">
                      <CheckCircle2 size={14} />
                      Ativação concluída com sucesso!
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 border-zinc-200 hover:bg-zinc-50 text-zinc-500 uppercase tracking-tight text-[10px] font-semibold"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 uppercase tracking-tight text-[10px] font-semibold"
                        disabled={isLoading || success || !key.trim()}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Ativar Acesso'}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-tight text-zinc-400">
                        Não tem uma chave? <a href="#" className="text-indigo-600 hover:underline">Adquira uma licença</a>
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
