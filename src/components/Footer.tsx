import Link from 'next/link';
import { Binary, Github, Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Binary size={18} className="text-white" />
              </div>
              <span className="font-bold">BinInsight</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              逆向工程与漏洞防护学习平台<br />
              从入门到进阶，洞见二进制世界
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">学习路径</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/learn/step1" className="hover:text-brand-400 transition-colors">解包与识别</Link></li>
              <li><Link href="/learn/step2" className="hover:text-brand-400 transition-colors">静态分析</Link></li>
              <li><Link href="/learn/step3" className="hover:text-brand-400 transition-colors">路径探索</Link></li>
              <li><Link href="/learn/step4" className="hover:text-brand-400 transition-colors">防护策略</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">工具 & 案例</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/tools/mutagen" className="hover:text-brand-400 transition-colors">Mutagen 一键工具</Link></li>
              <li><Link href="/tools/dilipa" className="hover:text-brand-400 transition-colors">Dilipa 微补丁台</Link></li>
              <li><Link href="/cases" className="hover:text-brand-400 transition-colors">实战案例库</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">关于</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-brand-400 transition-colors">使用条款</Link></li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-400 transition-colors flex items-center gap-1"
                >
                  <Github size={14} /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p className="flex items-center gap-1">
            <Shield size={12} />
            仅供教育目的使用，请在授权范围内学习研究
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-accent-red" /> for security learners
          </p>
        </div>
      </div>
    </footer>
  );
}
