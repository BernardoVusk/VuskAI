import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, MessageSquare, Phone, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { SupportTicket } from '../../types';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export const UserTicketList: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Erro ao buscar tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();

    // Subscribe to changes
    const subscription = supabase
      .channel('user_tickets')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Carregando seus tickets...</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50/50 rounded-[32px] border border-dashed border-zinc-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <MessageSquare size={24} className="text-zinc-300" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Nenhum ticket encontrado</h3>
        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Suas solicitações aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket, index) => (
        <motion.div
          key={ticket.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group bg-white border border-zinc-100 rounded-3xl p-5 md:p-6 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                ticket.status === 'analise' ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
              )}>
                {ticket.status === 'analise' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-black text-zinc-900 tracking-tighter">
                    AR-{String(ticket.protocol_id).padStart(4, '0')}
                  </span>
                  <Badge 
                    variant={ticket.status === 'analise' ? 'warning' : 'success'}
                    className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5"
                  >
                    {ticket.status === 'analise' ? 'Em Análise' : 'Concluído'}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-600 line-clamp-2 md:line-clamp-1 font-medium leading-relaxed">
                  {ticket.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 pl-16 md:pl-0">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <Calendar size={12} />
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                  <Phone size={12} />
                  {ticket.phone}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
