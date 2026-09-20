import Link from 'next/link';
import {
  Target,
  Github,
  ArrowRight,
  ChevronRight,
  Code2,
  FileCode,
  GitCompare,
  Cpu,
  Layers,
  BookOpen,
  Sparkles,
  FileJson,
  Play,
} from 'lucide-react';
import CodeBlock from '@/components/CodeBlock';
import DilipaDemo from '@/components/DilipaDemo';

export const metadata = {
  title: 'Dilipa · 手动微补丁实验台 | BinInsight',
  description:
    'Dilipa 把二进制补丁表达为 C 代码编辑，通过 AST 对比提取最小补丁并映射回指令级修改。',
};

const principleSteps = [
  {
    step: '01',
    title: '二进制提升 (Lifting)',
    desc: '通过 Ghidra 将二进制反编译为可读的 C 代码，建立指令到 C 语句的映射关系。',
    icon: Cpu,
    color: 'brand',
  },
  {
    step: '02',
    title: 'C 代码编辑',
    desc: '用户在提升后的 C 代码上进行修改，就像修改普通源码一样直观。',
    icon: Code2,
    color: 'accent-green',
  },
  {
    step: '03',
    title: 'AST Diff 提取',
    desc: '对修改前后的 C 代码进行抽象语法树对比，提取最小语义变更集。',
    icon: GitCompare,
    color: 'accent-purple',
  },
  {
    step: '04',
    title: '指令级映射',
    desc: '将 AST 级别的变更映射回原始二进制的指令级别，确定需要修改的指令范围。',
    icon: Layers,
    color: 'accent-orange',
  },
  {
    step: '05',
    title: 'Trampoline / 直接替换',
    desc: '根据修改大小选择策略：小修改直接替换指令，大修改生成 trampoline 跳板。',
    icon: FileCode,
    color: 'accent-cyan',
  },
];

export default function DilipaPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-bg-soft border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-brand-700/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />

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
            <span className="text-accent-purple">Dilipa</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-purple-700 flex items-center justify-center shadow-lg shadow-accent-purple/20">
                  <Target size={32} className="text-white" />
                </div>
                <span className="px-3 py-1 bg-brand-500/15 text-brand-300 text-sm font-semibold rounded-full border border-brand-500/30">
                  手动式
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">Dilipa</h1>
              <p className="text-xl text-accent-purple mb-4">手动微补丁实验台 · 把二进制补丁表达为 C 代码编辑</p>
              <p className="text-gray-400 max-w-2xl leading-relaxed mb-8">
                直接改汇编太繁琐？Dilipa 让你在提升后的 C 代码上编辑补丁，系统自动通过 AST 对比
                提取最小修改集，再映射回指令级修改。直观理解"改了什么 C 代码，二进制里变成了什么"。
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://github.com/bininsight/dilipa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent-purple/25"
                >
                  <Github size={18} />
                  GitHub 仓库
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-hover border border-border text-white font-semibold rounded-xl transition-colors"
                >
                  <Play size={18} />
                  在线概念演示
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
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-accent-purple">核心理念</h3>
                <p className="text-gray-400 leading-relaxed">
                  二进制到 C 代码提升 → 用户编辑补丁 → AST 对比提取最小补丁 → 映射回指令级修改。
                  让二进制补丁工作从"汇编级别"提升到"C 代码级别"，大幅降低门槛。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-brand-400">解决的问题</h3>
                <p className="text-gray-400 leading-relaxed">
                  直接修改汇编指令繁琐且容易出错，需要精确计算偏移、处理指令长度、维护相对地址。
                  Dilipa 让你用熟悉的 C 语法表达补丁意图，系统自动处理底层的指令级细节。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-xs text-gray-500 font-mono mb-3">dilipa patch --diff patch.diff target.bin</div>
            <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="text-gray-400">[INFO] Loading target binary...</div>
              <div className="text-gray-400">[INFO] Decompiling with Ghidra...</div>
              <div className="text-brand-300">[LIFT] Lifted 38 functions to C</div>
              <div className="text-accent-purple">[DIFF] Parsing C diff...</div>
              <div className="text-accent-purple">[DIFF] 2 AST changes detected</div>
              <div className="text-accent-orange">[MAP] Mapping to instruction level...</div>
              <div className="text-accent-green">[PATCH] Strategy: direct replacement</div>
              <div className="text-accent-green">[PATCH] 6 instructions modified</div>
              <div className="text-accent-green">[VERIFY] Verification: PASS</div>
              <div className="text-white mt-2">{'─'.repeat(40)}</div>
              <div className="text-white">
                Output: <span className="text-accent-green">target_patched.bin</span>
              </div>
              <div className="text-gray-400">Patch report: ./dilipa_patch_report.json</div>
            </div>
          </div>
        </div>
      </section>

      {/* Principle */}
      <section className="bg-bg-soft border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">原理讲解</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            从二进制到 C 代码，再从 C 代码修改回到二进制补丁，五个步骤完成完整映射
          </p>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-accent-purple to-accent-cyan opacity-20 -translate-y-1/2" />

            <div className="grid md:grid-cols-5 gap-6 relative">
              {principleSteps.map((step, idx) => {
                const Icon = step.icon;
                const colorClasses: Record<string, string> = {
                  brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
                  'accent-green': 'bg-accent-green/15 text-accent-green border-accent-green/30',
                  'accent-purple': 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
                  'accent-orange': 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
                  'accent-cyan': 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
                };
                return (
                  <div key={step.step} className="relative">
                    <div className="bg-bg-card border border-border rounded-xl p-5 h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[step.color]} border`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-xs font-mono text-gray-600">Step {step.step}</span>
                      </div>
                      <h3 className="font-bold mb-2 text-sm">{step.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                    </div>
                    {idx < principleSteps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                        <ArrowRight size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-sm font-medium mb-4">
            <Sparkles size={14} />
            概念演示版
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">在线概念演示</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            点击"应用补丁"，观察 C 代码层面的修改如何对应到汇编指令层面的变化
          </p>
        </div>

        <DilipaDemo />

        <div className="mt-6 p-4 bg-bg-card border border-dashed border-border rounded-xl text-center">
          <p className="text-sm text-gray-400">
            这是概念演示版，展示了 Dilipa 的核心思路。完整功能请下载 Dilipa 工具，
            支持加载任意二进制、自由编辑提升后的 C 代码、生成可执行的补丁文件。
          </p>
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
                <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">加载二进制文件</h3>
                  <p className="text-gray-400 mb-4">
                    使用 Dilipa 加载目标二进制文件，系统会自动调用 Ghidra 进行反编译并提升为 C 代码。
                  </p>
                  <CodeBlock
                    code={`# 加载二进制文件并生成提升后的 C 代码
dilipa load ./target_binary --output ./project

# 指定函数范围（可选，加快加载速度）
dilipa load ./target_binary --funcs process_input,main --output ./project

# 查看加载结果
ls ./project/
# lifted/       - 提升后的 C 代码（每个函数一个 .c 文件）
# mapping.json  - 指令到 C 语句的映射关系
# target.gpr    - Ghidra 项目文件`}
                    language="bash"
                    title="终端 - 加载二进制"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative step-line">
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">在提升后的 C 代码上做修改</h3>
                  <p className="text-gray-400 mb-4">
                    编辑 lifted/ 目录下的 C 代码文件，就像修改普通源码一样。支持任意编辑器或 IDE。
                  </p>
                  <CodeBlock
                    code={`// 修改前：lifted/process_input.c
void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);
    printf("Input: %s\\n", buffer);
}

// 修改后：添加边界检查
void process_input(char *input) {
    char buffer[64];
    strncpy(buffer, input, 63);  // 安全复制
    buffer[63] = '\\0';           // 确保终止
    printf("Input: %s\\n", buffer);
}

// 生成 diff（标准 git diff 格式）
diff -u lifted/process_input.c modified/process_input.c > patch.diff`}
                    language="c"
                    title="编辑提升后的 C 代码"
                    highlightLines={[9, 10]}
                  />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex gap-5">
                <div className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">验证映射结果</h3>
                  <p className="text-gray-400 mb-4">
                    应用补丁并验证：检查指令级映射是否正确，验证补丁后二进制的功能完整性。
                  </p>
                  <CodeBlock
                    code={`# 应用补丁
dilipa patch ./project --diff patch.diff --output patched.bin

# 查看补丁详情
dilipa inspect ./project patched.bin --diff patch.diff
# === Patch Report ===
# Function: process_input
# AST changes: 2 (FunctionCall strcpy->strncpy, +Assignment)
# Instructions modified: 6
# Strategy: direct replacement
# Trampolines: 0
# Bytes added: 8

# 验证功能（运行测试用例）
dilipa verify ./project patched.bin --tests test_cases.json
# Test 1: normal input ....... PASS
# Test 2: boundary input ..... PASS
# Test 3: overflow input ..... PASS (blocked)

# 反汇编对比验证
dilipa diff-asm ./project patched.bin --func process_input`}
                    language="bash"
                    title="终端 - 验证补丁"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-purple/30 via-bg-card to-brand-700/20 border border-border p-10 md:p-14 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-accent-purple/10 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">获取 Dilipa</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              完整功能请访问 GitHub 仓库下载，支持 Linux / macOS / WSL2
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/bininsight/dilipa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-bg font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl"
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
