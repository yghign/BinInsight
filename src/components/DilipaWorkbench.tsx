'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, RefreshCw, FileCode, ListChecks, ChevronRight } from 'lucide-react';
import type { DilipaReport, DilipaCallSite } from '@/data/dilipa-report';
import type { SourceState } from '@/data/source-state';
import {
  DILIPA_SAMPLE_FUNCS,
  DILIPA_SAMPLE_NOTE,
  DILIPA_FUTURE_WORK,
  type DilipaSampleFunc,
} from '@/data/dilipa-sample';
import { computeStrDiff, type DiffLine } from '@/lib/str-diff';
import { NO_CALLS_HINT } from '@/data/dilipa-report';
import SourceBadge from './SourceBadge';
import TermButton from './TermButton';

/**
 * Dilipa 工作台 · 三步预览（原六步已砍到 3 步，T03 / T09）。
 *
 * - 步骤：① 选择函数 → ② 看 C 代码 → ③ 看变更清单
 * - 每屏都挂 <SourceBadge>；三个写死的 'OK' 已改成「未执行 · 本阶段仅预览」
 * - 硬编码的 C / 汇编 / 修复建议已迁到 data/dilipa-sample.ts，全部标 demo
 * - 支持可选 report prop：传入后所有列表与统计数字都来自 report 对象，禁止硬编码
 * - 不再以「已完成」呈现二进制重写，统一移到「后续工作」清单并标 planned
 */

const STEPS = [
  { id: 1, label: '选择函数', icon: FileCode },
  { id: 2, label: '看 C 代码', icon: FileCode },
  { id: 3, label: '看变更清单', icon: ListChecks },
] as const;

interface DilipaWorkbenchProps {
  /** 可选：导入的 dilipa analyze 报告；传入后以报告为唯一数据源 */
  report?: DilipaReport;
  /** 来源状态，默认 demo */
  sourceState?: SourceState;
}

/** 并排 C 代码 diff 视图（复用 lib/str-diff 的 computeStrDiff）。 */
function DiffColumns({
  left,
  right,
  leftTitle,
  rightTitle,
}: {
  left: DiffLine[];
  right: DiffLine[];
  leftTitle: string;
  rightTitle: string;
}) {
  const render = (lines: DiffLine[], added: boolean) => (
    <pre className="p-3 text-[11.5px] leading-[1.7] font-mono overflow-x-auto max-h-[320px]">
      {lines.map((line, i) => (
        <div
          key={i}
          className={clsx(
            '-mx-3 px-3',
            line.type === 'removed' && 'bg-[rgba(235,94,84,0.14)] text-accent-red',
            line.type === 'added' && 'bg-[rgba(58,180,142,0.14)] text-accent-green',
            line.type === 'normal' && 'text-[var(--text-muted)]',
            added && line.type === 'removed' && 'text-[var(--text-muted)]'
          )}
        >
          <span className="inline-block w-6 text-right mr-3 select-none text-[var(--text-soft)]">{i + 1}</span>
          {line.text || ' '}
        </div>
      ))}
    </pre>
  );

  return (
    <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
      <div className="grid grid-cols-2">
        <div className="border-r border-[var(--border)]">
          <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] tracking-wider text-accent-red">
            {leftTitle}
          </div>
          {render(left, false)}
        </div>
        <div>
          <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] tracking-wider text-accent-green">
            {rightTitle}
          </div>
          {render(right, true)}
        </div>
      </div>
    </div>
  );
}

export default function DilipaWorkbench({
  report,
  sourceState = 'demo',
}: DilipaWorkbenchProps) {
  const [step, setStep] = useState<number>(1);
  const [selected, setSelected] = useState<number>(0);

  const hasReport = !!report;
  const reportCalls: DilipaCallSite[] = report?.calls ?? [];
  const dangerousCount = report?.dangerous?.length ?? 0;
  const instructionCount = report?.instruction_count;

  /** 当前展示的函数（演示样例数据源）。 */
  const sampleFunc: DilipaSampleFunc =
    DILIPA_SAMPLE_FUNCS[Math.min(selected, DILIPA_SAMPLE_FUNCS.length - 1)];

  /** 当前选中的 call（真实报告数据源）。 */
  const currentCall: DilipaCallSite | null = hasReport
    ? reportCalls[Math.min(selected, Math.max(0, reportCalls.length - 1))] ?? null
    : null;

  /** 列表项统一结构，避免两套渲染分支散落。 */
  const listItems = useMemo(() => {
    if (hasReport) {
      return reportCalls.map((call, index) => ({
        key: `${call.address}-${index}`,
        addr: call.address,
        name: call.target_func,
        tag: call.is_dangerous ? '危险调用' : '普通调用',
      }));
    }
    return DILIPA_SAMPLE_FUNCS.map((func) => ({
      key: func.id,
      addr: func.addr,
      name: func.name,
      tag: func.vulnType.split('·')[0],
    }));
  }, [hasReport, reportCalls]);

  const pick = (index: number): void => {
    setSelected(index);
    setStep(2);
  };

  const reset = (): void => {
    setStep(1);
    setSelected(0);
  };

  // 有报告时，从报告字段生成「一行 C 调用」示意（明确标注是示意，不是反编译结果）
  const reportOriginalC = currentCall
    ? `// 依据报告字段 target_func 生成的示意行（非反编译结果）\n${currentCall.target_func}(buffer, input);`
    : '';
  const reportPatchedC = currentCall
    ? `// 依据报告字段 safe_alt 生成的示意行（非反编译结果）\n${currentCall.safe_alt ?? '—'}(buffer, input, 63);`
    : '';

  const diff = useMemo(
    () =>
      computeStrDiff(
        hasReport ? reportOriginalC : sampleFunc.originalC,
        hasReport ? reportPatchedC : sampleFunc.patchedC
      ),
    [hasReport, reportOriginalC, reportPatchedC, sampleFunc]
  );

  const changes = hasReport
    ? [
        {
          label: '① 换函数',
          from: currentCall?.target_func ?? '—',
          to: currentCall?.safe_alt ?? '—',
          note: '来自报告字段 target_func → safe_alt',
        },
        {
          label: '② 漏洞类别编号',
          from: '（报告字段）',
          to: currentCall?.cwe ?? '—',
          note: '缺失时显示「—」，不猜测',
        },
        {
          label: '③ 输出变更清单',
          from: '（无）',
          to: `changes[] · ${dangerousCount} 条危险调用`,
          note: '本阶段只列出文本建议，不写回二进制',
        },
      ]
    : sampleFunc.changes;

  return (
    <div className="u-panel overflow-hidden">
      {/* 顶栏：三步进度 + 来源标签 */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10.5px] tracking-wider text-[var(--brand-500)]">
              DILIPA · 三步预览
            </span>
            <SourceBadge state={sourceState} />
            <span className="font-mono text-[10.5px] text-[var(--text-soft)]">
              {hasReport ? `数据来源：dilipa analyze · ${report?.path ?? '—'}` : '数据来源：预置演示样例'}
            </span>
          </div>
          <button onClick={reset} className="u-btn u-btn-ghost !py-1.5 !px-3 !text-[11.5px]">
            <RefreshCw size={12} />
            重置
          </button>
        </div>

        <div className="px-4 pb-4 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((item, i) => {
            const active = step === item.id;
            const done = step > item.id;
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && (
                  <span className={clsx('w-6 h-px', done ? 'bg-[var(--brand-500)]' : 'bg-[var(--border)]')} />
                )}
                <button
                  type="button"
                  onClick={() => step >= item.id && setStep(item.id)}
                  disabled={step < item.id}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors',
                    active && 'bg-brand-500/15 text-[var(--brand-500)] border border-brand-500/40',
                    done && !active && 'text-[var(--brand-500)]',
                    !active && !done && 'text-[var(--text-soft)] hover:text-[var(--text-muted)]'
                  )}
                >
                  <Icon size={11} />
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[440px]">
        {/* 左栏：函数 / call 列表 */}
        <aside className="border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--bg-soft)]">
          <div className="p-3">
            <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
              {hasReport ? '报告里的 call' : '演示样例函数'}
            </p>
            {listItems.length === 0 ? (
              <p className="u-lesson-note">{NO_CALLS_HINT}</p>
            ) : (
              <div className="space-y-0.5">
                {listItems.map((item, index) => {
                  const active = selected === index;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => pick(index)}
                      className={clsx(
                        'w-full text-left px-2.5 py-2 rounded-[4px] transition-colors border',
                        active
                          ? 'bg-brand-500/10 border-brand-500/40'
                          : 'border-transparent hover:bg-[var(--bg-hover)]'
                      )}
                    >
                      <span className="font-mono text-[10px] text-[var(--text-soft)]">{item.addr}</span>
                      <div className={clsx('font-mono text-[12.5px] mt-0.5 truncate', active ? 'text-[var(--brand-500)]' : 'text-[var(--text)]')}>
                        {item.name}()
                      </div>
                      <div className="text-[10.5px] text-accent-red mt-0.5 truncate">{item.tag}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 文件元信息：全部来自 report 或明确标注演示样例 */}
          <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
            <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">报告信息</p>
            <dl className="space-y-1 font-mono text-[11px]">
              {[
                { k: 'tool', v: hasReport ? report?.tool ?? '—' : '演示样例' },
                { k: 'version', v: hasReport ? report?.version ?? '—' : '—' },
                { k: 'arch', v: hasReport ? report?.arch ?? '—' : 'x86-64（示意）' },
                { k: 'bits', v: hasReport ? String(report?.bits ?? '—') : '64（示意）' },
                { k: 'cmd', v: hasReport ? report?.cmd ?? '—' : 'analyze（示意）' },
              ].map((row) => (
                <div key={row.k} className="flex justify-between gap-2">
                  <dt className="text-[var(--text-soft)]">{row.k}</dt>
                  <dd className="text-[var(--text-muted)] truncate">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        {/* 主栏：三步内容 */}
        <main className="p-5 md:p-6 min-w-0">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-semibold">① 选择要看的函数</h3>
                <SourceBadge state={sourceState} />
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                {hasReport
                  ? '下面每一条都来自你导入的报告对象（calls 字段）。点一条，看看它的名字和建议换成什么。'
                  : '下面是课前备好的演示样例函数，不是真实分析结果。点一条，看它原来怎么写的、建议改成什么。'}
              </p>
              <div className="border-t border-[var(--border)]">
                {listItems.length === 0 ? (
                  <p className="py-6 text-[13px] text-[var(--text-muted)]">{NO_CALLS_HINT}</p>
                ) : (
                  listItems.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => pick(index)}
                      className="w-full grid grid-cols-[auto_1fr_20px] gap-4 py-5 border-b border-[var(--border)] text-left hover:bg-[var(--bg-hover)] transition-colors items-center"
                    >
                      <span className="u-flow-tick" aria-hidden="true" />
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono text-[14px] font-semibold text-[var(--text)]">{item.name}()</span>
                          <span className="font-mono text-[10.5px] text-[var(--text-soft)]">{item.addr}</span>
                        </div>
                        <p className="text-[11px] font-mono text-accent-red">{item.tag}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-soft)]" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-semibold">② 看 C 代码（只读）</h3>
                <SourceBadge state={sourceState} />
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                {hasReport
                  ? '下面这行是依据报告字段生成的示意文本，方便对照；它不是反编译结果，也不代表程序里真的长这样。'
                  : '红标行是不检查长度的调用。点术语可以看白话解释。本屏只读，不修改任何文件。'}
              </p>

              <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
                <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-[var(--text-muted)] flex justify-between gap-3 flex-wrap">
                  <span>{hasReport ? currentCall?.target_func ?? '—' : sampleFunc.name} · 原始写法</span>
                  <span>{hasReport ? currentCall?.address ?? '—' : `${sampleFunc.file} :: ${sampleFunc.addr}`}</span>
                </div>
                <div className="p-3 text-[12px] leading-[1.75] font-mono">
                  {(hasReport ? reportOriginalC : sampleFunc.originalC).split('\n').map((line, i) => {
                    const danger = !hasReport && sampleFunc.dangerLineIdx.includes(i);
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'flex gap-3 rounded-[2px] px-2 py-0.5',
                          danger && 'bg-accent-red/10 border-l-2 border-l-accent-red'
                        )}
                      >
                        <span className="w-5 text-right text-[var(--text-soft)] select-none">{i + 1}</span>
                        <span className={danger ? 'text-accent-red' : 'text-[var(--text-muted)]'}>{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <TermButton termId="strcpy" />
                <TermButton termId="call" />
                <span className="u-lesson-note">点一下看白话解释</span>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-semibold">③ 补丁方案预览 · 变更清单</h3>
                <SourceBadge state={sourceState} />
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                本阶段只输出「改了什么」的文本清单，<strong className="text-[var(--text)]">不写入二进制</strong>。
                真实二进制重写与等价性校验属于后续工作。
              </p>

              <DiffColumns
                left={diff.left}
                right={diff.right}
                leftTitle="原始写法"
                rightTitle="建议改成"
              />

              {/* 变更清单 */}
              <div className="rounded-md overflow-hidden border border-[var(--border)]">
                <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-[var(--text-soft)]">
                  变更清单 · changes（共 {changes.length} 条）
                </div>
                <table className="w-full text-[11.5px] font-mono">
                  <thead className="text-[var(--text-soft)] bg-[var(--bg-soft)]">
                    <tr>
                      <th className="text-left px-3 py-2 w-28">步骤</th>
                      <th className="text-left px-3 py-2 w-[30%]">修改前</th>
                      <th className="text-left px-3 py-2 w-[30%]">修改后</th>
                      <th className="text-left px-3 py-2">说明</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-muted)]">
                    {changes.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 text-brand-400">{row.label}</td>
                        <td className="px-3 py-2 text-accent-red">{row.from}</td>
                        <td className="px-3 py-2 text-accent-green">{row.to}</td>
                        <td className="px-3 py-2">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 报告统计：全部来自 report 对象 */}
              {hasReport && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'call 总数', value: reportCalls.length },
                    { label: '危险调用', value: dangerousCount },
                    { label: '指令数', value: instructionCount ?? '—' },
                  ].map((item) => (
                    <div key={item.label} className="u-panel p-3 text-center">
                      <div className="font-mono text-[18px] text-[var(--text)]">{item.value}</div>
                      <div className="u-lesson-note mt-1">{item.label} · 来自报告</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 替代旧的三个写死 'OK' */}
              <div className="grid md:grid-cols-3 gap-3">
                {['字节对比', '重反汇编核对', '功能回归测试'].map((label) => (
                  <div key={label} className="border border-[var(--border)] rounded-md p-3 flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
                    <span className="font-mono text-[11px] text-[var(--text-soft)]">未执行 · 本阶段仅预览</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 后续工作：统一标「规划中」 */}
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <SourceBadge state="planned" />
              <span className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">后续工作（本次未实现）</span>
            </div>
            <ul className="space-y-1.5">
              {DILIPA_FUTURE_WORK.map((item) => (
                <li key={item} className="u-lesson-note">· {item}</li>
              ))}
            </ul>
          </div>
        </main>
      </div>

      {/* 底部：步骤导航 + 口径说明 */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="u-btn u-btn-ghost !py-1.5 !px-3 !text-[11.5px]">
                <ArrowLeft size={12} />
                上一步
              </button>
            )}
          </div>
          <p className="font-mono text-[11px] text-[var(--text-soft)]">
            Step {step}/{STEPS.length} · <span className="text-[var(--brand-500)]">{STEPS[step - 1].label}</span>
          </p>
          <div>
            {step < STEPS.length && (
              <button onClick={() => setStep(step + 1)} className="u-btn u-btn-primary !py-1.5 !px-3 !text-[11.5px]">
                下一步
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="px-5 pb-3 text-center font-mono text-[10.5px] text-[var(--text-soft)]">
          {DILIPA_SAMPLE_NOTE}
        </p>
      </div>
    </div>
  );
}
