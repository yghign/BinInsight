import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LIBRARY_LIST, loadFullEntry, CHAPTER_NAMES } from '@/data/library';
import { getGlossEntry } from '@/data/glossary';
import type { LibraryItem, CardEntry, InteractiveEntry, MethodCard } from '@/data/library/types';
import SourceBadge from '@/components/SourceBadge';
import TermButton from '@/components/TermButton';
import EntryDetailCard from '@/components/library/EntryDetailCard';
import EntryDetailInteractive from '@/components/library/EntryDetailInteractive';
import MethodDetail from '@/components/library/MethodDetail';
import RealCasesBlock from '@/components/library/RealCasesBlock';
import RelatedEntries from '@/components/library/RelatedEntries';
import ReportErrorLink from '@/components/library/ReportErrorLink';
import TrackExplored from '@/components/library/TrackExplored';

/** 静态导出：遍历 LIBRARY_LIST 生成全部详情页（参照 cases/sandbox/[id] 写法）。 */
export function generateStaticParams(): { id: string }[] {
  return LIBRARY_LIST.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await loadFullEntry(id);
  if (!item) return { title: '内容未找到 | BinInsight 学习库' };
  return { title: `${item.title} | BinInsight 学习库`, description: item.oneLiner };
}

export default async function LibraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await loadFullEntry(id);
  if (!item) notFound();

  const isMethod = item.kind === 'method';
  const entry = item as LibraryItem;
  const terms = isMethod ? (item as MethodCard).terms : (item as CardEntry | InteractiveEntry).terms;
  const related = item.related ?? [];
  const realCases = isMethod ? undefined : (item as CardEntry | InteractiveEntry).realCases;

  return (
    <div>
      <TrackExplored id={id} />

      <div className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 pb-9">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-6 flex-wrap">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <Link href="/library" className="hover:text-[var(--text)] transition-colors">漏洞手册</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)] truncate max-w-[260px]">{item.title}</span>
            <span className="ml-auto"><SourceBadge state="demo" /></span>
          </div>

          <p className="u-eyebrow mb-2">{isMethod ? '通用方法 · 方法论卡' : `${CHAPTER_NAMES[(item as CardEntry | InteractiveEntry).chapter] ?? '知识卡'} · 知识卡`}</p>
          <h1 className="u-display text-2xl md:text-[36px] mb-4">{item.title}</h1>
          {!isMethod && (
            <div className="flex items-center gap-1.5 mb-4">
              {(item as CardEntry | InteractiveEntry).hazard != null ? (
                <span className="u-tag" title="危险度★只做提醒，不参与筛选与排序">
                  {'★'.repeat((item as CardEntry | InteractiveEntry).hazard!)}{'☆'.repeat(5 - (item as CardEntry | InteractiveEntry).hazard!)}
                </span>
              ) : (
                <span className="u-tag">方法清单</span>
              )}
            </div>
          )}
          <p className="text-[14px] md:text-[15px] text-[var(--text-muted)] max-w-3xl leading-relaxed mb-5">
            {item.oneLiner}
          </p>

          {terms && terms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] tracking-wider text-[var(--text-soft)] mr-1">本案例术语</span>
              {terms.filter((t) => getGlossEntry(t)).map((t) => <TermButton key={t} termId={t} />)}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 md:py-16 space-y-12">
        {isMethod ? (
          <MethodDetail card={item as MethodCard} />
        ) : (item as CardEntry | InteractiveEntry).format === 'card' ? (
          <EntryDetailCard entry={item as CardEntry} />
        ) : (
          <EntryDetailInteractive entry={item as InteractiveEntry} />
        )}

        {realCases && realCases.length > 0 && <RealCasesBlock cases={realCases} />}

        <RelatedEntries related={related} />

        <ReportErrorLink item={entry} />

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-[var(--border)]">
          <Link href="/library" className="u-btn u-btn-ghost">
            <span className="font-mono" aria-hidden="true">←</span>
            返回漏洞手册
          </Link>
          <Link href="/learn" className="u-btn u-btn-ghost">
            返回 8 级主线
            <span className="font-mono" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
