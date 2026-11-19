/**
 * 8 级主线（L0~L7）唯一数据源。
 *
 * 硬约束（增量 PRD 4.1 / 4.2）：
 *   1. 每级 ≤1 个新概念，白话定义在前、术语在后；
 *   2. 本级正文只能使用「本级新概念 + 前级已学概念」，其余术语必须挂术语浮层；
 *   3. L7 是纯复用与检验，0 个新概念；
 *   4. L7.next === null，任何 next 都不得指向 L8（L8 只从侧栏「课外拓展阅读」进入）。
 *
 * 本文件只放纯数据与查表，不含 UI、不含 localStorage、不含路由跳转逻辑。
 * 纯函数（levelByRoute / nextLevel / isUnlocked …）见 src/lib/lesson.ts。
 * 术语 id 全部指向 src/data/glossary.ts 的 GlossEntry.id。
 */

export type LevelId = 'l0' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7';

/** 2 选 1 自检题的一个选项。答错也必须给白话解释，不扣分、可重来。 */
export interface CheckOption {
  label: string;
  correct: boolean;
  explain: string;
}

/** 每级末尾的「我看懂了吗」自检卡，恰好 2 个选项。 */
export interface SelfCheck {
  question: string;
  options: [CheckOption, CheckOption];
}

export interface LessonLevel {
  /** 级别 id，l0..l7 */
  id: LevelId;
  /** 0..7，用于「第 N 级 / 共 8 级」 */
  index: number;
  /** 中文短标题，如「找到它」 */
  title: string;
  /** 本级唯一新概念（白话，≤1 个）；L7 为「（无）」 */
  newConcept: string;
  /** 一句生活化白话定义，术语在后 */
  plainDefinition: string;
  /** 本级正文允许出现的术语 id（本级新概念 + 前级已学） */
  allowedTerms: string[];
  /** 复用前级已学知识（白话短语，供「用到的旧知识」回链卡片） */
  reuse: string[];
  /** 可验收的理解标志（8 道理解标志题的依据） */
  understanding: string;
  /** 复用的现有组件 / 数据资产提示（教学用，不参与渲染） */
  assets: string[];
  /** 主线路由 /learn/l0 .. /learn/l7 */
  route: string;
  /** 下一级；L7 为 null；永不指向 'l8' */
  next: LevelId | null;
  /** 前置级；L0 为 null */
  requires: LevelId | null;
  /** 本级末尾 2 选 1 自检卡 */
  selfCheck: SelfCheck;
}

export const LESSON_LEVELS: LessonLevel[] = [
  {
    id: 'l0',
    index: 0,
    title: '程序与输入',
    newConcept: '程序 = 一堆步骤 + 一块放数据的地方',
    plainDefinition:
      '把程序想成一张菜谱（先做什么、再做什么），再配一个冰箱（放食材的地方）。它会读你给的输入，把输入放进一个固定大小的盒子里。',
    allowedTerms: ['program', 'input', 'box'],
    reuse: [],
    understanding: '能说出「程序会读输入，并把输入放进一个固定大小的盒子」。',
    assets: ['首页 Hero 区文案改造', '新增 L0Program 对照图'],
    route: '/learn/l0',
    next: 'l1',
    requires: null,
    selfCheck: {
      question: '程序读到你的输入之后，会把输入放到哪里？',
      options: [
        {
          label: '放进一个固定大小的盒子里',
          correct: true,
          explain:
            '对。程序事先就准备好了一个大小固定的盒子，输入再多也只能往这个盒子里放 —— 后面几级的所有故事都从这里开始。',
        },
        {
          label: '随便找一块无限大的空地',
          correct: false,
          explain:
            '不对。程序放数据的地方是事先准备好的、大小固定的盒子。正因为「固定大小」，才会有下一级「装不下」的问题。再想一下菜谱和冰箱的比喻。',
        },
      ],
    },
  },
  {
    id: 'l1',
    index: 1,
    title: '缓冲区溢出',
    newConcept: '缓冲区溢出',
    plainDefinition:
      '像把一大杯水倒进小杯子：装不下的部分会洒出来，盖住旁边原本放好的东西。多出来的输入会盖住「程序下一步要跳去的地方」。',
    allowedTerms: ['program', 'input', 'box', 'overflow', 'strcpy', 'return-address'],
    reuse: ['输入 → 盒子', '固定大小的盒子'],
    understanding:
      '能指出「多出来的数据盖住了别的东西」，并答出「盖住的是程序下一步要跳去的地方」。',
    assets: ['learn/step2 的 vulnerableCSource', 'reference/stack 的 StackFrameSVG 简化版'],
    route: '/learn/l1',
    next: 'l2',
    requires: 'l0',
    selfCheck: {
      question: '输入比盒子长的时候，多出来的数据会怎么样？',
      options: [
        {
          label: '盖住旁边的东西，包括程序下一步要跳去的地方',
          correct: true,
          explain:
            '对。盒子旁边还放着「程序下一步要跳去的地方」（返回地址），多出来的数据会一路盖过去 —— 这就是缓冲区溢出。',
        },
        {
          label: '自动被丢掉，不会影响别的东西',
          correct: false,
          explain:
            '不对。strcpy 这类函数不检查长度，它不会把多余的输入丢掉，而是照着往后写，于是把旁边放好的东西盖住了。拖动上面的滑块再看一遍染色。',
        },
      ],
    },
  },
  {
    id: 'l2',
    index: 2,
    title: '定位危险调用',
    newConcept: 'call = 去调用一个现成函数',
    plainDefinition:
      '汇编里的 call 就是「去叫一个现成的函数帮我们干一件事」。只认这一条指令：先看哪一行是 call，再看名字里有没有 strcpy。',
    allowedTerms: [
      'program', 'input', 'box', 'overflow', 'strcpy', 'return-address',
      'call', 'dangerous-call',
    ],
    reuse: ['输入 → 盒子', '缓冲区溢出', 'strcpy 不检查长度'],
    understanding: '能在 32 行汇编里点中 strcpy 那行，并说出「它不检查长度」。',
    assets: [
      'learn/step2 全行可点反汇编（收敛为 2 步定位法）',
      'learn/step2 逐行解释表',
    ],
    route: '/learn/l2',
    next: 'l3',
    requires: 'l1',
    selfCheck: {
      question: '下面哪一行是那个不检查长度的调用？',
      options: [
        {
          label: 'call strcpy@plt',
          correct: true,
          explain:
            '对。call 是「去调用一个现成函数」，名字 strcpy 说明它不检查长度 —— 输入有多长就拷多长，正是 L1 溢出的源头。',
        },
        {
          label: 'mov rsi, [rbp-0x38]',
          correct: false,
          explain:
            '不对。这一行只是把参数搬来搬去，没有「去调用函数」。找危险调用的第一步永远是：先扫哪几行以 call 开头，再看 call 后面的名字。',
        },
      ],
    },
  },
  {
    id: 'l3',
    index: 3,
    title: '限长修复',
    newConcept: '限长函数 strncpy',
    plainDefinition:
      '给杯子加一条刻度线：最多倒到这条线就停。strcpy 换成 strncpy，多了一个「长度上限」。',
    allowedTerms: [
      'program', 'input', 'box', 'overflow', 'strcpy', 'return-address',
      'call', 'dangerous-call', 'strncpy', 'patch',
    ],
    reuse: ['缓冲区溢出', 'strcpy', 'call'],
    understanding: '能说出「strcpy → strncpy 加了长度上限」。',
    assets: ['learn/step4 PatchDiffDemo 并排高亮', 'learn/step2 的 safe_func', 'computeStrDiff'],
    route: '/learn/l3',
    next: 'l4',
    requires: 'l2',
    selfCheck: {
      question: '把 strcpy 换成 strncpy，最关键的变化是什么？',
      options: [
        {
          label: '多了一个长度上限，最多只拷这么多',
          correct: true,
          explain:
            '对。左边 strcpy 没有长度参数，右边 strncpy 多了 63 这个上限，盒子就装不下了也不会往外洒。',
        },
        {
          label: '换了一个更快的排序算法，运行速度变快',
          correct: false,
          explain:
            '不对。这里改的不是速度，是「有没有上限」。并排 diff 里红变绿的那一行，多出来的就是长度参数。',
        },
      ],
    },
  },
  {
    id: 'l4',
    index: 4,
    title: '触发条件',
    newConcept: '条件门槛',
    plainDefinition:
      '像进游乐园要同时过「身高够」和「有门票」两道关：两道都过了，才会走到 strcpy 那一行。',
    allowedTerms: [
      'program', 'input', 'box', 'overflow', 'strcpy', 'return-address',
      'call', 'dangerous-call', 'strncpy', 'patch', 'condition',
    ],
    reuse: ['strcpy 漏洞点', '缓冲区溢出', 'call'],
    understanding: '能说出「两道关都过了才会走到 strcpy」，并解释 A 为什么走不到。',
    assets: ['learn/step3 scenarioPresets A/B/C（已砍掉 CFG/ENTRY/SINK 图例与图论词汇）'],
    route: '/learn/l4',
    next: 'l5',
    requires: 'l3',
    selfCheck: {
      question: '输入 "hi" 为什么走不到 strcpy 那一行？',
      options: [
        {
          label: '第一道关「输入够长吗」就没过，提前结束了',
          correct: true,
          explain:
            '对。两道关是「并且」的关系，任何一道没过都会提前退出。"hi" 只有 2 个字符，第一道关就把它拦下了。',
        },
        {
          label: '因为 CMD 这几个字母拼错了',
          correct: false,
          explain:
            '不对。第二道关看的是「开头是不是 CMD」，但程序根本走不到第二道关 —— 输入太短，第一道关就结束了。把三个场景都点一遍看看。',
        },
      ],
    },
  },
  {
    id: 'l5',
    index: 5,
    title: '崩溃现场',
    newConcept: '崩溃 = 程序被强行停下、留下现场',
    plainDefinition:
      '像车祸之后看刹车痕：程序被强行停下来，现场会留下一条线索 —— 本该是「下一步去哪」的位置，变成了一串 A。',
    allowedTerms: [
      'program', 'input', 'box', 'overflow', 'strcpy', 'return-address',
      'call', 'dangerous-call', 'strncpy', 'patch', 'condition', 'crash', 'rip',
    ],
    reuse: ['缓冲区溢出', '条件门槛 → 走到漏洞点'],
    understanding: '能说出「A 写到了本该是地址的地方」；不需要会敲任何调试命令。',
    assets: ['learn/step3 GDB 三件套（已收敛为预录演示）', 'DemoTerminal 的 sourceLabel'],
    route: '/learn/l5',
    next: 'l6',
    requires: 'l4',
    selfCheck: {
      question: '现场里 rip 变成 0x41414141，说明什么？',
      options: [
        {
          label: '一串 A 写到了本该放「下一步地址」的地方',
          correct: true,
          explain:
            '对。A 的编码正好是 0x41。L1 里被盖住的「程序下一步要跳去的地方」，现在真的被 A 填满了，程序跳不过去就被强行停下。',
        },
        {
          label: '程序顺利跑完并正常结束了',
          correct: false,
          explain:
            '不对。程序是被强行停下的，不是正常结束。注意这段终端是「预录演示」，只要求你认出这一串 0x41，不需要会敲命令。',
        },
      ],
    },
  },
  {
    id: 'l6',
    index: 6,
    title: '栈保护',
    newConcept: '防护 = 编译器/系统自动加的检查（Canary）',
    plainDefinition:
      '像在返回地址前面贴一张封条：封条被撕破，程序就立刻报警停下。本次只讲这一把锁，NX / ASLR 一句话带过。',
    allowedTerms: [
      'program', 'input', 'box', 'overflow', 'strcpy', 'return-address',
      'call', 'dangerous-call', 'strncpy', 'patch', 'condition', 'crash', 'rip',
      'canary', 'protection',
    ],
    reuse: ['缓冲区溢出', '崩溃', '返回地址'],
    understanding: '能说出「Canary 是返回地址前的一个随机数，被改了就终止。',
    assets: ['DefenseSwitcher 的 single 模式（只留 Canary）', 'learn/step4 4.1 的 None/Canary/NX 标签'],
    route: '/learn/l6',
    next: 'l7',
    requires: 'l5',
    selfCheck: {
      question: 'Canary 这把「锁」到底做了什么？',
      options: [
        {
          label: '返回地址前放一个随机数，被改动就立刻终止程序',
          correct: true,
          explain:
            '对。溢出要先盖过这张封条才能够到返回地址；封条一被改，程序就报警停下，于是 L5 的崩溃被拦住了。',
        },
        {
          label: '把 strcpy 换成一个运行更快的版本',
          correct: false,
          explain:
            '不对。换函数是 L3 的 strncpy；Canary 是编译器自动加的一道检查，不改动你写的那行代码。把开关切到「关」再对比一次。',
        },
      ],
    },
  },
  {
    id: 'l7',
    index: 7,
    title: '综合实践',
    newConcept: '（无）',
    plainDefinition:
      '本级不引入任何新词。把 L0~L6 学过的东西，在新手沙箱里自己独立走完一遍；选项里只会用前面出现过的词。',
    allowedTerms: [
      'program', 'input', 'box', 'overflow', 'strcpy', 'return-address',
      'call', 'dangerous-call', 'strncpy', 'patch', 'condition', 'crash', 'rip',
      'canary', 'protection', 'sandbox',
    ],
    reuse: ['L0~L6 全部', 'L2 的 call 定位', 'L6 的 Canary'],
    understanding:
      '不看提示独立完成；能对着参考分析说出「哪步用了 L2 的 call、哪步用了 L6 的 Canary」。',
    assets: ['SandboxPlayer + data/sandbox.ts 的 beginner 案例', 'PathPreview 解锁状态', 'reference/stack 04 防御视角收尾'],
    route: '/learn/l7',
    next: null,
    requires: 'l6',
    selfCheck: {
      question: '沙箱里哪一步用到了 L2 学过的 call？',
      options: [
        {
          label: '找到 strcpy 那一行调用的时候',
          correct: true,
          explain:
            '对。L2 教的就是「先找 call、再看名字里有没有 strcpy」。沙箱里定位漏洞点用的正是这一步；最后开 Canary 的那步用的是 L6。',
        },
        {
          label: '打开 Canary 防护开关的时候',
          correct: false,
          explain:
            '不对。开关 Canary 是 L6 的内容。回想 L2：全行可点反汇编里，你点中的那一行是以 call 开头的。',
        },
      ],
    },
  },
];

/** 恰好 8 个级别 id，顺序即主线顺序。 */
export const LEVEL_IDS: LevelId[] = LESSON_LEVELS.map((level) => level.id);

/** 主线总级数（固定 8，供「第 N 级 / 共 8 级」显示）。 */
export const LESSON_COUNT: number = LESSON_LEVELS.length;

/** 按 id 查表；未找到返回 undefined。 */
export function getLevel(id: string): LessonLevel | undefined {
  return LESSON_LEVELS.find((level) => level.id === id);
}

/** 按路由查表（lib/lesson.ts 的 levelByRoute 会复用它）。 */
export function getLevelByRoute(route: string): LessonLevel | undefined {
  return LESSON_LEVELS.find((level) => level.route === route);
}
