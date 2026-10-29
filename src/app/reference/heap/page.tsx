import Link from 'next/link';
import WorkbenchShell from '@/components/WorkbenchShell';
import { getVulnNode, vulnPath } from '@/data/reference';

const node = getVulnNode('heap')!;

export const metadata = {
  title: '堆利用入门 · 逆向工作台',
  description: 'tcache poisoning / unsorted bin 泄露 glibc 基址。',
};

export default function HeapPage() {
  return (
    <WorkbenchShell slug="heap" node={node} glossLinks={[
      { slug: 'glibc', term: 'glibc malloc 实现（arena / bin / tcache）' },
    ]}>
      <header className="space-y-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)]">首页</Link>
          <span>/</span>
          <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">堆利用入门</span>
        </div>
        <h1 className="u-display text-2xl md:text-[32px]">堆利用入门</h1>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          比栈溢出更精细也更依赖 glibc 版本。tcache poisoning 让下次 malloc 返回任意地址，
          unsorted bin 泄露 main_arena 算出 libc 基址，double free 让同一个 chunk 同时出现在两个空闲链。
          这些是现代 Pwn 的主战场。
        </p>
      </header>

      <section className="u-panel p-10 text-center space-y-3">
        <div className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">WORK IN PROGRESS</div>
        <h2 className="text-lg font-semibold">即将发布</h2>
        <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
          四段式骨架已就位：原理（glibc malloc 流程）→ 演示（tcache poisoning 逐步）→ 动手（pwntools heap 模板）→ 防御。
          完整内容更新前先看看相关知识点吧。
        </p>
        <p className="font-mono text-[10.5px] text-[var(--brand-500)] pt-3">
          发布时间节点 · 答辩后迭代
        </p>
      </section>

      <nav className="pt-8 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link href={`/reference/${vulnPath[2].slug}`} className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← {vulnPath[2].title}
        </Link>
        <span className="font-mono text-[12px] text-[var(--text-soft)]">
          回到工作台首页 →
        </span>
      </nav>
    </WorkbenchShell>
  );
}
