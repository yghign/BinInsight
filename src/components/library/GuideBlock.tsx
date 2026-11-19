'use client';

/** 形态 B 第 3 层：指导模式（静态文字、默认展开可折叠，Q4；架构 07 §3.2）。 */
import { useState } from 'react';
import type { Guide } from '@/data/library/types';

export default function GuideBlock({ guide, defaultOn = true }: { guide: Guide; defaultOn?: boolean }) {
  const [open, setOpen] = useState(defaultOn);
  return (
    <div className="u-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="u-eyebrow !mb-0">指导模式 · 为什么盯这里、下一步看什么</span>
        <span className="text-[12px] text-[var(--brand-500)]">{open ? '收起 −' : '展开 +'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-[13px] font-medium text-[var(--text)] mb-1.5">为什么盯这里</p>
            <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed">{guide.why}</p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text)] mb-1.5">下一步看什么、怎么判断</p>
            <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">{guide.how}</p>
          </div>
        </div>
      )}
    </div>
  );
}
