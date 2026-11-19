/**
 * 级别 ↔ 路由 / 前进后退 / 解锁判定 的纯函数（架构 D.3 契约层）。
 *
 * 唯一数据源是 src/data/lesson.ts；页面禁止散写级别标题与顺序。
 * 前进按钮只由 nextLevel(id) 生成；L7.next = null；任何返回值都不会是 'l8'。
 */

import {
  LESSON_LEVELS,
  LESSON_COUNT,
  LEVEL_IDS,
  getLevel,
  getLevelByRoute,
  type LessonLevel,
  type LevelId,
} from '@/data/lesson';
import type { LessonProgress } from './storage';

export { LESSON_LEVELS, LESSON_COUNT, LEVEL_IDS, getLevel };
export type { LessonLevel, LevelId };

/** 按路由查级别（如 '/learn/l2'）。 */
export function levelByRoute(route: string): LessonLevel | undefined {
  return getLevelByRoute(route);
}

/**
 * 下一级 id。只在 LESSON_LEVELS 内取值，L7 返回 null。
 * 额外做一次防御：即便数据源被误改成 'l8'，也返回 null，保证主线不通向 L8。
 */
export function nextLevel(id: LevelId): LevelId | null {
  const level = getLevel(id);
  if (!level || level.next === null) return null;
  const candidate = level.next as string;
  if (!LEVEL_IDS.includes(candidate as LevelId)) return null;
  return candidate as LevelId;
}

/** 上一级 id；L0 返回 null。 */
export function prevLevel(id: LevelId): LevelId | null {
  const level = getLevel(id);
  if (!level || level.index <= 0) return null;
  return LESSON_LEVELS[level.index - 1].id;
}

/** 下一级路由；L7 返回 null（不生成前进按钮）。 */
export function nextRoute(id: LevelId): string | null {
  const next = nextLevel(id);
  if (!next) return null;
  return getLevel(next)?.route ?? null;
}

/**
 * 前置链解锁判定（复用 PathPreview 的三态状态机语义）：
 * L0 永远解锁；其余要求 requires 级已 done。
 */
export function isUnlocked(id: LevelId, done: LessonProgress): boolean {
  const level = getLevel(id);
  if (!level) return false;
  if (level.requires === null) return true;
  return done[level.requires] === true;
}

/** 三态节点状态：done / active（已解锁未做）/ locked。 */
export function nodeStatus(
  id: LevelId,
  currentId: LevelId,
  done: LessonProgress
): 'done' | 'active' | 'locked' {
  if (done[id]) return 'done';
  if (id === currentId) return 'active';
  return isUnlocked(id, done) || LESSON_LEVELS.find((l) => l.id === id)!.index <
    LESSON_LEVELS.find((l) => l.id === currentId)!.index
    ? 'active'
    : 'locked';
}

/** 已完成级数（0..8），用于进度显示。 */
export function countPassed(checks: LessonProgress): number {
  return LEVEL_IDS.filter((id) => checks[id] === true).length;
}

/** 第一个未完成的级 id；全部完成返回 null。 */
export function firstUnfinished(checks: LessonProgress): LevelId | null {
  return LEVEL_IDS.find((id) => checks[id] !== true) ?? null;
}

/** 主线是否全部完成（L7 通关且前 7 级都 done）。 */
export function isLessonComplete(checks: LessonProgress): boolean {
  return LEVEL_IDS.every((id) => checks[id] === true);
}
