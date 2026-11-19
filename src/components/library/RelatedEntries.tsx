/** 相关漏洞区（架构 07 §3.2 / PRD §2.9）：相关漏洞推荐，无进度勾。 */
import Link from 'next/link';
import { LIBRARY_LIST } from '@/data/library';

export default function RelatedEntries({ related }: { related: string[] }) {
  const items = related
    .map((id) => LIBRARY_LIST.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (items.length === 0) return null;
  return (
    <div className="u-panel p-5 md:p-6">
      <p className="u-eyebrow mb-3">相关漏洞</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.id} href={`/library/${item.id}`} className="u-tag u-panel-hover !text-brand-400">
            {item.title} →
          </Link>
        ))}
      </div>
    </div>
  );
}
