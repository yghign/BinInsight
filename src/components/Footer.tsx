import Link from 'next/link';
import { TermsButton } from './TermsDrawer';

const columns = [
  {
    title: '学习路径',
    links: [
      { href: '/learn/step1', label: '解包与识别' },
      { href: '/learn/step2', label: '静态分析' },
      { href: '/learn/step3', label: '路径探索' },
      { href: '/learn/step4', label: '防护策略' },
    ],
  },
  {
    title: '工具 / 案例',
    links: [
      { href: '/tools/mutagen', label: 'Mutagen 一键工具' },
      { href: '/tools/dilipa', label: 'Dilipa 微补丁台' },
      { href: '/cases', label: '实战案例库' },
    ],
  },
  {
    title: '关于',
    links: [
      { href: '/terms', label: '使用条款', terms: true },
      { href: 'https://github.com/yghign/BinInsight', label: 'GitHub 仓库', external: true },
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
              逆向工程与漏洞防护学习平台
              <br />
              洞见二进制，从看见每一条指令开始。
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="u-eyebrow mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) =>
                  'terms' in link && link.terms ? (
                    <li key={link.href}>
                      <TermsButton className="text-[13px] text-[var(--text-soft)] transition-colors hover:text-[var(--text)]">
                        {link.label}
                      </TermsButton>
                    </li>
                  ) : 'external' in link && link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-2 text-xs text-[var(--text-soft)]">
          <span className="font-mono">© 2024 BinInsight · 仅供教育与授权研究使用</span>
          <span className="font-mono">REVERSE ENGINEERING / VULN MITIGATION</span>
        </div>
      </div>
    </footer>
  );
}
