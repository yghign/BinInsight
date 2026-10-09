'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Palette, Check } from 'lucide-react';

const accents = [
  { id: 'blue', name: '经典蓝', color: '#3b82f6' },
  { id: 'green', name: '黑客绿', color: '#10b981' },
  { id: 'purple', name: '赛博紫', color: '#a855f7' },
  { id: 'orange', name: '烈焰橙', color: '#f97316' },
  { id: 'cyan', name: '深邃青', color: '#06b6d4' },
];

const modes = [
  { id: 'dark', name: '深色', icon: Moon },
  { id: 'light', name: '浅色', icon: Sun },
] as const;

type ModeId = (typeof modes)[number]['id'];

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModeId>('dark');
  const [accent, setAccent] = useState('blue');

  useEffect(() => {
    const savedMode = localStorage.getItem('bininsight-mode') as ModeId | null;
    const savedAccent = localStorage.getItem('bininsight-accent');

    const applyMode = (m: ModeId) => {
      document.documentElement.setAttribute('data-mode', m);
      setMode(m);
    };
    const applyAccent = (a: string) => {
      document.documentElement.setAttribute('data-accent', a);
      setAccent(a);
    };

    applyMode(savedMode ?? 'dark');
    applyAccent(savedAccent ?? 'blue');
  }, []);

  const handleModeChange = (newMode: ModeId) => {
    setMode(newMode);
    document.documentElement.setAttribute('data-mode', newMode);
    localStorage.setItem('bininsight-mode', newMode);
  };

  const handleAccentChange = (id: string) => {
    setAccent(id);
    document.documentElement.setAttribute('data-accent', id);
    localStorage.setItem('bininsight-accent', id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:bg-bg-hover transition-colors text-sm"
        aria-label="切换主题"
      >
        {mode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        <span className="hidden sm:inline">主题</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-52 bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* 模式切换 */}
            <div className="px-3 py-2 text-xs text-[var(--text-soft)] border-b border-border">
              显示模式
            </div>
            <div className="flex gap-1 p-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const isActive = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                        : 'text-[var(--text-muted)] hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    {m.name}
                  </button>
                );
              })}
            </div>

            {/* 强调色 */}
            <div className="px-3 py-2 text-xs text-[var(--text-soft)] border-t border-border">
              强调色
            </div>
            {accents.map((a) => (
              <button
                key={a.id}
                onClick={() => handleAccentChange(a.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition-colors text-left"
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-[var(--border-soft)]"
                  style={{ backgroundColor: a.color }}
                />
                <span className="flex-1 text-sm text-[var(--text-muted)]">{a.name}</span>
                {accent === a.id && <Check size={14} className="text-brand-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
