import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
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
  beforeLabel = "Sketch",
  afterLabel = "Final",
  className
}) => {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-white/10 group", className)}>
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={imageBefore} alt="Before" />}
        itemTwo={<ReactCompareSliderImage src={imageAfter} alt="After" />}
        handle={
          <div className="h-full w-0.5 bg-emerald-500 relative flex items-center justify-center">
            <div className="absolute w-10 h-10 rounded-full bg-black border border-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <div className="flex items-center gap-0.5 text-emerald-500">
                <ChevronLeft size={14} />
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        }
        className="h-full w-full"
      />
      
      {/* Labels */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest font-mono text-slate-400">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <span className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest font-mono text-emerald-400">
          {afterLabel}
        </span>
      </div>
    </div>
  );
};
