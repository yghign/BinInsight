"""ELF 解析 + Section / Symbol 提取, 依赖 pyelftools."""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from elftools.elf.elffile import ELFFile


@dataclass
class ElfInfo:
    path: str
    arch: str           # x86-64, i386, ARM64 ...
    bits: int           # 32 / 64
    endian: str         # little / big
    e_type: str         # ET_EXEC / ET_DYN
    entry: int          # 入口点地址
    sections: list[str] = field(default_factory=list)
    symbols: dict[str, int] = field(default_factory=dict)   # name -> address
    plt_entries: dict[str, int] = field(default_factory=dict) # name -> PLT offset
    got_addresses: dict[str, int] = field(default_factory=dict)
    text_offset: Optional[int] = None
    text_size: Optional[int] = None
    text_vaddr: Optional[int] = None


def parse_elf(path: str | Path) -> ElfInfo:
    path = Path(path)
    with path.open("rb") as f:
        elf = ELFFile(f)

        ehdr = elf.header
        bits = 64 if elf.elfclass == 64 else 32
        endian = "little" if elf.little_endian else "big"

        # 架构名归一化
        machine = ehdr.e_machine
        arch_map = {
            "EM_X86_64": "x86-64",
            "EM_386": "i386",
            "EM_AARCH64": "ARM64",
            "EM_ARM": "ARM",
            "EM_MIPS": "MIPS",
            "EM_PPC": "PPC",
        }
        arch = arch_map.get(str(machine), str(machine))

        # 可执行类型
        type_map = {
            "ET_EXEC": "executable",
            "ET_DYN": "shared_object_or_PIE",
            "ET_REL": "relocatable",
            "ET_CORE": "core_dump",
        }
        e_type = type_map.get(str(ehdr.e_type), str(ehdr.e_type))

        info = ElfInfo(
            path=str(path),
            arch=arch,
            bits=bits,
            endian=endian,
            e_type=e_type,
            entry=int(ehdr.e_entry),
        )

        # Sections
        info.sections = [sec.name for sec in elf.iter_sections()]
        for sec in elf.iter_sections():
            if sec.name == ".text":
                info.text_offset = int(sec["sh_offset"])
                info.text_size = int(sec["sh_size"])
                info.text_vaddr = int(sec["sh_addr"])

        # Symbols (.symtab / .dynsym)
        for sec_name in (".symtab", ".dynsym"):
            try:
                sec = elf.get_section_by_name(sec_name)
            except KeyError:
                continue
            if sec is None or sec["sh_type"] != "SHT_SYMTAB":
                continue
            # iter_symbols 是 pyelftools Section 的真实方法, 类型 stub 没声明 → 忽略
            for sym in sec.iter_symbols():  # type: ignore[attr-defined]
                name = sym.name
                if name:
                    info.symbols[name] = int(sym["st_value"])

        # PLT entries (.plt / .plt.got)
        for sec_name in (".plt.got", ".plt", ".plt.sec"):
            try:
                sec = elf.get_section_by_name(sec_name)
            except KeyError:
                continue
            if sec is not None:
                info.plt_entries[sec_name] = int(sec["sh_addr"])

        # GOT entries (.got.plt / .got)
        for sec_name in (".got.plt", ".got"):
            try:
                sec = elf.get_section_by_name(sec_name)
            except KeyError:
                continue
            if sec is not None:
                info.got_addresses[sec_name] = int(sec["sh_addr"])

        return info
