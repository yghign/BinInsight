/** 报告错误链接（架构 07 §3.2 / PRD §2.10）：mailto 预填四字段，静态站无后端。 */
import type { LibraryItem } from '@/data/library/types';

export default function ReportErrorLink({ item }: { item: LibraryItem }) {
  const subject = encodeURIComponent(`[BinInsight 学习库] 报告错误：${item.title}`);
  const body = encodeURIComponent(
    [
      '错误位置：（哪一节 / 哪一段）',
      '错误内容：（写成什么了）',
      '建议改法：（你建议怎么改）',
      '你的身份（可选）：（学生 / 老师 / 其他）',
      '',
      `条目 id：${item.id}`,
      '本站是静态页面，不收集、不存储你的信息；点击会打开你的邮件客户端。',
    ].join('\n')
  );
  const href = `mailto:bininsight-coursework@example.invalid?subject=${subject}&body=${body}`;

  return (
    <div className="border-t border-[var(--border)] pt-5 mt-2">
      <a href={href} className="u-link text-[13px]">发现错误？报告一下（外部渠道）→</a>
      <p className="text-[11.5px] text-[var(--text-soft)] mt-1.5">
        点击会打开邮件客户端；本站是静态页面，不收集、不存储你的信息。
      </p>
    </div>
  );
}
