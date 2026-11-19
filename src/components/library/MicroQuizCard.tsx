'use client';

/** 微自测卡（架构 07 §3.2）：认出它 / 怎么防 / 易错点；点错给解释、可重来、不扣分。 */
import { useState } from 'react';
import clsx from 'clsx';
import type { MicroQuiz } from '@/data/library/types';

const KIND_LABEL: Record<MicroQuiz['kind'], string> = {
  identify: '认出它',
  protect: '怎么防',
  mistake: '易错点',
};

export default function MicroQuizCard({ quiz, index }: { quiz: MicroQuiz; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const show = picked !== null;

  return (
    <div className="u-panel p-5 md:p-6">
      <p className="u-eyebrow mb-3">题 {index + 1} · {KIND_LABEL[quiz.kind]}</p>
      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-2 whitespace-pre-wrap">{quiz.material}</p>
      <p className="text-[14px] text-[var(--text)] font-medium mb-4">{quiz.question}</p>
      <div className="space-y-2">
        {quiz.options.map((opt, i) => {
          const chosen = picked === i;
          return (
            <div key={i}>
              <button
                type="button"
                disabled={show}
                onClick={() => setPicked(i)}
                className={clsx(
                  'w-full text-left rounded-md border px-4 py-2.5 text-[13.5px] transition-colors',
                  !show && 'border-[var(--border)] hover:border-[var(--brand-500)] cursor-pointer',
                  show && opt.correct && 'border-accent-green bg-accent-green/5',
                  show && chosen && !opt.correct && 'border-accent-red bg-accent-red/5',
                  show && !chosen && !opt.correct && 'border-[var(--border)] opacity-60'
                )}
              >
                <span className="font-mono text-[var(--text-soft)] mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt.text}
                {show && opt.correct && <span className="ml-2 text-accent-green">✔</span>}
                {show && chosen && !opt.correct && <span className="ml-2 text-accent-red">✘</span>}
              </button>
              {show && (chosen || opt.correct) && (
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed mt-1.5 px-4">{opt.explain}</p>
              )}
            </div>
          );
        })}
      </div>
      {show && (
        <button type="button" onClick={() => setPicked(null)} className="text-[12px] text-[var(--brand-500)] u-link mt-4">
          {picked !== null && quiz.options[picked]?.correct ? '再看一遍' : '再试一次'}
        </button>
      )}
    </div>
  );
}
