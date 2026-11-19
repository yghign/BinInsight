'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { SelfCheck } from '@/data/lesson';

/**
 * 每级末尾「我看懂了吗」2 选 1 自检卡（PRD P1-2）。
 *
 * 复用 /cases 沙箱的机制：答错给白话解释、可重来、不扣分、不显示分数。
 * 答对调用 onPass() → useLessonProgress.markDone(本级别) → 解锁下一级。
 */
export default function SelfCheckCard({
  check,
  onPass,
}: {
  check: SelfCheck;
  onPass: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);

  const handlePick = (index: number): void => {
    if (passed) return;
    setPicked(index);
    if (check.options[index].correct) {
      setPassed(true);
      onPass();
    }
  };

  const retry = (): void => {
    setPicked(null);
  };

  return (
    <section className="u-panel p-5 md:p-6" aria-label="本级自检题">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 className="u-lesson-section !mb-0">我看懂了吗？</h2>
        <span className="u-lesson-note">答错会给解释</span>
      </div>
      <p className="u-lesson-body mb-4">{check.question}</p>

      <div className="space-y-2.5">
        {check.options.map((option, index) => {
          const isPicked = picked === index;
          const showCorrect = isPicked && option.correct;
          const showWrong = isPicked && !option.correct;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handlePick(index)}
              disabled={passed}
              className={clsx(
                'w-full text-left rounded-md border px-4 py-3 transition-colors text-[15px] leading-[1.8]',
                !isPicked && 'border-[var(--border)] hover:border-[var(--brand-500)] hover:bg-[var(--bg-hover)]',
                showCorrect && 'border-accent-green/60 bg-accent-green/10',
                showWrong && 'border-accent-orange/60 bg-accent-orange/10',
                passed && !isPicked && 'opacity-55'
              )}
            >
              <span className="font-mono text-[12px] mr-3 text-[var(--text-soft)]">
                {String.fromCharCode(65 + index)}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div
          className={clsx(
            'mt-4 rounded-md border p-4 text-[14px] leading-[1.85]',
            check.options[picked].correct
              ? 'border-accent-green/40 bg-accent-green/5'
              : 'border-accent-orange/40 bg-accent-orange/5'
          )}
        >
          <span className="block font-mono text-[12px] tracking-wider mb-1.5">
            {check.options[picked].correct ? '答对了' : '再想想'}
          </span>
          <p className="text-[var(--text-muted)]">{check.options[picked].explain}</p>
          {!check.options[picked].correct && (
            <button type="button" onClick={retry} className="u-btn u-btn-ghost !py-1.5 !px-3 !text-[12px] mt-3">
              再试一次
            </button>
          )}
        </div>
      )}
    </section>
  );
}
