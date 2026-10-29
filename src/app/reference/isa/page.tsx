import React from 'react';
import { RefHeader, RefSection, RefTable, RefCode, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '指令集速查 · 知识库 · BinInsight',
  description: 'x86-64 寄存器、常用指令、调用约定与栈帧布局，附 ARM64 对照。',
};

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-mono text-[12px] tracking-wider text-[var(--text-soft)] pt-2">{children}</h3>
);

export default function IsaPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="ISA Cheatsheet"
        title="指令集速查"
        desc="汇编是逆向的母语。本页把 x86-64 最常用的寄存器、指令、调用约定与栈帧布局浓缩成速查表，并给出 ARM64 对照 —— 看懂八成的反汇编，只需要这些。"
      />

      {/* 1. 通用寄存器 */}
      <RefSection num="01" title="通用寄存器">
        <P>
          x86-64 有 16 个通用寄存器，同一寄存器的不同位宽有不同名字。
          注意：写 <C>eax</C> 会自动清零 <C>rax</C> 的高 32 位 —— 这既是常见的编译器优化，也是常见的误读来源。
        </P>
        <RefTable
          columns={['64 位', '32 位', '16 位', '低 8 位', '用途约定']}
          monoCols={[0, 1, 2, 3]}
          rows={[
            ['rax', 'eax', 'ax', 'al', '函数返回值、累加器；乘除法默认操作数'],
            ['rbx', 'ebx', 'bx', 'bl', '被调用者保存的通用寄存器'],
            ['rcx', 'ecx', 'cx', 'cl', '第 4 个整数参数；循环计数器'],
            ['rdx', 'edx', 'dx', 'dl', '第 3 个整数参数；乘除法的高位结果'],
            ['rsi', 'esi', 'si', 'sil', '第 2 个整数参数；字符串操作源指针'],
            ['rdi', 'edi', 'di', 'dil', '第 1 个整数参数；字符串操作目的指针'],
            ['rbp', 'ebp', 'bp', 'bpl', '栈帧基址指针（帧指针）'],
            ['rsp', 'esp', 'sp', 'spl', '栈顶指针，push / pop 自动增减'],
            ['r8 – r15', 'r8d – r15d', 'r8w – r15w', 'r8b – r15b', 'r8 / r9 是第 5、6 个参数，其余通用'],
            ['rip', 'eip', 'ip', '—', '指令指针，不能用 mov 直接改写'],
          ]}
        />
      </RefSection>

      {/* 2. 常用指令分组 */}
      <RefSection num="02" title="常用指令分组">
        <P>
          按用途分组记忆：读反汇编时先判断指令属于哪一组，再细看操作数。
        </P>
        <H3>数据传送</H3>
        <RefTable
          columns={['指令', '含义', '备注']}
          rows={[
            ['mov dst, src', '复制数据', '不允许内存 → 内存，需经寄存器中转'],
            ['lea dst, [expr]', '计算地址', '只做地址运算不访存，常被编译器拿来做加法'],
            ['push src', '压栈', 'rsp 先减 8 再写入 —— 栈向低地址生长'],
            ['pop dst', '弹栈', '读出后 rsp 加 8'],
            ['xchg a, b', '交换两个操作数', '操作数含内存时隐含 lock 前缀'],
          ]}
        />
        <H3>算术运算</H3>
        <RefTable
          columns={['指令', '含义', '备注']}
          rows={[
            ['add / sub', '加 / 减', '影响 ZF、SF、CF、OF 标志位'],
            ['inc / dec', '自增 1 / 自减 1', '不影响 CF'],
            ['imul', '有符号乘法', '单操作数形式的结果放在 rdx:rax'],
            ['idiv', '有符号除法', '商入 rax、余数入 rdx；除数为 0 触发异常'],
          ]}
        />
        <H3>逻辑与比较</H3>
        <RefTable
          columns={['指令', '含义', '备注']}
          rows={[
            ['and / or / xor', '按位与 / 或 / 异或', 'xor rax, rax 是清零惯用法'],
            ['not', '按位取反', '不影响标志位'],
            ['shl / shr', '左移 / 逻辑右移', '左移 n 位等价于乘以 2 的 n 次方'],
            ['test', '按位与，只置标志', 'test rax, rax 是判断是否为 0 的惯用法'],
            ['cmp', '做减法，只置标志', '条件跳转的固定搭档'],
          ]}
        />
        <H3>控制流</H3>
        <RefTable
          columns={['指令', '含义', '备注']}
          rows={[
            ['jmp', '无条件跳转', '直接改写 rip'],
            ['je / jne', '相等 / 不等时跳转', '依据 ZF 标志'],
            ['jg / jge', '有符号大于 / 大于等于', '依据 SF、OF、ZF 组合'],
            ['jl / jle', '有符号小于 / 小于等于', '依据 SF、OF、ZF 组合'],
            ['call', '函数调用', '先把返回地址压栈再跳转'],
            ['ret', '函数返回', '弹栈顶进 rip —— 栈溢出劫持的目标'],
          ]}
        />
        <H3>栈帧与杂项</H3>
        <RefTable
          columns={['指令', '含义', '备注']}
          rows={[
            ['enter', '建立栈帧', '等价 push rbp; mov rbp, rsp; sub rsp, N，编译器多用手写序列'],
            ['leave', '拆除栈帧', '等价 mov rsp, rbp; pop rbp，是 ret 前的标准动作'],
            ['nop', '空操作', '用于代码对齐，也是 nop 滑板的材料'],
          ]}
        />
      </RefSection>

      {/* 3. 调用约定 */}
      <RefSection num="03" title="调用约定：System V 与 Windows x64">
        <P>
          同一颗 CPU，两套约定。Linux / macOS 遵循 System V AMD64，Windows 用自己的 x64 约定 ——
          跨平台分析时先确认目标在用哪一套。
        </P>
        <RefTable
          columns={['维度', 'System V AMD64（Linux / macOS）', 'Windows x64']}
          monoCols={[1, 2]}
          rows={[
            ['整数参数顺序', 'rdi, rsi, rdx, rcx, r8, r9', 'rcx, rdx, r8, r9，其余压栈'],
            ['返回值', 'rax', 'rax'],
            ['被调用者保存', 'rbx, rbp, r12 – r15', 'rbx, rbp, rdi, rsi, r12 – r15'],
            ['栈对齐', 'call 入口 rsp 按 16 字节对齐', '同左'],
            ['影子空间', '无', '调用者须预留 32 字节 shadow space'],
          ]}
        />
      </RefSection>

      {/* 4. 栈帧布局 */}
      <RefSection num="04" title="栈帧布局：从高地址到低地址">
        <P>
          一次函数调用在栈上搭出的结构。记住方向：<B>栈向低地址生长，数据向高地址覆盖</B>。
        </P>
        <RefCode
          title="一次函数调用的栈帧"
          badge="plaintext"
          language="plaintext"
          code={`高地址 ▲
┌──────────────────────────────┐
│ 调用者参数区（第 7 个参数起）   │  栈对齐填充也在这里
├──────────────────────────────┤
│ 返回地址                      │ ← call 压入，溢出劫持的最终目标
├──────────────────────────────┤
│ 保存的 rbp                   │ ← push rbp
├──────────────────────────────┤
│ canary（金丝雀）              │ ← 栈保护值，返回前校验
├──────────────────────────────┤
│ 局部变量缓冲区 buf[N]         │ ← 数据从低地址写入、向上增长
└──────────────────────────────┘
低地址 ▼   rsp 指向栈顶`}
        />
        <P>
          缓冲区溢出时，数据从低地址向高地址依次覆盖：局部变量 → <B>canary</B> → 保存的 rbp → <B>返回地址</B>。
          因为 canary 挡在返回地址之前，开启栈保护时溢出会在函数返回前被校验发现，触发 <C>__stack_chk_fail</C>
          —— 想劫持返回地址，必须先泄露 canary。
        </P>
      </RefSection>

      {/* 5. ARM64 对照 */}
      <RefSection num="05" title="ARM64 对照">
        <P>
          分析移动端与嵌入式固件时面对的主要是 ARM64。概念一一对应，只是换了名字。
        </P>
        <RefTable
          columns={['x86-64', 'ARM64', '说明']}
          monoCols={[0, 1]}
          rows={[
            ['rax', 'x0', '返回值寄存器'],
            ['rdi, rsi, …, r9', 'x0 – x7', '前 8 个整数参数'],
            ['call func', 'bl func', '返回地址存入 x30（LR），不压栈'],
            ['ret', 'ret', '从 x30 返回'],
            ['jmp label', 'b label', '无条件跳转'],
            ['cmp + je / jg', 'cmp + b.eq / b.gt', '条件跳转合并为 b.cond 一族'],
            ['push / pop', 'stp / ldp 配合 sp', 'ARM64 没有 push/pop，用成对存取加移动 sp'],
            ['rip', 'pc', '程序计数器，同样不可直接读写'],
          ]}
        />
        <P>
          思路完全相同：参数寄存器、返回地址、栈帧的概念原样照搬，只是寄存器名与指令名不同 ——
          精通 x86-64 之后，迁移到 ARM64 的成本只有这一张表。
        </P>
      </RefSection>

      <RefPager
        prev={{ slug: 'formats', title: '二进制格式' }}
        next={{ slug: 'syscalls', title: '系统调用表' }}
      />
    </div>
  );
}
