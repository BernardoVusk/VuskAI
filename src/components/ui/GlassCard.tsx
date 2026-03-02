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
        "relative bg-[oklch(20%_0.01_250_/_0.4)] backdrop-blur-2xl border border-[oklch(100%_0_0_/_0.1)] rounded-[32px] overflow-hidden",
        hoverEffect && "transition-all duration-500 hover:border-white/20 hover:bg-black/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
