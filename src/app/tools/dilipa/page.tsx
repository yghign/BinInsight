import Link from 'next/link';
import CodeBlock from '@/components/CodeBlock';
import DilipaDemo from '@/components/DilipaDemo';

export const metadata = {
  title: 'Dilipa · 二进制微补丁实验台 | BinInsight',
  description:
    'Dilipa 将二进制补丁表达为提升后 C 代码的编辑，通过 AST Diff 自动映射回指令级修改，直观理解微补丁生成原理。',
};

const principleSteps = [
  {
    title: 'Ghidra 提升',
    desc: '使用 Ghidra Headless Analyzer 将目标二进制反编译为伪 C 代码，提取函数签名、变量类型和控制流信息，作为用户编辑的起点。',
    code: `# Ghidra Headless 反编译
$GHIDRA_INSTALL_DIR/support/analyzeHeadless \\
  /tmp/proj MyProject \\
  -import target_binary \\
  -postScript DecompileAll.java \\
  -scriptPath ./scripts

# 输出提升后的 C 代码
==> ./lifted/process_input.c`,
  },
  {
    title: 'C 代码编辑',
    desc: '用户在熟悉的 C 代码层面修改漏洞：替换危险函数、增加边界检查、修复类型问题。编辑器提供语法高亮和实时编译反馈。',
    code: `// 用户在提升后的 C 代码上直接修改

- strcpy(buffer, input);           // 原始：无长度检查
+ strncpy(buffer, input, 63);      // 修改：限定最大长度
+ buffer[63] = '\\0';               // 修改：确保终止符`,
  },
  {
    title: 'AST Diff 提取',
    desc: '对比修改前后 C 代码的抽象语法树，精确识别被替换的函数调用、新增的语句和修改的参数，生成结构化的最小修改集。',
    code: `# AST Diff 输出（结构化修改集）
{
  "function": "process_input",
  "changes": [
    {
      "type": "replace_call",
      "old": "strcpy(buf, input)",
      "new": "strncpy(buf, input, 63)",
      "line": 11
    },
    {
      "type": "insert_stmt",
      "stmt": "buffer[63] = '\\0'",
      "after_line": 11
    }
  ]
}`,
  },
  {
    title: '指令映射',
    desc: '将 C 层修改映射为具体的 x86-64 / ARM64 指令变化：替换 call 目标、插入参数传递指令、生成新的机器码。',
    code: `# 指令级映射结果

- call    strcpy                # E8 xx xx xx xx
+ mov     rdx, 63               # 新增：长度参数
+ call    strncpy               # 替换 call 目标
+ mov     byte [rbp+0x0F], 0    # 新增：终止符写入`,
  },
  {
    title: 'Trampoline 写入',
    desc: '当原位置空间不足以容纳新指令时，在代码洞（code cave）中放置补丁逻辑，通过跳转 trampoline 衔接执行流，最后回写二进制。',
    code: `# 补丁注入流程

1. 在 .text 段寻找足够大的 code cave
2. 将新指令序列写入 cave（patch_stub）
3. 在原函数入口写入 JMP patch_stub
4. stub 执行完毕后 JMP 回原函数继续执行
5. 校验：checksum + 反汇编验证 + 功能测试

# 输出修补后的二进制
==> target_binary.patched`,
  },
];

const tutorials = [
  {
    title: '启动 Dilipa',
    desc: 'Dilipa 提供 Web UI 和命令行两种使用方式，以下演示典型的 Web 工作流。',
    code: `# 克隆仓库
git clone https://github.com/bininsight/dilipa.git
cd dilipa

# 使用 Docker Compose 启动（内含 Ghidra 服务）
docker compose up -d

# 打开浏览器访问
# http://localhost:3000`,
  },
  {
    title: '导入目标二进制',
    desc: '上传需要分析的 ELF 二进制文件，Dilipa 会自动调用 Ghidra 完成反编译和提升。',
    code: `# Web UI 操作
1. 点击「导入目标」，选择 ELF 二进制文件
2. 选择目标架构（x86-64 / ARM64）
3. 等待 Ghidra 分析完成（通常 10-60 秒）
4. 在函数列表中选择要修补的函数

# 命令行方式
dilipa lift ./target_binary --func process_input \\
  --output ./lifted/process_input.c`,
  },
  {
    title: '编辑 C 代码并应用补丁',
    desc: '在提升的 C 代码上修改漏洞，预览 AST Diff 和指令映射，确认后生成补丁二进制。',
    code: `# 命令行一键流程
dilipa patch ./target_binary \\
  --func process_input \\
  --edit ./my_fix.c \\
  --output ./target_binary.patched

# 输出：
# [1/4] Ghidra 提升完成
# [2/4] AST Diff: 2 changes detected
# [3/4] 指令映射: strcpy -> strncpy (+2 insns)
# [4/4] Trampoline 注入完成 (cave @ 0x401a20)
# Done: target_binary.patched (verified OK)`,
  },
];

const faqs = [
  {
    q: 'Dilipa 和 Mutagen 有什么区别？',
    a: 'Mutagen 是一键式自动化工具，自动发现漏洞并生成补丁，适合批量扫描和快速修复；Dilipa 是手动微补丁实验台，需要用户自己识别漏洞、编辑 C 代码，重点是理解「C 层修改如何映射到指令层」的完整原理。两者互补：先用 Mutagen 定位问题，再用 Dilipa 深入理解和精细修补。',
  },
  {
    q: '为什么 Ghidra 提升的 C 代码看起来很奇怪？',
    a: '反编译是重建过程，不是源码还原。变量可能被命名为 local_xx、类型推断可能不精确、控制流可能被重组。这是正常现象——Dilipa 允许你在编辑前重命名变量和修正类型，提升后的代码越准确，补丁映射质量越高。',
  },
  {
    q: 'Trampoline 注入会不会破坏二进制？',
    a: 'Dilipa 在写入前会自动备份原文件，并在补丁后做三重校验：文件校验和对比、反汇编验证、以及可选的沙箱功能测试。如果校验失败会自动回滚。复杂加壳或签名校验的程序可能需要额外处理。',
  },
  {
    q: '支持 ARM 架构吗？',
    a: '当前实验版本完整支持 x86-64，ARM64 的指令映射模块在开发中。架构相关逻辑集中在指令映射层，Ghidra 提升和 AST Diff 部分与架构无关。',
  },
];

function TerminalMock() {
  return (
    <div className="u-panel overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-code-header)]">
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          dilipa patch --preview
        </span>
      </div>
      <div className="p-5 font-mono text-[12px] leading-[1.9]">
        <div className="text-[var(--text-soft)]">[1/4] Ghidra 提升完成</div>
        <div className="text-brand-400">[2/4] AST Diff: 2 changes detected</div>
        <div className="text-[var(--text-soft)]">      replace_call strcpy → strncpy</div>
        <div className="text-[var(--text-soft)]">      insert_stmt buffer[63] = &apos;\0&apos;</div>
        <div className="text-brand-400">[3/4] 指令映射 (+2 insns)</div>
        <div className="text-accent-orange">      code cave @ 0x401a20 · 24 bytes</div>
        <div className="text-accent-green">[4/4] Trampoline 注入完成</div>
        <div className="text-[var(--text-muted)] my-1">{'─'.repeat(42)}</div>
        <div className="text-accent-green">Done: target_binary.patched (verified OK)</div>
      </div>
    </div>
  );
}

export default function DilipaPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-12">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-8">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <Link href="/tools" className="hover:text-[var(--text)] transition-colors">工具下载</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--brand-500)]">Dilipa</span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <h1 className="u-display text-4xl md:text-5xl">Dilipa</h1>
            <span className="u-tag">手动式</span>
          </div>
          <p className="font-mono text-[13px] text-[var(--brand-500)] mb-4">
            BINARY MICRO-PATCHING WORKBENCH · C-LEVEL EDITING
          </p>
          <p className="text-[15px] md:text-base text-[var(--text-muted)] max-w-2xl leading-relaxed mb-8">
            把二进制补丁表达为对提升后 C 代码的编辑。用户修改 C 代码，
            系统通过 AST 对比提取最小修改集，自动映射回指令级修改——
            直观理解「改了什么 C 代码，二进制里变成了什么」。
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/bininsight/dilipa"
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-primary"
            >
              GitHub 仓库
              <span className="font-mono" aria-hidden="true">→</span>
            </a>
            <Link href="#demo" className="u-btn u-btn-ghost">
              查看概念演示
            </Link>
          </div>
        </div>
      </section>

      {/* 工具介绍 */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <p className="u-eyebrow mb-4">Overview</p>
            <h2 className="u-display text-2xl md:text-3xl mb-5">工具介绍</h2>
            <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mb-6">
              传统二进制补丁直接操作机器码，门槛高且容易出错。Dilipa 的核心思路是
              <span className="text-[var(--text)]">「提升 → 编辑 → 映射」</span>：
              先把二进制反编译为可读的 C 代码，让安全分析人员在熟悉的抽象层上修改，
              再由工具自动完成 C 层修改到指令层修改的精确映射。
            </p>
            <div className="border-t border-[var(--border)]">
              {[
                ['定位', '在 Ghidra 提升的 C 代码中定位漏洞行'],
                ['编辑', '像写普通 C 代码一样替换危险调用'],
                ['映射', 'AST Diff 自动生成指令级补丁'],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[48px_64px_1fr] gap-3 py-3 border-b border-[var(--border)] items-baseline">
                  <span className="u-flow-tick" aria-hidden="true" />
                  <span className="font-mono text-[12px] text-[var(--brand-500)]">{k}</span>
                  <span className="text-[13px] text-[var(--text-muted)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <TerminalMock />
        </div>
      </section>

      {/* 工作原理：编号 + 箭头串联 */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 md:py-20">
          <p className="u-eyebrow mb-4">Pipeline</p>
          <h2 className="u-display text-2xl md:text-3xl mb-10">工作原理</h2>

          <div>
            {principleSteps.map((step, idx) => (
              <div key={step.title}>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="u-flow-tick" aria-hidden="true" />
                  <h3 className="text-[16px] font-semibold">{step.title}</h3>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-4 pl-9">
                  {step.desc}
                </p>
                <div className="pl-9 mb-2">
                  <CodeBlock code={step.code} language="bash" showLineNumbers={false} />
                </div>
                {idx < principleSteps.length - 1 && (
                  <div className="pl-9 py-3 text-[var(--text-soft)]">
                    <span className="font-mono" aria-hidden="true">↓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 交互演示 */}
      <section id="demo" className="max-w-5xl mx-auto px-5 sm:px-8 py-16 md:py-20 scroll-mt-24">
        <p className="u-eyebrow mb-4">Interactive Demo</p>
        <h2 className="u-display text-2xl md:text-3xl mb-3">交互式概念演示</h2>
        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-2xl leading-relaxed">
          下面用一个最小的 strcpy 栈溢出例子，完整演示 C 层编辑到汇编指令变化的映射。
          点击「应用补丁」查看双层 diff。
        </p>
        <DilipaDemo />
      </section>

      {/* 使用教程 */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 md:py-20">
          <p className="u-eyebrow mb-4">Walkthrough</p>
          <h2 className="u-display text-2xl md:text-3xl mb-10">使用教程</h2>

          <div className="space-y-10">
            {tutorials.map((t) => (
              <div key={t.title}>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="u-flow-tick" aria-hidden="true" />
                  <h3 className="text-[16px] font-semibold">{t.title}</h3>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] mb-4 pl-9">{t.desc}</p>
                <div className="pl-9">
                  <CodeBlock code={t.code} language="bash" showLineNumbers={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16 md:py-20">
        <p className="u-eyebrow mb-4">FAQ</p>
        <h2 className="u-display text-2xl md:text-3xl mb-8">常见问题</h2>
        <div className="border-t border-[var(--border)]">
          {faqs.map((faq, idx) => (
            <details key={idx} className="border-b border-[var(--border)] group">
              <summary className="flex items-baseline gap-4 py-5 cursor-pointer list-none">
                <span className="u-flow-tick u-flow-tick--inline" aria-hidden="true" />
                <span className="flex-1 text-[14.5px] font-medium group-open:text-[var(--brand-500)] transition-colors">
                  {faq.q}
                </span>
                <span className="font-mono text-[var(--text-soft)] text-xs group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="pb-5 pl-9 pr-6 text-[13px] text-[var(--text-muted)] leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="u-display text-2xl md:text-3xl mb-2">在 C 层面修补二进制</h2>
            <p className="text-sm text-[var(--text-muted)]">
              从 Ghidra 提升到 trampoline 注入，完整理解微补丁生成的每一步。
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <a
              href="https://github.com/bininsight/dilipa"
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn-primary"
            >
              访问 GitHub
              <span className="font-mono" aria-hidden="true">→</span>
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
