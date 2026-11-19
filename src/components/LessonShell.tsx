'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import clsx from 'clsx';
import type { LessonLevel } from '@/data/lesson';
import { LESSON_LEVELS, LEVEL_IDS, getLevel } from '@/data/lesson';
import { nextLevel, nextRoute, prevLevel, nodeStatus } from '@/lib/lesson';
import { getGlossEntry } from '@/data/glossary';
import { useLessonProgress } from './useProgress';
import SelfCheckCard from './SelfCheckCard';
import TermButton from './TermButton';
import SourceBadge from './SourceBadge';

/**
 * L0~L7 通用两栏骨架（PRD 6.2）。
 *
 * 左主栏大留白：本级只学 1 件事 + 旧知识回链 + 交互区 + 自检卡 + 前进按钮。
 * 右窄栏 sticky：8 级路径 + 本级术语列表 + 默认收起的「课外拓展阅读」。
 * 顶部：第 N 级 / 共 8 级 + 横向细进度线。
 *
 * 前进按钮只由 nextLevel()/nextRoute() 生成；L7.next === null，绝不出现 L8。
 */

const EXTENSION_LINKS: { href: string; label: string }[] = [
  { href: '/tools/dilipa', label: 'Dilipa · 只读分析 + 变更预览' },
  { href: '/tools/mutagen', label: 'Mutagen · 设计构想（本次未实现）' },
  { href: '/reference/glossary', label: '全部核心概念' },
  { href: '/reference/uaf', label: '高阶漏洞：UAF / 格式化字符串 / 堆' },
  { href: '/learn/step1', label: '旧四步教程（进阶块）' },
  { href: '/terms', label: '使用条款' },
];

export default function LessonShell({
  level,
  children,
}: {
  level: LessonLevel;
  children: ReactNode;
}) {
  const { progress, markDone } = useLessonProgress();
  const next = nextLevel(level.id);
  const nextHref = nextRoute(level.id);
  const prev = prevLevel(level.id);
  const prevLevelData = prev ? getLevel(prev) : undefined;

  // 本级新出现的术语 = 本级 allowedTerms 减去前级 allowedTerms
  const prevAllowed = prevLevelData?.allowedTerms ?? [];
  const newTerms = level.allowedTerms.filter((id) => !prevAllowed.includes(id));
  const oldTerms = level.allowedTerms.filter((id) => prevAllowed.includes(id));

  return (
    <div className="u-lesson-wrap">
      {/* 顶部：第 N 级 / 共 8 级 + 横向细进度线 */}
      <div className="u-lesson-progress-head">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="u-lesson-level-label">
            第 {level.index + 1} 级 / 共 {LESSON_LEVELS.length} 级
          </span>
          <span className="u-lesson-note">{level.title}</span>
        </div>
        <div className="u-lesson-progress-line" aria-label="8 级进度">
          {LESSON_LEVELS.map((item) => (
            <span
              key={item.id}
              className="u-lesson-tick"
              data-state={
                progress[item.id]
                  ? 'done'
                  : item.id === level.id
                    ? 'active'
                    : 'upcoming'
              }
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="u-lesson-grid">
        {/* 左主栏 */}
        <div className="u-lesson-main">
          <h1 className="u-lesson-title">
            {level.title}
            <span className="u-lesson-note" style={{ display: 'block', marginTop: 6 }}>
              本级只学 1 件事
            </span>
          </h1>

          <div className="u-lesson-concept">
            <h2 className="u-lesson-section">{level.newConcept}</h2>
            <p className="u-lesson-body">{level.plainDefinition}</p>
            <div style={{ marginTop: 14 }}>
              <SourceBadge state="demo" />
            </div>
          </div>

          {level.reuse.length > 0 && (
            <div className="u-lesson-reuse" aria-label="用到的旧知识">
              <span className="u-lesson-note" style={{ alignSelf: 'center' }}>用到的旧知识：</span>
              {level.reuse.map((text) => (
                <span key={text} className="u-tag">{text}</span>
              ))}
              {prevLevelData && (
                <Link href={prevLevelData.route} className="u-link !text-[12.5px]">
                  回上一级复习 →
                </Link>
              )}
            </div>
          )}

          {/* 本级交互区 */}
          <div>{children}</div>

          {/* 自检卡 */}
          <div style={{ marginTop: 32 }}>
            <SelfCheckCard check={level.selfCheck} onPass={() => markDone(level.id)} />
          </div>

          {/* 前进按钮：只由 nextLevel() 生成 */}
          <div className="u-lesson-footer">
            <div>
              {prevLevelData && (
                <Link href={prevLevelData.route} className="u-btn u-btn-ghost">
                  ← 上一级
                </Link>
              )}
            </div>
            {nextHref && next ? (
              <Link href={nextHref} className="u-btn u-btn-primary">
                下一级 · {getLevel(next)?.title} →
              </Link>
            ) : (
              <span className="u-lesson-note">
                演示完成 · 8 级全部走完
              </span>
            )}
          </div>
        </div>

        {/* 右窄栏 sticky */}
        <aside className="u-lesson-sidebar" aria-label="本级导航">
          <p className="u-lesson-side-title">8 级路径</p>
          <nav>
            {LESSON_LEVELS.map((item) => {
              const status = nodeStatus(item.id, level.id, progress);
              return (
                <Link
                  key={item.id}
                  href={item.route}
                  className={clsx('u-lesson-path-item')}
                  data-current={item.id === level.id}
                  data-done={progress[item.id] === true}
                  aria-current={item.id === level.id ? 'page' : undefined}
                >
                  <span className="u-lesson-dot" aria-hidden="true" />
                  <span>
                    {item.index + 1}. {item.title}
                  </span>
                  {status === 'locked' && (
                    <span className="u-lesson-note" style={{ marginLeft: 'auto' }}>未开始</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="u-lesson-ext" style={{ marginTop: 26 }}>
            <p className="u-lesson-side-title">本级术语（点一下看白话解释）</p>
            <div className="flex flex-wrap gap-2">
              {newTerms.length > 0 ? (
                newTerms.map((id) => <TermButton key={id} termId={id} />)
              ) : (
                <span className="u-lesson-note">本级无新术语 · 纯复用</span>
              )}
            </div>
            {oldTerms.length > 0 && (
              <div className="mt-3">
                <p className="u-lesson-note mb-1.5">前面学过的词：</p>
                <div className="flex flex-wrap gap-2">
                  {oldTerms.slice(0, 8).map((id) => (
                    <TermButton key={id} termId={id} className="!opacity-80">
                      {getGlossEntry(id)?.term ?? id}
                    </TermButton>
                  ))}
                </div>
              </div>
            )}
          </div>

          <details className="u-lesson-ext" style={{ marginTop: 22 }}>
            <summary>延伸阅读</summary>
            <div className="mt-3 space-y-2">
              <p className="u-lesson-note">
                延伸材料，其中的术语可能超出主线所教
                （例如 strip 表示移除符号表）。学有余力可自行浏览。
              </p>
              {EXTENSION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-[12.5px] text-[var(--text-muted)] hover:text-[var(--brand-500)]"
                >
                  · {link.label}
                </Link>
              ))}
            </div>
          </details>

          <p className="u-lesson-note" style={{ marginTop: 20 }}>
            理解标志：{level.understanding}
          </p>
        </aside>
      </div>
    </div>
  );
}
