#!/usr/bin/env node
/**
 * check-honesty.mjs — BinInsight 全站「诚实文案」自检脚本（T12）
 *
 * 为什么需要它：老师会按页面上的每一句文字追问「这是真跑出来的吗」。
 * 因此全站不允许出现伪装成成品结论的字样，主线也不允许偷偷走进 L8 拓展区。
 * 本脚本把这些口径固化成可复现的检查，`npm run check:honesty` 即可运行。
 *
 * 检查项：
 *   [1/4] 7 个禁用词在 src/app + src/components + src/data 中 0 命中
 *         （显式排除 src/data/source-state.ts 的词表位与脚本自身）
 *   [2/4] lesson.ts 的 8 级主线：next 只指向 l0..l7，绝不指向 l8
 *   [3/4] 三态标签体系完整：source-state.ts 导出 真实输出 / 演示样例 / 规划中
 *   [4/4] 三态标签覆盖：核心演示 / 报告 / 工作台 / 工具页都挂 <SourceBadge>
 *
 * 结果来自对磁盘文件的真实扫描，未硬编码任何结论：
 *   exit 0 = PASS（可复现） / exit 1 = FAIL（逐条列出命中位置）
 * 零第三方依赖，只使用 Node 内置模块。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 项目根目录（本脚本位于 <root>/scripts/check-honesty.mjs）。 */
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** 只扫描网站源码三处，天然不含 scripts/、node_modules/、docs/。 */
const SCAN_DIRS = ['src/app', 'src/components', 'src/data'];
const SCAN_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.json', '.md'];

const SELF_REL = 'scripts/check-honesty.mjs';
/**
 * 显式排除：
 *  - src/data/source-state.ts：三态定义处，允许在此维护「待扫描词表」常量
 *  - 脚本自身：词表字面量本身含有这些词，不能自己扫自己
 */
const EXCLUDED = new Set(['src/data/source-state.ts', SELF_REL]);

/**
 * 7 个禁用词（增量 PRD P0-2）。
 * PASS 用「大小写敏感 + 单词边界」，避免误伤 bypass / BYPASS / password 等正常技术词，
 * 只拦截 `[FIX] Patch verified: PASS` 这类全大写成品结论。
 */
const BANNED = [
  { label: 'verified OK', re: /verified\s+OK/i },
  { label: 'PASS', re: /\bPASS\b/ },
  { label: '注入完成', re: /注入完成/ },
  { label: '完整支持', re: /完整支持/ },
  { label: '已自动修复', re: /已自动修复/ },
  { label: 'docker pull bininsight', re: /docker\s+pull\s+bininsight/i },
  { label: 'mutagen v1.2.0', re: /mutagen\s+v1\.2\.0/i },
];

/** 三态固定文案，唯一出口在 source-state.ts。 */
const TRI_STATE_LABELS = ['真实输出', '演示样例', '规划中'];

/** 主线合法级别 id，任何 next 都不得越界到 l8。 */
const LEVEL_IDS = new Set(['l0', 'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7']);

/** 必须挂三态标签的核心展示面：演示 / 报告 / 工作台 / 工具页。 */
const MUST_BADGE = [
  'src/components/SourceBadge.tsx',
  'src/components/DilipaDemo.tsx',
  'src/components/DilipaWorkbench.tsx',
  'src/components/DemoTerminal.tsx',
  'src/components/dilipa/ReportImporter.tsx',
  'src/components/dilipa/ReportCompareView.tsx',
  'src/app/page.tsx',
  'src/app/tools/page.tsx',
  'src/app/tools/mutagen/page.tsx',
  'src/app/tools/dilipa/page.tsx',
];

/** 把绝对路径转成以 / 分隔、相对项目根的形式，供排除集合比较。 */
function toRel(absPath) {
  return relative(ROOT, absPath).split(sep).join('/');
}

/** 把相对项目根的路径转成绝对路径。 */
function absOf(relPath) {
  return join(ROOT, relPath);
}

/** 读取 UTF-8 文本；文件不存在时返回空串，由调用方按「缺失」处理。 */
function read(relPath) {
  try {
    return readFileSync(absOf(relPath), 'utf8');
  } catch {
    return '';
  }
}

/** 递归收集某目录下的候选文本文件；目录不存在时静默跳过。 */
function collectFiles(dirRel, out) {
  let entries = [];
  try {
    entries = readdirSync(absOf(dirRel), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const childRel = `${dirRel}/${entry.name}`;
    if (entry.isDirectory()) {
      collectFiles(childRel, out);
    } else if (entry.isFile() && SCAN_EXT.some((ext) => entry.name.endsWith(ext))) {
      out.push(childRel);
    }
  }
}

/** 是否属于显式排除集合（含 scripts/ 下的一切文件）。 */
function isExcluded(relPath) {
  return EXCLUDED.has(relPath) || relPath.startsWith('scripts/');
}

const failures = [];
const checks = [];

// ---------------------------------------------------------------- [1/4] 禁用词
const allFiles = [];
for (const dir of SCAN_DIRS) collectFiles(dir, allFiles);
const scanned = allFiles.filter((f) => !isExcluded(f));
const perWord = new Map(BANNED.map((b) => [b.label, 0]));

for (const fileRel of scanned) {
  const lines = read(fileRel).split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const banned of BANNED) {
      if (banned.re.test(line)) {
        perWord.set(banned.label, perWord.get(banned.label) + 1);
        failures.push(
          `禁用词「${banned.label}」命中 ${fileRel}:${idx + 1}: ${line.trim().slice(0, 100)}`
        );
      }
    }
  });
}
const bannedHits = [...perWord.values()].reduce((sum, n) => sum + n, 0);
const wordDetail = BANNED.map((b) => `${b.label}=${perWord.get(b.label)}`).join(' ');
checks.push({
  title: '[1/4] 禁用词 0 命中',
  ok: bannedHits === 0,
  detail: `扫描 ${scanned.length} 个文件 · ${wordDetail}`,
});

// ---------------------------------------------------- [2/4] lesson.ts 主线收口
const lessonText = read('src/data/lesson.ts');
const nextValues = [...lessonText.matchAll(/next:\s*'([^']*)'/g)].map((m) => m[1]);
const illegalNext = nextValues.filter((value) => !LEVEL_IDS.has(value));
if (illegalNext.length > 0) {
  failures.push(`lesson.ts 出现指向主线之外的 next：${illegalNext.join(', ')}`);
}
checks.push({
  title: '[2/4] 主线 next 只指向 l0..l7',
  ok: existsSync(absOf('src/data/lesson.ts')) && illegalNext.length === 0,
  detail: `非空 next 取值 ${nextValues.join(', ') || '—'} · 无 l8`,
});

// ------------------------------------------------------ [3/4] 三态标签体系完整
const stateText = read('src/data/source-state.ts');
const missingLabels = TRI_STATE_LABELS.filter((label) => !stateText.includes(label));
if (missingLabels.length > 0) {
  failures.push(`source-state.ts 缺少三态固定文案：${missingLabels.join('、')}`);
}
checks.push({
  title: '[3/4] 三态文案体系完整',
  ok: existsSync(absOf('src/data/source-state.ts')) && missingLabels.length === 0,
  detail: TRI_STATE_LABELS.join(' / '),
});

// ---------------------------------------------------------- [4/4] 三态标签覆盖
let badged = 0;
for (const fileRel of MUST_BADGE) {
  if (!existsSync(absOf(fileRel))) {
    failures.push(`展示面文件缺失（不应删文件）：${fileRel}`);
    continue;
  }
  const text = read(fileRel);
  if (/SourceBadge|SOURCE_LABELS|sourceState/.test(text)) {
    badged += 1;
  } else {
    failures.push(`展示面未挂三态标签：${fileRel}`);
  }
}
checks.push({
  title: '[4/4] 三态标签覆盖',
  ok: badged === MUST_BADGE.length,
  detail: `${badged}/${MUST_BADGE.length} 个核心展示面挂 <SourceBadge>`,
});

// -------------------------------------------------------------------- 汇总输出
console.log('check:honesty — BinInsight 全站诚实文案自检');
console.log(`扫描范围：${SCAN_DIRS.join(' + ')}  |  排除 ${EXCLUDED.size} 个：词表位与脚本自身`);
console.log('');
for (const check of checks) {
  const status = check.ok ? 'OK  ' : 'FAIL';
  console.log(`${check.title} ................ ${status} · ${check.detail}`);
}
console.log('');

if (failures.length > 0) {
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('');
  console.error(`RESULT: FAIL — ${failures.length} 处不合规，请修正后重跑 npm run check:honesty。`);
  process.exit(1);
}
console.log('RESULT: PASS — 全部检查项通过（结论来自对磁盘文件的真实扫描，可复现）。');
process.exit(0);
