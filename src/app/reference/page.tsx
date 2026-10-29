import Link from 'next/link';
import PathPreview from '@/components/PathPreview';
import { vulnPath } from '@/data/reference';

export const metadata = {
  title: '逆向工作台 · BinInsight',
  description: '四段式漏洞学习：原理图解 · 演示终端 · 动手构造 payload · 防御视角。互链而非孤立。',
};

/**
 * /reference 首页 —— 左 7 / 右 5 非对称双栏。
 * 左侧：标题区 + 设计哲学陈述 + 四段式方法解释。
 * 右侧：纵向路径节点（细线连接 + 状态透明度/线宽区分）。
 *
 * 严格禁用：渐变背景、玻璃卡片、三列功能卡、emoji 图标、
 *          每个模块统一「标题 + 副标题 + 卡片」节奏。
 */

export default function ReferenceIndexPage() {
  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
      {/* 左侧 7 栏 —— 标题区 + 四段式哲学 */}
      <main className="lg:col-span-7 min-w-0 space-y-14">
        {/* 面包屑 */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
          <span className="text-[var(--border-soft)]">/</span>
          <span className="text-[var(--text-muted)]">逆向工作台</span>
        </div>

        {/* 标题区 */}
        <section className="space-y-5">
          <p className="u-eyebrow">REVERSE ENGINEERING WORKBENCH</p>
          <h1 className="u-display text-3xl md:text-[40px] leading-tight">
            逆向工作台
          </h1>
          <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-xl">
            四个漏洞，每个四段。不把它们切成孤立的知识点 —— 让栈溢出的 ret 覆盖动画和
            Use-After-Free 的虚表劫持共享同一个「控制流劫持」直觉，让格式化字符串的
            任意写和堆利用的 tcache poisoning 在防御视角里互相印证。
          </p>
        </section>

        {/* 四段式方法 */}
        <section className="space-y-5">
          <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">METHOD</div>
          <ol className="space-y-0 border-l border-[var(--border)] pl-5">
            <Step num="01" title="原理" desc="图解 + 动画。栈帧布局、ret 覆盖方向、虚表结构 —— 给眼睛留一张能回放的图。" />
            <Step num="02" title="演示" desc="嵌入式 GDB 终端，逐步执行。寄存器快照、rip 被 'A' 覆盖的瞬间、内存变化 —— 让漏洞可被观察。" />
            <Step num="03" title="动手" desc="交互构造器。偏移输入 + gadget 选择 + 地址填入 → 实时拼 ASCII payload 布局 + Python 模板。" />
            <Step num="04" title="防御视角" desc="同一漏洞 × 防护开关矩阵。Canary/NX/ASLR 一键开关，崩溃日志实时变化，代码修复选择挑战。" />
          </ol>
        </section>

        {/* 开始行动 */}
        <section className="pt-4 border-t border-[var(--border)]">
          <Link
            href={`/reference/${vulnPath[0].slug}`}
            className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-4"
          >
            开始 · 栈溢出
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      {/* 右侧 5 栏 —— 纵向路径节点 */}
      <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start space-y-8">
        <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">LEARNING PATH</div>
        <PathPreview />
        <p className="font-mono text-[10.5px] text-[var(--text-soft)] leading-relaxed">
          四个漏洞 · 渐进解锁 · 进度存在浏览器 localStorage
        </p>
      </aside>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <li className="relative py-4">
      <span className="absolute -left-[26px] top-5 flex items-center justify-center w-3 h-3 rounded-full border border-[var(--border)] bg-[var(--bg)]" aria-hidden="true" />
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] w-8 flex-shrink-0">{num}</span>
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      </div>
      <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed mt-1 ml-12">{desc}</p>
    </li>
  );
}
