'use client';

/** 四维筛选面板（架构 07 §3.1）：难度 / 主题 / 场景 / 类型，可多选可清空。
 */
import type { LibraryListItem, LibraryDifficulty, LibraryScene } from '@/data/library/types';
import { CHAPTER_NAMES } from '@/data/library';
import type { LibraryFilters } from './LibraryBrowser';

type ToggleFn = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K][number]) => void;

const DIFFS: { value: LibraryDifficulty; label: string }[] = [
  { value: 'beginner', label: '低难度' },
  { value: 'intermediate', label: '中难度' },
  { value: 'advanced', label: '高难度' },
];
const CHAPTERS = [0, 1];
const SCENES: LibraryScene[] = ['Web', 'API', '系统', '网络', '云', '移动', 'AI', '通用'];
const KINDS: { value: 'vuln' | 'method'; label: string }[] = [
  { value: 'vuln', label: '漏洞卡' },
  { value: 'method', label: '方法论卡' },
];

function ChipGroup<T extends string | number>({
  options,
  selected,
  onToggle,
  filterKey,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: ToggleFn;
  filterKey: keyof LibraryFilters;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = selected.includes(opt.value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onToggle(filterKey, opt.value as never)}
            aria-pressed={on}
            className={`u-tag cursor-pointer transition-colors ${
              on ? '!text-brand-400 !border-[var(--brand-500)]' : ''
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterPanel({
  filters,
  items,
  onToggle,
  onClear,
  hasFilter,
}: {
  filters: LibraryFilters;
  items: LibraryListItem[];
  onToggle: ToggleFn;
  onClear: () => void;
  hasFilter: boolean;
}) {
  const chapterOptions = CHAPTERS.filter((c) => items.some((i) => i.chapter === c)).map((c) => ({ value: c, label: CHAPTER_NAMES[c] ?? `主题 ${c}` }));
  const sceneOptions = SCENES.filter((s) => items.some((i) => (i.scene ?? []).includes(s))).map((s) => ({ value: s, label: s }));

  return (
    <aside className="lg:sticky lg:top-20 self-start">
      <div className="u-panel p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="u-eyebrow !mb-0">筛选</h2>
          {hasFilter && (
            <button type="button" onClick={onClear} className="text-[12px] text-[var(--brand-500)] u-link">
              清空
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[12px] text-[var(--text-soft)] mb-2">难度</p>
            <ChipGroup options={DIFFS} selected={filters.difficulty} onToggle={onToggle} filterKey="difficulty" />
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-soft)] mb-2">主题</p>
            <ChipGroup options={chapterOptions} selected={filters.chapter} onToggle={onToggle} filterKey="chapter" />
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-soft)] mb-2">场景</p>
            <ChipGroup options={sceneOptions} selected={filters.scene} onToggle={onToggle} filterKey="scene" />
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-soft)] mb-2">类型</p>
            <ChipGroup options={KINDS} selected={filters.kind} onToggle={onToggle} filterKey="kind" />
          </div>
        </div>
      </div>
    </aside>
  );
}
