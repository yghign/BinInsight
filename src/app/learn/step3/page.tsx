'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModeToggle, { type Mode } from '@/components/ModeToggle';
import CodeBlock from '@/components/CodeBlock';
import {
  ArrowRight,
  ArrowLeft,
  GitBranch,
  Target,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Brain,
  Compass,
  Workflow,
  XCircle,
  CheckCircle2,
  Flame,
} from 'lucide-react';
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
  reachable: boolean; // depends on constraints
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

function nodeColor(type: NodeType, isReachable: boolean) {
  if (!isReachable) return { fill: '#1e293b', stroke: '#334155', text: '#64748b' };
  switch (type) {
    case 'entry':
      return { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' };
    case 'branch':
      return { fill: '#3b2f0a', stroke: '#f59e0b', text: '#fcd34d' };
    case 'vuln':
      return { fill: '#4c1d1d', stroke: '#ef4444', text: '#fca5a5' };
    case 'exit':
      return { fill: '#064e3b', stroke: '#10b981', text: '#6ee7b7' };
  }
}

function PathExplorer() {
  const [lenGt10, setLenGt10] = useState(false);
  const [prefixCMD, setPrefixCMD] = useState(false);

  const edges = computeReachability(rawEdges, { lenGt10, prefixCMD });

  // Compute which nodes are reachable (BFS from entry)
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
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 约束条件面板 */}
        <div className="lg:w-64 flex-shrink-0">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Zap size={16} className="text-accent-orange" />
            约束条件
          </h4>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={lenGt10}
                onChange={(e) => setLenGt10(e.target.checked)}
                className="mt-1 w-4 h-4 accent-brand-500"
              />
              <div>
                <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                  输入长度 {'>'} 10
                </div>
                <div className="text-xs text-gray-500">len(input) {'>'} 10</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={prefixCMD}
                onChange={(e) => setPrefixCMD(e.target.checked)}
                className="mt-1 w-4 h-4 accent-brand-500"
              />
              <div>
                <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                  输入前缀为 "CMD"
                </div>
                <div className="text-xs text-gray-500">strncmp(input, "CMD", 3) == 0</div>
              </div>
            </label>
          </div>

          {/* 状态提示 */}
          <div
            className={clsx(
              'mt-6 p-4 rounded-xl border',
              vulnReachable
                ? 'bg-accent-red/10 border-accent-red/40'
                : 'bg-accent-green/10 border-accent-green/30'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {vulnReachable ? (
                <AlertTriangle size={18} className="text-accent-red" />
              ) : (
                <ShieldAlert size={18} className="text-accent-green" />
              )}
              <span
                className={clsx(
                  'text-sm font-semibold',
                  vulnReachable ? 'text-accent-red' : 'text-accent-green'
                )}
              >
                {vulnReachable ? '漏洞路径可达！' : '漏洞路径不可达'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {vulnReachable
                ? '存在输入可以触发 vulnerable_func() 中的栈溢出'
                : '当前约束下无法到达漏洞点'}
            </p>
          </div>

          {/* 图例 */}
          <div className="mt-6 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              图例
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              入口节点
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-full bg-accent-orange" />
              分支判断
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-full bg-accent-red" />
              漏洞点
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-full bg-accent-green" />
              正常退出
            </div>
          </div>
        </div>

        {/* SVG 路径图 */}
        <div className="flex-1 flex justify-center items-center bg-bg-soft/50 rounded-xl border border-border/50 min-h-[420px] overflow-auto">
          <svg viewBox="0 0 480 400" className="w-full max-w-lg">
            {/* 边 */}
            {edges.map((edge, i) => {
              const from = getNodePos(edge.from);
              const to = getNodePos(edge.to);
              const color = edge.reachable ? '#3b82f6' : '#334155';
              const strokeWidth = edge.reachable ? 2.5 : 1.5;
              const dashArray = edge.reachable ? '' : '4 4';

              // 计算边的路径 - 从节点底部/侧边连接
              let x1 = from.x;
              let y1 = from.y + 28;
              let x2 = to.x;
              let y2 = to.y - 28;

              // 侧边连接到退出节点
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

              // 计算箭头角度
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
                  {/* 箭头 */}
                  <polygon
                    points={`${x2},${y2} ${x2 - arrowSize * Math.cos(angle - Math.PI / 6)},${
                      y2 - arrowSize * Math.sin(angle - Math.PI / 6)
                    } ${x2 - arrowSize * Math.cos(angle + Math.PI / 6)},${
                      y2 - arrowSize * Math.sin(angle + Math.PI / 6)
                    }`}
                    fill={color}
                  />
                  {/* 边标签 */}
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2 + (to.x < from.x ? -10 : 10)}
                      y={(y1 + y2) / 2 - 5}
                      textAnchor="middle"
                      fill={edge.reachable ? '#94a3b8' : '#475569'}
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
                    rx="8"
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
    <div className="space-y-10">
      {/* 顶部标题区 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium mb-2">
            <Compass size={16} />
            Step 3 · 路径探索
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            路径探索与漏洞确认
          </h2>
          <p className="text-gray-400 max-w-2xl">
            静态分析发现的可疑点不一定都是真漏洞。通过路径探索和可达性分析，
            我们确认哪些漏洞点确实可以被触发。
          </p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* 核心交互：路径图 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Workflow size={20} className="text-accent-cyan" />
          <h3 className="text-lg font-semibold text-white">交互示例：控制流图与可达性</h3>
        </div>
        <p className="text-gray-400 text-sm">
          调整左侧的约束条件开关，观察右侧控制流图中哪些路径变为可达。
          当两个条件同时满足时，漏洞路径将被高亮为红色。
        </p>
        <PathExplorer />
      </section>

      {/* 新手模式内容 */}
      {mode === 'beginner' && (
        <div className="space-y-8">
          {/* 源到汇 */}
          <section className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch size={20} className="text-brand-400" />
              <h3 className="text-lg font-semibold text-white">什么是「源到汇」分析？</h3>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 space-y-4 text-sm">
              <p>
                想象一下，程序就像一条水管网络。<strong className="text-white">「源」（Source）</strong>
                是污水流进来的地方——也就是用户输入、网络数据、文件读取这些外部数据进入程序的点。
                <strong className="text-white">「汇」（Sink）</strong>
                则是危险的地点——比如可能发生溢出的缓冲区、可能执行任意代码的函数。
              </p>
              <p>
                源到汇分析的任务就是：找出从「源」到「汇」的所有可能路径。
                如果存在一条路径，那么攻击者就有可能通过精心构造的输入，
                让恶意数据从源流向汇，从而触发漏洞。
              </p>
              <div className="bg-bg-soft/50 border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-400 font-bold text-sm">源</span>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-orange font-bold text-sm">途</span>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-red font-bold text-sm">汇</span>
                  </div>
                  <div className="flex-1 text-sm text-gray-400 ml-4">
                    用户输入 → 中间处理 → 危险函数调用
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 可达性分析 */}
          <section className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-accent-green" />
              <h3 className="text-lg font-semibold text-white">什么是可达性分析？</h3>
            </div>
            <div className="text-gray-300 space-y-4 text-sm">
              <p>
                可达性分析回答一个简单但关键的问题：
                <strong className="text-white">「从程序入口出发，到底能不能走到这个漏洞点？」</strong>
              </p>
              <p>
                有时候静态分析会标记一个函数有漏洞，但这个函数可能根本不会被调用到，
                或者调用它之前有严格的条件检查，使得攻击者无法满足。
                这样的「漏洞」虽然存在于代码中，但实际上是不可利用的。
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-accent-green/5 border border-accent-green/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-accent-green" />
                    <span className="font-semibold text-accent-green text-sm">可达漏洞</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    存在至少一条执行路径可以到达漏洞点，且攻击者有可能构造出满足条件的输入。
                    这是真正需要修复的安全问题。
                  </p>
                </div>
                <div className="bg-gray-500/5 border border-gray-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={18} className="text-gray-500" />
                    <span className="font-semibold text-gray-400 text-sm">不可达漏洞</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    漏洞代码存在但无法通过任何输入触发。可能是死代码、被严格条件保护、
                    或只在调试模式下编译。通常被归类为误报。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 为什么需要确认 */}
          <section className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-accent-orange" />
              <h3 className="text-lg font-semibold text-white">为什么需要确认漏洞可达？</h3>
            </div>
            <div className="text-gray-300 space-y-3 text-sm">
              <ul className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="text-accent-orange font-bold flex-shrink-0">01</span>
                  <div>
                    <strong className="text-white">减少误报</strong>
                    <p className="text-gray-400 text-xs mt-1">
                      静态分析工具往往报告大量可疑点，但其中很多是不可达的假阳性。
                      可达性分析帮我们过滤掉噪音，聚焦真正的威胁。
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-orange font-bold flex-shrink-0">02</span>
                  <div>
                    <strong className="text-white">评估威胁等级</strong>
                    <p className="text-gray-400 text-xs mt-1">
                      可达的漏洞才有被利用的可能。确认可达性是漏洞评级和修复优先级的重要依据。
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-orange font-bold flex-shrink-0">03</span>
                  <div>
                    <strong className="text-white">指导漏洞利用</strong>
                    <p className="text-gray-400 text-xs mt-1">
                      知道了哪条路径可达，就能知道攻击者需要满足哪些条件，
                      这对构造 PoC（概念验证）和评估利用难度至关重要。
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* 进阶模式内容 */}
      {mode === 'advanced' && (
        <div className="space-y-6">
          {/* 符号执行 */}
          <section className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-accent-purple" />
              <h3 className="text-lg font-semibold text-white">符号执行基础</h3>
            </div>
            <div className="text-gray-300 space-y-4 text-sm">
              <p>
                符号执行（Symbolic Execution）是一种程序分析技术，它不使用具体数值作为输入，
                而是使用<strong className="text-white">符号值</strong>（如 x, y）来表示输入。
                程序执行时，所有计算结果都以符号表达式的形式表示。
              </p>
              <p>
                当遇到分支语句时，符号执行器会<strong className="text-white">同时探索两个分支</strong>，
                并为每个分支积累一个「路径约束」（path constraint）。
                到达漏洞点后，将路径约束交给 SMT 求解器（如 Z3）判断是否可满足。
                如果可满足，说明存在具体输入可以触发该漏洞。
              </p>
              <CodeBlock
                language="c"
                title="符号执行示例：路径约束积累"
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

          {/* 信息卡片网格 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 静态分析误报 */}
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={18} className="text-accent-orange" />
                <h4 className="font-semibold text-white">静态分析为什么有误报？</h4>
              </div>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex gap-2">
                  <span className="text-accent-orange">•</span>
                  <span><strong className="text-gray-300">不精确的指针分析</strong>：无法确定指针具体指向哪个对象</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-orange">•</span>
                  <span><strong className="text-gray-300">忽略路径条件</strong>：有些工具只做流不敏感分析</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-orange">•</span>
                  <span><strong className="text-gray-300">过程间分析简化</strong>：函数调用上下文处理不精确</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-orange">•</span>
                  <span><strong className="text-gray-300">环境建模缺失</strong>：系统调用、外部库行为不确定</span>
                </li>
              </ul>
            </div>

            {/* 路径爆炸 */}
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={18} className="text-accent-red" />
                <h4 className="font-semibold text-white">路径爆炸问题（Path Explosion）</h4>
              </div>
              <div className="text-sm text-gray-400 space-y-2">
                <p>
                  程序中的分支数量呈指数增长。一个简单的循环执行 n 次就可能产生
                  2<sup>n</sup> 条路径。对于真实世界的程序，完整的符号执行几乎不可能。
                </p>
                <div className="bg-bg-soft rounded-lg p-3 mt-3">
                  <p className="text-xs text-gray-400">
                    <strong className="text-gray-300">常见缓解策略：</strong>
                  </p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    <li>• 搜索策略优化（DFS / BFS / 随机 / 覆盖率引导）</li>
                    <li>• 路径合并（Path Merging）</li>
                    <li>• 增量求解（Incremental Solving）</li>
                    <li>• 下近似（Under-approximation）</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 欠约束符号执行 */}
            <div className="bg-bg-card border border-border rounded-2xl p-6 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-accent-cyan" />
                <h4 className="font-semibold text-white">欠约束符号执行（Under-constrained SE）</h4>
              </div>
              <div className="text-sm text-gray-400 space-y-3">
                <p>
                  传统符号执行从程序入口（如 main）开始，但这要求构造完整的执行环境。
                  <strong className="text-white">欠约束符号执行</strong>
                  则直接从感兴趣的函数开始，将函数参数和全局变量都设为符号值。
                </p>
                <p>
                  这种方法可以快速深入单个函数，但可能产生误报——
                  因为它忽略了调用者可能施加的约束。例如，函数内部假设指针非空，
                  但欠约束执行可能让指针为 NULL，从而报告一个不存在的空指针解引用。
                </p>
                <div className="bg-bg-soft rounded-lg p-3 flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-accent-green mb-1">优点</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• 速度快，可直接聚焦目标函数</li>
                      <li>• 无需构建完整程序环境</li>
                      <li>• 适合单个函数的深度分析</li>
                    </ul>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-accent-red mb-1">缺点</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• 可能产生误报（忽略调用上下文）</li>
                      <li>• 需要额外验证结果真实性</li>
                      <li>• 跨函数数据流分析不完整</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Link
          href="/learn/step2"
          className="flex items-center gap-2 px-5 py-2.5 bg-bg-card border border-border rounded-xl text-gray-300 hover:bg-bg-hover hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
          上一步：静态分析
        </Link>
        <Link
          href="/learn/step4"
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all font-medium"
        >
          下一步：防护策略
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
