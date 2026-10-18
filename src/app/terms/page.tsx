import Link from 'next/link';
import { TERMS_NOTICE, TERMS_SECTIONS, TERMS_UPDATED } from '@/data/terms';

export const metadata = {
  title: '使用条款 | BinInsight',
  description: 'BinInsight 平台使用条款：教育用途声明、合法使用承诺、免责声明及第三方声明。',
};

export default function TermsPage() {
  return (
    <div>
      <div className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 pb-10">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              首页
            </Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">使用条款</span>
          </div>
          <p className="u-eyebrow mb-2">Terms of Use</p>
          <h1 className="u-display text-3xl md:text-[40px] mb-3">使用条款</h1>
          <p className="text-[15px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            使用 BinInsight 平台前请仔细阅读以下条款。使用本平台即表示您同意遵守这些条款。
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-12">
        <p className="border-l-2 border-l-[var(--accent-orange)] pl-4 text-[13px] leading-[1.85] text-[var(--text-muted)]">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent-orange)]">
            重要提示
          </span>
          {TERMS_NOTICE}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        {TERMS_SECTIONS.map((section, idx) => (
          <section
            key={section.en}
            className={`py-9 ${idx > 0 ? 'border-t border-[var(--border)]' : ''}`}
          >
            <p className="u-eyebrow mb-2">{section.en}</p>
            <h2 className="text-xl md:text-[22px] font-semibold tracking-tight mb-5">
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.content.map((para, pIdx) => (
                <p
                  key={pIdx}
                  className="text-[13.5px] md:text-[14px] leading-[1.9] text-[var(--text-muted)]"
                >
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}

        <div className="border-t border-[var(--border)] pt-6 mt-2 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          最后更新日期：{TERMS_UPDATED}
        </div>
      </div>
    </div>
  );
}
