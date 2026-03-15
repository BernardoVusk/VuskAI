import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Camera, 
  Film, 
  ShoppingBag, 
  Building2, 
  Lock, 
  Unlock,
  LucideIcon,
  Shield,
  Key,
  LogOut,
  Settings as SettingsIcon,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnalysisMode, UserSubscriptions } from '../../types';
const LOGO_URL = "https://i.imgur.com/ptDOAO8.png";

interface SidebarProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  subscriptions: UserSubscriptions;
  onUnlockRequest: (mode: AnalysisMode) => void;
  onAdminClick?: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  onSupportClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  onModeChange, 
  subscriptions,
  onUnlockRequest,
  onAdminClick,
  onLogout,
  isAdmin = false,
  onSupportClick
}) => {
  const menuItems = [
    { id: AnalysisMode.IDENTITY, label: 'Identidade', icon: User },
    { id: AnalysisMode.LIFESTYLE, label: 'Estilo de Vida', icon: Camera },
    { id: AnalysisMode.CINEMATIC, label: 'Cinematográfico', icon: Film },
    { id: AnalysisMode.MARKETPLACE, label: 'Marketplace', icon: ShoppingBag },
    { id: AnalysisMode.ARCHITECTURE, label: 'Arquitetura', icon: Building2 },
    { id: AnalysisMode.SETTINGS, label: 'Configurações', icon: SettingsIcon },
  ];

  if (isAdmin) {
    menuItems.push({ id: AnalysisMode.ADMIN_KEYS, label: 'Gerador de Chaves', icon: Key });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[240px] h-full flex-col border border-zinc-100 bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="mb-10 px-3">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="ArchRender AI" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <div className="mb-4 px-4">
          <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400">Menu Principal</div>
        </div>

        <div className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isLocked = item.id !== AnalysisMode.ADMIN_KEYS && item.id !== AnalysisMode.SETTINGS && !subscriptions[item.id as AnalysisMode]?.isActive;
            const isActive = currentMode === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id as AnalysisMode)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative active:scale-[0.98]",
                  isActive 
                    ? "text-zinc-900 font-semibold" 
                    : "text-zinc-400 font-medium hover:text-zinc-600 hover:bg-zinc-50/50"
                )}
              >
                <div className="relative z-10 flex items-center gap-3">
                  <item.icon 
                    size={18}
                    strokeWidth={1.5}
                    className={cn(
                      "transition-colors duration-300", 
                      isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"
                    )} 
                  />
                  <span className="text-sm tracking-tight">{item.label}</span>
                </div>
                
                {item.id !== AnalysisMode.ADMIN_KEYS && item.id !== AnalysisMode.SETTINGS && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLocked) onUnlockRequest(item.id as AnalysisMode);
                    }}
                    className={cn(
                      "relative z-10 p-1 rounded-full transition-all duration-300",
                      isLocked 
                        ? isActive ? "text-zinc-300" : "text-zinc-300 group-hover:text-zinc-500" 
                        : "text-emerald-500"
                    )}
                  >
                    {isLocked ? <Lock size={12} strokeWidth={1.5} /> : <Unlock size={12} strokeWidth={1.5} />}
                  </div>
                )}

                {isActive && (
                  <>
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-zinc-50 border border-zinc-100 -z-10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-3 bottom-3 w-0.5 bg-indigo-600 rounded-full"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6 space-y-4">
          {onSupportClick && (
            <button 
              onClick={onSupportClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300 group active:scale-95"
            >
              <MessageSquare size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Suporte & Feedback</span>
            </button>
          )}

          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300 group active:scale-95"
            >
              <LogOut size={18} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Sair da Conta</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar - Refactored for Elite Aesthetic */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-100 rounded-2xl p-1 flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          {menuItems.filter(item => item.id !== AnalysisMode.ADMIN_KEYS).map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id as AnalysisMode)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-90 relative",
                  isActive ? "text-indigo-600" : "text-zinc-400"
                )}
              >
                <item.icon size={20} strokeWidth={1.5} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-indigo-50/50 -z-10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
