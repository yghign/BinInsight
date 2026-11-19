/**
 * 学习库搜索与拼音匹配（架构 07 §2.4 / PRD §4.5）。纯前端、零依赖。
 *
 * 匹配优先级：标题 → 别名 → 信号 → 拼音；includes 匹配。
 * 高亮安全：highlightParts() 切 {text,hit} 段，由 React 渲染 <mark>，
 * 绝不使用 dangerouslySetInnerHTML（React 默认转义，天然防 XSS）。
 */

import type { LibraryListItem, LibraryDifficulty, LibraryScene, HazardStar } from '@/data/library/types';

export type HitReason = '标题' | '别名' | '信号' | '拼音';

export interface SearchHit {
  item: LibraryListItem;
  reason: HitReason;
  snippet: string;
  start: number;
  end: number;
}

/** 归一化查询词：去首尾空格、转小写。 */
export function normalizeQuery(q: string): string {
  return (q ?? '').trim().toLowerCase();
}

/** 为一条列表项计算匹配结果；无命中返回 null。 */
export function matchItem(item: LibraryListItem, normalizedQuery: string): SearchHit | null {
  const q = normalizedQuery;
  if (!q) return null;

  // 1) 中文/英文直接包含：标题 → 别名 → 信号（优先级即此顺序）
  const title = item.title ?? '';
  const titleIdx = title.toLowerCase().indexOf(q);
  if (titleIdx >= 0) {
    return { item, reason: '标题', snippet: snippetOf(title, titleIdx, q.length), start: titleIdx, end: titleIdx + q.length };
  }
  for (const alias of item.aliases ?? []) {
    const idx = alias.toLowerCase().indexOf(q);
    if (idx >= 0) {
      return { item, reason: '别名', snippet: snippetOf(alias, idx, q.length), start: idx, end: idx + q.length };
    }
  }
  for (const signal of item.signals ?? []) {
    const idx = signal.toLowerCase().indexOf(q);
    if (idx >= 0) {
      return { item, reason: '信号', snippet: snippetOf(signal, idx, q.length), start: idx, end: idx + q.length };
    }
  }

  // 2) 拼音：输入去空格 + 小写；命中时高亮中文标题（读者真正要看的）
  const nq = q.replace(/\s+/g, '');
  if (!nq) return null;
  const p = item.pinyin;
  const sources = [
    (p?.full ?? '').replace(/\s+/g, ''),
    p?.joined ?? '',
    p?.initial ?? '',
  ];
  for (const source of sources) {
    if (source.includes(nq)) {
      // 高亮标题前缀（若标题含中文）或整标题；start/end 落在 title 上供组件分段
      const markLen = Math.min(title.length, Math.max(1, q.length));
      return { item, reason: '拼音', snippet: title, start: 0, end: markLen };
    }
  }
  return null;
}

/** 取命中前后约 20 字的片段。 */
function snippetOf(text: string, start: number, len: number): string {
  const from = Math.max(0, start - 20);
  const to = Math.min(text.length, start + len + 20);
  return text.slice(from, to);
}

/** 排序权重：前缀匹配 > 包含匹配 > 拼音匹配；同级标题短者优先。 */
function rank(hit: SearchHit): { tier: number; len: number } {
  const q = normalizeQuery(hit.item.title);
  let tier = 3;
  if (hit.reason === '拼音') tier = 3;
  else {
    const field = hit.reason === '标题' ? hit.item.title : hit.item.oneLiner;
    const lower = field.toLowerCase();
    // start 来自命中字段；前缀判断用 snippet 起点近似（0 视为前缀）
    tier = hit.start === 0 || lower.startsWith(normalizeQuery(hit.snippet.slice(0, 1))) ? 1 : 2;
  }
  return { tier, len: q.length };
}

/** 全库搜索：返回所有命中，按 前缀 > 包含 > 拼音、同级短标题优先 排序。 */
export function searchLibrary(query: string, items: LibraryListItem[]): SearchHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const item of items) {
    const hit = matchItem(item, q);
    if (hit) hits.push(hit);
  }
  hits.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra.tier !== rb.tier) return ra.tier - rb.tier;
    return a.item.title.length - b.item.title.length;
  });
  return hits;
}

/** 搜索建议：最多 6 条，只返回列表项。 */
export function searchSuggestions(query: string, items: LibraryListItem[]): LibraryListItem[] {
  return searchLibrary(query, items).slice(0, 6).map((hit) => hit.item);
}

/**
 * 把文本切成 {text,hit} 段供 <mark> 渲染；不做任何 HTML 拼接。
 * query 为空或全空格时返回单段 hit:false。
 */
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[] {
  const source = text ?? '';
  const raw = normalizeQuery(query).replace(/\s+/g, '');
  if (!raw) return [{ text: source, hit: false }];

  // 直接在原串上按小写 includes 找命中（中文/英文/数字混合均支持）；
  // 拼音输入时不强行高亮拼音（无对应汉字），此时返回单段不高亮。
  const lower = source.toLowerCase();
  const q = raw;
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  let found = false;
  while (cursor <= source.length) {
    const idx = lower.indexOf(q, cursor);
    if (idx < 0) break;
    found = true;
    if (idx > cursor) parts.push({ text: source.slice(cursor, idx), hit: false });
    parts.push({ text: source.slice(idx, idx + q.length), hit: true });
    cursor = idx + q.length;
  }
  if (!found) return [{ text: source, hit: false }];
  if (cursor < source.length) parts.push({ text: source.slice(cursor), hit: false });
  return parts;
}

/** 供 FilterPanel 复用的维度取值（难度/场景）。 */
export function difficultyLabelOf(d: LibraryDifficulty | undefined): string {
  if (d === 'beginner') return '低';
  if (d === 'intermediate') return '中';
  if (d === 'advanced') return '高';
  return '未标注';
}

export const ALL_SCENES: LibraryScene[] = ['Web', 'API', '系统', '网络', '云', '移动', 'AI', '通用'];
export const ALL_DIFFICULTIES: LibraryDifficulty[] = ['beginner', 'intermediate', 'advanced'];
export const ALL_HAZARD: HazardStar[] = [1, 2, 3, 4, 5];
