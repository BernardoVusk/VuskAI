import React, { useEffect, useState } from 'react';
import { Search, User, Calendar, Shield, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { AnalysisMode } from '../../types';
import { cn } from '../../lib/utils';

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  architecture_expiry?: string;
  identity_expiry?: string;
  marketplace_expiry?: string;
  lifestyle_expiry?: string;
  cinematic_expiry?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdatePassword = async (userId: string) => {
    const newPassword = passwords[userId];
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setUpdatingId(userId);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada.');

      const response = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newPassword,
          adminToken: session.access_token,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao atualizar senha.');

      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setPasswords(prev => ({ ...prev, [userId]: '' }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar senha.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateExpiry = async (userId: string, mode: string, days: number) => {
    setUpdatingId(userId);
    setMessage(null);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    const expiryString = expiryDate.toISOString();

    const updates: any = {};
    if (mode === 'ALL') {
      updates.architecture_expiry = expiryString;
      updates.identity_expiry = expiryString;
      updates.marketplace_expiry = expiryString;
      updates.lifestyle_expiry = expiryString;
      updates.cinematic_expiry = expiryString;
    } else {
      updates[`${mode.toLowerCase()}_expiry`] = expiryString;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Plano atualizado com sucesso!' });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar plano.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (dateString?: string) => {
    if (!dateString) return true;
    return new Date(dateString) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nenhum';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Gestão de Usuários</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Visualize e gerencie acessos manuais</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 text-sm font-bold uppercase tracking-wider mb-6",
          message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
        )}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Arquitetura</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Identidade</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user.full_name || 'Sem Nome'}</div>
                          <div className="text-xs text-slate-500">{user.email || 'Sem Email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "text-xs font-bold",
                        isExpired(user.architecture_expiry) ? "text-red-500" : "text-emerald-500"
                      )}>
                        {formatDate(user.architecture_expiry)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "text-xs font-bold",
                        isExpired(user.identity_expiry) ? "text-red-500" : "text-emerald-500"
                      )}>
                        {formatDate(user.identity_expiry)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateExpiry(user.id, 'ALL', 365)}
                            disabled={updatingId === user.id}
                            className="px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {updatingId === user.id ? <Loader2 size={12} className="animate-spin" /> : '+365 Dias (Master)'}
                          </button>
                          <button
                            onClick={() => handleUpdateExpiry(user.id, 'ARCHITECTURE', 365)}
                            disabled={updatingId === user.id}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            +365 Dias (Arq)
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Nova senha..."
                            value={passwords[user.id] || ''}
                            onChange={(e) => setPasswords(prev => ({ ...prev, [user.id]: e.target.value }))}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleUpdatePassword(user.id)}
                            disabled={updatingId === user.id}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                          >
                            Definir
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
