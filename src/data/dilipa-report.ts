/**
 * Dilipa JSON 报告字段契约（网页侧）。
 *
 * 字段严格按仓库 dilipa-tool/dilipa/cli.py 的真实输出定义，未臆造字段：
 *   - cli.py:_header()  → tool/version/path/arch/bits/endian/e_type/entry/sections
 *   - cli.py:analyze()   → cmd="analyze" / calls[] / dangerous[] / instruction_count
 *   - disassembler.py:call_sites_to_dicts()
 *                      → address(hex 字符串)/target_plt/target_func/is_dangerous/safe_alt/cwe
 *   - lift / patch 另含 source/instructions/pseudo_c/changes/output/note，
 *     允许导入但主线不渲染、不解释。
 *
 * SourceState 唯一定义在 src/data/source-state.ts；这里只做 type import。
 */

import type { SourceState } from './source-state';

export type DilipaCmd = 'analyze' | 'lift' | 'patch';

/** 一条 call 记录。address 在容错时允许输入 number，归一后统一为 hex 字符串。 */
export interface DilipaCallSite {
  address: string;
  target_plt: string;
  target_func: string;
  is_dangerous: boolean;
  /** 可能为 null / 缺失；显示时用 '—'，绝不猜测替代函数。 */
  safe_alt: string | null;
  /** 可能为 null / 缺失；显示时用 '—'。 */
  cwe: string | null;
}

export interface DilipaReport {
  tool: string;
  version: string;
  path: string;
  arch: string;
  bits: number;
  endian: string;
  e_type: string;
  entry: string;
  sections: string[];
  cmd: DilipaCmd;
  calls: DilipaCallSite[];
  dangerous: DilipaCallSite[];
  /** 来自 report 对象；缺失时 undefined，视图显示 '—'，禁止硬编码统计数字。 */
  instruction_count?: number;
  // lift / patch 的附加字段：允许存在，主线只列出不解释
  source?: string;
  instructions?: unknown[];
  pseudo_c?: string;
  output?: string;
  changes?: unknown[];
  note?: string;
}

export interface NormalizedReport {
  ok: boolean;
  report: DilipaReport;
  /** 缺字段 / 旧版本 / 空数组等人类可读提示 */
  warnings: string[];
  /** 由调用方（导入 vs 内置样例）决定 */
  state: Extract<SourceState, 'real' | 'demo'>;
  /** ok=false 时的失败原因，供错误卡片展示；不抛异常、不写 localStorage */
  error?: string;
}

/** 空报告骨架：ok=false 时返回，保证下游字段访问安全。 */
export const EMPTY_REPORT: DilipaReport = {
  tool: '—',
  version: '—',
  path: '—',
  arch: '—',
  bits: 0,
  endian: '—',
  e_type: '—',
  entry: '—',
  sections: [],
  cmd: 'analyze',
  calls: [],
  dangerous: [],
};

/** 报告里当前 CLI 的版本（来自 dilipa/__init__.py::__version__）。 */
export const CURRENT_REPORT_VERSION = '0.1.0';

/** 「没有检测到 call」的提示文案，视图与 normalize 共用，口径唯一。 */
export const NO_CALLS_HINT =
  '这份报告没有检测到 call。当前仓库内 dilipa analyze 存在已知的 call 目标解析限制（详见 README-演示复现），请勿把空结果当作分析成功。';
