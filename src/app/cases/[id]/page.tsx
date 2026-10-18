import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCaseById, cases } from '@/data/cases';
import CodeBlock from '@/components/CodeBlock';

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return cases.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: CasePageProps) {
  const { id } = await params;
  const caseData = getCaseById(id);
  if (!caseData) {
    return { title: '案例未找到 | BinInsight' };
  }
  return {
    title: `${caseData.title} | BinInsight 案例`,
    description: caseData.description,
  };
}

export default async function CaseDetailPage({ params }: CasePageProps) {
  const { id } = await params;
  const caseData = getCaseById(id);

  if (!caseData) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-6 flex-wrap">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <Link href="/cases" className="hover:text-[var(--text)] transition-colors">案例展示</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)] truncate max-w-[240px]">{caseData.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`u-tag ${
                caseData.difficulty === '新手'
                  ? '!text-accent-green !border-[rgba(58,180,142,0.4)]'
                  : '!text-accent-orange !border-[rgba(235,150,80,0.4)]'
              }`}
            >
              {caseData.difficulty}
            </span>
            <span className="u-tag !text-brand-400">{caseData.vulnType}</span>
          </div>

          <h1 className="u-display text-2xl md:text-[36px] mb-4">{caseData.title}</h1>
          <p className="text-[14px] md:text-[15px] text-[var(--text-muted)] max-w-3xl leading-relaxed">
            {caseData.description}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 md:py-16">
        {/* 下载条 */}
        <div className="u-panel p-6 md:p-7 mb-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="u-eyebrow mb-1.5">Download</p>
              <h2 className="text-lg font-semibold mb-1">下载目标文件</h2>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                下载案例文件到本地，使用 Ghidra、Mutagen 或其他工具独立分析。
              </p>
            </div>
            <a
              href={caseData.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-primary flex-shrink-0"
            >
              下载案例包
              <span className="font-mono" aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <p className="font-mono text-[11px] leading-relaxed text-accent-orange">
              [注意] 案例文件包含真实的漏洞程序，仅供学习研究使用，请在隔离环境中运行，不要部署到生产环境。详见{' '}
              <Link href="/terms" className="underline underline-offset-2">使用条款</Link>。
            </p>
          </div>
        </div>

        {/* 分析报告 */}
        <section className="mb-14">
          <p className="u-eyebrow mb-3">Analysis</p>
          <h2 className="u-display text-2xl md:text-3xl mb-8">分析报告</h2>

          {/* 目标概述 */}
          <div className="mb-10">
            <h3 className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-3">
              目标概述 · OVERVIEW
            </h3>
            <p className="text-[14px] leading-[1.85] text-[var(--text-muted)] mb-5">
              {caseData.overview}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-[var(--text-soft)] mr-1">关联知识点</span>
              {caseData.knowledge.map((k) => (
                <span key={k} className="u-tag">{k}</span>
              ))}
            </div>
          </div>

          {/* 分析步骤：编号行 */}
          <h3 className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-2">
            分析步骤 · PROCEDURE
          </h3>
          <div className="border-t border-[var(--border)]">
            {caseData.analysisSteps.map((step, idx) => (
              <div key={idx} className="border-b border-[var(--border)] py-8">
                <div className="grid grid-cols-[40px_1fr] md:grid-cols-[56px_1fr] gap-3 md:gap-6">
                  <span className="u-flow-tick" aria-hidden="true" />
                  <div>
                    <h4 className="text-[17px] font-semibold mb-3">{step.title}</h4>
                    <p className="text-[13.5px] leading-[1.8] text-[var(--text-muted)] mb-5">
                      {step.content}
                    </p>
                    {step.code && (
                      <CodeBlock
                        code={step.code.code}
                        language={step.code.language}
                        title={step.code.title}
                        highlightLines={step.code.highlightLines}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 防护建议 */}
        <section className="mb-14">
          <p className="u-eyebrow mb-3">Protection</p>
          <h2 className="u-display text-2xl md:text-3xl mb-6">防护建议</h2>
          <div className="border-t border-[var(--border)]">
            {caseData.protection.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[40px_1fr] md:grid-cols-[56px_1fr] gap-3 md:gap-6 py-4 border-b border-[var(--border)] items-baseline"
              >
                <span className="u-flow-tick" aria-hidden="true" />
                <span className="text-[13.5px] leading-[1.75] text-[var(--text-muted)]">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 预期结果 */}
        <section className="mb-14">
          <p className="u-eyebrow mb-3">Expected Result</p>
          <h2 className="u-display text-2xl md:text-3xl mb-6">预期结果</h2>
          <div className="u-panel p-6 md:p-7">
            <p className="text-[13.5px] leading-[1.85] text-[var(--text-muted)]">
              {caseData.expectedResult}
            </p>
            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <p className="font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-2">提示 · HINT</p>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                在对照答案之前，建议先独立完成分析。你可以使用 Mutagen 工具自动扫描，
                也可以手动使用 Ghidra 进行静态分析，然后将你的结果与本报告进行对比。
              </p>
            </div>
          </div>
        </section>

        {/* 关联学习 */}
        <section className="mb-14">
          <p className="u-eyebrow mb-3">RELATED — 关联学习路径</p>
          <div className="border-t border-[var(--border)]">
            {caseData.relatedSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className="group flex items-center justify-between gap-4 py-4 border-b border-[var(--border)]"
              >
                <span className="font-mono text-[13px] group-hover:text-[var(--brand-500)] transition-colors">
                  {step.label}
                </span>
                <span
                  className="font-mono text-[var(--text-soft)] group-hover:text-[var(--brand-500)] group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-[var(--border)]">
          <Link href="/cases" className="u-btn u-btn-ghost">
            <span className="font-mono" aria-hidden="true">←</span>
            返回案例列表
          </Link>
          <Link href="/tools" className="u-btn u-btn-ghost">
            试试分析工具
            <span className="font-mono" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
