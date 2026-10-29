import Link from 'next/link';
import WorkbenchShell from '@/components/WorkbenchShell';
import DemoTerminal from '@/components/DemoTerminal';
import PayloadBuilder from '@/components/PayloadBuilder';
import DefenseSwitcher from '@/components/DefenseSwitcher';
import { getVulnNode, vulnPath } from '@/data/reference';

const node = getVulnNode('uaf')!;

export const metadata = {
  title: 'Use-After-Free · 逆向工作台',
  description: '四段式学习 Use-After-Free：悬垂指针 + vtable 劫持 + 类型混淆。',
};

/* ---------- GDB 步进 ---------- */

const gdbSteps = [
  { cmd: 'gdb ./uaf', output: `Reading symbols from ./uaf...\n(gdb) r`, note: '先看程序正常打印' },
  { cmd: 'break 15', output: `Breakpoint 1 at 0x401234: file uaf.c, line 15.\n(gdb) r`, note: '在 free(p) 那行断住' },
  { cmd: 'print p->name', output: `$1 = "Alice"`, note: 'free 之前数据还在' },
  { cmd: 'next', output: `16\tif (p && p->vtable->say()) {`, note: 'free 执行了，现在 p 成了悬垂指针' },
  { cmd: 'print p', output: `$2 = (struct User *) 0x55555556a010`, note: 'p 的地址没变！free 只把块还给 arena，不改指针' },
  { cmd: 'print *p', output: `$3 = {vtable = 0x4013a8, name = 0x4013e0 "Alice"}\n(gdb) x/8x 0x55555556a010`, note: 'free 后数据残留 —— 这是悬垂指针的关键' },
  { cmd: 'r $(python3 -c "print(\'A\'*0x20 + \'B\'*8)")', output: `Program received signal SIGSEGV, Segmentation fault.\n0x0000000041414141 in ?? ()`, note: '我们 malloc 一个 0x20 块刚好复用 User 的旧位置，把 vtable 覆写成 0x41414141' },
  { cmd: 'info registers rip', output: `rip            0x4141414141414141   0x4141414141414141`, rip: '0x4141414141414141', note: '✓ rip 被覆盖 —— vtable 劫持成功' },
];

/* ---------- 漏洞代码 ---------- */

const vulnCode = `// uaf.c —— Use-After-Free 最小示例
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct User {
    void **vtable;       // C++ 虚函数表指针（首个字段）
    char *name;
};

int main(int argc, char **argv) {
    struct User *p = malloc(sizeof(*p));
    p->vtable = (void**)&User_vtable;
    p->name   = strdup("Alice");

    free(p);              // ← 漏洞：释放后不置 NULL

    // 攻击者 malloc 一块同大小内存 → 复用同地址
    void *q = malloc(0x20);
    memcpy(q, argv[1], strlen(argv[1]));

    // p 和 q 指向同一块！vtable 已被覆写
    if (p && p->vtable[0]) {   // ← 悬垂指针解引用
        ((void(*)())p->vtable[0])();  // ← 间接调用 = 控制 RIP
    }
    return 0;
}`;

/* ---------- 防护矩阵 ---------- */

const mitigations = [
  { name: 'Heap Smashing', defaultOn: true, desc: 'glibc 堆元数据校验',
    effectOff: '覆写 chunk 元数据不报错', effectOn: '覆写后触发 corrupted double-linked list' },
  { name: 'NX bit', defaultOn: true, desc: '栈/堆不可执行',
    effectOff: 'shellcode 可在堆上执行', effectOn: 'vtable 劫持后 ROP 替代 shellcode' },
  { name: 'ASLR', defaultOn: true, desc: 'libc / 堆基址随机化',
    effectOff: '硬编码 libc 地址可用', effectOn: '需要泄露堆或 libc 基址' },
  { name: 'FORTIFY_SOURCE', defaultOn: true, desc: '编译期对已知长度 memcpy 加边界检查',
    effectOff: 'memcpy 不检查长度', effectOn: '编译期已知长度时换 __memcpy_chk' },
];

const fixOptions = [
  { code: 'struct User *p = malloc(sizeof(*p));\n// ...\nfree(p);\np = NULL;                    // ← 置空', correct: true },
  { code: 'struct User *p = malloc(sizeof(*p));\n// ...\nfree(p);\n// 不置 NULL，靠 p && 检查不够', correct: false },
  { code: 'struct User *p = malloc(sizeof(*p));\n// ...\nfree(p);\np = (void*)0x41414141;      // ← 覆写成垃圾地址', correct: false },
  { code: '// 用智能指针（C++），超出作用域自动释放 + 置空\nstd::unique_ptr<User> p(new User());', correct: true },
];

const recommendedFix = {
  code: `// 1. free 后立即置空 —— 消除悬垂指针
free(p);
p = NULL;

// 2. C++：用智能指针，生命周期自动管理
// std::unique_ptr<User> 离开作用域 → 自动 delete + 清空
std::unique_ptr<User> p = std::make_unique<User>();

// 3. 团队级：RAII / 所有权语义
//    谁分配，谁释放；unique_ptr / shared_ptr 避免悬挂`,
  explanation: `free 后"立即"置 NULL 是最低成本的防线——再解引用会触发 SIGSEGV 而不是静默的数据污染。但这只是第一层。根本解法是 RAII：让编译器在离开作用域时自动释放，避免手写 free 漏写或顺序错。C++ 的 unique_ptr/智能引用计数，Rust 的所有权系统，都是同一个思路。`,
};

/* ---------- vtable 劫持 SVG ---------- */

function VtableSVG() {
  return (
    <svg viewBox="0 0 520 360" className="w-full max-w-[520px] font-mono text-[11px]" role="img" aria-label="vtable 劫持">
      <text x="0" y="14" fill="var(--text-soft)" fontSize="10" letterSpacing="2">VTABLE HIJACK — USE-AFTER-FREE + TYPE CONFUSION</text>

      {/* 正常 User 对象 */}
      <g>
        <rect x="80" y="30" width="220" height="60" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="94" y="49" fill="var(--brand-500)">正常 User 对象</text>
        <text x="94" y="65" fill="var(--text-muted)">+0x00: vtable → 0x4013a8</text>
        <text x="94" y="80" fill="var(--text-muted)">+0x08: name   → "Alice"</text>
      </g>
      {/* vtable 块 */}
      <g>
        <rect x="360" y="30" width="140" height="40" fill="color-mix(in srgb, var(--accent-green) 8%, transparent)" stroke="var(--border)" strokeDasharray="2,2" />
        <text x="374" y="49" fill="var(--accent-green)">User_vtable</text>
        <text x="374" y="64" fill="var(--text-muted)">say() → 0x401200</text>
      </g>
      <line x1="300" y1="60" x2="360" y2="50" stroke="var(--border-soft)" strokeDasharray="2,2" />

      {/* free */}
      <text x="80" y="118" fill="var(--text-soft)">free(p)</text>
      <line x1="120" y1="112" x2="120" y2="120" stroke="var(--border-soft)" strokeWidth="1" />

      {/* 悬垂 + 新 malloc */}
      <g>
        <rect x="80" y="130" width="220" height="60" fill="color-mix(in srgb, var(--accent-orange) 12%, transparent)" stroke="var(--border)" />
        <text x="94" y="149" fill="var(--accent-orange)">free 后地址不变</text>
        <text x="94" y="165" fill="var(--text-muted)">p == 0x55555556a010</text>
        <text x="94" y="180" fill="var(--text-soft)">（块已还给 glibc arena）</text>
      </g>

      {/* 覆写的块 */}
      <g>
        <rect x="80" y="220" width="220" height="60" fill="color-mix(in srgb, var(--accent-red) 12%, transparent)" stroke="var(--accent-red)" />
        <text x="94" y="239" fill="var(--accent-red)">攻击者 malloc(0x20) → 复用同地址</text>
        <text x="94" y="255" fill="var(--text-muted)">+0x00: 0x41414141 ← 覆写 vtable！</text>
        <text x="94" y="270" fill="var(--text-muted)">+0x08: padding</text>
      </g>

      {/* 控制流 */}
      <path d="M 200 200 L 200 220" stroke="var(--accent-red)" strokeWidth="1.5" />
      <path d="M 300 250 L 460 250" stroke="var(--accent-red)" strokeWidth="1.5" markerEnd="url(#uaf-arr)" />

      <g>
        <rect x="360" y="232" width="140" height="36" fill="var(--bg-card)" stroke="var(--accent-red)" />
        <text x="374" y="254" fill="var(--accent-red)">((void*)0x41414141)() → RIP</text>
      </g>

      <defs>
        <marker id="uaf-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-red)" />
        </marker>
      </defs>

      <text x="80" y="320" fill="var(--text-soft)" fontSize="10">根因：free(p) 后 p 没置 NULL → 悬垂指针 → 新分配复用同地址 → 旧"类型"被覆写成新"类型" = 类型混淆</text>
    </svg>
  );
}

/* ---------- 页面 ---------- */

export default function UafPage() {
  return (
    <WorkbenchShell slug="uaf" node={node} glossLinks={[
      { slug: 'glibc', term: 'glibc malloc 实现（arena / bin / tcache）' },
      { slug: 'vtable', term: 'C++ 虚表布局' },
      { slug: 'canary', term: 'Stack Canary 管不住堆（注意）' },
    ]}>
      <header className="space-y-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)]">首页</Link>
          <span>/</span>
          <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">Use-After-Free</span>
        </div>
        <h1 className="u-display text-2xl md:text-[32px]">Use-After-Free</h1>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          释放了却没置 NULL —— 指针"悬垂"在已归还的堆块上。攻击者再 malloc 一块同大小内存就会复用到同一个地址，
          把你的 User 对象偷偷换成带假 vtable 的东西。等你按原类型解引用虚函数 —— RIP 就被劫持了。
        </p>
      </header>

      <section className="space-y-5" id="principle">
        <SectionHeader num="01" label="原理" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          堆分配器的关键特性：<b className="text-[var(--text)]">free 不清除数据</b>，
          只把块还给 arena；下次同大小的 malloc 会优先复用刚释放的位置。
          这就让 Use-After-Free 变成 <code className="inline">free(p) + malloc_same_size → 地址复用</code> 的必然结果。
        </p>
        <VtableSVG />
        <div className="u-panel p-5 space-y-2">
          <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">关键直觉</div>
          <ul className="space-y-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
            <li>free 只清元数据，<b className="text-[var(--text)]">不清数据</b> —— 悬垂指针第一次解引用可能是"旧数据还在"</li>
            <li>类型混淆 = 两个不同"类型"的指针指向<b className="text-[var(--text)]">同一块内存</b></li>
            <li>vtable 劫持 = 把 <code className="inline">{'*(ptr + 0x00)'}</code> 改成你自己的"虚表"数组，<code className="inline">{'ptr->vtable[0]'}</code> 就是目标地址</li>
            <li>比栈溢出更隐蔽：Canary 只管栈，不管堆</li>
          </ul>
        </div>
      </section>

      <section className="space-y-5" id="demo">
        <SectionHeader num="02" label="演示" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          在 free 之后、悬垂指针解引用之前，插入一次同大小的 malloc —— 堆块复用时，
          <code className="inline">x/8x</code> 就能看到原数据被攻击者的覆写覆盖。
        </p>
        <DemoTerminal steps={gdbSteps} />
      </section>

      <section className="space-y-5" id="hands">
        <SectionHeader num="03" label="动手" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          对 UAF 来说，<b className="text-[var(--text)]">覆写的是堆对象里的 vtable 指针</b>，
          而不是栈上的 return address。构造器里的 "padding" 对应 User 结构体大小，
          "pop rdi; ret gadget" 在这里换成<b className="text-[var(--text)]">你想调用的函数地址</b>
          （shellcode、one_gadget、ret2libc 链）。
        </p>
        <PayloadBuilder
          label="vtable 覆写 payload"
          defaults={{ offset: 0, gadgetRdi: '0x7ffff7e1e340', binshAddr: '0x7ffff7f5a0b5', systemAddr: '0x7ffff7e1e340', retPadding: false }}
        />
        <p className="font-mono text-[11px] text-[var(--text-soft)]">
          注：UAF 场景下 offset 通常是 0 —— 覆写就是往 &p + 0x00 写。如果要打结构体更深的字段（name 等），offset 才需要非零。
        </p>
      </section>

      <section className="space-y-5" id="defense">
        <SectionHeader num="04" label="防御视角" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          Use-After-Free 没有"一招制敌"的防护 —— Canary 不管堆、FORTIFY 只覆盖编译期已知长度的 memcpy。
          真正的防线是<b className="text-[var(--text)]">所有权语义</b>：free 后置 NULL、unique_ptr、Rust 所有权。
        </p>
        <DefenseSwitcher
          mitigations={mitigations}
          vulnCode={vulnCode}
          fixOptions={fixOptions}
          recommendedFix={recommendedFix}
        />
      </section>

      <nav className="pt-8 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link href={`/reference/${vulnPath[0].slug}`} className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← {vulnPath[0].title}
        </Link>
        <Link
          href={`/reference/${vulnPath[2].slug}`}
          className="font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-4 transition-colors"
        >
          下一步：{vulnPath[2].title} →
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
