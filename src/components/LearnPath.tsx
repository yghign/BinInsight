'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

/**
 * 教学路径纵向节点预览 —— 细线连接 + 透明度/线宽区分状态。
 * 用于 learn 区和首页首屏右侧，替代横向 StepProgress。
 */

const LEARN_STEPS = [
  { id: 'step1', href: '/learn/step1', title: '解包与识别', sub: '看懂 ELF，识别加壳' },
  { id: 'step2', href: '/learn/step2', title: '静态分析', sub: '反汇编 + 危险函数定位' },
  { id: 'step3', href: '/learn/step3', title: '路径探索', sub: 'GDB 调试 + 漏洞确认' },
  { id: 'step4', href: '/learn/step4', title: '防护策略', sub: 'Canary / NX / ASLR / CFI' },
];

interface Props {
  compact?: boolean;
}

export default function LearnPath({ compact = false }: Props) {
  const pathname = usePathname();
  const currentIdx = LEARN_STEPS.findIndex((s) => pathname?.startsWith(s.href));

  const status = (idx: number): 'done' | 'active' | 'pending' => {
    if (idx < currentIdx) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <nav aria-label="学习路径">
      <ol className="space-y-0">
        {LEARN_STEPS.map((step, idx) => {
          const st = status(idx);
          return (
            <li key={step.id} className="relative">
              {/* 上行细线 */}
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] top-0 -translate-x-1/2 w-px',
                    st === 'done' && 'h-[calc(100%+0.25rem)] bg-[var(--border-soft)] opacity-70',
                    st === 'active' && 'h-[calc(100%+0.25rem)] bg-[var(--border)]',
                    st === 'pending' && 'h-[calc(100%+0.25rem)] bg-[var(--border)] opacity-30'
                  )}
                />
              )}
              <Link
                href={step.href}
                aria-current={st === 'active' ? 'page' : undefined}
                className={clsx(
                  'flex items-start gap-3 rounded-md transition-colors -mx-2 px-2',
                  st !== 'pending' && 'hover:bg-[var(--bg-soft)]',
                  st === 'pending' && 'opacity-60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    'relative z-[1] flex-shrink-0 w-3 h-3 mt-3 rounded-full border',
                    st === 'done' && 'border-[var(--brand-500)] bg-[var(--brand-500)]',
                    st === 'active' && 'border-[var(--brand-500)] bg-transparent',
                    st === 'pending' && 'border-[var(--border-soft)] bg-transparent'
                  )}
                />
                <span className="min-w-0 py-2.5">
                  <span
                    className={clsx(
                      'block font-medium tracking-tight',
                      compact ? 'text-[13px]' : 'text-[14px]',
                      st === 'done' && 'text-[var(--text)]',
                      st === 'active' && 'text-[var(--text-bright)]',
                      st === 'pending' && 'text-[var(--text-soft)]'
                    )}
                  >
                    {step.title}
                  </span>
                  {!compact && (
                    <span className="block font-mono text-[10.5px] mt-0.5 text-[var(--text-soft)]">
                      {step.sub}
                    </span>
                  )}
                </span>
              </Link>
              {/* 下行细线 */}
              {idx < LEARN_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute left-[6px] bottom-0 -translate-x-1/2 w-px',
                    st === 'done' && 'h-[calc(100%+0.25rem)] bg-[var(--border-soft)] opacity-70',
                    st === 'active' && 'h-[calc(100%+0.25rem)] bg-[var(--border)]',
                    st === 'pending' && 'h-[calc(100%+0.25rem)] bg-[var(--border)] opacity-30'
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
