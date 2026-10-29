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
    title: 'ELF 解析',
    desc: 'pyelftools 解析 .text / .plt / .symtab — 提取代码段和符号表。',
  },
  {
    label: '02',
    title: 'Capstone 反汇编',
    desc: '逐字节反汇编 .text 段, 扫描所有 call 指令, 匹配危险函数名单。',
  },
  {
    label: '03',
    title: '修复建议',
    desc: '每条危险调用生成 replace_call / insert_stmt / insert_branch 建议。',
  },
  {
    label: '04',
    title: 'AST Diff 输出',
    desc: '结构化 JSON 输出, 可在网页工作台中可视化展示。',
  },
  {
    label: '05',
    title: '可选: 二进制重写',
    desc: '当前为预览模式, 真实重写需 code cave 分析 + keystone 汇编器。',
  },
];

const faqs = [
  {
    q: 'Dilipa 和 Mutagen 有什么区别？',
    a: 'Mutagen 是一键式自动化工具，自动发现漏洞并生成补丁，适合批量扫描；Dilipa 是手动微补丁实验台，CLI/GUI 负责扫描分析，网页工作台负责可视化展示，重点是理解「call strcpy@plt → call strncpy@plt」的具体指令变化。',
  },
  {
    q: 'Windows 用户怎么用？需要 Kali 吗？',
    a: '不需要。下载 dilipa.exe 双击启动 GUI，选择 ELF 文件就能扫描。Dilipa 是 ELF 二进制分析器（Linux/Unix/Android native 格式），纯 Python 实现，pyelftools + capstone，Windows 上原生能跑。',
  },
  {
    q: 'patch 命令能真的改二进制吗？',
    a: '当前版本 patch 是预览模式 —— 识别哪些 call 需要替换，输出 JSON 报告，但不直接写二进制。真实重写需要计算 code cave、插入新指令、修正跳转 —— 是后续目标。',
  },
  {
    q: '支持 Windows .exe 吗？',
    a: '暂不支持 PE 格式 (.exe / .dll)。Dilipa 当前聚焦 ELF（Linux、Unix、Android so）。PE 支持需要 pefile + 额外反汇编适配，是后续迭代方向。',
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
            把二进制补丁表达为对提升后 C 代码的编辑。
            <strong className="text-[var(--text)]">Dilipa</strong> 用 pyelftools + capstone 真实解析 ELF，
            内置 <strong className="text-[var(--text)]">tkinter GUI</strong> 双击即用 —— Windows 用户开箱即用。
          </p>

          {/* 下载按钮组 */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="https://github.com/yghign/BinInsight/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-primary"
            >
              <span className="font-mono text-[11px] mr-1">↓</span>
              下载 dilipa.exe (Windows)
              <span className="font-mono ml-1" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/yghign/BinInsight/archive/refs/heads/main.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-ghost"
            >
              下载源码 zip
              <span className="font-mono ml-1" aria-hidden="true">↗</span>
            </a>
            <a
              href="#how-to-use"
              className="u-btn u-btn-ghost"
            >
              怎么用？
            </a>
          </div>
        </div>
      </section>

      {/* 使用指南 */}
      <section id="how-to-use" className="max-w-[1280px] mx-auto px-5 sm:px-8 py-8 md:py-10 scroll-mt-24">
        <p className="u-eyebrow mb-2">How to Use</p>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="u-panel p-5">
            <h3 className="text-[14px] font-semibold mb-3">🖱️ 双击即用 — Windows GUI</h3>
            <pre className="font-mono text-[12px] leading-[1.8] text-[var(--text-muted)] bg-[var(--bg-code)] rounded-md p-3 overflow-x-auto">
{`1. 下载 dilipa.exe (GitHub Releases)
2. 双击启动 → Dilipa 窗口弹出
3. 点击「📂 打开 ELF 文件」
   选一个 .elf 文件 (Linux 二进制)
4. 点击「🔍 扫描危险函数」
   查看危险调用表格 + 反汇编 + 伪 C
5. 点击「💾 导出 JSON」
   把报告带给网页工作台`}
            </pre>
          </div>
          <div className="u-panel p-5">
            <h3 className="text-[14px] font-semibold mb-3">⌨️ 命令行模式 — 开发者</h3>
            <pre className="font-mono text-[12px] leading-[1.8] text-[var(--text-muted)] bg-[var(--bg-code)] rounded-md p-3 overflow-x-auto">
{`# 直接跑 exe 也能进 CLI
dilipa.exe --cli analyze target.elf
dilipa.exe --cli lift    target.elf -o ast.json
dilipa.exe --cli patch   target.elf
  --replace strcpy:strncpy --dry-run

# 或者源码方式
cd dilipa-tool
pip install -e .
python -m dilipa analyze target.elf`}
            </pre>
          </div>
        </div>
        <p className="mt-4 text-[12.5px] text-[var(--text-muted)] leading-relaxed">
          Dilipa 是 <strong>ELF 二进制分析器</strong>（Linux / Unix / Android native 二进制格式），
          不依赖 Kali / WSL / gcc —— Windows 用户装完 Python 依赖就能跑。
          PE 格式 (.exe / .dll) 暂未支持。
        </p>
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
            href="https://github.com/yghign/BinInsight/tree/main/dilipa-tool"
            target="_blank"
            rel="noopener noreferrer"
            className="u-btn u-btn-ghost !py-1.5 !px-3 text-[11.5px]"
          >
            CLI 源码
            <span className="font-mono ml-1" aria-hidden="true">↗</span>
          </a>
        </div>
        <DilipaWorkbench />
        <p className="mt-4 font-mono text-[10.5px] text-[var(--text-soft)] text-center">
          工作台使用预置样例数据. 想跑真实 ELF? dilipa.exe 打开 ELF → 导出 JSON → 在这里导入.
        </p>
      </section>

      {/* Pipeline 原理 */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 md:py-16">
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
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-1.5">
              下载 dilipa.exe，Windows 上双击即用
            </h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              内置 tkinter GUI，打开 ELF → 扫描危险函数 → 查看反汇编 → 导出 JSON。
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <a
              href="https://github.com/yghign/BinInsight/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-primary"
            >
              下载 Dilipa CLI
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
