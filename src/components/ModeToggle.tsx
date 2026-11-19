'use client';

import clsx from 'clsx';

/**
 * 难度模式显示（T06 / PRD Q2）。
 *
 * 主线固定锁定「新手」：进阶开关整体隐藏，避免老师演示时误切到进阶块。
 * 旧 step1~step4 页面的进阶块代码全部保留（不删），归 L8 拓展区并加「课外拓展」横幅；
 * 由于 mode 恒为 beginner，这些进阶块不会在主线演示中出现。
 *
 * 保留原有 props 签名以兼容旧页面调用；onChange 不再会被触发。
 */
export interface ModeToggleProps {
  mode?: 'beginner' | 'advanced';
  onChange?: (mode: 'beginner' | 'advanced') => void;
  className?: string;
}

export type Mode = 'beginner' | 'advanced';

export default function ModeToggle({ className }: ModeToggleProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center border border-[var(--border)] rounded-md bg-[var(--bg-soft)] px-3.5 py-1.5',
        className
      )}
      role="note"
      aria-label="难度模式：新手"
    >
      <span className="font-mono text-[12px] tracking-wide text-[var(--brand-500)]">
        新手
      </span>
      <span className="u-lesson-note ml-2">进阶内容可选阅读</span>
    </div>
  );
}
