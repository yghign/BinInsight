import Link from 'next/link';

const tools = [
  {
    no: '01',
    href: '/tools/mutagen',
    name: 'Mutagen',
    tagline: 'AI 驱动的自动化漏洞发现与修复引擎',
    desc: '一条命令跑完「发现漏洞 → 生成补丁 → 验证修复」全流程。基于 AI fuzzer 和多 agent 协作，支持 C/C++、Rust、Python、Go，可通过 Ghidra 无头模式处理无源码二进制。',
    tags: ['AI Fuzzer', '自动修复', '多语言', 'Ghidra 集成'],
    mode: '一键式',
  },
  {
    no: '02',
    href: '/tools/dilipa',
    name: 'Dilipa',
    tagline: '手动微补丁实验台 · 把补丁表达为 C 代码编辑',
    desc: '用户修改提升后的 C 代码，系统通过 AST 对比提取最小修改集，再自动映射回指令级修改。直观理解「改了什么 C 代码，二进制里变成了什么」。',
    tags: ['C 级编辑', '指令映射', '可视化对比', '概念演示'],
    mode: '手动式',
  },
];

const workflow = [
  {
    label: 'A',
    title: 'Mutagen 快速扫描',
    desc: '对目标程序进行自动化漏洞扫描，生成初步补丁建议。',
  },
  {
    label: 'B',
    title: '导出代码差异',
    desc: '导出 Mutagen 生成的补丁前后代码差异（diff）。',
  },
  {
    label: 'C',
    title: 'Dilipa 深度理解',
    desc: '查看自动补丁在提升后 C 层面的修改细节，理解二进制映射。',
  },
];

export default function ToolsPage() {
  return (
    <div>
      {/* Header */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">工具下载</span>
          </div>
          <p className="u-eyebrow mb-2">Toolchain</p>
          <h1 className="u-display text-3xl md:text-[40px] mb-3">工具下载与使用</h1>
          <p className="text-[15px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            两款互补工具形成完整梯度：从一键自动化到手动精细控制，满足不同深度的分析需求。
            均依赖 <code className="inline">{'Ghidra'}</code><span className="text-[var(--text-muted)] font-normal">（反编译器）</span>，请先安装。
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 md:py-20">
        {/* 工具列表：编辑式大行 */}
        <div className="border-t border-[var(--border)]">
          {tools.map((tool) => (
            <Link
              key={tool.no}
              href={tool.href}
              className="group grid grid-cols-[auto_1fr] md:grid-cols-[64px_1fr_240px] gap-x-5 md:gap-x-10 items-start md:items-center py-9 md:py-12 border-b border-[var(--border)]"
            >
              <span className="u-flow-tick" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-[32px] font-semibold tracking-tight group-hover:text-[var(--brand-500)] transition-colors">
                    {tool.name}
                  </h2>
                  <span className="u-tag">{tool.mode}</span>
                </div>
                <p className="font-mono text-[12px] text-[var(--brand-500)] mb-3">{tool.tagline}</p>
                <p className="text-sm md:text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
                  {tool.desc}
                </p>
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

        {/* 工具联动路径：箭头链 */}
        <div className="mt-16">
          <p className="u-eyebrow mb-4">WORKFLOW — 工具联动学习路径</p>
          <div className="u-panel overflow-hidden">
            <div className="grid md:grid-cols-3">
              {workflow.map((step, idx) => (
                <div
                  key={step.label}
                  className={`relative p-6 md:p-7 ${
                    idx > 0 ? 'border-t md:border-t-0 md:border-l border-[var(--border)]' : ''
                  }`}
                >
                  {idx < workflow.length - 1 && (
                    <span
                      className="hidden md:block absolute -left-[7px] top-1/2 -translate-y-1/2 font-mono text-[var(--border-soft)] bg-[var(--bg-card)] px-[2px]"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                  <span className="font-mono text-[11px] tracking-wider text-[var(--brand-500)]">
                    {step.label}
                  </span>
                  <h3 className="text-[15px] font-semibold mt-2 mb-1.5">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ghidra 前置说明 */}
        <div className="mt-10 border border-[var(--border)] border-l-2 border-l-[var(--brand-500)] rounded-md p-5 md:p-6">
          <p className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">
            环境前置 · PREREQUISITE
          </p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            两款工具均依赖 Ghidra 进行二进制反编译。请前往{' '}
            <a
              href="https://ghidra-sre.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand-500)] underline underline-offset-2"
            >
              ghidra-sre.org
            </a>{' '}
            下载安装，并配置 <code className="inline">GHIDRA_INSTALL_DIR</code> 环境变量。
            推荐版本：Ghidra 11.x + JDK 17+。
          </p>
        </div>
      </div>
    </div>
  );
}
