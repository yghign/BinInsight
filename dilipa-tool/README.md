# Dilipa — 二进制微补丁工具集

> 把二进制补丁表达为对提升后 C 代码的编辑. CLI 扫描 ELF 中的危险函数调用, 输出 JSON 供 [BinInsight 网页工作台](https://yghign.github.io/BinInsight/tools/dilipa) 可视化展示.

## 功能

| 子命令 | 作用 | 输出 |
|--------|------|------|
| `dilipa analyze <elf>` | 扫描 .text 段中的危险函数调用 | `dilipa-report.json` |
| `dilipa lift <elf>`    | 反汇编 .text 段 + 伪 C + 修改建议 | `ast-diff.json` |
| `dilipa patch <elf> --replace strcpy:strncpy` | 预览替换哪些 call 目标 | `patched.json` (预览) |

## 快速开始

### 方式一: pip 安装 (推荐开发用)

```bash
pip install -r requirements.txt
python -m dilipa --help
```

### 方式二: PyInstaller 打包 (推荐分发用)

```bash
pip install pyinstaller
pyinstaller --onefile --name dilipa dilipa/__main__.py \
    --collect-all capstone --collect-all elftools
# 产物在 dist/dilipa.exe
```

或 Windows 下直接双击 `build_windows.bat`.

### 方式三: 下载 Release 二进制

访问 [GitHub Releases](https://github.com/yghign/BinInsight/releases) 下载 `dilipa-windows-x64.zip`.

## 典型工作流

```bash
# 1. 编译一个漏洞百出的测试程序 (Kali / Linux)
gcc -fno-pic -no-pie target.c -o target.elf

# 2. Dilipa 扫描
dilipa analyze target.elf -o report.json

# 3. Dilipa 反汇编 + 修改建议
dilipa lift target.elf -o ast-diff.json

# 4. 在浏览器打开 BinInsight Dilipa 工作台,
#    把这两个 JSON 拖进去就能看到真实数据的可视化
```

## 支持的危险函数

| 危险 | 安全替代 | CWE |
|------|----------|-----|
| `gets`       | `fgets`       | CWE-242 |
| `strcpy`     | `strncpy`     | CWE-120 |
| `strcat`     | `strncat`     | CWE-120 |
| `sprintf`    | `snprintf`    | CWE-120 |
| `vsprintf`   | `vsnprintf`   | CWE-120 |
| `system`     | `execvp`      | CWE-78  |

## 架构支持

- **完整**: x86-64 (本机测试)
- **需验证**: i386, ARM64, ARM, MIPS (Capstone 支持, 未真机测试)

## 限制

- Dilipa **不集成 Ghidra** — 这是有意简化, 让工具保持轻量
- 只支持 ELF 格式 (Linux / Unix 二进制), Windows PE 暂不支持
- `patch` 子命令目前是 **预览模式** (输出 JSON, 不直接改二进制), 真实重写需要 code cave 分析 + keystone 汇编器

## 目录结构

```
dilipa-tool/
├── dilipa/               # Python 包
│   ├── cli.py            # click 子命令入口
│   ├── elf_parser.py     # pyelftools 解析
│   ├── disassembler.py   # capstone 反汇编 + call 扫描
│   ├── danger_funcs.py   # 危险函数名单
│   └── __main__.py
├── scripts/              # 辅助脚本
├── samples/              # 示例 C 源码
├── build_windows.bat     # Windows 一键打包
├── requirements.txt
├── setup.py
└── README.md
```

## 许可证

MIT
