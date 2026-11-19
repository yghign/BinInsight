/** 真实案例参考（架构 07 §3.2 / PRD §2.6）：可折叠、默认收起；栏头固定免责句；不挂 SourceBadge（外部资料）。 */
import type { RealCaseRef } from '@/data/library/types';

const CRED_TONE: Record<RealCaseRef['credibility'], string> = {
  权威: '!text-accent-green',
  平台: '!text-brand-400',
  社区: '!text-accent-orange',
};

export default function RealCasesBlock({ cases }: { cases: RealCaseRef[] }) {
  if (!cases || cases.length === 0) return null;
  return (
    <details className="u-panel p-5 md:p-6 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="u-eyebrow !mb-0">真实案例参考（站外链接，可展开）</span>
        <span className="text-[12px] text-[var(--brand-500)]">展开 +</span>
      </summary>
      <p className="text-[12px] text-[var(--text-soft)] mt-4 mb-4 leading-relaxed">
        外部链接，本站不保证长期有效；内容与本站演示样例无关，仅作延伸阅读。本站不收集、不存储你的信息。
      </p>
      <div className="space-y-3">
        {cases.map((rc) => (
          <div key={rc.refId} className="border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="u-tag !text-[11px] font-mono">{rc.refId}</span>
              <span className={`u-tag !text-[11px] ${CRED_TONE[rc.credibility]}`}>{rc.credibility}</span>
              <span className="text-[12px] text-[var(--text-soft)]">{rc.lesson}</span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{rc.summary}</p>
            <p className="text-[12px] text-[var(--text-soft)] mt-1">来源：{rc.source}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
