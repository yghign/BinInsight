import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sandboxCases, getSandboxById, difficultyTone } from '@/data/sandbox';
import SandboxPlayer from '@/components/SandboxPlayer';

interface SandboxPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return sandboxCases.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: SandboxPageProps) {
  const { id } = await params;
  const sb = getSandboxById(id);
  if (!sb) {
    return { title: '沙箱案例未找到 | BinInsight' };
  }
  return {
    title: `${sb.title} | BinInsight 沙箱`,
    description: sb.brief,
  };
}

export default async function SandboxCasePage({ params }: SandboxPageProps) {
  const { id } = await params;
  const sb = getSandboxById(id);
  if (!sb) {
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
            <span className="text-[var(--text-muted)] truncate max-w-[260px]">{sb.title}</span>
          </div>

          <p className="u-eyebrow mb-2">Sandbox · 在线沙箱</p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`u-tag ${difficultyTone[sb.difficulty]}`}>{sb.difficultyLabel}</span>
            <span className="u-tag !text-brand-400">{sb.vulnType}</span>
            <span className="u-tag">预计 {sb.minutes} 分钟</span>
            <span className="u-tag">{sb.stages.length} 个阶段</span>
          </div>

          <h1 className="u-display text-2xl md:text-[36px] mb-4">{sb.title}</h1>
          <p className="text-[14px] md:text-[15px] text-[var(--text-muted)] max-w-3xl leading-relaxed mb-5">
            {sb.brief}
          </p>

          <div className="u-panel p-5">
            <div className="flex items-start gap-3">
              <span className="u-tag !text-accent-cyan !border-[rgba(0,184,217,0.4)] flex-shrink-0">
                目标
              </span>
              <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed">{sb.objective}</p>
            </div>
          </div>

          <p className="font-mono text-[11px] leading-relaxed text-[var(--text-soft)] mt-4">
            [说明] 全程在浏览器内完成仿真分析，无需下载任何文件。所有选项点错也有解释 —— 大胆点。
          </p>
        </div>
      </div>

      {/* Player */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 md:py-16">
        <SandboxPlayer caseData={sb} />

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-10 mt-14 border-t border-[var(--border)]">
          <Link href="/cases" className="u-btn u-btn-ghost">
            <span className="font-mono" aria-hidden="true">←</span>
            返回案例列表
          </Link>
          <Link href="/learn" className="u-btn u-btn-ghost">
            回到教学路径
            <span className="font-mono" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
