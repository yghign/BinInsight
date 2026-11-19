'use client';

import { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import SourceBadge from './SourceBadge';

/**
 * 嵌入式步进模拟器 —— 预录制的输出流 + step 按钮。
 * 每一段 Step 展示：命令输入行、寄存器快照、当前 rip。
 * 数据由父组件传入（避免把具体命令硬编码进组件）。
 *
 * 本次改造（T08）：新增 sourceLabel prop，UI 上显式标「预录演示」并挂
 * <SourceBadge state="demo" />，绝不把预置字符串伪装成真实运行输出。
 */

export interface DemoStep {
  /** 命令（左侧显示成 $ 之后的输入） */
  cmd: string;
  /** 输出（多行字符串，按原样渲染） */
  output: string;
  /** 这一步结束后 rip 寄存器值（十六进制） */
  rip?: string;
  /** 可选：关键要点，输出下方一行小字 */
  note?: string;
}

interface Props {
  steps: DemoStep[];
  /** 第一步序号（默认 0） */
  initialStep?: number;
  /** 来源标注，默认「预录演示」 */
  sourceLabel?: string;
}

export default function DemoTerminal({
  steps,
  initialStep = 0,
  sourceLabel = '预录演示',
}: Props) {
  const [idx, setIdx] = useState(initialStep);
  const [autoRun, setAutoRun] = useState(false);

  const current = steps[idx] ?? steps[0];

  // 自动播放：每 900ms 走一步，走完停止
  useEffect(() => {
    if (!autoRun) return;
    if (idx >= steps.length - 1) {
      setAutoRun(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), 900);
    return () => clearTimeout(t);
  }, [autoRun, idx, steps.length]);

  const reset = () => {
    setIdx(0);
    setAutoRun(false);
  };

  const lines = useMemo(() => current.output.split('\n'), [current.output]);

  return (
    <div className="u-panel overflow-hidden">
      {/* 终端头：来源标注 + 三态标签 */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">gdb ./vuln</span>
          <span className="u-source-note">· {sourceLabel}（非现场运行）</span>
        </div>
        <div className="flex items-center gap-2.5">
          <SourceBadge state="demo" />
          <span className="font-mono text-[10px] text-[var(--text-soft)]">
            step {String(idx + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 终端内容区 */}
      <div className="bg-[var(--bg-code)] font-mono text-[12.5px] leading-[1.7] px-4 py-3 max-h-[360px] overflow-auto">
        {idx > 0 && (
          <div className="text-[var(--text-soft)] opacity-60 mb-2">
            {steps.slice(Math.max(0, idx - 2), idx).map((s, i) => (
              <div key={i}>
                <span className="text-[var(--accent-cyan)]">$ </span>
                <span>{s.cmd}</span>
              </div>
            ))}
            <span className="text-[var(--text-soft)] opacity-40 text-[11px]">… 前面几步已省略 …</span>
          </div>
        )}

        <div className="flex items-start gap-2 mb-1.5">
          <span className="text-[var(--accent-cyan)] flex-shrink-0">$</span>
          <span className="text-[var(--text)]">{current.cmd}</span>
        </div>

        <div className="text-[var(--text-muted)] whitespace-pre-wrap">
          {lines.map((l, i) => (
            <div
              key={i}
              className={clsx(
                l.includes('0x41414141') && 'text-[var(--accent-red)]',
                l.includes('0x00000000004') && 'text-[var(--accent-green)]'
              )}
            >
              {l || '\u00a0'}
            </div>
          ))}
        </div>

        {current.rip && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] text-[12px]">
            <span className="text-[var(--text-soft)]">rip: </span>
            <span
              className={clsx(
                current.rip.startsWith('0x41') ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'
              )}
            >
              {current.rip}
            </span>
          </div>
        )}
      </div>

      {/* 控制条 */}
      <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="font-mono text-[12px] px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← prev
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
            disabled={idx >= steps.length - 1}
            className="font-mono text-[12px] px-3 py-1 rounded bg-[var(--brand-500)] text-white hover:bg-[var(--brand-400)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            step →
          </button>
          <button
            onClick={reset}
            className="font-mono text-[12px] px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            reset
          </button>
          <button
            onClick={() => setAutoRun((v) => !v)}
            className={clsx(
              'font-mono text-[12px] px-3 py-1 rounded border transition-colors',
              autoRun
                ? 'border-[var(--brand-500)] text-[var(--brand-500)] bg-[var(--brand-500)]/10'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {autoRun ? '⏸ pause' : '▶ auto'}
          </button>
        </div>
        {current.note && (
          <span className="font-mono text-[11px] text-[var(--text-soft)] hidden sm:block">
            {current.note}
          </span>
        )}
      </div>
    </div>
  );
}
