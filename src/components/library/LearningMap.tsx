'use client';

/** 学习地图（架构 07 §3.1 / PRD §4.4）：16 格 + 右下角「🧰 通用方法」。 */
import Link from 'next/link';
import type { LibraryListItem } from '@/data/library/types';
import { CHAPTER_NAMES } from '@/data/library';

export default function LearningMap({ items }: { items: LibraryListItem[] }) {
  const byChapter = new Map<number, LibraryListItem[]>();
  for (const item of items) {
    const arr = byChapter.get(item.chapter) ?? [];
    arr.push(item);
    byChapter.set(item.chapter, arr);
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 16 }, (_, i) => i + 1).map((ch) => {
          const entries = byChapter.get(ch) ?? [];
          return (
            <div key={ch} className="u-panel p-4 min-h-[110px]">
              <p className="text-[13.5px] font-medium text-[var(--text)] mb-3">{CHAPTER_NAMES[ch]}</p>
              {entries.length === 0 ? (
                <p className="text-[11px] text-[var(--text-soft)]">内容整理中</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {entries.map((e) => (
                    <Link key={e.id} href={`/library/${e.id}`} className="text-[12px] text-[var(--brand-500)] u-link">
                      {e.title} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <Link href="/library/m01-three-laws" className="u-panel u-panel-hover p-4 block">
          <p className="u-eyebrow !mb-2">通用方法</p>
          <p className="text-[13.5px] font-medium text-[var(--brand-500)]">🧰 M01 · 三条铁律 →</p>
        </Link>
      </div>
    </div>
  );
}
