'use client';

import { useState } from 'react';
import { ArrowRight, Play, RefreshCw } from 'lucide-react';

const originalC = `#include <stdio.h>
#include <string.h>

void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);    // 危险：无长度检查
    printf("Input: %s\\n", buffer);
}

int main() {
    char user_input[256];
    gets(user_input);
    process_input(user_input);
    return 0;
}`;

const patchedC = `#include <stdio.h>
#include <string.h>

void process_input(char *input) {
    char buffer[64];
    strncpy(buffer, input, 63);  // 安全：指定最大长度
    buffer[63] = '\\\\0';           // 确保字符串终止
    printf("Input: %s\\n", buffer);
}

int main() {
    char user_input[256];
    fgets(user_input, 256, stdin);  // 安全读取
    process_input(user_input);
    return 0;
}`;

const originalAsm = `; process_input 函数反汇编
push    rbp
mov     rbp, rsp
sub     rsp, 0x40
mov     [rbp-0x38], rdi
lea     rax, [rbp-0x30]    ; buffer
mov     rsi, [rbp-0x38]    ; input
mov     rdi, rax
call    strcpy             ; 危险调用
lea     rax, [rbp-0x30]
mov     rsi, rax
lea     rdi, [rel format_str]
mov     eax, 0
call    printf
leave
ret`;

const patchedAsm = `; process_input 函数反汇编（修复后）
push    rbp
mov     rbp, rsp
sub     rsp, 0x40
mov     [rbp-0x38], rdi
lea     rax, [rbp-0x30]    ; buffer
mov     rdx, 63             ; 长度参数
mov     rsi, [rbp-0x38]    ; input
mov     rdi, rax
call    strncpy            ; 安全调用
mov     byte [rbp+0x0F], 0 ; buffer[63] = 0
lea     rax, [rbp-0x30]
mov     rsi, rax
lea     rdi, [rel format_str]
mov     eax, 0
call    printf
leave
ret`;

interface DiffLine {
  text: string;
  type: 'normal' | 'added' | 'removed' | 'modified';
}

function computeDiff(original: string, patched: string): { left: DiffLine[]; right: DiffLine[] } {
  const origLines = original.split('\n');
  const patchLines = patched.split('\n');
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  // Simple line-by-line diff
  const maxLen = Math.max(origLines.length, patchLines.length);
  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i] ?? '';
    const patch = patchLines[i] ?? '';

    if (orig === patch) {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: patch, type: 'normal' });
    } else if (orig.trim().startsWith('strcpy') && patch.trim().startsWith('strncpy')) {
      left.push({ text: orig, type: 'removed' });
      right.push({ text: patch, type: 'added' });
    } else if (orig.includes('危险') || orig.includes('gets')) {
      left.push({ text: orig, type: 'removed' });
      right.push({ text: patch, type: 'added' });
    } else if (patch.includes('安全') || patch.includes('fgets') || patch.includes('buffer[63]')) {
      left.push({ text: orig || ' ', type: orig ? 'normal' : 'removed' });
      right.push({ text: patch, type: 'added' });
    } else if (orig && !patch) {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: '', type: 'normal' });
    } else if (!orig && patch) {
      left.push({ text: '', type: 'normal' });
      right.push({ text: patch, type: 'normal' });
    } else {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: patch, type: 'normal' });
    }
  }

  return { left, right };
}

function computeAsmDiff(original: string, patched: string): { left: DiffLine[]; right: DiffLine[] } {
  const origLines = original.split('\n');
  const patchLines = patched.split('\n');
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  const maxLen = Math.max(origLines.length, patchLines.length);
  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i] ?? '';
    const patch = patchLines[i] ?? '';

    if (orig === patch) {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: patch, type: 'normal' });
    } else if (orig.includes('strcpy') && patch.includes('strncpy')) {
      left.push({ text: orig, type: 'removed' });
      right.push({ text: patch, type: 'added' });
    } else if (orig.includes('buffer') && patch.includes('长度参数')) {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: patch, type: 'added' });
      // Insert extra line on right
    } else if (patch.includes('buffer[63]') || patch.includes('byte [rbp+0x0F]')) {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: patch, type: 'added' });
    } else if (orig && !patch) {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: '', type: 'normal' });
    } else if (!orig && patch) {
      left.push({ text: '', type: 'normal' });
      right.push({ text: patch, type: 'normal' });
    } else {
      left.push({ text: orig, type: 'normal' });
      right.push({ text: patch, type: 'normal' });
    }
  }

  return { left, right };
}

function DiffView({
  leftLines,
  rightLines,
  leftTitle,
  rightTitle,
}: {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
  leftTitle: string;
  rightTitle: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-[#21262d] bg-[#0d1117]">
      <div className="border-r border-[#21262d]">
        <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] text-xs text-gray-400 font-medium">
          {leftTitle}
        </div>
        <pre className="p-3 text-[12px] leading-relaxed font-mono overflow-x-auto">
          {leftLines.map((line, i) => (
            <div
              key={i}
              className={`-mx-3 px-3 ${
                line.type === 'removed'
                  ? 'bg-red-500/15 text-red-300'
                  : line.type === 'added'
                  ? 'bg-green-500/15 text-green-300'
                  : 'text-gray-300'
              }`}
            >
              <span className="inline-block w-6 text-gray-600 text-right mr-3 select-none">
                {i + 1}
              </span>
              {line.text || ' '}
            </div>
          ))}
        </pre>
      </div>
      <div>
        <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] text-xs text-gray-400 font-medium">
          {rightTitle}
        </div>
        <pre className="p-3 text-[12px] leading-relaxed font-mono overflow-x-auto">
          {rightLines.map((line, i) => (
            <div
              key={i}
              className={`-mx-3 px-3 ${
                line.type === 'added'
                  ? 'bg-green-500/15 text-green-300'
                  : line.type === 'removed'
                  ? 'bg-red-500/15 text-red-300'
                  : 'text-gray-300'
              }`}
            >
              <span className="inline-block w-6 text-gray-600 text-right mr-3 select-none">
                {i + 1}
              </span>
              {line.text || ' '}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default function DilipaDemo() {
  const [patched, setPatched] = useState(false);

  const cDiff = computeDiff(originalC, patchedC);
  const asmDiff = computeAsmDiff(originalAsm, patchedAsm);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold mb-1">概念演示：strcpy → strncpy</h3>
          <p className="text-gray-400 text-sm">
            观察 C 代码层面的修改如何映射到汇编指令层面的变化
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPatched(true)}
            disabled={patched}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play size={14} />
            应用补丁
          </button>
          <button
            onClick={() => setPatched(false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-hover hover:bg-bg-soft text-gray-300 text-sm font-medium rounded-lg transition-colors border border-border"
          >
            <RefreshCw size={14} />
            重置
          </button>
        </div>
      </div>

      {/* C Code Diff */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="text-sm font-semibold text-brand-300">C 代码层面</span>
        </div>
        {!patched ? (
          <div className="rounded-lg overflow-hidden border border-[#21262d] bg-[#0d1117]">
            <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] text-xs text-gray-400 font-medium">
              提升后的 C 代码（原始版本）
            </div>
            <pre className="p-3 text-[12px] leading-relaxed font-mono text-gray-300 overflow-x-auto">
              {originalC}
            </pre>
          </div>
        ) : (
          <DiffView
            leftLines={cDiff.left}
            rightLines={cDiff.right}
            leftTitle="原始代码"
            rightTitle="补丁后代码"
          />
        )}
      </div>

      {/* Arrow */}
      <div className="flex justify-center my-4">
        <div className="flex flex-col items-center gap-1 text-gray-500">
          <ArrowRight size={20} className="rotate-90" />
          <span className="text-xs">指令级映射</span>
        </div>
      </div>

      {/* Assembly Diff */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent-orange" />
          <span className="text-sm font-semibold text-accent-orange">汇编指令层面</span>
        </div>
        {!patched ? (
          <div className="rounded-lg overflow-hidden border border-[#21262d] bg-[#0d1117]">
            <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] text-xs text-gray-400 font-medium">
              对应的反汇编代码
            </div>
            <pre className="p-3 text-[12px] leading-relaxed font-mono text-gray-300 overflow-x-auto">
              {originalAsm}
            </pre>
          </div>
        ) : (
          <DiffView
            leftLines={asmDiff.left}
            rightLines={asmDiff.right}
            leftTitle="原始汇编"
            rightTitle="补丁后汇编"
          />
        )}
      </div>

      {/* Explanation */}
      {patched && (
        <div className="mt-6 p-4 bg-accent-purple/10 border border-accent-purple/20 rounded-xl">
          <div className="text-sm font-semibold text-accent-purple mb-2">映射关系说明</div>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex gap-2">
              <span className="text-accent-purple">C 层：</span>
              <span>
                <code className="text-red-300 bg-red-500/10 px-1 rounded">strcpy()</code>
                {' → '}
                <code className="text-green-300 bg-green-500/10 px-1 rounded">strncpy()</code>
                ，增加长度参数和终止符设置
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-purple">汇编层：</span>
              <span>
                <code className="text-red-300 bg-red-500/10 px-1 rounded">call strcpy</code>
                {' → '}
                <code className="text-green-300 bg-green-500/10 px-1 rounded">call strncpy</code>
                ，新增 <code className="inline bg-bg-hover px-1 rounded text-xs">mov rdx, 63</code> 传长度参数
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-purple">额外指令：</span>
              <span>
                新增 <code className="inline bg-bg-hover px-1 rounded text-xs">mov byte [rbp+0x0F], 0</code>
                {' '}对应 C 代码中 buffer[63] = '\0' 的字符串终止保证
              </span>
            </li>
          </ul>
          <div className="mt-3 text-xs text-gray-500">
            注：以上为概念演示。实际 Dilipa 工具会通过 AST Diff 精确计算最小修改集，
            并通过二进制重写引擎生成 trampoline 或直接替换指令。
          </div>
        </div>
      )}
    </div>
  );
}
