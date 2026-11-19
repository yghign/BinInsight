'use client';

import DemoTerminal, { type DemoStep } from '../DemoTerminal';
import TermButton from '../TermButton';

/**
 * L5 崩给你看 —— 复用 DemoTerminal（已带 sourceLabel「预录演示」+ SourceBadge）。
 * 唯一新概念：崩溃 = 程序被强行停下、留下现场。
 * 只认一个现象：rip = 0x41414141（'A'）。不需要会敲任何命令。
 */

const STEPS: DemoStep[] = [
  {
    cmd: 'run  < 一段很长的 A',
    output: '程序开始执行…\n读取输入，把输入放进那个固定大小的盒子。\n（输入比盒子长，多出来的还在往后写）',
    rip: '0x000000000040116b',
    note: '第 1 步：喂一段超长输入',
  },
  {
    cmd: 'continue',
    output: '盒子被填满，盒子旁边「下一步去哪」的位置也被 A 盖住了。\n程序准备按这个位置往下跳……',
    rip: '0x000000000040116b',
    note: '第 2 步：溢出已经发生',
  },
  {
    cmd: 'info registers rip',
    output: "rip   0x41414141   ← 注意这一串 0x41\n'A' 的编码正好是 0x41。",
    rip: '0x41414141',
    note: '第 3 步：只认这一个现象',
  },
  {
    cmd: '（程序被强行停下）',
    output: '程序想跳到 0x41414141，那里不是它能去的地方，于是被强行停下，留下这份现场。\n这就是「崩溃」。',
    rip: '0x41414141',
    note: '第 4 步：看现场，不用敲命令',
  },
];

export default function L5Crash() {
  return (
    <div className="u-lesson-stage">
      <div className="mb-4">
        <h2 className="u-lesson-section">看一次「现场」，只认一串 A</h2>
        <p className="u-lesson-body">
          像车祸之后看刹车痕：程序被强行停下来，留下一份现场记录。
          <TermButton termId="crash" /> 之后，本该记着「下一步去哪」的 <TermButton termId="rip" />，
          变成了一串 <code className="inline">0x41414141</code> —— 因为 'A' 的编码就是 0x41。
        </p>
      </div>

      <DemoTerminal steps={STEPS} sourceLabel="预录演示 · 现场回放" />

      <div className="mt-5 border-l-2 border-l-[var(--brand-500)] pl-4">
        <p className="u-lesson-body">
          <strong className="text-[var(--text)]">本级只要求你认出这一串 0x41</strong>，
          并说出「A 写到了本该是地址的地方」。不需要会敲任何命令，也不需要装任何工具。
        </p>
      </div>

      <p className="u-lesson-note mt-4">
        以上为演示样例：终端里的每一步都是课前预录的教学文本，不是现场调试器输出。
      </p>
    </div>
  );
}
