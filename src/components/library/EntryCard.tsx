'use client';

/** 学习库卡片（架构 07 §3.1）：难度主标签 + ★小标记 + 概述 + 信号 + 场景 + 术语 + 已读角标。
 * ★不参与排序；角标只读 useLibraryProgress 的 explored，不控制可达。
 */
import Link from 'next/link';
import type { LibraryListItem, LibraryDifficulty } from '@/data/library/types';
import { CHAPTER_NAMES } from '@/data/library';
import { useLibraryProgress } from '@/lib/useLibraryProgress';

const DIFF_TONE: Record<LibraryDifficulty, string> = {
  beginner: 'text-accent-green border-accent-green/40',
  intermediate: 'text-accent-orange border-accent-orange/40',
  advanced: 'text-accent-red border-accent-red/40',
};

export default function EntryCard({
  item,
  difficultyLabelOf,
}: {
  item: LibraryListItem;
  difficultyLabelOf: (d: LibraryDifficulty | undefined) => string;
}) {
  const { explored } = useLibraryProgress();
  const seen = explored.includes(item.id);
  const tone = item.difficulty ? DIFF_TONE[item.difficulty] : 'text-accent-cyan border-accent-cyan/40';

  return (
    <Link
      href={`/library/${item.id}`}
      className="group u-panel u-panel-hover block p-5 relative"
    >
      {seen && (
        <span className="absolute top-4 right-4 text-[11px] text-accent-green" aria-label="已探索">
          ✓ 已探索
        </span>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`u-tag ${tone}`}>{difficultyLabelOf(item.difficulty)}</span>
        <span className="u-tag">{CHAPTER_NAMES[item.chapter] ?? `主题 ${item.chapter}`}</span>
        {item.kind === 'method' && <span className="u-tag !text-brand-400">方法论</span>}
        {item.format === 'interactive' && <span className="u-tag !text-accent-purple">案例 + 指导</span>}
        {item.hazard !== undefined ? (
          <span className="u-tag" title="危险度★只做提醒，不参与筛选与排序">
            {'★'.repeat(item.hazard)}{'☆'.repeat(5 - item.hazard)}
          </span>
        ) : item.kind === 'vuln' ? (
          <span className="u-tag">方法清单</span>
        ) : null}
      </div>
      <h3 className="text-[16px] font-semibold tracking-tight mb-2 group-hover:text-[var(--brand-500)] transition-colors">
        {item.title}
      </h3>
      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">{item.oneLiner}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {(item.signals ?? []).slice(0, 3).map((s) => (
          <span key={s} className="u-tag !text-[11px]">{s}</span>
        ))}
        {(item.scene ?? []).slice(0, 3).map((s) => (
          <span key={s} className="u-tag !text-[11px] !text-accent-cyan">{s}</span>
        ))}
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--brand-500)]">
        打开看看 <span className="font-mono" aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
