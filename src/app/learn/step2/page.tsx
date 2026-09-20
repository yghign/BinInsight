'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, ArrowLeft, AlertTriangle, Check, X, Zap, Target, Eye, EyeOff, GitBranch } from 'lucide-react';
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

const disassemblyStripped = `0000000000401132 <.text>:
  401132:       55                      push   %rbp
  401133:       48 89 e5                mov    %rsp,%rbp
  401136:       48 83 ec 50             sub    $0x50,%rsp
  40113a:       48 89 7d b8             mov    %rdi,-0x48(%rbp)
  40113e:       48 8b 55 b8             mov    -0x48(%rbp),%rdx
  401142:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401146:       48 89 d6                mov    %rdx,%rsi
  401149:       48 89 c7                mov    %rax,%rdi
  40114c:       e8 df fe ff ff          call   401030
  401151:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401155:       48 89 c6                mov    %rax,%rsi
  401158:       48 8d 3d a5 0e 00 00    lea    0xea5(%rip),%rdi
  40115f:       b8 00 00 00 00          mov    $0x0,%eax
  401164:       e8 c7 fe ff ff          call   401030
  401169:       90                      nop
  40116a:       c9                      leave
  40116b:       c3                      ret
  40116c:       55                      push   %rbp
  40116d:       48 89 e5                mov    %rsp,%rbp
  401170:       48 83 ec 50             sub    $0x50,%rsp
  401174:       48 89 7d b8             mov    %rdi,-0x48(%rbp)
  401178:       48 8b 4d b8             mov    -0x48(%rbp),%rcx
  40117c:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401180:       ba 3f 00 00 00          mov    $0x3f,%edx
  401185:       48 89 ce                mov    %rcx,%rsi
  401188:       48 89 c7                mov    %rax,%rdi
  40118b:       e8 d0 fe ff ff          call   401060
  401190:       c6 45 ff 00             movb   $0x0,-0x1(%rbp)
  401194:       48 8d 45 c0             lea    -0x40(%rbp),%rax
  401198:       48 89 c6                mov    %rax,%rsi
  40119b:       48 8d 3d 62 0e 00 00    lea    0xe62(%rip),%rdi
  4011a2:       b8 00 00 00 00          mov    $0x0,%eax
  4011a7:       e8 84 fe ff ff          call   401030
  4011ac:       90                      nop
  4011ad:       c9                      leave
  4011ae:       c3                      ret`;

// Dangerous function call lines (1-indexed) in the disassembly with symbols
// line 11: strcpy@plt (dangerous)
// line 17: printf@plt (potentially dangerous with format string, but here format is fixed)
// line 30: strncpy@plt (safe - bounded)
// line 36: printf@plt (same as above)
const dangerousCallLines = [11]; // strcpy is the truly dangerous one in this context

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
      // Unmark if already marked
      delete newMarked[lineNum];
    } else {
      newMarked[lineNum] = isDangerous ? 'correct' : 'wrong';
    }

    setMarkedLines(newMarked);

    // Give feedback
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

  // Build the custom disassembly display with clickable lines
  const disassemblyLines = disassemblyWithSymbols.split('\n');

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Search size={24} className="text-brand-400" />
            </div>
            <div>
              <div className="text-xs font-mono text-brand-400 uppercase tracking-wider">Step 2</div>
              <h2 className="text-2xl font-bold">静态分析</h2>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="text-gray-400 leading-relaxed">
          静态分析是在不运行程序的情况下分析二进制代码的技术。
          通过反汇编和反编译，我们可以阅读程序逻辑，识别危险函数和潜在漏洞。
          {mode === 'advanced' && (
            <> 进阶模式下，你将了解符号表剥离、交叉引用等更深入的概念。</>
          )}
        </p>
      </section>

      {/* Section 1: What is disassembly */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-brand-400" />
          <h3 className="text-xl font-bold">反汇编与反编译基础</h3>
        </div>
        <div className="pl-7 space-y-3 text-gray-400 leading-relaxed">
          <p>
            <strong className="text-gray-200">反汇编（Disassembly）</strong>：将机器码翻译成汇编指令的过程。
            你会看到 <code className="inline">mov</code>、<code className="inline">push</code>、
            <code className="inline">call</code> 等汇编助记符。
          </p>
          <p>
            <strong className="text-gray-200">反编译（Decompilation）</strong>：比反汇编更进一步，
            尝试将汇编代码还原成类 C 的高级语言代码（如 Ghidra 的 Decompiler、IDA 的 Hex-Rays）。
          </p>
          {mode === 'beginner' && (
            <p>
              <strong className="text-gray-200">函数识别</strong>：函数通常有固定的
              <span className="text-brand-300"> 序言（Prologue）</span>和
              <span className="text-brand-300"> 尾声（Epilogue）</span>模式，
              分析工具通过这些模式来识别函数边界。
            </p>
          )}
        </div>

        {/* Code comparison: C source vs Assembly */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-bg-soft flex items-center justify-between">
              <span className="text-sm font-medium">C 源代码</span>
              <span className="text-xs text-gray-500">vuln.c</span>
            </div>
            <CodeBlock code={vulnerableCSource} language="c" showLineNumbers={true} />
          </div>
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-bg-soft flex items-center justify-between">
              <span className="text-sm font-medium">反汇编（x86-64）</span>
              <span className="text-xs text-gray-500">objdump -d</span>
            </div>
            <CodeBlock code={disassemblyWithSymbols} language="asm" showLineNumbers={true} />
          </div>
        </div>
      </section>

      {/* Section 2: Dangerous Functions + Interactive */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-accent-red" />
          <h3 className="text-xl font-bold">危险函数识别 · 交互练习</h3>
        </div>
        <p className="text-gray-400 leading-relaxed pl-7">
          某些 C 标准库函数因为缺乏边界检查，是漏洞的常见来源。
          下面是一段反汇编代码，请<span className="text-accent-red">点击函数调用行</span>来标注你认为危险的函数。
        </p>

        {/* Dangerous function list */}
        <div className="bg-bg-card border border-accent-red/30 rounded-xl p-4 mt-2">
          <div className="text-sm font-semibold text-accent-red mb-3">常见危险函数速查表</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dangerousFunctions.map((func) => (
              <div key={func.name} className="flex items-start gap-2 text-sm">
                <code className="inline text-accent-orange flex-shrink-0">{func.name}</code>
                <span className="text-gray-400">{func.reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Disassembly */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-border bg-bg-soft">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent-orange" />
              <span className="text-sm font-medium">交互练习 · 找出危险函数调用</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoMark}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-600/20 border border-brand-500/40 text-brand-300 hover:bg-brand-600/30 transition-colors"
              >
                标注危险函数
              </button>
              <button
                onClick={handleReset}
                className="text-xs px-3 py-1.5 rounded-lg bg-bg-hover border border-border text-gray-400 hover:text-gray-200 transition-colors"
              >
                重置
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-5 py-2.5 border-b border-border bg-bg-soft/50 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Check size={14} className="text-accent-green" />
              <span className="text-gray-400">正确：</span>
              <span className="text-accent-green font-medium">{correctMarks}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <X size={14} className="text-accent-red" />
              <span className="text-gray-400">错误：</span>
              <span className="text-accent-red font-medium">{wrongMarks}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">总数：</span>
              <span className="text-white font-medium">{totalDangerous}</span>
            </div>
          </div>

          {/* Clickable disassembly */}
          <div className="overflow-x-auto">
            <div className="code-block min-w-full">
              <pre className="line-numbers m-0 p-4 !bg-transparent">
                <code className="language-asm6502">
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
                        <span className="text-gray-300 text-[13px] leading-[1.65] font-mono whitespace-pre">
                          {line || ' '}
                        </span>
                        {isCallLine && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {markStatus === 'correct' ? (
                              <Check size={16} className="text-accent-green" />
                            ) : markStatus === 'wrong' ? (
                              <X size={16} className="text-accent-red" />
                            ) : (
                              <span className="text-xs text-gray-500 bg-bg px-2 py-0.5 rounded">
                                点击标注
                              </span>
                            )}
                          </span>
                        )}
                        {markStatus === 'correct' && (
                          <Check
                            size={16}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-green"
                          />
                        )}
                        {markStatus === 'wrong' && (
                          <X
                            size={16}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-red"
                          />
                        )}
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="px-5 py-3 border-t border-border bg-bg-soft">
              <p
                className={clsx(
                  'text-sm',
                  correctMarks > wrongMarks ? 'text-accent-green' : 'text-accent-orange'
                )}
              >
                {feedback}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Advanced Content: Stripped vs Non-Stripped */}
      {mode === 'advanced' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff size={20} className="text-accent-purple" />
            <h3 className="text-xl font-bold">符号表剥离：Stripped vs Non-Stripped</h3>
          </div>
          <p className="text-gray-400 leading-relaxed pl-7">
            <code className="inline">strip</code> 命令可以移除二进制文件中的符号表和调试信息，
            大幅增加逆向分析的难度。没有函数名，分析者只能通过汇编特征和行为来推断函数功能。
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-bg-soft flex items-center gap-2">
                <Eye size={16} className="text-accent-green" />
                <span className="text-sm font-medium">有符号（Non-Stripped）</span>
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
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-bg-soft flex items-center gap-2">
                <EyeOff size={16} className="text-accent-red" />
                <span className="text-sm font-medium">无符号（Stripped）</span>
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

          <div className="bg-bg-card border border-border rounded-xl p-5 mt-2">
            <div className="text-sm font-bold mb-3 text-accent-purple">符号剥离后的分析挑战</div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-accent-purple">•</span>
                <span>无法直接看到函数名，需要通过函数序言/尾声模式识别函数边界</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple">•</span>
                <span>动态链接的库函数仍可通过 PLT/GOT 识别，但内部函数完全匿名</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple">•</span>
                <span>分析工具（如 Ghidra）会自动生成 FUN_00401132 这样的占位名</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple">•</span>
                <span>需要结合字符串引用、交叉引用、系统调用等线索推断函数功能</span>
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* Advanced Content: XREF & Semantic Recovery */}
      {mode === 'advanced' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch size={20} className="text-accent-cyan" />
            <h3 className="text-xl font-bold">交叉引用与语义恢复</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="text-sm font-bold mb-3 text-accent-cyan flex items-center gap-2">
                <GitBranch size={16} />
                交叉引用（XREF）
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                交叉引用记录了<span className="text-gray-200">谁引用了谁</span>的关系，
                包括函数调用引用、数据引用、字符串引用等。
              </p>
              <div className="bg-bg-soft rounded-lg p-3 border border-border text-sm">
                <div className="text-xs text-accent-cyan font-mono mb-2">XREF 示例：</div>
                <code className="text-gray-300 font-mono text-xs">
                  strcpy@plt
                  <br />
                  &nbsp;&nbsp;XREF[1]:  vulnerable:40114c(call)
                </code>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mt-3">
                通过追踪危险函数的 XREF，可以快速找到所有调用了 strcpy、system 等危险函数的位置，
                是漏洞挖掘的高效手段。
              </p>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="text-sm font-bold mb-3 text-accent-orange flex items-center gap-2">
                <Zap size={16} />
                语义恢复的重要性
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                语义恢复（Semantic Recovery）是指从低级汇编代码中
                <span className="text-gray-200">还原出高级语义</span>的过程。
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>识别变量、类型、数据结构</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>还原控制流结构（if/for/while）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>推断函数参数和返回值含义</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>对漏洞检测至关重要：只有理解了语义，才能判断一段代码是否存在漏洞</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Buttons */}
      <section className="pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link
            href="/learn/step1"
            className="inline-flex items-center gap-2 px-6 py-3 bg-bg-card hover:bg-bg-hover border border-border text-white font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
            上一步 · 解包与识别
          </Link>
          <Link
            href="/learn/step3"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-600/25"
          >
            下一步 · 路径探索
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
