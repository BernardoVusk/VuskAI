import React, { useState } from 'react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  className = ""
}) => {
  const [sliderPercent, setSliderPercent] = useState(50);

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    const container = e.currentTarget.getBoundingClientRect();
    const x = ('touches' in e) ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = x - container.left;
    const percent = Math.min(Math.max((relativeX / container.width) * 100, 0), 100);
    setSliderPercent(percent);
  };

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden bg-zinc-100 ba-container cursor-ew-resize ${className || 'aspect-video'}`}
      onMouseMove={handleSliderMove}
      onTouchMove={handleSliderMove}
    >
      <div className="ba-before">
        <img 
          src={afterImage} 
          referrerPolicy="no-referrer" 
          alt="After" 
          className="w-full h-full object-cover" 
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="ba-after" style={{ clipPath: `inset(0 ${100 - sliderPercent}% 0 0)` }}>
        <img 
          src={beforeImage} 
          referrerPolicy="no-referrer" 
          alt="Before" 
          className="w-full h-full object-cover" 
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="ba-handle" style={{ left: `${sliderPercent}%` }}></div>
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 z-10 bg-blue-500/80 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
        {afterLabel}
      </div>
    </div>
  );
};
