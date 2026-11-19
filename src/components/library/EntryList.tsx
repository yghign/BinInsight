'use client';

/** 学习库列表（架构 07 §3.1）：受控渲染 EntryCard。 */
import type { LibraryListItem } from '@/data/library/types';
import type { LibraryDifficulty } from '@/data/library/types';
import EntryCard from './EntryCard';

export default function EntryList({
  items,
  difficultyLabelOf,
}: {
  items: LibraryListItem[];
  difficultyLabelOf: (d: LibraryDifficulty | undefined) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="u-panel p-10 text-center">
        <p className="text-[14px] text-[var(--text-muted)]">没有符合条件的条目。清空筛选或换个搜索词试试。</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <EntryCard key={item.id} item={item} difficultyLabelOf={difficultyLabelOf} />
      ))}
    </div>
  );
}
