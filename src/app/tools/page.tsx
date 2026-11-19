import Link from 'next/link';
import SourceBadge from '@/components/SourceBadge';

/**
 * 工具（T04 / T11）。
 *
 * - 删除旧版把两款工具串成一条联动链路、并写成依赖同一套前置环境的表述
 * - Dilipa 口径：只读分析 + 变更预览（本次做的）；Mutagen 口径：设计构想（本次未实现）
 */

const tools = [
  {
    no: '01',
    href: '/tools/dilipa',
    name: 'Dilipa',
    tagline: '只读 ELF 分析 + 变更预览',
    desc: '本次做了什么：pyelftools 解析 ELF、capstone 反汇编 .text、按危险函数名单提示 call，输出一份 JSON 报告；网页端可导入报告、按行对照「换成什么函数」。不写回二进制，重写与校验属于后续工作。',
    tags: ['只读分析', 'JSON 报告', '行级对照', '变更预览'],
    state: 'demo' as const,
    stateNote: '页面内置样例为演示样例；导入自己的 JSON 后标为真实输出',
  },
  {
    no: '02',
    href: '/tools/mutagen',
    name: 'Mutagen',
    tagline: '设计构想 · 本次未实现',
    desc: '一键式自动化构想：希望一条命令完成漏洞发现与修复。本次没有实现，没有可下载程序、没有命令、没有分析结果，也不进入主线演示。',
    tags: ['设计构想', '本次未实现', '无下载'],
    state: 'planned' as const,
    stateNote: '本页只有规划中的设想',
  },
];

export const metadata = {
  title: '工具 | BinInsight',
  description:
    'Dilipa 是本次实现的只读 ELF 分析与变更预览；Mutagen 是本次未实现的设计构想。',
};

export default function ToolsPage() {
  return (
    <div>
      <div className="border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">工具</span>
          </div>
          <p className="u-eyebrow mb-2">TOOLS</p>
          <h1 className="u-display text-3xl md:text-[40px] mb-3">工具</h1>
          <p className="text-[15px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            两个名字里只有一个对应本次真正写出来的东西；另一个只是写在纸上的构想。请按页面标注的三态状态理解。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-[var(--text-muted)]">
            <SourceBadge state="real" />
            <span>真实输出 = 你导入的报告数据</span>
            <SourceBadge state="demo" />
            <span>演示样例 = 课前备好的教学素材</span>
            <SourceBadge state="planned" />
            <span>规划中 = 设计构想，本次未实现</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 md:py-16">
        <div className="border-t border-[var(--border)]">
          {tools.map((tool) => (
            <Link
              key={tool.no}
              href={tool.href}
              className="group grid grid-cols-[auto_1fr] md:grid-cols-[64px_1fr_240px] gap-x-5 md:gap-x-10 items-start md:items-center py-9 md:py-12 border-b border-[var(--border)]"
            >
              <span className="u-flow-tick" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl md:text-[32px] font-semibold tracking-tight group-hover:text-[var(--brand-500)] transition-colors">
                    {tool.name}
                  </h2>
                  <SourceBadge state={tool.state} />
                </div>
                <p className="font-mono text-[12px] text-[var(--brand-500)] mb-3">{tool.tagline}</p>
                <p className="text-sm md:text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
                  {tool.desc}
                </p>
                <p className="mt-2 text-[11px] font-mono text-[var(--text-soft)]">{tool.stateNote}</p>
              </div>
              <div className="col-span-2 md:col-span-1 flex md:flex-col md:items-end gap-3 mt-4 md:mt-0">
                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  {tool.tags.map((t) => (
                    <span key={t} className="u-tag">{t}</span>
                  ))}
                </div>
                <span className="hidden md:inline-flex items-center gap-1 text-[13px] text-[var(--text-soft)] group-hover:text-[var(--brand-500)] group-hover:gap-2 transition-all">
                  查看详情 <span className="font-mono" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 border border-[var(--border)] border-l-2 border-l-[var(--brand-500)] rounded-md p-5 md:p-6">
          <p className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">
            口径说明 · P0-3
          </p>
          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            Dilipa 本次实现的是「ELF 解析 → 反汇编 → 危险调用名单 → JSON 报告」这条只读链路，
            加上网页端的报告导入与变更预览；二进制重写、补丁等价性校验、语法树对比、反编译提升都属于后续工作。
            Mutagen 从头到尾只是构想。两者都不需要 Ghidra、Docker 或任何 API Key，
            也没有设想中的「先 Mutagen 扫描、再 Dilipa 理解」联动流程 —— 那条链路两端都不成立。
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2.5">
          <Link href="/learn/l0" className="u-btn u-btn-primary">
            回到 8 级主线
            <span className="font-mono" aria-hidden="true">→</span>
          </Link>
          <Link href="/reference/glossary" className="u-btn u-btn-ghost">
            核心概念
          </Link>
        </div>
      </div>
    </div>
  );
}
