import Link from 'next/link';
import {
  Binary,
  Cpu,
  Terminal,
  AlertTriangle,
  Bug,
  Shield,
  Activity,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Bubbles from '@/components/Bubbles';
import { refCategories, type RefCategoryMeta } from '@/data/reference';

const ICONS: Record<RefCategoryMeta['icon'], React.ComponentType<{ size?: number | string; className?: string }>> = {
  binary: Binary,
  cpu: Cpu,
  terminal: Terminal,
  alert: AlertTriangle,
  bug: Bug,
  shield: Shield,
  activity: Activity,
  zap: Zap,
};

export const metadata = {
  title: '知识库 · BinInsight',
  description: '逆向工程速查知识库：二进制格式、指令集、系统调用、危险函数、漏洞类型、防护对抗、动态分析与利用开发。',
};

export default function ReferenceIndexPage() {
  return (
    <div className="space-y-14">
      {/* 页头 + 泡泡 */}
      <section className="relative -mx-5 sm:-mx-8 px-5 sm:px-8 pt-6 pb-10">
        <Bubbles count={14} />
        <div className="relative">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              首页
            </Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">知识库</span>
          </div>
          <p className="u-eyebrow mb-2">Reference</p>
          <h1 className="u-display text-2xl md:text-[32px] mb-3">逆向知识库</h1>
          <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
            逆向分析路上随查随用的工具箱：从二进制格式到漏洞利用，八个专题覆盖完整知识地图。
            每一篇都以速查表为主，读代码、调程序时放在手边。
          </p>
        </div>
      </section>

      {/* 分类卡片 */}
      <section className="grid sm:grid-cols-2 gap-4">
        {refCategories.map((cat, i) => {
          const Icon = ICONS[cat.icon];
          return (
            <Link
              key={cat.slug}
              href={`/reference/${cat.slug}`}
              className="u-panel u-panel-hover group relative p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center border"
                  style={{
                    color: cat.accentVar,
                    borderColor: `color-mix(in srgb, ${cat.accentVar} 30%, transparent)`,
                    background: `color-mix(in srgb, ${cat.accentVar} 8%, transparent)`,
                  }}
                >
                  <Icon size={18} />
                </span>
                <span className="font-mono text-[11px] text-[var(--text-soft)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-[16px] font-semibold tracking-tight">{cat.title}</h2>
                  <ArrowRight
                    size={14}
                    className="text-[var(--text-soft)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </div>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{cat.desc}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {cat.outline.slice(0, 3).map((item) => (
                  <span key={item} className="u-tag !text-[10.5px]">
                    {item}
                  </span>
                ))}
                {cat.outline.length > 3 && (
                  <span className="u-tag !text-[10.5px] !border-transparent text-[var(--text-soft)]">
                    +{cat.outline.length - 3}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </section>

      {/* 底部回链 */}
      <section className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3">
        <Link href="/learn" className="u-btn u-btn-ghost">
          <span className="font-mono" aria-hidden="true">←</span>
          回到教学路线
        </Link>
        <p className="text-[12.5px] text-[var(--text-soft)] self-center font-mono">
          边学边查 · 教学路线与知识库互相引用
        </p>
      </section>
    </div>
  );
}
