# BinInsight · 演示复现说明（课前生成演示样例）

> 本文件面向「老师现场追问 / 学生自己复现」。口径先行：
>
> - 网页里内置的 `dilipa-report.json` / `src/data/sample-report.json` 是 **「演示样例」**：
>   由本目录下**课前独立脚本**从一份测试 ELF 真实解析生成，
>   **不是仓库内 `dilipa-tool` 的 CLI 原样跑出的结果，也不是网页现场即兴运行**。
> - 你在网页上点「导入我自己的 JSON」后，数据才标为 **「真实输出」**，且严格按你那份 JSON 渲染。
> - 二进制重写、补丁等价性校验、语法树对比、反编译提升全部是 **「规划中」**，本次课程作业未实现。
> - `dilipa-tool/**/*.py` 一个字都没改；本目录 3 个 `.py` 互不 import `dilipa`，也不写回二进制。

---

## 一、三条命令（断网可复现，无需 Ghidra / Docker / 联网）

解释器用课程作业已备好的 venv（内含 `pyelftools 0.33`、`capstone 5.0.7`）：

```
D:/WorkSpace/BinInsight/.venv/Scripts/python.exe
```

工作目录切到本文件夹后，依次执行 3 条命令：

```bat
REM Windows CMD 写法（Git Bash 把 %PY% 换成 "$PY" 即可）
set PY=D:\WorkSpace\BinInsight\.venv\Scripts\python.exe

%PY% make_test_elf.py -o test-minimal.elf
%PY% make_sample_report.py test-minimal.elf -o dilipa-report.json
%PY% verify_report.py dilipa-report.json
```

| # | 命令 | 作用 | 产物 |
|---|------|------|------|
| 1 | `make_test_elf.py -o test-minimal.elf` | 纯标准库造一份合法 ELF64（`.text` / `.plt` / `.dynsym` / `.dynstr` / `.rela.plt` 齐全），含 2 个 `call` | `test-minimal.elf`（752 字节） |
| 2 | `make_sample_report.py test-minimal.elf -o dilipa-report.json` | pyelftools 读重定位 + capstone 线性反汇编，输出与 `cli.py analyze` 同构的 JSON | `dilipa-report.json` |
| 3 | `verify_report.py dilipa-report.json` | 纯标准库校验报告字段契约 | 退出码 `0` = 契约符合 |

把第 2 步产物覆盖到 `src/data/sample-report.json`，网页内置样例就与脚本实跑结果一致（本次交付已同步，两份文件 `diff` 完全一致）。

### 实跑输出（演示样例，真实可复现）

以下为本目录下的真实终端输出，未修改、未补写：

```
[+] 生成测试 ELF: test-minimal.elf  (752 bytes)
    入口 0x401000  .text 20 字节, 2 个 call → strcpy@plt / system@plt

[+] 演示样例报告已生成：dilipa-report.json
    来源状态：演示样例（课前独立脚本生成，非仓库 CLI 原样跑出，非现场运行）
    tool=dilipa version=0.1.0 path=test-minimal.elf
    x86-64 / 64 bit / little / executable
    指令数 5 · call 2 条 · 危险调用 2 条
      - strcpy @ 0x401007 (CWE-120) → 建议换成 strncpy
      - system @ 0x40100c (CWE-78) → 建议换成 execvp
    未做：二进制重写 / 补丁校验 / 语法树对比 / 反编译提升（均为规划中）

[*] 校验目标：dilipa-report.json
[+] 顶层 13 个字段齐全、类型正确，cmd=analyze，tool=dilipa
[+] calls 2 条，每条 6 个字段齐全；dangerous 2 条与之一致
[+] 命中危险函数：strcpy, system
[+] instruction_count=5 · arch=x86-64 · bits=64 · entry=0x401000
[+] 来源状态：演示样例（校验脚本只检查契约，不判断数据是怎么生成的）
RESULT: PASS — 字段契约符合，可作为网页端的报告样例。
```

`dangerous` 非空，且同时含 `strcpy`（建议 `strncpy`，CWE-120）与 `system`（建议 `execvp`，CWE-78）。
网页端「下载样例 JSON → 再导入」这一条闭环全部在浏览器本地完成，不发网络请求、不写 localStorage。

---

## 二、脚本怎么把数字地址还原成函数名（为什么要单独写脚本）

`make_sample_report.py` 做 4 件事，全部只读、不猜：

1. **读 `.rela.plt`**：每条重定位的 `r_offset` 是 GOT 槽地址，`r_info >> 32` 是 `.dynsym` 下标；
   从 `sh_link` 指向的 `.dynsym` 取 `st_name`，得到「GOT 地址 → 函数名」（如 `strcpy` / `system`）。
2. **读 `.plt` 桩**：`FF 25 <disp32>` 即 `jmp qword ptr [rip+disp32]`，
   目标 `= 入口地址 + 6 + disp` 恰好等于第 1 步的 `r_offset`，据此建立
   「PLT 入口地址 → 函数名」映射；`68 <imm32>`（`push` 重定位序号）作为兜底。
3. **capstone 线性反汇编 `.text`**：`call 0x401020` 这类纯数字目标地址，
   用上面的映射还原为 `strcpy@plt` / `system@plt`；解析不出的间接调用直接跳过，不猜测函数名。
4. **套用与仓库一致的 10 条危险函数名单**（`gets` / `strcpy` / `strcat` / `sprintf` /
   `vsprintf` / `scanf` / `system` / `popen` / `atoi` / `atol`），
   逐条给出 `safe_alt` 与 `cwe`，输出 `cli.py::analyze` 同构的 13 个顶层字段。

字段契约（`cli.py::_header()` + `analyze()` + `call_sites_to_dicts()`）：

```
tool / version / path / arch / bits / endian / e_type / entry / sections
cmd / calls / dangerous / instruction_count
calls[] 每条：address(hex 字符串) / target_plt / target_func /
              is_dangerous / safe_alt / cwe
```

---

## 三、当前 `dilipa analyze` 的已知限制（必须如实说明）

仓库 `dilipa-tool/dilipa/disassembler.py` 的 `_parse_call_target()` 只认带 `@plt` 的字符串形式：

```python
if "@plt" in op_str:
    return op_str.strip()
if op_str.isdigit():
    return None          # 直接 call 数字（相对/绝对地址）不解析
```

而 capstone 对真实 ELF 线性反汇编时，`call` 的操作数是**纯数字地址**（如 `call 0x401020`），
因此现场跑 `python -m dilipa analyze target.elf` 常常得到 **「0 条危险调用」**。
另外 `elf_parser.py` 的符号表循环只处理 `SHT_SYMTAB`，会跳过 `.dynsym`（`SHT_DYNSYM`）。

**结论：空结果只能理解为「没有检测到 call」，绝不能当成「分析成功」或「目标程序安全」。**
网页端在 `calls` 为空时会直接显示这条提示（`NO_CALLS_HINT`），不伪装成成功。

这也是为什么演示不现场跑 CLI：改用课前独立脚本把数字地址映射回 PLT 符号名，
再把结果标为「演示样例」。仓库 `.py` 保持原样，便于老师直接对照源码讲这个缺陷。

---

## 四、老师可能追问的 3 问（标准回答）

**问 1：这份报告是现场跑出来的吗？能不能当场再跑一次？**
> 不是现场跑的，是课前用 `make_sample_report.py` 从 `test-minimal.elf` 真实解析生成的，
> 页面标「演示样例」。仓库 CLI 因为上面第 3 节的 `@plt` 解析限制，现场跑会得到 0 条 call，
> 所以演示不依赖它。您想看「真实输出」，可以在 Dilipa 页点「导入我自己的 JSON」，
> 把任意一份 `analyze` 报告导进来，页面会按那份报告的对象原样渲染并切换标签。

**问 2：危险函数名单和「建议换成 strncpy」是脚本自动分析出来的吗？**
> 不是静态污点分析，也不是漏洞利用验证。名单是仓库 `danger_funcs.py` 里 10 条人工整理的
> 危险函数 → 安全替代 → CWE 对照表，脚本只是做名字匹配。它回答「这一行是不是调用了不检查长度
> 的函数」，不回答「这个输入能不能真的走到这一行」——后者是主线 L4「条件门槛」讲的内容。

**问 3：patch 能把二进制改好吗？需要装 Ghidra、Docker 或联网吗？**
> 都不能、都不需要。本次只做只读的 ELF 解析 + 反汇编 + 危险调用名单 + JSON 报告，
> 以及网页上的「换成什么函数」文本对照；二进制重写、补丁等价性校验、语法树对比、
> 反编译提升都是「规划中」。网页端的导入 / 对照 / 三步预览全部在浏览器本地完成，
> 不发网络请求；Mutagen 则从头到尾只是设计构想，本次课程作业没有实现。

---

## 五、与网页的联动（网站 ↔ Dilipa JSON 报告）

```
课前（本目录，离线）                       网页端（浏览器，断网可闭环）
make_test_elf.py  → test-minimal.elf
make_sample_report.py → dilipa-report.json ──同步──→ src/data/sample-report.json
verify_report.py  → 契约校验                          │
                                                     ├─ 查看预置样例（演示样例）
                                                     ├─ 下载样例 JSON（Blob + <a download>）
                                                     └─ 导入我自己的 JSON（真实输出，FileReader）
                                                            ↓
                                     ReportCompareView（L2 逐条 call / L3 行级对照）
                                     DilipaWorkbench（三步预览，统计全部来自 report 对象）
```

- 所有统计数字（call 数、危险调用数、指令数、节区数）都来自 `report` 对象，页面不硬编码。
- `safe_alt` / `cwe` 缺失时显示「—」，不猜测替代函数；非 JSON、顶层非对象、超 1MB 显示错误卡片。
- 行级 diff 是「按行对齐的字符串比较」，只回答「哪几行变了」，**不是语法树对比（AST Diff）**。
- 页面所有演示 / 报告 / 统计 / 规划条目都挂「真实输出 / 演示样例 / 规划中」三态标签之一。

---

## 六、文件清单与边界

| 文件 | 依赖 | 作用 |
|------|------|------|
| `make_test_elf.py` | 纯标准库 | 生成测试 ELF（已存在，本次复用） |
| `make_sample_report.py` | pyelftools + capstone | 真实解析 ELF，输出演示样例报告 |
| `verify_report.py` | 纯标准库 | 校验报告字段契约 |
| `README-演示复现.md` | — | 本说明（3 条命令 + 已知限制 + 3 问标准回答） |
| `dilipa-algorithm-review.md` | — | 课前对 Dilipa 算法的核查记录（只读参考） |

**没有做、也不要宣称做过**：`import dilipa`、修改 `dilipa-tool/**/*.py`、
二进制重写、补丁校验、语法树对比、反编译提升、现场演示 CLI、任何下载/安装程序。
