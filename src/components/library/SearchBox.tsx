'use client';

/** 搜索框（架构 07 §3.1）：受控 query + 建议下拉 + 键盘上下/回车直达。
 * 高亮用 highlightParts 切段后 React 渲染 <mark>，无 dangerouslySetInnerHTML。
 */
import { useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import type { LibraryListItem } from '@/data/library/types';
import { highlightParts } from '@/lib/library-search';

export default function SearchBox({
  query,
  suggestions,
  onQueryChange,
}: {
  query: string;
  suggestions: LibraryListItem[];
  onQueryChange: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = suggestions[active >= 0 ? active : 0];
      if (target) {
        window.location.href = `/BinInsight/library/${target.id}`;
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder="搜名称 / 别名 / 信号 / 拼音（如 sqlzr）"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2.5 text-[14px] text-[var(--text)] outline-none focus:border-[var(--brand-500)]"
        aria-label="搜索学习库"
      />
      {open && query.trim() && (
        <div className="absolute z-30 left-0 right-0 top-[calc(100%+6px)] rounded-md border border-[var(--border)] bg-[var(--bg-card)] shadow-lg overflow-hidden">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-[var(--text-soft)]">没有匹配项，换个词试试</p>
          ) : (
            suggestions.map((item, idx) => (
              <Link
                key={item.id}
                href={`/library/${item.id}`}
                className={`block px-4 py-2.5 text-[13px] no-underline ${
                  active === idx ? 'bg-[var(--bg-soft)]' : ''
                }`}
                onMouseEnter={() => setActive(idx)}
              >
                <span className="font-medium text-[var(--text)]">
                  {highlightParts(item.title, query).map((part, i) =>
                    part.hit ? <mark key={i} className="bg-[var(--brand-500)]/20 text-[var(--brand-500)]">{part.text}</mark> : <span key={i}>{part.text}</span>
                  )}
                </span>
                <span className="ml-2 text-[var(--text-soft)]">· {item.oneLiner.slice(0, 26)}…</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
