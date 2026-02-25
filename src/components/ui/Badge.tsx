import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neon' | 'glow';
  size?: 'sm' | 'md';
}

export const Badge = ({ className, variant = 'default', size = 'md', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-white/10 text-white border border-white/5',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    outline: 'bg-transparent border border-white/20 text-slate-300',
    neon: 'bg-primary/10 text-primary-light border border-primary/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]',
    glow: 'bg-primary/20 text-white border border-primary/40 shadow-[0_0_15px_rgba(124,58,237,0.5)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-mono font-medium tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};
