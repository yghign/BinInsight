'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModeToggle, { type Mode } from '@/components/ModeToggle';
import CodeBlock from '@/components/CodeBlock';
import clsx from 'clsx';

/* ---------- 路径图 CFG 交互组件 ---------- */

type NodeType = 'entry' | 'branch' | 'vuln' | 'exit';

interface CFGNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}

interface CFGEdge {
  from: string;
  to: string;
  label?: string;
  reachable: boolean;
}

const cfgNodes: CFGNode[] = [
  { id: 'entry', label: 'main()\n读取输入', type: 'entry', x: 240, y: 30 },
  { id: 'b1', label: 'if (len > 10)', type: 'branch', x: 240, y: 110 },
  { id: 'b2', label: 'if (strncmp(input,\n"CMD", 3) == 0)', type: 'branch', x: 240, y: 200 },
  { id: 'vuln', label: 'vulnerable_func()\nstrcpy 栈溢出', type: 'vuln', x: 240, y: 300 },
  { id: 'exit1', label: 'return 0\n(长度不足)', type: 'exit', x: 80, y: 155 },
  { id: 'exit2', label: 'return 0\n(前缀不匹配)', type: 'exit', x: 80, y: 250 },
  { id: 'exit3', label: 'return 0\n(正常退出)', type: 'exit', x: 400, y: 350 },
];

function computeReachability(
  edges: { from: string; to: string; label?: string; condition?: string }[],
  constraints: { lenGt10: boolean; prefixCMD: boolean }
): CFGEdge[] {
  return edges.map((e) => {
    let reachable = true;
    if (e.condition === 'lenGt10_true') reachable = constraints.lenGt10;
    if (e.condition === 'lenGt10_false') reachable = !constraints.lenGt10;
    if (e.condition === 'prefixCMD_true') reachable = constraints.prefixCMD;
    if (e.condition === 'prefixCMD_false') reachable = !constraints.prefixCMD;
    return { from: e.from, to: e.to, label: e.label, reachable };
  });
}

const rawEdges = [
  { from: 'entry', to: 'b1' },
  { from: 'b1', to: 'b2', label: 'len > 10', condition: 'lenGt10_true' },
  { from: 'b1', to: 'exit1', label: 'len ≤ 10', condition: 'lenGt10_false' },
  { from: 'b2', to: 'vuln', label: '前缀匹配', condition: 'prefixCMD_true' },
  { from: 'b2', to: 'exit2', label: '前缀不匹配', condition: 'prefixCMD_false' },
  { from: 'vuln', to: 'exit3' },
];

/* 预设场景：帮新手按顺序体验「条件如何决定可达性」 */
const scenarioPresets = [
  {
    id: 'A',
    label: '输入 "hi"',
    lenGt10: false,
    prefixCMD: false,
    explain:
      '"hi" 只有 2 个字符，在第一个判断 if (len > 10) 处就不满足，程序直接走向「长度不足」的退出分支 —— 执行流根本到不了第二个判断，更到不了漏洞点。',
  },
  {
    id: 'B',
    label: '输入 "CMD!"',
    lenGt10: false,
    prefixCMD: true,
    explain:
      '"CMD!" 的前缀匹配通过了第二个判断，但长度只有 4，第一道关卡 len > 10 依然过不去。注意：两个条件缺一不可，任何一道不满足都会提前退出。',
  },
  {
    id: 'C',
    label: '输入 "CMDaaaaaaaaaaa"',
    lenGt10: true,
    prefixCMD: true,
    explain:
      '"CMD" 开头再补 11 个字母，总长 14 > 10，两个条件同时满足。执行流一路畅通直达 vulnerable_func() 里的 strcpy —— 图中红色高亮就是攻击者想要的路径。',
  },
];

function nodeColor(type: NodeType, isReachable: boolean) {
  if (!isReachable) {
    return {
      fill: 'var(--node-unreachable-fill)',
      stroke: 'var(--node-unreachable-stroke)',
      text: 'var(--node-unreachable-text)',
    };
  }
  switch (type) {
    case 'entry':
      return {
        fill: 'var(--node-entry-fill)',
        stroke: 'var(--node-entry-stroke)',
        text: 'var(--node-entry-text)',
      };
    case 'branch':
      return {
        fill: 'var(--node-branch-fill)',
        stroke: 'var(--node-branch-stroke)',
        text: 'var(--node-branch-text)',
      };
    case 'vuln':
      return {
        fill: 'var(--node-vuln-fill)',
        stroke: 'var(--node-vuln-stroke)',
        text: 'var(--node-vuln-text)',
      };
    case 'exit':
      return {
        fill: 'var(--node-exit-fill)',
        stroke: 'var(--node-exit-stroke)',
        text: 'var(--node-exit-text)',
      };
  }
}

function PathExplorer() {
  const [lenGt10, setLenGt10] = useState(false);
  const [prefixCMD, setPrefixCMD] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (p: (typeof scenarioPresets)[number]) => {
    setLenGt10(p.lenGt10);
    setPrefixCMD(p.prefixCMD);
    setActivePreset(p.id);
  };

  const toggleLen = (v: boolean) => {
    setLenGt10(v);
    setActivePreset(null);
  };
  const togglePrefix = (v: boolean) => {
    setPrefixCMD(v);
    setActivePreset(null);
  };

  const activePresetData = scenarioPresets.find((p) => p.id === activePreset);

  const edges = computeReachability(rawEdges, { lenGt10, prefixCMD });

  const reachableNodes = new Set<string>(['entry']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of edges) {
      if (reachableNodes.has(e.from) && e.reachable && !reachableNodes.has(e.to)) {
        reachableNodes.add(e.to);
        changed = true;
      }
    }
  }

  const vulnReachable = reachableNodes.has('vuln');

  const getNodePos = (id: string) => {
    const n = cfgNodes.find((x) => x.id === id)!;
    return { x: n.x, y: n.y };
  };

  return (
    <div className="u-panel p-5 md:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 约束条件面板 */}
        <div className="lg:w-60 flex-shrink-0">
          <h4 className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-3">
            约束条件 / CONSTRAINTS
          </h4>

          {/* 预设场景：新手从这里开始 */}
          <div className="mb-4">
            <p className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-1.5">
              新手？先依次点一遍这三个预设输入
            </p>
            <div className="space-y-1.5">
              {scenarioPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-md border text-[12.5px] transition-colors',
                    activePreset === p.id
                      ? 'border-brand-500/60 bg-brand-500/10 text-[var(--text)]'
                      : 'border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]'
                  )}
                >
                  <span className="font-mono text-[10px] text-[var(--text-soft)] mr-2">{p.id}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={lenGt10}
                onChange={(e) => toggleLen(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--brand-500)]"
              />
              <div>
                <div className="text-[13.5px] text-[var(--text)] group-hover:text-[var(--text-bright)] transition-colors">
                  输入长度 {'>'} 10
                </div>
                <div className="font-mono text-[11px] text-[var(--text-soft)] mt-0.5">
                  len(input) {'>'} 10
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={prefixCMD}
                onChange={(e) => togglePrefix(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--brand-500)]"
              />
              <div>
                <div className="text-[13.5px] text-[var(--text)] group-hover:text-[var(--text-bright)] transition-colors">
                  输入前缀为 "CMD"
                </div>
                <div className="font-mono text-[11px] text-[var(--text-soft)] mt-0.5">
                  strncmp(input, &quot;CMD&quot;, 3) == 0
                </div>
              </div>
            </label>
          </div>

          {/* 状态提示 */}
          <div
            className={clsx(
              'mt-6 p-4 rounded-md border',
              vulnReachable
                ? 'bg-accent-red/5 border-accent-red/40'
                : 'bg-accent-green/5 border-accent-green/30'
            )}
          >
            <span
              className={clsx(
                'block text-[13px] font-semibold mb-1',
                vulnReachable ? 'text-accent-red' : 'text-accent-green'
              )}
            >
              {vulnReachable ? '漏洞路径可达' : '漏洞路径不可达'}
            </span>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              {vulnReachable
                ? '存在输入可以触发 vulnerable_func() 中的栈溢出'
                : '当前约束下无法到达漏洞点'}
              </p>
          </div>

          {/* 预设场景解读 */}
          {activePresetData && (
            <div className="mt-3 p-4 rounded-md border border-[var(--border)] bg-[var(--bg-card)]">
              <div className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-1.5">
                场景 {activePresetData.id} 解读 · 为什么是这个结果
              </div>
              <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                {activePresetData.explain}
              </p>
            </div>
          )}

          {/* 图例 */}
          <div className="mt-6">
            <h4 className="font-mono text-[10px] tracking-wider text-[var(--text-soft)] mb-2.5">
              图例 / LEGEND
            </h4>
            <div className="space-y-1.5 font-mono text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)]" />
                <span>ENTRY · 入口节点</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
                <span>BRANCH · 分支判断</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                <span>SINK · 漏洞点</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                <span>EXIT · 正常退出</span>
              </div>
            </div>
          </div>
        </div>

        {/* SVG 路径图 */}
        <div className="flex-1 flex justify-center items-center bg-[var(--bg-soft)] rounded-md border border-[var(--border)] min-h-[420px] overflow-auto">
          <svg viewBox="0 0 480 400" className="w-full max-w-lg">
            {/* 边 */}
            {edges.map((edge, i) => {
              const from = getNodePos(edge.from);
              const to = getNodePos(edge.to);
              const color = edge.reachable ? 'var(--edge-reachable)' : 'var(--edge-unreachable)';
              const strokeWidth = edge.reachable ? 2.5 : 1.5;
              const dashArray = edge.reachable ? '' : '4 4';

              let x1 = from.x;
              let y1 = from.y + 28;
              let x2 = to.x;
              let y2 = to.y - 28;

              if (to.x < from.x) {
                x1 = from.x - 70;
                y1 = from.y;
                x2 = to.x + 70;
                y2 = to.y;
              }
              if (to.x > from.x && edge.to === 'exit3') {
                x1 = from.x + 70;
                y1 = from.y + 10;
                x2 = to.x - 70;
                y2 = to.y - 10;
              }

              const angle = Math.atan2(y2 - y1, x2 - x1);
              const arrowSize = 6;

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    className={edge.reachable ? 'transition-all duration-500' : ''}
                  />
                  <polygon
                    points={`${x2},${y2} ${x2 - arrowSize * Math.cos(angle - Math.PI / 6)},${
                      y2 - arrowSize * Math.sin(angle - Math.PI / 6)
                    } ${x2 - arrowSize * Math.cos(angle + Math.PI / 6)},${
                      y2 - arrowSize * Math.sin(angle + Math.PI / 6)
                    }`}
                    fill={color}
                  />
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2 + (to.x < from.x ? -10 : 10)}
                      y={(y1 + y2) / 2 - 5}
                      textAnchor="middle"
                      fill={edge.reachable ? 'var(--edge-label-reachable)' : 'var(--edge-label-unreachable)'}
                      fontSize="10"
                      className="select-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 节点 */}
            {cfgNodes.map((node) => {
              const isReachable = reachableNodes.has(node.id);
              const colors = nodeColor(node.type, isReachable);
              const isVuln = node.type === 'vuln';
              return (
                <g key={node.id}>
                  <rect
                    x={node.x - 70}
                    y={node.y - 22}
                    width="140"
                    height="44"
                    rx="6"
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isReachable ? 2 : 1}
                    className={isVuln && isReachable ? 'animate-pulse' : ''}
                  />
                  <text
                    x={node.x}
                    y={node.y - 4}
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize="11"
                    fontWeight="600"
                    className="select-none"
                  >
                    {node.label.split('\n')[0]}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 10}
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize="10"
                    opacity="0.8"
                    className="select-none"
                  >
                    {node.label.split('\n')[1]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- 主页面 ---------- */

export default function Step3Page() {
  const [mode, setMode] = useState<Mode>('beginner');

  return (
    <div className="space-y-14">
      {/* 页头 */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <p className="u-eyebrow mb-2">Source-to-Sink</p>
            <h2 className="u-display text-2xl md:text-[28px]">路径探索与漏洞确认</h2>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
          静态分析发现的可疑点不一定都是真漏洞。通过路径探索和可达性分析，
          我们确认哪些漏洞点确实可以被触发。
        </p>
      </section>

      {/* 3.1 核心交互：控制流图 */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="u-section-num">3.1</span>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            交互示例：控制流图与可达性
          </h3>
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
          调整左侧的约束条件开关，观察右侧控制流图中哪些路径变为可达。
          当两个条件同时满足时，漏洞路径将被高亮为红色。
          不知道从哪里开始？先依次点击左侧的<strong className="text-[var(--text)]">场景 A / B / C</strong>三个预设输入，
          读完解读后再自由勾选探索。
        </p>
        <PathExplorer />
      </section>

      {/* 新手模式 */}
      {mode === 'beginner' && (
        <div className="space-y-10">
          {/* 源到汇 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">3.2</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                什么是「源到汇」分析？
              </h3>
            </div>
            <div className="space-y-4 text-[15px] text-[var(--text-muted)] leading-relaxed">
              <p>
                想象一下，程序就像一条水管网络。<strong className="text-[var(--text)]">「源」（Source）</strong>
                是污水流进来的地方——也就是用户输入、网络数据、文件读取这些外部数据进入程序的点。
                <strong className="text-[var(--text)]">「汇」（Sink）</strong>
                则是危险的地点——比如可能发生溢出的缓冲区、可能执行任意代码的函数。
              </p>
              <p>
                源到汇分析的任务就是：找出从「源」到「汇」的所有可能路径。
                如果存在一条路径，那么攻击者就有可能通过精心构造的输入，
                让恶意数据从源流向汇，从而触发漏洞。
              </p>
            </div>
            <div className="u-panel p-5">
              <div className="flex items-center gap-3 md:gap-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-md border border-[var(--brand-500)] text-[var(--brand-500)] flex items-center justify-center text-[13px] font-semibold">
                    源
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-soft)]">SOURCE</span>
                </div>
                <span className="font-mono text-[var(--border-soft)]" aria-hidden="true">→</span>
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-md border border-accent-orange text-accent-orange flex items-center justify-center text-[13px] font-semibold">
                    途
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-soft)]">PATH</span>
                </div>
                <span className="font-mono text-[var(--border-soft)]" aria-hidden="true">→</span>
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-md border border-accent-red text-accent-red flex items-center justify-center text-[13px] font-semibold">
                    汇
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-soft)]">SINK</span>
                </div>
                <span className="text-[13px] text-[var(--text-muted)] ml-0 md:ml-4">
                  用户输入 → 中间处理 → 危险函数调用
                </span>
              </div>
            </div>
          </section>

          {/* 可达性分析 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">3.3</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">什么是可达性分析？</h3>
            </div>
            <div className="space-y-4 text-[15px] text-[var(--text-muted)] leading-relaxed">
              <p>
                可达性分析回答一个简单但关键的问题：
                <strong className="text-[var(--text)]">「从程序入口出发，到底能不能走到这个漏洞点？」</strong>
              </p>
              <p>
                有时候静态分析会标记一个函数有漏洞，但这个函数可能根本不会被调用到，
                或者调用它之前有严格的条件检查，使得攻击者无法满足。
                这样的「漏洞」虽然存在于代码中，但实际上是不可利用的。
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="bg-[var(--bg-card)] p-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-accent-green" />
                  <span className="font-semibold text-accent-green text-[13.5px]">可达漏洞</span>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                  存在至少一条执行路径可以到达漏洞点，且攻击者有可能构造出满足条件的输入。
                  这是真正需要修复的安全问题。
                </p>
              </div>
              <div className="bg-[var(--bg-card)] p-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--text-soft)]" />
                  <span className="font-semibold text-[var(--text-muted)] text-[13.5px]">不可达漏洞</span>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                  漏洞代码存在但无法通过任何输入触发。可能是死代码、被严格条件保护、
                  或只在调试模式下编译。通常被归类为误报。
                </p>
              </div>
            </div>
          </section>

          {/* 为什么需要确认 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">3.4</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                为什么需要确认漏洞可达？
              </h3>
            </div>
            <div className="border-t border-[var(--border)]">
              {[
                {
                  title: '减少误报',
                  desc: '静态分析工具往往报告大量可疑点，但其中很多是不可达的假阳性。可达性分析帮我们过滤掉噪音，聚焦真正的威胁。',
                },
                {
                  title: '评估威胁等级',
                  desc: '可达的漏洞才有被利用的可能。确认可达性是漏洞评级和修复优先级的重要依据。',
                },
                {
                  title: '指导漏洞利用',
                  desc: '知道了哪条路径可达，就能知道攻击者需要满足哪些条件，这对构造 PoC（概念验证）和评估利用难度至关重要。',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="grid md:grid-cols-[56px_200px_1fr] gap-2 md:gap-8 py-5 border-b border-[var(--border)]"
                >
                  <span className="u-flow-tick" aria-hidden="true" />
                  <strong className="text-[14.5px] text-[var(--text)]">{item.title}</strong>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 进阶模式 */}
      {mode === 'advanced' && (
        <div className="space-y-10">
          {/* 符号执行 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="u-section-num">3.2</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">符号执行基础</h3>
            </div>
            <div className="space-y-4 text-[15px] text-[var(--text-muted)] leading-relaxed">
              <p>
                符号执行（Symbolic Execution）是一种程序分析技术，它不使用具体数值作为输入，
                而是使用<strong className="text-[var(--text)]">符号值</strong>（如 x, y）来表示输入。
                程序执行时，所有计算结果都以符号表达式的形式表示。
              </p>
              <p>
                当遇到分支语句时，符号执行器会<strong className="text-[var(--text)]">同时探索两个分支</strong>，
                并为每个分支积累一个「路径约束」（path constraint）。
                到达漏洞点后，将路径约束交给 SMT 求解器（如 Z3）判断是否可满足。
                如果可满足，说明存在具体输入可以触发该漏洞。
              </p>
              <CodeBlock
                language="c"
                title="符号执行示例 · 路径约束积累"
                code={`void check_input(char *input) {
    int len = strlen(input);       // len = sym_len
    if (len > 10) {                // constraint: sym_len > 10
        if (input[0] == 'C' &&     // constraint: input[0] == 'C'
            input[1] == 'M' &&     // constraint: input[1] == 'M'
            input[2] == 'D') {     // constraint: input[2] == 'D'
            vulnerable_func(input); // 漏洞点：所有约束同时满足
        }
    }
}

// 到达漏洞点的路径约束:
//   sym_len > 10
//   ∧ input[0] == 'C'
//   ∧ input[1] == 'M'
//   ∧ input[2] == 'D'
//
// SMT 求解器判断: SATISFIABLE → 漏洞可达
// 求解器还可以给出一组具体的输入: "CMDsafasdfasd"`}
              />
            </div>
          </section>

          {/* 两条并排知识块 */}
          <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="bg-[var(--bg-card)] p-6">
              <h4 className="font-mono text-[11px] tracking-wider mb-4 text-accent-orange">
                静态分析为什么有误报？
              </h4>
              <ul className="space-y-2.5 text-[13px] text-[var(--text-muted)]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span><strong className="text-[var(--text)]">不精确的指针分析</strong>：无法确定指针具体指向哪个对象</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span><strong className="text-[var(--text)]">忽略路径条件</strong>：有些工具只做流不敏感分析</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span><strong className="text-[var(--text)]">过程间分析简化</strong>：函数调用上下文处理不精确</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[var(--text-soft)]">—</span>
                  <span><strong className="text-[var(--text)]">环境建模缺失</strong>：系统调用、外部库行为不确定</span>
                </li>
              </ul>
            </div>

            <div className="bg-[var(--bg-card)] p-6">
              <h4 className="font-mono text-[11px] tracking-wider mb-4 text-accent-red">
                路径爆炸问题 / PATH EXPLOSION
              </h4>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                程序中的分支数量呈指数增长。一个简单的循环执行 n 次就可能产生
                2<sup>n</sup> 条路径。对于真实世界的程序，完整的符号执行几乎不可能。
              </p>
              <div className="mt-4 border border-[var(--border)] rounded-md p-4">
                <p className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] mb-2">
                  常见缓解策略
                </p>
                <ul className="font-mono text-[11px] leading-relaxed text-[var(--text-soft)] space-y-1">
                  <li>· 搜索策略优化（DFS / BFS / 随机 / 覆盖率引导）</li>
                  <li>· 路径合并（Path Merging）</li>
                  <li>· 增量求解（Incremental Solving）</li>
                  <li>· 下近似（Under-approximation）</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 欠约束符号执行 */}
          <section className="u-panel p-6 md:p-7">
            <h4 className="font-mono text-[11px] tracking-wider mb-4 text-[var(--accent-cyan)]">
              欠约束符号执行 / UNDER-CONSTRAINED SE
            </h4>
            <div className="space-y-3 text-[13.5px] text-[var(--text-muted)] leading-relaxed">
              <p>
                传统符号执行从程序入口（如 main）开始，但这要求构造完整的执行环境。
                <strong className="text-[var(--text)]">欠约束符号执行</strong>
                则直接从感兴趣的函数开始，将函数参数和全局变量都设为符号值。
              </p>
              <p>
                这种方法可以快速深入单个函数，但可能产生误报——
                因为它忽略了调用者可能施加的约束。例如，函数内部假设指针非空，
                但欠约束执行可能让指针为 NULL，从而报告一个不存在的空指针解引用。
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-md mt-5 overflow-hidden">
              <div className="bg-[var(--bg-soft)] p-4">
                <p className="font-mono text-[11px] tracking-wider text-accent-green mb-2">优点</p>
                <ul className="text-[12.5px] text-[var(--text-muted)] space-y-1.5">
                  <li>· 速度快，可直接聚焦目标函数</li>
                  <li>· 无需构建完整程序环境</li>
                  <li>· 适合单个函数的深度分析</li>
                </ul>
              </div>
              <div className="bg-[var(--bg-soft)] p-4">
                <p className="font-mono text-[11px] tracking-wider text-accent-red mb-2">缺点</p>
                <ul className="text-[12.5px] text-[var(--text-muted)] space-y-1.5">
                  <li>· 可能产生误报（忽略调用上下文）</li>
                  <li>· 需要额外验证结果真实性</li>
                  <li>· 跨函数数据流分析不完整</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 3.5 动态分析入门 */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="u-section-num">3.5</span>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            动态分析入门：三条 GDB 命令定位崩溃
          </h3>
        </div>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
          静态分析负责猜测路径，动态分析负责验证路径。
          最直接的办法：把超长输入喂给程序，让它在调试器里「崩溃给你看」。
        </p>

        <CodeBlock
          code={`$ gdb ./vuln
(gdb) run $(python3 -c "print('A'*200)")   # 喂 200 个 'A' 触发溢出
Program received signal SIGSEGV, Segmentation fault.
(gdb) bt                          # ① 看调用栈：崩在哪个函数
#0  0x0000414141414141 in ?? ()
(gdb) info registers rip rsp      # ② 看寄存器：RIP 被谁接管
rip            0x4141414141414141  # 'A' = 0x41，返回地址已被覆盖
(gdb) x/8gx $rsp                  # ③ 看栈顶残留的溢出数据`}
          language="bash"
          title="GDB 三件套 · 复现并定位崩溃"
          showLineNumbers={false}
        />

        <ul className="space-y-2 text-[13px] text-[var(--text-muted)]">
          <li className="flex items-start gap-2.5">
            <span className="font-mono text-[var(--text-soft)]">—</span>
            <span>
              <code className="inline">bt</code>（backtrace）：打印调用栈，看程序崩在哪个函数、从哪里调过来
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono text-[var(--text-soft)]">—</span>
            <span>
              <code className="inline">info registers</code>：<code className="inline">rip</code><span className="text-[var(--text-muted)] font-normal">（指令指针寄存器）</span> 显示 0x4141… 说明返回地址被
              &apos;A&apos;（0x41）覆盖——覆盖 = 可控 = RIP 到手
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono text-[var(--text-soft)]">—</span>
            <span>
              <code className="inline">x/8gx $rsp</code>：查看栈顶 8 个 64 位值（<code className="inline">rsp</code><span className="text-[var(--text-muted)] font-normal">（栈顶指针）</span> 指向的位置），确认溢出数据的落点
            </span>
          </li>
        </ul>

        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
          崩溃点确认后，下一步是计算偏移量、精确控制 RIP——案例区沙箱里有完整练习。
        </p>

        <p className="font-mono text-[12px]">
          <Link href="/reference/stack#demo" className="text-[var(--brand-500)] hover:underline">
            延伸阅读 → /reference/stack 演示（嵌入式 <code className="inline">{'GDB'}</code><span className="text-[var(--text-muted)] font-normal">（GNU 调试器）</span> 逐步执行模拟器）
          </Link>
        </p>
      </section>

      {/* 底部导航 */}
      <section className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3">
        <Link href="/learn/step2" className="u-btn u-btn-ghost">
          <span className="font-mono" aria-hidden="true">←</span>
          上一步 · 静态分析
        </Link>
        <Link href="/learn/step4" className="u-btn u-btn-primary">
          下一步 · 防护策略
          <span className="font-mono" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
