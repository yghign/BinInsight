import clsx from 'clsx';

/**
 * 温暖泡泡装饰层 —— 纯服务端组件，无 hook。
 * 位置与动画参数由确定性伪随机生成（基于索引），
 * 因此 SSR 输出稳定、不会发生 hydration 不一致。
 * 动画遵循 prefers-reduced-motion（见 globals.css）。
 */

const PALETTE = [
  'var(--brand-500)',
  'var(--accent-cyan)',
  'var(--accent-purple)',
  'var(--accent-orange)',
  'var(--accent-green)',
];

/** 确定性伪随机：同一 seed 永远得到同一 [0,1) 结果 */
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface BubblesProps {
  /** 泡泡数量，默认 12 */
  count?: number;
  className?: string;
}

export default function Bubbles({ count = 12, className }: BubblesProps) {
  const bubbles = Array.from({ length: count }, (_, i) => {
    const size = 26 + Math.round(seeded(i + 1) * 90); // 26–116px
    const left = Math.round(seeded(i + 101) * 94); // 0–94%
    const top = Math.round(seeded(i + 202) * 88); // 0–88%
    const duration = 11 + Math.round(seeded(i + 303) * 14); // 11–25s
    const delay = -Math.round(seeded(i + 404) * 20); // 负延迟让初始位置错开
    const dx = Math.round((seeded(i + 505) - 0.5) * 44); // -22–22px
    const dy = -(14 + Math.round(seeded(i + 606) * 30)); // 向上飘 14–44px
    const opacity = 0.45 + seeded(i + 707) * 0.4; // 0.45–0.85
    const color = PALETTE[i % PALETTE.length];

    return {
      key: i,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        top: `${top}%`,
        '--bubble-color': color,
        '--bubble-duration': `${duration}s`,
        '--bubble-delay': `${delay}s`,
        '--bubble-dx': `${dx}px`,
        '--bubble-dy': `${dy}px`,
        '--bubble-opacity': opacity,
      } as React.CSSProperties,
    };
  });

  return (
    <div className={clsx('bubbles', className)} aria-hidden="true">
      {bubbles.map((b) => (
        <span key={b.key} className="bubble" style={b.style} />
      ))}
    </div>
  );
}
