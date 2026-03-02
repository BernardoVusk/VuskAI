import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  X, 
  Save, 
  Loader2,
  Video,
  Pencil
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';

interface VideoPrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
  isDefault?: boolean;
}

interface VideoPromptManagerProps {
  onClose: () => void;
  onUpdate: () => void;
  defaultStyles: any[];
}

export const VideoPromptManager: React.FC<VideoPromptManagerProps> = ({ onClose, onUpdate, defaultStyles }) => {
  const [prompts, setPrompts] = useState<VideoPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    prompt: '',
    category: 'Geral'
  });

  const categories = ['Geral', 'Interiores', 'Fachada', 'Cinematográfico', 'Aéreo'];

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get DB prompts
      const { data, error: dbError } = await supabase
        .from('video_prompts')
        .select('*')
        .order('category', { ascending: true });
      
      if (dbError) {
        console.error('Supabase error:', dbError);
        setError(`Erro ao carregar do banco: ${dbError.message}. Verifique se as políticas de RLS estão corretas.`);
      }
      
      // Flatten default styles
      const flattenedDefaults: VideoPrompt[] = defaultStyles.flatMap(cat => 
        cat.styles.map((s: any) => ({
          id: `default-${s.name}`,
          name: s.name,
          prompt: s.prompt,
          category: cat.category,
          isDefault: true
        }))
      );

      const hidden = JSON.parse(localStorage.getItem('vusk_hidden_prompts') || '[]');
      const filteredDefaults = flattenedDefaults.filter(p => !hidden.includes(p.id));

      const dbPrompts = (data || []).map(p => ({ ...p, isDefault: false }));
      setPrompts([...filteredDefaults, ...dbPrompts]);
    } catch (err: any) {
      console.error('Error fetching video prompts:', err);
      setError('Erro inesperado ao carregar presets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.prompt) {
      alert('Por favor, preencha o nome e o prompt.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId && !editingId.startsWith('default-')) {
        // Update existing custom preset
        const { error } = await supabase
          .from('video_prompts')
          .update({
            name: form.name,
            prompt: form.prompt,
            category: form.category
          })
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        // Create new custom preset (either new or copy of default)
        const { error } = await supabase
          .from('video_prompts')
          .insert([{
            name: form.name,
            prompt: form.prompt,
            category: form.category
          }]);
        
        if (error) throw error;
      }

      setForm({ name: '', prompt: '', category: 'Geral' });
      setEditingId(null);
      await fetchPrompts();
      onUpdate();
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (p: VideoPrompt) => {
    setEditingId(p.id);
    setForm({
      name: p.isDefault ? `${p.name} (Cópia)` : p.name,
      prompt: p.prompt,
      category: p.category
    });
    
    if (p.isDefault) {
      // We don't alert anymore, the UI will show "Salvar como Novo"
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', prompt: '', category: 'Geral' });
  };

  const restoreDefaults = () => {
    localStorage.removeItem('vusk_hidden_prompts');
    fetchPrompts();
  };

  const handleDelete = async (id: string) => {
    console.log('Attempting to delete ID:', id);
    if (!confirm('Tem certeza que deseja excluir este prompt?')) return;
    
    if (id.startsWith('default-')) {
      console.log('Hiding default prompt locally');
      try {
        const hidden = JSON.parse(localStorage.getItem('vusk_hidden_prompts') || '[]');
        localStorage.setItem('vusk_hidden_prompts', JSON.stringify([...hidden, id]));
        
        if (editingId === id) {
          cancelEdit();
        }
        
        await fetchPrompts();
        return;
      } catch (err) {
        console.error('Error hiding default prompt:', err);
      }
    }

    try {
      setLoading(true);
      const { error, status, statusText } = await supabase
        .from('video_prompts')
        .delete()
        .eq('id', id);
      
      console.log('Supabase delete response:', { error, status, statusText });
      
      if (error) {
        console.error('Supabase delete error details:', error);
        throw error;
      }
      
      if (editingId === id) {
        cancelEdit();
      }
      
      // Force a small delay to ensure DB consistency before re-fetching
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchPrompts();
      onUpdate();
      alert('Prompt excluído com sucesso!');
    } catch (error: any) {
      console.error('Full delete error object:', error);
      alert(`Erro ao excluir: ${error.message || 'Erro desconhecido'}. Verifique o console (F12) para detalhes.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Video size={20} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Gerenciar Prompts de Vídeo</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
          {/* Form */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white mb-2">
                {editingId ? (editingId.startsWith('default-') ? 'Criar Cópia de Preset' : 'Editar Preset') : 'Adicionar Novo Preset'}
              </h4>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome do Estilo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                  placeholder="Ex: Drone Orbit 4K"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Prompt de Vídeo</label>
                <textarea
                  value={form.prompt}
                  onChange={e => setForm({ ...form, prompt: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 h-32 resize-none"
                  placeholder="Descreva o movimento da câmera e fidelidade arquitetônica..."
                />
              </div>

              <div className="flex gap-3">
                {editingId && (
                  <div className="flex gap-2 flex-1">
                    <Button 
                      onClick={cancelEdit}
                      className="flex-1 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-xl py-4 font-bold text-sm"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => handleDelete(editingId)}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl px-4 py-4"
                      title="Excluir este preset"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className={`flex-[2] ${editingId && !editingId.startsWith('default-') ? 'bg-violet-600 hover:bg-violet-700' : 'bg-white text-black hover:bg-slate-200'} rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId && !editingId.startsWith('default-') ? <Save size={16} /> : <Plus size={16} />)}
                  {isSaving ? 'Salvando...' : (editingId ? (editingId.startsWith('default-') ? 'Salvar como Novo' : 'Salvar Alterações') : 'Adicionar Preset')}
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col overflow-hidden">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              Presets Existentes
              <div className="flex items-center gap-2">
                {localStorage.getItem('vusk_hidden_prompts') && JSON.parse(localStorage.getItem('vusk_hidden_prompts') || '[]').length > 0 && (
                  <button 
                    onClick={restoreDefaults}
                    className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors mr-2"
                  >
                    Restaurar Padrões
                  </button>
                )}
                <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded-md">{prompts.length} TOTAL</span>
              </div>
            </h4>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400">
                {error}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : prompts.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-xs italic">
                  Nenhum preset cadastrado.
                </div>
              ) : (
                prompts.map((p) => (
                  <div key={p.id} className={`bg-white/5 border border-white/10 rounded-xl p-4 group hover:border-white/20 transition-all ${p.isDefault ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">
                            {p.category}
                          </span>
                          {p.isDefault && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                              Padrão
                            </span>
                          )}
                          <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">{p.prompt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="p-2 text-slate-600 hover:text-violet-400 hover:bg-violet-400/10 rounded-lg transition-all"
                          title={p.isDefault ? "Usar como base" : "Editar"}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
