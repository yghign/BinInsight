'use client';

/** 列表 / 地图视图切换（架构 07 §3.1）。 */
export default function ViewToggle({
  view,
  onChange,
}: {
  view: 'list' | 'map';
  onChange: (v: 'list' | 'map') => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-[var(--border)] overflow-hidden" role="group" aria-label="视图切换">
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        className={`px-3.5 py-2 text-[12.5px] ${view === 'list' ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--text-muted)]'}`}
      >
        列表
      </button>
      <button
        type="button"
        onClick={() => onChange('map')}
        aria-pressed={view === 'map'}
        className={`px-3.5 py-2 text-[12.5px] ${view === 'map' ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--text-muted)]'}`}
      >
        学习地图
      </button>
    </div>
  );
}
