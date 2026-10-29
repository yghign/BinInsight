import { RefHeader, RefSection, RefTable, RefTermList, RefCallout, RefCode, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '二进制格式 · 知识库 · BinInsight',
  description: 'ELF / PE / Mach-O 三大可执行格式的结构对照：头部、节区、段与加载视图。',
};

export default function FormatsPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="Binary Formats"
        title="二进制格式"
        desc="可执行文件不只是机器码的堆砌 —— 它有严格的格式约定。理解 ELF / PE / Mach-O 的结构，是定位代码、数据、导入表与漏洞点的前提。"
      />

      {/* 1. ELF 头部 */}
      <RefSection num="01" title="ELF 头部：文件的身份证">
        <P>
          ELF（Executable and Linkable Format）是 Linux 与大多数 Unix 系统的可执行格式。
          前 64 字节是 <B>ELF Header</B>，描述文件类型、架构、入口地址与各表的位置。
        </P>
        <RefTable
          columns={['字段', '偏移', '说明']}
          rows={[
            [<C key="1">e_ident[0:4]</C>, '0x00', '魔数 0x7F \'E\' \'L\' \'F\' —— file 命令靠它识别格式'],
            [<C key="2">e_ident[4]</C>, '0x04', '位宽：1 = 32 位，2 = 64 位'],
            [<C key="3">e_ident[5]</C>, '0x05', '字节序：1 = 小端，2 = 大端'],
            [<C key="4">e_type</C>, '0x10', 'ET_EXEC 可执行 / ET_DYN 共享库或 PIE / ET_REL 可重定位'],
            [<C key="5">e_machine</C>, '0x12', '架构：0x3E = x86-64，0xB7 = AArch64，0x28 = ARM'],
            [<C key="6">e_entry</C>, '0x18', '程序入口虚拟地址 —— 执行从这里开始'],
            [<C key="7">e_phoff</C>, '0x20', '程序头表（Program Headers）的文件偏移'],
            [<C key="8">e_shoff</C>, '0x28', '节区头表（Section Headers）的文件偏移'],
          ]}
        />
        <RefCallout tone="brand" title="ET_EXEC vs ET_DYN —— 一眼判断 PIE">
          <p>
            用 <C>readelf -h</C> 看 e_type：ET_EXEC 表示传统固定地址可执行文件；
            ET_DYN 表示 PIE（位置无关可执行），加载基址由 ASLR 随机化。
            这直接决定了利用时能否使用硬编码地址。
          </p>
        </RefCallout>
      </RefSection>

      {/* 2. 节区 */}
      <RefSection num="02" title="节区（Sections）：链接视图的骨架">
        <P>
          节区是<B>链接器</B>看到的结构。逆向时最常打交道的是这些：
        </P>
        <RefTermList
          items={[
            { term: '.text', accent: 'var(--accent-cyan)', desc: '可执行代码。反汇编的主要对象，权限 R-X（可读可执行不可写 —— NX 的基础）。' },
            { term: '.rodata', desc: '只读常量：字符串字面量、跳转表、常量数组。找字符串引用就来这里。' },
            { term: '.data', desc: '已初始化的全局 / 静态变量，权限 RW-。' },
            { term: '.bss', desc: '未初始化的全局 / 静态变量。文件中不占空间，加载时由内核清零。' },
            { term: '.plt', accent: 'var(--accent-orange)', desc: '过程链接表 —— 调用外部库函数的跳板。call puts@plt 实际跳到 .plt 里的一小段代码。' },
            { term: '.got', accent: 'var(--accent-orange)', desc: '全局偏移表 —— 存放库函数的真实地址。延迟绑定时首次调用后由动态链接器回填；劫持 GOT 是经典利用手法。' },
            { term: '.dynamic', desc: '动态链接信息：依赖的共享库、符号表 / 字符串表位置等。' },
            { term: '.symtab', desc: '符号表：函数与变量的名字和地址。strip 后被移除，逆向难度大增。' },
            { term: '.init / .fini', desc: '程序初始化与收尾代码，main 之前 / 之后执行。' },
          ]}
        />
        <RefCode
          title="查看节区表"
          badge="bash"
          language="bash"
          code={`$ readelf -S ./vuln
[Nr] Name    Type    Address          Offset  Size     Flags
[13] .text   PROGBITS 0000000000401060 001060  0001a2   AX
[15] .rodata PROGBITS 0000000000402000 002000  00004b   A
[23] .got    PROGBITS 0000000000403fc0 002fc0  000040   WA`}
        />
      </RefSection>

      {/* 3. 程序头 */}
      <RefSection num="03" title="程序头（Segments）：加载视图的地图">
        <P>
          段是<B>加载器</B>看到的结构：内核按程序头把文件映射进内存。
          多个节区归入一个段；段的权限标志（R/W/X）决定内存页属性。
        </P>
        <RefTable
          columns={['类型', '含义', '典型内容']}
          rows={[
            ['PT_LOAD', '需要映射进内存的段', '代码段（R-X，含 .text）、数据段（RW-，含 .data/.bss）'],
            ['PT_DYNAMIC', '动态链接信息', '.dynamic 节区'],
            ['PT_INTERP', '动态链接器路径', '通常是 /lib64/ld-linux-x86-64.so.2'],
            ['PT_GNU_STACK', '栈的属性', 'flag 为 RW 即 NX 开启；RWX 则栈可执行'],
            ['PT_GNU_RELRO', 'RELRO 保护范围', '重定位后应设为只读的区域（含 .got）'],
          ]}
        />
        <P>
          <B>关键直觉</B>：节区给链接器用，段给加载器用。
          strip 可以删掉整个节区头表，程序照常运行 —— 因为加载只看段。
        </P>
      </RefSection>

      {/* 4. PE */}
      <RefSection num="04" title="PE 结构速览（Windows）">
        <P>
          PE（Portable Executable）是 Windows 的可执行格式，.exe / .dll 都是它。
          结构与 ELF 对应，但术语不同。
        </P>
        <RefTermList
          items={[
            { term: 'DOS Header', desc: '以 "MZ"（0x4D 0x5A）开头的兼容头。e_lfanew 字段指向真正的 PE 头。' },
            { term: 'PE Signature', desc: '"PE\\0\\0" 四字节签名，标志 PE 头开始。' },
            { term: 'COFF Header', desc: '机器类型（0x8664 = x64）、节区数量、时间戳等。' },
            { term: 'Optional Header', accent: 'var(--accent-cyan)', desc: '并不"可选"：入口点 AddressOfEntryPoint、镜像基址 ImageBase、子系统（控制台/GUI）都在这里。' },
            { term: 'Section Table', desc: '.text（代码）、.rdata（只读数据 / 导入导出表）、.data（可写数据）、.rsrc（资源：图标、字符串、清单）。' },
            { term: 'Import Table', accent: 'var(--accent-orange)', desc: '导入表：声明依赖的 DLL 与函数。等价于 ELF 的 PLT/GOT 机制，是定位 API 调用（如 VirtualProtect）的入口。' },
            { term: 'Export Table', desc: '导出表：DLL 对外提供的函数列表。' },
          ]}
        />
      </RefSection>

      {/* 5. Mach-O + 对比 */}
      <RefSection num="05" title="Mach-O 与三格式对照">
        <P>
          Mach-O 是 macOS / iOS 的格式：以魔数 <C>0xFEEDFACF</C>（64 位）开头，
          由 Header、Load Commands（加载命令，对应 ELF 程序头）与若干 Section 组成。
          常见段：<C>__TEXT</C>（代码与只读数据）、<C>__DATA</C>（可写数据）。
        </P>
        <RefTable
          columns={['维度', 'ELF (Linux)', 'PE (Windows)', 'Mach-O (macOS)']}
          rows={[
            ['魔数', "0x7F 'ELF'", "'MZ' + 'PE\\0\\0'", '0xFEEDFACF'],
            ['代码区', '.text', '.text', '__text'],
            ['只读数据', '.rodata', '.rdata', '__const / __cstring'],
            ['动态库调用', 'PLT / GOT', 'Import Table (IAT)', '__stubs / __la_symbol_ptr'],
            ['查看工具', 'readelf / objdump', 'PE-bear / CFF Explorer', 'otool / MachOView'],
            [' PIE 判断', 'e_type = ET_DYN', 'DllCharacteristics 含 DYNAMIC_BASE', 'header.flags 含 MH_PIE'],
          ]}
          monoCols={[0]}
        />
        <RefCallout tone="purple" title="动手建议">
          <p>
            用 <C>readelf -h -S -l ./vuln</C> 完整看一遍教学第 1 步生成的示例程序，
            对照本表找到每个字段 —— 亲手查过一次，表格才会变成直觉。
          </p>
        </RefCallout>
      </RefSection>

      <RefPager next={{ slug: 'isa', title: '指令集速查' }} />
    </div>
  );
}
