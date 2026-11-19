'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SourceBadge from '../SourceBadge';
import TermButton from '../TermButton';

/**
 * L0 起点 —— 程序 = 菜谱 + 冰箱。
 *
 * 硬约束：本级正文不出现 ELF / 二进制 / 汇编 这三个词（也不出现任何未教术语作为已知使用）。
 * 只用一个生活化对照图 + 一个可点动作，本级唯一新概念是「程序 = 一堆步骤 + 一块放数据的地方」。
 */

const BOX_SIZE = 8;

export default function L0Program() {
  const [filled, setFilled] = useState(false);

  return (
    <div className="u-lesson-stage">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="u-lesson-section !mb-0">一张对照图：菜谱 ↔ 冰箱</h2>
        <SourceBadge state="demo" />
      </div>

      <p className="u-lesson-body mb-6">
        把 <TermButton termId="program" /> 想成一张<strong className="text-[var(--text)]">菜谱</strong>：
        先做哪一步、再做哪一步，电脑照着顺序执行。再给它配一个<strong className="text-[var(--text)]">冰箱</strong>：
        一块专门放数据、<strong className="text-[var(--text)]">大小事先定好</strong>的地方。
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 左：菜谱 */}
        <div className="u-panel p-5">
          <p className="u-eyebrow mb-4">菜谱 · 一堆步骤</p>
          <ol className="space-y-3">
            {[
              '① 先准备好一个固定大小的盒子',
              '② 读你敲进去的那段文字',
              '③ 把这段文字放进盒子里',
            ].map((text) => (
              <li key={text} className="u-lesson-body">{text}</li>
            ))}
          </ol>
          <p className="u-lesson-note mt-5">
            顺序是写死的，电脑不会自己改。第 ② 步拿到的东西，我们叫它 <TermButton termId="input" />。
          </p>
        </div>

        {/* 右：冰箱 / 盒子 */}
        <div className="u-panel p-5">
          <p className="u-eyebrow mb-4">冰箱 · 一块放数据的地方（<TermButton termId="box" />）</p>
          <div className="grid grid-cols-8 gap-1.5" aria-label="8 格大小的盒子">
            {Array.from({ length: BOX_SIZE }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-9 rounded-[4px] border flex items-center justify-center font-mono text-[12px] transition-colors',
                  filled && i < 4
                    ? 'border-[var(--brand-500)] bg-[color-mix(in_srgb,var(--brand-500)_18%,transparent)] text-[var(--brand-500)]'
                    : 'border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]'
                )}
              >
                {filled && i < 4 ? 'A' : '·'}
              </div>
            ))}
          </div>
          <p className="u-lesson-note mt-3">
            一共只有 {BOX_SIZE} 格，这是事先定好的，不会临时变大。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilled(true)} className="u-btn u-btn-primary !py-2 !px-4 !text-[13px]">
              放一段输入进去
            </button>
            <button type="button" onClick={() => setFilled(false)} className="u-btn u-btn-ghost !py-2 !px-4 !text-[13px]">
              清空
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 border-l-2 border-l-[var(--brand-500)] pl-4">
        <p className="u-lesson-body">
          {filled
            ? '看：输入被放进了盒子，只占了前 4 格，剩下的还空着。记住「固定大小」这件事 —— 下一级我们要故意给一段更长的输入。'
            : '点一下「放一段输入进去」，看看输入是怎么被放进这个固定大小的盒子里的。'}
        </p>
      </div>
    </div>
  );
}
