import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'BinInsight · 洞见二进制 — 逆向工程与漏洞防护学习平台',
  description: '面向新手到进阶的逆向工程与漏洞防护学习网站，包含教学引导、工具下载和实战案例三层结构。',
  keywords: ['逆向工程', '漏洞防护', '二进制安全', 'CTF', 'Pwn', 'Ghidra', '栈溢出', '漏洞分析'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
