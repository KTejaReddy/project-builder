'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  glowColor?: 'indigo' | 'purple' | 'green' | 'none';
}

export default function GlassCard({
  children,
  className,
  hoverEffect = true,
  onClick,
  glowColor = 'none'
}: GlassCardProps) {
  const glowStyles = {
    indigo: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-500/30',
    purple: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-purple-500/30',
    green: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:border-green-500/30',
    none: ''
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect && onClick ? { y: -4, scale: 1.01 } : hoverEffect ? { y: -2 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden',
        onClick && 'cursor-pointer',
        hoverEffect && 'hover:bg-slate-900/65',
        glowStyles[glowColor],
        className
      )}
    >
      {/* Decorative Glow Dots */}
      {glowColor !== 'none' && (
        <div 
          className={cn(
            'absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none',
            glowColor === 'indigo' && 'bg-indigo-500',
            glowColor === 'purple' && 'bg-purple-500',
            glowColor === 'green' && 'bg-green-500'
          )}
        />
      )}
      {children}
    </motion.div>
  );
}
