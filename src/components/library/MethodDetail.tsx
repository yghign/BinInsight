/** 方法论卡详情（服务端，架构 07 §3.2）：M01 三条铁律；含 nonMandatoryNote。 */
import TermButton from '@/components/TermButton';
import type { MethodCard } from '@/data/library/types';

export default function MethodDetail({ card }: { card: MethodCard }) {
  return (
    <div className="space-y-7">
      {card.nonMandatoryNote && (
        <p className="text-[12.5px] text-[var(--text-soft)] border-l-2 border-[var(--brand-500)] pl-3">
          {card.nonMandatoryNote}
        </p>
      )}

      <div>
        <p className="u-eyebrow mb-2">概述</p>
        <p className="text-[15px] text-[var(--text)] leading-relaxed">{card.oneLiner}</p>
      </div>

      <div>
        <p className="u-eyebrow mb-2">正文</p>
        <div className="space-y-3 text-[14px] text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
          {card.body.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00a0'}</p>
          ))}
        </div>
      </div>

      {card.terms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="u-eyebrow !mb-0 mr-1">本卡术语</span>
          {card.terms.map((id) => <TermButton key={id} termId={id} />)}
        </div>
      )}
    </div>
  );
}
