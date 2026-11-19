# BinInsight 沙箱分区 · 增量 PRD（02 号增量需求）

> 文档编号：04（因 `03-演示自检清单.md` 已占用 03 号）｜ 撰写：许清楚（Xu）· 产品经理 ｜ 版本：v1.0
> **上游依据**：`docs/01-增量PRD.md`（总纲）、主理人已与用户确认的折中方案（直接执行，不另提备选）。
> **本 PRD 只描述本次变更部分**，不重复总纲内容；硬约束沿用总纲（工作副本落盘、零基础最高优先级、不新增 npm 依赖、不动 dilipa-tool Python、禁止 commit/push、三态来源标签沿用、新演示内容一律标「演示样例」）。
> **特别红线（主理人方案第 1 条）**：8 级主线（L0~L7）保持单一漏洞链**一字不动**——不改 `lesson.ts`、不改 `src/components/lesson/` 下 L0~L6 组件、L7 仅允许把「取案例的方式」从依赖数组顺序改为按 id 显式取（见 P0-1），内容不变。

---

## 0. 项目信息

| 项 | 内容 |
|---|---|
| Language | 中文 |
| Programming Language | 沿用现有 Next.js 16 + React 19 + Tailwind（增量改造，不换栈、不加依赖） |
| Project Name | `bininsight_coursework_incremental`（延续） |
| 变更范围 | `src/data/sandbox.ts`、`src/data/glossary.ts`、`src/app/cases/page.tsx`、`src/app/cases/sandbox/[id]/page.tsx`、`src/components/SandboxPlayer.tsx`、`src/components/lesson/L7Sandbox.tsx`；**不改** `src/data/lesson.ts` 与 L0~L6 组件 |
| 用户原话 | 「这8级只演示了一个漏洞点，其他漏洞类型就弄在沙箱新手里你看怎么样」 |

**原始需求复述**：8 级主线只讲了一个漏洞（栈溢出链）。其他漏洞类型不再进主线，改由沙箱页分区安置：格式化字符串挪进新手模块区、标新难度档「新手 +」；UAF 与 ROP 留在进阶模块区；两区文案改为明确的分工说明；零基础保护原则不变。

---

## 1. 变更目标

**一句话定位**：在不动 8 级主线的前提下，把 `/cases` 沙箱页改造成「新手区 = 主线同款栈溢出 + 一脉相承的近亲（格式化字符串），进阶区 = 主线之外的其他漏洞类型（UAF / ROP，可跳过、不考核）」的清晰分区，让零基础同学通关主线后有一个自然的「下一步」，让老师一眼看懂哪些讲、哪些不讲。

**3 条可验收的成功标准**：

| # | 成功标准 | 验收方式 |
|---|---|---|
| S1 | **分区正确且主线零回归** | `/cases` 新手区恰好 2 卡（gets 栈溢出 + 格式化字符串），进阶区恰好 2 卡（UAF + ROP）；`/learn/l7` 渲染的沙箱案例 id 仍为 `sb-gets-overflow`；`lesson.ts` 与 L0~L6 组件 `git diff` 为空 |
| S2 | **零基础不断线** | 新手区新文案、格式化字符串案例内出现的、主线 L0~L7 没教过的词，全部有 TermButton / 「本案例术语」行 / 词条 plain 白话兜底；新手区区说明通读无「未兜底术语」 |
| S3 | **诚实口径不变** | 挪动后的沙箱内容全部带「演示样例」标注（SourceBadge 或文案明示）；`npm run check:honesty` exit 0 |

---

## 2. 目标用户与用户故事

- **零基础同学（小李）**：As a 通关了 8 级主线的同学，I want 在新手区再练一个「一脉相承」的近亲案例（而不是突然跳到完全陌生的漏洞），so that 我用刚学会的那套思路（现象 → 定位 → 修复）就能多走一关，不用重新学一堆新词。
- **授课老师（王老师）**：As a 授课老师，I want 沙箱页分区一目了然地告诉我「新手区是主线近亲（演示时可以讲），进阶区是主线之外的类型（明说不考核）」，so that 演示动线不会被拉进我讲不动的内容。
- **作者本人（做演示答问）**：As a 作者，I want 每张卡、每段区说明里的术语都有点开即看的白话兜底、每个演示内容都带「演示样例」标签，so that 老师随手点开任意一关，都不会撞见没解释过的词或来源不明的内容。

---

## 3. 现状盘点（实读核实，工程师照表对位）

| 现状 | 位置 | 与目标的差距 |
|---|---|---|
| `SandboxDifficulty = 'beginner' \| 'basic' \| 'intermediate' \| 'advanced'`；`difficultyLabel` 字面量联合 `'新手' \| '低难度' \| '中难度' \| '高难度'`；`difficultyTone` 4 档（绿/青/橙/红） | `src/data/sandbox.ts:7,50,64-69` | 无「新手 +」档 |
| 4 个案例：`sb-gets-overflow`(beginner/新手)、`sb-format-string`(**basic/低难度**)、`sb-uaf-vtable`(intermediate/中难度)、`sb-rop-nx`(advanced/高难度) | `sandbox.ts:76,372,619,875` | fmtstr 需改档 |
| 分区函数：`getBeginnerSandboxes() = filter(difficulty === 'beginner')`；`getAdvancedSandboxes() = filter(difficulty !== 'beginner')` | `sandbox.ts:1170-1176` | 需包含新手 + 档 |
| **存量缺陷**：fmtstr 的 `title` 是「格式化字符串泄露 · **中等难度**」，但 `difficultyLabel` 是「**低难度**」——标题与标签自相矛盾 | `sandbox.ts:373-375` | 本次顺手修正 |
| **存量缺口**：4 个案例的 `relatedSteps` 全部指向旧路由 `/learn/step2~step4`（链接不 404，但口径是旧 step 体系，非主线 L0~L7）；ROP 案例还链到 `/cases/stack-buffer-overflow`（需核对 `cases.ts` 是否存在该 id） | `sandbox.ts:361-365, 609-612, 864-868, 1158-1162` | 列 P1 对齐 |
| 指导模式默认开 = `difficulty === 'beginner'`，**两处**（初始 + 重新开始） | `src/components/SandboxPlayer.tsx:31,77` | 需扩展覆盖新手 + 档，否则挪入后 fmtstr 默认无指导 |
| L7 取案例方式：`getBeginnerSandboxes()[0]`——依赖数组顺序，分区调整后仍是 gets（gets 排第一），但属脆弱写法 | `src/components/lesson/L7Sandbox.tsx:17` | 改为按 id 显式取（P0 回归红线） |
| `/cases` 列表页：新手区 `beginnerSandboxes.map(featured)` 大卡纵排；进阶区 `grid md:grid-cols-3` | `src/app/cases/page.tsx:128-146` | 进阶区剩 2 卡后 3 列空 1 格，改 2 列（P1） |
| 沙箱详情页头部只有难度/类型/时长标签 + 一行 `[说明]` 文字，**未挂 SourceBadge**（L7 页面已挂 demo） | `src/app/cases/sandbox/[id]/page.tsx:47-70` | 补挂（P0-4） |
| 术语体系：`glossary.ts` 单一数据源 + `TermButton`(termId) + `GlossaryProvider` 浮层；`fmtstr`/`uaf`/`rop`/`nx`/`strip`/`cwe` 词条**已存在**（均 level `l8`） | `src/data/glossary.ts`；`src/components/TermButton.tsx` | 缺 fmtstr 案例内出现的一批基础词（见第 6 节） |
| 自检脚本：7 禁用词 0 命中 + 主线 next 不越界 + 三态标签完整/覆盖 | `scripts/check-honesty.mjs` | 本次改动后必须仍 exit 0 |

---

## 4. 方案定义（工程师照做）

### 4.1 「新手 +」难度档定义（产品建议：**新增独立档**，不改名 basic）

**决定**：新增枚举 `'beginner-plus'`，不采用「把 basic 改名为新手 +」的方案。理由：① 语义诚实——fmtstr 对零基础确实比主线 gets 难半档，「新手 +」是独立难度而非「低难度」改写；② 类型自洽——`SandboxDifficulty`、`difficultyLabel`、`difficultyTone` 均为加法，不破坏现有映射；③ `basic` 档与 `'低难度'` label 保留（当前无案例占用的空档，留作未来，不做删除以免误伤消费方）。

| 项 | 值 | 落点 |
|---|---|---|
| 枚举值 | `'beginner-plus'` | `sandbox.ts:7` 的 `SandboxDifficulty` 联合类型追加 |
| 显示文字 | `'新手 +'` | `difficultyLabel` 字面量联合追加 `'新手 +'` |
| 色调 | **复用现有青色 `text-accent-cyan border-accent-cyan/40`**（即原 basic 档同色，不新增强调色） | `difficultyTone` 追加一行 |
| fmtstr 案例改档 | `difficulty: 'beginner-plus'`，`difficultyLabel: '新手 +'` | `sandbox.ts:374-375` |
| 分区函数 | `getBeginnerSandboxes() = filter(c => c.difficulty === 'beginner' \|\| c.difficulty === 'beginner-plus')`；`getAdvancedSandboxes()` 相应取 UAF/ROP（建议显式 `difficulty === 'intermediate' || difficulty === 'advanced'`） | `sandbox.ts:1170-1176` |
| 指导模式默认开 | 两处判断 `difficulty === 'beginner'` 扩展为也包含 `'beginner-plus'` | `SandboxPlayer.tsx:31` 初始、`:77` handleRestart |

**色调说明（为什么用青、不用进阶橙红）**：现有四色已建立「绿=新手、青=次档、橙=中、红=高」的连续谱。新手区两张卡 = 绿 + 青，同属一个视觉家族，与进阶区（橙 + 红）拉开明显距离——一眼可读「这两张是一家人」；若复用进阶色，会出现「一张绿一张橙」的割裂感，破坏新手区分组语义。

**排序**：`sandboxCases` 数组顺序不动（gets 在前、fmtstr 第二），新手区渲染顺序即「主线同款在前、近亲在后」，与学习顺序一致。

### 4.2 L7 回归保护（红线）

`L7Sandbox.tsx:17` 的 `getBeginnerSandboxes()[0]` 改为 `getSandboxById('sb-gets-overflow')`（文件已 import 侧按需补 `getSandboxById`）。空数据兜底分支保留原样。**验收**：`/learn/l7` 顶部案例标题仍为「新手起步：gets() 栈溢出」；L7 正文、收尾卡、lesson.ts 零改动。

### 4.3 两区最终文案草案（逐字照抄，术语均需嵌 `TermButton`）

**新手区**（`cases/page.tsx:120-131`）：

- eyebrow 保留：`Beginner Zone — 新手模块区`
- 区说明替换为：

> 通关 8 级主线之后，这里有两个沙箱可以接着练。两张卡是一家人：<strong>栈溢出</strong>[TermButton termId="overflow] 就是主线第 8 级「综合实践」走过的那一关；<strong>格式化字符串</strong>[TermButton termId="fmtstr"]（难度「新手 +」）是它的近亲 —— 同样是「程序把你的输入放错了位置」，这次放错的是 printf[TermButton termId="printf"] 的第一个参数。两个都默认开指导模式，点错也有解释、不扣分；下方材料都是浏览器里的预置演示样例。

**进阶区**（`cases/page.tsx:133-147`）：

- eyebrow 保留：`Advanced Zone — 进阶模块区`
- 区说明替换为（现有文案里 `code` + 括号注释的写法废弃，改用 TermButton）：

> <strong>主线之外的其他漏洞类型，看不懂可先跳过，不考核。</strong>这里默认关掉指导模式、由你自主分析，卡住时随时点「查看思路提示」。当前两个案例从易到难：UAF[TermButton termId="uaf"]（释放后重用 / 虚表劫持）→ ROP[TermButton termId="rop"]（在 NX[TermButton termId="nx"] 防护下拼装攻击链）。名字看不懂没关系，点一下就有白话解释。

**页面 metadata**（`cases/page.tsx:5-10`）description 替换为：

> 浏览器里的新手沙箱共两关：主线第 8 级「综合实践」的栈溢出，与新手 + 难度的格式化字符串，均为预置演示样例；进阶区 UAF / ROP 属主线之外的拓展内容（不考核）；本地深度案例属于拓展阅读（不考），只保留课前整理的分析文本，不附带可下载程序。

**fmtstr 案例字段修订**（`sandbox.ts:372-378`）：
- `title: '格式化字符串泄露 · 新手 +'`（同时消除存量「标题写中等难度、标签写低难度」的自相矛盾）
- `difficulty: 'beginner-plus'`、`difficultyLabel: '新手 +'`
- 追加 `terms: [... ]` 字段（见 4.4）

### 4.4 「本案例术语」行（数据驱动的术语兜底）

`SandboxCase` 接口追加可选字段 `terms?: string[]`（元素为 `glossary.ts` 的 `GlossEntry.id`）；沙箱详情页（`cases/sandbox/[id]/page.tsx`）在 brief 下方、目标面板上方渲染一行 TermButton，视觉沿用主线右栏「本级术语」样式（小标签 + ⓘ）。Rationale：案例 brief 与各阶段文案是纯字符串（数据层），无法内嵌组件；用案例级术语行兜底是改动最小、体验与主线统一的方案。

两个字案的 `terms` 取值：

- `sb-gets-overflow`：`['overflow', 'strcpy', 'call', 'strncpy', 'canary', 'crash', 'strip', 'elf', 'shell', 'offset']`
- `sb-format-string`：`['fmtstr', 'printf', 'format-spec', 'stack', 'info-leak', 'arbitrary-rw', 'offset', 'fortify']`
- （进阶两案例本次可不加 `terms`，见 P2-1）

---

## 5. 需求池（P0 / P1 / P2，每条含验收标准）

### P0（必须，缺一则 S1~S3 不达标）

| ID | 需求 | 验收标准 |
|---|---|---|
| **P0-1** | 难度档与分区：按 4.1 新增 `beginner-plus` 档 + 分区函数改造 + 指导模式默认开两处扩展 + 按 4.2 改 L7 取案例方式 | `/cases` 新手区恰好渲染 2 卡（gets 绿「新手」、fmtstr 青「新手 +」），两卡进入后指导模式均默认开；进阶区恰好 2 卡且指导模式默认关；`/learn/l7` 案例标题仍为「新手起步：gets() 栈溢出」 |
| **P0-2** | 两区文案落地：按 4.3 逐字替换区说明 / metadata / fmtstr title，术语嵌 TermButton | 文案与草案一致（允许无语义差别的排版调整）；页面中每个 TermButton 的 termId 均存在于 `glossary.ts`（工程师自检：`getGlossEntry(termId)` 非空）；fmtstr 卡上不再出现「中等难度」字样 |
| **P0-3** | 术语兜底：按第 6 节新增 10 条 glossary 词条（全部 `level: 'l8'`）+ 按 4.4 加 `terms` 字段与「本案例术语」行 | 新词条 plain ≤2 句且不含「未在前级教过就当已知」的词；两个新手区案例详情页均出现术语行，逐个点击浮层正常打开；`npm run check:honesty` exit 0 |
| **P0-4** | 来源标注：沙箱详情页头部（难度标签行旁）挂 `<SourceBadge state="demo" />`；新手区文案自带「预置演示样例」句（4.3 已含） | `/cases/sandbox/sb-format-string` 与 `/cases/sandbox/sb-gets-overflow` 头部均见「演示样例」标签；列表页不挂标签（避免重复噪音），靠区说明句子交代 |
| **P0-5** | 回归红线：`lesson.ts`、`src/components/lesson/` 的 L0~L6 组件、`/learn/l0~/l7` 页面渲染零改动；不新增依赖；不 commit/push | `git diff --stat` 中上述文件不出现；`package.json` 无变化；check-honesty 通过 |

### P1（应该有）

| ID | 需求 | 验收标准 |
|---|---|---|
| P1-1 | 进阶区布局：`grid md:grid-cols-3` → `grid md:grid-cols-2`（2 卡各占一半，不留空格） | 1280px 视口下进阶区两卡等宽并排 |
| P1-2 | `relatedSteps` 旧路由对齐主线：映射 `/learn/step2 → /learn/l2`、`/learn/step3 → /learn/l4`、`/learn/step4 → /learn/l6`；label 同步改（如「复习 L2 · 找到 call」）；ROP 案例里的 `/cases/stack-buffer-overflow` 先核对 `cases.ts` 是否存在该 id，存在保留、不存在删除该条 | 4 个案例的 relatedSteps 全部指向存在的主线路由；点击逐一可达、无 404 |
| P1-3 | 存量术语缺口补齐：`shell` 词条（第 6 节 #10）虽主要服务 gets 案例的 brief「拿到 shell」，随 P0-3 一并落地；gets 案例的 `terms` 字段随 4.4 一并落地 | gets 详情页术语行含 `shell`，点开有白话解释 |

### P2（锦上添花）

| ID | 需求 | 验收标准 |
|---|---|---|
| P2-1 | 进阶区术语兜底增强：UAF/ROP 案例补 `terms` 字段（建议 UAF：`['uaf','stack','arbitrary-rw']`；ROP：`['rop','nx','gadget→rop','offset']`，gadget 并入 rop 词条 alias）+ 新增 `checksec`、`cfi` 词条（level 'l8'） | 进阶两案例详情页术语行可点、解释正常 |
| P2-2 | glossary 微调：`rop` 词条 aliases 补 `'one_gadget'`；`asm` 词条 aliases 补 `'反编译'`（现有 findGlossEntry 按精确匹配查不到「反编译」） | 别名匹配生效，不影响既有引用 |
| P2-3 | 新手区衔接引导：fmtstr 卡底部小字「打完这关可以去进阶区看看 UAF 和 ROP —— 看不懂很正常，那是主线之外的拓展」 | 卡上出现该句，无链接误导主线顺序 |

---

## 6. 新增 glossary 词条清单（10 条完整草案，工程师照抄进 `src/data/glossary.ts`，全部 `level: 'l8'`）

> 来源：逐段实读 `sb-format-string` 四个阶段的材料/问题/选项解释/指导卡，比照主线 `lesson.ts` 的 `allowedTerms`（L0~L7 仅允许 program/input/box/overflow/strcpy/return-address/call/dangerous-call/strncpy/patch/condition/crash/rip/canary/protection/sandbox），凡主线没教、案例又用的词全部收进。plain 均 ≤2 句、无未教术语先行。

| # | id | term | plain（白话解释） | aliases | anchor |
|---|---|---|---|---|---|
| 1 | `stack` | 栈 | 程序运行时临时放东西的一摞格子，新来的放最上面，用完从最上面拿走；主线说的「盒子」就摆在这一摞里。 | 栈, stack, 栈上, 栈指针, 栈地址 | `/reference/glossary#stack` |
| 2 | `printf` | printf | C 里一个现成的打印函数：按第一个参数里写的格式，把后面的数据输出到屏幕。 | printf, 打印函数, 格式化输出 | `/reference/glossary#printf` |
| 3 | `format-spec` | 格式符（%x / %p / %n / %s） | 写在 printf 格式里、以 % 开头的小记号：%s 打印一段文字，%x / %p 把内存里的值当数字显示，%n 更危险——会往指定位置写数。 | %x, %p, %n, %s, 格式符, 格式说明, %5$n | `/reference/glossary#format-spec` |
| 4 | `info-leak` | 信息泄露 | 程序把本不该给人看的内存内容显示了出来——像窗帘没拉严，先让攻击者看清了屋里的布局。 | 信息泄露, 泄露, 泄露数据, 任意读 | `/reference/glossary#info-leak` |
| 5 | `arbitrary-rw` | 任意读 / 任意写 | 能按攻击者指定的位置去读（任意读）或改（任意写）内存，是漏洞从「麻烦」升级成「危险」的分界线。 | 任意写, 任意读, 写内存, 读内存, 精确写 | `/reference/glossary#arbitrary-rw` |
| 6 | `shellcode` | shellcode | 攻击者自己写的一小段代码，想让程序跳过去执行；要它生效，前提是先拿到「下一步去哪」的控制权。本站案例只演示到「被引走」为止，不提供可运行的攻击代码。 | shellcode, 注入代码, 代码注入 | `/reference/glossary#shellcode` |
| 7 | `compiler` | 编译器 | 把人写的代码翻译成电脑指令的工具；翻译时还能按你给的开关顺手做检查。 | 编译器, gcc, 编译, 编译期, 编译选项 | `/reference/glossary#compiler` |
| 8 | `fortify` | 编译期检查（FORTIFY / -Wformat-security） | 一类编译开关：把代码交给编译器打包时，让它顺手把几种危险写法直接报成错误，不等程序运行。与 L6 那把「运行时的锁」不是一回事。 | FORTIFY_SOURCE, -D_FORTIFY_SOURCE, -Wformat-security, -Werror=format-security, 编译期检查 | `/reference/glossary#fortify` |
| 9 | `offset` | 偏移 | 从起点数过去、要跨过多少字节才够到目标位置，这段距离叫偏移。算准它，多余的数据才能正好盖在想要的地方。 | 偏移, offset, 偏移量, 算偏移 | `/reference/glossary#offset` |
| 10 | `shell` | shell | 一个能让你继续给电脑下命令的文字界面。攻击者拿到 shell，就等于坐到了你的键盘前——gets 案例的目标「不用猜密码就拿到 shell」指的就是它。 | shell, 拿到 shell, 弹 shell, 命令行 | `/reference/glossary#shell` |

**已有词条（核实无需新增）**：`fmtstr`（格式化字符串）、`uaf`（含 虚表劫持/vtable alias）、`rop`（含 gadget/ret2libc）、`nx`（NX/ASLR）、`strip`、`cwe`（含 CWE-134/CWE-416/CWE-121）、`elf`、`overflow`（含 栈溢出 alias）——本次仅按 P2-2 做两处 alias 微调。

**关于词条 level 的说明**：10 条新词条均标 `level: 'l8'`（含义为「不属于主线任何一级、不考核」），与「沙箱新手区但不进主线」的定位兼容；不需要、也不允许为此改 `lesson.ts` 的 `LevelId`（主理人红线）。

---

## 7. 验收清单（逐项可勾选）

- [ ] `/cases` 新手区恰好 2 卡：gets（绿·新手）在前、fmtstr（青·新手 +）在后，均为 featured 大卡
- [ ] 两张新手区卡进入后指导模式默认开（含点「重新开始」后仍默认开）
- [ ] `/cases` 进阶区恰好 2 卡：UAF（橙·中难度）、ROP（红·高难度），指导模式默认关
- [ ] `/learn/l7` 渲染案例 id = `sb-gets-overflow`（标题「新手起步：gets() 栈溢出」），正文与收尾卡零改动
- [ ] `sandbox.ts` 中 `SandboxDifficulty` / `difficultyLabel` / `difficultyTone` 三处同步新增 `beginner-plus` / `新手 +` / 青色，`basic` 档与 `'低难度'` label 保留未删
- [ ] `getBeginnerSandboxes()` 返回 2 例、`getAdvancedSandboxes()` 返回 2 例（建议显式按 intermediate+advanced 过滤）
- [ ] 新手区 / 进阶区区说明与 4.3 草案一致，其中「格式化字符串 / printf / UAF / ROP / NX / 栈溢出」均以 TermButton 呈现且 termId 可解析
- [ ] fmtstr 案例卡与详情页不再出现「中等难度」，title 为「格式化字符串泄露 · 新手 +」
- [ ] `glossary.ts` 新增第 6 节 10 条词条，`anchor` 以 `#id` 命名一致，`npm run check:honesty` exit 0
- [ ] 两个新手区案例详情页 brief 下均出现「本案例术语」行，逐一点击浮层正常、解释为白话
- [ ] `/cases/sandbox/sb-format-string`、`/cases/sandbox/sb-gets-overflow` 头部挂「演示样例」SourceBadge
- [ ] `cases/page.tsx` metadata description 已按 4.3 更新
- [ ] `git diff` 确认：`lesson.ts`、`src/components/lesson/` 的 L0~L6 组件、`dilipa-tool/**`、`package.json` 零改动；无 commit/push
- [ ] 零基础走查：请一位没学过代码的同学通读新手区说明 + fmtstr 案例四阶段，遇到生词点开浮层后能继续，全程无需外部搜索

---

## 8. 待确认问题（每条含推荐默认值，用户拍板后工程师执行）

| # | 问题 | **推荐默认值** | 说明 |
|---|---|---|---|
| Q1 | 「新手 +」用**新增枚举**还是**复用 basic 改名**？ | **新增 `beginner-plus` 枚举**；basic 与 '低难度' label 保留为空档 | 加法不改名，语义诚实、类型自洽、未来有别的低难度案例时不冲突 |
| Q2 | 「新手 +」的色调？ | **青色（原 basic 同色 accent-cyan）**，不用进阶橙红 | 绿→青→橙→红 = 新手→新手+→中→高 的连续谱；新手区两卡同属一个视觉家族 |
| Q3 | fmtstr 标题里存量矛盾（「中等难度」vs「低难度」）顺带修吗？ | **修**，title 改「格式化字符串泄露 · 新手 +」 | 3 行改动，消除老师一眼能挑出的不一致 |
| Q4 | 新手区两卡的先后顺序？ | gets 在前（主线第 8 级同款、概念全复用），fmtstr 在后 | 数组顺序本就如此，零成本 |
| Q5 | `relatedSteps` 旧路由（/learn/step2~4）本次顺手对齐主线路由吗？ | **对齐**（P1）：step2→/learn/l2、step3→/learn/l4、step4→/learn/l6，label 改「复习 LN · …」；ROP 的 `/cases/stack-buffer-overflow` 先核对存在性再决定去留 | 不改也能用（旧路由未删），但对齐主线口径更一致 |
| Q6 | 「本案例术语」行的实现载体？ | `SandboxCase` 加可选 `terms?: string[]`（glossary id 数组），详情页 brief 下渲染一行 TermButton | 数据驱动、与主线「本级术语」同款视觉；比在纯字符串 brief 里做自动术语匹配改动小得多 |
| Q7 | `/cases` 列表页要不要也挂 SourceBadge？ | **不挂**，只挂详情页头部；列表页靠区说明里的「预置演示样例」句子交代 | 列表页 4 张卡都挂会变成标签噪音，削弱「三态标签=重要信息」的信号强度 |

---

## 9. 边界声明

- 本 PRD 仅描述沙箱分区相关的产品变更，不涉及任何主线教学内容调整、不涉及 dilipa-tool 与工具页、不新增禁用词（check-honesty 词表不动）。
- 「把更多漏洞类型做进主线」属于 01 号 PRD 中 L8 拓展区的既有定位，本次不重开讨论；用户若后续想把 UAF/ROP 升级为主线内容，需另立 PRD 并重新评审「每级 ≤1 新概念」的硬规则。
- 所有新词条与文案的「白话化」程度以第 7 节最后一条人工走查为准；脚本只能查词表与结构，查不了「读不读得懂」。
