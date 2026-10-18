'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModeToggle, { type Mode } from '@/components/ModeToggle';
import CodeBlock from '@/components/CodeBlock';
import clsx from 'clsx';

/* ---------- 防护策略数据 ---------- */

interface ProtectionInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  principle: string;
  binaryChange: string;
  canBlock: boolean;
  blockEffect: '完全阻止' | '大幅增加难度' | '部分缓解' | '无法阻止';
  bypassMethod: string;
  code: string;
  color: string;
}

const protections: ProtectionInfo[] = [
  {
    id: 'none',
    name: '无防护',
    shortName: 'None',
    description: '编译时不启用任何安全防护机制',
    principle:
      '程序直接编译为机器码，栈布局直接暴露，返回地址就在缓冲区上方。攻击者只需覆盖返回地址即可劫持控制流。',
    binaryChange: '无特殊变化，栈帧中返回地址紧邻局部变量。',
    canBlock: false,
    blockEffect: '无法阻止',
    bypassMethod: '无需绕过，直接覆盖返回地址即可。',
    code: `// 漏洞代码示例
void vulnerable(char *input) {
    char buf[64];
    strcpy(buf, input);  // 栈溢出
}

// 栈布局 (高地址 → 低地址):
// +------------------+
// |   返回地址       |  ← 被覆盖
// +------------------+
// |   旧 EBP         |
// +------------------+
// |   buf[63..0]     |  ← 从这里往上写
// +------------------+`,
    color: 'text-[var(--text-muted)]',
  },
  {
    id: 'canary',
    name: '栈保护 / Canary',
    shortName: 'Canary',
    description: '在栈帧中放置一个随机值，函数返回前检查它是否被修改',
    principle:
      '在函数入口处，将一个随机生成的「金丝雀值」写入栈帧中返回地址之前。函数返回前，检查这个值是否被改变。如果被改变，说明发生了栈溢出，程序立即终止。',
    binaryChange:
      '函数序言增加：从 TLS 读取 canary 并存入栈帧。函数尾声增加：比较 canary 值，不匹配则调用 __stack_chk_fail。',
    canBlock: true,
    blockEffect: '大幅增加难度',
    bypassMethod:
      '1. 信息泄露：如果程序有格式化字符串漏洞或其他任意读漏洞，可以泄露 canary 值。\n2. 逐字节爆破：fork 服务器中 canary 不变，可逐字节猜测。\n3. 覆盖其他指针：绕过 canary，覆盖虚表指针或函数指针。',
    code: `// 启用 -fstack-protector 后
void vulnerable(char *input) {
    char buf[64];
    __stack_chk_guard = TLS[canary];  // 读取金丝雀值
    strcpy(buf, input);
    if (__stack_chk_guard != TLS[canary]) {
        __stack_chk_fail();          // 检测到溢出，终止程序
    }
}

// 栈布局:
// +------------------+
// |   返回地址       |
// +------------------+
// |   金丝雀值       |  ← 检查这个
// +------------------+
// |   旧 EBP         |
// +------------------+
// |   buf[63..0]     |
// +------------------+`,
    color: 'text-accent-orange',
  },
  {
    id: 'nx',
    name: 'NX / DEP',
    shortName: 'NX',
    description: '数据页不可执行，阻止栈上的 Shellcode 直接执行',
    principle:
      'NX（No eXecute）/ DEP（Data Execution Prevention）将栈、堆等数据区域标记为不可执行。即使攻击者成功覆盖返回地址跳转到栈上的 Shellcode，CPU 也会拒绝执行该内存页的指令。',
    binaryChange:
      'ELF 程序头中设置 GNU_STACK 的 PF_X 标志被清除。加载器将栈和堆页的权限设为 RW-（可读可写不可执行）。',
    canBlock: true,
    blockEffect: '部分缓解',
    bypassMethod:
      '1. Return-to-libc：跳转到 libc 中的 system() 等函数。\n2. ROP（Return-Oriented Programming）：用程序中已有的代码片段（gadget）拼接出攻击链。\n3. 劫持 GOT：如果 GOT 可写，覆盖函数地址。',
    code: `// NX 开启后，栈上的数据无法执行
// 内存页权限:
//   .text 段:  R-X  (可读可执行)
//   .data 段:  RW-  (可读可写)
//   栈/堆:     RW-  (可读可写, 不可执行)

// 传统 Shellcode 攻击失效:
// char shellcode[] = "\\x48\\x31\\xc0...";  // 放在栈上
// (*(void(*)())shellcode)();               // 触发段错误!

// 但 ROP 攻击仍然有效:
// pop_rdi_ret; system; "/bin/sh";  →  调用 system("/bin/sh")`,
    color: 'text-accent-cyan',
  },
  {
    id: 'aslr',
    name: '地址空间随机化 / ASLR',
    shortName: 'ASLR',
    description: '每次运行时随机化程序加载地址，让攻击者无法预知目标地址',
    principle:
      'ASLR（Address Space Layout Randomization）在程序每次加载时，将代码段、数据段、栈、堆、库文件等的基地址随机偏移。攻击者即使知道漏洞存在，也不知道 shellcode 或 ROP gadget 的具体地址。',
    binaryChange:
      '编译时使用 -fPIE/-pie 生成位置无关可执行文件。运行时由内核随机化 mmap 基址、栈基址、堆基址和可执行文件基址。',
    canBlock: true,
    blockEffect: '大幅增加难度',
    bypassMethod:
      '1. 信息泄露：利用格式化字符串或任意读漏洞泄露某个已知函数的地址，计算基址偏移。\n2. 部分覆盖：只覆盖返回地址的低字节，利用已有地址的高位。\n3. NOP sled + 暴力爆破（32 位可行，64 位熵太高）。',
    code: `// 无 ASLR vs 有 ASLR:
//
// 无 ASLR (固定地址):
//   0x08048000  →  程序代码段
//   0xb7e00000  →  libc
//   0xbffff000  →  栈
//
// 有 ASLR (每次不同):
//   0x5643a000  →  程序代码段 (随机)
//   0x7f2b1c000  →  libc (随机)
//   0x7ffd3b800  →  栈 (随机)
//
// 64 位 ASLR 熵约 28 位 → 约 2.6 亿种可能
// 暴力破解在 64 位下几乎不可行`,
    color: 'text-accent-purple',
  },
  {
    id: 'relro',
    name: 'Full RELRO',
    shortName: 'RELRO',
    description: '重定位表只读化，防止 GOT 表被覆盖',
    principle:
      'RELRO（RELocation Read-Only）将 GOT（全局偏移表）等重定位相关的段标记为只读。Full RELRO 模式下，GOT 在启动时完成所有符号解析后就被设为只读，攻击者无法通过覆写 GOT 表来劫持控制流。',
    binaryChange:
      '.got.plt 段合并到 .got 段，启动时完成全部延迟绑定符号解析，随后整个 .got 段被 mprotect 设为只读。',
    canBlock: true,
    blockEffect: '完全阻止',
    bypassMethod:
      'Full RELRO 下无法直接覆写 GOT。需寻找其他攻击面：\n1. 覆写栈上的返回地址（结合 ROP）\n2. 覆写堆上的函数指针、虚表指针\n3. 利用 __malloc_hook / __free_hook（glibc 旧版本）\n4. House of 系列堆风水技巧',
    code: `// Partial RELRO vs Full RELRO:
//
// Partial RELRO (默认):
//   .got.plt (GOT)  →  可读可写  ← 可被覆盖!
//   .got            →  只读
//
// Full RELRO (-Wl,-z,relro,-z,now):
//   .got (合并后)   →  只读      ← 无法覆盖!
//   所有符号启动时解析完成
//
// 典型攻击失效:
//   覆写 puts@GOT → system  →  段错误 (写只读内存)`,
    color: 'text-accent-green',
  },
  {
    id: 'cfi',
    name: '控制流完整性 / CFI',
    shortName: 'CFI',
    description: '确保程序执行始终在合法的控制流图上',
    principle:
      'CFI（Control-Flow Integrity）在编译时为每个间接跳转/调用的目标建立合法地址集合（白名单）。运行时，每次间接控制流转移前都检查目标地址是否在合法集合中。如果不在，程序终止。',
    binaryChange:
      '编译器在每个间接 call/jmp 前插入验证指令。常见实现如 CPI（Clang CFI）、IBT（Intel Indirect Branch Tracking）、PAC（ARM Pointer Authentication）。',
    canBlock: true,
    blockEffect: '完全阻止',
    bypassMethod:
      '1. 数据导向攻击（Data-Oriented Attack）：不改控制流，改数据。\n2. 找到合法但危险的目标（如某个本就调用 system 的函数指针）。\n3. CFI 实现缺陷：粗粒度 CFI 可能有大量合法目标。\n4. 侧信道攻击泄露 CFI 内部状态。',
    code: `// CFI 伪代码示例
// 每个间接调用前插入检查

// 编译时: 为类型 A 的函数指针建立合法目标集合
//   type_A_targets = { &func1, &func2, &func3 }

// 运行时: 间接调用前验证
void indirect_call(void (*fn)(void)) {
    // CFI 检查: fn 是否在 type_A_targets 中?
    if (!is_valid_target(fn, TYPE_A)) {
        __cfi_check_fail();  // 终止程序
    }
    fn();  // 合法目标才执行
}

// 攻击者即使覆盖了函数指针，
// 也只能跳到合法集合内的地址`,
    color: 'text-brand-400',
  },
];

/* ---------- 防护对比交互组件 ---------- */

function effectTone(effect: ProtectionInfo['blockEffect'], canBlock: boolean) {
  if (!canBlock) return 'text-accent-red border-accent-red/40 bg-accent-red/5';
  if (effect === '完全阻止') return 'text-accent-green border-accent-green/40 bg-accent-green/5';
  if (effect === '大幅增加难度') return 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/5';
  return 'text-accent-orange border-accent-orange/40 bg-accent-orange/5';
}

function ProtectionComparison() {
  const [activeId, setActiveId] = useState('none');
  const active = protections.find((p) => p.id === activeId)!;

  return (
    <div className="u-panel p-5 md:p-6">
      {/* 防护标签切换 */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {protections.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={clsx(
              'font-mono text-[12px] px-3 py-1.5 rounded-md border transition-colors',
              activeId === p.id
                ? 'bg-[var(--brand-500)] border-[var(--brand-500)] text-white'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-soft)]'
            )}
          >
            {p.shortName}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左：原理 */}
        <div className="space-y-5">
          <div>
            <h4 className={clsx('text-base md:text-lg font-semibold mb-1.5', active.color)}>
              {active.name}
            </h4>
            <p className="text-[13.5px] text-[var(--text-muted)]">{active.description}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="font-mono text-[11px] tracking-wider text-accent-green mb-1.5">
                工作原理
              </h5>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{active.principle}</p>
            </div>

            <div>
              <h5 className="font-mono text-[11px] tracking-wider text-[var(--accent-cyan)] mb-1.5">
                二进制层面的变化
              </h5>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                {active.binaryChange}
              </p>
            </div>
          </div>

          {/* 防护效果 */}
          <div className={clsx('rounded-md border px-4 py-3', effectTone(active.blockEffect, active.canBlock))}>
            <span className="text-[13px] font-semibold">
              防护效果：{active.blockEffect}
            </span>
          </div>

          {/* 绕过方法 */}
          <div className="border border-[var(--border)] rounded-md p-4">
            <h5 className="font-mono text-[11px] tracking-wider text-accent-red mb-2">
              绕过方法 / BYPASS
            </h5>
            <div className="text-[12.5px] text-[var(--text-muted)] whitespace-pre-line leading-relaxed">
              {active.bypassMethod}
            </div>
          </div>
        </div>

        {/* 右：代码 */}
        <div>
          <h5 className="font-mono text-[11px] tracking-wider text-accent-purple mb-2">
            代码 / 内存示意
          </h5>
          <CodeBlock language="c" title={active.name} code={active.code} />
        </div>
      </div>
    </div>
  );
}

/* ---------- 补丁比对交互组件 ---------- */

const vulnerablePatchCode = `int parse_packet(char *data, int len) {
    char header[32];
    int type, size;

    if (len < 4) return -1;

    type = *(int *)data;
    size = *(int *)(data + 4);

    // 漏洞：未检查 size 是否超过 header 大小
    memcpy(header, data + 8, size);

    return process_header(header, type);
}`;

const patchedPatchCode = `int parse_packet(char *data, int len) {
    char header[32];
    int type, size;

    if (len < 4) return -1;

    type = *(int *)data;
    size = *(int *)(data + 4);

    // 补丁：增加边界检查
    if (size > 32 || size < 0)
        return -1;

    memcpy(header, data + 8, size);

    return process_header(header, type);
}`;

function PatchDiffDemo() {
  const vulnLines = vulnerablePatchCode.split('\n');
  const patchLines = patchedPatchCode.split('\n');

  const diffLinesVuln = new Set<number>([10]);
  const diffLinesPatch = new Set<number>([10, 11, 12]);

  return (
    <div className="u-panel p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-[15px] font-semibold">补丁比对演示</h4>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
          parse_packet · 边界检查补丁
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
            <span className="font-mono text-[11px] tracking-wider text-accent-red">
              漏洞版本 · VULNERABLE
            </span>
          </div>
          <div className="bg-[var(--bg-code)] border border-[var(--border)] rounded-md overflow-hidden font-mono text-[12px]">
            {vulnLines.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  'flex px-3 py-[2px]',
                  diffLinesVuln.has(i) ? 'bg-accent-red/15 border-l-2 border-accent-red' : ''
                )}
              >
                <span className="w-6 text-[var(--text-soft)] text-right pr-3 select-none flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-[var(--text-muted)] whitespace-pre">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
            <span className="font-mono text-[11px] tracking-wider text-accent-green">
              补丁版本 · PATCHED
            </span>
          </div>
          <div className="bg-[var(--bg-code)] border border-[var(--border)] rounded-md overflow-hidden font-mono text-[12px]">
            {patchLines.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  'flex px-3 py-[2px]',
                  diffLinesPatch.has(i)
                    ? 'bg-accent-green/15 border-l-2 border-accent-green'
                    : ''
                )}
              >
                <span className="w-6 text-[var(--text-soft)] text-right pr-3 select-none flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-[var(--text-muted)] whitespace-pre">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-md overflow-hidden">
        <div className="bg-[var(--bg-card)] p-5">
          <h5 className="font-mono text-[11px] tracking-wider text-accent-red mb-2">
            供应商修了什么
          </h5>
          <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
            在 memcpy 调用前增加了对 size 参数的边界检查。如果 size 大于 32（header 缓冲区大小）
            或为负数，函数直接返回错误，避免了栈缓冲区溢出。
          </p>
        </div>
        <div className="bg-[var(--bg-card)] p-5">
          <h5 className="font-mono text-[11px] tracking-wider text-accent-orange mb-2">
            攻击者如何从补丁反推漏洞
          </h5>
          <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
            通过 BinDiff 等工具对比补丁前后的二进制，定位被修改的函数。
            新增的边界检查往往暗示了旧版本中存在相应的越界读写漏洞。
            这就是「补丁反向工程」——1day 漏洞的主要来源。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 主页面 ---------- */

export default function Step4Page() {
  const [mode, setMode] = useState<Mode>('beginner');

  return (
    <div className="space-y-14">
      {/* 页头 */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <p className="u-eyebrow mb-2">Hardening</p>
            <h2 className="u-display text-2xl md:text-[28px]">防护策略与补丁分析</h2>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
          了解操作系统和编译器提供的各种二进制安全防护机制，以及如何通过补丁比对发现漏洞。
        </p>
      </section>

      {/* 4.1 防护策略对比 */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="u-section-num">4.1</span>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            交互示例：防护策略对比
          </h3>
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
          切换不同防护机制标签，查看各自的原理、二进制层面的变化、防护效果以及已知的绕过方法。
        </p>
        <ProtectionComparison />
      </section>

      {/* 4.2 补丁比对 */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="u-section-num">4.2</span>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            补丁比对（Patch Diffing）
          </h3>
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
          供应商发布安全补丁后，攻击者可以通过对比补丁前后的二进制文件，
          快速定位修复了哪个漏洞，进而开发出针对性的攻击代码（1day 漏洞）。
        </p>
        <PatchDiffDemo />
      </section>

      {/* 新手模式 */}
      {mode === 'beginner' && (
        <div className="space-y-10">
          {/* Canary + 安全字符串函数：分栏 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">4.3</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                编码层面的基础防护
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="bg-[var(--bg-card)] p-6 md:p-7">
                <h4 className="font-mono text-[11px] tracking-wider mb-3 text-accent-orange">
                  栈保护 · CANARY
                </h4>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-4">
                  就像矿井里的金丝雀——如果它死了，说明有危险，大家赶紧撤。
                </p>
                <ul className="text-[12.5px] text-[var(--text-muted)] space-y-2 mb-4">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-[var(--text-soft)]">—</span>
                    <span>函数开头在栈上放一个随机数（金丝雀）</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-[var(--text-soft)]">—</span>
                    <span>函数返回前检查这个数有没有被改动</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-[var(--text-soft)]">—</span>
                    <span>如果被改了，说明栈溢出了，程序直接崩溃</span>
                  </li>
                </ul>
                <div className="border border-[var(--border)] rounded-md px-3 py-2 font-mono text-[12px] text-[var(--text-muted)]">
                  gcc -fstack-protector-strong
                </div>
              </div>

              <div className="bg-[var(--bg-card)] p-6 md:p-7">
                <h4 className="font-mono text-[11px] tracking-wider mb-3 text-accent-green">
                  安全字符串函数
                </h4>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-4">
                  危险函数（gets、strcpy、sprintf）不检查边界，很容易导致溢出。
                  应替换为带长度限制的安全版本。
                </p>
                <div className="space-y-2 font-mono text-[12.5px]">
                  {[
                    ['gets()', 'fgets()'],
                    ['strcpy()', 'strncpy()'],
                    ['sprintf()', 'snprintf()'],
                    ['strcat()', 'strncat()'],
                  ].map(([danger, safe]) => (
                    <div key={danger} className="flex items-center gap-3">
                      <span className="text-accent-red line-through w-24">{danger}</span>
                      <span className="font-mono text-[var(--text-soft)]" aria-hidden="true">→</span>
                      <span className="text-accent-green">{safe}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* NX/DEP */}
          <section className="u-panel p-6 md:p-7">
            <h4 className="font-mono text-[11px] tracking-wider mb-3 text-[var(--accent-cyan)]">
              NX / DEP · 数据不可执行
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-[13px] text-[var(--text-muted)] leading-relaxed">
                <p>
                  想象一下：你家的储藏室（数据区）里放的都是物品，不应该有人在里面表演（执行代码）。
                  NX 就是给储藏室加了一道门——里面只能放东西，不能做动作。
                </p>
                <p>
                  开启 NX 后，栈和堆里的数据都不能被当作代码执行。
                  攻击者即使把 Shellcode 写到了栈上，也跳不进去执行。
                </p>
              </div>
              <div className="border border-[var(--border)] rounded-md p-4">
                <p className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-3">
                  内存权限对比
                </p>
                <div className="space-y-2 font-mono text-[12px]">
                  <div className="flex items-center gap-3">
                    <span className="w-14 text-[var(--text-muted)]">.text</span>
                    <span className="text-accent-green w-8">R-X</span>
                    <span className="text-[var(--text-soft)]">代码段：可读可执行</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-14 text-[var(--text-muted)]">.data</span>
                    <span className="text-accent-orange w-8">RW-</span>
                    <span className="text-[var(--text-soft)]">数据段：可读可写</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-14 text-[var(--text-muted)]">栈/堆</span>
                    <span className="text-accent-orange w-8">RW-</span>
                    <span className="text-[var(--text-soft)]">不可执行</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 进阶模式 */}
      {mode === 'advanced' && (
        <div className="space-y-10">
          {/* CFI */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">4.3</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                CFI（控制流完整性）
              </h3>
            </div>
            <div className="space-y-4 text-[14px] text-[var(--text-muted)] leading-relaxed">
              <p>
                控制流完整性（Control-Flow Integrity, CFI）是一种强安全机制，
                其核心思想是：<strong className="text-[var(--text)]">程序的控制流转移只能在编译时确定的合法目标集合内</strong>。
              </p>
              <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--bg-card)] p-5">
                  <h5 className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">
                    前向 CFI · FORWARD-EDGE
                  </h5>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed mb-2">
                    保护间接 call 和 jmp 的目标。通常基于类型检查——函数指针只能调用同类型签名的函数。
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-soft)]">
                    Clang CFI · IBT (Intel)
                  </p>
                </div>
                <div className="bg-[var(--bg-card)] p-5">
                  <h5 className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">
                    后向 CFI · BACKWARD-EDGE
                  </h5>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed mb-2">
                    保护函数返回地址。维护一个安全的影子栈（Shadow Stack），
                    ret 时从影子栈取返回地址进行比较。
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-soft)]">
                    Shadow Stack · CET (Intel) · PAC (ARM)
                  </p>
                </div>
              </div>
              <CodeBlock
                language="c"
                title="Clang CFI 伪代码示例"
                code={`// 编译时: -fsanitize=cfi -flto -fvisibility=hidden
//
// 对于类型为 void (*)(int) 的函数指针,
// CFI 建立一个合法目标集合 S = { &foo, &bar, ... }

typedef void (*callback_t)(int);

void dispatch(callback_t cb, int arg) {
    // CFI 插入的检查
    if (!__cfi_check(cb, CFI_ID_callback_t)) {
        __cfi_slow_path(CFI_ID_callback_t, cb);  // 不匹配 → 终止
    }
    cb(arg);  // 安全调用
}

// 攻击效果:
// 即使覆盖了函数指针，也只能跳到 S 集合内的地址
// 无法跳转到任意 gadget 或 shellcode`}
              />
            </div>
          </section>

          {/* 二进制重写 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">4.4</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                二进制重写（Binary Rewriting）
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                当源码不可用时（如商业软件、遗留系统），可以直接在二进制层面进行插桩和加固。
                二进制重写工具在反汇编的基础上，插入新的指令或修改现有指令，
                实现各种安全防护。
              </p>
              <div className="grid md:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--bg-card)] p-5">
                  <p className="font-mono text-[11px] tracking-wider text-[var(--accent-cyan)] mb-2">
                    静态重写
                  </p>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                    在程序运行前修改二进制文件。
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-soft)] mt-2">
                    Dyninst · McSema · RetroWrite
                  </p>
                </div>
                <div className="bg-[var(--bg-card)] p-5">
                  <p className="font-mono text-[11px] tracking-wider text-accent-purple mb-2">
                    动态插桩
                  </p>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                    程序运行时实时修改指令。
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-soft)] mt-2">
                    Pin · DynamoRIO · Frida
                  </p>
                </div>
                <div className="bg-[var(--bg-card)] p-5">
                  <p className="font-mono text-[11px] tracking-wider text-accent-green mb-2">
                    应用场景
                  </p>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                    漏洞热补丁、CFI 实现、模糊测试插桩、行为监控
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* BinDiff */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">4.5</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                BinDiff 工具与补丁比对深入
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                BinDiff 是 zynamics（已被 Google 收购）开发的二进制差异比对工具，
                能够高效对比两个二进制文件，找出相同、相似和新增/删除的函数。
                它是逆向工程师和漏洞研究员的必备工具之一。
              </p>
              <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--bg-card)] p-6">
                  <h5 className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-3">
                    核心算法
                  </h5>
                  <ul className="text-[12.5px] text-[var(--text-muted)] space-y-2">
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono text-[var(--text-soft)]">—</span>
                      <span><strong className="text-[var(--text)]">函数哈希匹配</strong>：基于指令序列的哈希（如 MDIndex）</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono text-[var(--text-soft)]">—</span>
                      <span><strong className="text-[var(--text)]">调用图匹配</strong>：利用函数间调用关系拓扑</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono text-[var(--text-soft)]">—</span>
                      <span><strong className="text-[var(--text)]">基本块匹配</strong>：函数内部结构比较</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono text-[var(--text-soft)]">—</span>
                      <span><strong className="text-[var(--text)]">地址签名匹配</strong>：基本块级别的特征向量</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-[var(--bg-card)] p-6">
                  <h5 className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-3">
                    典型工作流
                  </h5>
                  <ol className="text-[12.5px] text-[var(--text-muted)] space-y-2">
                    {[
                      '用 IDA Pro 分别分析补丁前后的两个二进制',
                      '导出 .idb 或 .i64 数据库文件',
                      'BinDiff 加载两个数据库进行比对',
                      '按相似度排序，找出变化最大的函数',
                      '人工分析差异函数，确定漏洞位置',
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="u-flow-tick" aria-hidden="true" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* 0day vs 1day */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">4.6</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                0day vs 1day 漏洞
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="bg-[var(--bg-card)] p-6 md:p-7">
                <h5 className="font-mono text-[11px] tracking-wider text-accent-red mb-3">
                  0DAY 漏洞
                </h5>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">
                  只有攻击者知道、供应商尚未发现和修补的漏洞。
                  这类漏洞价值极高，是 APT 攻击中的核心武器。
                </p>
                <ul className="font-mono text-[11.5px] leading-relaxed text-[var(--text-soft)] space-y-1">
                  <li>· 无补丁可用，防御困难</li>
                  <li>· 发现成本高，价值连城</li>
                  <li>· 通常只在高价值目标上使用</li>
                </ul>
              </div>
              <div className="bg-[var(--bg-card)] p-6 md:p-7">
                <h5 className="font-mono text-[11px] tracking-wider text-accent-orange mb-3">
                  1DAY 漏洞
                </h5>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">
                  供应商已经发布补丁，但大量用户尚未更新的漏洞。
                  通过补丁比对可以快速定位漏洞细节并开发利用代码。
                </p>
                <ul className="font-mono text-[11.5px] leading-relaxed text-[var(--text-soft)] space-y-1">
                  <li>· 补丁发布后几小时内即可出现 PoC</li>
                  <li>· 批量攻击未打补丁的系统</li>
                  <li>· 勒索软件常利用 1day 漏洞传播</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 底部导航 */}
      <section className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3">
        <Link href="/learn/step3" className="u-btn u-btn-ghost">
          <span className="font-mono" aria-hidden="true">←</span>
          上一步 · 路径探索
        </Link>
        <Link href="/tools" className="u-btn u-btn-primary">
          前往工具区
          <span className="font-mono" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
