import React from 'react';
import { motion } from 'motion/react';

export const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#020204]">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>
      
      {/* Blob 1 - Violet Primary */}
      <motion.div 
        animate={{ 
          x: ["-20%", "20%", "-10%", "-20%"],
          y: ["-10%", "10%", "-20%", "-10%"],
          scale: [1, 1.2, 0.9, 1],
          rotate: [0, 45, -45, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[10%] w-[60vw] h-[60vw] bg-violet-600/20 blur-[140px] rounded-full mix-blend-screen opacity-70 will-change-transform"
      />

      {/* Blob 2 - Purple Secondary */}
      <motion.div 
        animate={{ 
          x: ["10%", "-10%", "5%", "10%"],
          y: ["5%", "-5%", "10%", "5%"],
          scale: [1, 1.05, 0.95, 1],
          rotate: [0, -15, 15, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] right-[-5%] w-[50vw] h-[50vw] bg-indigo-600/15 blur-[150px] rounded-full mix-blend-screen opacity-60 will-change-transform"
      />

      {/* Blob 3 - Deep Blue */}
      <motion.div 
        animate={{ 
          x: ["-5%", "5%", "-10%", "-5%"],
          y: ["10%", "-10%", "5%", "10%"],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-15%] left-[-5%] w-[70vw] h-[70vw] bg-blue-900/30 blur-[180px] rounded-full mix-blend-screen opacity-50 will-change-transform"
      />

      {/* Blob 4 - Fuchsia Accent */}
      <motion.div 
        animate={{ 
          x: ["10%", "-10%", "20%", "10%"],
          y: ["-20%", "20%", "-10%", "-20%"],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-fuchsia-500/15 blur-[100px] rounded-[50%] mix-blend-screen opacity-30 will-change-transform"
      />
      
      {/* Bottom Gradient for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-[#020204] via-[#020204]/80 to-transparent pointer-events-none" />
    </div>
  );
};
