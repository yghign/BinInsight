/**
 * 方法论卡数据（架构 07 §2.2）—— 批 0 只落 M01（三条铁律）。
 * M02~M09 按 PRD §6.1 在后续批次追加到本文件，不改架构。
 * 方法论卡无 hazard（不是漏洞）；可互链；来源均为演示样例。
 */

import type { MethodCard } from './types';

const m01ThreeLaws: MethodCard = {
  kind: 'method',
  id: 'm01-three-laws',
  code: 'M01',
  title: '三条铁律：比背名字更重要',
  theme: '通用方法',
  difficulty: 'beginner',
  oneLiner:
    '漏洞的本质是信任边界被穿越；一切外部输入都不可信（Source → Sink）；单点漏洞价值有限，漏洞链才是杀伤力。',
  body: [
    '【铁律一：漏洞的本质是「信任边界被穿越」】程序默认信任了不该信任的东西。主线里是「信任了一段输入，结果它比盒子长」；到了 Web 世界，可能是「信任了 URL 里的 id，结果它指向别人的订单」「信任了请求头里的 Host，结果它拼进了邮件链接」。找漏洞 = 找「哪里把不可信当成了可信」。',
    '',
    '【铁律二：一切外部输入都不可信（Source → Sink）】',
    '· Source（输入源）举例：URL 参数、表单、Header、Cookie、文件名、上传内容、第三方回调、消息队列，甚至数据库里的历史脏数据。',
    '· Sink（危险汇聚点）举例：SQL 执行、系统命令、文件读写、反序列化、模板渲染、发起 HTTP 请求、重定向、写日志。',
    '· 漏洞 = 两者之间那条没被好好检查的通路。',
    '· 和主线的对应：L2 的「先找 call、再看名字」就是在找最小版的 Sink；L4 的「两道关」就是在 Source 和 Sink 之间加检查。',
    '',
    '【铁律三：单点漏洞价值有限，漏洞链才是杀伤力】一个信息泄露本身可能只算「低危」，但它给出的数据库口令可以打开 SQL 注入，SQL 注入又可能读到管理员 token，token 又能进后台——这就是漏洞链。评估一个漏洞时要问：它能把我送到哪一步？',
    '',
    '【概要】漏洞 = 一条从「不可信的输入」到「危险的操作」之间、没有被好好检查的通路（Source → Sink 模型）。',
  ].join('\n'),
  terms: ['source', 'sink', 'trust-boundary', 'source-sink', 'deserialization'],
  pinyin: {
    full: 'san tiao tie lv',
    joined: 'santiaotielv',
    initial: 'sttl',
  },
  related: ['ch0-framework', 'sql-injection', 'command-injection'],
  source: 'demo',
  nonMandatoryNote:
    '参考顺序，非强制。',
};

export const METHOD_CARDS: MethodCard[] = [m01ThreeLaws];
export default METHOD_CARDS;
