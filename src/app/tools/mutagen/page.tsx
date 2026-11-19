import Link from 'next/link';
import SourceBadge from '@/components/SourceBadge';

/**
 * Mutagen · 设计构想（本次课程作业未实现）。
 *
 * T04 / P0-3：整页重写为 1 屏，只保留构想与边界说明。
 * 页面里不再出现版本号、安装命令、下载入口、终端回放、支持度统计或后续版本计划。
 * 全部改用三态语言说明边界：本页只有「规划中」，没有任何可下载、可运行的东西。
 */

export const metadata = {
  title: 'Mutagen · 设计构想（本次未实现） | BinInsight',
  description:
    'Mutagen 是一个「一键式自动化漏洞发现与修复」的设计构想，本次并未实现；本页只记录设想与边界，不提供任何下载或运行入口。',
};

const ideas = [
  {
    title: '设想：自动发现 + 自动修复',
    body: '原本设想把「扫描 → 生成补丁 → 验证修复」串成一条命令，减少人工分析成本。',
  },
  {
    title: '设想：多个分析角色分工',
    body: '原本设想让扫描、验证等角色互相校验，提高准确率。',
  },
  {
    title: '设想：覆盖多种语言与无源码场景',
    body: '原本设想同时处理源码与二进制，并支持没有源码的目标。',
  },
];

const notDone = [
  '没有可执行的 Mutagen 程序，也没有版本号或发布包',
  '没有自动化扫描、fuzzing 或补丁生成',
  '没有 CWE 支持度表，也没有任何漏洞统计数字',
  '没有二进制重写引擎，没有补丁等价性校验',
  '不需要 Docker、Ghidra 或任何 API Key —— 因为本页没有东西要跑',
];

export default function MutagenPage() {
  return (
    <div>
      <section className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 pb-12">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-8">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <Link href="/tools" className="hover:text-[var(--text)] transition-colors">工具</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--brand-500)]">Mutagen</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <h1 className="u-display text-3xl md:text-[40px]">Mutagen</h1>
            <SourceBadge state="planned" showNote />
          </div>

          <p className="text-[15px] md:text-base text-[var(--text-muted)] leading-relaxed mb-7">
            这是一个<strong className="text-[var(--text)]">设计构想</strong>：
            希望有一天能一条命令完成漏洞发现与修复。
            <strong className="text-[var(--text)]">本次没有实现它</strong> ——
            没有可下载的程序，没有可运行的命令，也没有任何分析结果可以展示。
          </p>

          <div className="u-warning-card mb-8">
            请按「规划中」理解本页：下面列出的都是<strong>设想</strong>，不是已做好的功能。
            老师若问「跑一下 Mutagen」，与页面一致的回答是：本次没有实现，跑不出来，也不提供下载。
          </div>

          <div className="u-panel p-5 md:p-6 mb-8">
            <p className="u-eyebrow mb-1.5">IDEAS · 构想</p>
            <h2 className="text-lg font-semibold tracking-tight mb-5">当初想做成什么样</h2>
            <div className="space-y-5">
              {ideas.map((item) => (
                <div key={item.title} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="u-flow-tick" aria-hidden="true" />
                  <div>
                    <h3 className="text-[14px] font-semibold mb-1">{item.title}</h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 pt-4 border-t border-[var(--border)] text-[12px] text-[var(--text-soft)] leading-relaxed">
              以上每一条都需要独立的子系统与大量工程工作，远超一次教学演示能讲清、能演示的范围，
              因此只保留为构想，不进入演示动线。
            </p>
          </div>

          <div className="u-panel p-5 md:p-6 mb-8">
            <p className="u-eyebrow mb-1.5">BOUNDARY · 边界</p>
            <h2 className="text-lg font-semibold tracking-tight mb-4">本次明确没有的东西</h2>
            <ul className="space-y-2.5">
              {notDone.map((line) => (
                <li key={line} className="text-[13px] text-[var(--text-muted)] leading-relaxed flex gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]" aria-hidden="true">—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
              想看<strong className="text-[var(--text)]">这次真正做了什么</strong>：
              Dilipa 侧只做只读的 ELF 分析、反汇编、危险调用名单与 JSON 报告，以及网页上的变更预览；
              主线 8 级才是本次可以完整走完的演示。
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/tools/dilipa" className="u-btn u-btn-primary">
                看 Dilipa 的只读分析 + 变更预览
                <span className="font-mono" aria-hidden="true">→</span>
              </Link>
              <Link href="/learn/l0" className="u-btn u-btn-ghost">
                回到 8 级主线
              </Link>
              <Link href="/tools" className="u-btn u-btn-ghost">
                <span className="font-mono" aria-hidden="true">←</span>
                返回工具
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
