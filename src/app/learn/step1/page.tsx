'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Unlock, FileCode, ArrowRight, Info, AlertTriangle, ChevronRight, BookOpen, Sparkles, Package, Hash } from 'lucide-react';
import clsx from 'clsx';
import ModeToggle, { type Mode } from '@/components/ModeToggle';
import CodeBlock from '@/components/CodeBlock';

interface SectionInfo {
  name: string;
  description: string;
  content: string;
  vulnerability: string;
  color: string;
}

interface HeaderField {
  name: string;
  value: string;
  description: string;
}

const elfSections: SectionInfo[] = [
  {
    name: '.text',
    description: '代码段，存放程序的可执行指令',
    content: 'CPU 实际执行的机器码，由编译器将源代码翻译而来。只读，不可修改。',
    vulnerability: '攻击者无法修改 .text 段，但可以通过控制流劫持（如栈溢出）跳转到其中的 gadget（ROP 攻击），或利用代码段中的危险函数。',
    color: 'text-brand-400',
  },
  {
    name: '.data',
    description: '数据段，存放已初始化的全局变量和静态变量',
    content: '程序中定义了初始值的全局变量（如 int g_val = 42;）存储在这里。可读可写。',
    vulnerability: '.data 段可写，如果其中存在函数指针或关键数据，攻击者可能通过越界写篡改它们，导致控制流劫持。',
    color: 'text-accent-green',
  },
  {
    name: '.bss',
    description: '未初始化数据段，存放未初始化的全局变量',
    content: '程序中未显式初始化的全局变量（如 int g_buf[256];）占用的空间。程序加载时由操作系统清零。',
    vulnerability: '未初始化变量可能残留敏感信息。同时，.bss 段也是缓冲区溢出的常见目标，因为大型数组常放在这里。',
    color: 'text-accent-orange',
  },
  {
    name: '.rodata',
    description: '只读数据段，存放常量字符串等只读数据',
    content: '程序中的字符串常量（如 "hello world"）和 const 全局变量存储在这里。只读，不可修改。',
    vulnerability: '.rodata 本身不可写，但其中的格式字符串如果来自用户输入，可能被用于格式字符串漏洞攻击。',
    color: 'text-accent-cyan',
  },
  {
    name: '.got',
    description: '全局偏移表，用于动态链接的地址解析',
    content: 'Global Offset Table，存储动态链接库函数的实际内存地址。程序启动时由动态链接器填充。',
    vulnerability: 'GOT 表是漏洞利用的关键目标！如果攻击者能覆盖 .got 中的函数地址（如通过任意写漏洞），就能将函数调用重定向到恶意代码。GOT 保护机制（RELRO）就是为了防止这一点。',
    color: 'text-accent-red',
  },
  {
    name: '.plt',
    description: '过程链接表，动态函数调用的跳板',
    content: 'Procedure Linkage Table，当程序调用外部库函数时，先跳转到 PLT 中的对应条目，再由 PLT 跳转到 GOT 中存储的实际地址。',
    vulnerability: 'PLT 本身不可写，但攻击者常利用 PLT 中的 system 等函数调用来构造 ROP 链，实现代码执行。',
    color: 'text-accent-purple',
  },
  {
    name: '.symtab',
    description: '符号表，存储函数和变量的符号信息',
    content: 'Symbol Table，包含函数名、变量名及其地址等信息，用于调试和链接。strip 命令可以移除符号表。',
    vulnerability: '有符号表的二进制更容易被逆向分析。攻击者（或分析者）可以直接看到函数名，快速定位目标函数。符号表剥离可以增加逆向难度。',
    color: 'text-brand-300',
  },
  {
    name: '.strtab',
    description: '字符串表，存储符号名称的字符串',
    content: 'String Table，.symtab 中引用的字符串实际存储在这里，以节省空间。',
    vulnerability: '字符串表中可能包含敏感信息（如密码、密钥、调试信息），攻击者可以通过 strings 命令快速提取。',
    color: 'text-gray-400',
  },
];

const elfHeaderFields: HeaderField[] = [
  {
    name: 'e_ident[16]',
    value: '0x7f ELF',
    description: 'ELF 魔数 + 体系结构标识（32/64位、字节序、版本）。前4字节必须是 \\x7fELF。',
  },
  {
    name: 'e_type',
    value: 'ET_EXEC / ET_DYN',
    description: '文件类型：ET_EXEC（可执行文件）、ET_DYN（共享库/PIE可执行文件）、ET_REL（目标文件）。',
  },
  {
    name: 'e_machine',
    value: 'EM_X86_64 (62)',
    description: '目标架构：x86_64=62, ARM=40, AArch64=183, MIPS=8/10 等。',
  },
  {
    name: 'e_entry',
    value: '0x401000',
    description: '程序入口点虚拟地址，即 _start 函数的地址。程序从这里开始执行。',
  },
  {
    name: 'e_phoff',
    value: '0x40',
    description: 'Program Header Table 在文件中的偏移量。描述程序加载时的段（segment）信息。',
  },
  {
    name: 'e_shoff',
    value: '0x...',
    description: 'Section Header Table 在文件中的偏移量。描述各个 section 的位置和属性。',
  },
  {
    name: 'e_phnum',
    value: '9',
    description: 'Program Header 的数量。',
  },
  {
    name: 'e_shnum',
    value: '28',
    description: 'Section Header 的数量。',
  },
  {
    name: 'e_shstrndx',
    value: '27',
    description: 'Section Name String Table 在 section header table 中的索引。',
  },
];

const elfHeaderHex = `ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              DYN (Position-Independent Executable)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x1040
  Start of program headers:          64 (bytes into file)
  Start of section headers:          14776 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         13
  Size of section headers:           64 (bytes)
  Number of section headers:         29
  Section header string table index: 28`;

const binwalkOutput = `$ binwalk firmware.bin

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             uImage header, header size: 64 bytes,
                             header CRC: 0x12345678, created: ...,
                             image size: 1234567 bytes,
                             image name: "MIPS Linux-4.4.0"
64            0x40            LZMA compressed data, properties: ...
                             dictionary size: 8388608 bytes, uncompressed size: ...
1245184       0x130000        Squashfs filesystem, little endian,
                             version 4.0, compression:xz, size: 2345678 bytes,
                             ... inodes, blocksize: 262144 bytes, created: ...`;

export default function Step1Page() {
  const [mode, setMode] = useState<Mode>('beginner');
  const [selectedSection, setSelectedSection] = useState<string>('.text');
  const [selectedField, setSelectedField] = useState<string>('e_entry');

  const currentSection = elfSections.find((s) => s.name === selectedSection) || elfSections[0];
  const currentField = elfHeaderFields.find((f) => f.name === selectedField) || elfHeaderFields[3];

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Unlock size={24} className="text-brand-400" />
            </div>
            <div>
              <div className="text-xs font-mono text-brand-400 uppercase tracking-wider">Step 1</div>
              <h2 className="text-2xl font-bold">解包与识别</h2>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="text-gray-400 leading-relaxed">
          拿到一个二进制文件，第一步永远是识别它的格式、架构和组成结构。
          就像拿到一个未知包裹，你需要先看看它是什么、从哪里来、里面装了什么。
        </p>
      </section>

      {/* Section 1: What is ELF */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCode size={20} className="text-brand-400" />
          <h3 className="text-xl font-bold">ELF 文件结构</h3>
        </div>
        <p className="text-gray-400 leading-relaxed pl-7">
          ELF（Executable and Linkable Format）是 Linux/Unix 系统下标准的可执行文件格式。
          它就像一本书，有封面（Header）、目录（Section Headers）和各个章节（Sections）。
          {mode === 'advanced' && (
            <> 进阶模式下，你将深入了解 ELF Header 的每个字段以及固件识别相关工具。</>
          )}
        </p>

        {/* Interactive ELF Section Explorer */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mt-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-soft">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-brand-400" />
              <span className="text-sm font-medium">交互示例 · 点击左侧 section 查看详情</span>
            </div>
            <span className="text-xs text-gray-500">ELF Sections</span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left: Section List */}
            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-border bg-bg-soft/50">
              <div className="p-4 space-y-1">
                {elfSections.map((section) => (
                  <button
                    key={section.name}
                    onClick={() => setSelectedSection(section.name)}
                    className={clsx(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 group',
                      selectedSection === section.name
                        ? 'bg-brand-600/20 border border-brand-500/40'
                        : 'hover:bg-bg-hover border border-transparent'
                    )}
                  >
                    <ChevronRight
                      size={14}
                      className={clsx(
                        'transition-transform flex-shrink-0',
                        selectedSection === section.name ? 'text-brand-400 rotate-90' : 'text-gray-600 group-hover:text-gray-400'
                      )}
                    />
                    <span className={clsx('font-mono text-sm font-medium', section.color)}>
                      {section.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Section Detail */}
            <div className="md:w-2/3 p-5">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={clsx('text-xl font-mono font-bold', currentSection.color)}>
                    {currentSection.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-bg-hover text-gray-400">
                    Section
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{currentSection.description}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-bg-soft rounded-lg p-4 border border-border">
                  <div className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen size={12} />
                    常见内容
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{currentSection.content}</p>
                </div>

                <div className="bg-accent-red/10 rounded-lg p-4 border border-accent-red/20">
                  <div className="text-xs text-accent-red font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    与漏洞的关系
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{currentSection.vulnerability}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Content: ELF Header */}
      {mode === 'advanced' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Hash size={20} className="text-accent-purple" />
            <h3 className="text-xl font-bold">ELF Header 字段详解</h3>
          </div>
          <p className="text-gray-400 leading-relaxed pl-7">
            ELF 文件最开头是 ELF Header，它描述了文件的基本信息。
            使用 <code className="inline">readelf -h</code> 命令可以查看完整的 ELF Header。
            点击下方字段查看详细解释。
          </p>

          {/* ELF Header Interactive */}
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mt-6">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-soft">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent-purple" />
                <span className="text-sm font-medium">进阶交互 · ELF Header 字段解析</span>
              </div>
              <span className="text-xs text-gray-500">readelf -h</span>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Left: readelf output */}
              <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border">
                <CodeBlock
                  code={elfHeaderHex}
                  language="plaintext"
                  showLineNumbers={false}
                />
              </div>

              {/* Right: Field detail */}
              <div className="lg:w-1/2 p-4 space-y-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">关键字段</div>
                {elfHeaderFields.map((field) => (
                  <button
                    key={field.name}
                    onClick={() => setSelectedField(field.name)}
                    className={clsx(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all border',
                      selectedField === field.name
                        ? 'bg-accent-purple/20 border-accent-purple/40'
                        : 'bg-bg-soft/50 border-border hover:bg-bg-hover'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-accent-purple">{field.name}</span>
                      <span className="text-xs text-gray-500 font-mono truncate ml-2">
                        {field.value}
                      </span>
                    </div>
                    {selectedField === field.name && (
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        {field.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Advanced Content: Firmware & binwalk */}
      {mode === 'advanced' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-accent-orange" />
            <h3 className="text-xl font-bold">固件格式识别与 binwalk</h3>
          </div>
          <p className="text-gray-400 leading-relaxed pl-7">
            在 IoT 安全分析中，你拿到的往往不是 ELF 文件，而是完整的固件镜像。
            <code className="inline">binwalk</code> 是固件分析的瑞士军刀，它能通过文件签名识别出
            固件中嵌入的文件系统、压缩数据、引导程序等。
          </p>

          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-border bg-bg-soft">
              <span className="text-sm font-medium">binwalk 输出示例</span>
            </div>
            <CodeBlock
              code={binwalkOutput}
              language="bash"
              showLineNumbers={false}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="text-sm font-bold mb-2 text-accent-orange">常用 binwalk 命令</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                  <span><code className="inline">binwalk file.bin</code> - 扫描文件中的已知签名</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                  <span><code className="inline">binwalk -e file.bin</code> - 自动提取识别到的文件</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                  <span><code className="inline">binwalk -M -e file.bin</code> - 递归提取（深入嵌套）</span>
                </li>
              </ul>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="text-sm font-bold mb-2 text-accent-purple">SBOM / FBOM 概念</div>
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-gray-300">SBOM</strong>（Software Bill of Materials，软件物料清单）
                是软件中包含的所有组件的清单，帮助追踪依赖和漏洞。
              </p>
              <p className="text-sm text-gray-400 leading-relaxed mt-2">
                <strong className="text-gray-300">FBOM</strong>（Firmware Bill of Materials，固件物料清单）
                则是 SBOM 在固件领域的扩展，涵盖固件中的 bootloader、内核、文件系统、第三方库等所有组件。
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Next Step Button */}
      <section className="pt-6 border-t border-border">
        <div className="flex justify-end">
          <Link
            href="/learn/step2"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-600/25"
          >
            下一步 · 静态分析
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
