import Link from 'next/link';
import { Wrench, Zap, Target, ArrowRight, Download, BookOpen } from 'lucide-react';

export default function ToolsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bg-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">首页</Link>
            <span>/</span>
            <span className="text-accent-purple">工具下载</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">工具下载与使用</h1>
          <p className="text-gray-400 max-w-2xl">
            两款互补工具形成完整梯度：从一键自动化到手动精细控制，满足不同深度的分析需求。
            本层工具依赖 <span className="text-brand-300 font-mono">Ghidra</span>，请先安装。
          </p>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mutagen */}
          <Link href="/tools/mutagen" className="group">
            <div className="h-full bg-bg-card border border-border rounded-2xl p-8 transition-all hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5 group-hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Zap size={28} className="text-white" />
                </div>
                <span className="px-3 py-1 bg-accent-orange/15 text-accent-orange text-xs font-semibold rounded-full border border-accent-orange/30">
                  一键式
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Mutagen</h2>
              <p className="text-brand-300 text-sm mb-4">AI驱动自动化漏洞发现与修复</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                一条命令跑完"发现漏洞 → 生成补丁 → 验证修复"全流程。
                基于 AI fuzzer 和多 agent 协作，支持 C/C++、Rust、Python、Go，
                可通过 Ghidra 无头模式处理无源码二进制。
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['AI Fuzzer', '自动修复', '多语言', 'Ghidra集成'].map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 bg-bg-hover rounded-full text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-brand-400 font-medium">
                查看详情与下载
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Dilipa */}
          <Link href="/tools/dilipa" className="group">
            <div className="h-full bg-bg-card border border-border rounded-2xl p-8 transition-all hover:border-accent-purple/40 hover:shadow-xl hover:shadow-accent-purple/5 group-hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-purple-700 flex items-center justify-center shadow-lg shadow-accent-purple/20">
                  <Target size={28} className="text-white" />
                </div>
                <span className="px-3 py-1 bg-brand-500/15 text-brand-300 text-xs font-semibold rounded-full border border-brand-500/30">
                  手动式
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Dilipa</h2>
              <p className="text-accent-purple text-sm mb-4">手动微补丁实验台 · C级提升编辑</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                把二进制补丁表达为对提升后的 C 代码的编辑。用户修改 C 代码，
                系统自动映射回指令级修改。直观理解"改了什么C代码，二进制里变成了什么"。
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['C级编辑', '指令映射', '可视化对比', '概念演示'].map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 bg-bg-hover rounded-full text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-accent-purple font-medium">
                查看详情与演示
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Workflow Connection */}
        <div className="mt-16 bg-bg-card border border-border rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Wrench size={20} className="text-brand-400" />
            工具联动学习路径
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-1 bg-bg-soft border border-border rounded-xl p-5">
              <div className="text-sm text-accent-orange font-semibold mb-1">Step A</div>
              <div className="font-bold mb-2">Mutagen 快速扫描</div>
              <p className="text-sm text-gray-400">用 Mutagen 对目标程序进行自动化漏洞扫描，生成初步补丁建议</p>
            </div>
            <ArrowRight size={24} className="text-gray-600 hidden md:block" />
            <div className="flex-1 bg-bg-soft border border-border rounded-xl p-5">
              <div className="text-sm text-brand-400 font-semibold mb-1">Step B</div>
              <div className="font-bold mb-2">导出代码差异</div>
              <p className="text-sm text-gray-400">导出 Mutagen 生成的补丁前后代码差异（diff）</p>
            </div>
            <ArrowRight size={24} className="text-gray-600 hidden md:block" />
            <div className="flex-1 bg-bg-soft border border-border rounded-xl p-5">
              <div className="text-sm text-accent-purple font-semibold mb-1">Step C</div>
              <div className="font-bold mb-2">Dilipa 深度理解</div>
              <p className="text-sm text-gray-400">在 Dilipa 中查看自动补丁在提升后 C 层面的修改细节，理解二进制映射</p>
            </div>
          </div>
        </div>

        {/* Ghidra Dependency Note */}
        <div className="mt-8 p-5 bg-brand-500/5 border border-brand-500/20 rounded-xl">
          <div className="flex gap-3">
            <Download size={20} className="text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-brand-300 mb-1">环境前置：安装 Ghidra</div>
              <p className="text-sm text-gray-400">
                两款工具均依赖 Ghidra 进行二进制反编译。请先前往{' '}
                <a
                  href="https://ghidra-sre.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline"
                >
                  ghidra-sre.org
                </a>{' '}
                下载安装，并配置 <code className="inline bg-bg-hover px-1.5 py-0.5 rounded text-xs">GHIDRA_INSTALL_DIR</code> 环境变量。
                推荐版本：Ghidra 11.x + JDK 17+。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
