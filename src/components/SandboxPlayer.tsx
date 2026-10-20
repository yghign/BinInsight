'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import CodeBlock from '@/components/CodeBlock';
import type { SandboxCase, SandboxStage, SandboxTool } from '@/data/sandbox';

const toolTone: Record<SandboxTool, string> = {
  terminal: 'text-accent-green',
  strings: 'text-accent-green',
  decompile: 'text-brand-400',
  disasm: 'text-brand-400',
  gdb: 'text-accent-purple',
  memory: 'text-accent-purple',
  patch: 'text-accent-orange',
  checksec: 'text-accent-cyan',
  exploit: 'text-accent-red',
};

interface StageState {
  done: boolean;
  firstTry: boolean;
}

interface Props {
  caseData: SandboxCase;
}

export default function SandboxPlayer({ caseData }: Props) {
  const [guideOn, setGuideOn] = useState(caseData.difficulty === 'beginner');
  const [stageIdx, setStageIdx] = useState(0);
  const [states, setStates] = useState<Record<string, StageState>>({});
  const [wrongPicks, setWrongPicks] = useState<Record<string, number[]>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const stage: SandboxStage = caseData.stages[stageIdx];
  const stageState = states[stage.id];
  const stageWrong = wrongPicks[stage.id] ?? [];
  const doneCount = caseData.stages.filter((s) => states[s.id]?.done).length;
  const finished = doneCount === caseData.stages.length;
  const firstTryCount = caseData.stages.filter((s) => states[s.id]?.firstTry).length;
  const isLast = stageIdx === caseData.stages.length - 1;

  const canOpen = (i: number) =>
    i <= stageIdx || (i > 0 && states[caseData.stages[i - 1].id]?.done);

  const jumpTo = (i: number) => {
    setStageIdx(i);
    setFeedback(null);
    setHintOpen(false);
  };

  const handlePick = (optIdx: number) => {
    if (stageState?.done) return;
    const opt = stage.options[optIdx];
    if (opt.correct) {
      const firstTry = stageWrong.length === 0;
      setStates((prev) => ({
        ...prev,
        [stage.id]: { done: true, firstTry: prev[stage.id]?.firstTry ?? firstTry },
      }));
      setFeedback({ ok: true, text: opt.explain });
    } else {
      setWrongPicks((prev) => ({
        ...prev,
        [stage.id]: prev[stage.id]?.includes(optIdx)
          ? prev[stage.id]
          : [...(prev[stage.id] ?? []), optIdx],
      }));
      setFeedback({ ok: false, text: opt.explain });
    }
  };

  const handleRestart = () => {
    setGuideOn(caseData.difficulty === 'beginner');
    setStageIdx(0);
    setStates({});
    setWrongPicks({});
    setFeedback(null);
    setHintOpen(false);
  };

  const guideCards = (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="rounded-md border border-[color-mix(in_srgb,var(--brand-500)_35%,var(--border))] bg-[color-mix(in_srgb,var(--brand-500)_6%,transparent)] p-4">
        <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-1.5">
          为什么要做这一步
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{stage.guideWhy}</p>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-soft)] p-4">
        <div className="font-mono text-[11px] tracking-wider text-[var(--accent-cyan)] mb-1.5">
          这份材料怎么看
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{stage.guideHow}</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* 玩法条：指导开关 + 进度 */}
      <div className="u-panel mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
          {/* 指导模式开关 */}
          <div className="flex items-center gap-3">
            <span className="text-[13.5px] font-medium">指导模式</span>
            <button
              role="switch"
              aria-checked={guideOn}
              aria-label="是否开启指导模式"
              onClick={() => setGuideOn((v) => !v)}
              className={clsx(
                'relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0',
                guideOn ? 'bg-[var(--brand-500)]' : 'bg-[var(--border-soft)]'
              )}
            >
              <span
                className={clsx(
                  'absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all shadow-sm',
                  guideOn ? 'left-[21px]' : 'left-[3px]'
                )}
              />
            </button>
            <span className="text-[12px] text-[var(--text-muted)]">
              {guideOn ? '开 · 每步解释做什么、为什么、怎么看' : '关 · 自主分析，卡壳随时看提示'}
            </span>
          </div>

          {/* 进度 */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
            <span>进度 {doneCount}/{caseData.stages.length}</span>
            <div className="flex items-center gap-1 ml-1">
              {caseData.stages.map((s, i) => {
                const done = states[s.id]?.done;
                const current = i === stageIdx;
                return (
                  <button
                    key={s.id}
                    onClick={() => canOpen(i) && jumpTo(i)}
                    disabled={!canOpen(i)}
                    aria-label={`跳转到阶段 ${i + 1}`}
                    className={clsx(
                      'h-1.5 rounded-full transition-all',
                      current ? 'w-6' : 'w-3.5',
                      done
                        ? 'bg-[var(--brand-500)]'
                        : canOpen(i)
                          ? 'bg-[var(--border-soft)] hover:bg-[var(--text-soft)]'
                          : 'bg-[var(--border)] opacity-50 cursor-not-allowed'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 当前阶段 */}
      <section className="space-y-5">
        {/* 阶段头 */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="u-tag !text-brand-400">阶段 {stageIdx + 1} / {caseData.stages.length}</span>
            <span className="u-tag">{stage.title}</span>
          </div>
          <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
            {stage.mission}
          </p>
        </div>

        {/* 指导卡片 */}
        {guideOn ? (
          guideCards
        ) : (
          <div>
            <button
              onClick={() => setHintOpen((v) => !v)}
              className="font-mono text-[12px] px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-soft)] transition-colors"
            >
              {hintOpen ? '收起思路提示' : '卡住了？查看思路提示'}
            </button>
            {hintOpen && <div className="mt-3">{guideCards}</div>}
          </div>
        )}

        {/* 仿真工具材料 */}
        <div className="u-panel overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="w-2 h-2 rounded-full bg-accent-red/60" />
                <span className="w-2 h-2 rounded-full bg-accent-orange/60" />
                <span className="w-2 h-2 rounded-full bg-accent-green/60" />
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">{stage.toolLabel}</span>
            </div>
            <span className={clsx('font-mono text-[10px] uppercase tracking-wider', toolTone[stage.tool])}>
              {stage.tool}
            </span>
          </div>
          <CodeBlock code={stage.material} language={stage.materialLang} showLineNumbers={false} />
        </div>

        {/* 提问 */}
        <div>
          <div className="flex items-start gap-2.5 mb-4">
            <span className="u-tag !text-brand-400 flex-shrink-0 mt-0.5">问</span>
            <h4 className="text-[15px] font-semibold leading-relaxed">{stage.question}</h4>
          </div>

          <div className="space-y-2.5">
            {stage.options.map((opt, i) => {
              const isWrong = stageWrong.includes(i);
              const isCorrect = stageState?.done && opt.correct;
              return (
                <button
                  key={i}
                  onClick={() => handlePick(i)}
                  disabled={isWrong || stageState?.done}
                  aria-pressed={isCorrect || isWrong}
                  className={clsx(
                    'w-full text-left rounded-md border px-4 py-3 transition-colors text-[13.5px] leading-relaxed',
                    isCorrect && 'border-accent-green/50 bg-accent-green/10',
                    isWrong && 'border-accent-red/25 bg-accent-red/5 text-[var(--text-muted)] line-through opacity-60 cursor-not-allowed',
                    !isCorrect && !isWrong && 'border-[var(--border)] hover:border-[color-mix(in_srgb,var(--brand-500)_50%,var(--border))] hover:bg-[var(--bg-hover)] cursor-pointer'
                  )}
                >
                  <span className="font-mono text-[11px] mr-2.5 text-[var(--text-soft)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={isCorrect ? 'font-medium' : ''}>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* 选项反馈 */}
          {feedback && (
            <div
              className={clsx(
                'mt-4 rounded-md border p-4 text-[13px] leading-relaxed',
                feedback.ok
                  ? 'border-accent-green/40 bg-accent-green/5'
                  : 'border-accent-orange/40 bg-accent-orange/5'
              )}
            >
              <span
                className={clsx(
                  'block font-semibold mb-1 font-mono text-[12px] tracking-wider',
                  feedback.ok ? 'text-accent-green' : 'text-accent-orange'
                )}
              >
                {feedback.ok ? '✓ 判断正确' : '✗ 这个选项不对'}
              </span>
              <p className="text-[var(--text-muted)]">{feedback.text}</p>
            </div>
          )}

          {/* 阶段小结 + 下一阶段 */}
          {stageState?.done && (
            <div className="mt-4 rounded-md border border-[var(--border)] border-l-2 border-l-[var(--brand-500)] bg-[var(--bg-soft)] p-4">
              <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-1.5">
                阶段小结
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-3">{stage.verdict}</p>
              {!isLast && (
                <button onClick={() => jumpTo(stageIdx + 1)} className="u-btn u-btn-primary !py-2 !px-4 !text-[13px]">
                  进入下一阶段
                  <span className="font-mono" aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 通关总结 */}
      {finished && (
        <section className="u-panel p-6 md:p-8 mt-12">
          <p className="u-eyebrow mb-2">Clear — 沙箱通关</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
            <h3 className="u-display text-xl md:text-2xl">通关总结</h3>
            <span className="font-mono text-[12px] text-[var(--text-soft)]">
              首次命中率 {firstTryCount}/{caseData.stages.length}
            </span>
          </div>
          <p className="text-[14px] leading-[1.85] text-[var(--text-muted)] max-w-3xl mb-8">
            {caseData.summary}
          </p>

          {/* 防护清单 */}
          <h4 className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-3">
            防护建议 · PROTECTION
          </h4>
          <div className="border-t border-[var(--border)] mb-8">
            {caseData.protection.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[24px_1fr] gap-3 py-3 border-b border-[var(--border)] items-baseline"
              >
                <span className="u-flow-tick !w-4" aria-hidden="true" />
                <span className="text-[13px] leading-[1.75] text-[var(--text-muted)]">{item}</span>
              </div>
            ))}
          </div>

          {/* 关联学习 */}
          <h4 className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-3">
            关联学习 · RELATED
          </h4>
          <div className="border-t border-[var(--border)] mb-8">
            {caseData.relatedSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className="group flex items-center justify-between gap-4 py-3 border-b border-[var(--border)]"
              >
                <span className="font-mono text-[13px] group-hover:text-[var(--brand-500)] transition-colors">
                  {step.label}
                </span>
                <span
                  className="font-mono text-[var(--text-soft)] group-hover:text-[var(--brand-500)] transition-colors flex-shrink-0"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleRestart} className="u-btn u-btn-ghost">
              重新开始
            </button>
            <Link href="/cases" className="u-btn u-btn-primary">
              返回案例列表
              <span className="font-mono" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
