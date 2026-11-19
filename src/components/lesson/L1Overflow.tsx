'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SourceBadge from '../SourceBadge';
import TermButton from '../TermButton';

/**
 * L1 装不下 —— 拖滑块加长输入，看盒子溢出染色。
 * 唯一新概念：缓冲区溢出（水倒进小杯，多出来的洒到旁边）。
 * 复用 L0 的「输入 → 盒子」；strcpy / 返回地址以白话出现并可点开解释。
 */

const BOX_SIZE = 8;
const RETURN_SLOTS = 4;

export default function L1Overflow() {
  const [len, setLen] = useState<number>(4);
  const overflow = Math.max(0, len - BOX_SIZE);
  const covered = Math.min(RETURN_SLOTS, overflow);

  return (
    <div className="u-lesson-stage">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="u-lesson-section !mb-0">把输入一点点加长，看看会发生什么</h2>
        <SourceBadge state="demo" />
      </div>

      <p className="u-lesson-body mb-5">
        <TermButton termId="strcpy" /> 这个现成函数会把 <TermButton termId="input" /> 整段拷进
        <TermButton termId="box" />，<strong className="text-[var(--text)]">它不检查盒子有多大</strong>。
        拖动下面的滑块，把输入从 4 个字符一直加长到 20 个。
      </p>

      <label className="block mb-6">
        <span className="u-lesson-note block mb-2">
          输入长度：<strong className="text-[var(--text)]">{len}</strong> 个字符（盒子只有 {BOX_SIZE} 格）
        </span>
        <input
          type="range"
          min={1}
          max={20}
          value={len}
          onChange={(event) => setLen(Number(event.target.value))}
          className="w-full accent-[var(--brand-500)]"
          aria-label="输入长度"
        />
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 盒子 */}
        <div className="u-panel p-5">
          <p className="u-eyebrow mb-3">盒子（{BOX_SIZE} 格）</p>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: BOX_SIZE }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-9 rounded-[4px] border flex items-center justify-center font-mono text-[12px]',
                  i < len
                    ? 'border-[var(--brand-500)] bg-[color-mix(in_srgb,var(--brand-500)_18%,transparent)] text-[var(--brand-500)]'
                    : 'border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]'
                )}
              >
                {i < len ? 'A' : '·'}
              </div>
            ))}
          </div>
          <p className="u-lesson-note mt-3">前 {Math.min(len, BOX_SIZE)} 格被输入填满。</p>
        </div>

        {/* 盒子旁边：返回地址 */}
        <div className="u-panel p-5">
          <p className="u-eyebrow mb-3">盒子旁边 · <TermButton termId="return-address" /></p>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: RETURN_SLOTS }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-9 rounded-[4px] border flex items-center justify-center font-mono text-[12px] transition-colors',
                  i < covered
                    ? 'border-[var(--accent-red)] bg-[color-mix(in_srgb,var(--accent-red)_20%,transparent)] text-[var(--accent-red)]'
                    : 'border-[var(--border-soft)] bg-[var(--bg-soft)] text-[var(--text-soft)]'
                )}
              >
                {i < covered ? 'A' : '·'}
              </div>
            ))}
          </div>
          <p className="u-lesson-note mt-3">
            这里原本记着「程序下一步要跳去哪」。
          </p>
        </div>
      </div>

      <div
        className={clsx(
          'mt-5 rounded-md border p-4 text-[14.5px] leading-[1.85]',
          overflow > 0
            ? 'border-accent-red/40 bg-accent-red/5'
            : 'border-[var(--border)] bg-[var(--bg-soft)]'
        )}
      >
        {overflow > 0 ? (
          <p className="text-[var(--text-muted)]">
            装不下了！多出来的 <strong className="text-[var(--accent-red)]">{overflow}</strong> 个字符
            没有地方放，继续往后写，<strong className="text-[var(--text)]">盖住了盒子旁边原本放好的东西</strong> ——
            其中就包括「程序下一步要跳去的地方」。这就叫 <TermButton termId="overflow" />。
          </p>
        ) : (
          <p className="text-[var(--text-muted)]">
            输入还装得下。继续把滑块往右拖，直到超过 {BOX_SIZE} 格。
          </p>
        )}
      </div>

      <p className="u-lesson-note mt-4">
        以上为演示样例：格子是示意，用来说清「多出来的数据会盖住别的东西」，不是真实运行结果。
      </p>
    </div>
  );
}
