import Bubbles from '@/components/Bubbles';
import PathPreview from './PathPreview';
import StepStatus from './StepStatus';
import type { VulnPathNode } from '@/data/reference';

/**
 * 工作台外壳 —— 左 7 / 右 5 非对称双栏布局。
 * 右侧 sticky：长页滚动时面板始终可见。
 * 温暖泡泡作为绝对定位背景层，不挡内容。
 */

interface Props {
  slug: string;
  node: VulnPathNode;
  children: React.ReactNode;
  glossLinks?: { slug: string; term: string }[];
}

export default function WorkbenchShell({ slug, node, children, glossLinks = [] }: Props) {
  return (
    <div className="relative">
      {/* 温暖泡泡氛围层 */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Bubbles count={10} />
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
        {/* 左侧 7 栏 */}
        <main className="lg:col-span-7 min-w-0 space-y-14">
          {children}
        </main>

        {/* 右侧 5 栏 —— sticky + 最大高度 + 滚动 */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start lg:max-h-[80vh] lg:overflow-y-auto space-y-10">
          <section className="space-y-3">
            <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">PROGRESS</div>
            <StepStatus slug={slug} />
            <p className="font-mono text-[10.5px] text-[var(--text-soft)] leading-relaxed">
              点击圆点切换完成状态 · 进度存在 localStorage
            </p>
          </section>

          <section className="space-y-3">
            <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">PATH</div>
            <PathPreview currentSlug={slug} />
          </section>

          {glossLinks.length > 0 && (
            <section className="space-y-3">
              <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">RELATED</div>
              <ul className="space-y-2">
                {glossLinks.map((g) => (
                  <li key={g.slug}>
                    <a
                      href={`/reference/glossary#${g.slug}`}
                      className="font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-2 transition-colors"
                    >
                      → {g.term}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
