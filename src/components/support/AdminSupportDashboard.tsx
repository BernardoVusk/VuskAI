import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Mail, 
  Search, 
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { SupportTicket, TicketStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export const AdminSupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('analise');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const subscription = supabase
      .channel('admin_tickets')
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
  }, [filterStatus]);

  const handleCompleteTicket = async (ticketId: string) => {
    if (processingId) return; // Idempotência: evita cliques duplos
    
    setProcessingId(ticketId);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'concluido' })
        .eq('id', ticketId);

      if (error) throw error;
      
      // Atualização local otimista
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'concluido' } : t));
    } catch (error) {
      console.error('Erro ao concluir ticket:', error);
      alert('Erro ao atualizar o ticket.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `AR-${String(t.protocol_id).padStart(4, '0')}`.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-xl w-full md:w-auto">
          {(['analise', 'concluido', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filterStatus === status 
                  ? "bg-white text-black shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {status === 'analise' ? 'Pendentes' : status === 'concluido' ? 'Concluídos' : 'Todos'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por e-mail ou protocolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-black transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 size={32} className="animate-spin text-zinc-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Carregando tickets...</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50/50 rounded-[32px] border border-dashed border-zinc-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 size={24} className="text-zinc-300" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Tudo em dia!</h3>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Nenhum ticket pendente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white border border-zinc-100 rounded-[32px] p-6 hover:shadow-xl hover:shadow-zinc-200/30 transition-all duration-500"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-zinc-900 tracking-tighter">
                        AR-{String(ticket.protocol_id).padStart(4, '0')}
                      </span>
                      <Badge 
                        variant={ticket.status === 'analise' ? 'warning' : 'success'}
                        className="text-[9px] uppercase font-bold tracking-widest"
                      >
                        {ticket.status === 'analise' ? 'Em Análise' : 'Concluído'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <Calendar size={12} />
                      {new Date(ticket.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                      <Mail size={16} className="text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-600 truncate">{ticket.user_email}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                      <Phone size={16} className="text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-600">{ticket.phone}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Mensagem do Usuário</div>
                    <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                      {ticket.message}
                    </p>
                  </div>
                </div>

                <div className="flex lg:flex-col items-center justify-center lg:w-48 gap-3 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-6 lg:pt-0 lg:pl-6">
                  {ticket.status === 'analise' ? (
                    <Button
                      onClick={() => handleCompleteTicket(ticket.id)}
                      disabled={!!processingId}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      {processingId === ticket.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      <span>Concluir Ticket</span>
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center text-emerald-500 gap-1">
                      <CheckCircle2 size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Resolvido</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
