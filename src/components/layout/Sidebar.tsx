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
  Key
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnalysisMode, UserSubscriptions } from '../../types';

interface SidebarProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  subscriptions: UserSubscriptions;
  onUnlockRequest: (mode: AnalysisMode) => void;
  onAdminClick?: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  onModeChange, 
  subscriptions,
  onUnlockRequest,
  onAdminClick,
  isAdmin = false
}) => {
  const menuItems = [
    { id: AnalysisMode.IDENTITY, label: 'Identidade', icon: User },
    { id: AnalysisMode.LIFESTYLE, label: 'Estilo de Vida', icon: Camera },
    { id: AnalysisMode.CINEMATIC, label: 'Cinematográfico', icon: Film },
    { id: AnalysisMode.MARKETPLACE, label: 'Marketplace', icon: ShoppingBag },
    { id: AnalysisMode.ARCHITECTURE, label: 'Arquitetura', icon: Building2 },
  ];

  if (isAdmin) {
    menuItems.push({ id: AnalysisMode.ADMIN_KEYS, label: 'Gerador de Chaves', icon: Key });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[240px] h-full flex-col border border-[oklch(100%_0_0_/_0.1)] bg-[oklch(20%_0.01_250_/_0.4)] backdrop-blur-3xl p-4 rounded-[32px] shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="mb-10 px-4 pt-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-display tracking-tight text-white">ArchRender AI</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isLocked = item.id !== AnalysisMode.ADMIN_KEYS && !subscriptions[item.id as AnalysisMode]?.isActive;
            const isActive = currentMode === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id as AnalysisMode)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden active:scale-[0.98]",
                  isActive 
                    ? "bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="relative z-10 flex items-center gap-3">
                  <item.icon 
                    size={18}
                    className={cn(
                      "transition-transform duration-500 group-hover:scale-110", 
                      isActive ? "text-black" : "text-slate-500 group-hover:text-violet-400"
                    )} 
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                
                {item.id !== AnalysisMode.ADMIN_KEYS && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLocked) onUnlockRequest(item.id as AnalysisMode);
                    }}
                    className={cn(
                      "relative z-10 p-1 rounded-full transition-all duration-500",
                      isLocked 
                        ? isActive ? "text-black/30" : "text-slate-600 group-hover:text-red-400" 
                        : "text-emerald-500/50"
                    )}
                  >
                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  </div>
                )}

                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-white"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Sistema Online</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              Processamento em tempo real ativo.
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-[oklch(20%_0.01_250_/_0.6)] backdrop-blur-3xl border border-[oklch(100%_0_0_/_0.1)] rounded-[24px] p-2 flex items-center justify-around shadow-2xl">
          {menuItems.filter(item => item.id !== AnalysisMode.ADMIN_KEYS).map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id as AnalysisMode)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 active:scale-90",
                  isActive ? "text-white" : "text-slate-500"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-white/10" : ""
                )}>
                  <item.icon size={20} />
                </div>
                <span className="text-[10px] font-medium uppercase">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="w-1 h-1 rounded-full bg-violet-500 mt-1"
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
