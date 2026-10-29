'use client';

import { useEffect, useState, useCallback } from 'react';
import { PROGRESS_STORAGE_KEY, STEPS, type StepId } from '@/data/reference';

/**
 * 四段式 × 每个漏洞的完成状态 hook。
 * 存 localStorage：{ [slug]: { principle: true, demo: false, ... } }
 * 四个 step 全 true = 漏洞完成。
 */

type VulnSteps = Record<StepId, boolean>;
type Progress = Record<string, Partial<VulnSteps>>;

function read(): Progress {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Progress;
  } catch {
    return {};
  }
}

function write(p: Progress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota 满等 */
  }
}

export function useProgress() {
  const [data, setData] = useState<Progress>(() => read());

  // 跨标签页同步
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_STORAGE_KEY) setData(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isStepDone = useCallback(
    (slug: string, step: StepId) => !!data[slug]?.[step],
    [data]
  );

  const setStep = useCallback(
    (slug: string, step: StepId, done: boolean) => {
      setData((prev) => {
        const next: Progress = {
          ...prev,
          [slug]: { ...prev[slug], [step]: done ? true : false },
        };
        write(next);
        return next;
      });
    },
    []
  );

  const toggleStep = useCallback(
    (slug: string, step: StepId) => {
      setStep(slug, step, !isStepDone(slug, step));
    },
    [isStepDone, setStep]
  );

  const isVulnDone = useCallback(
    (slug: string) => STEPS.every((s) => !!data[slug]?.[s]),
    [data]
  );

  /** 当前漏洞已完成的 step 数（0..4） */
  const doneCount = useCallback(
    (slug: string) => STEPS.filter((s) => !!data[slug]?.[s]).length,
    [data]
  );

  return { isStepDone, setStep, toggleStep, isVulnDone, doneCount };
}
