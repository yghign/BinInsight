import Link from 'next/link';
import DilipaWorkbench from '@/components/DilipaWorkbench';

export const metadata = {
  title: 'Dilipa · 二进制微补丁实验台 | BinInsight',
  description:
    'Dilipa 将二进制补丁表达为提升后 C 代码的编辑，通过 AST Diff 自动映射回指令级修改。交互式工作台走完导入→C编辑→指令映射→生成补丁全链路。',
};

const pipeline = [
  {
    label: '01',
    title: 'Ghidra 提升',
    desc: 'Headless Analyzer 反编译 → 伪 C 代码 + 函数签名 + 控制流。',
  },
  {
    label: '02',
    title: 'C 代码编辑',
    desc: '用户在熟悉的 C 层面修改：换危险函数、补保护检查、加终止符。',
  },
  {
    label: '03',
    title: 'AST Diff 提取',
    desc: '对比前后语法树，生成最小修改集 replace_call / insert_stmt / insert_branch。',
  },
  {
    label: '04',
    title: '指令映射',
    desc: '每条 C 层修改精确映射为 x86-64 / ARM64 指令变化。',
  },
  {
    label: '05',
    title: 'Trampoline 写入',
    desc: '原位置空间不足 → code cave 注入 → 三重校验 → 输出 .patched。',
  },
];

const faqs = [
  {
    q: 'Dilipa 和 Mutagen 有什么区别？',
    a: 'Mutagen 是一键式自动化工具，自动发现漏洞并生成补丁，适合批量扫描；Dilipa 是手动微补丁实验台，需要自己识别漏洞、编辑 C 代码，重点是理解「C 层修改如何映射到指令层」的完整原理。',
  },
  {
    q: 'Ghidra 提升的 C 代码看起来很奇怪怎么办？',
    a: '反编译是重建过程，不是源码还原。变量可能被规范化为 local_xx、类型推断可能不精确。这是正常现象——Dilipa 允许你在编辑前重命名和修正类型，提升后的代码越准确，补丁映射质量越高。',
  },
  {
    q: 'Trampoline 注入会不会破坏二进制？',
    a: 'Dilipa 在写入前自动备份原文件，补丁后做三重校验：文件校验和对比、反汇编验证、以及可选的沙箱功能测试。校验失败自动回滚。',
  },
];

export default function DilipaPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-6">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <Link href="/tools" className="hover:text-[var(--text)] transition-colors">工具下载</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--brand-500)]">Dilipa</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <h1 className="u-display text-3xl md:text-[40px]">Dilipa</h1>
            <span className="u-tag">手动式</span>
          </div>
          <p className="font-mono text-[12.5px] text-[var(--brand-500)] mb-3">
            BINARY MICRO-PATCHING WORKBENCH · C-LEVEL EDITING
          </p>
          <p className="text-[14px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            把二进制补丁表达为对提升后 C 代码的编辑。修改 C 代码 → AST 对比提取最小修改集 →
            自动映射回指令级修改 —— 完整看到「改了什么 C 代码，二进制里变成了什么」。
          </p>
        </div>
      </section>

      {/* 工作台（核心） */}
      <section className="max-w-[1400px] mx-auto px-3 md:px-6 py-10 md:py-14">
        <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="u-eyebrow mb-1">Interactive Workbench</p>
            <h2 className="text-lg md:text-xl font-semibold tracking-tight">
              Dilipa 工作台 · 六步完整走一遍
            </h2>
          </div>
          <a
            href="https://github.com/bininsight/dilipa"
            target="_blank"
            rel="noopener noreferrer"
            className="u-btn u-btn-ghost !py-1.5 !px-3 text-[11.5px]"
          >
            GitHub 仓库
            <span className="font-mono ml-1" aria-hidden="true">↗</span>
          </a>
        </div>
        <DilipaWorkbench />
        <p className="mt-4 font-mono text-[10.5px] text-[var(--text-soft)] text-center">
          工作台为纯前端仿真，使用预置数据模拟 Dilipa 真实流程。生产使用需配合 Ghidra Headless + 二进制重写引擎。
        </p>
      </section>

      {/* Pipeline 原理 */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 md:py-16">
          <p className="u-eyebrow mb-3">Pipeline</p>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-8">工作原理 · 五步流水线</h2>
          <div className="space-y-0 border-t border-[var(--border)]">
            {pipeline.map((step) => (
              <div
                key={step.label}
                className="grid grid-cols-[56px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-6 py-5 border-b border-[var(--border)] items-baseline"
              >
                <span className="font-mono text-[12px] text-[var(--brand-500)]">{step.label}</span>
                <div>
                  <h3 className="text-[14.5px] font-semibold mb-1">{step.title}</h3>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-14 md:py-16">
        <p className="u-eyebrow mb-3">FAQ</p>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">常见问题</h2>
        <div className="border-t border-[var(--border)]">
          {faqs.map((faq, idx) => (
            <details key={idx} className="border-b border-[var(--border)] group">
              <summary className="flex items-baseline gap-3 py-4 cursor-pointer list-none">
                <span className="u-flow-tick" aria-hidden="true" />
                <span className="flex-1 text-[14px] font-medium group-open:text-[var(--brand-500)] transition-colors">
                  {faq.q}
                </span>
                <span className="font-mono text-[var(--text-soft)] text-xs group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="pb-5 pl-7 pr-2 text-[13px] text-[var(--text-muted)] leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-1.5">在 C 层面修补二进制</h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              从 Ghidra 提升到 trampoline 注入，完整理解微补丁生成的每一步。
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <a
              href="https://github.com/bininsight/dilipa"
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-primary"
            >
              访问 GitHub
              <span className="font-mono ml-1" aria-hidden="true">→</span>
            </a>
            <Link href="/tools" className="u-btn u-btn-ghost">
              <span className="font-mono" aria-hidden="true">←</span>
              返回工具列表
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
