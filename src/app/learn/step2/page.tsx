'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import ModeToggle, { type Mode } from '@/components/ModeToggle';
import CodeBlock from '@/components/CodeBlock';

const vulnerableCSource = `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void vulnerable(char *input) {
    char buffer[64];
    strcpy(buffer, input);  // 危险！无长度检查的字符串拷贝
    printf("Input: %s\\n", buffer);
}

void safe_func(char *input) {
    char buf[64];
    strncpy(buf, input, 63);  // 安全：限制拷贝长度
    buf[63] = '\\0';
    printf("Safe: %s\\n", buf);
}

int main(int argc, char *argv[]) {
    if (argc > 1) {
        vulnerable(argv[1]);
        safe_func(argv[1]);
    }
    return 0;
}`;

const disassemblyWithSymbols = `0000000000401132 <vulnerable>:
  401132:       55                      push   %rbp
  401133:       48 89 e5                mov    %rsp,%rbp
  401136:       48 83 ec 50             sub    $0x50,%rsp
  40113a:       48 89 7d b8             mov    %rdi,-0x48(%rbp)
  40113e:       48 8b 55 b8             mov    -0x48(%rbp),%rdx
  401142:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401146:       48 89 d6                mov    %rdx,%rsi
  401149:       48 89 c7                mov    %rax,%rdi
  40114c:       e8 df fe ff ff          call   401030 <strcpy@plt>
  401151:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401155:       48 89 c6                mov    %rax,%rsi
  401158:       48 8d 3d a5 0e 00 00    lea    0xea5(%rip),%rdi
  40115f:       b8 00 00 00 00          mov    $0x0,%eax
  401164:       e8 c7 fe ff ff          call   401030 <printf@plt>
  401169:       90                      nop
  40116a:       c9                      leave
  40116b:       c3                      ret

000000000040116c <safe_func>:
  40116c:       55                      push   %rbp
  40116d:       48 89 e5                mov    %rsp,%rbp
  401170:       48 83 ec 50             sub    $0x50,%rsp
  401174:       48 89 7d b8             mov    %rdi,-0x48(%rbp)
  401178:       48 8b 4d b8             mov    -0x48(%rbp),%rcx
  40117c:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401180:       ba 3f 00 00 00          mov    $0x3f,%edx
  401185:       48 89 ce                mov    %rcx,%rsi
  401188:       48 89 c7                mov    %rax,%rdi
  40118b:       e8 d0 fe ff ff          call   401060 <strncpy@plt>
  401190:       c6 45 ff 00             movb   $0x0,-0x1(%rbp)
  401194:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401198:       48 89 c6                mov    %rax,%rsi
  40119b:       48 8d 3d 62 0e 00 00    lea    0xe62(%rip),%rdi
  4011a2:       b8 00 00 00 00          mov    $0x0,%eax
  4011a7:       e8 84 fe ff ff          call   401030 <printf@plt>
  4011ac:       90                      nop
  4011ad:       c9                      leave
  4011ae:       c3                      ret`;

/* ---------- 2.2 交互练习：每一行都可点击，每行都配有解释 ---------- */

interface LineExplanation {
  /** 这一行在做什么 */
  what: string;
  /** 是 / 不是危险点的原因 */
  why: string;
  /** 是否为本练习要找的危险调用 */
  danger?: boolean;
}

/**
 * 与上方 disassemblyWithSymbols 逐行对应（按顺序）。
 * 改动反汇编文本时必须同步增删这里的条目。
 */
const lineExplanations: LineExplanation[] = [
  { what: '函数标签：vulnerable 函数从地址 0x401132 开始。', why: '标签不是指令，不可能是漏洞点 —— 但它告诉我们"下面进入 vulnerable 函数"。（顺带：能看到函数名，是因为符号表没被 strip。）' },
  { what: '函数序言第一步：把调用者的栈底指针 rbp 压栈保存。', why: '不是危险点。这是所有函数开头都有的固定动作，用于建立栈帧。' },
  { what: '函数序言第二步：把当前栈顶 rsp 设为新栈帧的底 rbp。', why: '不是危险点。序言的固定动作，和上一行配套。' },
  { what: '栈顶下移 0x50（80 字节），为局部变量腾出空间。', why: '不是危险点。只是在"圈地"开辟栈空间，还没有任何数据流入。' },
  { what: '把第一个参数（input 指针，在 rdi 寄存器里）保存到栈上。', why: '不是危险点。x86-64 调用约定里第一个参数放 rdi —— 这行只是存放指针，还没有拷贝数据。' },
  { what: '把刚保存的 input 指针取回到 rdx 寄存器。', why: '不是危险点。普通的数据搬运。' },
  { what: '取 buffer 数组的地址（栈上 64 字节数组，位于 rbp-0x40）。', why: '不是危险点。lea 只计算地址、不访问内存。但记住这个地址 —— 下一步就要往这里写数据。' },
  { what: '把 input 指针放进 rsi —— strcpy 的第二个参数（源）。', why: '不是危险点。调用前的参数准备。' },
  { what: '把 buffer 地址放进 rdi —— strcpy 的第一个参数（目标）。', why: '不是危险点。参数准备。x86-64 约定：rdi = 第 1 个参数，rsi = 第 2 个参数。' },
  { what: '调用 strcpy：把 input 指向的字符串完整拷贝进 buffer。', why: '★ 就是它！strcpy 不知道 buffer 只有 64 字节 —— input 有多长它就拷多长，多出的部分会覆盖栈上相邻的数据（甚至返回地址）。这就是经典的栈溢出源头。', danger: true },
  { what: '再次取 buffer 的地址，这次是给 printf 用。', why: '不是危险点。普通参数准备。' },
  { what: '把 buffer 地址放进 rsi（printf 的第二个参数）。', why: '不是危险点。参数准备。' },
  { what: '取格式串 "Input: %s\\n" 的地址放进 rdi。', why: '不是危险点。注意：格式串是写死在程序里的常量 —— 这正是 printf 用法安全的关键。' },
  { what: '把 eax 清零（表示本次调用不使用向量寄存器传参）。', why: '不是危险点。调用约定的细节动作。' },
  { what: '调用 printf 输出结果。', why: '不是危险点：格式串是常量、用户数据只通过 %s 打印。真正危险的是 printf(用户输入) 把数据当格式串 —— 那是格式化字符串漏洞，在案例区有专门练习。' },
  { what: '空指令（no operation），什么都不做。', why: '不是危险点。常用于指令对齐。' },
  { what: '函数尾声第一步：回收栈帧（等价于 mov rsp,rbp 再 pop rbp）。', why: '不是危险点。所有函数结尾的例行动作。' },
  { what: '函数返回：从栈上弹出"返回地址"并跳过去执行。', why: '它本身不是漏洞，但它是溢出攻击的"跳板" —— 如果第 10 行拷贝越界，这里弹出的返回地址就可能已经被攻击者覆盖成了假地址。' },
  { what: '空行（两个函数之间的分隔）。', why: '不是指令。提示：找危险调用，先扫 call 指令。' },
  { what: '函数标签：safe_func 从这里开始 —— 这是与 vulnerable 对照的安全版本。', why: '标签不是指令。名字能直接看到，同样是符号表未剥离的功劳。' },
  { what: '函数序言：保存调用者的 rbp。', why: '不是危险点。固定动作。' },
  { what: '函数序言：设置新栈帧底部。', why: '不是危险点。固定动作。' },
  { what: '开辟 0x50（80 字节）栈空间给局部变量。', why: '不是危险点。与 vulnerable 函数相同。' },
  { what: '保存第一个参数（input 指针）到栈上。', why: '不是危险点。与 vulnerable 函数相同。' },
  { what: '取回 input 指针到 rcx 寄存器。', why: '不是危险点。数据搬运。' },
  { what: '取 buf 数组的地址（栈上 64 字节数组）。', why: '不是危险点。与 vulnerable 函数相同。' },
  { what: '把 0x3f（= 63）放进 edx —— 这是"限长"参数！', why: '不是危险点，恰恰相反 —— 注意这行：safe_func 在调用前准备好了最大拷贝长度，这就是它和 vulnerable 的本质区别。' },
  { what: '把 input 指针放进 rsi（第二个参数）。', why: '不是危险点。参数准备。' },
  { what: '把 buf 地址放进 rdi（第一个参数）。', why: '不是危险点。参数准备。' },
  { what: '调用 strncpy：最多拷贝 63 字节，不会越界。', why: '不是危险点：strncpy 带长度上限（对比 strcpy）。这是教科书级的安全写法 —— 限长函数 + 手动补终止符。' },
  { what: '在 buf 末尾写入 0（字符串终止符）。', why: '不是危险点。strncpy 不保证补 \\0，手动补上是必要的收尾动作。' },
  { what: '取 buf 地址给 printf 使用。', why: '不是危险点。参数准备。' },
  { what: '把 buf 地址放进 rsi（printf 的第二个参数）。', why: '不是危险点。参数准备。' },
  { what: '取常量格式串的地址放进 rdi。', why: '不是危险点。又见常量格式串 —— 安全用法。' },
  { what: '把 eax 清零。', why: '不是危险点。调用约定细节。' },
  { what: '调用 printf 输出结果。', why: '不是危险点。格式串是常量，buf 只作为 %s 的参数被打印。' },
  { what: '空指令。', why: '不是危险点。' },
  { what: '函数尾声：回收栈帧。', why: '不是危险点。' },
  { what: '函数返回：弹出返回地址并跳转。', why: '不是危险点 —— buf 的写入被限制在 63 字节内，这里弹出的返回地址是完好的。对比第 18 行的说明，体会"限长"的价值。' },
];

const dangerousFunctions = [
  { name: 'strcpy', reason: '无长度检查的字符串拷贝，最经典的栈溢出源头' },
  { name: 'gets', reason: '读取一行输入但无法限制长度，已被 C11 标准废弃' },
  { name: 'sprintf', reason: '格式化输出到缓冲区但无长度限制' },
  { name: 'strcat', reason: '字符串拼接无长度检查' },
  { name: 'system', reason: '执行系统命令，若参数可控可导致命令注入' },
];

export default function Step2Page() {
  const [mode, setMode] = useState<Mode>('beginner');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [viewedLines, setViewedLines] = useState<Set<number>>(new Set());
  const [foundDanger, setFoundDanger] = useState(false);
  const [showAutoMark, setShowAutoMark] = useState(false);
  const [methodOpen, setMethodOpen] = useState(true);

  const disassemblyLines = disassemblyWithSymbols.split('\n');

  const handleLineClick = (lineNum: number) => {
    setSelectedLine(lineNum);
    setViewedLines((prev) => new Set(prev).add(lineNum));
    if (lineExplanations[lineNum - 1]?.danger) {
      setFoundDanger(true);
    }
  };

  const handleAutoMark = () => {
    const idx = lineExplanations.findIndex((l) => l.danger);
    if (idx >= 0) {
      setSelectedLine(idx + 1);
      setViewedLines((prev) => new Set(prev).add(idx + 1));
      setFoundDanger(true);
      setShowAutoMark(true);
    }
  };

  const handleReset = () => {
    setSelectedLine(null);
    setViewedLines(new Set());
    setFoundDanger(false);
    setShowAutoMark(false);
    setMethodOpen(true);
  };

  return (
    <div className="space-y-14">
      {/* 页头 */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <p className="u-eyebrow mb-2">Disassembly &amp; Decompilation</p>
            <h2 className="u-display text-2xl md:text-[28px]">静态分析</h2>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
          静态分析是在不运行程序的情况下分析二进制代码的技术。
          通过反汇编和反编译，我们可以阅读程序逻辑，识别危险函数和潜在漏洞。
          {mode === 'advanced' && (
            <> 进阶模式下，你将了解符号表剥离、交叉引用等更深入的概念。</>
          )}
        </p>
      </section>

      {/* 2.1 反汇编与反编译 */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="u-section-num">2.1</span>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">反汇编与反编译基础</h3>
        </div>
        <div className="space-y-3 text-[15px] text-[var(--text-muted)] leading-relaxed">
          <p>
            <strong className="text-[var(--text)]">反汇编（Disassembly）</strong>：将机器码翻译成汇编指令的过程。
            你会看到 <code className="inline">mov</code>、<code className="inline">push</code>、
            <code className="inline">call</code> 等汇编助记符。
          </p>
          <p>
            <strong className="text-[var(--text)]">反编译（Decompilation）</strong>：比反汇编更进一步，
            尝试将汇编代码还原成类 C 的高级语言代码（如 Ghidra 的 Decompiler、IDA 的 Hex-Rays）。
          </p>
          {mode === 'beginner' && (
            <p>
              <strong className="text-[var(--text)]">函数识别</strong>：函数通常有固定的
              <span className="text-brand-300"> 序言（Prologue）</span>和
              <span className="text-brand-300"> 尾声（Epilogue）</span>模式，
              分析工具通过这些模式来识别函数边界。
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="u-panel overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--text-muted)]">C 源代码</span>
              <span className="font-mono text-[10px] text-[var(--text-soft)]">vuln.c</span>
            </div>
            <CodeBlock code={vulnerableCSource} language="c" showLineNumbers={true} />
          </div>
          <div className="u-panel overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--text-muted)]">反汇编（x86-64）</span>
              <span className="font-mono text-[10px] text-[var(--text-soft)]">objdump -d</span>
            </div>
            <CodeBlock code={disassemblyWithSymbols} language="asm" showLineNumbers={true} />
          </div>
        </div>
      </section>

      {/* 2.2 危险函数识别交互 */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="u-section-num">2.2</span>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">危险函数识别 · 交互练习</h3>
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
          某些 C 标准库函数因为缺乏边界检查，是漏洞的常见来源。
          下面这段反汇编里藏着 <strong className="text-[var(--text)]">1 处</strong>真正的危险调用。
          <span className="text-[var(--accent-red)] font-medium">每一行都可以点击</span>
          —— 点错完全没关系，每一行都会告诉你：它是什么、为什么是/不是危险点。动手前先展开下面的定位思路。
        </p>

        {/* 三步定位法 */}
        <div className="u-panel overflow-hidden">
          <button
            onClick={() => setMethodOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-[var(--bg-soft)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-expanded={methodOpen}
          >
            <span className="font-mono text-[11px] tracking-wider text-[var(--text-muted)]">
              不知道从哪下手？展开「三步定位法」
            </span>
            <span className="font-mono text-[var(--text-soft)] text-[13px]" aria-hidden="true">
              {methodOpen ? '−' : '+'}
            </span>
          </button>
          {methodOpen && (
            <div className="px-5 py-5 grid md:grid-cols-3 gap-5 border-t border-[var(--border)]">
              {[
                {
                  step: '① 找 call 指令',
                  desc: '汇编里所有"调用别的函数"都以 call 开头。先扫一遍，把带 call 的行都点开看看。',
                },
                {
                  step: '② 看 call 的目标',
                  desc: 'call 后面尖括号里的名字就是被调用的函数，比如 <strcpy@plt> —— 名字里通常藏着答案。',
                },
                {
                  step: '③ 对照速查表',
                  desc: '问一句：这个函数检查边界吗？strcpy 不检查 → 危险；strncpy 限制长度 63 → 安全。',
                },
              ].map((m) => (
                <div key={m.step}>
                  <div className="font-mono text-[12px] text-[var(--brand-500)] mb-1.5">{m.step}</div>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 危险函数速查 */}
        <div className="border border-accent-red/25 bg-accent-red/5 rounded-md p-5">
          <div className="font-mono text-[11px] tracking-wider text-[var(--accent-red)] mb-3">
            常见危险函数速查表
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {dangerousFunctions.map((func) => (
              <div key={func.name} className="flex items-baseline gap-2.5 text-[13px]">
                <code className="inline flex-shrink-0 !bg-transparent !p-0 text-[var(--accent-orange)]">
                  {func.name}
                </code>
                <span className="text-[var(--text-muted)]">{func.reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 交互反汇编面板：全行可点 */}
        <div className="u-panel overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-soft)]">
            <span className="font-mono text-[11px] tracking-wider text-[var(--text-muted)]">
              交互练习 · 找出唯一真正危险的调用
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoMark}
                className="font-mono text-[12px] px-3 py-1.5 rounded-md bg-brand-500/10 border border-brand-500/40 text-brand-400 hover:bg-brand-500/20 transition-colors"
              >
                自动标注
              </button>
              <button
                onClick={handleReset}
                className="font-mono text-[12px] px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                重置
              </button>
            </div>
          </div>

          {/* 统计条 */}
          <div className="px-5 py-2.5 border-b border-[var(--border)] flex flex-wrap items-center gap-5 font-mono text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--accent-green)]">✓</span>
              <span className="text-[var(--text-soft)]">已找到</span>
              <span className={clsx('font-semibold', foundDanger ? 'text-accent-green' : 'text-[var(--text-bright)]')}>
                {foundDanger ? 1 : 0}/1
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-soft)]">已查看</span>
              <span className="text-[var(--text-bright)] font-semibold">{viewedLines.size}</span>
              <span className="text-[var(--text-soft)]">行</span>
            </div>
          </div>

          {/* 全行可点反汇编 */}
          <div className="overflow-x-auto">
            <div className="min-w-full py-2">
              {disassemblyLines.map((text, i) => {
                const lineNum = i + 1;
                const info = lineExplanations[i];
                const isSelected = selectedLine === lineNum;
                const isDangerLine = !!info?.danger;

                return (
                  <button
                    key={lineNum}
                    onClick={() => handleLineClick(lineNum)}
                    aria-label={`查看第 ${lineNum} 行解释`}
                    className={clsx(
                      'relative group w-full flex items-baseline gap-3 text-left transition-colors px-4 border-l-2',
                      isSelected && isDangerLine && 'bg-accent-green/10 border-accent-green',
                      isSelected && !isDangerLine && 'bg-brand-500/10 border-[var(--brand-500)]',
                      !isSelected && 'border-transparent hover:bg-[var(--bg-hover)]'
                    )}
                  >
                    <span className="w-7 flex-shrink-0 text-right font-mono text-[11px] text-[var(--line-number)] select-none">
                      {lineNum}
                    </span>
                    <span className="font-mono text-[12.5px] leading-[1.7] whitespace-pre text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                      {text || ' '}
                    </span>
                    {isDangerLine && foundDanger && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--accent-green)] font-mono text-[12px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 逐行解释面板 */}
          <div className="border-t border-[var(--border)]">
            {selectedLine === null || !lineExplanations[selectedLine - 1] ? (
              <p className="px-5 py-3.5 font-mono text-[12px] text-[var(--text-soft)]">
                点击任意一行 → 这里会解释它是什么、为什么是/不是危险点
              </p>
            ) : (
              (() => {
                const info = lineExplanations[selectedLine - 1];
                return (
                  <div className={clsx('px-5 py-3.5', info.danger && 'bg-accent-green/5')}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={clsx(
                          'font-mono text-[11px] px-1.5 py-0.5 rounded border',
                          info.danger
                            ? 'text-accent-green border-accent-green/40'
                            : 'text-[var(--text-soft)] border-[var(--border)]'
                        )}
                      >
                        第 {selectedLine} 行
                      </span>
                      {info.danger && (
                        <span className="font-mono text-[11px] text-accent-green font-semibold">
                          ✓ 就是它 —— 危险调用
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--text)] mb-1">{info.what}</p>
                    <p
                      className={clsx(
                        'text-[12.5px] leading-relaxed',
                        info.danger ? 'text-accent-green' : 'text-[var(--text-muted)]'
                      )}
                    >
                      {info.why}
                    </p>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </section>

      {/* 进阶：Stripped vs Non-Stripped */}
      {mode === 'advanced' && (
        <section className="space-y-5">
          <div className="flex items-baseline gap-3">
            <span className="u-section-num">2.3</span>
            <h3 className="text-lg md:text-xl font-semibold tracking-tight">
              符号表剥离：Stripped vs Non-Stripped
            </h3>
          </div>
          <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
            <code className="inline">strip</code> 命令可以移除二进制文件中的符号表和调试信息，
            大幅增加逆向分析的难度。没有函数名，分析者只能通过汇编特征和行为来推断函数功能。
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="u-panel overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)]">
                <span className="font-mono text-[11px] text-accent-green">有符号 · Non-Stripped</span>
              </div>
              <CodeBlock
                code={`0000000000401132 <vulnerable>:
  401132:  push   %rbp
  401133:  mov    %rsp,%rbp
  ...
  40114c:  call   401030 <strcpy@plt>
  ...
  40116b:  ret

000000000040116c <safe_func>:
  40116c:  push   %rbp
  ...`}
                language="asm"
                showLineNumbers={false}
              />
            </div>
            <div className="u-panel overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)]">
                <span className="font-mono text-[11px] text-accent-red">无符号 · Stripped</span>
              </div>
              <CodeBlock
                code={`0000000000401132 <.text>:
  401132:  push   %rbp
  401133:  mov    %rsp,%rbp
  ...
  40114c:  call   401030
  ...
  40116b:  ret
  40116c:  push   %rbp
  40116d:  mov    %rsp,%rbp
  ...`}
                language="asm"
                showLineNumbers={false}
              />
            </div>
          </div>

          <div className="u-panel p-6">
            <div className="font-mono text-[11px] tracking-wider mb-3 text-[var(--brand-500)]">
              符号剥离后的分析挑战
            </div>
            <ul className="space-y-2 text-[13px] text-[var(--text-muted)]">
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-[var(--text-soft)]">—</span>
                <span>无法直接看到函数名，需要通过函数序言 / 尾声模式识别函数边界</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-[var(--text-soft)]">—</span>
                <span>动态链接的库函数仍可通过 PLT/GOT 识别，但内部函数完全匿名</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-[var(--text-soft)]">—</span>
                <span>分析工具（如 Ghidra）会自动生成 FUN_00401132 这样的占位名</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-[var(--text-soft)]">—</span>
                <span>需要结合字符串引用、交叉引用、系统调用等线索推断函数功能</span>
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* 进阶：交叉引用与语义恢复 */}
      {mode === 'advanced' && (
        <section className="space-y-5">
          <div className="flex items-baseline gap-3">
            <span className="u-section-num">2.4</span>
            <h3 className="text-lg md:text-xl font-semibold tracking-tight">交叉引用与语义恢复</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="bg-[var(--bg-card)] p-6">
              <div className="font-mono text-[11px] tracking-wider mb-3 text-[var(--accent-cyan)]">
                交叉引用（XREF）
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">
                交叉引用记录了<span className="text-[var(--text)]">谁引用了谁</span>的关系，
                包括函数调用引用、数据引用、字符串引用等。
              </p>
              <div className="bg-[var(--bg-soft)] rounded-md p-3 border border-[var(--border)]">
                <div className="font-mono text-[11px] text-accent-cyan mb-2">XREF 示例</div>
                <code className="font-mono text-[12px] text-[var(--text)] whitespace-pre-line">
{`strcpy@plt
  XREF[1]:  vulnerable:40114c(call)`}
                </code>
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-3">
                通过追踪危险函数的 XREF，可以快速找到所有调用了 strcpy、system 等危险函数的位置，
                是漏洞挖掘的高效手段。
              </p>
            </div>

            <div className="bg-[var(--bg-card)] p-6">
              <div className="font-mono text-[11px] tracking-wider mb-3 text-[var(--accent-orange)]">
                语义恢复的重要性
              </div>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">
                语义恢复（Semantic Recovery）是指从低级汇编代码中
                <span className="text-[var(--text)]">还原出高级语义</span>的过程。
              </p>
              <ul className="space-y-2 text-[13px] text-[var(--text-muted)]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span>识别变量、类型、数据结构</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span>还原控制流结构（if / for / while）</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span>推断函数参数和返回值含义</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span>对漏洞检测至关重要：只有理解了语义，才能判断一段代码是否存在漏洞</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 底部导航 */}
      <section className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3">
        <Link href="/learn/step1" className="u-btn u-btn-ghost">
          <span className="font-mono" aria-hidden="true">←</span>
          上一步 · 解包与识别
        </Link>
        <Link href="/learn/step3" className="u-btn u-btn-primary">
          下一步 · 路径探索
          <span className="font-mono" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
