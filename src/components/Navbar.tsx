'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Binary, BookOpen, Wrench, FileCode, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/learn', label: '教学引导', icon: BookOpen, section: '/learn' },
  { href: '/tools', label: '工具下载', icon: Wrench, section: '/tools' },
  { href: '/cases', label: '案例展示', icon: FileCode, section: '/cases' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center group-hover:scale-105 transition-transform">
              <Binary size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">BinInsight</span>
              <span className="hidden sm:inline text-xs text-gray-500 ml-2">洞见二进制</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.section);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-300'
                      : 'text-gray-400 hover:text-white hover:bg-bg-hover'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-bg-hover text-gray-400"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-border space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.section);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-300'
                      : 'text-gray-400 hover:text-white hover:bg-bg-hover'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
