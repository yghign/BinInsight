'use client';

/** 学习库首页唯一 'use client' 状态容器（架构 07 §3.1）。
 * 四维筛选 / 搜索 / 视图切换 / 排序全部在此，子组件受控。
 * 首屏只接收 LIBRARY_LIST 轻量元数据，不 import ch0/ch1 正文。
 */
import { useMemo, useState } from 'react';
import type { LibraryListItem, LibraryDifficulty, LibraryScene } from '@/data/library/types';
import { searchLibrary, searchSuggestions, difficultyLabelOf } from '@/lib/library-search';
import SearchBox from './SearchBox';
import FilterPanel from './FilterPanel';
import ViewToggle from './ViewToggle';
import EntryList from './EntryList';
import LearningMap from './LearningMap';

export interface LibraryFilters {
  difficulty: LibraryDifficulty[];
  chapter: number[];
  scene: LibraryScene[];
  kind: ('vuln' | 'method')[];
}

const EMPTY_FILTERS: LibraryFilters = { difficulty: [], chapter: [], scene: [], kind: [] };

type SortMode = 'difficulty' | 'chapter' | 'name';
const DIFF_ORDER: Record<LibraryDifficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export default function LibraryBrowser({ items }: { items: LibraryListItem[] }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [sort, setSort] = useState<SortMode>('difficulty');

  const suggestions = useMemo(() => searchSuggestions(query, items), [query, items]);
  const hasFilter = filters.difficulty.length + filters.chapter.length + filters.scene.length + filters.kind.length > 0;

  const filtered = useMemo(() => {
    let list = items;

    // 搜索命中（命中项按 id 保序，避免搜索结果与筛选结果顺序错乱）
    if (query.trim()) {
      const ids = new Set(searchLibrary(query, items).map((hit) => hit.item.id));
      list = list.filter((item) => ids.has(item.id));
    }

    // 四维筛选（多选：命中任一即保留；空数组=不过滤）
    if (filters.difficulty.length) list = list.filter((item) => item.difficulty && filters.difficulty.includes(item.difficulty));
    if (filters.chapter.length) list = list.filter((item) => filters.chapter.includes(item.chapter));
    if (filters.scene.length) list = list.filter((item) => (item.scene ?? []).some((s) => filters.scene.includes(s)));
    if (filters.kind.length) list = list.filter((item) => filters.kind.includes(item.kind));

    // 排序：默认难度低→中→高（同档按主题序）；★不参与排序
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title, 'zh-CN');
      if (sort === 'chapter') return a.chapter - b.chapter;
      const da = a.difficulty ? DIFF_ORDER[a.difficulty] : -1;
      const db = b.difficulty ? DIFF_ORDER[b.difficulty] : -1;
      if (da !== db) return da - db;
      return a.chapter - b.chapter;
    });
    return sorted;
  }, [items, query, filters, sort]);

  const toggleFilter = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K][number]) => {
    setFilters((prev) => {
      const arr = prev[key] as (typeof value)[];
      const exists = arr.includes(value as never);
      const next = exists ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next } as LibraryFilters;
    });
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <FilterPanel
        filters={filters}
        items={items}
        onToggle={toggleFilter}
        onClear={clearFilters}
        hasFilter={hasFilter}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-[220px]">
            <SearchBox
              query={query}
              suggestions={suggestions}
              onQueryChange={setQuery}
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <p className="text-[12.5px] text-[var(--text-soft)]">
            {query.trim() || hasFilter ? `找到 ${filtered.length} 条` : `共 ${items.length} 条`}
          </p>
          <label className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
            排序
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="u-tag bg-transparent cursor-pointer"
              aria-label="排序方式"
            >
              <option value="difficulty">难度 低→高</option>
              <option value="chapter">按主题</option>
              <option value="name">按名称</option>
            </select>
          </label>
        </div>

        {view === 'map' ? (
          <LearningMap items={items} />
        ) : (
          <EntryList items={filtered} difficultyLabelOf={difficultyLabelOf} />
        )}
      </div>
    </div>
  );
}
