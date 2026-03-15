import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Send, CheckCircle2, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const ticketSchema = z.object({
  phone: z.string().min(10, 'Telefone inválido (mínimo 10 dígitos)'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  });

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getSession();
  }, []);

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([
          {
            user_id: session.user.id,
            user_email: session.user.email,
            phone: data.phone,
            message: data.message,
            status: 'analise',
          },
        ])
        .select('protocol_id')
        .single();

      if (error) throw error;

      const protocol = `AR-${String(ticket.protocol_id).padStart(4, '0')}`;
      setSubmittedProtocol(protocol);
      reset();
    } catch (error) {
      console.error('Erro ao enviar ticket:', error);
      alert('Erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedProtocol(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
          />

          {/* Modal / Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed z-[120] bg-white/80 backdrop-blur-xl border-t md:border border-zinc-200/50 shadow-2xl overflow-hidden",
              "bottom-0 left-0 right-0 rounded-t-[32px]",
              "md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-[32px]"
            )}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight uppercase">Suporte & Feedback</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Estamos aqui para ajudar</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              {submittedProtocol ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Enviado com Sucesso!</h3>
                  <p className="text-zinc-600 mb-8">Sua solicitação foi registrada. Em breve entraremos em contato.</p>
                  
                  <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Protocolo de Atendimento</span>
                    <span className="text-3xl font-black text-zinc-900 tracking-tighter">{submittedProtocol}</span>
                  </div>

                  <Button onClick={handleClose} className="w-full bg-black text-white rounded-2xl py-4">
                    Entendido
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">E-mail da Conta</label>
                    <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm text-zinc-400 font-medium">
                      {userEmail || 'Carregando...'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">WhatsApp / Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        {...register('phone')}
                        type="text"
                        placeholder="(00) 00000-0000"
                        className={cn(
                          "w-full bg-white border rounded-2xl pl-14 pr-5 py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all font-medium",
                          errors.phone ? "border-red-500 focus:ring-red-500/5" : "border-zinc-200 focus:border-black focus:ring-4 focus:ring-black/5"
                        )}
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Sua Mensagem ou Sugestão</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-5 top-5 text-zinc-400" size={18} />
                      <textarea
                        {...register('message')}
                        placeholder="Descreva como podemos ajudar..."
                        rows={4}
                        className={cn(
                          "w-full bg-white border rounded-2xl pl-14 pr-5 py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all font-medium resize-none",
                          errors.message ? "border-red-500 focus:ring-red-500/5" : "border-zinc-200 focus:border-black focus:ring-4 focus:ring-black/5"
                        )}
                      />
                    </div>
                    {errors.message && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-zinc-900 rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-sm shadow-xl shadow-black/10 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Enviar Solicitação</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
