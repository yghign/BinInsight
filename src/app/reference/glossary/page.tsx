import Link from 'next/link';

/**
 * 概念 glossary —— 工作台右侧 "RELATED" 链接跳转的锚点页。
 * 纯表格形式，每个概念一个 id 锚点。
 * 服务端组件。
 */

type Entry = { id: string; term: string; body: React.ReactNode };

const groupA: { title: string; entries: Entry[] } = {
  title: 'A 组 · ELF / 格式 / 节区',
  entries: [
    {
      id: 'elf-text',
      term: 'ELF .text 节',
      body: <>
        ELF 里存放可执行机器码的节，权限通常 R-X。函数序言（<code className="inline">push rbp; mov rbp, rsp; sub rsp, N</code>）
        和尾声（<code className="inline">leave; ret</code>）的模式是识别函数边界的基础。
        <code className="inline">strip</code> 不会移除 .text 的机器码，但会移除函数名符号表，
        让反汇编里只剩 <code className="inline">FUN_00401132</code> 这种占位。
      </>,
    },
    {
      id: 'elf-data',
      term: 'ELF .data / .bss / .rodata',
      body: <>
        <b>.data</b> 已初始化可写全局变量（RW-）；<b>.bss</b> 未初始化全局变量（也是 RW-，但不占文件空间，运行时清零）；
        <b>.rodata</b> 只读常量区（R--），字符串字面量、<code className="inline">printf("hello")</code> 的 "hello" 就在这里。
        三者顺序通常是 .rodata → .data → .bss。
      </>,
    },
    {
      id: 'elf-plt-got',
      term: 'ELF .plt / .got / .got.plt（动态链接）',
      body: <>
        <b>.plt</b> 过程链接表：调用外部函数时先跳 PLT 条目，再去 .got.plt 查真实地址。
        <b>.got</b> 存放外部全局变量地址；<b>.got.plt</b> 存放外部函数地址。
        延迟绑定：首次调用走 <code className="inline">dlresolve</code> 填充 GOT，后续直接从 GOT 取值；
        <code className="inline">RELRO|BIND_NOW</code> 则在启动时一次性解析完。
      </>,
    },
    {
      id: 'elf-symtab',
      term: 'ELF 符号表 .symtab / .dynsym / .strtab',
      body: <>
        <b>.symtab</b> 完整静态符号表（函数名、变量名、类型）；<b>.dynsym</b> 仅动态链接相关的导出符号（比 .symtab 小得多）；
        <b>.strtab</b> / <b>.dynstr</b> 存放符号名字符串。
        <code className="inline">strip</code> 只删 .symtab 不删 .dynsym，所以动态链接的函数名（如 <code className="inline">malloc</code>）永远可见。
      </>,
    },
    {
      id: 'elf-header',
      term: 'ELF Header / Program Header / Section Header',
      body: <>
        <b>ELF Header</b> 文件开头 64 字节（64 位），魔数 <code className="inline">\x7fELF</code>、架构（x86-64 = <code className="inline">EM_X86_64</code>）、类型（ET_EXEC / ET_DYN）。
        <b>Program Header</b> 告诉内核如何把文件映射成进程地址空间（LOAD 段、INTERP 段指向 ld-linux）。
        <b>Section Header</b> 编译链接用，运行时几乎不参与；section header 为空时 <code className="inline">objdump</code> 照样能反汇编。
      </>,
    },
    {
      id: 'elf-init-fini',
      term: 'ELF .init / .fini / .init_array / .fini_array',
      body: <>
        <b>.init</b> 旧版单函数初始化代码（构造器）；<b>.fini</b> 单函数析构器。
        <b>.init_array</b> 现代方式——指向函数指针的数组（包括 C++ 全局构造、<code className="inline">__attribute__((constructor))</code>）；
        <b>.fini_array</b> 对应析构器数组。优先级数字越小越早执行。
      </>,
    },
    {
      id: 'elf-pie',
      term: 'ELF 类型 ET_EXEC / ET_DYN / PIE',
      body: <>
        <b>ET_EXEC</b> 固定地址可执行文件，反汇编里 <code className="inline">0x401000</code> 这种地址是硬编码的。
        <b>ET_DYN</b> 共享库（.so）或 PIE 可执行文件，地址都是相对偏移，运行时 ASLR 决定最终基址。
        <code className="inline">file binary</code> 输出 "pie executable" 表示已开启 PIE，意味着 .text 基址也每次随机化。
      </>,
    },
  ],
};

const groupB: { title: string; entries: Entry[] } = {
  title: 'B 组 · 汇编 / 调用 / 栈',
  entries: [
    {
      id: 'x86-call',
      term: 'x86-64 call / ret 约定',
      body: <>
        <code className="inline">call func</code> = push rip（下一条指令地址）+ 跳转到 func；
        <code className="inline">ret</code> = pop rip。这就是"覆盖 ret = 控制 RIP"的源头。
        x86-64 System V ABI 约定：前 6 个整数参数放 <code className="inline">rdi,rsi,rdx,rcx,r8,r9</code>，
        超过的放栈上；返回值 rax；call 要保证栈 16 字节对齐。
      </>,
    },
    {
      id: 'x86-frame',
      term: 'x86-64 栈帧（rbp / rsp / leave）',
      body: <>
        <b>rbp</b> 指向当前栈帧底部（base pointer），<b>rsp</b> 指向栈顶（stack pointer）。
        函数进入时 <code className="inline">push rbp; mov rbp, rsp</code> 保存旧 rbp 建立新帧；
        返回前 <code className="inline">leave</code> = <code className="inline">mov rsp, rbp; pop rbp</code> 恢复。
        -O2 优化可能省略 rbp 帧指针（<code className="inline">-fno-omit-frame-pointer</code> 强制保留）。
      </>,
    },
    {
      id: 'x86-reg',
      term: 'x86-64 寄存器分类',
      body: <>
        <b>通用寄存器</b>：rax/rbx/rcx/rdx/rsi/rdi/rbp/rsp + r8-r15（共 16 个），每个都可作 64/32/16/8 位访问。
        <b>标志寄存器</b>：rflags，常见标志 ZF（零）、CF（进位）、OF（溢出）、SF（符号）由 <code className="inline">cmp/test</code> 设置。
        <b>段寄存器</b>：fs/gs 在 Linux 下分别指向 TLS（<code className="inline">fs:0x28</code> = 主金丝雀）和内核结构体。
      </>,
    },
    {
      id: 'x86-leą',
      term: 'x86-64 lea / mov / cmov 区别',
      body: <>
        <code className="inline">{'lea rax, [rbx + rcx*8 + 0x10]'}</code> = 计算地址但不访存，常用于高效的整数乘加（编译器把 <code className="inline">{'x*9+16'}</code> 变成 lea）。
        <code className="inline">mov rax, [rbx]</code> = 真正从内存读值；<code className="inline">mov rax, 0x42</code> 才是立即数赋值。
        <code className="inline">cmovne rax, rbx</code> 条件 mov（无分支），依赖上一条 cmp/test 设的标志。
      </>,
    },
    {
      id: 'x86-prologue',
      term: 'x86-64 函数序言与尾声',
      body: <>
        <b>序言 prologue</b>：典型 <code className="inline">push rbp; mov rbp, rsp; sub rsp, 0x30</code>——保存旧帧、建新帧、分配局部变量空间。
        <b>尾声 epilogue</b>：<code className="inline">add rsp, 0x30; leave; ret</code>——释放局部变量、恢复旧帧、返回。
        反汇编里靠这些模式识别函数边界；编译器选项 <code className="inline">-fstack-protector</code> 会在序言里插入金丝雀。
      </>,
    },
    {
      id: 'x86-branch',
      term: 'x86-64 分支指令（jmp / jcc / cmp / test）',
      body: <>
        <code className="inline">jmp label</code> 无条件跳转；<b>jcc</b> 条件跳转（je/jne/jl/jg/ja/jb/jle/jge 等 30+ 种），依据 rflags。
        <code className="inline">cmp rax, rbx</code> = 内部做 <code className="inline">rax - rbx</code> 不存结果只设标志；
        <code className="inline">test rax, rbx</code> = 内部做 <code className="inline">rax &amp; rbx</code>，常用于判零（test rax, rax），比 cmp 更快。
      </>,
    },
    {
      id: 'x86-rip-rel',
      term: 'x86-64 rip-relative 寻址',
      body: <>
        绝大多数内存引用用 <code className="inline">[rip + offset]</code> 形式——<b>相对下一条指令地址的偏移</b>，不是绝对地址。
        这就是 PIE 能工作的原因：不管基址是什么，rip-relative 的偏移都不变。
        反汇编里 <code className="inline">lea rax, [rip-0x12345]</code> 等于取某个全局变量的运行时真实地址。
      </>,
    },
  ],
};

const groupC: { title: string; entries: Entry[] } = {
  title: 'C 组 · 防护 / 利用 / 堆 / 格式化字符串',
  entries: [
    {
      id: 'canary',
      term: 'Stack Canary 原理',
      body: <>
        编译时在每个栈帧里插入一个随机值（<code className="inline">fs:0x28</code> 指向的主金丝雀），位于 saved rbp 下方。
        函数返回前 <code className="inline">stack_chk_fail()</code> 校验它——
        只要溢出越过了它就必触发 <code className="inline">stack smashing detected</code>。
        绕过思路：泄露金丝雀值（格式化字符串 / 信息泄露）、fork 服务器逐字节爆破、覆写 TLS 主金丝雀。
      </>,
    },
    {
      id: 'nx',
      term: 'NX 位 / ASLR / PIE',
      body: <>
        <b>NX</b>（Execute Disable）：让栈和堆页权限变为 RW-，shellcode 放上去不会执行。
        <b>ASLR</b>：内核每次启动随机化 libc、main、mmap 区域基址，32 位熵低可爆破，64 位必须泄露一个地址算基址。
        <b>PIE</b>：主程序代码段也参与随机化，硬编码的 gadget / .text 地址全失效。
      </>,
    },
    {
      id: 'glibc',
      term: 'glibc malloc（arena / bin / tcache）',
      body: <>
        <b>arena</b> 每个线程一个堆上下文；<b>bin</b> 分 fastbins（单向链表 7 个尺寸 0x10-0x80）、unsorted bin、small/large bin。
        <b>tcache</b> glibc 2.26+ 每线程独立 7 个桶，优先匹配，Double Free 经典目标。
        每个 chunk 开头有 <code className="inline">size</code> 字段；free 状态有 <code className="inline">fd/bk</code> 指针
        （2.32+ safe-linking 把它们异或 main_arena 地址）。
      </>,
    },
    {
      id: 'vtable',
      term: 'C++ 虚表布局',
      body: <>
        C++ 类对象的第一个字段是指向<b>虚函数表</b>的指针——连续存放函数地址的数组。
        <code className="inline">{'obj->method()'}</code> 实际等价于
        <code className="inline">{'((void(*)())(*obj)[index])()'}</code>。
        虚表劫持就是把 <code className="inline">{'*obj'}</code> 这块指针数组的某个项换成攻击者控制的地址。
      </>,
    },
    {
      id: 'fmt',
      term: 'printf 格式串参数详解',
      body: <>
        printf 遇到 <code className="inline">%d %s %x %p %n</code> 时，会把下一个参数从栈上取出来——
        如果你没传那个参数，printf 就直接读栈上"碰巧在那里的东西"。
        <code className="inline">%p</code> 泄露栈上的指针（信息泄露）；
        <code className="inline">%n</code> 把"已经输出的字符数"写到指定的任意地址（任意写）。
        审计口诀：<b>printf 第一个参数必须是字符串字面量</b>，永远不要把用户输入当格式串。
      </>,
    },
    {
      id: 'overflow',
      term: '栈溢出（Stack Buffer Overflow）',
      body: <>
        向局部缓冲区写入超过分配长度的数据，覆盖相邻栈帧内容。典型覆盖顺序：buffer → saved rbp → saved rip。
        不开启 Canary 时，覆盖 saved rip = 控制 EIP/RIP，直接跳到 shellcode 或 gadget。
        <code className="inline">gets(buf)</code>、<code className="inline">strcpy(buf, src)</code> 是高危函数；
        <code className="inline">strncpy</code> / <code className="inline">snprintf</code> 只是缓解不是根治。
      </>,
    },
    {
      id: 'heap-overflow',
      term: '堆溢出（Heap Buffer Overflow）',
      body: <>
        向一个 heap chunk 写入超过其 size 的数据，覆盖下一个 chunk 的 <code className="inline">size</code>、<code className="inline">fd/bk</code> 指针、
        甚至相邻的 meta-data。glibc 检查并不严格——只要 size 字段低位 <code className="inline">PREV_INUSE</code> 位满足预期，
        unlink 时就信任 fd/bk。堆溢出可以改 chunk 指针实现任意写，比栈溢出灵活但利用更复杂。
      </>,
    },
    {
      id: 'uaf',
      term: 'Use After Free（释放后使用）',
      body: <>
        指针 <code className="inline">p</code> 指向堆对象，<code className="inline">free(p)</code> 后代码又通过 <code className="inline">{'p->field'}</code> 访问——
        glibc 释放会把 chunk 放回 bin 链表，里面可能残留或被覆盖。
        典型打法：free 一个 chunk → 申请同尺寸的新 chunk 拿到同一块地址 → 新内容覆盖原对象的虚函数表或函数指针 → 调用时劫持。
        C++ 里对虚函数表 UAF 特别致命（<code className="inline">{'obj->vtable'}</code> 被覆盖）。
      </>,
    },
    {
      id: 'double-free',
      term: 'Double Free（重复释放）',
      body: <>
        同一个指针 <code className="inline">p</code> 被 <code className="inline">free(p); free(p)</code> 释放两次。
        tcache 里同一个 chunk 被放进同一个桶两次——下次 <code className="inline">malloc</code> 会把它连吐两次，
        让攻击者拿到两个指向同一地址的指针。一个当傀儡改 fd，一个用来触发任意地址 malloc。
        safe-linking（glibc 2.32+）给 tcache 的 fd 做异或加密，但泄露 key 或改单链表头部仍可绕过。
      </>,
    },
    {
      id: 'tcache-poison',
      term: 'tcache poisoning / house of tcache',
      body: <>
        tcache bin 是 7 个独立单向链表，<code className="inline">malloc</code> 直接弹 head，<code className="inline">free</code> 直接插 head。
        <b>tcache poisoning</b>：改 tcache 某条链表的 head 指针，下次 malloc 就返回任意地址（条件是 size 匹配）。
        <b>House of Tcache</b>：利用 tcache 可以跨线程修改全局结构的特性，配合 UAF 泄露 fd 地址后覆写。
      </>,
    },
    {
      id: 'unsorted-bin-attack',
      term: 'Unsorted Bin Attack',
      body: <>
        glibc 释放的大块（fastbin 装不下）先进入 unsorted bin——双向链表。
        攻击思路：控制一个 chunk 的 <code className="inline">bk</code> 指针指向任意地址 X，
        下次 unsorted bin 处理时 <code className="inline">{'*X = main_arena + 0x10'}</code>，即向任意地址写入一个 libc 地址。
        经典用途：覆写 <code className="inline">__free_hook</code>、<code className="inline">malloc_hook</code> 或 GOT 表项。
        条件：需要泄露 libc 基址（算 main_arena）。
      </>,
    },
    {
      id: 'fastbin-corruption',
      term: 'Fastbin Corruption',
      body: <>
        fastbin 是单向链表（只有 fd 没有 bk），释放时插入 head，malloc 从 head 弹。
        攻击：把一个已释放 fastbin chunk 的 fd 字段改成目标地址 X，下次同尺寸 malloc 先返回原 chunk，再返回 X。
        限制：glibc 会检查 <code className="inline">{'(unsigned long) &chunk & 0xF == 0'}</code>（16 字节对齐）。
        经典场景：double free 在 fastbin 上 = 同一个 chunk 两次入链 → malloc 连吐两个 → 第二个当跳板。
      </>,
    },
    {
      id: 'rop',
      term: 'ROP / Return Oriented Programming',
      body: <>
        用 gadgets（代码库里现成的短小指令片段，以 <code className="inline">ret</code> 结尾）串起攻击链。
        原理：栈溢出覆盖 saved rip 指向 gadget1，gadget1 的 ret 又弹回 gadget2……
        常见 gadget：<code className="inline">pop rdi; ret</code>（给 rdi 装参数）、<code className="inline">pop rdx; pop r12; ret</code>（装双参数）。
        ROP 取代了传统 shellcode，因为 NX 位让栈不可执行；mprotect RWX 然后跳过去（stack pivot）是经典思路。
      </>,
    },
    {
      id: 'relro',
      term: 'RELRO / BIND_NOW / full RELRO',
      body: <>
        <b>Partial RELRO</b>：启动时把 GOT 标记为只读（<code className="inline">mprotect(GOT, R--)</code>），
        防止运行时覆写 GOT 表项劫持外部函数调用。
        <b>Full RELRO = Partial + BIND_NOW</b>：启动时一次性解析所有动态符号（<code className="inline">LD_BIND_NOW=1</code>），
        之后 GOT 永远只读。绕过：ROP 链里直接 <code className="inline">dlresolve</code> 找地址再调。
        编译标志 <code className="inline">-Wl,-z,relro,-z,now</code>。
      </>,
    },
  ],
};

const allGroups = [groupA, groupB, groupC];
const totalEntries = groupA.entries.length + groupB.entries.length + groupC.entries.length;

export const metadata = {
  title: '概念 Glossary · 逆向工作台',
  description: `原理图解里提到的 ELF 格式 / x86 调用约定 / Canary / glibc 堆 / ROP 等 ${totalEntries} 个核心概念速查。`,
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
        分三组逻辑递进：ELF 格式 → 汇编调用 → 防护利用。共 {totalEntries} 个条目。
      </p>

      <div className="space-y-12">
        {allGroups.map((group) => (
          <section key={group.title}>
            <h2 className="font-mono text-[11px] tracking-widest uppercase text-[var(--brand-500)] mb-4">
              {group.title}
            </h2>

            <dl className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
              {group.entries.map((e) => (
                <div key={e.id} id={e.id} className="scroll-mt-24 px-5 py-4">
                  <dt className="font-mono text-[13px] text-[var(--text)] mb-1.5">
                    <a href={`#${e.id}`} className="text-[var(--text-soft)] mr-2 font-normal">{e.id}</a>
                    <strong>{e.term}</strong>
                  </dt>
                  <dd className="text-[13.5px] text-[var(--text-muted)] leading-relaxed">{e.body}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-[var(--border)]">
        <Link href="/reference" className="font-mono text-[12px] text-[var(--brand-500)] hover:underline decoration-dotted underline-offset-4">
          ← 回到工作台首页
        </Link>
      </div>
    </div>
  );
}
