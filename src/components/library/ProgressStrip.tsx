'use client';

/** 学习库个人进度条（架构 07 §3.3）：只显示「已探索」计数，可隐藏。
 * 独立 key，与主线的 useProgress 完全隔离；explored 不控制任何可达性。
 */
import { useLibraryProgress } from '@/lib/useLibraryProgress';

export default function ProgressStrip() {
  const { explored, hidden, toggleHidden, countByDifficulty, methodCount, denominators } = useLibraryProgress();

  if (hidden) {
    return (
      <div className="u-panel px-5 py-3 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-[var(--text-soft)]">个人进度已隐藏。</p>
        <button type="button" onClick={toggleHidden} className="text-[12px] text-[var(--brand-500)] u-link">
          显示进度
        </button>
      </div>
    );
  }

  const total = explored.length;

  return (
    <div className="u-panel px-5 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="u-eyebrow !mb-2">仅你自己可见 · 本机</p>
          <p className="text-[14px] text-[var(--text)]">
            你已探索：<strong className="text-[var(--brand-500)]">{total}</strong> 条内容
            <span className="text-[var(--text-soft)]"> ｜ 方法论卡 {methodCount} / {denominators.method}</span>
          </p>
          <p className="text-[12px] text-[var(--text-soft)] mt-1.5">
            低 {countByDifficulty.low}/{denominators.low} · 中 {countByDifficulty.mid}/{denominators.mid} · 高 {countByDifficulty.high}/{denominators.high}
            （分母为规划总数）
          </p>
        </div>
        <button type="button" onClick={toggleHidden} className="text-[12px] text-[var(--text-muted)] u-link flex-shrink-0">
          隐藏进度
        </button>
      </div>
    </div>
  );
}
