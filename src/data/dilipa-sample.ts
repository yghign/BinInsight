/**
 * Dilipa 工作台的预置演示数据（从 DilipaWorkbench.tsx:41-209 迁出）。
 *
 * ⚠️ 全部是「演示样例」：C 代码 / 汇编 / 变更清单 / 修复建议都是课前备好的教学素材，
 * 不是任何真实 ELF 的分析结果，也不是 dilipa analyze 跑出来的报告。
 * 每一项都显式带 sourceState: 'demo'，页面必须挂 <SourceBadge state="demo" />。
 *
 * 旧版工作台里那组伪装成终端回放的预置文本已整体移除：本文件只保留「改了什么」的
 * 文本建议，不写回二进制，也不宣称做过字节比对、重反汇编核对或回归测试。
 */

import type { SourceState } from './source-state';

export interface DilipaSampleFix {
  label: string;
  desc: string;
}

export interface DilipaSampleFunc {
  id: string;
  name: string;
  file: string;
  addr: string;
  vulnType: string;
  summary: string;
  originalC: string;
  patchedC: string;
  originalAsm: string;
  patchedAsm: string;
  /** 危险行在 originalC.split('\n') 中的索引 */
  dangerLineIdx: number[];
  fixes: DilipaSampleFix[];
  /** 变更清单（只输出文本建议，不写回二进制） */
  changes: { label: string; from: string; to: string; note: string }[];
  sourceState: SourceState;
}

export const DILIPA_SAMPLE_FUNCS: DilipaSampleFunc[] = [
  {
    id: 'process-input',
    name: 'process_input',
    file: 'target.elf',
    addr: '0x401160',
    vulnType: 'CWE-120 · 复制时不检查大小',
    summary:
      'strcpy() 把用户输入无长度限制地拷进一个固定大小的盒子，多出来的数据会盖住旁边放好的东西。',
    originalC: `void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);    // 不检查长度
    printf("Input: %s\\n", buffer);
}`,
    patchedC: `void process_input(char *input) {
    char buffer[64];
    strncpy(buffer, input, 63);  // 加了长度上限
    buffer[63] = '\\0';           // 手动补结束标记
    printf("Input: %s\\n", buffer);
}`,
    originalAsm: `process_input:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x40
    mov     [rbp-0x38], rdi
    lea     rax, [rbp-0x30]    ; buffer
    mov     rsi, [rbp-0x38]    ; input
    mov     rdi, rax
    call    strcpy@plt
    lea     rax, [rbp-0x30]
    mov     rsi, rax
    lea     rdi, [rel fmt]
    mov     eax, 0
    call    printf@plt
    leave
    ret`,
    patchedAsm: `process_input:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x40
    mov     [rbp-0x38], rdi
    lea     rax, [rbp-0x30]    ; buffer
    mov     rdx, 63             ; 长度参数
    mov     rsi, [rbp-0x38]    ; input
    mov     rdi, rax
    call    strncpy@plt
    mov     byte [rbp-0x01], 0 ; buffer[63] = 0
    lea     rax, [rbp-0x30]
    mov     rsi, rax
    lea     rdi, [rel fmt]
    mov     eax, 0
    call    printf@plt
    leave
    ret`,
    dangerLineIdx: [2],
    fixes: [
      { label: '替换 strcpy → strncpy', desc: '加一个长度上限，最多只拷这么多' },
      { label: '手动补结束标记', desc: '收尾的注意事项，不算新概念' },
    ],
    changes: [
      {
        label: '① 换函数',
        from: 'strcpy(buffer, input)',
        to: 'strncpy(buffer, input, 63)',
        note: '在 C 代码这一层，多了一个长度参数',
      },
      {
        label: '② 补结束标记',
        from: '（无）',
        to: "buffer[63] = '\\0'",
        note: '收尾动作，确保字符串正确结束',
      },
      {
        label: '③ 输出变更清单',
        from: '（无）',
        to: 'changes[]（JSON 文本）',
        note: '本阶段只输出文本建议，不写回二进制',
      },
    ],
    sourceState: 'demo',
  },
  {
    id: 'parse-cmd',
    name: 'parse_cmd',
    file: 'target.elf',
    addr: '0x401280',
    vulnType: 'CWE-242 · 使用了本身就不安全的函数',
    summary: 'gets() 完全不检查输入长度，属于教科书级的危险调用。',
    originalC: `int parse_cmd() {
    char cmd[128];
    gets(cmd);                  // 不检查长度
    if (strncmp(cmd, "SYSTEM", 6) == 0) {
        return 1;
    }
    return 0;
}`,
    patchedC: `int parse_cmd() {
    char cmd[128];
    if (fgets(cmd, sizeof(cmd), stdin) == NULL) return -1;
    cmd[strcspn(cmd, "\\n")] = 0;
    if (strncmp(cmd, "SYSTEM", 6) == 0) {
        return 1;
    }
    return 0;
}`,
    originalAsm: `parse_cmd:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x80
    lea     rdi, [rbp-0x80]    ; cmd
    call    gets@plt
    lea     rdi, [rbp-0x80]
    mov     esi, 6
    lea     rdx, [rel s_SYSTEM]
    call    strncmp@plt
    test    eax, eax
    setz    al
    movzx   eax, al
    leave
    ret`,
    patchedAsm: `parse_cmd:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 0x80
    lea     rax, [rbp-0x80]    ; cmd
    mov     edx, 128            ; sizeof(cmd)
    mov     esi, stdin
    mov     rdi, rax
    call    fgets@plt
    test    rax, rax
    jz      .Lret_neg
    lea     rdi, [rbp-0x80]
    mov     esi, 6
    lea     rdx, [rel s_SYSTEM]
    call    strncmp@plt
    test    eax, eax
    setz    al
    movzx   eax, al
    leave
    ret`,
    dangerLineIdx: [1],
    fixes: [
      { label: '替换 gets → fgets', desc: '指定最大读取长度' },
      { label: '处理空返回', desc: '读不到输入时直接返回' },
    ],
    changes: [
      {
        label: '① 换函数',
        from: 'gets(cmd)',
        to: 'fgets(cmd, sizeof(cmd), stdin)',
        note: '从「不限长」改成「带上限」',
      },
      {
        label: '② 加空返回处理',
        from: '（无）',
        to: 'if (fgets(...) == NULL) return -1',
        note: '读不到输入时的收尾处理',
      },
      {
        label: '③ 输出变更清单',
        from: '（无）',
        to: 'changes[]（JSON 文本）',
        note: '本阶段只输出文本建议，不写回二进制',
      },
    ],
    sourceState: 'demo',
  },
];

/** 工作台底部统一的口径说明。 */
export const DILIPA_SAMPLE_NOTE =
  '工作台使用预置演示样例（课前备好的教学素材，非真实分析结果）。想看真实数据，请在上方导入自己跑出的 dilipa analyze JSON 报告。';

/** 后续工作清单：统一标「规划中」，不以已完成呈现。 */
export const DILIPA_FUTURE_WORK: string[] = [
  '二进制重写（等长覆盖 / 跳转衔接 / 空间分析）',
  '补丁等价性校验（字节对比 / 重反汇编 / 回归测试）',
  '真实语法树对比与伪 C 提升',
  '非 x86 架构支持',
];
