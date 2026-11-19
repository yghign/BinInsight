/** 形态 B 第 2 层：案例演示块（静态文字 + SourceBadge demo，架构 07 §3.2）。 */
import SourceBadge from '@/components/SourceBadge';
import type { CaseDemo } from '@/data/library/types';

export default function CaseDemoBlock({ demo }: { demo: CaseDemo }) {
  return (
    <div className="u-panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <p className="u-eyebrow !mb-0">案例演示 · 看一眼真实现象</p>
        <SourceBadge state="demo" />
      </div>
      <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-muted)] font-mono bg-[var(--bg-soft)] rounded-md p-4 overflow-x-auto">
        {demo.material}
      </pre>
      {demo.note && <p className="text-[12px] text-[var(--text-soft)] mt-3">{demo.note}</p>}
    </div>
  );
}
