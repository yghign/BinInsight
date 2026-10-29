import { RefHeader, RefSection, RefTable, RefTermList, RefCallout, RefCode, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '动态分析 · 知识库 · BinInsight',
  description: 'GDB 命令速查、pwndbg 增强、Frida Hook 模板、strace/ltrace 与反调试对抗。',
};

export default function DynamicPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="Dynamic Analysis"
        title="动态分析"
        desc="GDB 命令速查、Frida 脚本模板、strace/ltrace 与反调试对抗。"
      />

      {/* 1. GDB 速查 */}
      <RefSection num="01" title="GDB 核心命令速查">
        <P>
          GDB 是 Linux 动态分析的基石：断点、单步、查内存、改寄存器，全靠这一张表。
          常用命令都有单字母缩写 —— 练出肌肉记忆，调试速度翻倍。
        </P>
        <RefTable
          columns={['命令', '缩写', '作用']}
          monoCols={[0, 1]}
          rows={[
            [<C key="1">run</C>, <C key="a1">r</C>, '启动被调试程序（可附加命令行参数与输入重定向）'],
            [<C key="2">b *0x401234 / b main</C>, <C key="a2">b</C>, '下断点：地址前要加 *，函数名直接给'],
            [<C key="3">continue</C>, <C key="a3">c</C>, '继续执行，直到下一个断点或程序结束'],
            [<C key="4">next</C>, <C key="a4">n</C>, '单步步过 —— 不进入函数内部'],
            [<C key="5">step</C>, <C key="a5">s</C>, '单步步入 —— 跟进函数内部'],
            [<C key="6">finish</C>, <C key="a6">fin</C>, '执行到当前函数返回，并打印返回值'],
            [<C key="7">x/8gx $rsp</C>, '—', '查看内存：8 个 64 位十六进制字；x/s 看字符串，x/i 看指令'],
            [<C key="8">disas main</C>, '—', '反汇编指定函数'],
            [<C key="9">info registers</C>, <C key="a9">i r</C>, '查看全部寄存器当前值'],
            [<C key="10">bt</C>, '—', '栈回溯：打印完整调用链，定位崩溃来源'],
            [<C key="11">info proc mappings</C>, '—', '查看进程内存映射 —— 找栈、堆与 libc 基址'],
            [<C key="12">set $rip = 0x401234</C>, '—', '直接改写寄存器 —— 手工验证控制流劫持'],
            [<C key="13">watch secret</C>, <C key="a13">wa</C>, '硬件观察点：变量被读 / 写时自动中断'],
            [<C key="14">catch syscall</C>, '—', '在系统调用发生时中断（可指定调用名，如 catch syscall execve）'],
          ]}
        />
      </RefSection>

      {/* 2. pwndbg / GEF */}
      <RefSection num="02" title="pwndbg / GEF 增强">
        <P>
          GDB 裸用效率低：界面原始、没有上下文。
          <B>装一个增强插件（pwndbg 或 GEF，二选一）是动态分析的第一步</B> ——
          每次断下自动展示寄存器、反汇编与栈内容。
        </P>
        <RefTermList
          items={[
            { term: 'checksec', desc: '调试会话中直接查看二进制防护（Canary / NX / PIE / RELRO），不必退出另开终端。' },
            { term: 'vmmap', desc: '彩色内存映射图：栈、堆、libc、二进制各自的地址范围与权限一目了然。' },
            { term: 'telescope $rsp', accent: 'var(--accent-cyan)', desc: '智能解引用栈顶内容：指针、字符串、代码地址自动识别，并标注指向哪个区段。' },
            { term: 'search "/bin/sh"', desc: '在整个进程内存中搜索字符串或字节模式 —— 构造 ret2libc 时找素材就靠它。' },
            { term: 'ropper', desc: '调试中直接调用 ropper 找 gadget，结果自动按当前 ASLR 基址重定位成真实地址。' },
          ]}
        />
      </RefSection>

      {/* 3. Frida */}
      <RefSection num="03" title="Frida Hook 模板">
        <P>
          Frida 用 JavaScript 在运行时注入 hook：不用断点、不用重启进程，
          适合批量观测参数、篡改返回值、追踪无符号内部函数。
        </P>
        <RefCode
          title="hook.js —— 拦截 libc 导出函数"
          badge="javascript"
          language="javascript"
          code={`// hook.js —— 拦截 strcpy，打印每次调用的参数
Interceptor.attach(Module.findExportByName(null, 'strcpy'), {
  onEnter(args) {
    // args 是 NativePointer 数组：args[0] = 目标缓冲区，args[1] = 源字符串
    console.log('[strcpy] dst = ' + args[0] + '  src = ' + args[1].readCString());
  },
  onLeave(retval) {
    console.log('[strcpy] return = ' + retval);
  },
});`}
        />
        <RefCode
          title="启动目标程序并注入脚本"
          badge="bash"
          language="bash"
          code={`$ frida -f ./vuln -l hook.js
# 程序以挂起状态启动，脚本加载完成后输入 %resume 继续运行`}
        />
        <RefCode
          title="hook 无符号内部函数：基址 + 偏移"
          badge="javascript"
          language="javascript"
          code={`// strip 后的二进制没有符号名 —— 从静态反汇编拿到函数偏移，
// 运行时加在 ASLR 之后的加载基址上
const base = Module.getBaseAddress('vuln');
const target = base.add(0x11a9);            // 0x11a9 = 静态分析得到的函数偏移
Interceptor.attach(target, {
  onEnter(args) {
    console.log('hit internal_func, arg0 = ' + args[0]);
  },
});`}
        />
        <P>
          有符号的库函数用 <C>findExportByName</C>，无符号的内部函数用基址 + 偏移
          —— 两条路覆盖绝大多数 hook 场景。
        </P>
      </RefSection>

      {/* 4. strace / ltrace */}
      <RefSection num="04" title="strace / ltrace：不开调试器的行为速览">
        <P>
          只想快速摸清程序在做什么，两条命令足够：
          <B>strace 看系统调用</B>（程序与内核的交互：文件、网络、进程），
          <B>ltrace 看动态库调用</B>（strcmp / strcpy 的参数与返回值，密码比对逻辑常能一眼看穿）。
        </P>
        <RefCode
          title="strace —— 跟踪系统调用（-f 连带子进程）"
          badge="bash"
          language="bash"
          code={`$ strace -f -e trace=execve,openat ./vuln
execve("./vuln", ["./vuln"], 0x7ffd2c1a9b10 /* 24 vars */) = 0
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
openat(AT_FDCWD, "./input.txt", O_RDONLY) = -1 ENOENT (没有那个文件或目录)
+++ exited with 1 +++`}
        />
        <RefCode
          title="ltrace —— 跟踪库函数调用"
          badge="bash"
          language="bash"
          code={`$ ltrace ./vuln
strcpy(0x7ffc91a2b000, "AAAAAAAA")     = 0x7ffc91a2b000
strcmp("s3cr3t", "AAAA")               = 32
puts("access denied")                  = 14
+++ exited (status 1) +++`}
        />
        <P>
          上面这段 ltrace 输出直接暴露了硬编码口令 <C>s3cr3t</C> ——
          很多 crackme 不用开反汇编，跑一遍 ltrace 就结束了。
        </P>
      </RefSection>

      {/* 5. 反调试与对抗 */}
      <RefSection num="05" title="反调试与对抗">
        <P>
          恶意软件与加壳程序常主动检测调试器。先认识这些手法，对抗时才知道该 patch 哪里。
        </P>
        <RefTable
          columns={['技术', '原理', '对抗手段']}
          monoCols={[]}
          rows={[
            ['ptrace 自检', '进程调用 ptrace(PTRACE_TRACEME) 抢先附加自己 —— 一个进程同一时刻只能被一个 tracer 附加，外部调试器随后必失败', 'patch 掉返回值检查分支；或用 LD_PRELOAD 劫持 ptrace，恒返回 0'],
            ['TracerPid 检查', '读 /proc/self/status 中的 TracerPid 字段，非 0 即正被调试', 'patch 比较分支；或劫持 open / read，喂入伪造的状态内容'],
            ['int3 扫描', '遍历自身代码段查找 0xCC 字节 —— 软断点落进去就会留下痕迹', '改用硬件断点（dr0-dr3，不修改代码）；或 patch 扫描函数'],
            ['时间差检测', 'rdtsc / clock_gettime 前后各取一次时间戳，单步执行会把差值拉大几个数量级', '静态定位后一次性 patch 判断分支'],
            ['父进程检查', 'getppid 后读 /proc/<ppid>/comm，发现父进程是 gdb / strace 立即退出', '给调试器可执行文件改名；或 patch 字符串比较逻辑'],
          ]}
        />
        <RefCallout tone="orange" title="通用对抗思路">
          <p>
            对抗反调试的通用思路是<B>先静态定位检测点，再选择性 patch</B>：
            静态分析把所有检测分支找齐，动态运行时逐个验证与绕过 —— 静动结合，缺一不可。
          </p>
        </RefCallout>
      </RefSection>

      <RefPager
        prev={{ slug: 'protections', title: '防护与对抗' }}
        next={{ slug: 'exploit', title: '利用开发' }}
      />
    </div>
  );
}
