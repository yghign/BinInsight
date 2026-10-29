import Link from 'next/link';
import LearnPath from '@/components/LearnPath';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Learn Header —— 左对齐 7/5 双栏 */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            {/* 左 7 —— 标题区 */}
            <div className="md:col-span-7">
              <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
                <Link href="/" className="hover:text-[var(--text)] transition-colors">首页</Link>
                <span className="text-[var(--border-soft)]">/</span>
                <span className="text-[var(--text-muted)]">教学引导</span>
              </div>
              <p className="u-eyebrow mb-2">Learning Path</p>
              <h1 className="u-display text-3xl md:text-[42px] mb-3">逆向分析流程</h1>
              <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-xl">
                从二进制文件到漏洞确认再到防护策略，跟随标准化流程系统学习。
                每一步都有可交互示例，支持新手 / 进阶双模式。
              </p>
            </div>

            {/* 右 5 —— 纵向路径节点 */}
            <aside className="md:col-span-5 md:border-l md:border-[var(--border)] md:pl-10">
              <LearnPath />
            </aside>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 md:py-12">
        {children}
      </div>
    </div>
  );
}
