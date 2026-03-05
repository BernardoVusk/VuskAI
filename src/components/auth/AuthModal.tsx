import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOGO_URL = "https://i.imgur.com/JeRxE3T.png";

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'update_password'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Handle password update mode if we have a session but no password set (or from recovery)
  React.useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=invite') || hash.includes('type=recovery') || hash.includes('type=signup'))) {
        setMode('update_password');
      }
    };

    if (isOpen) {
      checkHash();
    }
    
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [isOpen]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        
        if (data.session) {
            onClose();
        } else {
            setMessage('Cadastro realizado! Verifique seu e-mail para confirmar.');
            setMode('login');
        }
      } else if (mode === 'update_password') {
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        if (error) throw error;
        
        window.history.replaceState(null, '', window.location.pathname);
        onClose();
        alert('Senha definida com sucesso! Sua conta está pronta.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#type=recovery`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('E-mail de recuperação enviado!');
    }
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
            onClick={mode === 'update_password' ? undefined : onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[850px] h-auto max-h-[95vh] bg-[#050505] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side: Form */}
              <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
                {/* Logo & Title */}
                <div className="mb-6 md:mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xl font-black tracking-tighter text-white">ARCHRENDER<span className="text-violet-500">AI</span></span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {mode === 'login' ? 'Bem-vindo de volta, Criativo!' : mode === 'signup' ? 'Junte-se à Revolução!' : 'Defina sua Senha'}
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm">
                    {mode === 'login' ? 'Estamos felizes em ver você novamente' : mode === 'signup' ? 'Comece a criar renders incríveis hoje' : 'Proteja sua conta com uma nova senha'}
                  </p>
                </div>

                {/* Mode Switcher */}
                {mode !== 'update_password' && (
                  <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-6 md:mb-8 w-fit min-w-[200px] md:min-w-[240px]">
                    <button
                      onClick={() => setMode('login')}
                      className={`flex-1 py-2 md:py-2.5 px-4 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all ${mode === 'login' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => setMode('signup')}
                      className={`flex-1 py-2 md:py-2.5 px-4 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all ${mode === 'signup' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                      Cadastrar
                    </button>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-4 md:space-y-5 flex-1">
                  {mode === 'signup' && (
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Digite seu nome completo"
                        className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-4 text-sm md:text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-600/50 transition-all"
                        required={mode === 'signup'}
                      />
                    </div>
                  )}

                  {mode !== 'update_password' && (
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu e-mail"
                        className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-4 text-sm md:text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-600/50 transition-all"
                        required
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'update_password' ? 'Digite a nova senha' : 'Digite sua senha'}
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-10 md:pr-12 text-sm md:text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-600/50 transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>

                  {mode === 'login' && (
                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 md:w-5 md:h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-violet-600 border-violet-600' : 'border-white/10 group-hover:border-white/20'}`}>
                          {rememberMe && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="text-[10px] md:text-sm font-medium text-slate-400">Lembrar de mim</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] md:text-sm font-bold text-violet-500 hover:text-violet-400 transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 md:p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm font-medium">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="p-3 md:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-medium">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 md:py-4 rounded-2xl bg-violet-600 text-white font-bold text-base md:text-lg shadow-xl shadow-violet-600/25 hover:bg-violet-700 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Atualizar Senha'}
                  </button>

                  {mode !== 'update_password' && (
                    <>
                      <div className="relative py-2 md:py-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-[#050505] px-4 text-slate-500 font-bold tracking-widest">OU</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 md:py-4 rounded-2xl bg-white/5 border-2 border-white/5 text-xs md:text-sm text-white font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 md:w-5 md:h-5" />
                        Entrar com Google
                      </button>
                    </>
                  )}
                </form>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    © 2026 ArchRender AI. Todos os direitos reservados.<br />
                    O uso ou reprodução não autorizada de qualquer conteúdo desta plataforma é proibido.
                  </p>
                </div>
              </div>

              {/* Right Side: Decorative Graphic */}
              <div className="hidden md:block w-[45%] relative overflow-hidden bg-violet-950">
                <img 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" 
                  alt="Decorative" 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-transparent to-indigo-900/60"></div>
                
                {/* Floating Glass Card */}
                <div className="absolute bottom-12 left-8 right-8 p-8 glass rounded-3xl border border-white/20 backdrop-blur-xl">
                  <p className="text-white/80 text-xs leading-relaxed font-medium">
                    "O futuro da apresentação arquitetônica está aqui. Gere renders incríveis em segundos e feche mais negócios."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-white/20"></div>
                    <div className="h-2 w-24 bg-white/20 rounded-full"></div>
                  </div>
                </div>

                {/* Close Button (Top Right of Modal) */}
                {mode !== 'update_password' && (
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
