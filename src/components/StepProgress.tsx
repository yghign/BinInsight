'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Unlock, Search, Route, Shield, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const steps = [
  {
    id: 'step1',
    href: '/learn/step1',
    title: '解包与识别',
    subtitle: 'Unpack & Identify',
    icon: Unlock,
  },
  {
    id: 'step2',
    href: '/learn/step2',
    title: '静态分析',
    subtitle: 'Static Analysis',
    icon: Search,
  },
  {
    id: 'step3',
    href: '/learn/step3',
    title: '路径探索',
    subtitle: 'Path Exploration',
    icon: Route,
  },
  {
    id: 'step4',
    href: '/learn/step4',
    title: '防护策略',
    subtitle: 'Mitigation',
    icon: Shield,
  },
];

export default function StepProgress() {
  const pathname = usePathname();
  const currentStep = steps.findIndex((s) => pathname?.includes(s.href));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isPast = idx < currentStep;

          return (
            <div key={step.id} className="flex-1 relative">
              <Link
                href={step.href}
                className={clsx(
                  'flex flex-col items-center gap-2 p-3 rounded-xl transition-all group',
                  isActive
                    ? 'bg-brand-600/20 border border-brand-500/40'
                    : isPast
                    ? 'bg-bg-hover border border-border opacity-80'
                    : 'bg-bg-card border border-border opacity-60 hover:opacity-100'
                )}
              >
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isActive
                      ? 'bg-brand-500 text-white'
                      : isPast
                      ? 'bg-accent-green/20 text-accent-green'
                      : 'bg-bg-hover text-gray-500 group-hover:text-gray-300'
                  )}
                >
                  {isPast ? <CheckCircle size={20} /> : <Icon size={20} />}
                </div>
                <div className="text-center">
                  <div
                    className={clsx(
                      'text-sm font-semibold',
                      isActive ? 'text-brand-300' : 'text-gray-300'
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Step {idx + 1}
                  </div>
                </div>
              </Link>
              {/* connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={clsx(
                    'hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 -translate-y-1/2 z-0',
                    isPast ? 'bg-accent-green/50' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
