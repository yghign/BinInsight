"""Dilipa CLI — 三种子命令: analyze / lift / patch.

用法:
  dilipa analyze target.elf                   # 扫描危险调用
  dilipa lift    target.elf --func main       # 反汇编指定函数, 生成 JSON
  dilipa patch   target.elf --replace strcpy:strncpy --out patched.elf

Windows 下如果直接执行 dilipa 找不到命令:
  python -m dilipa analyze target.elf         # 用 python -m 代替
"""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path

import click

from . import __version__
from .elf_parser import parse_elf, ElfInfo
from .disassembler import disassemble, call_sites_to_dicts
from .danger_funcs import DANGER_NAMES, safe_replace, cwe_of


# ── Windows 编码修复 ────────────────────────────────────────────
# Windows CMD 默认 GBK (cp936), Python 输出 UTF-8 会乱码.
# 尝试把 stdout/stderr 重配置为 UTF-8, 并把控制台切到 65001 代码页.
def _fix_windows_encoding() -> None:
    if sys.platform != "win32":
        return
    # 1) 切代码页 (chcp 65001) — 让 cmd 认识 UTF-8 输出
    try:
        import ctypes
        ctypes.windll.kernel32.SetConsoleOutputCP(65001)
        ctypes.windll.kernel32.SetConsoleCP(65001)
    except Exception:
        pass  # 忽略: 在重定向 / 非控制台环境会失败

    # 2) 重配置 Python 的 stdout/stderr 为 UTF-8
    #    reconfigure 是 TextIOBase 的方法，但 pyright 的 TextIO stub 里没声明
    #    — 用 getattr 绕过去保证类型安全
    try:
        reconf = getattr(sys.stdout, "reconfigure", None)
        if reconf is not None:
            reconf(encoding="utf-8", errors="replace")
    except Exception:
        pass
    try:
        reconf = getattr(sys.stderr, "reconfigure", None)
        if reconf is not None:
            reconf(encoding="utf-8", errors="replace")
    except Exception:
        pass


_fix_windows_encoding()


def _header(elf: ElfInfo) -> dict:
    return {
        "tool": "dilipa",
        "version": __version__,
        "path": elf.path,
        "arch": elf.arch,
        "bits": elf.bits,
        "endian": elf.endian,
        "e_type": elf.e_type,
        "entry": hex(elf.entry),
        "sections": elf.sections,
    }


@click.group(help="Dilipa — 二进制微补丁工具集")
@click.version_option(__version__)
def main() -> None:
    pass


# ── analyze ──────────────────────────────────────────────────

@main.command(help="扫描 ELF 文件中的危险函数调用, 输出 dilipa-report.json")
@click.argument("elf", type=click.Path(exists=True))
@click.option(
    "--output", "-o",
    type=click.Path(),
    default="dilipa-report.json",
    help="JSON 输出路径 (默认 dilipa-report.json)",
)
def analyze(elf: str, output: str) -> None:
    info = parse_elf(elf)

    if info.text_offset is None:
        click.echo("[!] 未找到 .text 段, 无法反汇编", err=True)
        sys.exit(1)

    code = _read_text_section(elf, info)
    result = disassemble(code, info.text_vaddr or 0, info.arch, info.bits)

    report = _header(info)
    report["cmd"] = "analyze"
    report["calls"] = call_sites_to_dicts(result.call_sites)
    report["dangerous"] = [c for c in report["calls"] if c["is_dangerous"]]
    report["instruction_count"] = len(result.instructions)

    with open(output, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    click.echo(f"[✓] 分析完成: {output}")
    click.echo(f"    指令总数: {len(result.instructions)}")
    click.echo(f"    call 总数: {len(result.call_sites)}")
    click.echo(f"    危险调用: {len(report['dangerous'])}")
    for d in report["dangerous"]:
        click.echo(f"      - {d['target_func']} @ {d['address']} ({d['cwe']})  → {d['safe_alt']}")


# ── lift ─────────────────────────────────────────────────────

@main.command(help="反汇编 .text 段, 生成 ast-diff.json (供网页工作台读取)")
@click.argument("elf", type=click.Path(exists=True))
@click.option(
    "--output", "-o",
    type=click.Path(),
    default="ast-diff.json",
    help="JSON 输出路径 (默认 ast-diff.json)",
)
@click.option(
    "--func", "-f",
    default=None,
    help="只列出该函数内的 call (按符号名匹配, 需要有符号表)",
)
def lift(elf: str, output: str, func: str | None) -> None:
    info = parse_elf(elf)

    if info.text_offset is None:
        click.echo("[!] 未找到 .text 段", err=True)
        sys.exit(1)

    code = _read_text_section(elf, info)
    result = disassemble(code, info.text_vaddr or 0, info.arch, info.bits)

    ast_diff = _header(info)
    ast_diff["cmd"] = "lift"
    ast_diff["source"] = "dilipa lift"
    ast_diff["instructions"] = result.instructions

    # 伪 C: 这里简化 — 我们根据 call 生成伪 C 片段, 用于网页工作台展示
    ast_diff["pseudo_c"] = _make_pseudo_c(result.call_sites, info)

    # 修改建议 (替换 call 目标)
    changes: list[dict] = []
    for cs in result.call_sites:
        if cs.is_dangerous and cs.safe_alt:
            changes.append({
                "type": "replace_call",
                "addr": hex(cs.address),
                "old": cs.target_plt,
                "old_func": cs.target_func,
                "new_target_func": cs.safe_alt,
                "cwe": cs.cwe,
                "safe_suggestion": _suggest_fix(cs.target_func, cs.safe_alt),
            })

    ast_diff["changes"] = changes

    with open(output, "w", encoding="utf-8") as f:
        json.dump(ast_diff, f, indent=2, ensure_ascii=False)

    click.echo(f"[✓] 反汇编完成: {output}")
    click.echo(f"    反汇编指令: {len(result.instructions)}")
    click.echo(f"    call 指令:  {len(result.call_sites)}")
    click.echo(f"    修改建议:   {len(changes)}")


# ── patch ─────────────────────────────────────────────────────

@main.command(help="替换指定 call 的目标函数, 输出 patched binary + ast-diff.json")
@click.argument("elf", type=click.Path(exists=True))
@click.option(
    "--replace", "-r",
    multiple=True,
    default=None,
    help="替换项, 格式 old_func:new_func, 可多次指定. 例: strcpy:strncpy",
)
@click.option(
    "--out", "-o",
    type=click.Path(),
    default="patched.elf",
    help="patched 二进制输出路径 (默认 patched.elf)",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="只预览不写盘",
)
def patch(elf: str, replace: tuple[tuple[str, ...], ...], out: str, dry_run: bool) -> None:
    """目前为预览模式 — 显示要替换什么, 不直接改二进制.

    真实二进制重写需要 keystone + 空间分析, 这里只输出 JSON 供网页展示.
    """
    if not replace:
        click.echo("[!] 至少指定一个 --replace old:new", err=True)
        sys.exit(1)

    info = parse_elf(elf)
    code = _read_text_section(elf, info)
    result = disassemble(code, info.text_vaddr or 0, info.arch, info.bits)

    repl_map: dict[str, str] = {}
    for pair in replace:
        # pair 是一个 tuple, 其中包含冒号分隔的字符串
        s = pair[0] if isinstance(pair, tuple) else pair
        if ":" in s:
            old, new = s.split(":", 1)
            repl_map[old.strip()] = new.strip()

    changes: list[dict] = []
    for cs in result.call_sites:
        if cs.target_func in repl_map:
            new_func = repl_map[cs.target_func]
            changes.append({
                "type": "replace_call",
                "addr": hex(cs.address),
                "old": cs.target_plt,
                "old_func": cs.target_func,
                "new_func": new_func,
                "cwe": cs.cwe,
                "note": "真实重写需要 code cave, 此处仅生成 JSON 预览",
            })

    if not changes:
        click.echo("[i] 没有找到可替换的 call 指令")
        return

    click.echo(f"[*] 将要替换 {len(changes)} 处 call:")
    for c in changes:
        click.echo(f"    {c['addr']}: {c['old_func']} → {c['new_func']}  ({c['cwe']})")

    if dry_run:
        click.echo("[dry-run] 不写盘, 结束")
        return

    out_json = Path(out).with_suffix(".json")
    report = _header(info)
    report["cmd"] = "patch"
    report["output"] = out
    report["changes"] = changes
    report["note"] = "patch_preview: Dilipa 当前版本只输出变更预览, 不直接写二进制"

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    click.echo(f"[✓] 预览 JSON: {out_json}")


# ── 内部辅助 ──────────────────────────────────────────────────

def _read_text_section(elf_path: str, info: ElfInfo) -> bytes:
    from elftools.elf.elffile import ELFFile
    with open(elf_path, "rb") as f:
        elf = ELFFile(f)
        sec = elf.get_section_by_name(".text")
        if sec is None:
            raise RuntimeError(".text section not found")
        data = sec.data()
        if data is None:
            raise RuntimeError(".text section has no data")
        return data


def _make_pseudo_c(call_sites, info: ElfInfo) -> str:
    """简化伪 C — 把 call 转成 C 调用语句."""
    lines = ["// Dilipa 自动生成的伪 C 片段（简化版）"]
    lines.append(f"// 文件: {Path(info.path).name}  arch={info.arch}")
    lines.append("")
    lines.append("void lifted_function() {")
    lines.append("    // 以下是 .text 段中的所有外部函数调用")
    for cs in call_sites:
        mark = "  [危险]" if cs.is_dangerous else "       "
        hint = f"  ← 危险, 建议替换为 {cs.safe_alt}()" if cs.safe_alt else ""
        lines.append(f"    {mark} {cs.target_func}(&x);    // addr={hex(cs.address)}{hint}")
    lines.append("}")
    return "\n".join(lines)


def _suggest_fix(old: str, new: str) -> str:
    """给一行中文建议."""
    fixes = {
        ("strcpy", "strncpy"):
            "strncpy(buf, input, size-1); buf[size-1] = '\\0';",
        ("strcat", "strncat"):
            "strncat(dst, src, dst_size - strlen(dst) - 1);",
        ("gets", "fgets"):
            "fgets(buf, sizeof(buf), stdin); buf[strcspn(buf, '\\n')] = 0;",
        ("sprintf", "snprintf"):
            "snprintf(buf, sizeof(buf), fmt, ...);",
        ("scanf", "scanf_s"):
            "改用 scanf_s 或手动限制字段宽度 (scanf(\"%19s\", buf))",
    }
    return fixes.get((old, new), f"建议使用 {new}() 替代 {old}()")


if __name__ == "__main__":
    main()
