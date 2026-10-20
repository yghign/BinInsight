'use client';

import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

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
    <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
      <div className="border-r border-[var(--border)]">
        <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
          {leftTitle}
        </div>
        <pre className="p-3 text-[11.5px] leading-[1.7] font-mono overflow-x-auto">
          {leftLines.map((line, i) => (
            <div
              key={i}
              className={`-mx-3 px-3 ${
                line.type === 'removed'
                  ? 'bg-[rgba(235,94,84,0.12)] text-accent-red'
                  : line.type === 'added'
                  ? 'bg-[rgba(58,180,142,0.12)] text-accent-green'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <span className="inline-block w-6 text-[var(--text-soft)] text-right mr-3 select-none">
                {i + 1}
              </span>
              {line.text || ' '}
            </div>
          ))}
        </pre>
      </div>
      <div>
        <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
          {rightTitle}
        </div>
        <pre className="p-3 text-[11.5px] leading-[1.7] font-mono overflow-x-auto">
          {rightLines.map((line, i) => (
            <div
              key={i}
              className={`-mx-3 px-3 ${
                line.type === 'added'
                  ? 'bg-[rgba(58,180,142,0.12)] text-accent-green'
                  : line.type === 'removed'
                  ? 'bg-[rgba(235,94,84,0.12)] text-accent-red'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <span className="inline-block w-6 text-[var(--text-soft)] text-right mr-3 select-none">
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
    <div className="u-panel p-5 md:p-7">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <p className="u-eyebrow mb-1.5">Live Demo</p>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">概念演示：strcpy → strncpy</h3>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            先通读下面两层代码，再点击右上角「应用补丁」，逐行对比红绿差异 —— 看一行 C 代码的修改如何在汇编层落地。
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setPatched(true)}
            disabled={patched}
            className="u-btn u-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={13} />
            应用补丁
          </button>
          <button
            onClick={() => setPatched(false)}
            className="u-btn u-btn-ghost"
          >
            <RotateCcw size={13} />
            重置
          </button>
        </div>
      </div>

      {/* C Code Diff */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[11px] tracking-wider text-brand-400">
            LAYER 01 · C 代码层面
          </span>
        </div>
        {!patched ? (
          <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
            <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
              源代码（原始版本 · 未修复）
            </div>
            <pre className="p-3 text-[11.5px] leading-[1.7] font-mono text-[var(--text-muted)] overflow-x-auto">
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
      <div className="flex justify-center py-4">
        <div className="flex flex-col items-center gap-1 text-[var(--text-soft)]">
          <span className="font-mono" aria-hidden="true">↓</span>
          <span className="font-mono text-[10px] tracking-wider">指令级映射 · MAPPING</span>
        </div>
      </div>

      {/* Assembly Diff */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[11px] tracking-wider text-accent-orange">
            LAYER 02 · 汇编指令层面
          </span>
        </div>
        {!patched ? (
          <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
            <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
              原始汇编（未修复）
            </div>
            <pre className="p-3 text-[11.5px] leading-[1.7] font-mono text-[var(--text-muted)] overflow-x-auto">
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
        <div className="mt-7 border border-[var(--border)] border-l-2 border-l-[var(--brand-500)] rounded-md p-5">
          <div className="font-mono text-[11px] tracking-wider mb-3">
            映射关系说明 · MAPPING
          </div>
          <ul className="text-[13px] text-[var(--text-muted)] space-y-2.5 leading-relaxed">
            <li className="grid grid-cols-[64px_1fr] gap-3">
              <span className="font-mono text-brand-400 text-[12px] pt-0.5">C 层</span>
              <span>
                <code className="text-accent-red">strcpy()</code>
                {' → '}
                <code className="text-accent-green">strncpy()</code>
                ，增加长度参数和终止符设置
              </span>
            </li>
            <li className="grid grid-cols-[64px_1fr] gap-3">
              <span className="font-mono text-brand-400 text-[12px] pt-0.5">汇编层</span>
              <span>
                <code className="text-accent-red">call strcpy</code>
                {' → '}
                <code className="text-accent-green">call strncpy</code>
                ，新增 <code className="inline">mov rdx, 63</code> 传长度参数
              </span>
            </li>
            <li className="grid grid-cols-[64px_1fr] gap-3">
              <span className="font-mono text-brand-400 text-[12px] pt-0.5">额外指令</span>
              <span>
                新增 <code className="inline">mov byte [rbp+0x0F], 0</code>
                {' '}对应 C 代码中 buffer[63] = &apos;\0&apos; 的字符串终止保证
              </span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-[var(--border)] font-mono text-[11px] leading-relaxed text-[var(--text-soft)]">
            注：以上为概念演示。实际 Dilipa 工具会通过 AST Diff 精确计算最小修改集，
            并通过二进制重写引擎生成 trampoline 或直接替换指令。
          </div>
        </div>
      )}
    </div>
  );
}
