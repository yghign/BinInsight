import Link from 'next/link';
import {
  Zap,
  Download,
  Github,
  Bot,
  Cpu,
  Code2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Settings,
  FileBarChart,
  HelpCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import CodeBlock from '@/components/CodeBlock';

export const metadata = {
  title: 'Mutagen · 一键式自动化漏洞发现与修复 | BinInsight',
  description:
    'Mutagen 是基于 AI 的 fuzzer 和自动程序修复引擎，支持多语言、无源码场景，一键完成漏洞发现与修复。',
};

const supportedTargets = [
  { name: 'ELF 可执行文件', desc: 'Linux 平台二进制，通过 Ghidra 反编译分析', icon: Cpu },
  { name: 'C/C++ 源码', desc: '直接分析源代码，支持 GCC/Clang 编译链', icon: Code2 },
  { name: 'Python 脚本', desc: 'AST 级别的静态分析 + 动态 fuzzing', icon: Code2 },
];

const vulnCategories = [
  { cwe: 'CWE-120', name: '缓冲区溢出', status: 'supported' },
  { cwe: 'CWE-416', name: 'Use-After-Free', status: 'supported' },
  { cwe: 'CWE-78', name: '命令注入', status: 'supported' },
  { cwe: 'CWE-134', name: '格式化字符串', status: 'supported' },
  { cwe: 'CWE-190', name: '整数溢出', status: 'supported' },
  { cwe: 'CWE-476', name: '空指针解引用', status: 'supported' },
  { cwe: 'CWE-20', name: '输入验证不当', status: 'partial' },
  { cwe: 'CWE-119', name: '内存越界访问', status: 'partial' },
];

const faqs = [
  {
    q: '安装时提示找不到 Ghidra，怎么办？',
    a: '请确保已安装 Ghidra 11.x 并配置了 GHIDRA_INSTALL_DIR 环境变量，指向 Ghidra 的安装目录（包含 ghidraRun 脚本的目录）。Docker 方式无需手动安装 Ghidra，镜像已内置。',
  },
  {
    q: '必须配置 LLM API Key 吗？',
    a: '不是必须的。Mutagen 有内置的符号执行和模式匹配引擎，不配置 LLM 也能完成基础漏洞检测。配置 LLM API Key 后可以启用更智能的补丁生成和复杂路径分析能力。',
  },
  {
    q: '运行时报错 "Docker daemon not running"？',
    a: 'Mutagen 的 fuzzing 和沙箱功能依赖 Docker。请确保 Docker Desktop（Windows/macOS）或 Docker 服务（Linux）已启动。可以运行 docker ps 命令检查 Docker 是否正常运行。',
  },
  {
    q: '支持 Windows PE 文件吗？',
    a: '当前版本主要支持 Linux ELF 格式。Windows PE 支持在开发路线图中，预计 v2.0 版本推出。目前你可以在 WSL2 环境中运行 Mutagen 分析 Linux 二进制。',
  },
  {
    q: '扫描速度很慢，如何优化？',
    a: '可以通过 --fast 模式减少 fuzzing 迭代次数；使用 --target 指定具体函数缩小分析范围；增加 --workers 并行度。首次扫描会建立 Ghidra 项目缓存，后续扫描会更快。',
  },
  {
    q: '生成的补丁可以直接用于生产环境吗？',
    a: '不建议直接用于生产。Mutagen 生成的补丁是自动修复的建议方案，需要人工审查验证。自动修复可能引入新的逻辑问题或性能问题。请在测试环境充分验证后再考虑部署。',
  },
];

export default function MutagenPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-bg-soft border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/10 via-transparent to-accent-orange/10" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              首页
            </Link>
            <ChevronRight size={14} />
            <Link href="/tools" className="hover:text-white transition-colors">
              工具下载
            </Link>
            <ChevronRight size={14} />
            <span className="text-brand-300">Mutagen</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Zap size={32} className="text-white" />
                </div>
                <span className="px-3 py-1 bg-accent-orange/15 text-accent-orange text-sm font-semibold rounded-full border border-accent-orange/30">
                  一键式
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">Mutagen</h1>
              <p className="text-xl text-brand-300 mb-4">AI 驱动的自动化漏洞发现与修复引擎</p>
              <p className="text-gray-400 max-w-2xl leading-relaxed mb-8">
                一条命令跑完"发现漏洞 → 生成补丁 → 验证修复"全流程。
                基于 AI fuzzer 和多 agent 协作架构，支持 C/C++、Rust、Python、Go，
                可通过 Ghidra 无头模式处理无源码二进制文件。
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://github.com/bininsight/mutagen/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-600/25"
                >
                  <Download size={18} />
                  GitHub Release
                </a>
                <a
                  href="https://hub.docker.com/r/bininsight/mutagen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-hover border border-border text-white font-semibold rounded-xl transition-colors"
                >
                  <Terminal size={18} />
                  Docker Pull
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">工具介绍</h2>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                  <Bot size={20} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI 驱动的 Fuzzer + 自动修复</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    结合符号执行、覆盖率引导 fuzzing 和大语言模型，自动发现漏洞并生成修复建议，
                    减少人工分析成本。
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-purple/15 flex items-center justify-center flex-shrink-0">
                  <Cpu size={20} className="text-accent-purple" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">多 Agent 协作架构</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    分析 Agent、Fuzzing Agent、修复 Agent、验证 Agent 分工协作，
                    模拟专业安全团队的工作流程，互相校验提高准确率。
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-green/15 flex items-center justify-center flex-shrink-0">
                  <Code2 size={20} className="text-accent-green" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">多语言支持</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    支持 C/C++、Rust、Python、Go 五种主流语言，源码和二进制场景均可分析，
                    适配不同的项目技术栈。
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-orange/15 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={20} className="text-accent-orange" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">无源码场景支持</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    通过 Ghidra 无头模式反编译二进制文件，将反编译结果提升为可分析的中间表示，
                    实现对闭源软件的漏洞检测。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-xs text-gray-500 font-mono mb-3">mutagen scan --report</div>
            <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="text-gray-400">[INFO] Loading target: ./vuln_program</div>
              <div className="text-gray-400">[INFO] Ghidra decompilation... 100%</div>
              <div className="text-brand-300">[SCAN] Analyzing 42 functions...</div>
              <div className="text-accent-orange">[WARN] CWE-120 detected at main+0x42</div>
              <div className="text-accent-red">[CRIT] CWE-416 detected at process_data+0x98</div>
              <div className="text-accent-green">[FIX] Generating patch for CWE-120...</div>
              <div className="text-accent-green">[FIX] Patch verified: PASS</div>
              <div className="text-accent-green">[FIX] Generating patch for CWE-416...</div>
              <div className="text-accent-orange">[WARN] CWE-416 patch: manual review required</div>
              <div className="text-white mt-2">{'─'.repeat(40)}</div>
              <div className="text-white">
                Results: <span className="text-accent-red">2 vulnerabilities</span> found
              </div>
              <div className="text-white">
                Patches: <span className="text-accent-green">1 auto-fixed</span>, 1 review required
              </div>
              <div className="text-gray-400">Report saved to ./mutagen_report.html</div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities & Limitations */}
      <section className="bg-bg-soft border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">能力与边界</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {supportedTargets.map((target) => {
              const Icon = target.icon;
              return (
                <div key={target.name} className="bg-bg-card border border-border rounded-xl p-6">
                  <div className="w-11 h-11 rounded-lg bg-brand-500/15 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-brand-400" />
                  </div>
                  <h3 className="font-bold mb-2">{target.name}</h3>
                  <p className="text-gray-400 text-sm">{target.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Supported Vulns */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 size={20} className="text-accent-green" />
                <h3 className="text-lg font-bold">检测的漏洞类别</h3>
              </div>
              <div className="space-y-3">
                {vulnCategories.map((v) => (
                  <div key={v.cwe} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-bg-soft text-brand-300">
                        {v.cwe}
                      </span>
                      <span className="text-sm">{v.name}</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        v.status === 'supported' ? 'text-accent-green' : 'text-accent-orange'
                      }`}
                    >
                      {v.status === 'supported' ? '完整支持' : '部分支持'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Limitations */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <XCircle size={20} className="text-accent-red" />
                <h3 className="text-lg font-bold">已知局限</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-accent-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">复杂 C++ 虚函数分析受限</div>
                    <p className="text-gray-400 text-xs mt-1">
                      多继承、虚继承、模板元编程等复杂 C++ 特性可能导致反编译不完整，影响分析准确率。
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-accent-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">混淆代码效果下降</div>
                    <p className="text-gray-400 text-xs mt-1">
                      经过 OLLVM、VMProtect 等混淆器处理的代码，反编译质量下降明显，漏洞检测率会降低。
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-accent-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">多线程并发漏洞</div>
                    <p className="text-gray-400 text-xs mt-1">
                      竞态条件、死锁等并发类漏洞当前检测能力有限，主要关注单线程执行路径上的内存安全问题。
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-accent-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">逻辑业务漏洞</div>
                    <p className="text-gray-400 text-xs mt-1">
                      权限绕过、业务逻辑缺陷等需要理解业务语义的漏洞不在当前检测范围内。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Environment Requirements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">环境要求</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
              <Cpu size={28} className="text-brand-400" />
            </div>
            <h3 className="font-bold mb-2">Ghidra 11.x + JDK 17+</h3>
            <p className="text-gray-400 text-sm">
              二进制反编译引擎，用于无源码场景分析
            </p>
            <div className="text-xs text-gray-500 mt-3">必需（二进制分析场景）</div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-accent-purple/15 flex items-center justify-center mx-auto mb-4">
              <Terminal size={28} className="text-accent-purple" />
            </div>
            <h3 className="font-bold mb-2">Docker</h3>
            <p className="text-gray-400 text-sm">
              Fuzzing 沙箱环境，隔离漏洞验证过程
            </p>
            <div className="text-xs text-gray-500 mt-3">必需</div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
              <Bot size={28} className="text-accent-green" />
            </div>
            <h3 className="font-bold mb-2">LLM API Key（可选）</h3>
            <p className="text-gray-400 text-sm">
              启用智能补丁生成和复杂路径分析
            </p>
            <div className="text-xs text-gray-500 mt-3">可选，推荐配置</div>
          </div>
        </div>
      </section>

      {/* Tutorial */}
      <section className="bg-bg-soft border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">使用教程</h2>

          <div className="space-y-10">
            {/* Step 1 */}
            <div className="relative step-line">
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">安装（Docker 方式）</h3>
                  <p className="text-gray-400 mb-4">
                    推荐使用 Docker 镜像，无需手动配置 Ghidra 和依赖环境。
                  </p>
                  <CodeBlock
                    code={`# 拉取 Mutagen Docker 镜像
docker pull bininsight/mutagen:latest

# 验证安装
docker run --rm bininsight/mutagen:latest mutagen --version
# Mutagen v1.2.0

# 创建别名方便使用
alias mutagen='docker run --rm -v $(pwd):/workspace -w /workspace bininsight/mutagen:latest mutagen'`}
                    language="bash"
                    title="终端 - 安装 Mutagen"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative step-line">
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">配置环境变量</h3>
                  <p className="text-gray-400 mb-4">
                    配置 LLM API Key 以启用智能分析和补丁生成功能（可选）。
                  </p>
                  <CodeBlock
                    code={`# 创建配置文件
cat > ~/.mutagen.env << 'EOF'
# LLM 配置（可选，用于智能补丁生成）
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=gpt-4o

# Ghidra 配置（源码分析可跳过）
GHIDRA_INSTALL_DIR=/opt/ghidra

# 并行度配置
MAX_WORKERS=4
EOF

# Docker 方式传入环境变量
alias mutagen='docker run --rm \
  -v $(pwd):/workspace -w /workspace \
  --env-file ~/.mutagen.env \
  bininsight/mutagen:latest mutagen'`}
                    language="bash"
                    title="终端 - 配置环境变量"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative step-line">
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">运行第一个示例</h3>
                  <p className="text-gray-400 mb-4">
                    对目标程序执行完整的漏洞扫描和自动修复。
                  </p>
                  <CodeBlock
                    code={`# 扫描二进制文件（自动调用 Ghidra 反编译）
mutagen scan ./target_binary --output report.html

# 扫描源码目录
mutagen scan ./src --lang c --output report.html

# 扫描并自动尝试修复
mutagen scan ./target_binary --fix --output report.html

# 快速扫描（减少 fuzzing 迭代，适合初步评估）
mutagen scan ./target_binary --fast --output report.html

# 指定目标函数缩小范围
mutagen scan ./target_binary --target process_data --output report.html`}
                    language="bash"
                    title="终端 - 运行扫描"
                  />
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">查看报告</h3>
                  <p className="text-gray-400 mb-4">
                    扫描完成后会生成 HTML 格式的报告，包含漏洞详情、代码位置、修复建议和验证结果。
                  </p>
                  <div className="bg-bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileBarChart size={18} className="text-brand-400" />
                        <span className="font-semibold">报告内容概览</span>
                      </div>
                      <span className="text-xs text-gray-500">report.html</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-bg-soft rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-accent-red">2</div>
                        <div className="text-xs text-gray-400 mt-1">高危漏洞</div>
                      </div>
                      <div className="bg-bg-soft rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-accent-orange">3</div>
                        <div className="text-xs text-gray-400 mt-1">中危漏洞</div>
                      </div>
                      <div className="bg-bg-soft rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-accent-green">3</div>
                        <div className="text-xs text-gray-400 mt-1">已自动修复</div>
                      </div>
                      <div className="bg-bg-soft rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-brand-400">42</div>
                        <div className="text-xs text-gray-400 mt-1">分析函数数</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">常见问题</h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-bg-card border border-border rounded-xl p-6">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={16} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700/30 via-bg-card to-accent-orange/20 border border-border p-10 md:p-14 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-brand-500/10 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">开始使用 Mutagen</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              一条命令，自动化发现并修复二进制和源代码中的漏洞
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/bininsight/mutagen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-bg font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl"
              >
                <Github size={18} />
                访问 GitHub
                <ArrowRight size={16} />
              </a>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-hover border border-border text-white font-semibold rounded-xl transition-colors"
              >
                返回工具列表
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
