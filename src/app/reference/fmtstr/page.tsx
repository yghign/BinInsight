import Link from 'next/link';
import WorkbenchShell from '@/components/WorkbenchShell';
import { getVulnNode, vulnPath } from '@/data/reference';

const node = getVulnNode('fmtstr')!;

export const metadata = {
  title: '格式化字符串 · 逆向工作台',
  description: 'printf(user_input) —— %p 泄露栈、%n 任意写。',
};

export default function FmtstrPage() {
  return (
    <WorkbenchShell slug="fmtstr" node={node} glossLinks={[
      { slug: 'fmt', term: 'printf 格式串参数详解' },
      { slug: 'x86-call', term: 'x86-64 参数约定（栈溢出后在栈上）' },
    ]}>
      <header className="space-y-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)]">首页</Link>
          <span>/</span>
          <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">格式化字符串</span>
        </div>
        <h1 className="u-display text-2xl md:text-[32px]">格式化字符串</h1>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          <code className="inline">printf(user_input)</code> 里 user_input 本来应该是"内容"，
          却被 printf 当成了"格式串"。<code className="inline">%p</code> 泄露栈上任意位置，
          <code className="inline">%n</code> 把已输出字符数写到任意地址 —— 一条泄露链 + 一次写，
          两个漏洞类型的组合拳。
        </p>
      </header>

      <section className="u-panel p-10 text-center space-y-3">
        <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">WORK IN PROGRESS</div>
        <h2 className="text-lg font-semibold">即将发布</h2>
        <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
          四段式骨架已就位：原理（格式串 vs 变参约定）→ 演示（%p 泄露栈）→ 动手（%n 写 GOT）→ 防御（printf 审计口诀）。
          完整内容更新前先看看相关知识点吧。
        </p>
        <p className="font-mono text-[10.5px] text-[var(--brand-500)] pt-3">
          发布时间节点 · 答辩前两周
        </p>
      </section>

      <nav className="pt-8 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link href={`/reference/${vulnPath[1].slug}`} className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← {vulnPath[1].title}
        </Link>
        <span className="font-mono text-[12px] text-[var(--text-soft)]">
          下一步：{vulnPath[3].title}（即将发布）
        </span>
      </nav>
    </WorkbenchShell>
  );
}
