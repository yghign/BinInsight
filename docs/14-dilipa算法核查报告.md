# Dilipa「4 个自研算法」代码核查与技术溯源

> 核查对象：`BinInsight@main`（commit `45c848b`）
> 核查范围：`dilipa-tool/` 全部 9 个 .py（1163 行）+ `src/components/DilipaWorkbench.tsx`（1040 行）
> 结论基于实际运行与逐行阅读，不做推测。

---

## 一、结论先行

四个算法里，**两个有半成品实现、两个在代码里完全不存在**；网页上展示的「三重校验」是三个写死的字符串。

| 声称的算法 | Python 实现 | 网页展示 | 实际状态 |
|---|---|---|---|
| 等长 call 改写 | ❌ 无 | ✅ 有动画/日志 | `patch` 自认"预览模式"，只写 JSON |
| PLT/GOT 映射 | ⚠️ 只存段基址 | ✅ 有表格 | 无 符号→PLT→GOT 映射链，且 `.dynsym` 被跳过 |
| 栈帧启发式 | ❌ 0 处代码 | ✅ 有讲解 | 全仓搜索 `frame/rbp/stack` 零命中 |
| 结构校验 | ❌ 无 | ✅ 三个 `'OK'` | 无 checksum、无重反汇编、无功能测试 |

外加两个独立缺陷（下面有证据）：
- `lift --func main` 的 `--func` 是**死参数**，传了不生效，永远反汇编整个 `.text`；
- `arch_map` 宣称支持 ARM64/ARM/MIPS/PPC，但 `_make_cs()` 对非 x86 一律回退到 x86-64 —— ARM 二进制会被当 x86 **静默反汇编成垃圾**，不报错。

---

## 二、逐条核查

### 1. 等长 call 改写 —— 不存在，且在语义上自相矛盾

`cli.py:195-199` 的函数文档字符串自己写着：

```
"""目前为预览模式 — 显示要替换什么, 不直接改二进制.
   真实二进制重写需要 keystone + 空间分析, 这里只输出 JSON 供网页展示."""
```

`cli.py:242` 更直接：

```python
out_json = Path(out).with_suffix(".json")   # --out patched.elf 实际产出 patched.json
```

全仓搜索 `keystone|code_cave|trampoline`：**没有任何汇编器、没有任何空间分配逻辑**。唯一写文件的代码在 `scripts/make_test_elf.py`（那是我重写的样本生成器，不属于工具链）。

更关键的是逻辑问题：**`strcpy` → `strncpy` 本身就是变长的**。

```
strcpy:  lea rdi,[buf]; mov rsi,[input]; call strcpy@plt        → call 5 字节
strncpy: lea rdi,[buf]; mov rsi,[input]; mov rdx,63; call strncpy@plt  → 多 4~7 字节
```

原位置塞不下，所以必须走 code cave + trampoline —— 这正是「等长」这个命名想回避的问题。真正能"等长"的只有一种情况：**替换到签名完全相同的另一个 PLT 目标**（同参数个数、同寄存器约定），此时只需改 call 的 rel32 偏移，5 字节原地改 5 字节。但代码里连这个判断都没有。

**文献溯源**：
- **E9Patch**（Duck & Roland, PLDI 2020）—— 在任意指令边界插入 5 字节 jump，用 instruction punning / padding 处理不等长覆盖。这才是"等长改写"的严格版本。
- **Detours**（Hunt & Scott, 1999）—— trampoline 拦截的经典实现。
- **Wenzl et al., "From Hack to Elaborate Technique — A Survey on Binary Rewriting"**（ACM CSUR 2019）—— 综述，把 rewriter 分成 trampoline / symbolization / IR-lifting 三类。

### 2. PLT/GOT 映射 —— 只存了 3 个段基址

`elf_parser.py:88-95`：

```python
for sec_name in (".plt.got", ".plt", ".plt.sec"):
    sec = elf.get_section_by_name(sec_name)
    if sec is not None:
        info.plt_entries[sec_name] = int(sec["sh_addr"])   # 键是段名, 值是段起始地址
```

`plt_entries` 的语义是 `{".plt": 0x401020}` —— 三个数字，不是映射。真正的 PLT/GOT 映射需要四步：

```
call 0x401030  →  PLT 序号 n = (0x401030 - .plt基址) / 16
               →  .rela.plt[n].r_offset  = GOT 槽地址
               →  .rela.plt[n].r_info    = dynsym 下标
               →  .dynsym[i].st_name     = "strcpy"
```

代码里 `.rela.plt` / `.rela.dyn` **从未被读取**（`.dynamic` 段也没读），这条链在第 2 步就断了。

而且 `elf_parser.py:80` 有一个致命笔误：

```python
for sec_name in (".symtab", ".dynsym"):
    sec = elf.get_section_by_name(sec_name)
    if sec is None or sec["sh_type"] != "SHT_SYMTAB":   # ← .dynsym 的 sh_type 是 SHT_DYNSYM
        continue
```

`.dynsym` 的类型是 `SHT_DYNSYM`，不是 `SHT_SYMTAB`，所以**动态符号表被无条件跳过**。strip 过的二进制没有 `.symtab`，于是 `info.symbols` 永远是空的 —— 而 strip 恰恰是真实样本的常态。

**文献溯源**：System V ABI / ELF 规范的 lazy binding 机制（首次调用经 PLT stub 触发动态链接器，回填 GOT）；工程实现参考 **LIEF 官方教程 "Infecting the PLT/GOT"**（`Binary.patch_pltgot()`）；Android 侧的 PLT hook（xHook / bhook）是同一套原理。

### 3. 栈帧启发式 —— 一行都没有

```
$ grep -rn "frame\|rbp\|栈帧\|stack" --include="*.py" dilipa-tool/
（无输出）
```

这恰恰是最应该先做的一块，因为它是前两个算法的**前置依赖**：

- **等长改写**要知道原指令占多少字节、能否被整条指令覆盖，需要逐指令边界分析；
- **`strcpy` → `strncpy` 的 `n` 从哪来**？必须知道目标 buffer 相对 `rbp` 的偏移和栈帧大小（`sub rsp, 0x40` + 引用 `[rbp-0x30]` → buffer 在 rbp-0x30，帧 64 字节 → n 最大 0x2F）。没有栈帧分析，这个 `63` 只能拍脑袋。

网页上的 `patchedAsm` 里那个 `mov rdx, 63` 是手写的常量，不是算出来的。

**文献溯源**（这块的"启发式"在工业界有成熟分类）：
- x86-64 函数序言的四种形态：`classic`（`push rbp; mov rbp,rsp`）、`no-frame-pointer`（`sub rsp,imm`）、`push-only`（`push rbx` 等被调用者保存寄存器）、`lea-based`（`lea rsp,[rsp-N]`）。这是 GDB / libunwind / IDA 共用的分类法。
- `-O2` 默认开 `-fomit-frame-pointer`，此时**必须**靠 DWARF 的 `.eh_frame` / CFI 或反汇编启发式，帧指针链表不可用。
- 函数边界识别可参考 **ByteWeight**（NDSS 2015）、**Nucleus**、`resurgo` 的 prologue+call-site 打分合并思路。

### 4. 结构校验 —— 三个写死的 `'OK'`

`DilipaWorkbench.tsx:835-838`：

```tsx
{[
  { label: '校验和对比', val: 'OK', tone: 'green' },
  { label: '反汇编验证', val: 'OK', tone: 'green' },
  { label: '功能测试',   val: 'OK', tone: 'green' },
].map(...)}
```

三个字面量。没有计算 checksum，没有重新反汇编 patch 点，没有跑被测程序。`terminal` 数组里那句 `Done: target.elf.patched (verified OK)` 同理，是 `funcs` 常量里的字符串（`DilipaWorkbench.tsx:117`）。

**文献溯源**：**VeriBin**（NDSS 2025）用 under-constrained symbolic execution + SMT 判定 patch 是否 "Safe to Apply"，对 86 个样本 93% 准确率、0 误报；**APEG** 用最弱前置条件比对原始与补丁版本；工程级轻量方案是 `sha256` 对比 + patch 点重反汇编 + 回归测试。

---

## 三、「自研」这个说法站不站得住

**四个名词全部能在文献里找到对应概念，这不丢人**——binary rewriting、PLT hook、prologue heuristic、patch verification 都是有二十年积累的成熟领域，任何人都只能站在前人肩上。

问题不在"借鉴"，在于**代码里没有实现，而 UI 以"已完成、已验证"的口吻呈现**：

- Step 6 标题写「生成补丁 · Trampoline 注入」，正文写"会在代码洞写入补丁逻辑"，但 `patch` 命令只吐 JSON；
- 终端日志写 `code cave @ 0x401a20 · 24 bytes`、`[4/4] Trampoline 注入完成`，全是预置字符串；
- `--out patched.elf` 实际产出 `patched.json`，文件名骗人。

风险很现实：**评审只要 `pip install -e dilipa-tool && dilipa patch` 跑一次就露馅**，而且比"没做"更伤——因为你说做了。

两个处理方向，选一个：
1. **真做**（第五节给了最小路径）；
2. **改文案**：Step 6 标题改「补丁方案预览」，去掉"注入完成""verified OK"，标注"本阶段输出变更预览，二进制重写为后续工作"。诚实的设计稿就是合格的设计稿，伪装成成品才扣分。

---

## 四、回答你真正的问题：你的项目有没有可借鉴的算法？

**有，而且比四个"自研算法"值钱得多。** 你现在的困境不是"没东西可借鉴"，而是**把能成为算法点的东西全做成了 UI 演示**。

下面这张表是你可以直接拿去写相关工作（Related Work）的对照：

| 你项目里的能力 | 现状 | 可直接借鉴的文献 | 你能做的增量 |
|---|---|---|---|
| 危险函数识别 | 名字匹配（`DANGER_FUNCS` 10 条） | MITRE CWE-120/242；污点分析（taint analysis） | 现在**没有数据流**：`strcpy` 的第三参数是不是不可信输入、buffer 有多大，都没判。这是真漏洞判定与"名字黑名单"的分水岭 |
| call 目标解析 | 依赖 capstone 输出 `@plt`（不存在） | RetroWrite / ARMORE 的 symbolization；`LIEF` | 用 `.rela.plt` + `.dynsym` 做符号化，几十行就能跑通 |
| 二进制级 N-day 补丁 | 无 | **Match & Mend**（2025）：minimally invasive local reassembly，"以最小侵入方式把补丁织入二进制" | 它的目标就是你说的"改一条 call"；你的场景是教学可视化，可以做它的**前端** |
| 补丁正确性验证 | 三个 `'OK'` | **VeriBin**（NDSS 2025） | 见下 |
| AST diff | 手写假数据 | **GumTree**（Falleri et al., ASE 2014）—— 树编辑距离做细粒度代码 diff | 你的 `astDiff` 字段结构其实和 GumTree 的 edit script 很像，接上就是真的 |
| 伪 C 提升 | 字符串拼接 | Ghidra decompiler / Hex-Rays；`angr` 的 decompiler | 终端日志第一行就写「Ghidra 提升完成」，但代码里从没调用过 Ghidra |

### 我认为最有价值的两个增量点

**增量点 1：补丁过程的可解释可视化（推荐）**

E9Patch、RetroWrite、Match & Mend 全是黑盒 CLI —— 给你一个 patched binary，不告诉你为什么这么改。而你做的是**教学平台**，天然适合把决策过程摊开：

> 这条 call 占 5 字节 → 新序列要 9 字节 → 原地放不下 → 找 code cave（0x401a20，24 字节可用）→ 写 trampoline（保存 rdi/rsi/rdx → 改参数 → call 新目标 → 恢复 → 跳回）→ 原位置改成 5 字节 `jmp`。

学术界基本没人做这件事，因为发论文不看重可视化；但它是真实需求，而且**不需要你重新发明重写器**——你只要把 E9Patch 的决策可视化出来。

**增量点 2：库函数替换的安全性判定**

`strcpy(buf, src)` → `strncpy(buf, src, n)` **不是等价变换**：
- `n` 从哪来？取 buffer 大小则可能截断（改变行为），取 `strlen(src)` 则等于没修；
- `strncpy` 不保证 `\0` 结尾 → 后续 `printf("%s")` 会越界读；
- 返回值语义不同（`strcpy` 返回 dst，`strncpy` 也返回 dst，但截断时不报错）。

VeriBin 只做通用等价检查，没做"标准库函数语义差异"这一层。**"这个替换安全吗"的判定规则 + 自动补 `\0` 语句**，是个能做、能写、体量合适的点，而且和你的 CWE 表天然咬合。

---

## 五、要把四个算法做成真的：最小可行路径

按依赖顺序，每一步都能独立验证：

**Step 1 · 符号解析（半天）**
读 `.rela.plt` → `r_info>>32` 取 dynsym 下标 → `.dynsym[i].st_name` → 建 `{plt_addr: func_name}`。改 `elf_parser.py:80` 的类型判断（`SHT_DYNSYM`）。验收标准：`analyze` 在真实 `/bin/ls` 上能报出 `printf`/`malloc`/`memcpy`，且危险调用非空。

**Step 2 · 栈帧分析（一天）**
序言匹配四种形态 → 取 `sub rsp, imm` 的帧大小 → 扫描 `[rbp-X]` 引用 + `lea rax,[rbp-X]` 得到局部缓冲区偏移。验收标准：对 `gcc -O0` / `-O2` 两个版本编译的同一份 `target.c`，都能算出 `buffer` 的 rbp 偏移和可用长度，且与 `gdb` 的 `info frame` 一致。

**Step 3 · 等长覆盖 + trampoline（两三天）**
先做**同签名替换**（只改 rel32，5 字节原地改）——这一步不需要 code cave，能立刻产出真正可运行的 patched ELF。再做变长替换 + trampoline。验收标准：`patched.elf` 能被 loader 加载、行为符合预期、`ltrace` 能看到新函数被调用。

**Step 4 · 三重校验（一天）**
① byte diff（期望改写字节 vs 实际）；② patch 点重反汇编，确认解码为目标指令而非错位垃圾；③ 跑回归用例。诚实的三重校验，比 UI 上三个 `'OK'` 有用一百倍。

---

## 六、附：证据索引

| 位置 | 问题 |
|---|---|
| `dilipa/disassembler.py:83-96` | `_parse_call_target()` 只认 `@plt`，capstone 只输出地址 → call 永远识别不到 |
| `dilipa/disassembler.py:29-37` | 非 x86 架构静默回退 x86-64 |
| `dilipa/elf_parser.py:80` | `.dynsym` 被 `!= SHT_SYMTAB` 误过滤 |
| `dilipa/elf_parser.py:88-104` | `plt_entries`/`got_addresses` 只是段基址，非映射 |
| `dilipa/cli.py:195-199` | `patch` 自认预览模式，无二进制重写 |
| `dilipa/cli.py:242` | `--out x.elf` 实际写 `x.json` |
| `dilipa/cli.py:131` | `--func` 死参数，`lift` 不按函数过滤 |
| `dilipa/cli.py:270-282` | `_make_pseudo_c` 把所有 call 塞进一个虚构函数，无函数边界 |
| `src/components/DilipaWorkbench.tsx:41` | `funcs` 硬编码演示数据（C/汇编/终端全是字符串） |
| `src/components/DilipaWorkbench.tsx:835-838` | 三重校验 = 三个 `'OK'` 字面量 |
| `src/components/DilipaWorkbench.tsx:117` | `verified OK` 为预置文案 |
| `scripts/make_test_elf.py` | 生成的样本无有效 `.text`（已重写，见 `deliverables/make_test_elf.py`） |

---

## 七、参考文献

1. Duck, G. J., & Roland, H. (2020). **E9Patch: A Scalable Static Binary Rewriting Tool for Closed-Source Binaries**. PLDI 2020.
2. Hunt, G., & Scott, D. (1999). **Detours: Binary Interception of Win32 Functions**. USENIX Windows NT Symposium.
3. Wenzl, M., Merzdovnik, G., Ullrich, J., & Weippl, E. (2019). **From Hack to Elaborate Technique — A Survey on Binary Rewriting**. ACM Computing Surveys.
4. Dinesh, S., et al. (2020). **RetroWrite: Statically Instrumenting COTS Binaries for Fuzzing and Sanitization**. IEEE S&P 2020.
5. Williams-King, D., et al. (2020). **Egalito: Layout-Agnostic Binary Recompilation**. ASPL 2020.
6. Bauman, E., et al. (2018). **Superset Disassembly: Statically Rewriting x86 Binaries Without Heuristics** (Multiverse). NDSS 2018.
7. Wu, H., et al. (2025). **VeriBin: Adaptive Verification of Patches at the Binary Level**. NDSS 2025.
8. Brumley, D., et al. (2013). **APEG: Automatic Patch-Based Exploit Generation**. NDSS 2008 / 相关后续工作.
9. Falleri, J.-R., et al. (2014). **Fine-grained and Accurate Source Code Differencing** (GumTree). ASE 2014.
10. Bao, T., et al. (2015). **ByteWeight: Learning to Recognize Functions in Binary Code**. USENIX Security 2015.
11. LIEF Documentation. **Infecting the PLT/GOT**. https://lief.re/doc/latest/tutorials/05_elf_infect_plt_got.html
12. MITRE. **CWE-120 / CWE-242 / CWE-78**. https://cwe.mitre.org
