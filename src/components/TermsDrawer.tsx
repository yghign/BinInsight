'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { TERMS_NOTICE, TERMS_SECTIONS, TERMS_UPDATED } from '@/data/terms';

type TermsContextValue = { open: () => void; close: () => void };

const TermsContext = createContext<TermsContextValue | null>(null);

export function useTerms() {
  const ctx = useContext(TermsContext);
  if (!ctx) throw new Error('useTerms 必须在 TermsProvider 内部使用');
  return ctx;
}

export function TermsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [isOpen, close]);

  return (
    <TermsContext.Provider value={{ open, close }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="使用条款">
          <button
            type="button"
            aria-label="关闭使用条款"
            onClick={close}
            className="u-drawer-backdrop absolute inset-0 cursor-default"
          />

          <div
            ref={panelRef}
            tabIndex={-1}
            className="u-drawer-panel absolute inset-y-0 right-0 flex w-full flex-col border-l border-[var(--border)] bg-[var(--bg)] outline-none sm:max-w-[620px]"
          >
            {/* 抽屉头 */}
            <header className="flex items-start justify-between gap-6 border-b border-[var(--border)] px-6 py-5 sm:px-10">
              <div>
                <p className="u-eyebrow mb-1.5">Terms of Use</p>
                <h2 className="text-lg font-semibold tracking-tight">使用条款</h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-soft)] transition-colors hover:text-[var(--text)]"
              >
                关闭
              </button>
            </header>

            {/* 抽屉正文 */}
            <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
              <p className="border-l-2 border-l-[var(--accent-orange)] pl-4 text-[13px] leading-[1.85] text-[var(--text-muted)]">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent-orange)]">
                  重要提示
                </span>
                {TERMS_NOTICE}
              </p>

              <div className="mt-10">
                {TERMS_SECTIONS.map((section) => (
                  <section
                    key={section.en}
                    className="border-t border-[var(--border)] py-8 first:border-t-0 first:pt-0"
                  >
                    <p className="u-eyebrow mb-2">{section.en}</p>
                    <h3 className="mb-4 text-[17px] font-semibold tracking-tight">
                      {section.title}
                    </h3>
                    <div className="space-y-3">
                      {section.content.map((para, i) => (
                        <p
                          key={i}
                          className="text-[13.5px] leading-[1.9] text-[var(--text-muted)]"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* 抽屉尾 */}
            <footer className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-6 py-4 sm:px-10">
              <span className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
                最后更新 · {TERMS_UPDATED}
              </span>
              <button type="button" onClick={close} className="u-btn u-btn-ghost">
                我已知悉
              </button>
            </footer>
          </div>
        </div>
      )}
    </TermsContext.Provider>
  );
}

/** 任何位置触发条款抽屉的文字按钮 */
export function TermsButton({
  className,
  children = '使用条款',
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { open } = useTerms();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
