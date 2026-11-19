/**
 * Dilipa 报告归一化：把任意来源的 JSON 收敛成可安全渲染的 DilipaReport。
 *
 * 六类容错（架构 C.2.3，逐条实现、逐条可验收）：
 *   ① 非 JSON / 顶层非对象 / >1MB → ok:false + 错误卡片，不抛异常、不写 localStorage；
 *   ② 缺 tool/version/cmd 不拒绝，只加 warning，显示用 '—'；
 *   ③ calls/dangerous 非数组 → []；dangerous 空但 calls 非空则按 is_dangerous 重算；
 *   ④ address 是 number → String()；
 *   ⑤ safe_alt/cwe 缺失 → null（视图显示 '—'），不猜测；
 *   ⑥ version !== '0.1.0' 只加 warning；cmd='lift'|'patch' 允许导入但提示本视图面向 analyze；
 *      calls 为空必须给出「没有检测到 call」+ 指向已知限制，禁止伪装成分析成功。
 *
 * 任何统计数字都来自 report 对象，本文件绝不硬编码统计。
 */

import {
  CURRENT_REPORT_VERSION,
  EMPTY_REPORT,
  NO_CALLS_HINT,
  type DilipaCallSite,
  type DilipaCmd,
  type DilipaReport,
  type NormalizedReport,
} from '@/data/dilipa-report';

export const MAX_REPORT_BYTES = 1024 * 1024;

type RenderState = NormalizedReport['state'];
type Bag = Record<string, unknown>;

function fail(error: string, state: RenderState, extraWarnings: string[] = []): NormalizedReport {
  return {
    ok: false,
    report: { ...EMPTY_REPORT, calls: [], dangerous: [], sections: [] },
    warnings: [error, ...extraWarnings],
    state,
    error,
  };
}

function asString(value: unknown, fallback = '—'): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function isPlainObject(value: unknown): value is Bag {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 统计字符串的 UTF-8 字节数（Node 18+ 与浏览器均有 TextEncoder）。 */
function byteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  return text.length;
}

/**
 * 把 calls / dangerous 字段归一为 DilipaCallSite[]。
 * 非数组 → [] 并加 warning；逐项容错，不猜测任何缺失字段。
 */
function coerceCalls(value: unknown, field: 'calls' | 'dangerous', warnings: string[]): DilipaCallSite[] {
  if (!Array.isArray(value)) {
    warnings.push(`字段 ${field} 不是数组或缺失，已归一为空数组（不猜测内容）。`);
    return [];
  }
  const sites: DilipaCallSite[] = [];
  let skipped = 0;
  let missingAdvice = 0;

  for (const raw of value as unknown[]) {
    if (!isPlainObject(raw)) {
      skipped += 1;
      continue;
    }
    // ④ address 为 number → String()；不重新解析为地址
    const address = asString(raw.address, '—');
    const targetPlt = asString(raw.target_plt, '—');
    const targetFunc = asString(raw.target_func, '—');
    const isDangerous = typeof raw.is_dangerous === 'boolean' ? raw.is_dangerous : false;

    // ⑤ safe_alt / cwe 缺失 → null，显示 '—'，绝不猜测替代函数
    const safeAlt =
      typeof raw.safe_alt === 'string' && raw.safe_alt.trim() !== '' ? raw.safe_alt : null;
    const cwe = typeof raw.cwe === 'string' && raw.cwe.trim() !== '' ? raw.cwe : null;
    if (safeAlt === null || cwe === null) missingAdvice += 1;

    sites.push({
      address,
      target_plt: targetPlt,
      target_func: targetFunc,
      is_dangerous: isDangerous,
      safe_alt: safeAlt,
      cwe,
    });
  }

  if (skipped > 0) warnings.push(`字段 ${field} 中有 ${skipped} 项不是对象，已跳过。`);
  if (missingAdvice > 0) {
    warnings.push(`字段 ${field} 中有 ${missingAdvice} 条记录缺少 safe_alt / cwe，页面显示「—」，不猜测替代函数。`);
  }
  return sites;
}

/**
 * 主归一化函数。raw 可以是已解析的对象，也可以是 JSON 文本字符串。
 * 永远不抛异常：任何异常都转成 ok:false + 可读原因。
 */
export function normalizeReport(raw: unknown, state: RenderState): NormalizedReport {
  let candidate: unknown = raw;
  const warnings: string[] = [];

  // ① 若传入文本，尝试解析；解析失败返回错误卡片
  if (typeof candidate === 'string') {
    if (byteLength(candidate) > MAX_REPORT_BYTES) {
      return fail('文件超过 1MB，为避免卡住浏览器已拒绝导入。', state);
    }
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return fail('这不是合法的 JSON 文本，无法解析成报告。请检查文件内容或重新下载样例 JSON。', state);
    }
  }

  // ① 顶层不是对象（数组 / null / 数字 / 布尔）→ 拒绝
  if (!isPlainObject(candidate)) {
    return fail('JSON 顶层不是对象（应为一份报告对象），已拒绝导入。', state);
  }
  const bag = candidate;

  // ② 缺标识字段不拒绝，只加 warning
  const identityMissing = ['tool', 'version', 'cmd'].filter(
    (key) => bag[key] === undefined || bag[key] === null || bag[key] === ''
  );
  if (identityMissing.length > 0) {
    warnings.push(
      `报告缺少标识字段（${identityMissing.join(' / ')}），不拒绝导入；按已知字段尽力渲染，缺失值显示「—」。`
    );
  }

  // ⑥ 版本不一致只加 warning
  const version = asString(bag.version, '—');
  if (version !== CURRENT_REPORT_VERSION) {
    warnings.push(
      `报告版本（${version}）与当前 CLI（${CURRENT_REPORT_VERSION}）不一致，仅按已知字段渲染。`
    );
  }

  // ⑥ lift / patch 允许导入，但提示视图用途
  const rawCmd = asString(bag.cmd, '—');
  const cmd: DilipaCmd =
    rawCmd === 'lift' || rawCmd === 'patch' || rawCmd === 'analyze' ? rawCmd : 'analyze';
  if (cmd === 'lift' || cmd === 'patch') {
    warnings.push(`本视图面向 analyze 报告；这份是 ${cmd} 报告，changes 等字段仅列出、不解释。`);
  }

  // ③ calls / dangerous 归一
  const calls = coerceCalls(bag.calls, 'calls', warnings);
  let dangerous = coerceCalls(bag.dangerous, 'dangerous', warnings);
  if (dangerous.length === 0 && calls.length > 0) {
    dangerous = calls.filter((site) => site.is_dangerous === true);
    warnings.push('字段 dangerous 为空但 calls 非空，已按 is_dangerous === true 重新计算危险调用。');
  }

  // ⑥ 空 call 必须明确提示已知限制，禁止伪装成分析成功
  if (calls.length === 0) {
    warnings.push(NO_CALLS_HINT);
  }

  const instructionCount =
    typeof bag.instruction_count === 'number' && Number.isFinite(bag.instruction_count)
      ? bag.instruction_count
      : undefined;

  const sections = Array.isArray(bag.sections)
    ? (bag.sections as unknown[]).map((item) => asString(item, ''))
    : [];

  const report: DilipaReport = {
    tool: asString(bag.tool, '—'),
    version,
    path: asString(bag.path, '—'),
    arch: asString(bag.arch, '—'),
    bits: typeof bag.bits === 'number' && Number.isFinite(bag.bits) ? bag.bits : 0,
    endian: asString(bag.endian, '—'),
    e_type: asString(bag.e_type, '—'),
    entry: asString(bag.entry, '—'),
    sections,
    cmd,
    calls,
    dangerous,
    instruction_count: instructionCount,
    source: typeof bag.source === 'string' ? bag.source : undefined,
    instructions: Array.isArray(bag.instructions) ? (bag.instructions as unknown[]) : undefined,
    pseudo_c: typeof bag.pseudo_c === 'string' ? bag.pseudo_c : undefined,
    output: typeof bag.output === 'string' ? bag.output : undefined,
    changes: Array.isArray(bag.changes) ? (bag.changes as unknown[]) : undefined,
    note: typeof bag.note === 'string' ? bag.note : undefined,
  };

  return { ok: true, report, warnings, state };
}

/**
 * 从文件文本直接归一化（ReportImporter 使用）：含 >1MB 与非法 JSON 检查，
 * 全程零网络请求、不写 localStorage。
 */
export function normalizeReportText(text: string, state: RenderState): NormalizedReport {
  if (typeof text !== 'string') {
    return fail('读取到的内容不是文本，无法解析。', state);
  }
  if (byteLength(text) > MAX_REPORT_BYTES) {
    return fail('文件超过 1MB，为避免卡住浏览器已拒绝导入。', state);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return fail('这不是合法的 JSON 文本，无法解析成报告。请检查文件内容或重新下载样例 JSON。', state);
  }
  return normalizeReport(parsed, state);
}
