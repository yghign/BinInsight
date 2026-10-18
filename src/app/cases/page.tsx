import Link from 'next/link';
import { cases } from '@/data/cases';

export const metadata = {
  title: '案例展示 | BinInsight',
  description: '可复现的逆向工程与漏洞防护实战案例，下载目标文件本地实操，对照标准答案检验学习成果。',
};

const tips = [
  {
    label: '先学理论',
    desc: '先完成教学引导层的四步学习，掌握基础概念和分析方法后再动手实操。',
    href: '/learn',
    linkText: '进入学习路径',
  },
  {
    label: '独立分析',
    desc: '下载案例文件后先独立分析，尝试自己定位漏洞和编写 exploit，再对照报告检验。',
    href: '/tools',
    linkText: '使用分析工具',
  },
  {
    label: '对照验证',
    desc: '对比自己的分析结果和案例报告，找出遗漏的点，理解防护建议背后的原理。',
    href: '/learn/step4',
    linkText: '复习防护策略',
  },
];

export default function CasesPage() {
  return (
    <div>
      {/* Header */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">案例展示</span>
          </div>
          <p className="u-eyebrow mb-2">Case Studies</p>
          <h1 className="u-display text-3xl md:text-[40px] mb-3">案例展示</h1>
          <p className="text-[15px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            下载目标文件，本地复现分析流程，对照完整分析报告和预期结果检验学习成果。
            所有案例均配有详细的分析步骤和防护建议。
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 md:py-20">
        {/* 案例列表：编号大行 */}
        <div className="border-t border-[var(--border)]">
          {cases.map((caseItem) => (
            <Link
              key={caseItem.id}
              href={`/cases/${caseItem.id}`}
              className="group grid grid-cols-[auto_1fr] md:grid-cols-[64px_1fr_220px] gap-x-5 md:gap-x-10 py-9 md:py-11 border-b border-[var(--border)] items-start md:items-center"
            >
              <span className="u-flow-tick" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl md:text-[26px] font-semibold tracking-tight group-hover:text-[var(--brand-500)] transition-colors">
                    {caseItem.title}
                  </h3>
                  <span
                    className={`u-tag ${
                      caseItem.difficulty === '新手'
                        ? '!text-accent-green !border-[rgba(58,180,142,0.4)]'
                        : '!text-accent-orange !border-[rgba(235,150,80,0.4)]'
                    }`}
                  >
                    {caseItem.difficulty}
                  </span>
                </div>
                <p className="text-sm md:text-[14px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-3">
                  {caseItem.description}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="u-tag !text-brand-400">{caseItem.vulnType}</span>
                  {caseItem.knowledge.slice(0, 3).map((k) => (
                    <span key={k} className="u-tag">{k}</span>
                  ))}
                  {caseItem.knowledge.length > 3 && (
                    <span className="u-tag">+{caseItem.knowledge.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="col-span-2 md:col-span-1 md:text-right mt-4 md:mt-0">
                <span className="inline-flex items-center gap-1 text-[13px] text-[var(--text-soft)] group-hover:text-[var(--brand-500)] group-hover:gap-2 transition-all">
                  查看案例 <span className="font-mono" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 学习建议：箭头三步链 */}
        <div className="mt-16">
          <p className="u-eyebrow mb-4">METHOD — 学习建议</p>
          <div className="u-panel overflow-hidden">
            <div className="grid md:grid-cols-3">
              {tips.map((tip, idx) => (
                <div
                  key={tip.label}
                  className={`relative p-6 md:p-7 ${
                    idx > 0 ? 'border-t md:border-t-0 md:border-l border-[var(--border)]' : ''
                  }`}
                >
                  {idx < tips.length - 1 && (
                    <span
                      className="hidden md:block absolute -left-[7px] top-1/2 -translate-y-1/2 font-mono text-[var(--border-soft)] bg-[var(--bg-card)] px-[2px]"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                  <span className="u-flow-tick" aria-hidden="true" />
                  <h3 className="text-[15px] font-semibold mt-2 mb-1.5">{tip.label}</h3>
                  <p className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-3">{tip.desc}</p>
                  <Link
                    href={tip.href}
                    className="u-link"
                  >
                    {tip.linkText}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
