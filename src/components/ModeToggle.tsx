'use client';

import { useState, useEffect } from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';
import clsx from 'clsx';

export type Mode = 'beginner' | 'advanced';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  className?: string;
}

export default function ModeToggle({ mode, onChange, className }: ModeToggleProps) {
  return (
    <div className={clsx('inline-flex items-center bg-bg-card border border-border rounded-full p-1', className)}>
      <button
        onClick={() => onChange('beginner')}
        className={clsx(
          'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
          mode === 'beginner'
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        )}
      >
        <GraduationCap size={15} />
        新手模式
      </button>
      <button
        onClick={() => onChange('advanced')}
        className={clsx(
          'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
          mode === 'advanced'
            ? 'bg-accent-purple text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        )}
      >
        <Sparkles size={15} />
        进阶模式
      </button>
    </div>
  );
}
