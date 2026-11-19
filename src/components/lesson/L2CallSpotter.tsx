'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SourceBadge from '../SourceBadge';
import TermButton from '../TermButton';

/**
 * L2 找到它 —— 复用 learn/step2 的「全行可点反汇编 + 点错也有解释」范式，
 * 三步定位法收敛为 2 步：① 找 call ② 看名字里有没有 strcpy。
 *
 * 唯一新概念：call = 去调用一个现成函数。其余指令不作要求，解释全部用白话，
 * 不出现 Ghidra / IDA / 序言 / 调用约定 等未教术语。
 */

/** 32 行汇编（复用 step2 的 vulnerable 函数片段，补齐到 32 行）。 */
const ASM_LINES: string[] = [
  '0000000000401132 <vulnerable>:',
  '  401132:  55                      push   %rbp',
  '  401133:  48 89 e5                mov    %rsp,%rbp',
  '  401136:  48 83 ec 50             sub    $0x50,%rsp',
  '  40113a:  48 89 7d b8             mov    %rdi,-0x48(%rbp)',
  '  40113e:  48 8b 55 b8             mov    -0x48(%rbp),%rdx',
  '  401142:  48 8d 45 c0             lea    -0x40(%rbp),%rax',
  '  401146:  48 89 d6                mov    %rdx,%rsi',
  '  401149:  48 89 c7                mov    %rax,%rdi',
  '  40114c:  e8 df fe ff ff          call   401030 <strcpy@plt>',
  '  401151:  48 8d 45 c0             lea    -0x40(%rbp),%rax',
  '  401155:  48 89 c6                mov    %rax,%rsi',
  '  401158:  48 8d 3d a5 0e 00 00    lea    0xea5(%rip),%rdi',
  '  40115f:  b8 00 00 00 00          mov    $0x0,%eax',
  '  401164:  e8 c7 fe ff ff          call   401030 <printf@plt>',
  '  401169:  90                      nop',
  '  40116a:  c9                      leave',
  '  40116b:  c3                      ret',
  '  40116c:  55                      push   %rbp',
  '  40116d:  48 89 e5                mov    %rsp,%rbp',
  '  401170:  48 83 ec 50             sub    $0x50,%rsp',
  '  401174:  48 89 7d b8             mov    %rdi,-0x48(%rbp)',
  '  401178:  48 8b 4d b8             mov    -0x48(%rbp),%rcx',
  '  40117c:  48 8d 45 c0             lea    -0x40(%rbp),%rax',
  '  401180:  ba 3f 00 00 00          mov    $0x3f,%edx',
  '  401185:  48 89 ce                mov    %rcx,%rsi',
  '  401188:  48 89 c7                mov    %rax,%rdi',
  '  40118b:  e8 d0 fe ff ff          call   401060 <strncpy@plt>',
  '  401190:  c6 45 ff 00             movb   $0x0,-0x1(%rbp)',
  '  401194:  48 8d 45 c0             lea    -0x40(%rbp),%rax',
  '  401198:  90                      nop',
  '  401199:  c9                      leave',
];

interface LineInfo {
  danger: boolean;
  what: string;
  why: string;
}

/** 逐行白话解释：点中危险行说「它不检查长度」，点错也有解释。 */
function explainLine(line: string): LineInfo {
  if (line.includes('strcpy@plt')) {
    return {
      danger: true,
      what: '这一行是 call strcpy —— 去调用一个「不检查长度」的现成函数。',
      why: '★ 就是它！strcpy 不知道盒子只有 64 字节，输入有多长它就拷多长，多出来的会盖住旁边的东西。这正是 L1 的溢出源头。',
    };
  }
  if (line.includes('strncpy@plt')) {
    return {
      danger: false,
      what: '这一行也是一次 call，但名字是 strncpy，不是 strcpy。',
      why: '它带一个长度上限，是下一级要讲的「给杯子加刻度线」的安全写法，不是我们要找的危险调用。',
    };
  }
  if (/\bcall\b/.test(line)) {
    return {
      danger: false,
      what: '这一行也是一次 call（去调用一个现成函数）。',
      why: '但它名字里没有 strcpy，不是那个不检查长度的调用。第二步就是「看名字里有没有 strcpy」，继续看别的 call 行。',
    };
  }
  if (line.trim().startsWith('0000') || line.includes('<vulnerable>')) {
    return {
      danger: false,
      what: '这是一个函数标签，不是一条指令。',
      why: '标签只告诉我们「下面进入哪个函数」，不可能是漏洞点。',
    };
  }
  return {
    danger: false,
    what: '这一行只是把数据搬来搬去，或者搭好函数开头 / 结尾。',
    why: '它不是「去调用函数」。第一步请只扫以 call 开头的行 —— 找危险调用从这里开始。',
  };
}

export default function L2CallSpotter() {
  const [selected, setSelected] = useState<number | null>(null);
  const [found, setFound] = useState(false);

  const handlePick = (lineNumber: number): void => {
    setSelected(lineNumber);
    if (explainLine(ASM_LINES[lineNumber - 1]).danger) setFound(true);
  };

  const current = selected === null ? null : explainLine(ASM_LINES[selected - 1]);

  return (
    <div>
      {/* 两步定位法（收敛自原三步定位法） */}
      <div className="u-panel p-5 mb-5">
        <p className="u-eyebrow mb-3">两步定位法</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="u-lesson-section !text-[17px] !mb-1">① 找 <TermButton termId="call" /></p>
            <p className="u-lesson-note">汇编里所有「去叫一个现成函数」都以 call 开头。先扫一遍带 call 的行。</p>
          </div>
          <div>
            <p className="u-lesson-section !text-[17px] !mb-1">② 看名字里有没有 strcpy</p>
            <p className="u-lesson-note">call 后面尖括号里的名字就是被调用的函数。名字里带 strcpy 的那个，不检查长度。</p>
          </div>
        </div>
      </div>

      <div className="u-lesson-stage">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="u-lesson-section !mb-0">32 行里藏着 1 处危险调用 · 每一行都能点</h2>
          <SourceBadge state="demo" />
        </div>
        <p className="u-lesson-body mb-4">
          点错完全没关系，每一行都会告诉你它是什么、为什么是 / 不是要找的那一行。
          这里只要求你认得 <TermButton termId="call" /> 和 <TermButton termId="dangerous-call" />。
        </p>

        <div className="u-panel overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">交互练习 · 找出唯一危险的那一行</span>
            <span className="font-mono text-[11px]">
              <span className="text-[var(--text-soft)]">已找到 </span>
              <span className={found ? 'text-[var(--accent-green)]' : 'text-[var(--text)]'}>
                {found ? 1 : 0}/1
              </span>
            </span>
          </div>

          <div className="overflow-x-auto py-2">
            {ASM_LINES.map((text, i) => {
              const lineNumber = i + 1;
              const isSelected = selected === lineNumber;
              const isDanger = explainLine(text).danger;
              return (
                <button
                  key={lineNumber}
                  type="button"
                  onClick={() => handlePick(lineNumber)}
                  aria-label={`查看第 ${lineNumber} 行解释`}
                  className={clsx(
                    'w-full flex items-baseline gap-3 text-left px-4 border-l-2 transition-colors',
                    isSelected && isDanger && 'bg-accent-green/10 border-accent-green',
                    isSelected && !isDanger && 'bg-brand-500/10 border-[var(--brand-500)]',
                    !isSelected && 'border-transparent hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <span className="w-7 flex-shrink-0 text-right font-mono text-[11px] text-[var(--line-number)] select-none">
                    {lineNumber}
                  </span>
                  <span className="font-mono text-[12.5px] leading-[1.7] whitespace-pre text-[var(--text-muted)]">
                    {text || ' '}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--border)] px-5 py-3.5">
            {current === null || selected === null ? (
              <p className="font-mono text-[12px] text-[var(--text-soft)]">
                点击任意一行 → 这里会用白话解释它是什么、为什么是 / 不是危险点
              </p>
            ) : (
              <div className={clsx(current.danger && 'text-[var(--accent-green)]')}>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-[var(--border)]">
                    第 {selected} 行
                  </span>
                  {current.danger && (
                    <span className="font-mono text-[11px] font-semibold">✓ 就是它 —— 它不检查长度</span>
                  )}
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--text)] mb-1">{current.what}</p>
                <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{current.why}</p>
              </div>
            )}
          </div>
        </div>

        <p className="u-lesson-note mt-4">
          以上为演示样例：这段汇编是课前备好的教学素材，不是现场反汇编结果。
        </p>
      </div>
    </div>
  );
}
