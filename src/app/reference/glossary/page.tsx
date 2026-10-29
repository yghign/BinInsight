import Link from 'next/link';

/**
 * 概念 glossary —— 工作台右侧 "RELATED" 链接跳转的锚点页。
 * 纯表格形式，每个概念一个 id 锚点。
 * 服务端组件。
 */

const entries: { id: string; term: string; body: React.ReactNode }[] = [
  {
    id: 'elf-text',
    term: 'ELF .text 节',
    body: <>
      ELF 里存放可执行机器码的节，权限通常 R-X。函数序言（push rbp; mov rbp, rsp; sub rsp, N）和
      尾声（leave; ret）的模式是识别函数边界的基础。strip 不会移除 .text 的机器码，
      但会移除函数名符号表，让反汇编里只剩 FUN_00401132 这种占位。
    </>,
  },
  {
    id: 'x86-call',
    term: 'x86-64 call / ret 约定',
    body: <>
      <code className="inline">call func</code> = push rip (下一条指令地址) + 跳转到 func；
      <code className="inline">ret</code> = pop rip。这就是"覆盖 ret = 控制 RIP"的源头。
      x86-64 System V ABI 约定：前 6 个整数参数放 rdi,rsi,rdx,rcx,r8,r9，
      超过的放栈上；返回值 rax；call 要保证栈 16 字节对齐。
    </>,
  },
  {
    id: 'canary',
    term: 'Stack Canary 原理',
    body: <>
      编译时在每个栈帧里插入一个随机值（fs:0x28 指向的主金丝雀），位于 saved rbp 下方。
      函数返回前 <code className="inline">stack_chk_fail()</code> 校验它——
      只要溢出越过了它就必触发 stack smashing detected。
      绕过思路：泄露金丝雀值（格式化字符串 / 信息泄露）、fork 服务器逐字节爆破、
      覆写 TLS 主金丝雀。
    </>,
  },
  {
    id: 'nx',
    term: 'NX 位 / ASLR / PIE',
    body: <>
      NX（Execute Disable）：让栈和堆页权限变为 RW-，shellcode 放上去不会执行。
      ASLR（Address Space Layout Randomization）：内核每次启动随机化 libc、main、mmap 区域基址，
      32 位下熵低可爆破，64 位下必须泄露一个地址来算基址。
      PIE（Position Independent Executable）：主程序代码段也参与随机化，
      意味着硬编码的 gadget / .text 地址全失效。
    </>,
  },
  {
    id: 'glibc',
    term: 'glibc malloc 实现（arena / bin / tcache）',
    body: <>
      <b>arena</b> 每个线程一个堆上下文；<b>bin</b> 分 fastbins（单向链表 7 个尺寸 0x10-0x80）、
      unsorted bin（大块释放后先放这里）、small/large bin。
      <b>tcache</b> glibc 2.26+ 每线程独立 7 个桶，优先匹配，Double Free 经典目标。
      每个 chunk 开头有 <code className="inline">size</code> 字段、free 状态有 <code className="inline">fd/bk</code> 指针
      （glibc 2.32+ safe-linking 把它们异或主 arena 地址）。
    </>,
  },
  {
    id: 'vtable',
    term: 'C++ 虚表布局',
    body: <>
      C++ 类对象的第一个字段是指向<b>虚函数表</b>的指针——一个连续存放函数地址的数组。
      <code className="inline">{'obj->method()'}</code> 实际等价于
      <code className="inline">{'((void(*)())(*obj)[index])()'}</code>。
      虚表劫持就是把 <code className="inline">*obj</code> 这块指针数组的某个项换成攻击者控制的地址。
    </>,
  },
  {
    id: 'fmt',
    term: 'printf 格式串参数详解',
    body: <>
      printf 遇到 <code className="inline">%d %s %x %p %n</code> 时，
      会把下一个参数从栈上取出来——如果你没传那个参数，printf 就直接读栈上"碰巧在那里的东西"。
      <code className="inline">%p</code> 泄露栈上的指针（信息泄露）；
      <code className="inline">%n</code> 把"已经输出的字符数"写到 printf 里指定的任意地址（任意写）。
      审计口诀：<b>printf 的第一个参数必须是字符串字面量</b>，永远不要把用户输入作为格式串。
    </>,
  },
];

export const metadata = {
  title: '概念 Glossary · 逆向工作台',
  description: '原理图解里提到的 ELF .text / x86 调用约定 / Canary / glibc 堆 等核心概念速查。',
};

export default function GlossaryPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-5">
        <Link href="/" className="hover:text-[var(--text)]">首页</Link>
        <span>/</span>
        <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
        <span>/</span>
        <span className="text-[var(--text-muted)]">Glossary</span>
      </div>

      <p className="u-eyebrow mb-2">GLOSSARY</p>
      <h1 className="u-display text-2xl md:text-[32px] mb-3">核心概念速查</h1>
      <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed mb-10 max-w-xl">
        学习路径里反复提到的底层概念，单独列一张速查表。
        每个条目对应工作台右侧 RELATED 跳转链接。
      </p>

      <dl className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
        {entries.map((e) => (
          <div key={e.id} id={e.id} className="scroll-mt-24 px-5 py-4">
            <dt className="font-mono text-[13px] text-[var(--text)] mb-1.5">
              <a href={`#${e.id}`} className="text-[var(--text-soft)] mr-2 font-normal">{e.id}</a>
              {e.term}
            </dt>
            <dd className="text-[13.5px] text-[var(--text-muted)] leading-relaxed">{e.body}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 pt-6 border-t border-[var(--border)]">
        <Link href="/reference" className="font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-4">
          ← 回到工作台首页
        </Link>
      </div>
    </div>
  );
}
