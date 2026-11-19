import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TermsProvider } from '@/components/TermsDrawer';
import { GlossaryProvider } from '@/components/GlossaryProvider';

/** metadata 收口：改为课程作业的白话定位，不再沿用产品化的成品口吻。 */
export const metadata: Metadata = {
  title: 'BinInsight · 从一行 C 代码，看懂一次溢出',
  description:
    '8 级渐进的二进制安全入门课，不用装环境、不用懂汇编。',
  keywords: ['二进制安全入门', '缓冲区溢出', 'strcpy', 'strncpy', 'Canary'],
  icons: {
    icon: '/BinInsight/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-mode="dark" data-accent="blue" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('bininsight-mode') || 'dark';
                  var accent = localStorage.getItem('bininsight-accent') || 'blue';
                  document.documentElement.setAttribute('data-mode', mode);
                  document.documentElement.setAttribute('data-accent', accent);
                } catch(e) {
                  document.documentElement.setAttribute('data-mode', 'dark');
                  document.documentElement.setAttribute('data-accent', 'blue');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var z = localStorage.getItem('bininsight-font-scale') || '1';
                  document.body.style.zoom = z;
                } catch(e) {}
              })();
            `,
          }}
        />
        {/*
          命名隔离：TermsProvider（使用条款）与 GlossaryProvider（术语解释）
          并列挂载，互不嵌套依赖。点「术语」只会弹出白话解释，绝不弹法律条款。
        */}
        <TermsProvider>
          <GlossaryProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </GlossaryProvider>
        </TermsProvider>
      </body>
    </html>
  );
}
