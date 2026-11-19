"""生成一个最小但结构正确的 x86-64 ELF, 供 Dilipa CLI 自测.

替换 dilipa-tool/scripts/make_test_elf.py。

与仓库原版的区别:
  1. 真正写出 section headers (原版生成的样本没有 .text, dilipa analyze 直接报
     "未找到 .text 段"), 这里 .text/.plt/.dynsym/.dynstr/.rela.plt 全部齐全;
  2. 带上 .dynsym + .rela.plt, 使 call 目标地址能追溯到 strcpy/system 符号 ——
     这是验证 "call 目标解析" 是否真正工作的前提;
  3. 只用标准库, 不依赖 pyelftools / capstone, 系统 python 直接可跑。

用法:
    python make_test_elf.py                    # 输出到 ./samples/test-minimal.elf
    python make_test_elf.py -o 自定义路径.elf
"""
from __future__ import annotations

import struct
import sys
from pathlib import Path

# ── 假定布局 (ET_EXEC, 无 program header) ──────────────────────────
TEXT_VADDR = 0x401000
PLT_VADDR = 0x401020
DYNSYM_VADDR = 0x402000
DYNSTR_VADDR = 0x402100
RELA_VADDR = 0x402200
GOT_VADDR = 0x406000

SHT_NULL = 0
SHT_PROGBITS = 1
SHT_STRTAB = 3
SHT_RELA = 4
SHT_DYNSYM = 11

SHF_WRITE = 0x1
SHF_ALLOC = 0x2
SHF_EXECINSTR = 0x4

STB_GLOBAL = 1
STT_FUNC = 2
R_X86_64_JUMP_SLOT = 7


def _align(n: int, a: int = 8) -> int:
    return (n + a - 1) & ~(a - 1)


def build_text() -> bytes:
    """0x401000: mov rdi,0xdeadbeef ; call strcpy@plt ; call system@plt ; xor eax,eax ; ret"""
    buf = bytearray()

    # mov rdi, 0xdeadbeef
    buf += bytes([0x48, 0xC7, 0xC7]) + struct.pack("<I", 0xDEADBEEF)

    # call PLT[0] (strcpy)  —— 下一条指令地址 0x40100c
    call_addr = TEXT_VADDR + len(buf)
    disp = PLT_VADDR - (call_addr + 5)
    buf += bytes([0xE8]) + struct.pack("<i", disp)

    # call PLT[1] (system)
    call_addr = TEXT_VADDR + len(buf)
    disp = (PLT_VADDR + 16) - (call_addr + 5)
    buf += bytes([0xE8]) + struct.pack("<i", disp)

    buf += bytes([0x31, 0xC0])   # xor eax, eax
    buf += bytes([0xC3])         # ret
    return bytes(buf)


def build_plt() -> bytes:
    """两个 16 字节的 PLT 条目: jmp qword ptr [rip+disp] + 占位填充."""
    out = bytearray()
    for i in range(2):
        entry_addr = PLT_VADDR + i * 16
        disp = (GOT_VADDR + i * 8) - (entry_addr + 6)
        entry = bytearray()
        entry += bytes([0xFF, 0x25]) + struct.pack("<i", disp)  # jmp [rip+disp]
        entry += bytes([0x68]) + struct.pack("<I", i)           # push <reloc index>
        entry += bytes([0xE9, 0x00, 0x00, 0x00, 0x00])          # jmp plt0
        entry += b"\x00" * (16 - len(entry))
        out += entry
    return bytes(out)


def build_dynstr() -> bytes:
    # 偏移: 0 -> "", 1 -> "strcpy", 8 -> "system"
    return b"\x00strcpy\x00system\x00"


def build_dynsym(dynstr_off: dict[str, int]) -> bytes:
    def sym(name_off: int, info: int) -> bytes:
        return struct.pack("<IBBHQQ", name_off, info, 0, 0, 0, 0)

    out = sym(0, 0)                                              # 空符号, 必须第一个
    out += sym(dynstr_off["strcpy"], (STB_GLOBAL << 4) | STT_FUNC)
    out += sym(dynstr_off["system"], (STB_GLOBAL << 4) | STT_FUNC)
    return out


def build_rela() -> bytes:
    out = b""
    for i in range(2):
        r_offset = GOT_VADDR + i * 8
        r_info = ((i + 1) << 32) | R_X86_64_JUMP_SLOT
        out += struct.pack("<QQq", r_offset, r_info, 0)
    return out


def build_elf(out_path: Path) -> None:
    dynstr = build_dynstr()
    dynstr_off = {"strcpy": dynstr.index(b"strcpy"), "system": dynstr.index(b"system")}

    sec = {
        "text": build_text(),
        "plt": build_plt(),
        "dynsym": build_dynsym(dynstr_off),
        "dynstr": dynstr,
        "rela": build_rela(),
    }
    shstr = b"\x00.text\x00.plt\x00.dynsym\x00.dynstr\x00.rela.plt\x00.shstrtab\x00"
    name_off = {
        ".text": shstr.index(b".text"),
        ".plt": shstr.index(b".plt"),
        ".dynsym": shstr.index(b".dynsym"),
        ".dynstr": shstr.index(b".dynstr"),
        ".rela.plt": shstr.index(b".rela.plt"),
        ".shstrtab": shstr.index(b".shstrtab"),
    }

    # ── 计算文件偏移 ──
    off = _align(64)
    offsets: dict[str, int] = {}
    for key in ("text", "plt", "dynsym", "dynstr", "rela"):
        offsets[key] = off
        off = _align(off + len(sec[key]))
    offsets["shstr"] = off
    off = _align(off + len(shstr))
    shoff = _align(off)

    # ── ELF header ──
    e_ident = b"\x7fELF" + bytes([2, 1, 1, 0]) + b"\x00" * 8
    ehdr = e_ident
    ehdr += struct.pack("<HHI", 2, 0x3E, 1)          # ET_EXEC, x86-64, version
    ehdr += struct.pack("<Q", TEXT_VADDR)            # e_entry
    ehdr += struct.pack("<Q", 0)                     # e_phoff
    ehdr += struct.pack("<Q", shoff)                 # e_shoff
    ehdr += struct.pack("<I", 0)                     # e_flags
    ehdr += struct.pack("<HHHHHH", 64, 0, 0, 64, 7, 6)  # ehsize, phentsize, phnum, shentsize, shnum, shstrndx

    def shdr(name: int, typ: int, flags: int, addr: int, offset: int,
             size: int, link: int = 0, info: int = 0, align: int = 1,
             entsize: int = 0) -> bytes:
        return struct.pack("<IIQQQQIIQQ", name, typ, flags, addr, offset,
                           size, link, info, align, entsize)

    headers = shdr(0, SHT_NULL, 0, 0, 0, 0)
    headers += shdr(name_off[".text"], SHT_PROGBITS, SHF_ALLOC | SHF_EXECINSTR, TEXT_VADDR,
                    offsets["text"], len(sec["text"]), align=16)
    headers += shdr(name_off[".plt"], SHT_PROGBITS, SHF_ALLOC | SHF_EXECINSTR, PLT_VADDR,
                    offsets["plt"], len(sec["plt"]), align=16, entsize=16)
    headers += shdr(name_off[".dynsym"], SHT_DYNSYM, SHF_ALLOC, DYNSYM_VADDR,
                    offsets["dynsym"], len(sec["dynsym"]), link=4, info=1,
                    align=8, entsize=24)
    headers += shdr(name_off[".dynstr"], SHT_STRTAB, SHF_ALLOC, DYNSTR_VADDR,
                    offsets["dynstr"], len(sec["dynstr"]), align=1)
    headers += shdr(name_off[".rela.plt"], SHT_RELA, SHF_ALLOC, RELA_VADDR,
                    offsets["rela"], len(sec["rela"]), link=3, info=2,
                    align=8, entsize=24)
    headers += shdr(name_off[".shstrtab"], SHT_STRTAB, 0, 0,
                    offsets["shstr"], len(shstr), align=1)

    # ── 拼文件 ──
    buf = bytearray()
    buf += ehdr
    for key in ("text", "plt", "dynsym", "dynstr", "rela"):
        buf += b"\x00" * (offsets[key] - len(buf))
        buf += sec[key]
    buf += b"\x00" * (offsets["shstr"] - len(buf))
    buf += shstr
    buf += b"\x00" * (shoff - len(buf))
    buf += headers

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(buf)
    print(f"[+] 生成测试 ELF: {out_path}  ({len(buf)} bytes)")
    print(f"    入口 0x{TEXT_VADDR:x}  .text {len(sec['text'])} 字节, "
          f"2 个 call → strcpy@plt / system@plt")


def main() -> int:
    out = Path(__file__).parent / "samples" / "test-minimal.elf"
    args = sys.argv[1:]
    if args and args[0] in ("-o", "--out"):
        if len(args) < 2:
            print("用法: python make_test_elf.py [-o 输出路径]")
            return 2
        out = Path(args[1])
    build_elf(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
