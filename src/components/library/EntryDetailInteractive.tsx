/** 形态 B 详情：8 段 + 案例演示 + 指导模式；stages 空则不显示闯关入口（批 0 不实现闯关）。 */
import type { InteractiveEntry } from '@/data/library/types';
import KnowledgeCard8Sections from './KnowledgeCard8Sections';
import CaseDemoBlock from './CaseDemoBlock';
import GuideBlock from './GuideBlock';

export default function EntryDetailInteractive({ entry }: { entry: InteractiveEntry }) {
  return (
    <div className="space-y-7">
      <KnowledgeCard8Sections entry={entry} />
      <CaseDemoBlock demo={entry.caseDemo} />
      <GuideBlock guide={entry.guide} defaultOn={entry.guideDefaultOn} />
      {/*
        批 0 不实现闯关：entry.stages 为空 / 缺省，故不渲染闯关入口。
        第二期补 stages 后，在此按 SandboxStage 结构接入（届时需做主线回归）。
      */}
    </div>
  );
}
