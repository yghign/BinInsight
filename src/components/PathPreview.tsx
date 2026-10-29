'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useProgress } from './useProgress';
import { vulnPath, type VulnPathNode } from '@/data/reference';

/**
 * 右侧纵向路径面板 —— 细线连接节点，状态用线宽 + 透明度表达，
 * 不用彩色徽章。依赖 useProgress hook 读取 localStorage 状态。
 */

interface Props {
  currentSlug?: string;
}

export default function PathPreview({ currentSlug }: Props) {
  const progress = useProgress();

  const nodeStatus = (node: VulnPathNode, idx: number): 'done' | 'active' | 'locked' => {
    // 当前页面 = active
    if (node.slug === currentSlug) return 'active';
    // 有前置但前置未全 done = locked
    if (node.requires) {
      const req = vulnPath.find((n) => n.slug === node.requires);
      if (req && !progress.isVulnDone(req.slug)) return 'locked';
    }
    // 自己四段全 done = done
    if (progress.isVulnDone(node.slug)) return 'done';
    // 在当前节点之前 = done（已解锁但未全打）
    const currentIdx = vulnPath.findIndex((n) => n.slug === currentSlug);
    if (currentIdx >= 0 && idx < currentIdx) return progress.isVulnDone(node.slug) ? 'done' : 'active';
    return 'locked';
  };

  return (
    <nav aria-label="学习路径" className="relative">
      <ol className="space-y-0">
        {vulnPath.map((node, idx) => {
          const status = nodeStatus(node, idx);
          const linkable = status !== 'locked';
          const isCurrent = status === 'active';

          const lineBefore = idx > 0;
          const lineAfter = idx < vulnPath.length - 1;

          return (
            <li key={node.slug} className="relative">
              {/* 上行细线 */}
              {lineBefore && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] top-0 -translate-x-1/2 w-px',
                    status === 'done' && 'h-[calc(100%+0.25rem)] bg-[var(--border-soft)] opacity-70',
                    status === 'active' && 'h-[calc(100%+0.25rem)] bg-[var(--border)]',
                    status === 'locked' && 'h-[calc(100%+0.25rem)] bg-[var(--border)] opacity-30'
                  )}
                />
              )}

              <Link
                href={linkable ? `/reference/${node.slug}` : '#'}
                aria-current={isCurrent ? 'page' : undefined}
                aria-disabled={status === 'locked'}
                tabIndex={linkable ? undefined : -1}
                className={clsx(
                  'flex items-start gap-3 py-3 -mx-2 px-2 rounded-md transition-colors',
                  linkable && 'hover:bg-[var(--bg-soft)]',
                  !linkable && 'cursor-not-allowed'
                )}
              >
                {/* 节点圆点：纯边框 + 填充用透明度表达状态 */}
                <span
                  aria-hidden="true"
                  className={clsx(
                    'relative z-[1] flex-shrink-0 w-3 h-3 rounded-full border',
                    status === 'done' && 'border-[var(--brand-500)] bg-[var(--brand-500)]',
                    status === 'active' && 'border-[var(--brand-500)] bg-transparent',
                    status === 'locked' && 'border-[var(--border-soft)] bg-transparent opacity-50'
                  )}
                />

                <span className="min-w-0">
                  <span
                    className={clsx(
                      'block text-[13px] font-medium tracking-tight',
                      status === 'done' && 'text-[var(--text)]',
                      status === 'active' && 'text-[var(--text-bright)]',
                      status === 'locked' && 'text-[var(--text-soft)] opacity-70'
                    )}
                  >
                    {node.shortTitle}
                  </span>
                  <span
                    className={clsx(
                      'block font-mono text-[10.5px] mt-0.5 tracking-wider',
                      status === 'locked' ? 'text-[var(--text-soft)] opacity-50' : 'text-[var(--text-soft)]'
                    )}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </span>
              </Link>

              {/* 下行细线 */}
              {lineAfter && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] bottom-0 -translate-x-1/2 w-px',
                    status === 'done' && 'h-[calc(100%+0.25rem)] bg-[var(--border-soft)] opacity-70',
                    status === 'active' && 'h-[calc(100%+0.25rem)] bg-[var(--border)]',
                    status === 'locked' && 'h-[calc(100%+0.25rem)] bg-[var(--border)] opacity-30'
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
