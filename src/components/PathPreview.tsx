'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LESSON_LEVELS, getLevel, type LevelId } from '@/data/lesson';
import { nodeStatus } from '@/lib/lesson';
import { useLessonProgress } from './useProgress';

/**
 * 纵向 8 级路径面板 —— 复用 PathPreview 原有 :20-34 的前置链三态状态机
 * （done / active / locked + requires 前置链），换成 8 级主线数据。
 *
 * 状态用线宽 + 透明度表达，不用彩色徽章；进度来自 useLessonProgress
 * （bininsight-lesson-progress-v1，刷新保留、跨标签同步）。
 *
 * 旧四段式漏洞路径（vulnPath）已归 L8 拓展区，不在主线出现。
 */
export default function PathPreview({ currentSlug }: { currentSlug?: string }) {
  const pathname = usePathname() ?? '';
  const { progress, passed } = useLessonProgress();

  const fromRoute = LESSON_LEVELS.find((item) => pathname.startsWith(item.route))?.id;
  const fromSlug = getLevel(currentSlug ?? '')?.id;
  const currentId: LevelId = fromSlug ?? fromRoute ?? 'l0';

  return (
    <nav aria-label="8 级主线路径" className="relative">
      <ol className="space-y-0">
        {LESSON_LEVELS.map((node, idx) => {
          const status = nodeStatus(node.id, currentId, progress);
          const linkable = status !== 'locked';
          const isCurrent = node.id === currentId;

          return (
            <li key={node.id} className="relative">
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] top-0 -translate-x-1/2 w-px h-[calc(100%+0.25rem)] bg-[var(--border-soft)]',
                    status === 'locked' ? 'opacity-30' : 'opacity-70'
                  )}
                />
              )}

              <Link
                href={linkable ? node.route : '#'}
                aria-current={isCurrent ? 'page' : undefined}
                aria-disabled={status === 'locked'}
                tabIndex={linkable ? undefined : -1}
                className={clsx(
                  'flex items-start gap-3 rounded-md transition-colors -mx-2 px-2 py-2.5',
                  linkable ? 'hover:bg-[var(--bg-hover)]' : 'cursor-not-allowed'
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    'relative z-[1] flex-shrink-0 w-3 h-3 mt-1 rounded-full border',
                    status === 'done' && 'border-[var(--brand-500)] bg-[var(--brand-500)]',
                    status === 'active' && 'border-[var(--brand-500)] bg-transparent',
                    status === 'locked' && 'border-[var(--border-soft)] bg-transparent opacity-50'
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={clsx(
                      'block text-[13.5px] font-medium tracking-tight',
                      status === 'active' && 'text-[var(--text-bright)]',
                      status === 'done' && 'text-[var(--text)]',
                      status === 'locked' && 'text-[var(--text-soft)] opacity-70'
                    )}
                  >
                    {idx + 1}. {node.title}
                  </span>
                  <span className="block font-mono text-[10.5px] mt-0.5 text-[var(--text-soft)]">
                    本级只学 1 件事
                  </span>
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
      <p className="font-mono text-[10.5px] text-[var(--text-soft)] mt-3">
        已完成 {passed} / {LESSON_LEVELS.length} 级
      </p>
    </nav>
  );
}
