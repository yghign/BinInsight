'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { GlossEntry } from '@/data/glossary';
import { getGlossEntry } from '@/data/glossary';
import { useGlossary } from './GlossaryProvider';

/** 「属于第几级」的中文显示。 */
function levelLabel(level: GlossEntry['level']): string {
  if (level === 'l8') return '可选阅读';
  return `第 ${Number(level.slice(1)) + 1} 级 · 共 8 级`;
}

/**
 * 术语浮层：白话解释 + 属于第几级 + 去核心概念页。
 * 命名与「使用条款」抽屉（.u-terms-* / .u-drawer-*）完全隔离，
 * 使用 .u-gloss-* 前缀，aria-label="术语解释"。
 */
export default function TermPopover({
  entry,
  onClose,
}: {
  entry: GlossEntry;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { openTerm } = useGlossary();
  // 仅高频词有 related；老词为空，条件渲染保证既有 DOM / 文案零变化。
  const related = (entry.related ?? []).filter((id) => Boolean(getGlossEntry(id)));

  useEffect(() => {
    cardRef.current?.focus();
  }, [entry.id]);

  return (
    <div className="u-gloss-layer" role="presentation">
      <button
        type="button"
        className="u-gloss-backdrop"
        aria-label="关闭术语解释"
        onClick={onClose}
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        className="u-gloss-card"
        role="dialog"
        aria-modal="true"
        aria-label="术语解释"
      >
        <div className="u-gloss-head">
          <span className="u-eyebrow">术语解释</span>
          <button type="button" className="u-gloss-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <h3 className="u-gloss-term">{entry.term}</h3>
        <p className="u-gloss-plain">{entry.plain}</p>

        <div className="u-gloss-meta">
          <span className="u-gloss-level">属于：{levelLabel(entry.level)}</span>
          {entry.level === 'l8' && (
            <span className="u-gloss-notice">不进入主线演示</span>
          )}
        </div>

        {entry.detail && <p className="u-gloss-detail">{entry.detail}</p>}

        {related.length > 0 && (
          <div className="u-gloss-related">
            <span className="u-gloss-related-label">相关术语（点开可看）</span>
            <div className="u-gloss-related-links">
              {related.map((id) => (
                <button key={id} type="button" className="u-gloss-related-link" onClick={() => openTerm(id)}>
                  {getGlossEntry(id)?.term ?? id} ↗
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="u-gloss-foot">
          <Link href={entry.anchor} className="u-gloss-link" onClick={onClose}>
            去核心概念看这一条 →
          </Link>
          <button type="button" className="u-btn u-btn-ghost !py-1.5 !px-3 !text-[12px]" onClick={onClose}>
            我明白了
          </button>
        </div>
      </div>
    </div>
  );
}
