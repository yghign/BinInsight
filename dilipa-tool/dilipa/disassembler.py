"""Capstone 反汇编 + call 指令检测."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Iterable, Optional

from capstone import Cs, CS_ARCH_X86, CS_MODE_64, CS_MODE_32

from .danger_funcs import DANGER_NAMES, safe_replace, cwe_of


@dataclass
class CallSite:
    address: int           # call 指令所在地址
    target_plt: str        # 目标 PLT 标签, 例如 strcpy@plt
    target_func: str       # 目标函数名, 例如 strcpy
    is_dangerous: bool
    safe_alt: Optional[str] = None
    cwe: Optional[str] = None


@dataclass
class DisasmResult:
    arch: str
    bits: int
    instructions: list[dict] = field(default_factory=list)
    call_sites: list[CallSite] = field(default_factory=list)


def _make_cs(arch: str, bits: int) -> Cs:
    if arch in ("x86-64", "X86-64", "x86_64"):
        md = Cs(CS_ARCH_X86, CS_MODE_64)
    elif arch in ("i386", "x86", "386"):
        md = Cs(CS_ARCH_X86, CS_MODE_32)
    else:
        # 默认 x86-64, 其他架构需要 Capstone 额外支持
        md = Cs(CS_ARCH_X86, CS_MODE_64)
    md.detail = False
    return md


def disassemble(
    code: bytes,
    base: int,
    arch: str = "x86-64",
    bits: int = 64,
) -> DisasmResult:
    """反汇编 code 字节流, 从 base 地址开始.

    同时扫描所有 call 指令, 识别危险函数.
    """
    md = _make_cs(arch, bits)
    result = DisasmResult(arch=arch, bits=bits)

    for insn in md.disasm(code, base):
        entry = {
            "addr": hex(insn.address),
            "mnemonic": insn.mnemonic,
            "op_str": insn.op_str,
            "size": insn.size,
            "bytes": insn.bytes.hex(),
        }
        result.instructions.append(entry)

        if insn.mnemonic == "call":
            target = _parse_call_target(insn.op_str)
            if target:
                func_name = _strip_plt_suffix(target)
                danger = func_name in DANGER_NAMES
                result.call_sites.append(
                    CallSite(
                        address=insn.address,
                        target_plt=target,
                        target_func=func_name,
                        is_dangerous=danger,
                        safe_alt=safe_replace(func_name) if danger else None,
                        cwe=cwe_of(func_name) if danger else None,
                    )
                )

    return result


def _parse_call_target(op_str: str) -> Optional[str]:
    """从 call 操作数字符串中提取函数名.

    call strcpy@plt
    call printf@plt
    call qword ptr [rax + 0x123]   <- 间接调用, 返回 None
    """
    op_str = op_str.strip()
    if "@plt" in op_str:
        return op_str.strip()
    # 直接 call 数字 (相对地址) — 可能是内部函数, 这里不解析
    if op_str.isdigit():
        return None
    return None


def _strip_plt_suffix(s: str) -> str:
    return s.replace("@plt", "").strip()


def call_sites_to_dicts(sites: Iterable[CallSite]) -> list[dict]:
    return [
        {
            "address": hex(s.address),
            "target_plt": s.target_plt,
            "target_func": s.target_func,
            "is_dangerous": s.is_dangerous,
            "safe_alt": s.safe_alt,
            "cwe": s.cwe,
        }
        for s in sites
    ]
