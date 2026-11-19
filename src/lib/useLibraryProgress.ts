'use client';

/**
 * 学习库个人进度 hook（架构 07 §3.3 / PRD R15）——独立、隔离、三条硬规则。
 *
 * 硬规则：
 *  1. 只显示「已探索」计数，不显示未完成 / 完成度百分比；
 *  2. 不排名（无「超过 X% 同学」「你排第 N」）；
 *  3. 可隐藏（开关存 KEY_PROGRESS_HIDDEN）。
 *
 * 隔离：只读写 KEY_EXPLORED / KEY_PROGRESS_HIDDEN，不 import useProgress，
 * 不碰主线两个 key；explored 绝不控制可达性（无顺序、无锁）；不承诺跨设备同步。
 * SSR / 隐私模式 / 脏数据全部安全兜底（参照 storage.ts readLessonProgress 模式）。
 */

import { useCallback, useEffect, useState } from 'react';
import { KEY_EXPLORED, KEY_PROGRESS_HIDDEN } from './storage';

/** 分母采信 Q10 推荐值（低 18 / 中 33 / 高 31 + 9 方法论卡）；批 0 内容未铺满，分母是规划口径。 */
const DENOM = { low: 18, mid: 33, high: 31, method: 9 } as const;

export interface LibraryProgressState {
  explored: string[];
  hidden: boolean;
  markExplored: (id: string) => void;
  toggleHidden: () => void;
  countByDifficulty: { low: number; mid: number; high: number };
  /** 已探索的方法论卡数量（用于「Y / 9 张方法论卡」文案）。 */
  methodCount: number;
  denominators: typeof DENOM;
}

function readExplored(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY_EXPLORED);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

function readHidden(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY_PROGRESS_HIDDEN) === '1';
  } catch {
    return false;
  }
}

export function useLibraryProgress(): LibraryProgressState {
  const [explored, setExplored] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setExplored(readExplored());
    setHidden(readHidden());
  }, []);

  const markExplored = useCallback((id: string) => {
    if (!id) return;
    setExplored((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(KEY_EXPLORED, JSON.stringify(next));
      } catch {
        /* 隐私模式 / quota：仅内存态，不抛错 */
      }
      return next;
    });
  }, []);

  const toggleHidden = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(KEY_PROGRESS_HIDDEN, next ? '1' : '0');
      } catch {
        /* 忽略 */
      }
      return next;
    });
  }, []);

  // 计数按 id 前缀/已知章区分：m 开头为方法论卡；ch0 归 low；ch1 按已知 id 映射。
  // 分母是规划口径，真实计数只反映本机已点开的条目。
  const midIds = new Set(['nosql-injection', 'command-injection', 'ldap-injection']);
  const highIds = new Set(['code-injection', 'ssti']);
  const countByDifficulty = {
    low: explored.filter((id) => !id.startsWith('m') && !midIds.has(id) && !highIds.has(id)).length,
    mid: explored.filter((id) => midIds.has(id)).length,
    high: explored.filter((id) => highIds.has(id)).length,
  };
  const methodCount = explored.filter((id) => id.startsWith('m')).length;

  return {
    explored,
    hidden,
    markExplored,
    toggleHidden,
    countByDifficulty,
    methodCount,
    denominators: DENOM,
  };
}
