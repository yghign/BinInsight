#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_sample_report.py — 从一份测试 ELF 生成与 `dilipa analyze` 同构的 JSON 报告。

用途（BinInsight 课程作业演示闭环，T10）：
  1. pyelftools 读 .rela.plt：用 r_offset（GOT 槽地址）与 r_info >> 32（.dynsym 下标）
     解析出每个 PLT 重定位对应的函数名；
  2. 解析 .plt 每条桩的 `jmp qword ptr [rip+disp32]`，把「GOT 槽地址」反查成
     「PLT 入口地址 → 函数名」映射；
  3. capstone 线性反汇编 .text，把 `call 0x401020` 这类纯数字目标地址映射回符号名；
  4. 套用与仓库一致的 10 条危险函数名单（safe_replace / cwe_of），输出 JSON。

诚实口径（演示不穿帮）：
  - 这份报告是「演示样例」：由课前独立脚本从测试 ELF 生成，不是仓库 CLI 原样跑出的
    结果，也不是网页现场即兴运行；网页端必须标「演示样例」。
  - 不 import dilipa，不修改 dilipa-tool/**/*.py，不写回二进制；
    不做补丁等价性校验、语法树对比或反编译提升。
  - 只依赖 pyelftools / capstone；缺依赖、找不到 .text、空结果均以非零码退出。

用法（在 deliverables 目录下）：
  python make_test_elf.py -o test-minimal.elf
  python make_sample_report.py test-minimal.elf -o dilipa-report.json
  python verify_report.py dilipa-report.json
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path
from typing import Any, Optional

# ── 依赖检查：缺任何一个都以非零码退出，不吞异常 ────────────────────
try:
    from elftools.elf.elffile import ELFFile
except ImportError as exc:  # pragma: no cover - 环境缺依赖时才会走到
    print(f"[!] 缺少依赖 pyelftools：{exc}", file=sys.stderr)
    print("    请在演示用 venv 中安装：pip install pyelftools", file=sys.stderr)
    raise SystemExit(2)

try:
    from capstone import Cs, CS_ARCH_X86, CS_MODE_64, CS_MODE_32
except ImportError as exc:  # pragma: no cover - 环境缺依赖时才会走到
    print(f"[!] 缺少依赖 capstone：{exc}", file=sys.stderr)
    print("    请在演示用 venv 中安装：pip install capstone", file=sys.stderr)
    raise SystemExit(2)


# ── 与 dilipa-tool/dilipa/danger_funcs.py 完全一致的 10 条名单 ───────
# 自包含副本（不 import dilipa，保证脚本独立可运行）；如仓库名单变更，需同步此处。
DANGER_FUNCS: list[tuple[str, str, str]] = [
    ("gets", "fgets", "CWE-242"),
    ("strcpy", "strncpy", "CWE-120"),
    ("strcat", "strncat", "CWE-120"),
    ("sprintf", "snprintf", "CWE-120"),
    ("vsprintf", "vsnprintf", "CWE-120"),
    ("scanf", "scanf(加字段宽度)", "CWE-242"),
    ("system", "execvp", "CWE-78"),
    ("popen", "pipe+execvp", "CWE-78"),
    ("atoi", "strtol", "CWE-190"),
    ("atol", "strtol", "CWE-190"),
]
DANGER_NAMES: set[str] = {name for name, _, _ in DANGER_FUNCS}

# 与 dilipa-tool/dilipa/__init__.py::__version__ 对齐的报告契约版本（只读参照，不 import）。
REPORT_VERSION = "0.1.0"

# 与 dilipa-tool/dilipa/elf_parser.py 的归一化表一致，保证 JSON 字段口径同构。
ARCH_MAP: dict[str, str] = {
    "EM_X86_64": "x86-64",
    "EM_386": "i386",
    "EM_AARCH64": "ARM64",
    "EM_ARM": "ARM",
    "EM_MIPS": "MIPS",
    "EM_PPC": "PPC",
}
TYPE_MAP: dict[str, str] = {
    "ET_EXEC": "executable",
    "ET_DYN": "shared_object_or_PIE",
    "ET_REL": "relocatable",
    "ET_CORE": "core_dump",
}


def safe_replace(name: str) -> Optional[str]:
    """返回危险函数的安全替代；名单里没有则返回 None（不猜测）。"""
    for danger, safe, _cwe in DANGER_FUNCS:
        if name == danger:
            return safe
    return None


def cwe_of(name: str) -> Optional[str]:
    """返回危险函数的 CWE 类别；名单里没有则返回 None。"""
    for danger, _safe, cwe in DANGER_FUNCS:
        if name == danger:
            return cwe
    return None


def fix_windows_encoding() -> None:
    """Windows 控制台默认 GBK，中文摘要会乱码；尽量切到 UTF-8。"""
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if reconf is None:
            continue
        try:
            reconf(encoding="utf-8", errors="replace")
        except Exception:
            pass


def _header(elf: ELFFile, path_label: str) -> dict[str, Any]:
    """复刻 cli.py::_header() 的字段与类型。"""
    ehdr = elf.header
    bits = 64 if elf.elfclass == 64 else 32
    endian = "little" if elf.little_endian else "big"
    machine = str(ehdr["e_machine"])
    etype = str(ehdr["e_type"])
    return {
        "tool": "dilipa",
        "version": REPORT_VERSION,
        "path": path_label,
        "arch": ARCH_MAP.get(machine, machine),
        "bits": bits,
        "endian": endian,
        "e_type": TYPE_MAP.get(etype, etype),
        "entry": hex(int(ehdr["e_entry"])),
        "sections": [sec.name for sec in elf.iter_sections()],
    }


def build_plt_map(elf: ELFFile) -> dict[int, str]:
    """
    建立 {PLT 入口虚拟地址 → 函数名}。

    步骤：
      a. 遍历 .rela.plt 的每条重定位：
         r_offset = GOT 槽地址；r_info >> 32 = .dynsym 下标（ELF64，ELF32 为 >> 8）；
         从 sh_link 指向的 .dynsym 取 st_name，得到 got_to_name 与 reloc_index_to_name。
      b. 遍历 .plt 每条桩（默认 16 字节，取 sh_entsize）：
         `FF 25 <disp32>` = jmp qword ptr [rip+disp32]，目标地址 = 入口地址 + 6 + disp，
         恰好是 a 步的 r_offset；据此把 PLT 入口地址映射到函数名。
         兜底：若 jmp 未命中，读 `68 <imm32>`（push 重定位序号）按序号查函数名。
    """
    rela = elf.get_section_by_name(".rela.plt")
    plt = elf.get_section_by_name(".plt")
    if rela is None or plt is None:
        return {}

    dynsym = elf.get_section(int(rela["sh_link"]))
    got_to_name: dict[int, str] = {}
    reloc_index_to_name: dict[int, str] = {}
    shift = 32 if elf.elfclass == 64 else 8

    for idx, reloc in enumerate(rela.iter_relocations()):
        sym_idx = int(reloc["r_info"]) >> shift
        name = ""
        try:
            name = dynsym.get_symbol(sym_idx).name or ""
        except (IndexError, KeyError, TypeError, AttributeError):
            name = ""
        if not name:
            continue
        got_to_name[int(reloc["r_offset"])] = name
        reloc_index_to_name[idx] = name

    plt_data: bytes = plt.data()
    plt_addr: int = int(plt["sh_addr"])
    ent_size: int = int(plt["sh_entsize"]) or 16
    if ent_size <= 0:
        ent_size = 16

    mapping: dict[int, str] = {}
    for i in range(len(plt_data) // ent_size):
        entry = plt_data[i * ent_size : (i + 1) * ent_size]
        entry_addr = plt_addr + i * ent_size
        name = ""

        # 主路径：jmp qword ptr [rip+disp32] → GOT 槽地址 → .rela.plt
        if len(entry) >= 6 and entry[0] == 0xFF and entry[1] == 0x25:
            disp = struct.unpack_from("<i", entry, 2)[0]
            got_target = entry_addr + 6 + disp
            name = got_to_name.get(got_target, "")

        # 兜底路径：push <reloc index> → .rela.plt 第 idx 条
        if not name and len(entry) >= 11 and entry[6] == 0x68:
            ridx = struct.unpack_from("<I", entry, 7)[0]
            name = reloc_index_to_name.get(ridx, "")

        if name:
            mapping[entry_addr] = name

    return mapping


def parse_call_target(op_str: str) -> Optional[int]:
    """
    解析 capstone 的 call 操作数为绝对目标地址。

    近调用 `E8 <rel32>` 在 capstone 里显示为绝对地址（如 "0x401020"）；
    间接调用（qword ptr [...] 等）无法解析时返回 None，绝不猜测函数名。
    """
    text = op_str.strip()
    try:
        if text.lower().startswith("0x"):
            return int(text, 16)
        if text.isdigit():
            return int(text, 10)
    except ValueError:
        return None
    return None


def disassemble_text(
    elf: ELFFile, plt_map: dict[int, str]
) -> tuple[list[dict[str, Any]], int]:
    """线性反汇编 .text，返回 (call 记录列表, 指令总数)。"""
    text = elf.get_section_by_name(".text")
    if text is None:
        raise ValueError("ELF 中没有 .text 段，无法反汇编")

    code: bytes = text.data()
    base: int = int(text["sh_addr"])
    bits = 64 if elf.elfclass == 64 else 32
    md = Cs(CS_ARCH_X86, CS_MODE_64 if bits == 64 else CS_MODE_32)
    md.detail = False

    calls: list[dict[str, Any]] = []
    instruction_count = 0

    for insn in md.disasm(code, base):
        instruction_count += 1
        if insn.mnemonic != "call":
            continue
        target = parse_call_target(insn.op_str)
        if target is None:
            # 间接调用：不猜测目标，跳过（与仓库 CLI 的只认直接 call 口径一致）
            continue
        func_name = plt_map.get(target)
        if not func_name:
            # 目标是内部函数或未在 PLT 映射中：不伪装成危险调用，跳过
            continue

        danger = func_name in DANGER_NAMES
        calls.append(
            {
                "address": hex(insn.address),
                "target_plt": f"{func_name}@plt",
                "target_func": func_name,
                "is_dangerous": danger,
                "safe_alt": safe_replace(func_name) if danger else None,
                "cwe": cwe_of(func_name) if danger else None,
            }
        )

    return calls, instruction_count


def build_report(elf_path: Path, path_label: str) -> dict[str, Any]:
    """真实解析 ELF，产出与 cli.py::analyze 同构的报告对象。"""
    with elf_path.open("rb") as f:
        elf = ELFFile(f)
        report = _header(elf, path_label)
        plt_map = build_plt_map(elf)
        calls, instruction_count = disassemble_text(elf, plt_map)

    report["cmd"] = "analyze"
    report["calls"] = calls
    report["dangerous"] = [c for c in calls if c["is_dangerous"]]
    report["instruction_count"] = instruction_count
    return report


def main(argv: Optional[list[str]] = None) -> int:
    fix_windows_encoding()
    parser = argparse.ArgumentParser(
        description="从测试 ELF 生成一份与 dilipa analyze 同构的 JSON 报告（演示样例）"
    )
    parser.add_argument("elf", help="输入 ELF 文件路径（由 make_test_elf.py 生成）")
    parser.add_argument(
        "-o", "--output", default="dilipa-report.json", help="JSON 输出路径（默认 dilipa-report.json）"
    )
    args = parser.parse_args(argv)

    elf_path = Path(args.elf)
    if not elf_path.is_file():
        print(f"[!] 找不到 ELF 文件：{elf_path}", file=sys.stderr)
        return 4

    try:
        report = build_report(elf_path, str(args.elf))
    except (ValueError, OSError) as exc:
        print(f"[!] 解析 ELF 失败：{exc}", file=sys.stderr)
        return 5

    calls = report["calls"]
    dangerous = report["dangerous"]

    if not calls:
        print("[!] 没有解析到任何 call，拒绝把空结果写成样例。", file=sys.stderr)
        print("    请确认 .rela.plt / .plt / .text 齐全，或换用 make_test_elf.py 生成的样本。", file=sys.stderr)
        return 3
    if not dangerous:
        print("[!] dangerous 为空：没有命中危险函数，拒绝把空结果写成样例。", file=sys.stderr)
        return 3

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"[+] 演示样例报告已生成：{out_path}")
    print("    来源状态：演示样例（课前独立脚本生成，非仓库 CLI 原样跑出，非现场运行）")
    print(f"    tool={report['tool']} version={report['version']} path={report['path']}")
    print(f"    {report['arch']} / {report['bits']} bit / {report['endian']} / {report['e_type']}")
    print(f"    指令数 {report['instruction_count']} · call {len(calls)} 条 · 危险调用 {len(dangerous)} 条")
    for item in dangerous:
        print(
            f"      - {item['target_func']} @ {item['address']} "
            f"({item['cwe']}) → 建议换成 {item['safe_alt']}"
        )
    print("    未做：二进制重写 / 补丁校验 / 语法树对比 / 反编译提升（均为规划中）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
