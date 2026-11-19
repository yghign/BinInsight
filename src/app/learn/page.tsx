import Link from 'next/link';
import LearnPath from '@/components/LearnPath';
import SourceBadge from '@/components/SourceBadge';
import { LESSON_LEVELS } from '@/data/lesson';

export const metadata = {
  title: '学习路径 · 8 级 | BinInsight',
  description: '从一行 C 代码，看懂一次溢出。8 级主线，每级只学 1 个新概念，约 15 分钟走完。',
};

/** /learn —— L0 入口 + 8 级索引（不再 redirect 到旧的 step1 拓展页）。 */
export default function LearnIndexPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 sm:px-8 py-14 md:py-20">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16 items-start">
        <div className="md:col-span-7">
          <p className="u-eyebrow mb-4">LEARNING PATH · 8 级主线</p>
          <h1 className="u-display text-3xl md:text-[42px] mb-5">从一行 C 代码，看懂一次溢出</h1>
          <p className="u-lesson-body max-w-xl mb-6">
            不用装环境、不用懂汇编。一共 8 级，<strong className="text-[var(--text)]">每级只学 1 件事</strong>，
            点一下就有白话解释，点错也有解释、可以重来。顺着走完约 15 分钟。
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link href="/learn/l0" className="u-btn u-btn-primary">
              开始学习（约 15 分钟）
            </Link>
            <Link href="/cases" className="u-btn u-btn-ghost">
              动手实践
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SourceBadge state="demo" />
            <span className="u-lesson-note">本页所有演示内容均标注：真实输出 / 演示样例 / 规划中</span>
          </div>

          <div className="mt-14 border-t border-[var(--border)] pt-8">
            <p className="u-eyebrow mb-4">你会学到什么（理解标志）</p>
            <div className="space-y-4">
              {LESSON_LEVELS.slice(0, 3).map((level) => (
                <div key={level.id} className="u-panel p-5">
                  <span className="u-lesson-note">
                    L{level.index} · {level.title}
                  </span>
                  <p className="u-lesson-body mt-2">{level.understanding}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="md:col-span-5 md:border-l md:border-[var(--border)] md:pl-10">
          <p className="u-eyebrow mb-5">8 级纵向路径 · 每级只学 1 件事</p>
          <LearnPath />
          <p className="u-lesson-note mt-6">
            主线只走 8 级路线；延伸材料从每一级右侧折叠栏进入。
          </p>
        </aside>
      </div>
    </div>
  );
}
