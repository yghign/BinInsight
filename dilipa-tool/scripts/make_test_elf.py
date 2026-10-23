"""生成一个最小 x86-64 ELF64, .text 段包含 3 条 call 指令供 Dilipa 测试.

这个脚本只为验证 Dilipa CLI 能跑通, 生成的 ELF 不是真正可执行的.
"""
import struct
from pathlib import Path


def make_elf64_with_calls(out_path: str) -> None:
    # ---- .text 段内容 ----
    # 0x00: mov rax, rdi    (48 89 f8)
    # 0x03: mov rdi, 0x12345678  (48 c7 c7 78 56 34 12)  伪函数参数
    # 0x0a: call +10        (e8 0a 00 00 00)
    # 0x0f: mov rax, rdi
    # 0x12: mov rdi, 0xdeadbeef
    # 0x19: call +5          (e8 05 00 00 00)
    # 0x1e: xor eax, eax
    # 0x20: ret              (c3)
    text = bytes([
        0x48, 0x89, 0xf8,
        0x48, 0xc7, 0xc7, 0x78, 0x56, 0x34, 0x12,
        0xe8, 0x0a, 0x00, 0x00, 0x00,
        0x48, 0x89, 0xf8,
        0x48, 0xc7, 0xc7, 0xef, 0xbe, 0xad, 0xde,
        0xe8, 0x05, 0x00, 0x00, 0x00,
        0x31, 0xc0,
        0xc3,
    ])

    # ---- ELF Header ----
    e_ident = b'\x7fELF'       # magic
    e_ident += b'\x02'          # 64-bit
    e_ident += b'\x01'          # little endian
    e_ident += b'\x01'          # version 1
    e_ident += b'\x00'          # SysV ABI
    e_ident += b'\x00' * 8      # padding

    ehdr = e_ident
    ehdr += struct.pack('<HH', 1, 0x3E)        # e_type=ET_REL, e_machine=EM_X86_64
    ehdr += struct.pack('<I', 1)                # e_version
    ehdr += struct.pack('<Q', 0)                # e_entry
    ehdr += struct.pack('<Q', 0)                # e_phoff (no program headers)
    ehdr += struct.pack('<Q', 0x40)             # e_shoff = 64 (right after ehdr)
    ehdr += struct.pack('<I', 0)                # e_flags
    ehdr += struct.pack('<HH', 64, 0)           # e_ehsize, e_phentsize=0
    ehdr += struct.pack('<HH', 0, 0)            # e_phnum=0, e_shentsize=0
    ehdr += struct.pack('<H', 0)                # e_shnum  — we'll patch later
    ehdr += struct.pack('<H', 0)                # e_shstrndx — we'll patch later

    # 简单起见, 只写一个 .text 段 + 空的 section header
    # 这里我们不写 section headers 也能让 pyelftools 解析 .text —
    # pyelftools 会 fallback 到通过 e_shoff 找 section headers, 如果没有就从 LOAD segment 找.
    # 对于我们的测试, 只要 .text 段能被找到就行.

    # 方案: 写一个最小合法 ELF, 不带 section headers, pyelftools 应该仍能解析
    # 但 dilipa 代码要 .text 段, 我们需要确保它存在.

    # 更简单: 让 e_shoff=0 且 e_shnum=0, 但手动加一个 PT_LOAD 程序头把 text 映射
    # 等等 — 这又需要 .text 段的 section header 元数据...

    # 放弃复杂方案, 直接让 e_shoff 指向我们写的 section headers.
    # 先写 ELF header + .text bytes, 再追加 section headers.

    pass

    # 让我换个更简单的办法: 用 pyelftools 自己生成!
    from elftools.elf.elffile import ELFFile as _ELFFile
    from elftools.elf.sections import Section as _Section
    # 实际上 pyelftools 不支持直接创建 ELF, 只能解析

    # 最终简化: 写一个带 section headers 的最小 ELF
    return _make_minimal_elf_with_sections(text, out_path)


def _make_minimal_elf_with_sections(text: bytes, out_path: str) -> None:
    """写一个最小 ELF64 文件, 包含 .text 段和它的 section header."""

    # 先预留 64 字节 ELF header, 然后写 section headers
    text_offset = 0x40 + 0  # text 紧跟在 ELF header 后
    shoff = 0x40 + len(text)

    # ---- .shstrtab 内容 ----
    shstrtab = b'\x00' + b'.text\x00' + b'.shstrtab\x00'
    shstrtab_offset = shoff + 80  # 2 section headers × 64 bytes

    # ---- ELF header ----
    e_ident = b'\x7fELF\x02\x01\x01\x00' + b'\x00' * 8
    ehdr = e_ident
    ehdr += struct.pack('<HH', 1, 0x3E)        # ET_REL, EM_X86_64
    ehdr += struct.pack('<I', 1)
    ehdr += struct.pack('<Q', 0)               # entry
    ehdr += struct.pack('<Q', 0)               # phoff=0
    ehdr += struct.pack('<Q', shoff)           # shoff
    ehdr += struct.pack('<I', 0)                # flags
    ehdr += struct.pack('<HH', 64, 0)           # ehsize, phentsize
    ehdr += struct.pack('<HH', 0, 64)            # phnum=0, shentsize=64
    ehdr += struct.pack('<HH', 2, 1)              # shnum=2, shstrndx=1

    # ---- .text section header ----
    # Elf64_Shdr: 64 bytes
    # sh_name, sh_type, sh_flags, sh_addr, sh_offset, sh_size, sh_link, sh_info, sh_addralign, sh_entsize
    sh_text = struct.pack('<IIQQQQIIQQ',
        1,            # sh_name = offset of ".text" in .shstrtab
        1,            # sh_type = SHT_PROGBITS
        6,            # sh_flags = SHF_WRITE | SHF_ALLOC | SHF_EXECINSTR
        0x1000,       # sh_addr
        0x40,         # sh_offset (text 紧跟 ELF header)
        len(text),    # sh_size
        0, 0, 16, 0)  # link, info, addralign, entsize

    # ---- .shstrtab section header ----
    sh_shstr = struct.pack('<IIQQQQIIQQ',
        7,                         # sh_name = offset of ".shstrtab" in .shstrtab (after ".text\x00")
        3,                         # sh_type = SHT_STRTAB
        0, 0,                      # sh_flags, sh_addr
        shstrtab_offset,           # sh_offset
        len(shstrtab),             # sh_size
        0, 0, 1, 0)

    # ---- 写文件 ----
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open('wb') as f:
        f.write(ehdr)                    # ELF header (64 bytes)
        f.write(text)                    # .text 段内容
        f.write(sh_text)                 # section header .text
        f.write(sh_shstr)                # section header .shstrtab
        f.write(shstrtab)                # .shstrtab 内容

    print(f"[✓] 生成测试 ELF: {out_path}  ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    make_elf64_with_calls(str(Path(__file__).parent / "samples" / "test-minimal.elf"))
