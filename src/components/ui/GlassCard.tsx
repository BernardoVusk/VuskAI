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
    <div 
      className={cn(
        "relative bg-[#0B0F19]/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden",
        hoverEffect && "transition-all duration-300 hover:border-white/20 hover:bg-[#0B0F19]/60 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
};
