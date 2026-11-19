'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SourceBadge from '../SourceBadge';
import TermButton from '../TermButton';

/**
 * L4 能碰到吗 —— 复用 learn/step3 的 scenarioPresets A/B/C（"hi" / "CMD!" / "CMDaaaa…"）。
 * 唯一新概念：条件门槛（进园要同时过两道关）。
 * 已砍掉 CFG / ENTRY / BRANCH / SINK 图例与全部图论词汇；勾选项标签改白话
 * 「输入够长吗」「开头是 CMD 吗」。
 */

interface Scenario {
  id: 'A' | 'B' | 'C';
  label: string;
  lenOk: boolean;
  prefixOk: boolean;
  explain: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'A',
    label: '输入 "hi"',
    lenOk: false,
    prefixOk: false,
    explain:
      '"hi" 只有 2 个字符，第一道关「输入够长吗」就不满足，程序直接结束 —— 连第二道关都到不了，更到不了 strcpy。',
  },
  {
    id: 'B',
    label: '输入 "CMD!"',
    lenOk: false,
    prefixOk: true,
    explain:
      '"CMD!" 开头是 CMD，第二道关能过；但它只有 4 个字符，第一道关过不去。两道关缺一不可，任何一道不满足都会提前结束。',
  },
  {
    id: 'C',
    label: '输入 "CMDaaaaaaaaaaa"',
    lenOk: true,
    prefixOk: true,
    explain:
      '"CMD" 开头再补 11 个字母，总长超过 10，两道关同时满足。程序一路走到 vulnerable 里的 strcpy —— 这就是能碰到漏洞点的那次输入。',
  },
];

export default function L4Conditions() {
  const [active, setActive] = useState<Scenario['id'] | null>(null);
  const scenario = SCENARIOS.find((item) => item.id === active) ?? null;
  const reached = scenario ? scenario.lenOk && scenario.prefixOk : false;

  return (
    <div className="u-lesson-stage">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="u-lesson-section !mb-0">两道关都过了，才会走到 strcpy</h2>
        <SourceBadge state="demo" />
      </div>

      <p className="u-lesson-body mb-5">
        像进游乐园要同时过「身高够」和「有门票」两道关。程序这里也有两道
        <TermButton termId="condition" />；只有都过了，才会走到我们在 L2 找到的那个
        <TermButton termId="strcpy" />。依次点下面三个预设输入，看会发生什么。
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {SCENARIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={clsx(
              'u-btn !py-2 !px-4 !text-[13px]',
              active === item.id ? 'u-btn-primary' : 'u-btn-ghost'
            )}
          >
            场景 {item.id} · {item.label}
          </button>
        ))}
      </div>

      {/* 两道关 */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: '第一道关：输入够长吗', ok: scenario?.lenOk ?? false, hint: '要超过 10 个字符' },
          { title: '第二道关：开头是 CMD 吗', ok: scenario?.prefixOk ?? false, hint: '前三个字母要是 CMD' },
        ].map((gate) => (
          <label
            key={gate.title}
            className={clsx(
              'u-panel p-4 flex items-start gap-3 transition-colors',
              scenario && gate.ok && 'border-accent-green/50 bg-accent-green/5',
              scenario && !gate.ok && 'border-accent-orange/40 bg-accent-orange/5'
            )}
          >
            <input
              type="checkbox"
              checked={gate.ok}
              readOnly
              aria-label={gate.title}
              className="mt-1 accent-[var(--brand-500)]"
            />
            <span>
              <span className="block text-[14px] font-medium">{gate.title}</span>
              <span className="u-lesson-note block mt-1">{gate.hint}</span>
              <span className="font-mono text-[11px] block mt-2">
                {scenario ? (gate.ok ? '✓ 过了' : '✗ 没过') : '（先选一个场景）'}
              </span>
            </span>
          </label>
        ))}
      </div>

      {/* 结论 */}
      <div
        className={clsx(
          'mt-5 rounded-md border p-4 text-[14.5px] leading-[1.85]',
          scenario && reached
            ? 'border-accent-red/40 bg-accent-red/5'
            : 'border-[var(--border)] bg-[var(--bg-soft)]'
        )}
      >
        {!scenario ? (
          <p className="text-[var(--text-muted)]">先点一个场景 A / B / C，看看输入是怎么被两道关筛掉的。</p>
        ) : (
          <>
            <p className="u-lesson-body mb-2">
              <strong className={reached ? 'text-[var(--accent-red)]' : 'text-[var(--text)]'}>
                {reached ? '两道关都过了 → 走到 strcpy' : '至少一道关没过 → 提前结束，走不到 strcpy'}
              </strong>
            </p>
            <p className="text-[var(--text-muted)]">{scenario.explain}</p>
          </>
        )}
      </div>

      <p className="u-lesson-note mt-4">
        以上为演示样例：三个输入和两道关都是课前备好的教学素材，不是现场运行结果。
      </p>
    </div>
  );
}
