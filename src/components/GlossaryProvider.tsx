'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getGlossEntry, type GlossEntry } from '@/data/glossary';
import TermPopover from './TermPopover';

/**
 * 术语解释 Context（命名隔离：Glossary* / Term* = 术语解释）。
 *
 * 与 TermsProvider / useTerms / TermsButton / TERMS_*（使用条款，保持不动）
 * 五层隔离，互不引用、互不嵌套；两者并列挂在 layout.tsx。
 * 数据来源唯一：src/data/glossary.ts。
 */

interface GlossaryContextValue {
  /** 按 id 打开术语浮层；未收录时展示「暂未收录」提示卡，绝不弹法律条款 */
  openTerm: (id: string) => void;
  closeTerm: () => void;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function useGlossary(): GlossaryContextValue {
  const ctx = useContext(GlossaryContext);
  if (!ctx) throw new Error('useGlossary 必须在 GlossaryProvider 内部使用');
  return ctx;
}

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<GlossEntry | null>(null);
  const [missingId, setMissingId] = useState<string | null>(null);

  const openTerm = useCallback((id: string) => {
    const entry = getGlossEntry(id);
    if (entry) {
      setActive(entry);
      setMissingId(null);
    } else {
      setActive(null);
      setMissingId(id);
    }
  }, []);

  const closeTerm = useCallback(() => {
    setActive(null);
    setMissingId(null);
  }, []);

  // Esc 统一关闭浮层 / 提示卡
  useEffect(() => {
    if (!active && !missingId) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeTerm();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, missingId, closeTerm]);

  return (
    <GlossaryContext.Provider value={{ openTerm, closeTerm }}>
      {children}

      {active && <TermPopover entry={active} onClose={closeTerm} />}

      {missingId && (
        <div className="u-gloss-layer" role="presentation">
          <button
            type="button"
            className="u-gloss-backdrop"
            aria-label="关闭术语解释"
            onClick={closeTerm}
          />
          <div className="u-gloss-card" role="dialog" aria-modal="true" aria-label="术语解释">
            <div className="u-gloss-head">
              <span className="u-eyebrow">术语解释</span>
              <button type="button" className="u-gloss-close" onClick={closeTerm}>
                关闭
              </button>
            </div>
            <p className="u-gloss-plain">
              术语「{missingId}」暂未收录进核心概念页。你可以先按上下文白话理解，或到核心概念页查看已收录词条。
            </p>
            <a className="u-gloss-link" href="/reference/glossary" onClick={closeTerm}>
              去核心概念 →
            </a>
          </div>
        </div>
      )}
    </GlossaryContext.Provider>
  );
}
