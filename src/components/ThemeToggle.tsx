'use client';

import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

const themes = [
  { id: 'blue', name: '经典蓝', color: '#3b82f6', isLight: false },
  { id: 'green', name: '黑客绿', color: '#10b981', isLight: false },
  { id: 'purple', name: '赛博紫', color: '#a855f7', isLight: false },
  { id: 'orange', name: '烈焰橙', color: '#f97316', isLight: false },
  { id: 'cyan', name: '深邃青', color: '#06b6d4', isLight: false },
  { id: 'light', name: '亮白模式', color: '#ffffff', isLight: true },
];

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('blue');

  useEffect(() => {
    const saved = localStorage.getItem('bininsight-theme');
    if (saved && saved !== 'blue') {
      document.documentElement.setAttribute('data-theme', saved);
      setCurrentTheme(saved);
    }
  }, []);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    if (themeId === 'blue') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('bininsight-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
      localStorage.setItem('bininsight-theme', themeId);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:bg-bg-hover transition-colors text-sm"
        aria-label="切换主题"
      >
        <Palette size={16} />
        <span className="hidden sm:inline">主题</span>
      </button>

      {open && (
        <>
          {/* 点击外部关闭 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 w-44 bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 text-xs text-[var(--text-soft)] border-b border-border">
              选择主题
            </div>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition-colors text-left"
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-[var(--border-soft)]"
                  style={{
                    backgroundColor: theme.color,
                    boxShadow: theme.isLight ? 'inset 0 0 0 1px #cbd5e1' : 'none'
                  }}
                />
                <span className="flex-1 text-sm text-[var(--text-muted)]">{theme.name}</span>
                {currentTheme === theme.id && (
                  <Check size={14} className="text-brand-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
