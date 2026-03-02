import React, { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { PlanType, AnalysisMode } from '../../types';

export const KeyGenerator = () => {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.TRIAL);
  const [selectedMode, setSelectedMode] = useState<AnalysisMode | 'ALL'>('ALL');
  const [isCopied, setIsCopied] = useState(false);

  const generateKey = () => {
    // Simple random key generation logic for demo
    const prefix = selectedMode === 'ALL' ? 'VUSK' : selectedMode.substring(0, 3);
    const planCode = selectedPlan.split('_')[1] || 'TRIAL';
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newKey = `${prefix}-${planCode}-${randomString}`;
    setGeneratedKey(newKey);
    setIsCopied(false);
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Gerador de Chaves</h2>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Tipo de Plano</label>
            <select 
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            >
              {Object.values(PlanType).map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Modo de Destino</label>
            <select 
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as AnalysisMode | 'ALL')}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">TODOS OS MODOS (Master)</option>
              {Object.values(AnalysisMode).filter(m => m !== AnalysisMode.ADMIN_KEYS).map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>

        <Button 
          onClick={generateKey}
          className="w-full bg-white text-black hover:bg-slate-200"
        >
          <RefreshCw size={16} className="mr-2" /> Gerar Nova Chave
        </Button>

        {generatedKey && (
          <div className="mt-6 p-4 bg-black/50 rounded-lg border border-violet-500/30 flex items-center justify-between">
            <div className="font-mono text-lg text-violet-400 tracking-wider font-bold">
              {generatedKey}
            </div>
            <button 
              onClick={copyKey}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              {isCopied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
