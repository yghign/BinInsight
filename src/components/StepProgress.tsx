'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const steps = [
  { id: 'step1', href: '/learn/step1', title: '解包与识别' },
  { id: 'step2', href: '/learn/step2', title: '静态分析' },
  { id: 'step3', href: '/learn/step3', title: '路径探索' },
  { id: 'step4', href: '/learn/step4', title: '防护策略' },
];

export default function StepProgress() {
  const pathname = usePathname();
  const currentStep = steps.findIndex((s) => pathname?.includes(s.href));

  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex items-center gap-1 min-w-max md:min-w-0">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;

          return (
            <li key={step.id} className="flex items-center gap-1">
              <Link
                href={step.href}
                aria-current={isActive ? 'step' : undefined}
                className={clsx(
                  'px-2 py-1.5 text-[13.5px] whitespace-nowrap font-medium transition-colors',
                  isActive
                    ? 'text-[var(--brand-500)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                {step.title}
              </Link>
              {idx < steps.length - 1 && (
                <span
                  className="flow-arrow"
                  data-active={idx < currentStep ? 'true' : undefined}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
