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
import { NeuralLibraryItem, AnalysisMode } from '../../types';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface LibraryProps {
  isAdmin: boolean;
  mode: AnalysisMode;
}

export const Library: React.FC<LibraryProps> = ({ isAdmin, mode }) => {
  const [items, setItems] = useState<NeuralLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
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
    type: 'image' as 'image' | 'video',
    tutorial_url: '',
    image_before: null as File | null,
    image_after: null as File | null,
    video_file: null as File | null,
    image_before_url: '',
    image_after_url: '',
    video_url: ''
  });

  const categories = mode === AnalysisMode.ARCHITECTURE 
    ? ['Todos', 'Interior Luxo', 'Fachada Moderna', 'Paisagismo', 'Comercial', 'Urbanismo']
    : ['Todos', 'Retrato Realista', 'Estilo Editorial', 'Cinematográfico', 'Fashion', 'Avatar'];

  useEffect(() => {
    fetchLibrary();
  }, [mode]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('neural_library')
        .select('*')
        .eq('mode', mode)
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
    // Validation: 
    // If image: needs name, prompt, and (editing or (before and after))
    // If video: needs name, prompt, and (editing or video_file)
    const isFilesValid = editingItem || (
      form.type === 'image' 
        ? (form.image_before && form.image_after) 
        : form.video_file
    );
    
    if (!form.name || !form.prompt_text || !isFilesValid) {
      alert('Por favor, preencha o nome, o prompt e selecione os arquivos necessários.');
      return;
    }

    setIsSaving(true);
    try {
      let beforeUrl = form.image_before_url;
      let afterUrl = form.image_after_url;
      let videoUrl = form.video_url;

      if (form.image_before) {
        beforeUrl = await uploadImage(form.image_before);
      }
      if (form.type === 'image' && form.image_after) {
        afterUrl = await uploadImage(form.image_after);
      }
      if (form.type === 'video' && form.video_file) {
        videoUrl = await uploadImage(form.video_file);
      }

      const itemData: any = {
        name: form.name,
        prompt_text: form.prompt_text,
        category: form.category,
        type: form.type,
        mode: mode,
        tutorial_url: form.tutorial_url,
        image_before_url: beforeUrl || '',
        image_after_url: form.type === 'image' ? (afterUrl || '') : '',
        video_url: form.type === 'video' ? (videoUrl || '') : ''
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
        type: 'image',
        tutorial_url: '',
        image_before: null,
        image_after: null,
        video_file: null,
        image_before_url: '',
        image_after_url: '',
        video_url: ''
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
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="flex-1 w-full md:max-w-md relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl py-4 pl-14 pr-6 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-sm font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex bg-slate-200/50 backdrop-blur-md p-1 rounded-full">
            <button
              onClick={() => setSelectedType('all')}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                selectedType === 'all' ? "bg-white text-black shadow-md" : "text-slate-500 hover:text-slate-800"
              )}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('image')}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                selectedType === 'image' ? "bg-white text-black shadow-md" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ImageIcon size={12} />
              Images
            </button>
            <button
              onClick={() => setSelectedType('video')}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                selectedType === 'video' ? "bg-white text-black shadow-md" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Video size={12} />
              Videos
            </button>
          </div>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95",
                selectedCategory === cat 
                  ? "bg-black text-white shadow-xl shadow-black/10" 
                  : "bg-white/80 text-slate-500 border border-slate-200/50 hover:bg-white hover:text-black"
              )}
            >
              {cat}
            </button>
          ))}
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingItem(null);
                setForm({
                  name: '',
                  prompt_text: '',
                  category: categories[1],
                  type: 'image',
                  tutorial_url: '',
                  image_before: null,
                  image_after: null,
                  video_file: null,
                  image_before_url: '',
                  image_after_url: '',
                  video_url: ''
                });
                setIsModalOpen(true);
              }}
              className="bg-blue-500/10 border border-blue-500/20 text-blue-600 hover:bg-blue-500 hover:text-white rounded-full px-6 py-2.5 flex items-center gap-2 ml-2 transition-all duration-300 group shadow-sm"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest">New Prompt</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-6 opacity-50" />
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Initializing Library...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlassCard className="group overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl rounded-[32px] shadow-2xl flex flex-col h-full hover:shadow-black/5 transition-all duration-700 border border-slate-200/50">
                  {/* Image Comparison or Video */}
                  <div className="aspect-[3/4] relative overflow-hidden">
                    {item.type === 'video' && item.video_url ? (
                      <div className="w-full h-full relative">
                        <video 
                          src={item.video_url} 
                          className="w-full h-full object-cover"
                          loop
                          muted
                          playsInline
                          onMouseOver={(e) => {
                            const playPromise = e.currentTarget.play();
                            if (playPromise !== undefined) {
                              playPromise.catch(() => {
                                // Ignore error
                              });
                            }
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.pause();
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                            <Play size={20} className="text-white fill-current ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ImageComparisonSlider
                        imageBefore={item.image_before_url}
                        imageAfter={item.image_after_url}
                        beforeLabel="Original"
                        afterLabel="Render"
                        className="h-full w-full rounded-none border-0"
                      />
                    )}
                    
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                      <Badge className="bg-black/20 backdrop-blur-xl border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                        {item.category}
                      </Badge>
                    </div>

                    {isAdmin && (
                      <div className="absolute top-6 right-6 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={() => {
                            setEditingItem(item);
                            setForm({
                              name: item.name,
                              prompt_text: item.prompt_text,
                              category: item.category,
                              type: item.type || 'image',
                              tutorial_url: item.tutorial_url || '',
                              image_before: null,
                              image_after: null,
                              video_file: null,
                              image_before_url: item.image_before_url,
                              image_after_url: item.image_after_url,
                              video_url: item.video_url || ''
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col flex-1 bg-white/40 backdrop-blur-md">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-slate-900 tracking-tight line-clamp-1 uppercase tracking-[0.1em]">{item.name}</h3>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        item.type === 'video' ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      )} />
                    </div>

                    {/* Technical Tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {['V-Ray Style', '8K Resolution', 'Photorealistic', 'Global Illumination'].map((tag) => (
                        <span key={tag} className="text-[9px] font-light uppercase tracking-widest text-slate-400 border border-slate-200/50 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-auto flex gap-3">
                      <button 
                        onClick={() => handleCopyPrompt(item.prompt_text, item.id)}
                        className={cn(
                          "flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group relative overflow-hidden",
                          copiedId === item.id 
                            ? "bg-emerald-500 text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-black"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          {copiedId === item.id ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Check size={16} />
                              <span>Copied!</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Copy size={14} className="group-hover:scale-110 transition-transform" />
                              <span>Copy Prompt</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>

                      {item.tutorial_url && (
                        <button
                          onClick={() => setActiveVideo(item.tutorial_url || null)}
                          className="w-12 h-12 rounded-2xl border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300 group/btn"
                        >
                          <Play size={16} className="fill-current group-hover/btn:scale-110 transition-transform" />
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
                {/* Before Image (Optional for videos) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Imagem Antes (Opcional p/ Vídeo)
                  </label>
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

                {/* After Image or Video */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                    {form.type === 'video' ? 'Vídeo do Resultado' : 'Imagem Depois (Render)'}
                  </label>
                  <div 
                    onClick={() => document.getElementById('after-upload')?.click()}
                    className="aspect-[9/16] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative group"
                  >
                    {form.type === 'video' ? (
                      form.video_file ? (
                        <video src={URL.createObjectURL(form.video_file)} className="w-full h-full object-cover" />
                      ) : form.video_url ? (
                        <video src={form.video_url} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Video size={24} className="text-slate-300 mb-2" />
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Upload Vídeo</span>
                        </>
                      )
                    ) : (
                      form.image_after ? (
                        <img src={URL.createObjectURL(form.image_after)} className="w-full h-full object-cover" />
                      ) : form.image_after_url ? (
                        <img src={form.image_after_url} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-300 mb-2" />
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Upload Depois</span>
                        </>
                      )
                    )}
                    <input 
                      id="after-upload" 
                      type="file" 
                      className="hidden" 
                      accept={form.type === 'video' ? "video/*" : "image/*"}
                      onChange={(e) => {
                        if (form.type === 'video') {
                          setForm({ ...form, video_file: e.target.files?.[0] || null });
                        } else {
                          setForm({ ...form, image_after: e.target.files?.[0] || null });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Tipo de Prompt</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setForm({ ...form, type: 'image' })}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                          form.type === 'image' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <ImageIcon size={14} />
                        Imagem
                      </button>
                      <button
                        onClick={() => setForm({ ...form, type: 'video' })}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                          form.type === 'video' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <Video size={14} />
                        Vídeo
                      </button>
                    </div>
                  </div>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Prompt Neural</label>
                  <textarea
                    value={form.prompt_text}
                    onChange={e => setForm({ ...form, prompt_text: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium min-h-[120px] resize-none"
                    placeholder="Cole aqui o prompt neural utilizado..."
                  />
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
