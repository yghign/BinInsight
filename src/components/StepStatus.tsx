'use client';

import clsx from 'clsx';
import { useProgress } from './useProgress';
import { STEPS, STEP_LABEL, type StepId } from '@/data/reference';

/**
 * 四段式进度指示 —— 当前工作台的四个 step（原理 / 演示 / 动手 / 防御）。
 * 每个 step 一个小圆点 + 细线连接，点击切换完成状态。
 */

interface Props {
  slug: string;
  clickable?: boolean;
}

export default function StepStatus({ slug, clickable = true }: Props) {
  const { isStepDone, toggleStep } = useProgress();

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = isStepDone(slug, step);
        const next = STEPS[i + 1];
        const nextDone = next ? isStepDone(slug, next) : false;
        return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              onClick={() => clickable && toggleStep(slug, step)}
              className={clsx(
                'group flex flex-col items-center gap-1.5',
                clickable && 'cursor-pointer',
                !clickable && 'cursor-default'
              )}
              aria-pressed={done}
              title={clickable ? `点击标记「${STEP_LABEL[step]}」为${done ? '未完成' : '已完成'}` : undefined}
            >
              <span
                className={clsx(
                  'w-2.5 h-2.5 rounded-full border transition-colors',
                  done && 'border-[var(--brand-500)] bg-[var(--brand-500)]',
                  !done && 'border-[var(--border-soft)] bg-transparent group-hover:border-[var(--text-muted)]'
                )}
              />
              <span
                className={clsx(
                  'font-mono text-[10.5px] tracking-wider',
                  done ? 'text-[var(--text-muted)]' : 'text-[var(--text-soft)]'
                )}
              >
                {STEP_LABEL[step]}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={clsx(
                  'w-5 h-px mx-2',
                  done && nextDone
                    ? 'bg-[var(--border-soft)]'
                    : 'bg-[var(--border)] opacity-40'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
