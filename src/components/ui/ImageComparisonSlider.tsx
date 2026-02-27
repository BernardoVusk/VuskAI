import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageComparisonSliderProps {
  imageBefore: string;
  imageAfter: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  imageBefore,
  imageAfter,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  className
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    
    setSliderPosition(percent);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0A0A] select-none group touch-none shadow-2xl",
        className
      )}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* After Image (Base) - Defines the container height */}
      <div className="relative w-full h-full">
        <img 
          src={imageAfter} 
          alt="After" 
          className="w-full h-auto block"
          draggable={false}
        />
        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-mono text-violet-400 uppercase tracking-widest z-10">
          {afterLabel}
        </div>
      </div>

      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={imageBefore} 
          alt="Before" 
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 left-4 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-mono text-slate-400 uppercase tracking-widest z-10">
          {beforeLabel}
        </div>
      </div>

      {/* Draggable Handle */}
      <div 
        className="absolute top-0 bottom-0 z-20 w-[2px] bg-white/40 cursor-ew-resize transition-colors group-hover:bg-white/60"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 active:scale-95">
          <div className="flex items-center gap-0.5 text-white">
            <ChevronLeft size={14} />
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Bottom Labels - Simplified for grid layout */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-30 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[8px] font-mono text-slate-300 uppercase tracking-widest">Prompt</span>
        </div>
        <div className="w-[1px] h-2 bg-white/20" />
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-violet-500" />
          <span className="text-[8px] font-mono text-slate-300 uppercase tracking-widest">Render</span>
        </div>
      </div>
    </div>
  );
};
