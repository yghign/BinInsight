import { RefHeader, RefSection, RefTable, RefTermList, RefCallout, RefCode, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '防护与对抗 · 知识库 · BinInsight',
  description: 'Canary / NX / ASLR / PIE / RELRO / FORTIFY / CFI 的原理、开启方式、检查命令与主流绕过思路。',
};

export default function ProtectionsPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="Mitigations & Bypasses"
        title="防护与对抗"
        desc="现代二进制防护是一层层叠起来的：每一层只解决一类问题，也各有已知绕过。会看 checksec、懂每层的边界，才能判断一个漏洞「还够不够打」。"
      />

      {/* 1. 防护速查总表 */}
      <RefSection num="01" title="防护速查总表">
        <P>
          拿到目标二进制，先对照这张表逐项确认防护状态 —— 它决定了后续利用路线的选择空间。
        </P>
        <RefTable
          columns={['机制', '保护对象', '开启方式（编译选项）', '检查命令']}
          rows={[
            ['Stack Canary', '栈上返回地址前的金丝雀值', '-fstack-protector-strong', 'checksec / 反汇编找 __stack_chk_fail'],
            ['NX', '栈与堆的可执行权限', '-z noexecstack（现代默认）', 'checksec / readelf -l 看 GNU_STACK'],
            ['ASLR', '栈、堆、共享库的加载基址', '内核 /proc/sys/kernel/randomize_va_space', 'cat /proc/sys/kernel/randomize_va_space'],
            ['PIE', '主程序的加载基址', '-pie -fPIE', 'checksec / readelf -h 看 ET_DYN'],
            ['RELRO Partial', '.got 等重定位区域部分只读', '-z relro', 'checksec 显示 Partial RELRO'],
            ['RELRO Full', 'GOT 整体只读、启动即全量绑定', '-z relro -z now', 'checksec 显示 Full RELRO'],
            ['FORTIFY_SOURCE', '已知长度的内存 / 字符串调用', '-D_FORTIFY_SOURCE=2 -O2', '反汇编找 __strcpy_chk 等符号'],
            ['CFI / CET', '间接跳转目标与返回地址', '-fsanitize=cfi / Intel CET', 'checksec -f / 看 endbr64 指令与 IBT/SHSTK'],
          ]}
        />
      </RefSection>

      {/* 2. checksec 输出解读 */}
      <RefSection num="02" title="checksec 输出解读">
        <P>
          <C>checksec</C>（pwntools 自带）是评估防护的第一条命令。一行输出浓缩了整个利用难度：
        </P>
        <RefCode
          title="典型的全防护目标"
          badge="bash"
          language="bash"
          code={`$ checksec --file=vuln
[*] '/home/ctf/vuln'
    Arch:     amd64-64-little
    RELRO:    Full RELRO      # GOT 只读，GOT 覆写这条路被封死
    Stack:    Canary found    # 栈溢出需先泄露或绕过金丝雀
    NX:       NX enabled      # 栈/堆不可执行，shellcode 直接没戏
    PIE:      PIE enabled     # 主程序基址随机化，gadget 地址需先泄露`}
        />
        <P>
          逐列看：<B>RELRO</B> 决定 GOT 是否可写；<B>Canary</B> 决定栈溢出能否直接覆盖返回地址；
          <B>NX</B> 决定能否执行注入的 shellcode（不能则走 ROP）；<B>PIE</B> 决定主程序地址是否可硬编码
          （不能则需先泄露一个主程序内地址反推基址）。四项全开是当下发行版的默认水位。
        </P>
      </RefSection>

      {/* 3. 逐项原理与绕过 */}
      <RefSection num="03" title="逐项原理与绕过">
        <RefTermList
          items={[
            {
              term: 'Canary',
              accent: 'var(--accent-purple)',
              desc: '原理：函数入口在返回地址前压入一个随机金丝雀值，返回前校验，被踩坏就 __stack_chk_fail。绕过：用格式化字符串 / 信息泄露读出 canary 再原样回填；对 fork 型服务逐字节爆破（每次只崩子进程）；或直接改写 TLS 中的主金丝雀。',
            },
            {
              term: 'NX',
              accent: 'var(--accent-purple)',
              desc: '原理：栈与堆标记为不可执行（W^X），注入的 shellcode 无法运行。绕过：不注入代码而复用现有代码 —— ret2libc 调 system，或 ROP 拼接 gadget 凑出目标逻辑。',
            },
            {
              term: 'ASLR',
              accent: 'var(--accent-purple)',
              desc: '原理：内核随机化栈、堆、mmap（含 libc）的基址，硬编码地址失效。绕过：一次信息泄露算出 libc 基址即可破全局；32 位下熵只有十几位可爆破；或利用低位不变的特性做部分地址覆盖。',
            },
            {
              term: 'PIE',
              accent: 'var(--accent-purple)',
              desc: '原理：把主程序也编译成位置无关（ET_DYN），代码段基址同样随机化。绕过：思路与 ASLR 相同 —— 需先泄露一个主程序内的地址（如返回地址、GOT 项）反推基址，之后 gadget 与函数地址全部可得。',
            },
            {
              term: 'RELRO',
              accent: 'var(--accent-purple)',
              desc: '原理：Partial 时 .got.plt 仍可写，GOT 覆写劫持库函数调用依旧可行；Full 时启动即解析全部符号（BIND_NOW）并把 GOT 设为只读，GOT 覆写彻底失效。对抗转向：覆写 __free_hook / __malloc_hook（glibc ≤ 2.33）、栈上返回地址或各种函数指针。',
            },
            {
              term: 'FORTIFY',
              accent: 'var(--accent-purple)',
              desc: '原理：编译期能确定缓冲区大小时，把 strcpy / memcpy 换成 __strcpy_chk / __memcpy_chk，目标缓冲区装不下就 abort。绕过：拷贝长度或目标大小在运行时才知道的调用不受保护 —— 它只挡住"静态可知"的那部分溢出。',
            },
            {
              term: 'CFI / CET',
              accent: 'var(--accent-purple)',
              desc: '原理：CFI 校验间接跳转的目标是否在合法集合内；Intel CET 的 IBT 要求跳转目标是 endbr64，SHSTK 用影子栈保护返回地址。绕过：不碰控制流的数据-only 攻击（直接改关键数据）、或 COOP 这类整体复用合法虚表的攻击，仍能穿过前向边校验。',
            },
          ]}
        />
      </RefSection>

      {/* 4. 对抗组合速查 */}
      <RefSection num="04" title="对抗组合速查">
        <P>
          实战中防护从不单独出现。这张表反过来看：<B>每种防护的主流绕过，各自需要什么前提</B>，
          凑齐前提的过程就是在规划利用链。
        </P>
        <RefTable
          columns={['防护', '主流绕过', '前提条件']}
          rows={[
            ['Canary', '泄露金丝雀后原样回填', '需一次信息泄露（如格式化字符串读栈）'],
            ['Canary', '逐字节爆破', '需 fork 不 execve 的服务模型（子进程共享同一 canary）'],
            ['NX', 'ret2libc / ROP', '需知道可复用代码的地址（见 ASLR/PIE 行）'],
            ['ASLR', '泄露指针反推 libc 基址', '需一次信息泄露'],
            ['ASLR（32 位）', '爆破基址', '熵低，崩溃后进程能自动重启重试'],
            ['PIE', '泄露主程序地址反推基址', '需一次指向主程序的泄露（返回地址 / GOT 项）'],
            ['Full RELRO', '改写 __free_hook 等函数指针', '需任意写原语，目标 glibc ≤ 2.33'],
            ['NX + PIE', '泄露 + ROP 链', '需一次泄露 + 一次控制流劫持，两步拼链'],
          ]}
        />
      </RefSection>

      <RefCallout tone="purple" title="现代目标现状">
        <p>
          主流发行版默认全开 <B>Canary + NX + ASLR + PIE + Full RELRO</B> ——
          单一漏洞很难打穿，<B>链式利用（泄露 + 写 + 控制流）</B>成为必修课。
          下一步到 <C>/reference/exploit</C> 继续学习 ret2libc、ROP 与堆利用，把这些绕过真正拼成链。
        </p>
      </RefCallout>

      <RefPager
        prev={{ slug: 'vulns', title: '漏洞类型全谱' }}
        next={{ slug: 'dynamic', title: '动态分析' }}
      />
    </div>
  );
}
