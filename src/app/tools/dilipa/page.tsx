import Link from 'next/link';
import SourceBadge from '@/components/SourceBadge';
import ReportImporter from '@/components/dilipa/ReportImporter';

/**
 * Dilipa 页（T03 / T09 / T11）—— 全站诚实文案基准（P0-3）。
 *
 * - metadata 收窄为「解析 ELF、反汇编、按名单提示危险调用并输出 JSON 报告」，删 AST Diff 措辞
 * - pipeline 03 / 04 改成「文本建议 / JSON 报告输出」，二进制重写统一标「规划中」
 * - 工作台改「三步预览」，接入 ReportImporter（查看预置样例 / 导入自己的 JSON / 下载样例）
 * - 删掉指向不存在 Release 的下载按钮与「GUI 双击即用」成品表述
 */

export const metadata = {
  title: 'Dilipa · 只读分析与变更预览 | BinInsight',
  description:
    '本次实现的只读链路：pyelftools 解析 ELF、capstone 反汇编 .text、按危险函数名单提示 call，输出一份 JSON 报告；网页端可导入报告并预览「换成什么函数」。二进制重写与补丁校验属于后续工作。',
};

const pipeline = [
  {
    label: '01',
    title: 'ELF 解析（本次实现）',
    desc: 'pyelftools 读取节区、符号表与文件头，输出 arch / bits / endian / entry / sections 等元信息。只读，不改动文件。',
  },
  {
    label: '02',
    title: 'Capstone 反汇编（本次实现）',
    desc: '线性反汇编 .text 段，逐条识别 call 指令，并尝试把数字目标地址映射回 PLT 符号名。',
  },
  {
    label: '03',
    title: '危险调用名单与文本建议（本次实现）',
    desc: '按 10 条危险函数名单比对，给每条命中附「建议替换函数」与漏洞类别编号；只输出文本建议，不写回二进制。',
  },
  {
    label: '04',
    title: 'JSON 报告输出（本次实现）',
    desc: '把上面的结果写成一份结构化 JSON 报告，网页工作台与对照视图按报告字段渲染；统计数字全部来自报告对象。',
  },
  {
    label: '05',
    title: '二进制重写 / 补丁校验（规划中）',
    desc: '等长覆盖、跳转衔接、字节对比、重反汇编核对、回归测试、语法树对比与反编译提升：均未实现。',
  },
];

const faqs = [
  {
    q: '这是现场跑出来的吗？',
    a: '不是。页面内置的样例 JSON 由课前独立脚本从测试 ELF 生成，标为「演示样例」，不是仓库内 CLI 原样跑出的结果，也不是现场即兴运行。你导入自己的报告后，标签切换为「真实输出」，数据严格按你那份 JSON 渲染。',
  },
  {
    q: '报告里没有 call，是不是分析成功了？',
    a: '不是。仓库内 dilipa analyze 存在已知的 call 目标解析限制（只认 @plt 形式的符号）。空结果必须当作「没有检测到 call」，不能当成分析成功；页面会显式给出这条提示。',
  },
  {
    q: 'patch 命令能真的改二进制吗？',
    a: '本次不能。工作台只输出「改了什么」的文本清单，不写回二进制、不做重反汇编核对、不做回归测试。真实重写与等价性校验属于后续工作（规划中）。',
  },
  {
    q: '需要装 Ghidra、Docker 或联网吗？',
    a: '不需要。网页端的导入、对照与三步预览全部在浏览器本地完成，不发网络请求；课前生成样例用的是 pyelftools 与 capstone，也不依赖 Ghidra。',
  },
  {
    q: '这份报告和我自己跑出来的字段不一致怎么办？',
    a: '导入器会做容错：缺字段显示「—」并给出提示，缺 safe_alt / cwe 不猜测替代函数，旧版本只加提示不拒绝，非 JSON 或超 1MB 显示错误卡片。字段契约以仓库 cli.py 的 analyze 输出为准。',
  },
];

export default function DilipaPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-6">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <Link href="/tools" className="hover:text-[var(--text)] transition-colors">工具</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--brand-500)]">Dilipa</span>
          </div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="u-display text-3xl md:text-[40px]">Dilipa</h1>
            <SourceBadge state="demo" />
            <SourceBadge state="planned" />
          </div>
          <p className="font-mono text-[12.5px] text-[var(--brand-500)] mb-3">
            READ-ONLY ELF ANALYSIS + CHANGE PREVIEW
          </p>
          <p className="text-[14px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            本次实现的是一条<strong className="text-[var(--text)]">只读链路</strong>：
            解析 ELF、反汇编 <code className="inline">.text</code>、按危险函数名单提示 call，
            最后输出一份 JSON 报告。网页端把报告渲染成「找到哪个 call、建议换成什么函数」的对照视图。
            <strong className="text-[var(--text)]">不写回二进制</strong>，也不做补丁校验。
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><SourceBadge state="demo" /> 内置样例 = 课前生成的演示样例</span>
            <span className="flex items-center gap-1.5"><SourceBadge state="real" /> 导入的 JSON = 真实输出</span>
            <span className="flex items-center gap-1.5"><SourceBadge state="planned" /> 重写/校验 = 规划中</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a href="#report" className="u-btn u-btn-primary">
              去看报告对照
              <span className="font-mono" aria-hidden="true">→</span>
            </a>
            <a href="#pipeline" className="u-btn u-btn-ghost">怎么看这条链路</a>
          </div>
        </div>
      </section>

      {/* 报告导入与对照（核心，断网闭环） */}
      <section id="report" className="max-w-[1400px] mx-auto px-3 md:px-6 py-10 md:py-14 scroll-mt-24">
        <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="u-eyebrow mb-1">Interactive Workbench</p>
            <h2 className="text-lg md:text-xl font-semibold tracking-tight">
              Dilipa 工作台 · 三步预览 + 报告对照
            </h2>
            <p className="mt-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
              先看内置样例，或把自己跑出的 JSON 导进来。三条动作都不联网：
              「下载样例 → 再导入」这条闭环在断网状态下也能完整走一遍。
            </p>
          </div>
          <SourceBadge state="planned" />
        </div>
        <ReportImporter />
        <p className="mt-4 font-mono text-[10.5px] text-[var(--text-soft)] text-center">
          三步预览与对照视图使用预置/导入的报告数据；未执行的校验一律标「本阶段仅预览」，不呈现为成品结果。
        </p>
      </section>

      {/* 使用指南：如实写 CLI，不虚构 GUI / 下载 */}
      <section id="how-to-use" className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 md:py-12 scroll-mt-24">
          <p className="u-eyebrow mb-2">How to reproduce</p>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">课前怎么得到一份报告</h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="u-panel p-5">
              <h3 className="text-[14px] font-semibold mb-3">仓库内 CLI（只读分析）</h3>
              <pre className="font-mono text-[12px] leading-[1.8] text-[var(--text-muted)] bg-[var(--bg-code)] rounded-md p-3 overflow-x-auto">
{`cd dilipa-tool
python -m dilipa analyze target.elf -o dilipa-report.json

# 报告字段契约见 cli.py 的 analyze / _header()：
# tool / version / path / arch / bits / endian /
# e_type / entry / sections / cmd / calls /
# dangerous / instruction_count`}
              </pre>
              <p className="mt-3 u-lesson-note">
                这是仓库里真实存在的命令；本次演示不要求现场执行它。
              </p>
            </div>
            <div className="u-panel p-5">
              <h3 className="text-[14px] font-semibold mb-3">已知限制（必须如实说明）</h3>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                仓库内 <code className="inline">disassembler.py</code> 的 call 目标解析只认带
                <code className="inline"> @plt </code>的符号，对纯数字相对地址的 call 会漏检，
                现场跑常常得到「0 条危险调用」。因此本页内置样例改由课前独立脚本生成（标「演示样例」），
                把数字地址映射回 PLT 符号名后再套危险函数名单。
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <SourceBadge state="demo" />
                <span className="u-lesson-note">非仓库 CLI 原样跑出，也不是现场即兴运行</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline 原理 */}
      <section id="pipeline" className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 md:py-16 scroll-mt-24">
        <p className="u-eyebrow mb-3">Pipeline</p>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-8">本次做了什么 / 没做什么</h2>
        <div className="space-y-0 border-t border-[var(--border)]">
          {pipeline.map((step) => (
            <div
              key={step.label}
              className="grid grid-cols-[56px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-6 py-5 border-b border-[var(--border)] items-baseline"
            >
              <span className="font-mono text-[12px] text-[var(--brand-500)]">{step.label}</span>
              <div>
                <h3 className="text-[14.5px] font-semibold mb-1 flex items-center gap-2 flex-wrap">
                  {step.title}
                  {step.title.includes('规划中') && <SourceBadge state="planned" />}
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 md:py-16">
          <p className="u-eyebrow mb-3">FAQ</p>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">老师可能追问的几件事</h2>
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
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-1.5">
              回到主线：这些概念在第 2、3 级讲过
            </h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              主线 8 级才是本次可以完整走完的演示。
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <Link href="/learn/l2" className="u-btn u-btn-primary">
              复习 L2 · 找到 call
              <span className="font-mono ml-1" aria-hidden="true">→</span>
            </Link>
            <Link href="/tools" className="u-btn u-btn-ghost">
              <span className="font-mono" aria-hidden="true">←</span>
              返回工具
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
