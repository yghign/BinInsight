/**
 * 漏洞工作台注册表 —— /reference 索引页、路径面板、四段式工作台共用的元数据。
 * 设计原则：四个互链的漏洞工作台，每个都有完整四段式内容，
 *          背景知识沉到 glossary（每个工作台右侧跳转链接）。
 */

export interface VulnPathNode {
  slug: string;
  /** 显示在路径节点上的短标题（≤6 字） */
  shortTitle: string;
  /** 右侧面板用的完整标题 */
  title: string;
  /** 工作台小标题，解释这节学什么 */
  subtitle: string;
  /** 前置漏洞：没打过这一关 → 右侧显示"未解锁" */
  requires?: string;
}

export const vulnPath: VulnPathNode[] = [
  {
    slug: 'stack',
    shortTitle: '栈溢出',
    title: '栈溢出',
    subtitle: '最经典的内存破坏：覆盖 ret 地址拿到 RIP',
  },
  {
    slug: 'uaf',
    shortTitle: 'Use-After-Free',
    title: 'Use-After-Free',
    subtitle: '悬垂指针 + 类型混淆：控制 vtable 和内部结构',
    requires: 'stack',
  },
  {
    slug: 'fmtstr',
    shortTitle: '格式化字符串',
    title: '格式化字符串',
    subtitle: '"printf(user_input)"：%p 泄露、%n 任意写',
    requires: 'uaf',
  },
  {
    slug: 'heap',
    shortTitle: '堆利用入门',
    title: '堆利用入门',
    subtitle: 'tcache poisoning / unsorted bin 泄露 glibc 基址',
    requires: 'fmtstr',
  },
];

export function getVulnNode(slug: string): VulnPathNode | undefined {
  return vulnPath.find((n) => n.slug === slug);
}

/** glossary 概念引用 —— 工作台右侧"相关知识点"跳转 */
export interface GlossRef {
  slug: string;
  term: string;
}

export const glossary: GlossRef[] = [
  { slug: 'elf-text', term: 'ELF .text 节' },
  { slug: 'x86-call', term: 'x86-64 call 约定' },
  { slug: 'canary', term: 'Stack Canary 原理' },
  { slug: 'nx', term: 'NX 位 / PIE / ASLR' },
  { slug: 'glibc', term: 'glibc malloc 实现' },
  { slug: 'vtable', term: 'C++ 虚表布局' },
  { slug: 'fmt', term: 'printf 格式串参数' },
];

/** 当前知识库完成状态的 localStorage key（工作台四段式 × 每个漏洞） */
export const PROGRESS_STORAGE_KEY = 'bininsight-ref-progress-v1';

/** 四段式步骤 id（全局固定） */
export const STEPS = ['principle', 'demo', 'hands', 'defense'] as const;
export type StepId = (typeof STEPS)[number];
export const STEP_LABEL: Record<StepId, string> = {
  principle: '原理',
  demo: '演示',
  hands: '动手',
  defense: '防御视角',
};
