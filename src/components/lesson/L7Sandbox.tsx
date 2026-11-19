'use client';

import Link from 'next/link';
import SandboxPlayer from '../SandboxPlayer';
import SourceBadge from '../SourceBadge';
import { getSandboxById } from '@/data/sandbox';

/**
 * L7 自己走一遍 —— 主线的终点演示，0 个新概念（PRD 4.1 硬规则 4）。
 *
 * 复用 /cases 的 SandboxPlayer + data/sandbox.ts 的新手案例，指导模式默认由
 * SandboxPlayer 按 difficulty==='beginner' 自动开启；选项只用前面出现过的词。
 * 通关后给一张收尾卡，把 L2 的 call 与 L6 的 Canary 显式串起来。
 */

export default function L7Sandbox() {
  const caseData = getSandboxById('sb-gets-overflow');

  if (!caseData) {
    return (
      <div className="u-lesson-stage">
        <SourceBadge state="demo" />
        <p className="u-lesson-body mt-3">
          新手沙箱案例暂时不可用。你可以先从
          <Link href="/cases" className="u-link !text-[14px]"> 动手实践 </Link>
          进入，或回到上一级复习。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="u-lesson-stage mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="u-lesson-section !mb-0">把前 7 级自己走一遍</h2>
          <SourceBadge state="demo" />
        </div>
        <p className="u-lesson-body">
          本级<strong className="text-[var(--text)]">不引入任何新词</strong>。指导模式默认开着，
          每一步都会说清「做什么、为什么、材料怎么看」；点错有解释。
          走完之后，对着下面的收尾卡说出「哪步用了 L2 的 call、哪步用了 L6 的 Canary」。
        </p>
      </div>

      <SandboxPlayer caseData={caseData} />

      <div className="u-panel p-6 mt-10">
        <p className="u-eyebrow mb-3">通关收尾 · 把学过的串起来</p>
        <ul className="space-y-2.5 u-lesson-body">
          <li>· 找到 strcpy 那一行 —— 用的是 <strong>L2 的 call</strong>（先找 call，再看名字）。</li>
          <li>· 判断输入够不够长 —— 用的是 <strong>L4 的两道关</strong>。</li>
          <li>· 把 strcpy 换成带上限的写法 —— 用的是 <strong>L3 的 strncpy</strong>。</li>
          <li>· 最后决定要不要开防护 —— 用的是 <strong>L6 的 Canary</strong>。</li>
        </ul>
        <p className="u-lesson-note mt-4">
          沙箱内容为演示样例，在浏览器内完成。
        </p>
      </div>
    </div>
  );
}
