'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SourceBadge from '../SourceBadge';
import TermButton from '../TermButton';
import { computeStrDiff } from '@/lib/str-diff';

/**
 * L3 修好它 —— 复用 learn/step4 的 PatchDiffDemo 并排高亮 + computeStrDiff 行级 diff。
 * 唯一新概念：限长函数 strncpy（给杯子加一条刻度线）。
 * safe_alt 只给 2 个选项；「手动补 \0」作提示卡，算注意事项、不算新概念。
 */

const ORIGINAL_C = `void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);
    printf("Input: %s\\n", buffer);
}`;

const PATCHED_C = `void process_input(char *input) {
    char buffer[64];
    strncpy(buffer, input, 63);
    buffer[63] = '\\0';
    printf("Input: %s\\n", buffer);
}`;

const FIX_OPTIONS: { label: string; correct: boolean; explain: string }[] = [
  {
    label: 'strncpy(buf, input, 63); buf[63] = 0;',
    correct: true,
    explain: '对。多出来的 63 就是「长度上限」，盒子装不下也不会往外洒；末尾补 0 是收尾的注意事项。',
  },
  {
    label: 'strcpy(buf, input);  // 原样保留',
    correct: false,
    explain: '不对。strcpy 没有长度上限，输入一长就会溢出 —— 正是 L1 里被染红的那一片。并排看一下左右第 3 行的区别。',
  },
];

export default function L3PatchDiff() {
  const diff = computeStrDiff(ORIGINAL_C, PATCHED_C);
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="u-lesson-stage">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="u-lesson-section !mb-0">左右并排：到底改了哪一行</h2>
        <SourceBadge state="demo" />
      </div>

      <p className="u-lesson-body mb-5">
        把 <TermButton termId="strcpy" /> 换成 <TermButton termId="strncpy" />，
        就是给杯子加了一条刻度线。下面这份 <TermButton termId="patch" /> 只说「改了什么」，不写回程序。
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 左：原来 */}
        <div>
          <p className="u-eyebrow mb-2 !text-accent-red">原来 · 不检查长度</p>
          <div className="rounded-md border border-[var(--border)] bg-[var(--bg-code)] overflow-hidden">
            {diff.left.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  'flex px-3 py-[3px] font-mono text-[12px]',
                  line.type === 'removed' && 'bg-accent-red/15 border-l-2 border-accent-red'
                )}
              >
                <span className="w-6 text-right pr-3 text-[var(--text-soft)] select-none flex-shrink-0">{i + 1}</span>
                <span className="text-[var(--text-muted)] whitespace-pre">{line.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右：改后 */}
        <div>
          <p className="u-eyebrow mb-2 !text-accent-green">改后 · 加了长度上限</p>
          <div className="rounded-md border border-[var(--border)] bg-[var(--bg-code)] overflow-hidden">
            {diff.right.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  'flex px-3 py-[3px] font-mono text-[12px]',
                  line.type === 'added' && 'bg-accent-green/15 border-l-2 border-accent-green'
                )}
              >
                <span className="w-6 text-right pr-3 text-[var(--text-soft)] select-none flex-shrink-0">{i + 1}</span>
                <span className="text-[var(--text-muted)] whitespace-pre">{line.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 提示卡：手动补 \0，注意事项，不算新概念 */}
      <div className="mt-5 rounded-md border border-[var(--border)] border-l-2 border-l-[var(--accent-orange)] p-4">
        <p className="u-lesson-note mb-1">顺带记住一件小事（注意事项，不算新概念）</p>
        <p className="u-lesson-body">
          换了 strncpy 之后，还要手动在末尾补一个 0 当结束标记。这只是收尾动作，
          本级的「1 件事」仍然只是<strong className="text-[var(--text)]">长度上限</strong>。
        </p>
      </div>

      {/* 2 选 1 */}
      <div className="mt-6">
        <p className="u-lesson-section !text-[17px] mb-3">哪种写法安全？</p>
        <div className="space-y-2.5">
          {FIX_OPTIONS.map((option, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(i)}
              className={clsx(
                'w-full text-left rounded-md border px-4 py-3 transition-colors',
                picked === i && option.correct && 'border-accent-green/60 bg-accent-green/10',
                picked === i && !option.correct && 'border-accent-orange/60 bg-accent-orange/10',
                picked !== i && 'border-[var(--border)] hover:border-[var(--brand-500)]'
              )}
            >
              <span className="font-mono text-[12px] mr-3 text-[var(--text-soft)]">
                {String.fromCharCode(65 + i)}
              </span>
              <code className="inline !bg-transparent !p-0 !text-[13px]">{option.label}</code>
            </button>
          ))}
        </div>
        {picked !== null && (
          <div
            className={clsx(
              'mt-3 rounded-md border p-4 text-[14px] leading-[1.85]',
              FIX_OPTIONS[picked].correct
                ? 'border-accent-green/40 bg-accent-green/5'
                : 'border-accent-orange/40 bg-accent-orange/5'
            )}
          >
            <p className="text-[var(--text-muted)]">{FIX_OPTIONS[picked].explain}</p>
            {!FIX_OPTIONS[picked].correct && (
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="u-btn u-btn-ghost !py-1.5 !px-3 !text-[12px] mt-3"
              >
                再试一次
              </button>
            )}
          </div>
        )}
      </div>

      <p className="u-lesson-note mt-5">
        以上为演示样例：并排高亮用「按行对齐」的行级对比实现，只回答「哪几行变了」，不是树结构对比。
      </p>
    </div>
  );
}
