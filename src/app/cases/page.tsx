import Link from 'next/link';
import { cases } from '@/data/cases';
import { getBeginnerSandboxes, getAdvancedSandboxes, difficultyTone } from '@/data/sandbox';
import PathPreview from '@/components/PathPreview';

export const metadata = {
  title: '案例展示 | BinInsight',
  description: '在线沙箱直接开练：无需下载，浏览器里完成识别、分析、利用与修复全流程。新手区跟练，进阶区低中高难度自主闯关。',
};

const tips = [
  {
    label: '先学理论',
    desc: '先完成教学引导层的四步学习，掌握基础概念后再进沙箱，每一步会更有感觉。',
    href: '/learn',
    linkText: '进入学习路径',
  },
  {
    label: '大胆点错',
    desc: '沙箱里每个选项——包括错误选项——都配有解释。点错不扣分，反而是最快的学习方式。',
    href: '/learn/step2',
    linkText: '预习危险函数',
  },
  {
    label: '对照修复',
    desc: '通关后读一遍防护建议，理解每条建议"拦的是哪一步"，你就同时掌握了攻与防。',
    href: '/learn/step4',
    linkText: '复习防护策略',
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
                <span className="text-[var(--text-muted)]">案例展示</span>
              </div>
              <p className="u-eyebrow mb-2">Interactive Sandbox</p>
              <h1 className="u-display text-3xl md:text-[42px] mb-3">沙箱实战</h1>
              <p className="text-[15px] text-[var(--text-muted)] max-w-xl leading-relaxed">
                无需下载任何文件、无需配置虚拟机 —— 打开浏览器就能完成一次完整的漏洞分析：
                识别程序 → 寻找线索 → 定位漏洞 → 验证利用 → 决策修复。
                每个选项都有解释，点错也能学到东西。
              </p>
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
            第一次接触二进制安全？从这里开始。默认开启<strong className="text-[var(--text)]">指导模式</strong>，
            每一步都会告诉你「做什么、为什么这么做、这份材料该怎么看」—— 跟着走完就有完整方法论。
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
            默认关闭指导、自主完成分析。卡住时随时点「查看思路提示」；
            难度从低到高依次是：格式化字符串 → UAF 虚表劫持 → <code className="inline">{'NX'}</code><span className="text-[var(--text-muted)] font-normal">（执行禁止位）</span> 下的 <code className="inline">{'ROP'}</code><span className="text-[var(--text-muted)] font-normal">（面向返回编程）</span> 对抗。
          </p>
          <div className="grid md:grid-cols-3 gap-4">
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

        {/* ── 本地深度案例（可选进阶） ── */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
            <p className="u-eyebrow">Deep Dive — 本地深度案例</p>
          </div>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-6">
            沙箱通关后，想接触真实工具链（<code className="inline">{'Ghidra'}</code><span className="text-[var(--text-muted)] font-normal">（反编译器名称）</span>、<code className="inline">{'GDB'}</code><span className="text-[var(--text-muted)] font-normal">（GNU 调试器）</span>、Mutagen）？可以下载案例包在本地虚拟机中复现，
            每个案例都附带完整分析报告与防护建议。此部分为可选内容，初学阶段先以沙箱为主。
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
