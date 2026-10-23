'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Play,
  ChevronRight,
  FileCode,
  Cpu,
  TreePine,
  Download,
  Check,
  AlertTriangle,
  Terminal as TerminalIcon,
} from 'lucide-react';

/* ──────────────── 预置数据 ──────────────── */

interface VulnFunc {
  id: string;
  name: string;
  file: string;
  addr: string;
  vulnType: string;
  summary: string;
  originalC: string;
  patchedC: string;
  originalAsm: string;
  patchedAsm: string;
  dangerLineIdx: number[]; // 危险行在 originalC.split('\n') 中的索引
  fixes: { label: string; desc: string }[];
  astDiff: { type: string; old: string; new: string; line: number }[];
  asmMappings: { layer: string; old: string; new: string; note: string }[];
  terminal: { text: string; tone: string }[];
}

const funcs: VulnFunc[] = [
  {
    id: 'process-input',
    name: 'process_input',
    file: 'target.elf',
    addr: '0x401160',
    vulnType: 'CWE-120 · Buffer Copy without Checking Size',
    summary:
      'strcpy() 将用户输入无长度限制地拷贝到 64 字节栈缓冲区，可被攻击者覆盖返回地址。',
    originalC: `void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);    // 危险：无长度检查
    printf("Input: %s\\n", buffer);
}`,
    patchedC: `void process_input(char *input) {
    char buffer[64];
    strncpy(buffer, input, 63);  // 安全：指定最大长度
    buffer[63] = '\\0';           // 确保字符串终止
    printf("Input: %s\\n", buffer);
}`,
    originalAsm: `process_input:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x40
    mov     [rbp-0x38], rdi
    lea     rax, [rbp-0x30]    ; buffer
    mov     rsi, [rbp-0x38]    ; input
    mov     rdi, rax
    call    strcpy@plt
    lea     rax, [rbp-0x30]
    mov     rsi, rax
    lea     rdi, [rel fmt]
    mov     eax, 0
    call    printf@plt
    leave
    ret`,
    patchedAsm: `process_input:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x40
    mov     [rbp-0x38], rdi
    lea     rax, [rbp-0x30]    ; buffer
    mov     rdx, 63             ; 长度参数
    mov     rsi, [rbp-0x38]    ; input
    mov     rdi, rax
    call    strncpy@plt
    mov     byte [rbp-0x01], 0 ; buffer[63] = 0
    lea     rax, [rbp-0x30]
    mov     rsi, rax
    lea     rdi, [rel fmt]
    mov     eax, 0
    call    printf@plt
    leave
    ret`,
    dangerLineIdx: [2], // strcpy 那行索引
    fixes: [
      { label: '替换 strcpy → strncpy', desc: '限定最大拷贝长度为 63' },
      { label: '补充终止符写入', desc: '确保字符串以 \\0 结尾' },
    ],
    astDiff: [
      { type: 'replace_call', old: 'strcpy(buf, input)', new: 'strncpy(buf, input, 63)', line: 3 },
      { type: 'insert_stmt', old: '', new: "buf[63] = '\\0'", line: 3 },
    ],
    asmMappings: [
      { layer: 'C 层', old: 'strcpy()', new: 'strncpy(..., 63)', note: '增加长度参数' },
      { layer: '汇编层', old: 'call strcpy@plt', new: 'mov rdx, 63; call strncpy@plt', note: '新增 mov 指令传参' },
      { layer: '额外指令', old: '(无)', new: 'mov byte [rbp-0x01], 0', note: '对应 buffer[63] = \\0' },
    ],
    terminal: [
      { text: '[1/4] Ghidra 提升完成 · process_input.c', tone: 'soft' },
      { text: '[2/4] AST Diff: 2 changes detected', tone: 'brand' },
      { text: '      replace_call strcpy → strncpy', tone: 'soft' },
      { text: '      insert_stmt buf[63] = \\0', tone: 'soft' },
      { text: '[3/4] 指令映射 +2 insns', tone: 'brand' },
      { text: '      code cave @ 0x401a20 · 24 bytes', tone: 'orange' },
      { text: '[4/4] Trampoline 注入完成', tone: 'green' },
      { text: 'Done: target.elf.patched (verified OK)', tone: 'green' },
    ],
  },
  {
    id: 'parse-cmd',
    name: 'parse_cmd',
    file: 'target.elf',
    addr: '0x401280',
    vulnType: 'CWE-242 · Use of Function with Inherent Risk',
    summary: 'gets() 完全不检查输入长度，直接写入栈上 128 字节 cmd 缓冲区，属于教科书级危险调用。',
    originalC: `int parse_cmd() {
    char cmd[128];
    gets(cmd);                  // 危险：无长度限制
    if (strncmp(cmd, "SYSTEM", 6) == 0) {
        return 1;
    }
    return 0;
}`,
    patchedC: `int parse_cmd() {
    char cmd[128];
    if (fgets(cmd, sizeof(cmd), stdin) == NULL) return -1;
    cmd[strcspn(cmd, "\\n")] = 0;  // 去掉换行符
    if (strncmp(cmd, "SYSTEM", 6) == 0) {
        return 1;
    }
    return 0;
}`,
    originalAsm: `parse_cmd:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x80
    lea     rdi, [rbp-0x80]    ; cmd
    call    gets@plt           ; 危险调用
    lea     rdi, [rbp-0x80]
    mov     esi, 6
    lea     rdx, [rel s_SYSTEM]
    call    strncmp@plt
    test    eax, eax
    setz    al
    movzx   eax, al
    leave
    ret`,
    patchedAsm: `parse_cmd:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x80
    lea     rax, [rbp-0x80]    ; cmd
    mov     edx, 128            ; sizeof(cmd)
    mov     esi, stdin
    mov     rdi, rax
    call    fgets@plt           ; 安全读取
    test    rax, rax
    jz      .Lret_neg
    lea     rdi, [rbp-0x80]
    mov     esi, 6
    lea     rdx, [rel s_SYSTEM]
    call    strncmp@plt
    test    eax, eax
    setz    al
    movzx   eax, al
    leave
    ret`,
    dangerLineIdx: [1],
    fixes: [
      { label: '替换 gets → fgets', desc: '指定最大读取长度为 sizeof(cmd)' },
      { label: '去掉换行符', desc: 'strcspn 清洗 fgets 带入的 \\n' },
      { label: '处理 NULL 返回', desc: 'EOF 或错误时返回 -1' },
    ],
    astDiff: [
      { type: 'replace_call', old: 'gets(cmd)', new: 'fgets(cmd, sizeof(cmd), stdin)', line: 2 },
      { type: 'insert_stmt', old: '', new: 'cmd[strcspn(cmd, "\\n")] = 0', line: 2 },
      { type: 'insert_branch', old: '', new: 'if (fgets(...) == NULL) return -1', line: 2 },
    ],
    asmMappings: [
      { layer: 'C 层', old: 'gets(cmd)', new: 'fgets(cmd, 128, stdin)', note: '三个参数替代一个' },
      { layer: '汇编层', old: 'call gets@plt (1 arg)', new: 'mov edx, 128; mov esi, stdin; call fgets@plt (3 args)', note: '新增两次 mov 传参' },
      { layer: '控制流', old: '(无 NULL 处理)', new: 'test rax, rax; jz .Lret_neg', note: '新增 EOF 跳转' },
    ],
    terminal: [
      { text: '[1/4] Ghidra 提升完成 · parse_cmd.c', tone: 'soft' },
      { text: '[2/4] AST Diff: 3 changes detected', tone: 'brand' },
      { text: '      replace_call gets → fgets', tone: 'soft' },
      { text: '      insert_stmt cmd[strcspn] = 0', tone: 'soft' },
      { text: '      insert_branch NULL check', tone: 'soft' },
      { text: '[3/4] 指令映射 +6 insns', tone: 'brand' },
      { text: '      (原位置 14 字节 → 新指令 26 字节 · 需要 cave)', tone: 'orange' },
      { text: '[4/4] Trampoline + code cave @ 0x401c00', tone: 'green' },
      { text: 'Done: target.elf.patched (verified OK)', tone: 'green' },
    ],
  },
];

/* ──────────────── Diff 计算 & 视图 ──────────────── */

interface DiffLine {
  text: string;
  type: 'normal' | 'added' | 'removed';
}

function computeStrDiff(orig: string, patch: string): { left: DiffLine[]; right: DiffLine[] } {
  const o = orig.split('\n');
  const p = patch.split('\n');
  const max = Math.max(o.length, p.length);
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  for (let i = 0; i < max; i++) {
    const a = o[i] ?? '';
    const b = p[i] ?? '';
    if (a === b) {
      left.push({ text: a, type: 'normal' });
      right.push({ text: b, type: 'normal' });
    } else if (a && !b) {
      left.push({ text: a, type: 'removed' });
      right.push({ text: '', type: 'normal' });
    } else if (!a && b) {
      left.push({ text: '', type: 'normal' });
      right.push({ text: b, type: 'added' });
    } else {
      left.push({ text: a, type: 'removed' });
      right.push({ text: b, type: 'added' });
    }
  }
  return { left, right };
}

function DiffView({
  origText,
  patchText,
  origTitle,
  patchTitle,
}: {
  origText: string;
  patchText: string;
  origTitle: string;
  patchTitle: string;
}) {
  const diff = useMemo(() => computeStrDiff(origText, patchText), [origText, patchText]);
  return (
    <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
      <div className="grid grid-cols-2 gap-0">
        <div className="border-r border-[var(--border)]">
          <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] tracking-wider text-accent-red">
            {origTitle}
          </div>
          <pre className="p-3 text-[11px] leading-[1.7] font-mono overflow-x-auto max-h-[360px]">
            {diff.left.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  '-mx-3 px-3',
                  line.type === 'removed'
                    ? 'bg-[rgba(235,94,84,0.14)] text-accent-red'
                    : 'text-[var(--text-muted)]'
                )}
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
          <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] tracking-wider text-accent-green">
            {patchTitle}
          </div>
          <pre className="p-3 text-[11px] leading-[1.7] font-mono overflow-x-auto max-h-[360px]">
            {diff.right.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  '-mx-3 px-3',
                  line.type === 'added'
                    ? 'bg-[rgba(58,180,142,0.14)] text-accent-green'
                    : 'text-[var(--text-muted)]'
                )}
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
    </div>
  );
}

/* ──────────────── 步骤定义 ──────────────── */

const STEPS = [
  { id: 1, label: '选择函数', icon: FileCode },
  { id: 2, label: '提升 C 代码', icon: TreePine },
  { id: 3, label: '应用修复', icon: Check },
  { id: 4, label: 'AST Diff', icon: TreePine },
  { id: 5, label: '指令映射', icon: Cpu },
  { id: 6, label: '生成补丁', icon: Download },
];

/* ──────────────── DilipaWorkbench ──────────────── */

export default function DilipaWorkbench() {
  const [funcIdx, setFuncIdx] = useState(0);
  const [step, setStep] = useState(1);
  const [applyFixes, setApplyFixes] = useState<boolean[]>([]);
  const [asmTab, setAsmTab] = useState<'orig' | 'diff'>('diff');
  const func = funcs[funcIdx];
  const selectedAll = applyFixes.length === func.fixes.length;

  /* 切换函数时重置状态 */
  const pickFunc = (idx: number) => {
    setFuncIdx(idx);
    setStep(2);
    setApplyFixes(new Array(funcs[idx].fixes.length).fill(false));
    setAsmTab('diff');
  };

  const reset = () => {
    setStep(1);
    setApplyFixes(new Array(func.fixes.length).fill(false));
    setAsmTab('diff');
  };

  const canGoNext = () => {
    if (step === 3) return selectedAll;
    return true;
  };

  const applyAllFixes = () => setApplyFixes(new Array(func.fixes.length).fill(true));
  const toggleFix = (i: number) => {
    setApplyFixes((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const origLines = func.originalC.split('\n');
  const patched = selectedAll; // 全部修复选完才算应用
  const isLastStep = step === STEPS[STEPS.length - 1].id;

  return (
    <div className="u-panel overflow-hidden">
      {/* ── 顶栏：步骤进度条 ── */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] tracking-wider text-[var(--brand-500)]">
              DILIPA · WORKBENCH
            </span>
            <span className="font-mono text-[10.5px] text-[var(--text-soft)]">
              target.elf · {func.addr}
            </span>
          </div>
          <button onClick={reset} className="u-btn u-btn-ghost !py-1.5 !px-3 text-[11.5px]">
            <RefreshCw size={12} />
            重置
          </button>
        </div>

        {/* 步骤指示条 */}
        <div className="px-4 pb-4 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && (
                  <span
                    className={clsx(
                      'w-6 h-px',
                      done ? 'bg-[var(--brand-500)]' : 'bg-[var(--border)]'
                    )}
                  />
                )}
                <button
                  onClick={() => step >= s.id && setStep(s.id)}
                  disabled={step < s.id}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors',
                    active && 'bg-brand-500/15 text-[var(--brand-500)] border border-brand-500/40',
                    done && !active && 'text-[var(--brand-500)]',
                    !active && !done && 'text-[var(--text-soft)] hover:text-[var(--text-muted)]'
                  )}
                >
                  {done ? (
                    <Check size={10} />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current text-[10px] flex items-center justify-center">
                      {s.id}
                    </span>
                  )}
                  {s.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 主体三栏 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] min-h-[520px]">
        {/* 左栏：函数列表 */}
        <aside className="border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--bg-soft)]">
          <div className="p-3">
            <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
              导入分析中 · target.elf
            </p>
            <div className="space-y-0.5">
              {funcs.map((f, i) => {
                const active = funcIdx === i;
                return (
                  <button
                    key={f.id}
                    onClick={() => pickFunc(i)}
                    className={clsx(
                      'w-full text-left px-2.5 py-2 rounded-[4px] transition-colors border',
                      active
                        ? 'bg-brand-500/10 border-brand-500/40'
                        : 'border-transparent hover:bg-[var(--bg-hover)]'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[var(--text-soft)]">
                        {f.addr}
                      </span>
                    </div>
                    <div
                      className={clsx(
                        'font-mono text-[12.5px] mt-0.5 truncate',
                        active ? 'text-[var(--brand-500)]' : 'text-[var(--text)]'
                      )}
                    >
                      {f.name}()
                    </div>
                    <div className="text-[10.5px] text-accent-red mt-0.5 truncate">
                      {f.vulnType.split('·')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 文件元信息 */}
          <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
            <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
              文件信息
            </p>
            <dl className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">架构</dt>
                <dd className="text-[var(--text-muted)]">x86-64</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">格式</dt>
                <dd className="text-[var(--text-muted)]">ELF64</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">PIE</dt>
                <dd className="text-[var(--text-muted)]">Yes</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">NX</dt>
                <dd className="text-accent-green">Enabled</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">RELRO</dt>
                <dd className="text-accent-orange">Partial</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* 中栏：按步骤切换 */}
        <main className="p-5 md:p-6 min-w-0">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">选择要修补的函数</h3>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                Dilipa 已通过 Ghidra Headless 完成反编译，识别出以下包含危险调用的函数。
                在左侧列表中点击选择一个开始。
              </p>
              <div className="border-t border-[var(--border)]">
                {funcs.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => pickFunc(i)}
                    className="w-full grid md:grid-cols-[64px_1fr_200px] gap-4 py-5 border-b border-[var(--border)] text-left hover:bg-[var(--bg-hover)] transition-colors items-start md:items-center"
                  >
                    <span className="u-flow-tick" aria-hidden="true" />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-[14px] font-semibold text-[var(--text)]">
                          {f.name}()
                        </span>
                        <span className="font-mono text-[10.5px] text-[var(--text-soft)]">
                          {f.addr}
                        </span>
                      </div>
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                        {f.summary}
                      </p>
                      <p className="text-[11px] font-mono text-accent-red mt-1.5">
                        {f.vulnType}
                      </p>
                    </div>
                    <div className="text-right">
                      <ChevronRight className="inline w-4 h-4 text-[var(--text-soft)]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2：提升 C 代码 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">提升后的 C 代码（Ghidra Decompile）</h3>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                    变量名已规范化，<span className="text-accent-red font-medium">标记的行</span>
                    是可能的漏洞点。点击危险行查看解释，或直接进入下一步应用修复。
                  </p>
                </div>
              </div>

              <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
                <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-[var(--text-muted)] flex justify-between">
                  <span>{func.name} · Ghidra lifted</span>
                  <span>
                    {func.file} :: {func.addr}
                  </span>
                </div>
                <div className="p-3 text-[12px] leading-[1.75] font-mono">
                  {origLines.map((line, i) => {
                    const danger = func.dangerLineIdx.includes(i);
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'flex gap-3 rounded-[2px] px-2 py-0.5 cursor-default',
                          danger && 'bg-accent-red/10 border-l-2 border-l-accent-red'
                        )}
                      >
                        <span className="w-5 text-right text-[var(--text-soft)] select-none">
                          {i + 1}
                        </span>
                        <span className={danger ? 'text-accent-red' : 'text-[var(--text-muted)]'}>
                          {line}
                        </span>
                        {danger && (
                          <span className="text-[10px] ml-auto self-center font-mono">⚠</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-l-2 border-l-[var(--brand-500)] pl-4 py-3 text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                <strong className="text-[var(--text)]">Ghidra 提升说明：</strong>
                反编译是重建过程，变量可能被规范化、类型推断可能不精确。
                Dilipa 允许用户在这一层直接编辑，系统会把修改精确映射回指令级。
              </div>
            </div>
          )}

          {/* Step 3：应用修复 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">应用修复</h3>
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                  勾选所有修复建议后才能继续。Dilipa 也支持在 C 编辑器里手动改代码，
                  这里提供的是「一键式」的典型修复方案。
                </p>
              </div>

              <div className="grid gap-2">
                {func.fixes.map((fix, i) => {
                  const on = applyFixes[i] ?? false;
                  return (
                    <button
                      key={i}
                      onClick={() => toggleFix(i)}
                      className={clsx(
                        'flex items-start gap-3 p-4 rounded-md border text-left transition-colors',
                        on
                          ? 'border-brand-500/50 bg-brand-500/5'
                          : 'border-[var(--border)] hover:bg-[var(--bg-hover)]'
                      )}
                    >
                      <span
                        className={clsx(
                          'w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
                          on && 'border-[var(--brand-500)] bg-[var(--brand-500)]'
                        )}
                      >
                        {on && <Check size={9} className="text-[var(--bg-card)]" />}
                      </span>
                      <div>
                        <div
                          className={clsx(
                            'font-mono text-[12.5px] mb-0.5',
                            on ? 'text-[var(--brand-500)]' : 'text-[var(--text)]'
                          )}
                        >
                          {fix.label}
                        </div>
                        <div className="text-[12px] text-[var(--text-muted)]">{fix.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!selectedAll && (
                <button onClick={applyAllFixes} className="u-btn u-btn-ghost !py-1.5 !px-3 text-[11.5px]">
                  全部选中
                </button>
              )}

              {/* 预览 C diff */}
              {selectedAll && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[11px] tracking-wider text-brand-400">
                      PREVIEW · C 层 diff
                    </span>
                  </div>
                  <DiffView
                    origText={func.originalC}
                    patchText={func.patchedC}
                    origTitle="原始代码"
                    patchTitle="补丁后代码"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4：AST Diff */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">AST Diff · 结构化修改集</h3>
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                  Dilipa 对比修改前后 C 代码的抽象语法树，提取最小修改集。
                  下面是 JSON 形式的中间结果，也是指令映射的输入。
                </p>
              </div>

              <DiffView
                origText={func.originalC}
                patchText={func.patchedC}
                origTitle="原始 C"
                patchTitle="修改后 C"
              />

              <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
                <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-[var(--brand-500)]">
                  ast-diff.json
                </div>
                <pre className="p-3 text-[11.5px] leading-[1.75] font-mono overflow-x-auto max-h-[220px] text-[var(--text-muted)]">
{`{
  "function": "${func.name}",
  "changes": [`}
{func.astDiff.map((c, i) => (
  <div key={i}>
{`    {`}
    <span className="text-accent-orange">
{`"type": "${c.type}",`}
    </span>
    {"\n"}
    {c.old && (
      <span className="text-accent-red">{`    "old": "${c.old}",`}</span>
    )}
    {"\n"}
    <span className="text-accent-green">
{`    "new": "${c.new}",`}
    </span>
    {"\n"}
    <span className="text-[var(--text-soft)]">
{`    "line": ${c.line}`}
    </span>
    {"\n"}
{`    },`}
  </div>
))}
{`  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Step 5：指令映射 */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">指令级映射</h3>
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                  AST Diff 每条修改映射到具体的汇编指令变化。
                </p>
              </div>

              {/* Tab 切换 */}
              <div className="flex items-center gap-1 border border-[var(--border)] rounded-md p-0.5 w-max">
                {[
                  { id: 'orig', label: '原始汇编' },
                  { id: 'diff', label: '补丁后 (diff)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAsmTab(t.id as 'orig' | 'diff')}
                    className={clsx(
                      'px-3 py-1 rounded-[4px] font-mono text-[11px] transition-colors',
                      asmTab === t.id
                        ? 'bg-[var(--bg-code-header)] text-[var(--brand-500)] border border-[var(--border)]'
                        : 'text-[var(--text-soft)] hover:text-[var(--text-muted)]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {asmTab === 'orig' ? (
                <div className="rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-code)]">
                  <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-accent-red">
                    原始汇编 · 未修复
                  </div>
                  <pre className="p-3 text-[11.5px] leading-[1.7] font-mono text-[var(--text-muted)] overflow-x-auto max-h-[360px]">
                    {func.originalAsm}
                  </pre>
                </div>
              ) : (
                <DiffView
                  origText={func.originalAsm}
                  patchText={func.patchedAsm}
                  origTitle="原始汇编"
                  patchTitle="补丁后汇编"
                />
              )}

              {/* 映射关系说明表 */}
              <div className="rounded-md overflow-hidden border border-[var(--border)]">
                <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-[var(--text-soft)]">
                  映射关系 · 每条修改对应哪条指令
                </div>
                <table className="w-full text-[11.5px] font-mono">
                  <thead className="text-[var(--text-soft)] bg-[var(--bg-soft)]">
                    <tr>
                      <th className="text-left px-3 py-2 w-16">层级</th>
                      <th className="text-left px-3 py-2 w-[40%]">修改前</th>
                      <th className="text-left px-3 py-2 w-[40%]">修改后</th>
                      <th className="text-left px-3 py-2">说明</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-muted)]">
                    {func.asmMappings.map((m, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 text-brand-400">{m.layer}</td>
                        <td className="px-3 py-2 text-accent-red">{m.old}</td>
                        <td className="px-3 py-2 text-accent-green">{m.new}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{m.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 6：生成补丁 */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">生成补丁 · Trampoline 注入</h3>
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                  Dilipa 在原位置空间不足时，会在代码洞（code cave）写入补丁逻辑，
                  通过跳转 trampoline 衔接执行流。补丁会经过三重校验后输出。
                </p>
              </div>

              <div className="rounded-md overflow-hidden border border-[var(--border)] bg-black/80">
                <div className="px-3 py-2 bg-[var(--bg-code-header)] border-b border-[var(--border)] font-mono text-[10.5px] text-[var(--text-soft)] flex items-center gap-1.5">
                  <TerminalIcon size={11} />
                  <span>dilipa patch {func.file} --func {func.name}</span>
                </div>
                <pre className="p-4 text-[11.5px] leading-[1.9] font-mono overflow-x-auto max-h-[240px]">
                  {func.terminal.map((t, i) => (
                    <div
                      key={i}
                      className={clsx(
                        t.tone === 'green' && 'text-accent-green',
                        t.tone === 'red' && 'text-accent-red',
                        t.tone === 'orange' && 'text-accent-orange',
                        t.tone === 'brand' && 'text-brand-400',
                        t.tone === 'soft' && 'text-[var(--text-soft)]',
                        !t.tone && 'text-[var(--text-muted)]'
                      )}
                    >
                      {t.text}
                    </div>
                  ))}
                </pre>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: '校验和对比', val: 'OK', tone: 'green' },
                  { label: '反汇编验证', val: 'OK', tone: 'green' },
                  { label: '功能测试', val: 'OK', tone: 'green' },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="border border-[var(--border)] rounded-md p-3 flex items-center justify-between"
                  >
                    <span className="text-[12px] text-[var(--text-muted)]">{c.label}</span>
                    <span
                      className={clsx(
                        'font-mono text-[12px]',
                        c.tone === 'green' && 'text-accent-green'
                      )}
                    >
                      ✓ {c.val}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="#download-demo"
                  className="u-btn u-btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('演示环境不支持真实二进制写入。本地 Dilipa 运行后将输出 target.elf.patched');
                  }}
                >
                  <Download size={13} />
                  下载 patched
                </a>
                <button onClick={reset} className="u-btn u-btn-ghost">
                  <RefreshCw size={12} />
                  换一个函数再走一遍
                </button>
              </div>
            </div>
          )}
        </main>

        {/* 右栏：状态 / 快速参考 */}
        <aside className="border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--bg-soft)]">
          <div className="p-4 space-y-5">
            {/* 当前函数摘要 */}
            <div>
              <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                当前漏洞
              </p>
              <div className="border border-accent-red/30 bg-accent-red/5 rounded-md p-3">
                <div className="flex items-start gap-1.5 mb-1.5">
                  <AlertTriangle size={12} className="text-accent-red mt-0.5 flex-shrink-0" />
                  <p className="text-[12.5px] text-accent-red leading-relaxed">{func.vulnType}</p>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                  {func.summary}
                </p>
              </div>
            </div>

            {/* 步骤进度 */}
            <div>
              <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                步骤进度
              </p>
              <div className="space-y-1">
                {STEPS.map((s) => {
                  const done = step > s.id;
                  const active = step === s.id;
                  return (
                    <div
                      key={s.id}
                      className={clsx(
                        'flex items-center gap-2 font-mono text-[11.5px]',
                        active && 'text-[var(--brand-500)]',
                        done && 'text-accent-green',
                        !active && !done && 'text-[var(--text-soft)]'
                      )}
                    >
                      {done ? <Check size={11} /> : <span className="w-2.5 h-2.5 rounded-full border border-current inline-block" />}
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 快速参考 — 按步骤显示 */}
            {step === 2 && (
              <div>
                <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                  新手提示
                </p>
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed space-y-1.5">
                  <p>红标行 = 可能的危险调用。</p>
                  <p>常见危险函数：</p>
                  <p className="font-mono text-[11px] text-accent-red pl-2">
                    gets / strcpy / strcat / sprintf / scanf %s
                  </p>
                  <p>遇到它们要查：长度参数在哪？谁控制输入？</p>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                  新手提示
                </p>
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed space-y-1.5">
                  <p>勾选后 Dilipa 会自动把这些修改写入提升后的 C。</p>
                  <p>实战中常见模式：</p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] pl-2">
                    strcpy → strncpy + \\0
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] pl-2">
                    gets → fgets + strcspn
                  </p>
                </div>
              </div>
            )}
            {step === 4 && (
              <div>
                <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                  新手提示
                </p>
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed space-y-1.5">
                  <p>AST Diff 的三种常见类型：</p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] pl-2">
                    replace_call — 换一个函数
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] pl-2">
                    insert_stmt — 插入一条保护
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] pl-2">
                    insert_branch — 加条件判断
                  </p>
                </div>
              </div>
            )}
            {step === 5 && (
              <div>
                <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                  新手提示
                </p>
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed space-y-1.5">
                  <p>指令映射规则：</p>
                  <p>· 加了参数 → 会多出 mov 指令</p>
                  <p>· 换了 call 目标 → call 地址变了</p>
                  <p>· 插入新指令 → 可能需要 code cave</p>
                </div>
              </div>
            )}
            {step === 6 && (
              <div>
                <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2">
                  修补流程
                </p>
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed space-y-1.5">
                  <p>① 原位置不够 → 找 code cave</p>
                  <p>② 新指令写进 cave</p>
                  <p>③ 原函数入口写 JMP cave</p>
                  <p>④ cave 执行完 JMP 回原位置</p>
                  <p>⑤ 三重校验：checksum / 反汇编 / 功能</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── 底部：步骤导航 + 终端预览 ── */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="u-btn u-btn-ghost !py-1.5 !px-3 text-[11.5px]"
              >
                <ArrowLeft size={12} />
                上一步
              </button>
            )}
          </div>
          <p className="font-mono text-[11px] text-[var(--text-soft)]">
            Step {step}/{STEPS.length} · <span className="text-[var(--brand-500)]">{STEPS[step - 1].label}</span>
          </p>
          <div className="flex items-center gap-2">
            {!isLastStep && step >= 1 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="u-btn u-btn-primary !py-1.5 !px-3 text-[11.5px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一步
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
