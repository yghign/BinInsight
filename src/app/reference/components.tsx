import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import CodeBlock from '@/components/CodeBlock';

/**
 * 知识库页面共享渲染组件 —— 服务端组件。
 * 所有分类页（formats / isa / syscalls / ...）统一使用这些原语，
 * 保证极简宽松的排版一致。
 */

/* ---------- 页头 ---------- */

export function RefHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
        <Link href="/" className="hover:text-[var(--text)] transition-colors">
          首页
        </Link>
        <span className="text-[var(--border-soft)]">/</span>
        <Link href="/reference" className="hover:text-[var(--text)] transition-colors">
          知识库
        </Link>
        <span className="text-[var(--border-soft)]">/</span>
        <span className="text-[var(--text-muted)]">{title}</span>
      </div>
      <p className="u-eyebrow mb-2">{eyebrow}</p>
      <h1 className="u-display text-2xl md:text-[32px] mb-3">{title}</h1>
      <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-3xl">{desc}</p>
    </section>
  );
}

/* ---------- 编号章节 ---------- */

export function RefSection({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-baseline gap-3">
        <span className="u-section-num">{num}</span>
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ---------- 段落文字 ---------- */

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-3xl">{children}</p>
  );
}

/** 加粗强调（正文内关键术语） */
export function B({ children }: { children: React.ReactNode }) {
  return <strong className="text-[var(--text)]">{children}</strong>;
}

/** 行内代码缩写 */
export function C({ children }: { children: React.ReactNode }) {
  return <code className="inline">{children}</code>;
}

/* ---------- 速查表 ---------- */

export function RefTable({
  columns,
  rows,
  monoCols = [0],
  className,
}: {
  columns: string[];
  /** 单元格内容；含 ` 反引号 ` 的纯文本片段建议直接传 ReactNode */
  rows: React.ReactNode[][];
  /** 哪些列用等宽字体渲染，默认第 0 列 */
  monoCols?: number[];
  className?: string;
}) {
  return (
    <div className={clsx('u-panel overflow-x-auto', className)}>
      <table className="w-full text-[13px] border-collapse min-w-[540px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
            {columns.map((col, i) => (
              <th
                key={i}
                className="text-left font-mono text-[11px] tracking-wider font-medium text-[var(--text-soft)] px-4 py-2.5 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-soft)] transition-colors"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={clsx(
                    'px-4 py-2.5 align-top leading-relaxed text-[var(--text-muted)]',
                    monoCols.includes(ci) &&
                      'font-mono text-[12.5px] text-[var(--text)] whitespace-nowrap'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- 术语列表 ---------- */

export function RefTermList({
  items,
}: {
  items: { term: string; desc: React.ReactNode; accent?: string }[];
}) {
  return (
    <div className="u-panel divide-y divide-[var(--border)]">
      {items.map((item) => (
        <div key={item.term} className="px-5 py-4 flex flex-col sm:flex-row sm:gap-6 gap-1.5">
          <div className="sm:w-44 flex-shrink-0">
            <code
              className="inline !bg-transparent !p-0 font-semibold"
              style={item.accent ? { color: item.accent } : undefined}
            >
              {item.term}
            </code>
          </div>
          <div className="text-[13.5px] text-[var(--text-muted)] leading-relaxed">{item.desc}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 提示块 ---------- */

const TONE_STYLES = {
  brand: 'border-[color-mix(in_srgb,var(--brand-500)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand-500)_6%,transparent)] text-[var(--brand-500)]',
  green: 'border-[color-mix(in_srgb,var(--accent-green)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-green)_6%,transparent)] text-[var(--accent-green)]',
  orange: 'border-[color-mix(in_srgb,var(--accent-orange)_32%,transparent)] bg-[color-mix(in_srgb,var(--accent-orange)_7%,transparent)] text-[var(--accent-orange)]',
  red: 'border-[color-mix(in_srgb,var(--accent-red)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-red)_6%,transparent)] text-[var(--accent-red)]',
  purple: 'border-[color-mix(in_srgb,var(--accent-purple)_32%,transparent)] bg-[color-mix(in_srgb,var(--accent-purple)_7%,transparent)] text-[var(--accent-purple)]',
} as const;

export function RefCallout({
  tone = 'brand',
  title,
  children,
}: {
  tone?: keyof typeof TONE_STYLES;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx('border rounded-lg p-5', TONE_STYLES[tone])}>
      <div className="font-mono text-[11px] tracking-wider mb-2.5">{title}</div>
      <div className="text-[13.5px] text-[var(--text-muted)] leading-relaxed [&>p+p]:mt-2">
        {children}
      </div>
    </div>
  );
}

/* ---------- 代码块（带面板的常用组合） ---------- */

export function RefCode({
  code,
  language = 'c',
  title,
  badge,
}: {
  code: string;
  language?: 'c' | 'cpp' | 'python' | 'javascript' | 'bash' | 'asm' | 'plaintext';
  title: string;
  badge?: string;
}) {
  return (
    <div className="u-panel overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between">
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{title}</span>
        {badge && <span className="font-mono text-[10px] text-[var(--text-soft)]">{badge}</span>}
      </div>
      <CodeBlock code={code} language={language} showLineNumbers={false} />
    </div>
  );
}

/* ---------- 底部导航（上一篇 / 下一篇 / 返回索引） ---------- */

export function RefPager({
  prev,
  next,
}: {
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
}) {
  return (
    <section className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3">
      {prev ? (
        <Link href={`/reference/${prev.slug}`} className="u-btn u-btn-ghost">
          <span className="font-mono" aria-hidden="true">←</span>
          {prev.title}
        </Link>
      ) : (
        <Link href="/reference" className="u-btn u-btn-ghost">
          <span className="font-mono" aria-hidden="true">←</span>
          返回知识库
        </Link>
      )}
      {next ? (
        <Link href={`/reference/${next.slug}`} className="u-btn u-btn-primary">
          {next.title}
          <span className="font-mono" aria-hidden="true">→</span>
        </Link>
      ) : (
        <Link href="/reference" className="u-btn u-btn-ghost">
          返回知识库
          <span className="font-mono" aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
