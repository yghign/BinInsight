import Link from 'next/link';
import WorkbenchShell from '@/components/WorkbenchShell';
import DemoTerminal from '@/components/DemoTerminal';
import PayloadBuilder from '@/components/PayloadBuilder';
import DefenseSwitcher from '@/components/DefenseSwitcher';
import { getVulnNode, vulnPath } from '@/data/reference';

const node = getVulnNode('heap')!;

export const metadata = {
  title: '堆利用入门 · 逆向工作台',
  description: '四段式学习堆利用：glibc malloc 流程图解 · double free GDB 演示 · tcache poisoning payload 构造 · 防御视角与 safe-linking。',
};

/* ---------- DemoTerminal 预录制的 GDB 步进 —— double free + tcache poisoning ---------- */

const gdbSteps = [
  {
    cmd: 'gdb ./heap_vuln',
    output: `Reading symbols from ./heap_vuln...\n(gdb) r`,
    note: '启动目标程序，先分配几个 chunk 看看 tcache 的长相',
  },
  {
    cmd: 'call malloc(0x20)',
    output: `$1 = (void *) 0x55555555c2a0\n(gdb) call malloc(0x20)\n$2 = (void *) 0x55555555c2d0`,
    note: '连续两个 0x20 chunk，地址差 0x30（0x20 数据 + 0x10 header）',
  },
  {
    cmd: 'call free($1)',
    output: `(gdb) call free($1)\n(gdb) call free($2)\n(gdb) call free($1)`,
    note: 'double free！把同一个 chunk（0x55555555c2a0）在 tcache[0x20] 里塞两次',
  },
  {
    cmd: 'heap bins tcache 0x20',
    output: `tcache[0x20] count = 3\n0x55555555c2a0  →  0x55555555c2d0  →  0x55555555c2a0  ↺  ↺  ↺`,
    note: '✓ tcache[0x20] 里看到 a0 出现两次，next 指针指向自己形成环',
  },
  {
    cmd: 'call malloc(0x20)',
    output: `$3 = (void *) 0x55555555c2a0\n(gdb) call malloc(0x20)\n$4 = (void *) 0x55555555c2a0`,
    note: '✓ 再次 malloc(0x20) 连续两次都返回同一个 a0 chunk —— 这就是 double free 的效果',
  },
  {
    cmd: 'set {long}($3+0x20) = 0x7ffff7d7a7f0',
    output: `(gdb) set {long}($3+0x20) = 0x7ffff7d7a7f0\n(gdb) call malloc(0x20)\n$5 = (void *) 0x7ffff7d7a7f0`,
    note: 'tcache poisoning：覆写 $3 的 next 指针 → 下次 malloc 直接给你 free_hook',
  },
  {
    cmd: 'info proc mappings',
    output: `0x555555554000 0x555555555000 r-xp  1000 0      /.../heap_vuln\n0x7ffff7dc4000 0x7ffff7de4000 r-xp 20000 0      /lib/x86_64-linux-gnu/libc.so.6\n0x7fffffffdda0 0x7fffffffdfb0 rwsp  2000 0      [stack]`,
    note: '注意 libc base = 0x7ffff7dc4000，free_hook = libc + 0x3a7f0 = 0x7ffff7dfe7f0',
  },
];

/* ---------- 漏洞源码 ---------- */

const vulnCode = `// heap_vuln.c —— double free 最小示例
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char *a = malloc(0x20);
    char *b = malloc(0x20);
    free(a);
    free(b);
    free(a);          // ← double free：同一个 chunk 进 tcache 两次
    char *p = malloc(0x20);
    char *q = malloc(0x20);
    printf("p=%p q=%p\\n", p, q);  // p == q → 同一个 chunk！
    return 0;
}`;

/* ---------- 防护矩阵 ---------- */

const mitigations = [
  { name: 'tcache poisoning check', defaultOn: true, desc: 'glibc 2.29+ 开启 double free 检测',
    effectOff: 'double free 直接让同一 chunk 进 tcache 两次', effectOn: 'free 同一 chunk 两次会触发 tcache double free abort' },
  { name: 'safe-linking', defaultOn: true, desc: 'glibc 2.32+ next 指针 XOR 堆基址哈希',
    effectOff: 'tcache next 指针可直接覆写成任意地址', effectOn: 'next = addr ⊕ (heap_base >> 12)，需要泄露堆基址才能算出正确值' },
  { name: 'glibc pointer guard', defaultOn: true, desc: 'malloc chunk size 末尾字节随机化',
    effectOff: 'chunk header size 字段恒等于用户请求 + 0x10', effectOn: 'size 最低字节随机化，伪造 chunk 更困难' },
  { name: 'ASLR', defaultOn: true, desc: '堆 / libc 地址随机化',
    effectOff: '硬编码 free_hook / system 地址可用', effectOn: '需要先泄露 main_arena 或 heap base' },
];

const fixOptions = [
  { code: 'void safe(void) {\n    char *a = malloc(0x20);\n    free(a);\n    a = NULL;      // ← free 后置 NULL\n    free(a);       // free(NULL) 是安全的\n}', correct: true },
  { code: 'void safe(void) {\n    char *a = malloc(0x20);\n    free(a);\n    free(a);       // 还是 double free\n}', correct: false },
  { code: 'void safe(void) {\n    char a[0x20];   // 把堆改成栈\n    // ...\n}', correct: false },
  { code: '// C++ RAII\nvoid safe() {\n    auto a = std::make_unique<char[]>((size_t)0x20);\n    // 离开作用域自动 free\n}', correct: true },
];

const recommendedFix = {
  code: '// 修复 1：C 版本 —— free 后置 NULL\nvoid safe(void) {\n    char *a = malloc(0x20);\n    // ...使用 a...\n    free(a);\n    a = NULL;   // ← 关键：悬垂指针立即归零\n    free(a);    // free(NULL) 在 glibc 里是空操作\n}\n\n// 修复 2：C++ 版本 —— RAII unique_ptr\nvoid safe_cpp(void) {\n    auto a = std::make_unique<char[]>(0x20);\n    // 离开作用域自动释放，不会 double free\n}',
  explanation: `最直接的 C 写法是 free(a); a = NULL; 两步缺一不可 —— glibc 规定 free(NULL) 什么都不做，所以第二次 free 悬垂指针是安全的。

更推荐 C++ 里用 std::unique_ptr / std::shared_ptr：RAII 自动在离开作用域时释放，根本不会出现 double free 和 UAF。

补充：glibc 2.32+ safe-linking 让直接覆写 tcache next 变难了，但 double free 仍然可能触发——safe-linking 主要防的是"通过覆写 next 拿到任意地址"，不是防 double free 本身。glibc 2.34 又加了 key 校验，需要泄露更多信息。`,
};

/* ---------- Glibc malloc 流程 SVG ---------- */

function GlibcHeapSVG() {
  return (
    <svg viewBox="0 0 560 440" className="w-full max-w-[560px] font-mono text-[11px]" role="img" aria-label="glibc malloc/free 流程">
      <text x="0" y="14" fill="var(--text-soft)" fontSize="10" letterSpacing="2">GLIBC MALLOC/FREE — ARENA → BINS → TCACHE</text>

      {/* Arena */}
      <rect x="200" y="24" width="160" height="38" fill="var(--bg-card)" stroke="var(--brand-500)" />
      <text x="220" y="48" fill="var(--brand-500)">MAIN ARENA</text>

      {/* arena 子项：tcache + bins */}
      {/* tcache 行 */}
      <rect x="30" y="110" width="200" height="36" fill="var(--bg-card)" stroke="var(--border)" />
      <rect x="30" y="110" width="200" height="36" fill="color-mix(in srgb, var(--accent-red) 8%, transparent)" />
      <text x="44" y="132" fill="var(--accent-red)">tcache[64] bins</text>

      {/* bins 行 */}
      <rect x="330" y="110" width="200" height="36" fill="var(--bg-card)" stroke="var(--border)" />
      <text x="344" y="132" fill="var(--text-muted)">bins (small/large/unsorted)</text>

      {/* 箭头 arena → tcache */}
      <path d="M 230 62 L 130 110" stroke="var(--accent-red)" strokeWidth="1.2" markerEnd="url(#heap-arrow)" fill="none" />
      {/* 箭头 arena → bins */}
      <path d="M 330 62 L 430 110" stroke="var(--text-muted)" strokeWidth="1.2" markerEnd="url(#heap-arrow)" fill="none" />

      {/* tcache 内部展开 */}
      <g transform="translate(30, 170)">
        <rect x="0" y="0" width="200" height="56" fill="var(--bg-soft)" stroke="var(--border)" />
        <text x="10" y="16" fill="var(--accent-red)" fontSize="10">tcache[0x20]: count=3</text>
        <circle cx="24" cy="36" r="6" fill="var(--accent-red)" />
        <line x1="30" y1="36" x2="58" y2="36" stroke="var(--accent-red)" />
        <circle cx="64" cy="36" r="6" fill="var(--accent-red)" />
        <line x1="70" y1="36" x2="98" y2="36" stroke="var(--accent-red)" />
        <circle cx="104" cy="36" r="6" fill="var(--accent-red)" />
        <line x1="110" y1="36" x2="150" y2="36" stroke="var(--text-soft)" strokeDasharray="2,2" />
        <text x="150" y="39" fill="var(--text-soft)" fontSize="9">... 0x100+ 级别</text>
      </g>

      {/* bins 内部展开 */}
      <g transform="translate(330, 170)">
        <rect x="0" y="0" width="200" height="56" fill="var(--bg-soft)" stroke="var(--border)" />
        <text x="10" y="16" fill="var(--text-muted)" fontSize="10">unsorted bin (双向链表)</text>
        <circle cx="24" cy="36" r="6" fill="var(--text-muted)" />
        <line x1="30" y1="36" x2="64" y2="36" stroke="var(--text-muted)" />
        <circle cx="70" cy="36" r="6" fill="var(--text-muted)" />
        <line x1="76" y1="36" x2="110" y2="36" stroke="var(--text-muted)" />
        <circle cx="116" cy="36" r="6" fill="var(--text-muted)" />
      </g>

      {/* chunk header 布局 */}
      <g transform="translate(140, 260)">
        <rect x="0" y="0" width="280" height="120" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="10" y="16" fill="var(--brand-500)" fontSize="10">chunk 布局（free 状态）</text>

        {/* header 8 字节 */}
        <rect x="10" y="24" width="90" height="28" fill="color-mix(in srgb, var(--accent-orange) 10%, transparent)" stroke="var(--border)" />
        <text x="20" y="42" fill="var(--accent-orange)">size | A | P</text>

        {/* fd 8 字节 */}
        <rect x="100" y="24" width="80" height="28" fill="color-mix(in srgb, var(--accent-red) 12%, transparent)" stroke="var(--border)" />
        <text x="116" y="42" fill="var(--accent-red)">fd / next</text>

        {/* bk 8 字节 */}
        <rect x="180" y="24" width="80" height="28" fill="var(--bg-soft)" stroke="var(--border)" />
        <text x="196" y="42" fill="var(--text-muted)">bk / prev</text>

        {/* 用户数据区 */}
        <rect x="10" y="52" width="250" height="56" fill="var(--bg-soft)" stroke="var(--border)" strokeDasharray="3,3" />
        <text x="20" y="74" fill="var(--text-soft)" fontSize="9">data... user returns ptr at chunk + 0x10</text>

        {/* 标注 */}
        <text x="10" y="100" fill="var(--text-soft)" fontSize="9">chunk 总大小 = size &amp; ~0x7（向下 16 字节对齐）</text>
        <text x="10" y="112" fill="var(--text-soft)" fontSize="9">free: fd/bk 被覆盖；tcache: next 单指针链表</text>
      </g>

      {/* 底部技巧标签 */}
      <g transform="translate(30, 400)">
        <rect x="0" y="0" width="170" height="22" rx="4" fill="color-mix(in srgb, var(--accent-red) 12%, transparent)" stroke="var(--accent-red)" />
        <text x="12" y="15" fill="var(--accent-red)">tcache poisoning → 任意地址</text>
      </g>
      <g transform="translate(210, 400)">
        <rect x="0" y="0" width="170" height="22" rx="4" fill="color-mix(in srgb, var(--accent-orange) 10%, transparent)" stroke="var(--accent-orange)" />
        <text x="12" y="15" fill="var(--accent-orange)">unsorted bin → 泄露 libc 基址</text>
      </g>
      <g transform="translate(390, 400)">
        <rect x="0" y="0" width="140" height="22" rx="4" fill="color-mix(in srgb, var(--brand-500) 10%, transparent)" stroke="var(--brand-500)" />
        <text x="12" y="15" fill="var(--brand-500)">double free → 同一 chunk 两次</text>
      </g>

      {/* 箭头定义 */}
      <defs>
        <marker id="heap-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
    </svg>
  );
}

/* ---------- 页面 ---------- */

export default function HeapPage() {
  return (
    <WorkbenchShell slug="heap" node={node} glossLinks={[
      { slug: 'glibc', term: 'glibc malloc 实现（arena / bin / tcache）' },
      { slug: 'heap', term: 'Heap / TCache / Safe-linking' },
      { slug: 'canary', term: 'Canary —— 栈防护，注意与堆防护不重叠' },
    ]}>
      <header className="space-y-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)]">首页</Link>
          <span>/</span>
          <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">堆利用入门</span>
        </div>
        <h1 className="u-display text-2xl md:text-[32px]">堆利用入门</h1>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          比栈溢出更精细，也更依赖 glibc 版本。<b className="text-[var(--text)]">tcache poisoning</b>
          让下次 <code className="inline">{'malloc'}</code> 返回任意地址，<b className="text-[var(--text)]">unsorted bin 泄露</b>
          main_arena 算出 libc 基址，<b className="text-[var(--text)]">double free</b>
          让同一个 chunk 同时出现在空闲链里 —— 这些是现代 Pwn 的主战场。
        </p>
      </header>

      {/* 01 原理 */}
      <section className="space-y-5" id="principle">
        <SectionHeader num="01" label="原理" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          glibc 的 <code className="inline">malloc/free</code> 分三层：线程私有
          <code className="inline"> tcache</code>（2.26 引入）→ 线程共享的
          <code className="inline"> fastbin / smallbin / largebin</code> → 最后还有一个
          <code className="inline"> unsorted bin</code> 暂存中等大小的 free chunk。
          每个 chunk 头部 16 字节：<code className="inline">size | flags</code> +
          <code className="inline"> fd</code>/<code className="inline">next</code>（free 状态下存链表指针）。
        </p>
        <GlibcHeapSVG />
        <div className="u-panel p-5 space-y-2">
          <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">关键利用手法</div>
          <ul className="space-y-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
            <li>
              <b className="text-[var(--accent-red)]">tcache poisoning</b>：
              覆写某个 tcache chunk 的 <code className="inline">{'ptr->next'}</code> 为目标地址，
              下次 <code className="inline">malloc(size)</code> 就直接把那块地儿交给你
            </li>
            <li>
              <b className="text-[var(--accent-orange)]">unsorted bin 泄露</b>：
              free 一个较大 chunk 会把 main_arena 的地址写进它的 <code className="inline">{'fd/bk'}</code>，
              用一个 UAF 读出来就能算 libc 基址
            </li>
            <li>
              <b className="text-[var(--brand-500)]">double free</b>：
              同一个 chunk 调两次 <code className="inline">free</code> → tcache 里出现两次 →
              连调两次 <code className="inline">malloc</code> 拿到同一个 chunk，第二次覆写 next
            </li>
            <li>
              <b className="text-[var(--text-muted)]">chunk header 伪造</b>：
              溢出覆盖相邻 chunk 的 <code className="inline">size</code> 字段，
              让 <code className="inline">free</code> 把它当成更大的 chunk 合并，扩大可写范围
            </li>
          </ul>
        </div>
      </section>

      {/* 02 演示 */}
      <section className="space-y-5" id="demo">
        <SectionHeader num="02" label="演示" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          下面是 double free + tcache poisoning 的 GDB 会话。先让
          <code className="inline"> 0x20</code> chunk 进 tcache 两次 → 再把
          <code className="inline"> next</code> 指针覆写成 <code className="inline">free_hook</code>
          地址 → 下次 <code className="inline">malloc</code> 直接把 glibc 的 hook 区交给你写。
        </p>
        <DemoTerminal steps={gdbSteps} />
      </section>

      {/* 03 动手 */}
      <section className="space-y-5" id="hands">
        <SectionHeader num="03" label="动手" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          偏移 + 覆写值 + 目标地址实时拼 payload。默认值对应 glibc 2.31（safe-linking 之前，
          直接覆写 <code className="inline">{'ptr->next'}</code> 就能拿任意地址）。
          升 glibc 之后记得把 safe-linking XOR 哈希算进去。
        </p>
        <PayloadBuilder defaults={{ offset: 0x10, gadgetRdi: '0x401196', binshAddr: '0x7ffff7f5a0b5', systemAddr: '0x7ffff7e1e340' }} />
      </section>

      {/* 04 防御视角 */}
      <section className="space-y-5" id="defense">
        <SectionHeader num="04" label="防御视角" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          打开 <code className="inline">tcache poisoning check</code>、
          <code className="inline">safe-linking</code>、ASLR 的任意组合，看 double free 还能不能打通；
          然后选修复方式 —— C 风格 <code className="inline">a = NULL</code> 还是 C++ RAII。
        </p>
        <DefenseSwitcher
          mitigations={mitigations}
          vulnCode={vulnCode}
          fixOptions={fixOptions}
          recommendedFix={recommendedFix}
        />
      </section>

      {/* 底部导航：prev = fmtstr (vulnPath[2])，next = 工作台首页 */}
      <nav className="pt-8 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link href={`/reference/${vulnPath[2].slug}`} className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← {vulnPath[2].title}
        </Link>
        <Link
          href="/reference"
          className="font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-4 transition-colors"
        >
          回到工作台首页 →
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
