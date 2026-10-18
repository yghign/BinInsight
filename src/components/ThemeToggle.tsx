'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Check } from 'lucide-react';

const accents = [
  { id: 'blue', name: '信号蓝', color: '#2f6bff' },
  { id: 'green', name: '终端绿', color: '#00c853' },
  { id: 'purple', name: '霓虹紫', color: '#9d5cff' },
  { id: 'orange', name: '热熔橙', color: '#ff5a1f' },
  { id: 'cyan', name: '深空青', color: '#00b8d9' },
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
        className="flex items-center justify-center w-8 h-8 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        aria-label="切换主题"
      >
        {mode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg z-50 overflow-hidden">
            {/* 模式切换 */}
            <div className="u-eyebrow px-3.5 pt-3 pb-2">显示模式</div>
            <div className="flex gap-1 px-2 pb-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const isActive = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--brand-500)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon size={13} />
                    {m.name}
                  </button>
                );
              })}
            </div>

            {/* 强调色 */}
            <div className="u-eyebrow px-3.5 pt-2 pb-2 border-t border-[var(--border)]">强调色</div>
            <div className="px-2 pb-2">
              {accents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleAccentChange(a.id)}
                  className="w-full flex items-center gap-2.5 px-1.5 py-2 hover:bg-[var(--bg-hover)] rounded-md transition-colors text-left"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="flex-1 text-[13px] text-[var(--text-muted)]">{a.name}</span>
                  {accent === a.id && <Check size={13} className="text-[var(--brand-500)]" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
