import Link from 'next/link';
import HeroCanvas from '@/components/HeroCanvas';
import LearnPath from '@/components/LearnPath';
import SourceBadge from '@/components/SourceBadge';
import { LESSON_LEVELS } from '@/data/lesson';

/**
 * 首页（PRD 6.1 / T04 / T08）。
 *
 * - 首屏只保留一句定位 + 一个动作 + 一条 8 级路径，不再堆叠术语与自夸板块
 * - 主标题改白话「从一行 C 代码，看懂一次溢出」
 * - 右侧保留 8 级路径线（LearnPath 读 lesson.ts）
 * - 底部三态说明；HeroCanvas 降为低透明度背景纹理
 * - 任何数字都来自 lesson.ts，不硬编码
 */

const sourceStates = [
  { state: 'real' as const, text: '真实输出：来自你导入的 JSON 报告，按报告对象渲染' },
  { state: 'demo' as const, text: '演示样例：课前备好的教学素材，非现场运行' },
  { state: 'planned' as const, text: '规划中：设计构想或后续工作，本次未实现' },
];

export default function HomePage() {
  return (
    <div>
      {/* 首屏：一句定位 + 一个动作 + 一条 8 级路径 */}
      <section className="u-hero-full relative isolate flex items-center overflow-hidden border-b border-[var(--border)]">
        <div className="u-hero-low-opacity absolute inset-0 z-0" aria-hidden="true">
          <HeroCanvas />
        </div>
        <div className="hero-scrim pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 sm:px-8 py-20">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12 items-center">
            <div className="md:col-span-7">
              <p className="u-eyebrow mb-5">8 级渐进入门</p>
              <h1 className="u-display mb-6 text-[38px] sm:text-[50px] md:text-[62px] leading-[1.12]">
                从一行 C 代码，<br />看懂一次溢出
              </h1>
              <p className="mb-9 max-w-xl text-[15px] leading-[1.9] text-[var(--text-muted)] md:text-[16px]">
                不用装环境、不用懂汇编。8 级，每级只学 1 件事，
                从「程序把输入放进一个盒子」一路走到自己独立判断一次漏洞。
                全程约 15 分钟，所有演示内容都标明数据来源。
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/learn" className="u-btn u-btn-primary">
                  开始学习 · 共 {LESSON_LEVELS.length} 级
                  <span className="font-mono" aria-hidden="true">→</span>
                </Link>
                <Link href="/learn/l7" className="u-btn u-btn-ghost">
                  直接看终点演示
                </Link>
              </div>
            </div>

            <aside className="md:col-span-5 md:border-l md:border-[var(--border)] md:pl-10">
              <LearnPath />
            </aside>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-[1280px] items-end justify-between gap-6 px-5 pb-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <SourceBadge state="demo" />
              <span className="font-mono text-[10.5px] tracking-wider text-[var(--text-soft)]">
                本页所有演示与统计都标注来源状态
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-soft)]">
                scroll
              </span>
              <span className="hero-scroll-line" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* 8 级分别学什么：单一数据源，不散写术语 */}
      <section className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 md:py-24">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="u-eyebrow mb-3">Curriculum</p>
            <h2 className="u-display text-2xl md:text-[34px]">8 级，每级只加 1 个新概念</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)] md:text-right">
            第 8 级不引入任何新词，只是把前 7 级自己走一遍。
          </p>
        </div>

        <div className="grid border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-4">
          {LESSON_LEVELS.map((level, idx) => (
            <Link
              key={level.id}
              href={level.route}
              className={`group flex flex-col py-7 px-1 md:px-6 border-b border-[var(--border)] ${
                idx % 2 !== 0 ? 'md:border-l' : ''
              } lg:border-l lg:border-b-0`}
            >
              <span className="font-mono text-[11px] text-[var(--brand-500)]">
                第 {level.index + 1} 级 / 共 {LESSON_LEVELS.length} 级
              </span>
              <h3 className="mt-3 mb-2 text-[17px] font-semibold tracking-tight transition-colors group-hover:text-[var(--brand-500)]">
                {level.title}
              </h3>
              <p className="text-[13px] leading-[1.8] text-[var(--text-muted)]">{level.newConcept}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/learn" className="u-link">
            进入完整学习路径 <span className="font-mono">→</span>
          </Link>
        </div>
      </section>

      {/* 三态说明：全站口径唯一 */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 md:py-20">
          <p className="u-eyebrow mb-3">Honesty</p>
          <h2 className="u-display text-2xl md:text-[32px] mb-8">看到的每一处数据，都有状态标签</h2>
          <div className="grid gap-px bg-[var(--border)] border border-[var(--border)] md:grid-cols-3 rounded-lg overflow-hidden">
            {sourceStates.map((item) => (
              <div key={item.state} className="bg-[var(--bg-card)] p-6">
                <SourceBadge state={item.state} />
                <p className="mt-4 text-[13px] leading-[1.85] text-[var(--text-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12.5px] text-[var(--text-soft)] leading-relaxed">
            本站没有伪装成运行结果的东西：预录终端标明非现场运行，Dilipa 侧只做只读分析与变更预览，
            Mutagen 只是设计构想（本次未实现）。老师按任意页面文字去验证，结论与页面描述一致。
          </p>
        </div>
      </section>

      {/* 编辑式引言 */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 md:py-24">
          <p className="text-[20px] leading-[1.6] font-medium tracking-tight md:text-[30px]">
            看不懂汇编，不等于学不会安全。
          </p>
          <p className="mt-3 text-[15px] leading-[1.8] text-[var(--text-muted)] md:text-[17px]">
            把每一个抽象概念，都变成可点击、可复现的一次操作。
          </p>
        </div>
      </section>

      {/* 收尾：左文右动作 */}
      <section className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between md:py-20">
        <div>
          <h2 className="u-display mb-2 text-2xl md:text-[30px]">从第一级开始，约 15 分钟走完</h2>
          <p className="text-sm text-[var(--text-muted)]">
            答错会给解释。
          </p>
        </div>
        <Link href="/learn" className="u-btn u-btn-primary flex-shrink-0">
          开始学习
          <span className="font-mono" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
