import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';
import { Copy, MousePointer2 } from 'lucide-react';

export const CustomCursor = () => {
  const [cursorType, setCursorType] = useState<'default' | 'copy' | 'hover'>('default');
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('.cursor-pointer')) {
        if (target.innerText?.toLowerCase().includes('copiar') || target.closest('[data-cursor="copy"]')) {
          setCursorType('copy');
        } else {
          setCursorType('hover');
        }
      } else {
        setCursorType('default');
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    document.documentElement.classList.add('cursor-hidden');

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.documentElement.classList.remove('cursor-hidden');
    };
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: cursorType === 'default' ? 20 : cursorType === 'copy' ? 60 : 40,
        height: cursorType === 'default' ? 20 : cursorType === 'copy' ? 60 : 40,
        backgroundColor: cursorType === 'default' ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.2)',
        backdropFilter: cursorType === 'default' ? 'none' : 'blur(4px)',
      }}
    >
      {cursorType === 'copy' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center w-full h-full text-white"
        >
          <Copy size={20} />
        </motion.div>
      )}
      {cursorType === 'hover' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center w-full h-full text-white"
        >
          <MousePointer2 size={16} />
        </motion.div>
      )}
    </motion.div>
  );
};
