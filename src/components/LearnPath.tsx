'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LESSON_LEVELS } from '@/data/lesson';
import { nodeStatus } from '@/lib/lesson';
import { useLessonProgress } from './useProgress';

/**
 * 8 级纵向路径线 —— 细线连接 + 透明度/线宽区分状态。
 * LEARN_STEPS 已抽到 data/lesson.ts 成为唯一数据源（原 4 步静态数组已移除）。
 * 状态机复用 lib/lesson.ts 的 nodeStatus()（前置链三态：done / active / locked）。
 */
export default function LearnPath({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() ?? '';
  const { progress } = useLessonProgress();
  const currentId =
    LESSON_LEVELS.find((item) => pathname.startsWith(item.route))?.id ?? 'l0';

  return (
    <nav aria-label="8 级学习路径">
      <ol className="space-y-0">
        {LESSON_LEVELS.map((step, idx) => {
          const status = nodeStatus(step.id, currentId, progress);
          const isCurrent = step.id === currentId;
          return (
            <li key={step.id} className="relative">
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] top-0 -translate-x-1/2 w-px h-[calc(100%+0.25rem)]',
                    status === 'locked' ? 'bg-[var(--border)] opacity-30' : 'bg-[var(--border-soft)] opacity-70'
                  )}
                />
              )}
              <Link
                href={step.route}
                aria-current={isCurrent ? 'page' : undefined}
                className={clsx(
                  'flex items-start gap-3 rounded-md transition-colors -mx-2 px-2',
                  status !== 'locked' && 'hover:bg-[var(--bg-soft)]',
                  status === 'locked' && 'opacity-60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    'relative z-[1] flex-shrink-0 w-3 h-3 mt-3 rounded-full border',
                    status === 'done' && 'border-[var(--brand-500)] bg-[var(--brand-500)]',
                    status === 'active' && 'border-[var(--brand-500)] bg-transparent',
                    status === 'locked' && 'border-[var(--border-soft)] bg-transparent'
                  )}
                />
                <span className="min-w-0 py-2.5">
                  <span
                    className={clsx(
                      'block font-medium tracking-tight',
                      compact ? 'text-[13px]' : 'text-[14px]',
                      isCurrent ? 'text-[var(--text-bright)]' : 'text-[var(--text-muted)]'
                    )}
                  >
                    {idx + 1}. {step.title}
                  </span>
                  {!compact && (
                    <span className="block font-mono text-[10.5px] mt-0.5 text-[var(--text-soft)]">
                      本级只学 1 件事{step.id === 'l7' ? '（本级 0 个新概念）' : ''}
                    </span>
                  )}
                </span>
              </Link>
              {idx < LESSON_LEVELS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] bottom-0 -translate-x-1/2 w-px h-[calc(100%+0.25rem)] bg-[var(--border)]',
                    status === 'locked' ? 'opacity-30' : 'opacity-70'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
