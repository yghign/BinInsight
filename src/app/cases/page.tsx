import Link from 'next/link';
import { cases } from '@/data/cases';
import { vulnPath } from '@/data/reference';
import { getBeginnerSandboxes, getAdvancedSandboxes, difficultyTone } from '@/data/sandbox';
import PathPreview from '@/components/PathPreview';

export const metadata = {
  title: '动手实践 | BinInsight',
  description:
    '浏览器里的动手实践：交互沙箱与深度工作台，走完完整的漏洞分析与利用验证。均为预置演示样例。',
};

const tips = [
  {
    label: '先走主线',
    desc: '先走完 8 级主线，再来这里练习。',
    href: '/learn',
    linkText: '进入 8 级主线',
  },
  {
    label: '大胆点错',
    desc: '沙箱里每个选项——包括错误选项——都配有解释。',
    href: '/learn/l2',
    linkText: '复习 L2',
  },
  {
    label: '对照修复',
    desc: '通关后读一遍防护建议。',
    href: '/learn/l3',
    linkText: '复习 L3',
  },
];

function SandboxCard({
  sb,
  featured,
}: {
  sb: ReturnType<typeof getBeginnerSandboxes>[number];
  featured?: boolean;
}) {
  return (
    <Link
      href={`/cases/sandbox/${sb.id}`}
      className={
        featured
          ? 'group u-panel u-panel-hover block p-7 md:p-9'
          : 'group u-panel u-panel-hover block p-6 md:p-7 h-full flex flex-col'
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`u-tag ${difficultyTone[sb.difficulty]}`}>{sb.difficultyLabel}</span>
        <span className="u-tag">{sb.vulnType}</span>
        <span className="u-tag">{sb.stages.length} 阶段 · 约 {sb.minutes} 分钟</span>
      </div>
      <h3
        className={
          featured
            ? 'text-xl md:text-2xl font-semibold tracking-tight mb-2.5 group-hover:text-[var(--brand-500)] transition-colors'
            : 'text-[17px] font-semibold tracking-tight mb-2 group-hover:text-[var(--brand-500)] transition-colors'
        }
      >
        {sb.title}
      </h3>
      <p className="text-[13px] md:text-[13.5px] text-[var(--text-muted)] leading-relaxed mb-4">
        {sb.brief}
      </p>
      {featured && sb.id === 'sb-format-string' && (
        <p className="text-[11.5px] text-[var(--text-soft)] leading-relaxed mb-4">
          打完这关可以去进阶区看看 UAF 和 ROP —— 看不懂很正常，那是主线之外的拓展。
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3">
        <span
          className={
            featured
              ? 'inline-flex items-center gap-1 text-[14px] font-medium text-[var(--brand-500)] group-hover:gap-2 transition-all'
              : 'inline-flex items-center gap-1 text-[13px] font-medium text-[var(--brand-500)] group-hover:gap-2 transition-all'
          }
        >
          进入沙箱 <span className="font-mono" aria-hidden="true">→</span>
        </span>
        <span className="font-mono text-[10px] text-[var(--text-soft)]">
          {featured ? '默认开启指导模式' : '指导模式可随时开关'}
        </span>
      </div>
    </Link>
  );
}

export default function CasesPage() {
  const beginnerSandboxes = getBeginnerSandboxes();
  const advancedSandboxes = getAdvancedSandboxes();

  return (
    <div>
      {/* Header —— 左对齐 7/5 双栏 */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            {/* 左 7 —— 标题区 */}
            <div className="md:col-span-7">
              <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
                <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
                <span className="text-[var(--border-soft)]">/</span>
                <Link href="/library" className="hover:text-[var(--text)] transition-colors">漏洞手册</Link>
                <span className="text-[var(--border-soft)]">/</span>
                <span className="text-[var(--text-muted)]">动手实践</span>
              </div>
              <p className="u-eyebrow mb-2">Practice</p>
              <h1 className="u-display text-3xl md:text-[42px] mb-3">动手实践</h1>
              <p className="text-[15px] text-[var(--text-muted)] max-w-xl leading-relaxed">
                在浏览器里走完一次完整的漏洞分析与利用验证，每个选项都有解释。
              </p>
              <div className="mt-5">
                <Link href="/library" className="u-btn u-btn-ghost">
                  <span className="font-mono" aria-hidden="true">←</span> 返回漏洞手册
                </Link>
              </div>
            </div>

            {/* 右 5 —— 漏洞路径预览 */}
            <aside className="md:col-span-5 md:border-l md:border-[var(--border)] md:pl-10">
              <PathPreview />
            </aside>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 md:py-20 space-y-16">
        {/* ── 新手模块区 ── */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
            <p className="u-eyebrow">Beginner Zone — 新手模块区</p>
          </div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-6">
            两个交互沙箱，跟着提示走完一次完整的漏洞分析。默认开指导模式，点错也有解释；材料都是预置演示样例。
          </p>
          {beginnerSandboxes.map((sb) => (
            <SandboxCard key={sb.id} sb={sb} featured />
          ))}
        </section>

        {/* ── 进阶模块区 ── */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
            <p className="u-eyebrow">Advanced Zone — 进阶模块区</p>
          </div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-6">
            两个进阶交互沙箱，默认关掉指导模式、由你自主分析，卡住时随时点「查看思路提示」。
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {advancedSandboxes.map((sb) => (
              <SandboxCard key={sb.id} sb={sb} />
            ))}
          </div>
        </section>

        {/* ── 学习建议 ── */}
        <section>
          <p className="u-eyebrow mb-4">METHOD — 使用建议</p>
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
                  <Link href={tip.href} className="u-link">
                    {tip.linkText}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 深度工作台（四个漏洞的四段式剖析） ── */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
            <p className="u-eyebrow">Workbench — 深度工作台</p>
          </div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-6">
            四个漏洞的四段式深度剖析：原理 → 演示 → 动手 → 防御视角。供学有余力深入。
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {vulnPath.map((node) => (
              <Link
                key={node.slug}
                href={`/reference/${node.slug}`}
                className="group u-panel u-panel-hover block p-5"
              >
                <h3 className="text-[16px] font-semibold tracking-tight mb-1.5 group-hover:text-[var(--brand-500)] transition-colors">
                  {node.title}
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{node.subtitle}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--brand-500)]">
                  打开工作台 <span className="font-mono" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 本地深度案例（可选进阶） ── */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
            <p className="u-eyebrow">Deep Dive — 本地深度案例</p>
          </div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-6">
            下面这些内容保留供学有余力自行浏览，
            每个案例附带课前整理的参考分析文本（演示样例）。本页不提供现场反编译或自动扫描环境，
            也不需要下载工具；初学阶段先以 <Link href="/learn/l7" className="text-[var(--brand-500)] underline underline-offset-2">主线第 8 级「综合实践」的新手沙箱</Link> 为主。
          </p>
          <div className="border-t border-[var(--border)]">
            {cases.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/cases/${caseItem.id}`}
                className="group grid grid-cols-[auto_1fr] md:grid-cols-[48px_1fr_200px] gap-x-5 md:gap-x-8 py-7 md:py-8 border-b border-[var(--border)] items-start md:items-center"
              >
                <span className="u-flow-tick" aria-hidden="true" />
                <div>
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="text-[17px] md:text-lg font-semibold tracking-tight group-hover:text-[var(--brand-500)] transition-colors">
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
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-2.5">
                    {caseItem.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="u-tag !text-brand-400">{caseItem.vulnType}</span>
                    {caseItem.knowledge.slice(0, 3).map((k) => (
                      <span key={k} className="u-tag">{k}</span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 md:text-right mt-3 md:mt-0">
                  <span className="inline-flex items-center gap-1 text-[13px] text-[var(--text-soft)] group-hover:text-[var(--brand-500)] group-hover:gap-2 transition-all">
                    查看报告 <span className="font-mono" aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
