'use client';

import { useEffect, useState, useCallback } from 'react';
import { PROGRESS_STORAGE_KEY, STEPS, type StepId } from '@/data/reference';
import type { LevelId } from '@/data/lesson';
import {
  readLessonProgress,
  writeLessonProgress,
  onLessonProgressSync,
  markLevelDone,
  emptyLessonProgress,
  type LessonProgress,
} from '@/lib/storage';
import { isUnlocked, countPassed } from '@/lib/lesson';

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

/**
 * 主线 L0~L7 进度 hook（本次新增；原 useProgress 保持不动，供 L8 旧工作台继续使用）。
 *
 * - key 固定为 src/lib/storage.ts 的 KEY_LESSON = 'bininsight-lesson-progress-v1'
 * - 刷新保留、跨标签同步、同标签多实例同步
 * - 初始值统一 emptyLessonProgress()，客户端挂载后再读 localStorage，避免 hydration 不一致
 */
export function useLessonProgress() {
  const [progress, setProgress] = useState<LessonProgress>(() => emptyLessonProgress());

  useEffect(() => {
    setProgress(readLessonProgress());
    return onLessonProgressSync((next) => setProgress(next));
  }, []);

  /** 标记某一级完成（自检答对时调用） */
  const markDone = useCallback((id: LevelId) => {
    setProgress((prev) => {
      const next = markLevelDone(prev, id);
      writeLessonProgress(next);
      return next;
    });
  }, []);

  const isDone = useCallback((id: LevelId) => progress[id] === true, [progress]);

  const unlocked = useCallback(
    (id: LevelId) => isUnlocked(id, progress),
    [progress]
  );

  const passed = countPassed(progress);

  return { progress, isDone, markDone, unlocked, passed };
}
