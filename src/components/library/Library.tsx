import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  X, 
  Save, 
  Loader2,
  Upload,
  Image as ImageIcon,
  Play,
  Video
} from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { ImageComparisonSlider } from '../ui/ImageComparisonSlider';
import { supabase } from '../../lib/supabaseClient';
import { NeuralLibraryItem } from '../../types';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface LibraryProps {
  isAdmin: boolean;
}

export const Library: React.FC<LibraryProps> = ({ isAdmin }) => {
  const [items, setItems] = useState<NeuralLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  // Admin State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<NeuralLibraryItem | null>(null);
  const [form, setForm] = useState({
    name: '',
    prompt_text: '',
    category: 'Interior Luxo',
    tutorial_url: '',
    image_before: null as File | null,
    image_after: null as File | null,
    image_before_url: '',
    image_after_url: ''
  });

  const categories = ['Todos', 'Interior Luxo', 'Fachada Moderna', 'Paisagismo', 'Comercial', 'Urbanismo'];

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('neural_library')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `library-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('library-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('library-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || !form.prompt_text || (!editingItem && (!form.image_before || !form.image_after))) {
      alert('Por favor, preencha todos os campos e selecione as imagens.');
      return;
    }

    setIsSaving(true);
    try {
      let beforeUrl = form.image_before_url;
      let afterUrl = form.image_after_url;

      if (form.image_before) {
        beforeUrl = await uploadImage(form.image_before);
      }
      if (form.image_after) {
        afterUrl = await uploadImage(form.image_after);
      }

      const itemData = {
        name: form.name,
        prompt_text: form.prompt_text,
        category: form.category,
        tutorial_url: form.tutorial_url,
        image_before_url: beforeUrl,
        image_after_url: afterUrl
      };

      let error;
      if (editingItem) {
        const result = await supabase
          .from('neural_library')
          .update(itemData)
          .eq('id', editingItem.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('neural_library')
          .insert([itemData]);
        error = result.error;
      }

      if (error) throw error;

      setIsModalOpen(false);
      setEditingItem(null);
      setForm({
        name: '',
        prompt_text: '',
        category: 'Interior Luxo',
        tutorial_url: '',
        image_before: null,
        image_after: null,
        image_before_url: '',
        image_after_url: ''
      });
      fetchLibrary();
    } catch (error: any) {
      console.error('Error saving library item:', error);
      if (error.message === 'Bucket not found') {
        alert('Erro: O bucket "library-images" não foi encontrado no Supabase Storage. Por favor, crie o bucket manualmente ou execute o script SQL de configuração.');
      } else {
        alert(`Erro ao salvar: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      const { error } = await supabase
        .from('neural_library')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchLibrary();
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.message}`);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.prompt_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar prompts ou projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-sm font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                selectedCategory === cat 
                  ? "bg-black text-white shadow-lg" 
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
          {isAdmin && (
            <Button 
              onClick={() => {
                setEditingItem(null);
                setForm({
                  name: '',
                  prompt_text: '',
                  category: 'Interior Luxo',
                  tutorial_url: '',
                  image_before: null,
                  image_after: null,
                  image_before_url: '',
                  image_after_url: ''
                });
                setIsModalOpen(true);
              }}
              className="bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 rounded-full px-6 py-2 flex items-center gap-2 ml-2 shadow-sm"
            >
              <Plus size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Novo Prompt</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Carregando Biblioteca...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <GlassCard className="group overflow-hidden border-slate-200 bg-white rounded-[32px] shadow-xl flex flex-col h-full hover:shadow-2xl transition-all duration-500">
                  {/* Image Comparison */}
                  <div className="aspect-[9/16] relative overflow-hidden">
                    <ImageComparisonSlider
                      imageBefore={item.image_before_url}
                      imageAfter={item.image_after_url}
                      beforeLabel="Antes"
                      afterLabel="Depois"
                      className="h-full w-full rounded-none border-0"
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-white/80 backdrop-blur-md border-slate-200 text-slate-900 text-[10px] font-bold uppercase tracking-widest">
                        {item.category}
                      </Badge>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingItem(item);
                            setForm({
                              name: item.name,
                              prompt_text: item.prompt_text,
                              category: item.category,
                              tutorial_url: item.tutorial_url || '',
                              image_before: null,
                              image_after: null,
                              image_before_url: item.image_before_url,
                              image_after_url: item.image_after_url
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-white/80 backdrop-blur-md border border-red-100 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight line-clamp-1 uppercase tracking-widest">{item.name}</h3>
                    <div className="relative flex-1">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 font-medium leading-relaxed max-h-[100px] overflow-y-auto custom-scrollbar">
                        {item.prompt_text}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        onClick={() => handleCopyPrompt(item.prompt_text, item.id)}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
                          copiedId === item.id 
                            ? "bg-emerald-500 text-white" 
                            : "bg-black text-white hover:bg-slate-900"
                        )}
                      >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === item.id ? 'Copiado!' : 'Copiar Prompt'}
                      </Button>

                      {item.tutorial_url && (
                        <button
                          onClick={() => setActiveVideo(item.tutorial_url || null)}
                          title="Ver Tutorial"
                          className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all group/btn"
                        >
                          <Play size={14} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase tracking-widest">
                  {editingItem ? 'Editar Prompt' : 'Novo Prompt Neural'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Before Image */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Imagem Antes (Original)</label>
                  <div 
                    onClick={() => document.getElementById('before-upload')?.click()}
                    className="aspect-[9/16] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative group"
                  >
                    {form.image_before ? (
                      <img src={URL.createObjectURL(form.image_before)} className="w-full h-full object-cover" />
                    ) : form.image_before_url ? (
                      <img src={form.image_before_url} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-300 mb-2" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Upload Antes</span>
                      </>
                    )}
                    <input 
                      id="before-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setForm({ ...form, image_before: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>

                {/* After Image */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Imagem Depois (Render)</label>
                  <div 
                    onClick={() => document.getElementById('after-upload')?.click()}
                    className="aspect-[9/16] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative group"
                  >
                    {form.image_after ? (
                      <img src={URL.createObjectURL(form.image_after)} className="w-full h-full object-cover" />
                    ) : form.image_after_url ? (
                      <img src={form.image_after_url} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-300 mb-2" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Upload Depois</span>
                      </>
                    )}
                    <input 
                      id="after-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setForm({ ...form, image_after: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Nome do Projeto</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                      placeholder="Ex: Loft Industrial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Categoria</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {categories.filter(c => c !== 'Todos').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Prompt Utilizado</label>
                  <textarea
                    value={form.prompt_text}
                    onChange={e => setForm({ ...form, prompt_text: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 h-32 resize-none font-medium"
                    placeholder="Cole aqui o prompt que gerou o resultado..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">URL do Tutorial (YouTube)</label>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={form.tutorial_url}
                      onChange={e => setForm({ ...form, tutorial_url: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-all font-medium"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full bg-black text-white hover:bg-slate-900 rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar no Portfólio'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeID(activeVideo)}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Utility to extract YouTube ID
const getYouTubeID = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
