/** 形态 A 详情：8 段知识卡 + 固定 3 题（架构 07 §3.2）。 */
import type { CardEntry } from '@/data/library/types';
import KnowledgeCard8Sections from './KnowledgeCard8Sections';
import MicroQuizCard from './MicroQuizCard';

export default function EntryDetailCard({ entry }: { entry: CardEntry }) {
  return (
    <div className="space-y-10">
      <KnowledgeCard8Sections entry={entry} />

      <div>
        <p className="u-eyebrow mb-4">读完了？做 3 题巩固（点错有解释）</p>
        <div className="grid gap-4">
          {entry.quiz.map((quiz, i) => (
            <MicroQuizCard key={i} quiz={quiz} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
