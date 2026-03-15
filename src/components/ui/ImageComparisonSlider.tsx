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
    <div className={cn("relative rounded-[24px] overflow-hidden border border-white/5 group", className)}>
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={imageBefore} alt="Before" />}
        itemTwo={<ReactCompareSliderImage src={imageAfter} alt="After" />}
        handle={
          <div className="h-full w-[0.5px] bg-white/30 relative flex items-center justify-center">
            <div className="absolute w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
              <div className="flex items-center gap-0.5 text-white/70">
                <ChevronLeft size={12} />
                <ChevronRight size={12} />
              </div>
            </div>
          </div>
        }
        className="h-full w-full"
      />
      
      {/* Labels */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-tight font-semibold text-white/70">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <span className="px-3 py-1.5 rounded-full bg-indigo-600/80 backdrop-blur-md border border-indigo-400/20 text-[9px] uppercase tracking-tight font-semibold text-white">
          {afterLabel}
        </span>
      </div>
    </div>
  );
};
