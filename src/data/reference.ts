/**
 * 知识库分类注册表 —— /reference 索引页与各分类页共用的元数据。
 */

export interface RefCategoryMeta {
  /** 路由 slug，对应 app/reference/<slug>/page.tsx */
  slug: string;
  title: string;
  /** 英文等宽小标签 */
  eyebrow: string;
  /** 索引卡片上的简介 */
  desc: string;
  /** 强调色 CSS 变量名（用于卡片图标与悬停） */
  accentVar: string;
  /** lucide 图标 key，在索引页映射到组件 */
  icon:
    | 'binary'
    | 'cpu'
    | 'terminal'
    | 'alert'
    | 'bug'
    | 'shield'
    | 'activity'
    | 'zap';
  /** 章节目录预览（索引卡片上展示前几条） */
  outline: string[];
}

export const refCategories: RefCategoryMeta[] = [
  {
    slug: 'formats',
    title: '二进制格式',
    eyebrow: 'Binary Formats',
    desc: 'ELF / PE / Mach-O 三大格式的结构对照：头部、节区、段与加载视图。',
    accentVar: 'var(--accent-cyan)',
    icon: 'binary',
    outline: ['ELF 头部与节区', '程序头与加载', 'PE 结构速览', 'Mach-O 与对比表'],
  },
  {
    slug: 'isa',
    title: '指令集速查',
    eyebrow: 'ISA Cheatsheet',
    desc: 'x86-64 寄存器、常用指令、调用约定与栈帧布局，附 ARM64 对照。',
    accentVar: 'var(--brand-500)',
    icon: 'cpu',
    outline: ['通用寄存器', '常用指令分组', '调用约定', '栈帧布局', 'ARM64 对照'],
  },
  {
    slug: 'syscalls',
    title: '系统调用表',
    eyebrow: 'Syscall Table',
    desc: 'Linux x86-64 常用系统调用号、参数寄存器与 shellcode 常用条目。',
    accentVar: 'var(--accent-green)',
    icon: 'terminal',
    outline: ['调用约定', '文件与 IO', '进程控制', '内存管理', 'Shellcode 常用'],
  },
  {
    slug: 'functions',
    title: '危险函数库',
    eyebrow: 'Dangerous Functions',
    desc: 'C 标准库危险函数全表：风险等级、漏洞类型与安全替代品。',
    accentVar: 'var(--accent-orange)',
    icon: 'alert',
    outline: ['字符串拷贝', '格式化输出', '内存操作', '命令执行', '整数运算'],
  },
  {
    slug: 'vulns',
    title: '漏洞类型全谱',
    eyebrow: 'Vulnerability Classes',
    desc: '栈溢出、堆漏洞、UAF、整数溢出、格式化字符串、竞态与类型混淆。',
    accentVar: 'var(--accent-red)',
    icon: 'bug',
    outline: ['栈溢出', '堆溢出 / UAF / Double Free', '整数溢出', '格式化字符串', '竞态与类型混淆'],
  },
  {
    slug: 'protections',
    title: '防护与对抗',
    eyebrow: 'Mitigations & Bypasses',
    desc: 'Canary / NX / ASLR / PIE / RELRO / CFI 的原理、检查命令与绕过思路。',
    accentVar: 'var(--accent-purple)',
    icon: 'shield',
    outline: ['防护机制速查', '逐项原理', '绕过技术', '组合防护现状'],
  },
  {
    slug: 'dynamic',
    title: '动态分析',
    eyebrow: 'Dynamic Analysis',
    desc: 'GDB 命令速查、Frida 脚本模板、strace/ltrace 与反调试对抗。',
    accentVar: 'var(--accent-cyan)',
    icon: 'activity',
    outline: ['GDB 速查', 'pwndbg 增强', 'Frida Hook 模板', 'strace / ltrace', '反调试对抗'],
  },
  {
    slug: 'exploit',
    title: '利用开发',
    eyebrow: 'Exploitation',
    desc: 'ret2libc / ROP 链构造、gadget 类型、glibc 堆利用与 shellcode 编写。',
    accentVar: 'var(--accent-orange)',
    icon: 'zap',
    outline: ['ret2libc', 'ROP 与 gadget', '堆利用入门', 'Shellcode 编写', '利用开发流程'],
  },
];

export function getRefCategory(slug: string): RefCategoryMeta | undefined {
  return refCategories.find((c) => c.slug === slug);
}
