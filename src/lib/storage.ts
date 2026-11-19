/**
 * localStorage key 唯一出口（架构 D.5.4）。
 *
 * - bininsight-lesson-progress-v1  主线 L0~L7 完成状态（本次新增）
 * - bininsight-ref-progress-v1     旧四段式工作台进度（保留，行为不变）
 * - bininsight-mode / -accent / -font-scale  主题 / 强调色 / 字号（已有，不动）
 *
 * 本文件是纯函数 + 常量，不含 React、不含 UI。页面与 hook 一律从这里取 key，
 * 禁止在别处硬编码字符串字面量。
 */

import type { LevelId } from '@/data/lesson';
import { LEVEL_IDS } from '@/data/lesson';

export const KEY_LESSON = 'bininsight-lesson-progress-v1';
export const KEY_REF = 'bininsight-ref-progress-v1';
export const KEY_MODE = 'bininsight-mode';
export const KEY_ACCENT = 'bininsight-accent';
export const KEY_FONT_SCALE = 'bininsight-font-scale';
/** 学习库「已探索」条目 id 列表（与主线进度完全隔离）。 */
export const KEY_EXPLORED = 'bininsight-explored-v1';
/** 学习库进度条隐藏开关。 */
export const KEY_PROGRESS_HIDDEN = 'bininsight-progress-hidden';

/** 所有 key 的清单，供 scripts/check-honesty.mjs 校验唯一出口。 */
export const STORAGE_KEYS: string[] = [
  KEY_LESSON,
  KEY_REF,
  KEY_MODE,
  KEY_ACCENT,
  KEY_FONT_SCALE,
  KEY_EXPLORED,
  KEY_PROGRESS_HIDDEN,
];

export type LessonProgress = Record<LevelId, boolean>;

/** 返回一个 8 级全 false 的干净进度对象。 */
export function emptyLessonProgress(): LessonProgress {
  return Object.fromEntries(LEVEL_IDS.map((id) => [id, false])) as LessonProgress;
}

/**
 * 读主线进度。SSR / 隐私模式 / 脏数据都安全兜底，绝不抛异常。
 * 始终补齐 8 个 key，避免下游 isUnlocked 读到 undefined。
 */
export function readLessonProgress(): LessonProgress {
  const fallback = emptyLessonProgress();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(KEY_LESSON);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
    const record = parsed as Record<string, unknown>;
    for (const id of LEVEL_IDS) {
      if (typeof record[id] === 'boolean') fallback[id] = record[id] as boolean;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/** 写主线进度。任何失败（quota / 隐私模式）都静默忽略，不阻断演示。 */
export function writeLessonProgress(progress: LessonProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const safe: LessonProgress = { ...emptyLessonProgress(), ...progress };
    window.localStorage.setItem(KEY_LESSON, JSON.stringify(safe));
    // 同一标签页内也广播一次，方便多个 hook 实例同步
    window.dispatchEvent(new CustomEvent<LessonProgress>('bininsight:lesson-progress', { detail: safe }));
  } catch {
    /* quota 满或隐私模式：忽略 */
  }
}

/** 把某一级标记完成，返回新的进度对象。 */
export function markLevelDone(progress: LessonProgress, id: LevelId): LessonProgress {
  return { ...progress, [id]: true };
}

/**
 * 跨标签页同步：监听原生 storage 事件 + 同标签页自定义事件。
 * 返回取消订阅函数，供 useEffect cleanup 使用。
 */
export function onLessonProgressSync(callback: (progress: LessonProgress) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent): void => {
    if (event.key === KEY_LESSON) callback(readLessonProgress());
  };
  const onCustom = (event: Event): void => {
    const detail = (event as CustomEvent<LessonProgress>).detail;
    callback(detail && typeof detail === 'object' ? detail : readLessonProgress());
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('bininsight:lesson-progress', onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('bininsight:lesson-progress', onCustom);
  };
}
