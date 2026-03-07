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
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Gerador de Chaves</h2>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Tipo de Plano</label>
            <select 
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 font-medium"
            >
              {Object.values(PlanType).map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Modo de Destino</label>
            <select 
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as AnalysisMode | 'ALL')}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 font-medium"
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
          className="w-full bg-black text-white hover:bg-slate-900 uppercase tracking-widest text-xs font-bold"
        >
          <RefreshCw size={16} className="mr-2" /> Gerar Nova Chave
        </Button>

        {generatedKey && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200 flex items-center justify-between shadow-sm">
            <div className="font-mono text-lg text-blue-600 tracking-wider font-bold">
              {generatedKey}
            </div>
            <button 
              onClick={copyKey}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
            >
              {isCopied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
