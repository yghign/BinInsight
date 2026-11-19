import Link from 'next/link';
import { TermsButton } from './TermsDrawer';

/**
 * Footer：品牌 + 导航链接 + 版权 + 条款链接。
 */

const columns = [
  {
    title: '8 级主线',
    links: [
      { href: '/learn', label: '从 L0 开始' },
      { href: '/learn/l2', label: 'L2 · 找到 call' },
      { href: '/learn/l3', label: 'L3 · 限长修复' },
      { href: '/learn/l7', label: 'L7 · 自己走一遍' },
    ],
  },
  {
    title: '漏洞手册',
    links: [
      { href: '/library', label: '漏洞手册' },
      { href: '/reference/glossary', label: '核心概念' },
    ],
  },
  {
    title: '实践',
    links: [
      { href: '/cases', label: '动手实践' },
      { href: '/tools', label: '工具' },
      { href: '/tools/dilipa', label: 'Dilipa' },
      { href: '/tools/mutagen', label: 'Mutagen' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 border border-[var(--brand-500)] text-[var(--brand-500)] flex items-center justify-center font-mono text-[11px] font-bold leading-none">
                B
              </span>
              <span className="font-semibold text-[15px] tracking-tight">BinInsight</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--text-soft)]">
              从一行 C 代码，看懂一次溢出。
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="u-eyebrow mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap text-xs text-[var(--text-soft)]">
          <span className="font-mono">© 2024 BinInsight</span>
          <TermsButton className="text-xs text-[var(--text-soft)] transition-colors hover:text-[var(--text)]">
            使用条款
          </TermsButton>
        </div>
      </div>
    </footer>
  );
}
