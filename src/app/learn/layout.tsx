import Link from 'next/link';
import StepProgress from '@/components/StepProgress';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Learn Header */}
      <div className="bg-bg-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">首页</Link>
            <span>/</span>
            <span className="text-brand-400">教学引导</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">教学引导 · 逆向分析四步法</h1>
          <p className="text-gray-400">
            从二进制文件到漏洞确认再到防护策略，跟随标准化流程系统学习
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-bg-card/50 border-b border-border py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepProgress />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </div>
    </div>
  );
}
