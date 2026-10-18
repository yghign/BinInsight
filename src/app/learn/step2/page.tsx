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

const dangerousCallLines = [11]; // strcpy 是这段上下文中真正危险的调用

const dangerousFunctions = [
  { name: 'strcpy', reason: '无长度检查的字符串拷贝，最经典的栈溢出源头' },
  { name: 'gets', reason: '读取一行输入但无法限制长度，已被 C11 标准废弃' },
  { name: 'sprintf', reason: '格式化输出到缓冲区但无长度限制' },
  { name: 'strcat', reason: '字符串拼接无长度检查' },
  { name: 'system', reason: '执行系统命令，若参数可控可导致命令注入' },
];

type MarkStatus = 'correct' | 'wrong' | 'none';

export default function Step2Page() {
  const [mode, setMode] = useState<Mode>('beginner');
  const [markedLines, setMarkedLines] = useState<Record<number, MarkStatus>>({});
  const [showAutoMark, setShowAutoMark] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const totalDangerous = dangerousCallLines.length;
  const correctMarks = Object.entries(markedLines).filter(
    ([, status]) => status === 'correct'
  ).length;
  const wrongMarks = Object.entries(markedLines).filter(
    ([, status]) => status === 'wrong'
  ).length;

  const handleLineClick = (lineNum: number) => {
    const isDangerous = dangerousCallLines.includes(lineNum);
    const newMarked = { ...markedLines };

    if (newMarked[lineNum]) {
      delete newMarked[lineNum];
    } else {
      newMarked[lineNum] = isDangerous ? 'correct' : 'wrong';
    }

    setMarkedLines(newMarked);

    if (!newMarked[lineNum]) {
      setFeedback('');
    } else if (isDangerous) {
      setFeedback('正确！这是一个危险函数调用。strcpy 没有边界检查，可能导致缓冲区溢出。');
    } else {
      setFeedback('注意：这不是最危险的函数调用。strncpy 有长度限制，相对安全。再找找看？');
    }
  };

  const handleAutoMark = () => {
    const newMarked: Record<number, MarkStatus> = {};
    dangerousCallLines.forEach((line) => {
      newMarked[line] = 'correct';
    });
    setMarkedLines(newMarked);
    setShowAutoMark(true);
    setFeedback('已自动标注所有危险函数。strcpy 是这段代码中最危险的调用。');
  };

  const handleReset = () => {
    setMarkedLines({});
    setShowAutoMark(false);
    setFeedback('');
  };

  const disassemblyLines = disassemblyWithSymbols.split('\n');

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
          下面是一段反汇编代码，请<span className="text-[var(--accent-red)] font-medium">点击函数调用行</span>
          来标注你认为危险的函数。
        </p>

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

        {/* 交互反汇编面板 */}
        <div className="u-panel overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-soft)]">
            <span className="font-mono text-[11px] tracking-wider text-[var(--text-muted)]">
              交互练习 · 找出危险函数调用
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
              <span className="text-[var(--text-soft)]">正确</span>
              <span className="text-accent-green font-semibold">{correctMarks}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--accent-red)]">✗</span>
              <span className="text-[var(--text-soft)]">错误</span>
              <span className="text-accent-red font-semibold">{wrongMarks}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-soft)]">目标数</span>
              <span className="text-[var(--text-bright)] font-semibold">{totalDangerous}</span>
            </div>
          </div>

          {/* 可点击反汇编 */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <pre className="m-0 p-4 !bg-transparent">
                <code>
                  {disassemblyLines.map((line, i) => {
                    const lineNum = i + 1;
                    const markStatus = markedLines[lineNum];
                    const isCallLine = line.includes('call');

                    return (
                      <div
                        key={lineNum}
                        className={clsx(
                          'relative group transition-colors -mx-4 px-4',
                          isCallLine && 'cursor-pointer hover:bg-white/5',
                          markStatus === 'correct' && 'bg-accent-green/10',
                          markStatus === 'wrong' && 'bg-accent-red/10'
                        )}
                        onClick={() => isCallLine && handleLineClick(lineNum)}
                      >
                        <span className="text-[var(--text)]/90 text-[13px] leading-[1.65] font-mono whitespace-pre">
                          {line || ' '}
                        </span>
                        {isCallLine && !markStatus && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-mono text-[10px] text-[var(--text-soft)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                              点击标注
                            </span>
                          </span>
                        )}
                        {markStatus === 'correct' && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--accent-green)]">
                            ✓
                          </span>
                        )}
                        {markStatus === 'wrong' && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--accent-red)]">
                            ✗
                          </span>
                        )}
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          </div>

          {feedback && (
            <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-soft)]">
              <p
                className={clsx(
                  'text-[13px]',
                  correctMarks > wrongMarks ? 'text-accent-green' : 'text-accent-orange'
                )}
              >
                {feedback}
              </p>
            </div>
          )}
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
