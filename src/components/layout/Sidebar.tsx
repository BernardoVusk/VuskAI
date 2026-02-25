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
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnalysisMode, UserSubscriptions } from '../../types';

interface SidebarProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  subscriptions: UserSubscriptions;
  onUnlockRequest: (mode: AnalysisMode) => void;
  onAdminClick?: () => void;
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
  onUnlock: (e: React.MouseEvent) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  isLocked, 
  onClick,
  onUnlock
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-300 rounded-xl group relative overflow-hidden",
      isActive 
        ? "bg-violet-500/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)] border border-violet-500/20" 
        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
    )}
  >
    {isActive && (
      <motion.div
        layoutId="sidebar-active"
        className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}

    <div className="relative z-10 flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Icon 
          className={cn(
            "w-5 h-5 transition-colors duration-300", 
            isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
          )} 
        />
        <span className="font-medium tracking-wide">{label}</span>
      </div>
      
      <div 
        onClick={onUnlock}
        className={cn(
          "p-1.5 rounded-full transition-all duration-300",
          isLocked 
            ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10" 
            : "text-emerald-500/50"
        )}
      >
        {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
      </div>
    </div>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  onModeChange, 
  subscriptions,
  onUnlockRequest,
  onAdminClick
}) => {
  const menuItems = [
    { id: AnalysisMode.IDENTITY, label: 'Identity Core', icon: User },
    { id: AnalysisMode.LIFESTYLE, label: 'Lifestyle Raw', icon: Camera },
    { id: AnalysisMode.CINEMATIC, label: 'Cinema Grade', icon: Film },
    { id: AnalysisMode.MARKETPLACE, label: 'CTR Alchemist', icon: ShoppingBag },
    { id: AnalysisMode.ARCHITECTURE, label: 'Arch Viz', icon: Building2 },
  ];

  return (
    <div className="w-64 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-[#050505]/80 backdrop-blur-2xl p-4 flex-shrink-0">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="font-bold text-white">V</span>
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">VuskVision</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase pl-10">
          Neural Engine v6.0
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isLocked = !subscriptions[item.id]?.isActive;
          
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentMode === item.id}
              isLocked={isLocked}
              onClick={() => onModeChange(item.id)}
              onUnlock={(e) => {
                e.stopPropagation();
                if (isLocked) onUnlockRequest(item.id);
              }}
            />
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
          <div className="text-xs text-slate-400 mb-2">System Status</div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </div>
        </div>
        
        {onAdminClick && (
          <button 
            onClick={onAdminClick}
            className="w-full flex items-center justify-center gap-2 p-2 text-[10px] text-slate-600 hover:text-violet-400 transition-colors uppercase tracking-wider font-medium"
          >
            <Shield size={12} />
            Admin Access
          </button>
        )}
      </div>
    </div>
  );
};
