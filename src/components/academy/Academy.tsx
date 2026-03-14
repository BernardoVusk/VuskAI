import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Play, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Edit, 
  Video, 
  BookOpen,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { AcademyModule, AcademyLesson } from '../../types';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/utils';

interface AcademyProps {
  isAdmin: boolean;
}

export const Academy: React.FC<AcademyProps> = ({ isAdmin }) => {
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  // Admin State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<AcademyLesson | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'module' | 'lesson' } | null>(null);
  
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: 0 });
  const [lessonForm, setLessonForm] = useState({ 
    title: '', 
    description: '', 
    video_id: '', 
    module_id: '', 
    order: 0 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: modulesData, error: modError } = await supabase
        .from('academy_modules')
        .select('*')
        .order('order', { ascending: true });
      
      if (modError) throw modError;

      const { data: lessonsData, error: lesError } = await supabase
        .from('academy_lessons')
        .select('*')
        .order('order', { ascending: true });

      if (lesError) throw lesError;

      setModules(modulesData || []);
      setLessons(lessonsData || []);
      
      // Expand first module by default if available
      if (modulesData && modulesData.length > 0) {
        setExpandedModules([modulesData[0].id]);
      }
    } catch (error: any) {
      console.error('Error fetching academy data:', error);
      if (error.code === 'PGRST116' || error.message?.includes('relation')) {
        alert('As tabelas do Academy ainda não foram criadas no banco de dados. Por favor, execute o script SQL fornecido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title) {
      alert('Por favor, insira um título para o módulo.');
      return;
    }
    
    setIsSaving(true);
    try {
      let error;
      if (editingModule) {
        const result = await supabase
          .from('academy_modules')
          .update(moduleForm)
          .eq('id', editingModule.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('academy_modules')
          .insert([moduleForm]);
        error = result.error;
      }
      
      if (error) {
        console.error('Supabase error:', error);
        alert(`Erro ao salvar módulo: ${error.message}`);
      } else {
        setIsModuleModalOpen(false);
        setEditingModule(null);
        setModuleForm({ title: '', description: '', order: 0 });
        fetchData();
      }
    } catch (error: any) {
      console.error('Error saving module:', error);
      alert(`Erro inesperado: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title || !lessonForm.video_id || !lessonForm.module_id) {
      alert('Por favor, preencha todos os campos obrigatórios da aula.');
      return;
    }

    setIsSaving(true);
    try {
      let error;
      if (editingLesson) {
        const result = await supabase
          .from('academy_lessons')
          .update(lessonForm)
          .eq('id', editingLesson.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('academy_lessons')
          .insert([lessonForm]);
        error = result.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        alert(`Erro ao salvar aula: ${error.message}`);
      } else {
        setIsLessonModalOpen(false);
        setEditingLesson(null);
        setLessonForm({ title: '', description: '', video_id: '', module_id: '', order: 0 });
        fetchData();
      }
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      alert(`Erro inesperado: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    console.log('Starting deletion process for module:', id);
    setLoading(true);
    try {
      // 1. Delete associated lessons first to handle foreign key constraints manually
      // if ON DELETE CASCADE is not set in the database.
      const { error: lessonsError } = await supabase
        .from('academy_lessons')
        .delete()
        .eq('module_id', id);
      
      if (lessonsError) {
        console.warn('Note: Error or no lessons to delete for this module:', lessonsError);
      }

      // 2. Delete the module itself
      const { error: moduleError } = await supabase
        .from('academy_modules')
        .delete()
        .eq('id', id);

      if (moduleError) {
        console.error('Delete module error:', moduleError);
        alert(`Erro ao excluir módulo: ${moduleError.message}\n\nDica: Se for um erro de chave estrangeira, execute o comando SQL de CASCADE no seu painel do Supabase.`);
      } else {
        // Success
        setExpandedModules(prev => prev.filter(mId => mId !== id));
        await fetchData();
      }
    } catch (error: any) {
      console.error('Unexpected error during module deletion:', error);
      alert(`Erro inesperado: ${error.message}`);
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      const { error } = await supabase.from('academy_lessons').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        alert(`Erro ao excluir aula: ${error.message}`);
      } else {
        fetchData();
      }
    } catch (error: any) {
      alert(`Erro inesperado: ${error.message}`);
    } finally {
      setItemToDelete(null);
    }
  };

  const openEditModule = (mod: AcademyModule) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description, order: mod.order });
    setIsModuleModalOpen(true);
  };

  const openEditLesson = (lesson: AcademyLesson) => {
    setEditingLesson(lesson);
    setLessonForm({ 
      title: lesson.title, 
      description: lesson.description || '', 
      video_id: lesson.video_id, 
      module_id: lesson.module_id, 
      order: lesson.order 
    });
    setIsLessonModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando Aulas...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 md:space-y-8 pb-20">
      {/* Admin Header Actions */}
      {isAdmin && (
        <div className="flex flex-row gap-2 md:gap-4 mb-4 md:mb-8">
          <Button 
            onClick={() => {
              setEditingModule(null);
              setModuleForm({ title: '', description: '', order: modules.length });
              setIsModuleModalOpen(true);
            }}
            className="flex-1 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-xl px-3 md:px-6 py-2 md:py-3 flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Módulo</span>
          </Button>
          <Button 
            onClick={() => {
              setEditingLesson(null);
              setLessonForm({ 
                title: '', 
                description: '', 
                video_id: '', 
                module_id: modules[0]?.id || '', 
                order: lessons.length 
              });
              setIsLessonModalOpen(true);
            }}
            className="flex-1 bg-black text-white hover:bg-slate-900 rounded-xl px-3 md:px-6 py-2 md:py-3 flex items-center justify-center gap-2 shadow-lg"
          >
            <Video size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Aula</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Right: Video Player (Moved up on mobile) */}
        <div className="lg:col-span-7 lg:order-2">
          <GlassCard className="aspect-video relative overflow-hidden border-slate-200 bg-white rounded-3xl md:rounded-[32px] shadow-2xl flex items-center justify-center">
            {selectedLesson ? (
              <iframe
                src={`https://www.youtube.com/embed/${selectedLesson.video_id}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedLesson.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300 p-8 text-center">
                <Video size={48} className="mb-4 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Selecione uma aula para começar</p>
              </div>
            )}
          </GlassCard>
          
          {selectedLesson && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 md:mt-6 p-5 md:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm"
            >
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">{selectedLesson.title}</h2>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{selectedLesson.description}</p>
            </motion.div>
          )}
        </div>

        {/* Left: Module List */}
        <div className="lg:col-span-5 lg:order-1 space-y-3 md:space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="space-y-2">
              <div
                onClick={() => toggleModule(mod.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleModule(mod.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                  expandedModules.includes(mod.id)
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={18} />
                  <div className="text-left">
                    <h3 className="text-sm font-bold tracking-tight uppercase tracking-widest">{mod.title}</h3>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px] font-medium">{mod.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="flex gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModule(mod);
                        }} 
                        className="p-2.5 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                        title="Editar Módulo"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Setting item to delete:', { id: mod.id, type: 'module' });
                          setItemToDelete({ id: mod.id, type: 'module' });
                        }} 
                        className="p-2.5 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="Excluir Módulo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {expandedModules.includes(mod.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              <AnimatePresence>
                {expandedModules.includes(mod.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 space-y-2"
                  >
                    {lessons.filter(l => l.module_id === mod.id).map(lesson => (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedLesson(lesson);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group cursor-pointer",
                          selectedLesson?.id === lesson.id
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-white border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            selectedLesson?.id === lesson.id ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-slate-200"
                          )}>
                            <Play size={14} fill={selectedLesson?.id === lesson.id ? "currentColor" : "none"} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">{lesson.title}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditLesson(lesson);
                              }} 
                              className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Editar Aula"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Setting item to delete:', { id: lesson.id, type: 'lesson' });
                                setItemToDelete({ id: lesson.id, type: 'lesson' });
                              }} 
                              className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Aula"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {lessons.filter(l => l.module_id === mod.id).length === 0 && (
                      <p className="text-[10px] text-slate-600 py-2 pl-2">Nenhuma aula encontrada</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Right: Video Player */}
        {/* Removed from here and moved up for mobile stacking */}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase tracking-widest">
                  {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
                </h3>
                <button onClick={() => setIsModuleModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Título</label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Descrição</label>
                  <textarea
                    value={moduleForm.description}
                    onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 h-24 resize-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Ordem</label>
                  <input
                    type="number"
                    value={moduleForm.order}
                    onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <Button 
                  onClick={handleSaveModule} 
                  disabled={isSaving}
                  className="w-full bg-black text-white hover:bg-slate-900 rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar Módulo'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {isLessonModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase tracking-widest">
                  {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                </h3>
                <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Módulo</label>
                  <select
                    value={lessonForm.module_id}
                    onChange={e => setLessonForm({ ...lessonForm, module_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Título</label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">ID do Vídeo (YouTube)</label>
                  <input
                    type="text"
                    value={lessonForm.video_id}
                    onChange={e => setLessonForm({ ...lessonForm, video_id: e.target.value })}
                    placeholder="Ex: dQw4w9WgXcQ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Descrição</label>
                  <textarea
                    value={lessonForm.description}
                    onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 h-24 resize-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Ordem</label>
                  <input
                    type="number"
                    value={lessonForm.order}
                    onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <Button 
                  onClick={handleSaveLesson} 
                  disabled={isSaving}
                  className="w-full bg-black text-white hover:bg-slate-900 rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar Aula'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {itemToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Confirmar Exclusão</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium">
                {itemToDelete.type === 'module' 
                  ? 'Tem certeza que deseja excluir este módulo? Todas as aulas vinculadas a ele também serão removidas permanentemente.'
                  : 'Tem certeza que deseja excluir esta aula permanentemente?'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (itemToDelete.type === 'module') {
                      handleDeleteModule(itemToDelete.id);
                    } else {
                      handleDeleteLesson(itemToDelete.id);
                    }
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
