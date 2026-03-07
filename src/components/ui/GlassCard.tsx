import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className,
  hoverEffect = false
}) => {
  return (
    <motion.div 
      layout
      className={cn(
        "relative bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm",
        hoverEffect && "transition-all duration-500 hover:border-slate-300 hover:bg-slate-50 hover:shadow-2xl active:scale-[0.99]",
        className
      )}
    >
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 pointer-events-none rounded-[32px] ring-1 ring-inset ring-white/50 z-10" />
      {children}
    </motion.div>
  );
};
