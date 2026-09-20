import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FileCode,
  ChevronRight,
  Download,
  Shield,
  Target,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { getCaseById, cases } from '@/data/cases';
import CodeBlock from '@/components/CodeBlock';

interface CasePageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return cases.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }: CasePageProps) {
  const caseData = getCaseById(params.id);
  if (!caseData) {
    return { title: '案例未找到 | BinInsight' };
  }
  return {
    title: `${caseData.title} | BinInsight 案例`,
    description: caseData.description,
  };
}

export default function CaseDetailPage({ params }: CasePageProps) {
  const caseData = getCaseById(params.id);

  if (!caseData) {
    notFound();
  }

  const difficultyColor =
    caseData.difficulty === '新手'
      ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
      : 'bg-accent-orange/15 text-accent-orange border-accent-orange/30';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bg-soft border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              首页
            </Link>
            <ChevronRight size={14} />
            <Link href="/cases" className="hover:text-white transition-colors">
              案例展示
            </Link>
            <ChevronRight size={14} />
            <span className="text-accent-green truncate max-w-xs">{caseData.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${difficultyColor}`}>
              {caseData.difficulty}
            </span>
            <span className="px-3 py-1 text-sm font-mono rounded-full bg-bg-card border border-border text-gray-300">
              {caseData.vulnType}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{caseData.title}</h1>
          <p className="text-gray-400 max-w-3xl leading-relaxed">{caseData.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Download Section */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-green/15 flex items-center justify-center flex-shrink-0">
                <Download size={24} className="text-accent-green" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">下载目标文件</h2>
                <p className="text-gray-400 text-sm">
                  下载案例文件到本地，使用 Ghidra、Mutagen 或其他工具独立分析
                </p>
              </div>
            </div>
            <a
              href={caseData.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-green hover:bg-accent-green/80 text-bg font-semibold rounded-xl transition-colors shadow-lg shadow-accent-green/20"
            >
              <Download size={18} />
              下载案例包
            </a>
          </div>
          <div className="mt-4 p-3 bg-accent-orange/10 border border-accent-orange/20 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle size={16} className="text-accent-orange flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-orange leading-relaxed">
                请注意：案例文件包含真实的漏洞程序，仅供学习研究使用。
                请在隔离环境中运行，不要部署到生产环境。
                详见 <Link href="/terms" className="underline">使用条款</Link>。
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Report */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center">
              <FileCode size={20} className="text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold">分析报告</h2>
          </div>

          {/* Overview */}
          <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target size={18} className="text-brand-400" />
              目标概述
            </h3>
            <p className="text-gray-300 leading-relaxed">{caseData.overview}</p>

            {/* Knowledge tags */}
            <div className="mt-5">
              <div className="text-sm text-gray-400 mb-2">关联知识点：</div>
              <div className="flex flex-wrap gap-2">
                {caseData.knowledge.map((k) => (
                  <span
                    key={k}
                    className="text-xs px-2.5 py-1 bg-bg-soft rounded-md text-gray-300 border border-border"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Steps */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileCode size={18} className="text-brand-400" />
              分析步骤
            </h3>

            {caseData.analysisSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-bg-card border border-border rounded-2xl p-6 md:p-8 relative step-line"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-3">{step.title}</h4>
                    <p className="text-gray-300 leading-relaxed mb-4">{step.content}</p>
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

        {/* Protection */}
        <section className="mb-12">
          <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <Shield size={18} className="text-accent-green" />
              防护建议
            </h3>
            <ul className="space-y-3">
              {caseData.protection.map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <CheckCircle2 size={18} className="text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Expected Result */}
        <section className="mb-12">
          <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target size={18} className="text-accent-purple" />
              预期结果
            </h3>
            <p className="text-gray-300 leading-relaxed">{caseData.expectedResult}</p>

            <div className="mt-5 p-4 bg-bg-soft border border-border rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <BookOpen size={14} />
                <span>提示</span>
              </div>
              <p className="text-sm text-gray-400">
                在对照答案之前，建议先独立完成分析。你可以使用 Mutagen 工具自动扫描，
                也可以手动使用 Ghidra 进行静态分析，然后将你的结果与本报告进行对比。
              </p>
            </div>
          </div>
        </section>

        {/* Related Knowledge */}
        <section className="mb-12">
          <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <BookOpen size={18} className="text-brand-400" />
              关联知识点
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {caseData.relatedSteps.map((step) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="flex items-center justify-between p-4 bg-bg-soft border border-border rounded-xl hover:border-brand-500/40 transition-colors group"
                >
                  <span className="text-sm font-medium">{step.label}</span>
                  <ArrowRight
                    size={16}
                    className="text-gray-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-border">
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            返回案例列表
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors"
          >
            试试分析工具
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
