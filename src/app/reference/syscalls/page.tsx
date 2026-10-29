import { RefHeader, RefSection, RefTable, RefCallout, RefCode, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '系统调用表 · 知识库 · BinInsight',
  description: 'Linux x86-64 常用系统调用号、参数寄存器与 shellcode 常用条目。',
};

export default function SyscallsPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="Syscall Table"
        title="系统调用表"
        desc="系统调用是用户态与内核的边界。记住调用约定与高频调用号，读 shellcode、跟 strace、分析恶意程序都用得上。"
      />

      {/* 1. 调用约定 */}
      <RefSection num="01" title="调用约定">
        <P>
          x86-64 Linux 用 <C>syscall</C> 指令陷入内核：<B>rax 放调用号</B>，参数依次放在
          <C>rdi, rsi, rdx, r10, r8, r9</C>（最多 6 个）。
          注意第 4 个参数用的是 <C>r10</C> 而不是 rcx —— syscall 指令本身会破坏 rcx 与 r11。
          返回值在 rax：负值表示 -errno（例如 -2 即 ENOENT）。
        </P>
        <RefTable
          columns={['维度', 'x86-64 syscall', '32 位 int 0x80']}
          monoCols={[1, 2]}
          rows={[
            ['陷入指令', 'syscall', 'int 0x80'],
            ['调用号寄存器', 'rax', 'eax'],
            ['参数顺序', 'rdi, rsi, rdx, r10, r8, r9', 'ebx, ecx, edx, esi, edi, ebp'],
            ['返回值', 'rax，负值 = -errno', 'eax，负值 = -errno'],
            ['被破坏的寄存器', 'rcx, r11', '无额外破坏'],
          ]}
        />
        <RefCode
          title="write(1, msg, len) 的纯汇编写法"
          badge="asm"
          language="asm"
          code={`section .text
global _start
_start:
    mov rax, 1          ; 调用号：1 = write
    mov rdi, 1          ; 参数 1：fd = 1（stdout）
    lea rsi, [rel msg]  ; 参数 2：缓冲区地址
    mov rdx, msg_len    ; 参数 3：字节数
    syscall             ; 陷入内核，返回值进 rax`}
        />
      </RefSection>

      {/* 2. 文件与 IO */}
      <RefSection num="02" title="文件与 IO">
        <RefTable
          columns={['号', '名称', '参数要点', '说明']}
          monoCols={[0, 1]}
          rows={[
            ['0', 'read', 'fd, buf, count', '从文件描述符读取最多 count 字节'],
            ['1', 'write', 'fd, buf, count', '向文件描述符写入 count 字节'],
            ['2', 'open', 'path, flags, mode', '打开文件并返回 fd；O_RDONLY = 0'],
            ['3', 'close', 'fd', '关闭文件描述符'],
            ['4', 'stat', 'path, statbuf', '获取文件元信息：大小、权限、时间戳'],
            ['8', 'lseek', 'fd, offset, whence', '移动文件读写位置'],
            ['257', 'openat', 'dirfd, path, flags, mode', '相对目录打开文件，现代程序的主流写法'],
          ]}
        />
      </RefSection>

      {/* 3. 进程控制 */}
      <RefSection num="03" title="进程控制">
        <RefTable
          columns={['号', '名称', '参数要点', '说明']}
          monoCols={[0, 1]}
          rows={[
            ['57', 'fork', '—', '复制进程：父进程返回子 PID，子进程返回 0'],
            ['59', 'execve', 'path, argv, envp', '替换当前进程镜像 —— shellcode 的核心目标'],
            ['60', 'exit', 'code', '终止当前线程'],
            ['61', 'wait4', 'pid, status, opts, rusage', '等待子进程退出并回收状态'],
            ['62', 'kill', 'pid, sig', '向进程发送信号'],
            ['39', 'getpid', '—', '获取当前进程 PID'],
            ['101', 'ptrace', 'request, pid, addr, data', '进程跟踪：调试器的基石，也是反调试的战场'],
            ['231', 'exit_group', 'code', '终止进程的全部线程'],
            ['158', 'arch_prctl', 'code, addr', '设置架构相关状态，如 TLS 的 FS 基址'],
          ]}
        />
      </RefSection>

      {/* 4. 内存与网络 */}
      <RefSection num="04" title="内存与网络">
        <RefTable
          columns={['号', '名称', '参数要点', '说明']}
          monoCols={[0, 1]}
          rows={[
            ['9', 'mmap', 'addr, len, prot, flags, fd, off', '映射内存页；prot 组合 PROT_READ|WRITE|EXEC'],
            ['10', 'mprotect', 'addr, len, prot', '修改页权限 —— 绕过 NX 时经常需要它'],
            ['11', 'munmap', 'addr, len', '解除内存映射'],
            ['12', 'brk', 'addr', '调整堆顶，malloc 的底层机制之一'],
            ['41', 'socket', 'domain, type, proto', '创建套接字；AF_INET = 2，SOCK_STREAM = 1'],
            ['42', 'connect', 'fd, addr, addrlen', '向远端发起连接 —— 反弹 shell 用它'],
            ['49', 'bind', 'fd, addr, addrlen', '绑定本地地址与端口'],
            ['50', 'listen', 'fd, backlog', '开始监听连接'],
            ['43', 'accept', 'fd, addr, addrlen', '接受连接，返回新的 fd'],
          ]}
        />
      </RefSection>

      {/* 5. Shellcode 常用 */}
      <RefSection num="05" title="Shellcode 常用">
        <RefCallout tone="green" title="execve = 59 号 —— shellcode 的核心">
          <p>
            shellcode 的经典目标是执行 <C>execve("/bin/sh", NULL, NULL)</C> 拿到交互 shell。
            整条链只做三件事：在栈上构造字符串、清零参数寄存器、把 rax 设为 59。
          </p>
        </RefCallout>
        <RefCode
          title="execve shellcode 反汇编注释版"
          badge="asm · 27 字节"
          language="asm"
          code={`48 31 ff                xor    rdi, rdi                 ; rdi = 0
57                      push   rdi                      ; 栈顶压入 8 字节 \\0 终止符
48 b8 2f 62 69 6e ...   movabs rax, 0x68732f2f6e69622f  ; "/bin//sh"（小端序）
50                      push   rax                      ; 栈顶 = "/bin//sh\\0"
48 89 e7                mov    rdi, rsp                 ; 参数 1：字符串指针
48 31 f6                xor    rsi, rsi                 ; 参数 2：argv = NULL
48 31 d2                xor    rdx, rdx                 ; 参数 3：envp = NULL
b0 3b                   mov    al, 59                   ; 调用号 59 = execve（rax 高位已为 0）
0f 05                   syscall                         ; execve("/bin//sh", NULL, NULL)`}
        />
        <P>
          同样的思路，把 59 号换成 <C>socket</C>（41）+ <C>connect</C>（42）再配 dup2 重定向标准输入输出，
          就是反弹 shell 的骨架。
        </P>
        <RefCallout tone="orange" title="strace —— 观察系统调用的最快方式">
          <p>
            想知道一个程序到底做了什么，先跑 <C>strace ./prog</C>：每一次系统调用的参数与返回值都会打印出来。
            加 <C>-f</C> 跟踪子进程，加 <C>-e trace=execve</C> 只盯特定调用。
          </p>
        </RefCallout>
      </RefSection>

      <RefPager
        prev={{ slug: 'isa', title: '指令集速查' }}
        next={{ slug: 'functions', title: '危险函数库' }}
      />
    </div>
  );
}
