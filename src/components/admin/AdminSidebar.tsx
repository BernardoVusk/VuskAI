import React from 'react';
import { LayoutDashboard, Key, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminSidebarProps {
  activeTab: 'dashboard' | 'keys';
  onTabChange: (tab: 'dashboard' | 'keys') => void;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  return (
    <div className="w-64 h-screen bg-[#050505] border-r border-white/10 flex flex-col p-4">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white">A</div>
        <span className="font-bold text-white">Admin Panel</span>
      </div>

      <div className="flex-1 space-y-1">
        <button
          onClick={() => onTabChange('dashboard')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'dashboard' 
              ? "bg-violet-500/10 text-violet-400" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        
        <button
          onClick={() => onTabChange('keys')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'keys' 
              ? "bg-violet-500/10 text-violet-400" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Key size={18} />
          Key Generator
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};
