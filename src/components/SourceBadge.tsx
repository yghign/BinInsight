'use client';

import clsx from 'clsx';
import { labelOf, noteOf, toneOf, type SourceState } from '@/data/source-state';

/**
 * 三态标签唯一渲染出口（架构 D.5.1）。
 *
 * 所有终端、diff、报告、统计数字、预览、规划条目都必须挂它。
 * 固定文案来自 source-state.ts：真实输出 / 演示样例 / 规划中。
 * 与使用条款抽屉（TermsDrawer）无任何关联。
 */
export interface SourceBadgeProps {
  state: SourceState;
  /** 覆盖默认补充说明 */
  note?: string;
  /** 是否在标签右侧同时展示补充说明文字 */
  showNote?: boolean;
  className?: string;
}

export default function SourceBadge({
  state,
  note,
  showNote = false,
  className,
}: SourceBadgeProps) {
  const label = labelOf(state);
  const tip = note ?? noteOf(state);

  return (
    <span className={clsx('u-source-inline', className)}>
      <span
        className={clsx('u-source-badge', toneOf(state))}
        title={tip}
        aria-label={`数据来源状态：${label}`}
      >
        <span className="u-source-dot" aria-hidden="true" />
        {label}
      </span>
      {showNote && <span className="u-source-note">{tip}</span>}
    </span>
  );
}
