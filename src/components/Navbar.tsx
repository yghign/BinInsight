'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { TermsButton } from './TermsDrawer';

const navItems = [
  { href: '/learn', label: '教学', section: '/learn' },
  { href: '/reference', label: '知识库', section: '/reference' },
  { href: '/tools', label: '工具', section: '/tools' },
  { href: '/cases', label: '案例', section: '/cases' },
];

const FONT_STEPS = [
  { label: '标准', value: 1 },
  { label: '稍大', value: 1.1 },
  { label: '放大', value: 1.2 },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [fontScale, setFontScale] = useState<number>(1);

  // 初始化 + 监听 storage 变化（多 tab 同步）
  useEffect(() => {
    try {
      const v = localStorage.getItem('bininsight-font-scale');
      const num = v ? parseFloat(v) : 1;
      if (!isNaN(num)) {
        setFontScale(num);
        document.body.style.zoom = String(num);
      }
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bininsight-font-scale' && e.newValue) {
        const n = parseFloat(e.newValue);
        if (!isNaN(n)) {
          setFontScale(n);
          document.body.style.zoom = String(n);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const applyFont = (val: number) => {
    setFontScale(val);
    try { localStorage.setItem('bininsight-font-scale', String(val)); } catch {}
    document.body.style.zoom = String(val);
    setFontOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-6 h-6 border border-[var(--brand-500)] text-[var(--brand-500)] flex items-center justify-center font-mono text-[11px] font-bold leading-none">
              B
            </span>
            <span className="font-semibold text-[15px] tracking-tight text-[var(--text)]">
              BinInsight
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-7">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.section);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative py-2 text-[13.5px] font-medium transition-colors ${
                      isActive
                        ? 'text-[var(--text-bright)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute left-0 right-0 -bottom-[19px] h-[2px] bg-[var(--brand-500)]" />
                    )}
                  </Link>
                );
              })}
              <TermsButton className="py-2 text-[13.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]">
                条款
              </TermsButton>
            </div>

            <span className="hidden md:block w-px h-5 bg-[var(--border)] mx-3" />

            {/* 字体调节 Aa 按钮 */}
            <div className="relative">
              <button
                onClick={() => setFontOpen((o) => !o)}
                aria-label="字体大小"
                aria-expanded={fontOpen}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-soft)] transition-colors"
                title="字体大小"
              >
                <span className="font-serif text-[10px] leading-none">A</span>
                <span className="font-serif text-[14px] leading-none -ml-0.5">a</span>
              </button>
              {fontOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setFontOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-36 rounded-md border border-[var(--border)] bg-[var(--bg-card)] shadow-lg z-20 overflow-hidden">
                    {FONT_STEPS.map((step) => (
                      <button
                        key={step.value}
                        onClick={() => applyFont(step.value)}
                        className={`w-full text-left px-3 py-2 text-[13px] flex items-center justify-between transition-colors ${
                          fontScale === step.value
                            ? 'text-[var(--brand-500)] bg-[color-mix(in_srgb,var(--brand-500)_10%,transparent)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-soft)]'
                        }`}
                      >
                        <span>{step.label}</span>
                        <span className="font-mono text-[11px] opacity-60">×{step.value.toFixed(1)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <ThemeToggle />

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--text)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="菜单"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-2 border-t border-[var(--border)]">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.section);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-1 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'text-[var(--brand-500)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <TermsButton
              className="block w-full px-1 py-2.5 text-left text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              使用条款
            </TermsButton>
          </div>
        )}
      </div>
    </nav>
  );
}
