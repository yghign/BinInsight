import Link from 'next/link';
import HeroCanvas from '@/components/HeroCanvas';

const keywords = [
  'ELF / PE',
  'GHIDRA',
  'CONTROL-FLOW GRAPH',
  'TAINT ANALYSIS',
  'STACK CANARY',
  'CFI',
  'PATCH DIFF',
];

const layers = [
  {
    mark: 'Ⅰ',
    href: '/learn',
    label: '第一层 · 教学引导',
    title: '系统化学习路径',
    desc: '解包识别 → 静态分析 → 路径探索 → 防护策略，每一环都配有可交互示例，并支持新手 / 进阶双模式切换。',
    tags: ['ELF 结构', '反汇编', '漏洞确认', '防护机制'],
  },
  {
    mark: 'Ⅱ',
    href: '/tools',
    label: '第二层 · 工具下载',
    title: '两款互补工具',
    desc: 'Mutagen 一键自动化检测与修复，Dilipa 在提升后的 C 代码上手动制作微补丁。从快速检测到精细控制，覆盖完整工具链。',
    tags: ['Mutagen · 自动化', 'Dilipa · 微补丁', '基于 Ghidra'],
  },
  {
    mark: 'Ⅲ',
    href: '/cases',
    label: '第三层 · 案例展示',
    title: '可复现的实战案例',
    desc: '下载目标文件，在本地复现完整分析过程，再对照标准答案检验成果。带着问题动手，比只读教程更有效。',
    tags: ['栈溢出', 'Use-After-Free', '补丁比对'],
  },
];

const flow = [
  { title: '解包与识别', desc: '判断文件类型与格式结构，提取关键信息' },
  { title: '静态分析', desc: '反汇编、函数识别、定位危险调用' },
  { title: '路径探索', desc: '源到汇分析，确认漏洞可达性' },
  { title: '防护策略', desc: '栈保护、CFI、补丁比对与修复' },
];

const reasons = [
  {
    title: '可视化交互学习',
    desc: '每个知识点都配有可交互示例 —— 点击 ELF 区段、标注危险函数、切换路径约束，在操作中理解抽象概念。',
  },
  {
    title: '有标准答案的案例',
    desc: '所有案例附带完整分析报告与预期结果。本地实操后逐项对照，定位自己遗漏的细节。',
  },
  {
    title: '开源工具链，本地运行',
    desc: '基于 Ghidra、IDA 等开源生态，工具可在本地部署运行，不依赖任何在线 SaaS 服务。',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* 首屏：3D 动态画布，单独占据整个视野 */}
      <section className="u-hero-full relative isolate flex items-center overflow-hidden border-b border-[var(--border)]">
        <HeroCanvas />
        <div className="hero-scrim pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-5 py-24 text-center sm:px-8">
          <p className="u-eyebrow mb-7">Reverse Engineering · Vulnerability Mitigation</p>
          <h1 className="u-display mb-8 text-[46px] sm:text-[66px] md:text-[88px]">
            洞见二进制世界
          </h1>
          <p className="mx-auto mb-11 max-w-xl text-[15px] leading-[1.9] text-[var(--text-muted)] md:text-[17px]">
            从逆向分析到漏洞防护的系统学习路径 —— 教学引导建立认知，工具下载动手实践，
            案例展示对照检验。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/learn" className="u-btn u-btn-primary">
              开始学习
            </Link>
            <Link href="/cases" className="u-btn u-btn-ghost">
              浏览案例
            </Link>
          </div>
        </div>

        {/* 首屏底部信息条：技术关键词 + 下滑提示线（不使用图标） */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-5 pb-7 sm:px-8">
            <div className="hidden flex-wrap gap-x-5 gap-y-2 font-mono text-[10.5px] tracking-wider text-[var(--text-soft)] sm:flex">
              {keywords.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-soft)]">
                scroll
              </span>
              <span className="hero-scroll-line" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* 三层学习体系：三栏发丝分隔 */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="u-eyebrow mb-3">Structure</p>
            <h2 className="u-display text-2xl md:text-[34px]">三层学习体系</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)] md:text-right">
            从认知到动手，再到检验。每一层都独立可用，组合起来是一条完整的进阶路径。
          </p>
        </div>

        <div className="grid border-y border-[var(--border)] md:grid-cols-3">
          {layers.map((layer, idx) => (
            <Link
              key={layer.href}
              href={layer.href}
              className={`group flex flex-col py-8 md:px-9 md:py-11 ${
                idx > 0 ? 'border-t border-[var(--border)] md:border-l md:border-t-0' : ''
              } ${idx === 0 ? 'md:pl-0' : ''} ${idx === layers.length - 1 ? 'md:pr-0' : ''}`}
            >
              <span className="font-mono text-[13px] text-[var(--brand-500)]">{layer.mark}</span>
              <p className="u-eyebrow mt-5 mb-2.5">{layer.label}</p>
              <h3 className="mb-3 text-xl font-semibold tracking-tight transition-colors group-hover:text-[var(--brand-500)]">
                {layer.title}
              </h3>
              <p className="text-sm leading-[1.85] text-[var(--text-muted)]">{layer.desc}</p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {layer.tags.map((t) => (
                  <span key={t} className="u-tag">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 分析流程：一条线 + 箭头，不写序号 */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="u-eyebrow mb-3">Workflow</p>
              <h2 className="u-display text-2xl md:text-[34px]">分析的四个环节</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)] md:text-right">
              专业逆向工程师的工作流：从拿到一个二进制文件，到确认漏洞，再到制定防护策略。
            </p>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-0">
            {flow.map((item, idx) => (
              <div key={item.title} className="contents md:flex md:items-start md:flex-1 md:gap-0">
                <div className="md:flex-1">
                  <h3 className="text-[17px] font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 max-w-[26ch] text-[13px] leading-[1.8] text-[var(--text-muted)]">
                    {item.desc}
                  </p>
                </div>
                {idx < flow.length - 1 && (
                  <>
                    <span className="flow-arrow-down" aria-hidden="true" />
                    <span className="flow-arrow flow-arrow--h-md md:mx-6 md:mt-2" aria-hidden="true" />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link href="/learn" className="u-link">
              进入完整学习路径 <span className="font-mono">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 为什么选择：不对称双栏，正文分条，不编号 */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-16">
          <div className="md:sticky md:top-24 md:self-start">
            <p className="u-eyebrow mb-3">Why BinInsight</p>
            <h2 className="u-display text-2xl md:text-[34px]">为什么选择我们</h2>
            <p className="mt-5 max-w-sm text-sm leading-[1.9] text-[var(--text-muted)]">
              不是又一个教程合集，而是一条带着标准答案、可以自己动手复现的学习路径。
            </p>
          </div>

          <div>
            {reasons.map((r) => (
              <div key={r.title} className="border-t border-[var(--border)] py-8 first:pt-0 first:border-t-0">
                <h3 className="mb-3 text-[17px] font-semibold tracking-tight">{r.title}</h3>
                <p className="text-sm leading-[1.9] text-[var(--text-muted)]">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 编辑式引言：留白段落，作为页面节奏的停顿 */}
      <section className="border-y border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 md:py-24">
          <p className="text-[20px] leading-[1.6] font-medium tracking-tight md:text-[30px]">
            看不懂汇编，不等于学不会安全。
          </p>
          <p className="mt-3 text-[15px] leading-[1.8] text-[var(--text-muted)] md:text-[17px]">
            把每一个抽象概念，都变成可点击、可复现的一次操作。
          </p>
        </div>
      </section>

      {/* 收尾：左文右动作 */}
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between md:py-20">
        <div>
          <h2 className="u-display mb-2 text-2xl md:text-[30px]">从第一个 <code className="inline">{'ELF'}</code><span className="text-[var(--text-muted)] font-normal">（可执行链接格式）</span> 文件开始</h2>
          <p className="text-sm text-[var(--text-muted)]">
            一步步掌握逆向分析与漏洞防护的核心技能。
          </p>
        </div>
        <Link href="/learn" className="u-btn u-btn-primary flex-shrink-0">
          开始学习
        </Link>
      </section>
    </div>
  );
}
