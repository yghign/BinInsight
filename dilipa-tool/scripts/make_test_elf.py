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
    """写一个最小 ELF64 文件, 包含 .text 段 + .plt stub + shstrtab.

    目标: Dilipa CLI 能正确解析 .text 段, 并且里面的 call 指令
          能被识别为 call PLT 符号 (通过 .plt 段 + 简单的 stub).
    """

    # 文件布局:
    #   0x000: ELF header      (64 bytes)
    #   0x040: .text 段内容    (28 bytes)
    #   0x05C: .plt 段 stub    (64 bytes — 预留给 3 个 PLT 条目)
    #   0x09C: Section headers (3 × 64 = 192 bytes)
    #   0x15C: .shstrtab       (17 bytes)

    ehdr_size = 64
    plt_size = 64  # 3 个 PLT 条目 stub

    text_offset = ehdr_size                     # 0x40
    plt_offset  = ehdr_size + len(text)         # 0x5C
    shoff       = ehdr_size + len(text) + plt_size  # 0x9C
    shstrtab_offset = shoff + 3 * 64            # 0x09C + 192 = 0x15C

    # ---- .text 段 ----
    # 里面放 3 个 call PLT (call 地址直接指向 .plt 里的 stub).
    # 为了让 Dilipa disassembler 识别, 我们用 call + 绝对地址
    # (但 Capstone 反汇编出来会是 call 某个立即数, 不带 @plt).
    # 更聪明的办法: 在 .plt 前面放一个 jmp, 然后 call 指令指向 .plt 起始.
    # 但 disassembler 的 _parse_call_target 只认 "xxx@plt" 这种字符串.
    # 所以这里我们不手搓 call PLT, 而是让 .text 段包含真实的 call 指令,
    # Dilipa 先看能否解析, 不解析 call target 时至少能看 .text.

    # ---- .plt 段 (stub, 不是真正的 PLT) ----
    plt_stub = bytes([
        # PLT[0]: strcpy@plt  — jmp *[got+0] 占位
        0xff, 0x25, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        # PLT[1]: scanf@plt
        0xff, 0x25, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        # PLT[2]: printf@plt
        0xff, 0x25, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]) + b'\x00' * (plt_size - 48)  # 补到 64 字节

    # ---- .shstrtab ----
    # \x00 = ""  ,  1 = ".text\x00" (6 bytes → end at 7)  ,  7 = ".plt\x00" (5 bytes → end at 12)
    # 12 = ".shstrtab\x00" (10 bytes → end at 22)
    shstrtab = b'\x00.text\x00.plt\x00.shstrtab\x00'
    assert len(shstrtab) == 22, f"shstrtab size {len(shstrtab)}"

    # ---- ELF header ----
    e_ident = b'\x7fELF\x02\x01\x01\x00' + b'\x00' * 8
    ehdr = e_ident
    ehdr += struct.pack('<HH', 1, 0x3E)        # ET_REL, EM_X86_64
    ehdr += struct.pack('<I', 1)
    ehdr += struct.pack('<Q', 0)               # entry
    ehdr += struct.pack('<Q', 0)               # phoff=0
    ehdr += struct.pack('<Q', shoff)           # shoff  ← section headers 起始
    ehdr += struct.pack('<I', 0)                # flags
    ehdr += struct.pack('<HH', 64, 0)           # ehsize=64, phentsize=0
    ehdr += struct.pack('<HH', 0, 64)            # phnum=0, shentsize=64
    ehdr += struct.pack('<HH', 3, 2)              # shnum=3, shstrndx=2

    # ---- Section headers (3 个, 每个 64 bytes) ----
    # sh_name 都是 .shstrtab 内的偏移
    sh_text = struct.pack('<IIQQQQIIQQ',
        1,              # sh_name  → ".text"
        1,              # sh_type  → SHT_PROGBITS
        6,              # sh_flags → SHF_ALLOC | SHF_EXECINSTR
        0x1000,         # sh_addr  (虚拟地址, 对 ET_REL 不重要)
        text_offset,    # sh_offset = 0x40
        len(text),      # sh_size
        0, 0, 16, 0)

    sh_plt = struct.pack('<IIQQQQIIQQ',
        7,              # sh_name  → ".plt"
        1,              # sh_type  → SHT_PROGBITS
        2,              # sh_flags → SHF_ALLOC
        0x2000,
        plt_offset,     # sh_offset = 0x5C
        plt_size,       # sh_size   = 64
        0, 0, 16, 0)

    sh_shstr = struct.pack('<IIQQQQIIQQ',
        12,             # sh_name  → ".shstrtab"
        3,              # sh_type  → SHT_STRTAB
        0,              # sh_flags
        0,
        shstrtab_offset,  # sh_offset 必须正确指向文件中 shstrtab 内容
        len(shstrtab),
        0, 0, 1, 0)

    # ---- 写文件 ----
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open('wb') as f:
        f.write(ehdr)              # 0x000: 64 bytes
        f.write(text)              # 0x040: .text 内容 (28 bytes)
        f.write(plt_stub)          # 0x05C: .plt  stub (64 bytes)
        f.write(sh_text)           # 0x09C: section header .text
        f.write(sh_plt)            # 0x0DC: section header .plt
        f.write(sh_shstr)          # 0x11C: section header .shstrtab
        f.write(shstrtab)          # 0x15C: .shstrtab 内容

    print(f"[✓] 生成测试 ELF: {out_path}  ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    make_elf64_with_calls(str(Path(__file__).parent / "samples" / "test-minimal.elf"))
