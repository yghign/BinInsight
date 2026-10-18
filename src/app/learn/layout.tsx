import Link from 'next/link';
import StepProgress from '@/components/StepProgress';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Learn Header */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-6">
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
            <span className="text-[var(--border-soft)]">/</span>
            <span className="text-[var(--text-muted)]">教学引导</span>
          </div>
          <p className="u-eyebrow mb-2">Learning Path</p>
          <h1 className="u-display text-2xl md:text-[32px] mb-2">逆向分析流程</h1>
          <p className="text-sm text-[var(--text-muted)]">
            从二进制文件到漏洞确认再到防护策略，跟随标准化流程系统学习。
          </p>
        </div>

        {/* 箭头步骤导航 */}
        <div className="border-t border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3">
            <StepProgress />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        {children}
      </div>
    </div>
  );
}
