import Link from 'next/link';
import {
  Binary,
  BookOpen,
  Wrench,
  FileCode,
  Unlock,
  Search,
  Route,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Github,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/10 via-transparent to-accent-purple/10" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
              <Sparkles size={14} />
              逆向工程 × 漏洞防护 · 系统化学习平台
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="gradient-text">洞见二进制世界</span>
              <br />
              <span className="text-white">从逆向分析到漏洞防护</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              三层结构带你系统掌握二进制安全：
              <span className="text-brand-300">教学引导</span> 建立认知、
              <span className="text-accent-purple">工具下载</span> 动手实践、
              <span className="text-accent-green">案例展示</span> 对照检验。
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/learn/step1"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-600/25"
              >
                <BookOpen size={18} />
                开始学习
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-hover border border-border text-white font-semibold rounded-xl transition-colors"
              >
                <FileCode size={18} />
                浏览案例
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three Layers Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">三层学习体系</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            从理论到实践，从入门到进阶，循序渐进掌握逆向工程与漏洞防护
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Layer 1 */}
          <Link href="/learn" className="group">
            <div className="h-full bg-bg-card border border-border rounded-2xl p-6 transition-all hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BookOpen size={24} className="text-brand-400" />
              </div>
              <div className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-2">
                第一层 · 教学引导
              </div>
              <h3 className="text-xl font-bold mb-3">四步系统化学习</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                解包识别 → 静态分析 → 路径探索 → 防护策略，每步配有交互示例，支持新手/进阶双模式切换。
              </p>
              <div className="flex flex-wrap gap-2">
                {['ELF结构', '反汇编', '漏洞确认', '防护机制'].map((t) => (
                  <span key={t} className="text-xs px-2 py-1 bg-bg-hover rounded-md text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>

          {/* Layer 2 */}
          <Link href="/tools" className="group">
            <div className="h-full bg-bg-card border border-border rounded-2xl p-6 transition-all hover:border-accent-purple/40 hover:shadow-lg hover:shadow-accent-purple/5 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wrench size={24} className="text-accent-purple" />
              </div>
              <div className="text-xs text-accent-purple font-semibold uppercase tracking-wider mb-2">
                第二层 · 工具下载
              </div>
              <h3 className="text-xl font-bold mb-3">两款互补工具</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Mutagen 一键自动化 + Dilipa 手动微补丁，从快速检测到精细控制，覆盖完整工具链。
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap size={14} className="text-accent-orange" />
                  <span className="text-gray-300">Mutagen · AI驱动自动化检测</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target size={14} className="text-brand-400" />
                  <span className="text-gray-300">Dilipa · C级微补丁实验台</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Layer 3 */}
          <Link href="/cases" className="group">
            <div className="h-full bg-bg-card border border-border rounded-2xl p-6 transition-all hover:border-accent-green/40 hover:shadow-lg hover:shadow-accent-green/5 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-accent-green/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileCode size={24} className="text-accent-green" />
              </div>
              <div className="text-xs text-accent-green font-semibold uppercase tracking-wider mb-2">
                第三层 · 案例展示
              </div>
              <h3 className="text-xl font-bold mb-3">可复现实战案例</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                下载目标文件，本地复现分析流程，对照标准答案检验学习成果，比在线分析更有学习价值。
              </p>
              <div className="flex flex-wrap gap-2">
                {['栈溢出', 'UAF', '补丁比对'].map((t) => (
                  <span key={t} className="text-xs px-2 py-1 bg-bg-hover rounded-md text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Learning Path Preview */}
      <section className="bg-bg-soft border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">标准化分析流程</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              遵循专业逆向工程师的工作流，从拿到二进制文件到确认漏洞、制定防护策略
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-accent-purple to-accent-green opacity-30 -translate-y-1/2" />

            <div className="grid md:grid-cols-4 gap-6 relative">
              {[
                { icon: Unlock, step: 'Step 1', title: '解包与识别', desc: '分析文件类型、格式结构、提取关键信息' },
                { icon: Search, step: 'Step 2', title: '静态分析', desc: '反汇编、函数识别、定位危险调用' },
                { icon: Route, step: 'Step 3', title: '路径探索', desc: '源到汇分析、确认漏洞可达性' },
                { icon: Shield, step: 'Step 4', title: '防护策略', desc: '栈保护、CFI、补丁比对' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative">
                    <div className="bg-bg-card border border-border rounded-xl p-5 h-full">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                          <Icon size={20} className="text-brand-400" />
                        </div>
                        <span className="text-xs font-mono text-brand-400">{item.step}</span>
                      </div>
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/learn/step1"
              className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium"
            >
              进入完整学习路径
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">为什么选择 BinInsight</h2>
          <p className="text-gray-400">专为学习者设计的二进制安全平台</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Binary,
              title: '可视化交互学习',
              desc: '每个知识点都配有可交互示例，点击、标注、拖拽中理解抽象概念，告别纯文字阅读。',
            },
            {
              icon: CheckCircle2,
              title: '有标准答案的案例',
              desc: '所有案例都附带完整分析报告和预期结果，下载文件本地实操后可以对照检验。',
            },
            {
              icon: Github,
              title: '开源工具链',
              desc: '基于 Ghidra、Docker 等开源生态，工具可本地部署运行，不依赖在线 SaaS 服务。',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-bg-card border border-border rounded-xl p-6">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700/30 via-bg-card to-accent-purple/20 border border-border p-10 md:p-14 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-brand-500/10 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">准备好深入二进制世界了吗？</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              从第一个 ELF 文件开始，一步步掌握逆向分析与漏洞防护的核心技能
            </p>
            <Link
              href="/learn/step1"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-bg font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl"
            >
              开始第一步学习
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
