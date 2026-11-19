/** 8 段知识卡正文（架构 07 §3.2）：形态 A / B 复用同一组件。
 * 高频词用 TermButton 挂浮层、低频词 inline 白话（此处正文已含 inline 解释）。
 */
import TermButton from '@/components/TermButton';
import type { LearningEntry } from '@/data/library/types';

/** 判断一个词是否是已收录的高频术语 id（渲染 TermButton 用）。 */
const HIGH_FREQ = new Set([
  'source', 'sink', 'trust-boundary', 'source-sink', 'sql', 'sql-injection',
  'parameterized-query', 'orm', 'blind-injection', 'union-injection', 'nosql',
  'command-injection', 'oob', 'allowlist', 'ssti', 'template-engine', 'rce',
  'code-injection', 'spel', 'dsl', 'ldap', 'xpath', 'rfc4515', 'hql',
  'query-builder', 'identifier-whitelist', 'crlf', 'http-header',
  'response-splitting', 'log-injection', 'ansi-escape', 'structured-logging',
  'waf', 'webshell', 'owasp', 'cwe', 'cve', 'cvss', 'deserialization',
]);

/** 正文里出现的高频词挂 TermButton：按 id 精确替换为按钮，不改动其它文字。 */
function withTerms(text: string, terms: string[]) {
  const active = terms.filter((t) => HIGH_FREQ.has(t));
  if (active.length === 0) return <>{text}</>;
  // 长词优先，避免短词先替换破坏长词
  const sorted = [...active].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        sorted.includes(part) ? (
          <TermButton key={`${part}-${i}`} termId={part}>{part}</TermButton>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function KnowledgeCard8Sections({ entry }: { entry: LearningEntry }) {
  return (
    <div className="space-y-7">
      <section>
        <p className="u-eyebrow mb-2">概述</p>
        <p className="text-[15px] text-[var(--text)] leading-relaxed">{withTerms(entry.oneLiner, entry.terms)}</p>
      </section>

      <section>
        <p className="u-eyebrow mb-2">成因</p>
        <p className="text-[14px] text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">{withTerms(entry.cause, entry.terms)}</p>
      </section>

      <section>
        <p className="u-eyebrow mb-2">常出问题的位置</p>
        <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">{withTerms(entry.where, entry.terms)}</p>
      </section>

      {entry.kinds && entry.kinds.length > 0 && (
        <section>
          <p className="u-eyebrow mb-3">分类</p>
          <div className="u-panel overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-soft)]">
                  <th className="px-4 py-2.5 font-medium">类型</th>
                  <th className="px-4 py-2.5 font-medium">白话</th>
                  <th className="px-4 py-2.5 font-medium">信号</th>
                </tr>
              </thead>
              <tbody>
                {entry.kinds.map((k) => (
                  <tr key={k.name} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-4 py-2.5 text-[var(--text)]">{k.name}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)]">{k.plain}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)]">{k.signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <p className="u-eyebrow mb-2">典型特征 · 怎么发现</p>
        <ul className="space-y-2 text-[14px] text-[var(--text-muted)] leading-relaxed">
          {entry.signals.map((s, i) => <li key={i}>· {withTerms(s, entry.terms)}</li>)}
        </ul>
      </section>

      <section>
        <p className="u-eyebrow mb-2">危害</p>
        <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">{withTerms(entry.impact, entry.terms)}</p>
      </section>

      <section>
        <p className="u-eyebrow mb-2">挖掘与验证思路</p>
        <ol className="space-y-2 text-[14px] text-[var(--text-muted)] leading-relaxed list-decimal list-inside">
          {entry.verify.map((v, i) => <li key={i}>{withTerms(v, entry.terms)}</li>)}
        </ol>
      </section>

      <section>
        <p className="u-eyebrow mb-2">防护（由根治到兜底）</p>
        <div className="space-y-2 text-[14px] text-[var(--text-muted)] leading-relaxed">
          <p><strong className="text-[var(--text)]">根治：</strong>{withTerms(entry.protect.root, entry.terms)}</p>
          <p><strong className="text-[var(--text)]">加固：</strong>{withTerms(entry.protect.harden, entry.terms)}</p>
          <p><strong className="text-[var(--text)]">兜底：</strong>{withTerms(entry.protect.fallback, entry.terms)}</p>
        </div>
      </section>

      <section>
        <p className="u-eyebrow mb-2">易错点</p>
        <ul className="space-y-2 text-[14px] text-[var(--text-muted)] leading-relaxed">
          {entry.mistakes.map((m, i) => <li key={i}>· {withTerms(m, entry.terms)}</li>)}
        </ul>
      </section>
    </div>
  );
}
