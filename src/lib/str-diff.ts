/**
 * 行级 diff —— 从 DilipaWorkbench.tsx:computeStrDiff() 抽出的单一实现。
 *
 * 本质是按行号对齐 + 字符串比较（22 行），只回答「哪几行变了」，
 * 教学展示完全够用；它不是 AST 树 diff，页面不得再称其为「AST Diff」。
 * L3PatchDiff / ReportCompareView / DilipaWorkbench 三处共用，避免重复实现。
 */

export interface DiffLine {
  text: string;
  type: 'normal' | 'added' | 'removed';
}

export interface SideBySideDiff {
  left: DiffLine[];
  right: DiffLine[];
}

export function computeStrDiff(orig: string, patch: string): SideBySideDiff {
  const o = orig.split('\n');
  const p = patch.split('\n');
  const max = Math.max(o.length, p.length);
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  for (let i = 0; i < max; i += 1) {
    const a = o[i] ?? '';
    const b = p[i] ?? '';
    if (a === b) {
      left.push({ text: a, type: 'normal' });
      right.push({ text: b, type: 'normal' });
    } else if (a && !b) {
      left.push({ text: a, type: 'removed' });
      right.push({ text: '', type: 'normal' });
    } else if (!a && b) {
      left.push({ text: '', type: 'normal' });
      right.push({ text: b, type: 'added' });
    } else {
      left.push({ text: a, type: 'removed' });
      right.push({ text: b, type: 'added' });
    }
  }
  return { left, right };
}
