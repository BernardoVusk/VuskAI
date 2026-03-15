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
    outline: 'bg-transparent border border-zinc-200 text-zinc-500',
    neon: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
    glow: 'bg-indigo-500/20 text-indigo-700 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold tracking-tight uppercase',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};
