'use client';

import clsx from 'clsx';

export type Mode = 'beginner' | 'advanced';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  className?: string;
}

const options: { id: Mode; label: string }[] = [
  { id: 'beginner', label: '新手' },
  { id: 'advanced', label: '进阶' },
];

export default function ModeToggle({ mode, onChange, className }: ModeToggleProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center border border-[var(--border)] rounded-md p-0.5 bg-[var(--bg-soft)]',
        className
      )}
      role="tablist"
      aria-label="难度模式"
    >
      {options.map((opt) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={clsx(
              'px-3.5 py-1.5 rounded-[4px] font-mono text-[12px] tracking-wide transition-colors',
              active
                ? 'bg-[var(--bg-card)] text-[var(--brand-500)] border border-[var(--border)]'
                : 'border border-transparent text-[var(--text-soft)] hover:text-[var(--text-muted)]'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
