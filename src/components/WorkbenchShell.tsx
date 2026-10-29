import PathPreview from './PathPreview';
import StepStatus from './StepStatus';
import type { VulnPathNode } from '@/data/reference';

/**
 * 工作台外壳 —— 左 7 / 右 5 非对称双栏布局。
 * 服务端组件（无 hook），接收 client 子组件。
 *
 * 左栏（7/12）：四段式标题 + 内容 children
 * 右栏（5/12）：当前工作台进度 + 完整路径预览 + 相关知识点
 *
 * 视觉严格遵循：无渐变、无玻璃卡片、无 emoji、无三列功能卡、
 *              路径节点用线宽+透明度区分状态。
 */

interface Props {
  /** 左侧的工作台内容（四个 section 按顺序：原理/演示/动手/防御） */
  slug: string;
  node: VulnPathNode;
  children: React.ReactNode;
  /** 右侧"相关知识点"跳转链接（可选） */
  glossLinks?: { slug: string; term: string }[];
}

export default function WorkbenchShell({ slug, node, children, glossLinks = [] }: Props) {
  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
      {/* 左侧 7 栏 —— 四段式主内容 */}
      <main className="lg:col-span-7 min-w-0 space-y-14">
        {children}
      </main>

      {/* 右侧 5 栏 —— 路径面板 + 进度 + 相关知识点 */}
      <aside className="lg:col-span-5 space-y-10">
        {/* 当前工作台进度 */}
        <section className="space-y-3">
          <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">PROGRESS</div>
          <StepStatus slug={slug} />
          <p className="font-mono text-[10.5px] text-[var(--text-soft)] leading-relaxed">
            点击圆点切换完成状态 · 进度存在 localStorage
          </p>
        </section>

        {/* 完整路径预览 */}
        <section className="space-y-3">
          <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">PATH</div>
          <PathPreview currentSlug={slug} />
        </section>

        {/* 相关知识点 glossary */}
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
  );
}
