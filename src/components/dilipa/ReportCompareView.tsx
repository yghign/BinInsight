'use client';

import clsx from 'clsx';
import type { DilipaCallSite, NormalizedReport } from '@/data/dilipa-report';
import { NO_CALLS_HINT } from '@/data/dilipa-report';
import { computeStrDiff, type DiffLine } from '@/lib/str-diff';
import SourceBadge from '@/components/SourceBadge';
import TermButton from '@/components/TermButton';

/**
 * 网站 ↔ Dilipa 对照视图（T09）。
 *
 * - 左侧 L2：逐条列出报告里的 call（address / target_func / is_dangerous / safe_alt / cwe）
 * - 右侧 L3：把每条危险调用的 target_func → safe_alt 做成并排对照，复用 lib/str-diff
 * - 顶部：SourceBadge +「数据来源：dilipa analyze」+ normalize 给出的 warnings
 * - 所有统计数字都来自 report 对象；calls 为空时显示 NO_CALLS_HINT，绝不伪装成分析成功
 *
 * 本组件只读，不发网络请求、不写 localStorage、不修改报告对象。
 */

export interface ReportCompareViewProps {
  normalized: NormalizedReport;
}

/** 用报告字段拼出「修改前 / 修改后」两列文本，再交给行级 diff。 */
function buildDiffColumns(calls: DilipaCallSite[]): { left: DiffLine[]; right: DiffLine[] } {
  const before: string[] = calls.map((call) => `${call.target_func}(buffer, input);`);
  const after: string[] = calls.map(
    (call) => `${call.safe_alt ?? call.target_func}(buffer, input, 63);`
  );
  return computeStrDiff(before.join('\n'), after.join('\n'));
}

function DiffColumn({ lines, side }: { lines: DiffLine[]; side: 'left' | 'right' }) {
  return (
    <pre className="p-3 text-[11.5px] leading-[1.8] font-mono overflow-x-auto max-h-[300px]">
      {lines.map((line, i) => (
        <div
          key={i}
          className={clsx(
            '-mx-3 px-3',
            line.type === 'removed' && side === 'left' && 'bg-[rgba(235,94,84,0.14)] text-accent-red',
            line.type === 'added' && side === 'right' && 'bg-[rgba(58,180,142,0.14)] text-accent-green',
            line.type === 'normal' && 'text-[var(--text-muted)]',
            line.type === 'removed' && side === 'right' && 'text-[var(--text-soft)]',
            line.type === 'added' && side === 'left' && 'text-[var(--text-soft)]'
          )}
        >
          <span className="inline-block w-5 text-right mr-3 select-none text-[var(--text-soft)]">{i + 1}</span>
          {line.text || ' '}
        </div>
      ))}
    </pre>
  );
}

export default function ReportCompareView({ normalized }: ReportCompareViewProps) {
  const { report, warnings, state } = normalized;
  const calls = report.calls;
  const dangerous = report.dangerous;
  const diff = buildDiffColumns(dangerous.length > 0 ? dangerous : calls);

  return (
    <div className="space-y-5">
      {/* 顶部：来源标签 + 数据来源说明 */}
      <div className="flex items-center gap-3 flex-wrap">
        <SourceBadge state={state} />
        <span className="font-mono text-[12px] text-[var(--text)]">数据来源：dilipa analyze</span>
        <span className="font-mono text-[11px] text-[var(--text-soft)]">
          {report.path !== '—' ? report.path : '内置样例'} · v{report.version} · {report.arch} / {report.bits || '—'} bit
        </span>
      </div>

      {/* warnings：由 normalize 给出，逐条如实展示 */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, i) => (
            <div key={i} className="u-warning-card">
              <span className="font-mono text-[11px] mr-2 text-[var(--accent-orange)]">提示 {i + 1}</span>
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* 统计：全部来自 report 对象，不硬编码 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'call 总数', value: calls.length },
          { label: '危险调用', value: dangerous.length },
          { label: '指令数', value: report.instruction_count ?? '—' },
          { label: '节区数', value: report.sections.length },
        ].map((item) => (
          <div key={item.label} className="u-panel p-3 text-center">
            <div className="font-mono text-[18px] text-[var(--text)]">{item.value}</div>
            <div className="u-lesson-note mt-1">{item.label} · 来自报告字段</div>
          </div>
        ))}
      </div>

      {/* calls 为空：明确提示已知限制，不伪装成功 */}
      {calls.length === 0 ? (
        <div className="u-error-card">
          <p className="font-mono text-[12px] mb-2 text-accent-red">这份报告没有检测到 call</p>
          <p className="text-[13px] leading-[1.85] text-[var(--text-muted)]">{NO_CALLS_HINT}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左：L2 逐条 call */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-[14px] font-semibold">L2 · 逐条看 call</h3>
              <span className="u-lesson-note">共 {calls.length} 条 · 来自 report.calls</span>
            </div>
            <div className="border border-[var(--border)] rounded-md overflow-hidden max-h-[340px] overflow-y-auto">
              {calls.map((call, i) => (
                <div
                  key={`${call.address}-${i}`}
                  className="u-report-row !cursor-default border-b border-[var(--border)] last:border-b-0 !items-start"
                >
                  <span className="font-mono text-[11px] text-[var(--text-soft)] w-[76px] flex-shrink-0">{call.address}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx('font-mono text-[12.5px]', call.is_dangerous ? 'text-accent-red' : 'text-[var(--text)]')}>
                        {call.target_plt !== '—' ? call.target_plt : call.target_func}
                      </span>
                      {call.is_dangerous && <span className="u-tag !text-accent-red">危险调用</span>}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)] font-mono flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>函数：{call.target_func}</span>
                      <span>建议换成：{call.safe_alt ?? '—'}</span>
                      <span>类别：{call.cwe ?? '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <TermButton termId="call" />
              <TermButton termId="dangerous-call" />
              <span className="u-lesson-note">点一下看白话解释</span>
            </div>
          </div>

          {/* 右：L3 target_func → safe_alt 并排对照 */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-[14px] font-semibold">L3 · 换成带长度上限的函数</h3>
              <span className="u-lesson-note">行级字符串对比，非语法树对比</span>
            </div>
            <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
              <div className="grid grid-cols-2">
                <div className="border-r border-[var(--border)]">
                  <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] tracking-wider text-accent-red">
                    修改前 · target_func
                  </div>
                  <DiffColumn lines={diff.left} side="left" />
                </div>
                <div>
                  <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] tracking-wider text-accent-green">
                    修改后 · safe_alt
                  </div>
                  <DiffColumn lines={diff.right} side="right" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <TermButton termId="strncpy" />
              <TermButton termId="patch" />
              <span className="u-lesson-note">
                safe_alt 缺失时显示「—」，不猜测替代函数；右侧只是文本建议，不写回二进制
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
