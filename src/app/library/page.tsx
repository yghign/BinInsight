import Link from 'next/link';
import type { Metadata } from 'next';
import { LIBRARY_LIST } from '@/data/library';
import { sandboxCases } from '@/data/sandbox';
import { vulnPath } from '@/data/reference';
import LibraryBrowser from '@/components/library/LibraryBrowser';
import ProgressStrip from '@/components/library/ProgressStrip';
import SourceBadge from '@/components/SourceBadge';

export const metadata: Metadata = {
  title: '漏洞手册 | BinInsight',
  description:
    '收录漏洞类型与安全方法论的手册：可按名称、别名或拼音搜索，术语可点开看解释。目前收录漏洞分类概览、注入类漏洞、客户端攻击、认证会话、访问控制、文件资源、服务端请求解析、逻辑业务与信息泄露，均为预置演示样例。',
};

export default function LibraryPage() {
  return (
    <div>
      <div className="border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 md:py-14">
          {/* LibraryHero —— 服务端：一句定位 + 第一次来软引导 + 返回主线（只从学习库侧互链） */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-6 flex-wrap">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">漏洞手册</span>
            <span className="ml-auto"><SourceBadge state="demo" /></span>
          </div>
          <div className="grid gap-8 md:grid-cols-12 md:gap-12 items-start">
            <div className="md:col-span-8">
              <p className="u-eyebrow mb-2">Library · 漏洞手册</p>
              <h1 className="u-display text-3xl md:text-[42px] mb-4">漏洞手册</h1>
              <p className="text-[15px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
                收录漏洞类型与安全方法论的手册，可按名称、别名或拼音搜索，术语可点开看解释。
                目前收录：漏洞分类概览、注入类漏洞、客户端攻击、认证会话、访问控制、文件资源、服务端请求解析、逻辑业务、信息泄露，均为预置演示样例。
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/library/ch0-framework" className="u-btn u-btn-ghost">
                  第一次来？先看漏洞分类概览 <span className="font-mono" aria-hidden="true">→</span>
                </Link>
                <Link href="/reference/glossary" className="u-btn u-btn-ghost">
                  核心概念
                </Link>
                <Link href="/learn" className="u-btn u-btn-ghost">
                  ← 返回 8 级主线
                </Link>
              </div>
            </div>
            <aside className="md:col-span-4 md:border-l md:border-[var(--border)] md:pl-8">
              <ProgressStrip />
            </aside>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 md:py-16">
        {/* 首屏只传轻量元数据；ch0/ch1 正文由详情页按章 chunk 加载，不进首页 bundle */}
        <LibraryBrowser items={LIBRARY_LIST} />
      </div>

      {/* ── 动手实践（交互沙箱 + 深度工作台入口） ── */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-16">
        <section>
          <p className="u-eyebrow mb-2">Practice — 动手实践</p>
          <p className="text-[13.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-6">
            走完漏洞分析与利用验证：交互沙箱跟着提示闯关，深度工作台做四段式剖析。
          </p>
          <div className="space-y-8">
            <div>
              <p className="u-eyebrow mb-3">交互沙箱</p>
              <div className="grid md:grid-cols-2 gap-4">
                {sandboxCases.map((sb) => (
                  <Link
                    key={sb.id}
                    href={`/cases/sandbox/${sb.id}`}
                    className="group u-panel u-panel-hover block p-5"
                  >
                    <h3 className="text-[16px] font-semibold tracking-tight mb-1.5 group-hover:text-[var(--brand-500)] transition-colors">
                      {sb.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{sb.vulnType}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="u-eyebrow mb-3">深度工作台</p>
              <div className="grid md:grid-cols-2 gap-4">
                {vulnPath.map((node) => (
                  <Link
                    key={node.slug}
                    href={`/reference/${node.slug}`}
                    className="group u-panel u-panel-hover block p-5"
                  >
                    <h3 className="text-[16px] font-semibold tracking-tight mb-1.5 group-hover:text-[var(--brand-500)] transition-colors">
                      {node.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{node.subtitle}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
