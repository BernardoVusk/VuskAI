import React from 'react';
import { motion } from 'motion/react';

export const NeuralGrid: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-5] pointer-events-none overflow-hidden opacity-20">
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf6_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf6_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />
      
      {/* Moving Pulse Lines */}
      <motion.div
        animate={{
          y: ["0%", "100%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent"
      />
      
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.5
          }}
          animate={{ 
            y: [null, Math.random() * 100 + "%"],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute w-1 h-1 bg-violet-400 rounded-full blur-[1px]"
        />
      ))}
    </div>
  );
};
