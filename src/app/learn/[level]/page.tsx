import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LessonShell from '@/components/LessonShell';
import { LESSON_LEVELS, LEVEL_IDS, getLevel, type LevelId } from '@/data/lesson';
import L0Program from '@/components/lesson/L0Program';
import L1Overflow from '@/components/lesson/L1Overflow';
import L2CallSpotter from '@/components/lesson/L2CallSpotter';
import L3PatchDiff from '@/components/lesson/L3PatchDiff';
import L4Conditions from '@/components/lesson/L4Conditions';
import L5Crash from '@/components/lesson/L5Crash';
import L6Canary from '@/components/lesson/L6Canary';
import L7Sandbox from '@/components/lesson/L7Sandbox';

/**
 * 8 级主线动态路由（架构 D.5.3）。
 *
 * - generateStaticParams 固定产出 l0..l7 共 8 个静态页
 * - dynamicParams = false：其它 level 一律 404，不会落到 L8
 * - 旧 /learn/step1..step4 是静态路由，Next.js 默认优先于 [level]，不冲突
 * - 前进按钮由 LessonShell 里的 nextLevel() 生成，L7.next === null
 */

export const dynamicParams = false;

export function generateStaticParams(): { level: string }[] {
  return LEVEL_IDS.map((level) => ({ level }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string }>;
}): Promise<Metadata> {
  const { level: id } = await params;
  const level = getLevel(id);
  if (!level) return { title: '未找到 · BinInsight' };
  return {
    title: `第 ${level.index + 1} 级 · ${level.title} | BinInsight`,
    description: `本级只学 1 件事：${level.newConcept}。${level.understanding}`,
  };
}

/** 按级别 id 挂载对应交互组件；新增级别只需在这里加一个 case。 */
function LevelBody({ id }: { id: LevelId }) {
  switch (id) {
    case 'l0':
      return <L0Program />;
    case 'l1':
      return <L1Overflow />;
    case 'l2':
      return <L2CallSpotter />;
    case 'l3':
      return <L3PatchDiff />;
    case 'l4':
      return <L4Conditions />;
    case 'l5':
      return <L5Crash />;
    case 'l6':
      return <L6Canary />;
    case 'l7':
      return <L7Sandbox />;
    default:
      return null;
  }
}

export default async function LearnLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: id } = await params;
  const level = getLevel(id);
  if (!level || !LEVEL_IDS.includes(id as LevelId)) notFound();

  return (
    <LessonShell level={level}>
      <LevelBody id={level.id} />
    </LessonShell>
  );
}

/** 供 scripts/check-honesty.mjs 静态扫描时确认 8 级数量。 */
export const LESSON_PAGE_COUNT = LESSON_LEVELS.length;
