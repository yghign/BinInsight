import Link from 'next/link';
import { FileCode, ChevronRight, ArrowRight, BookOpen, Tag, Lightbulb } from 'lucide-react';
import { cases } from '@/data/cases';

export const metadata = {
  title: '案例展示 | BinInsight',
  description: '可复现的逆向工程与漏洞防护实战案例，下载目标文件本地实操，对照标准答案检验学习成果。',
};

export default function CasesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bg-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              首页
            </Link>
            <ChevronRight size={14} />
            <span className="text-accent-green">案例展示</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">案例展示</h1>
          <p className="text-gray-400 max-w-2xl">
            下载目标文件，本地复现分析流程，对照完整分析报告和预期结果检验学习成果。
            所有案例均配有详细的分析步骤和防护建议。
          </p>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <Link
              key={caseItem.id}
              href={`/cases/${caseItem.id}`}
              className="group bg-bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-accent-green/40 hover:shadow-xl hover:shadow-accent-green/5 hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="h-2 bg-gradient-to-r from-accent-green/60 to-brand-500/60" />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-green/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCode size={24} className="text-accent-green" />
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      caseItem.difficulty === '新手'
                        ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                        : 'bg-accent-orange/15 text-accent-orange border-accent-orange/30'
                    }`}
                  >
                    {caseItem.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-accent-green transition-colors">
                  {caseItem.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                  {caseItem.description}
                </p>

                {/* Vuln type tag */}
                <div className="flex items-center gap-1.5 mb-4">
                  <Tag size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-400 font-mono">{caseItem.vulnType}</span>
                </div>

                {/* Knowledge tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {caseItem.knowledge.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="text-xs px-2 py-0.5 bg-bg-soft rounded-md text-gray-400"
                    >
                      {k}
                    </span>
                  ))}
                  {caseItem.knowledge.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-bg-soft rounded-md text-gray-500">
                      +{caseItem.knowledge.length - 3}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-accent-green font-medium text-sm group-hover:gap-3 transition-all">
                  查看详情
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-14 bg-bg-card border border-border rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb size={20} className="text-accent-orange" />
            学习建议
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-bg-soft border border-border rounded-xl p-5">
              <div className="text-sm text-accent-green font-semibold mb-2">Step 1</div>
              <div className="font-bold mb-2">先学理论</div>
              <p className="text-sm text-gray-400">
                建议先完成教学引导层的四步学习，掌握基础概念和分析方法后再动手实操。
              </p>
              <Link
                href="/learn"
                className="inline-flex items-center gap-1 text-accent-green text-sm mt-3 hover:underline"
              >
                <BookOpen size={14} />
                进入学习路径
              </Link>
            </div>
            <div className="bg-bg-soft border border-border rounded-xl p-5">
              <div className="text-sm text-brand-400 font-semibold mb-2">Step 2</div>
              <div className="font-bold mb-2">独立分析</div>
              <p className="text-sm text-gray-400">
                下载案例文件后先独立分析，尝试自己定位漏洞和编写 exploit，再对照报告检验。
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1 text-brand-400 text-sm mt-3 hover:underline"
              >
                <FileCode size={14} />
                使用分析工具
              </Link>
            </div>
            <div className="bg-bg-soft border border-border rounded-xl p-5">
              <div className="text-sm text-accent-purple font-semibold mb-2">Step 3</div>
              <div className="font-bold mb-2">对照验证</div>
              <p className="text-sm text-gray-400">
                对比自己的分析结果和案例报告，找出遗漏的点，理解防护建议背后的原理。
              </p>
              <Link
                href="/learn/step4"
                className="inline-flex items-center gap-1 text-accent-purple text-sm mt-3 hover:underline"
              >
                <BookOpen size={14} />
                复习防护策略
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
