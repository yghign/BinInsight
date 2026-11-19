'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SourceBadge from './SourceBadge';

/**
 * 防御视角 —— 同一漏洞代码 × 防护开关矩阵。
 *
 * 本次改造（T08）：
 *   - 新增 single 模式：只渲染 1 个 Canary 开关，NX / ASLR 一句话带过；
 *     「绕过方法」整块内容不在这里出现（归 L8 拓展区）。
 *   - 模拟日志挂 <SourceBadge state="demo" />，标题显式写「运行结果（演示样例）」。
 * 非 single 模式保持旧工作台（L8）可用。
 */

export interface MitigationRow {
  name: string;
  defaultOn?: boolean;
  desc: string;
  effectOff: string;
  effectOn: string;
}

export interface FixOption {
  code: string;
  correct: boolean;
  label?: string;
}

interface Props {
  mitigations: MitigationRow[];
  vulnCode: string;
  fixOptions: FixOption[];
  recommendedFix: { code: string; explanation: string };
  /** 只渲染第一个开关（Canary），用于 L6 主线 */
  single?: boolean;
}

export default function DefenseSwitcher({
  mitigations,
  vulnCode,
  fixOptions,
  recommendedFix,
  single = false,
}: Props) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(mitigations.map((m) => [m.name, m.defaultOn ?? true]))
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const visible = single ? mitigations.slice(0, 1) : mitigations;
  const toggle = (name: string) => setStates((s) => ({ ...s, [name]: !s[name] }));

  const crashLog = (() => {
    const parts: string[] = [];
    if (states.Canary) {
      parts.push('*** stack smashing detected ***: ./vuln terminated');
      parts.push('（封条被改动，程序被强行停下，没有走到返回地址）');
    } else {
      parts.push('Segmentation fault (core dumped)');
      parts.push('rip=0x41414141  ← 本该是「下一步去哪」的地方被 A 填满');
    }
    if (single) {
      parts.push('NX / ASLR 是另外两把自动加的锁，本次一句话带过、不展开。');
    } else {
      if (states.ASLR) {
        parts.push('[!] address randomization: all libs loaded at randomized base');
      } else {
        parts.push('[*] ASLR off: libc base = 0x00007ffff7dfc000');
      }
      if (states['NX bit']) {
        parts.push("[!] NX enabled: shellcode on stack/heap won't execute");
      } else {
        parts.push('[*] NX off: stack is RWX');
      }
    }
    return parts.join('\n');
  })();

  const submitFix = (i: number) => {
    if (submitted) return;
    setPicked(i);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* 顶部：漏洞代码 */}
      <div className="u-panel overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between gap-3 flex-wrap">
          <span className="font-mono text-[11px] tracking-wider text-[var(--text-muted)]">
            同一份输入 · 只切换一把锁
          </span>
          <SourceBadge state="demo" />
        </div>
        <pre className="m-0 px-4 py-3 font-mono text-[12.5px] text-[var(--text-muted)] whitespace-pre overflow-x-auto">
{vulnCode}
        </pre>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 防护开关矩阵 */}
        <div className="u-panel p-5 space-y-3">
          <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">防护开关</div>
          {visible.map((m) => {
            const on = states[m.name];
            return (
              <label key={m.name} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(m.name)}
                  className="mt-0.5 accent-[var(--brand-500)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12px] text-[var(--text)]">{m.name}</span>
                    <span
                      className={clsx(
                        'font-mono text-[10px] px-1.5 py-0.5 rounded border',
                        on
                          ? 'text-[var(--accent-green)] border-[var(--accent-green)]/30'
                          : 'text-[var(--accent-orange)] border-[var(--accent-orange)]/30'
                      )}
                    >
                      {on ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mt-0.5">
                    {on ? m.effectOn : m.effectOff}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* 模拟崩溃日志 */}
        <div className="u-panel overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">运行结果（模拟 · 预录演示）</span>
            <SourceBadge state="demo" />
          </div>
          <pre className="m-0 px-4 py-3 font-mono text-[12px] whitespace-pre overflow-x-auto text-[var(--text-muted)]">
{crashLog}
          </pre>
        </div>
      </div>

      {/* 修复选择 */}
      <div className="u-panel p-5 space-y-4">
        <div>
          <div className="font-mono text-[11px] tracking-wider text-[var(--accent-purple)] mb-1.5">
            修复挑战（2 选 1）
          </div>
          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            上面这段代码里 <code className="inline">strcpy</code> 是漏洞源。选出正确的修复方案：
          </p>
        </div>

        <div className="space-y-2">
          {fixOptions.map((opt, i) => {
            const pickedHere = picked === i;
            const correctHere = opt.correct;
            const showJudge = submitted;
            return (
              <button
                key={i}
                onClick={() => submitFix(i)}
                disabled={submitted}
                className={clsx(
                  'w-full text-left p-4 rounded-md border transition-all',
                  !showJudge && 'border-[var(--border)] hover:border-[var(--brand-500)]/50 bg-[var(--bg-card)]',
                  showJudge && correctHere && 'border-[var(--accent-green)] bg-[color-mix(in_srgb,var(--accent-green)_8%,transparent)]',
                  showJudge && !correctHere && pickedHere && 'border-[var(--accent-red)] bg-[color-mix(in_srgb,var(--accent-red)_8%,transparent)]',
                  showJudge && !correctHere && !pickedHere && 'border-[var(--border)] opacity-60'
                )}
              >
                <pre className="font-mono text-[12px] text-[var(--text)] whitespace-pre-wrap">
{opt.code}
                </pre>
                {opt.label && (
                  <span className="font-mono text-[10.5px] text-[var(--text-soft)] mt-2 block">{opt.label}</span>
                )}
                {showJudge && pickedHere && (
                  <span
                    className={clsx(
                      'font-mono text-[11px] mt-2 block',
                      correctHere ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                    )}
                  >
                    {correctHere ? '✓ 正确' : '✗ 不对 —— 再想想'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {submitted && picked !== null && fixOptions[picked].correct && (
          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)]">推荐修复</div>
            <pre className="font-mono text-[12px] text-[var(--text)] whitespace-pre-wrap">
{recommendedFix.code}
            </pre>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{recommendedFix.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
