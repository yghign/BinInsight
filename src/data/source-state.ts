/**
 * 三态标签唯一定义处（架构 D.5.1）。
 *
 * 任何终端、diff、报告、统计数字、预览、规划条目都必须挂
 * <SourceBadge state={...} />，禁止出现裸的成功结论字样或
 * 未标注来源的统计数字。全站禁用词表由 scripts/check-honesty.mjs 统一维护。
 *
 * 固定文案（不得改写）：真实输出 / 演示样例 / 规划中。
 * 颜色只复用现有 CSS 变量，不新增强调色。
 */

export type SourceState = 'real' | 'demo' | 'planned';

/** 三态固定文案，唯一出口。 */
export const SOURCE_LABELS: Record<SourceState, string> = {
  real: '真实输出',
  demo: '演示样例',
  planned: '规划中',
};

/** 三态对应的 CSS class（定义在 globals.css 的 .u-source-*）。 */
export const SOURCE_TONES: Record<SourceState, string> = {
  real: 'u-source-real',
  demo: 'u-source-demo',
  planned: 'u-source-planned',
};

/** 三态的补充说明，供 SourceBadge 的 title / 页面底部一致性说明复用。 */
export const SOURCE_NOTES: Record<SourceState, string> = {
  real: '数据来自你导入的 JSON 报告，按报告对象渲染，未做任何补写。',
  demo: '由课前已验证的 ELF 样本预先生成，非现场运行，也不是仓库内 CLI 原样跑出的结果。',
  planned: '仅为设计构想或后续工作清单，本次未实现。',
};

export const SOURCE_STATES: SourceState[] = ['real', 'demo', 'planned'];

/** 取固定文案；未知值兜底为「演示样例」，绝不猜测来源。 */
export function labelOf(state: SourceState): string {
  return SOURCE_LABELS[state] ?? SOURCE_LABELS.demo;
}

/** 取 CSS class；未知值兜底为 demo。 */
export function toneOf(state: SourceState): string {
  return SOURCE_TONES[state] ?? SOURCE_TONES.demo;
}

/** 取补充说明。 */
export function noteOf(state: SourceState): string {
  return SOURCE_NOTES[state] ?? SOURCE_NOTES.demo;
}
