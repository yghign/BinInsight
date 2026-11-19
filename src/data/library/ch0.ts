/**
 * 第 0 章 · 漏洞分类框架（沙箱开篇）—— 形态 A：一张知识卡 + 3 题。
 * 内容逐字取自 docs/06 §7（v1.3）；所有材料均为「演示样例」，非现场运行、非真实系统。
 * 本章是「第一次来？」软引导目标：学会认信任边界，比背名字有用。
 */

import type { CardEntry } from './types';

const frameworkCard: CardEntry = {
  id: 'ch0-framework',
  kind: 'vuln',
  chapter: 0,
  title: '漏洞分类框架：先认信任边界',
  hazard: 1,
  difficulty: 'beginner',
  scene: ['通用'],
  aliases: ['信任边界', '框架', '坐标系', 'Source Sink', '分类框架', '零基础起步'],
  oneLiner:
    '漏洞的命名繁多，但「信任边界」是统一坐标：漏洞是从不可信输入到危险操作之间、未被充分校验的通路（Source → Sink 模型）。',
  cause:
    '程序默认信任了不该信任的东西。主线里是「信任了一段输入，结果它比盒子长」；到了 Web 世界，可能是「信任了 URL 里的 id，结果它指向别人的订单」「信任了请求头里的 Host，结果它拼进了邮件链接」。找漏洞 = 找「哪里把不可信当成了可信」。',
  where:
    '主线 L0 说明「程序读取输入并写入固定长度的缓冲区」，L1 说明「输入超过缓冲区长度即溢出」，L2 说明「先定位 call，再识别其中的 strcpy」。本章将这三点抽象为通用术语：外部输入 → Source（输入源）；不检查长度的 strcpy → 危险汇聚点 / Sink；输入进入指令位 → 信任边界被穿越。Sink 不限于 strcpy，还包含 SQL 执行、命令执行、文件读写、模板渲染、发起请求。',
  kinds: [
    {
      name: '按成因',
      plain: '这是谁的责任？（设计 / 写代码 / 配环境 / 运维 / 第三方组件）——决定「该谁改」。',
      signal: 'SQL 注入是写代码的问题；默认口令是配置问题。',
    },
    {
      name: '按位置',
      plain: '它发生在哪一层？（客户端 → 传输 → 服务端 → 数据 → 主机 → 网络 → 云 → 供应链）——决定「去哪找」。',
      signal: 'XSS 在浏览器；命令注入在服务器。',
    },
    {
      name: '按触发前提',
      plain: '要什么条件才能利用？（无需登录 / 低权限 / 需要受害者点一下 / 需要在机器上操作）——决定「有多急」。',
      signal: '无需认证的漏洞最危险。',
    },
    {
      name: '按影响',
      plain: '破坏了什么？（机密性 / 完整性 / 可用性；影响一个人还是一个系统）——决定「值多少」。',
      signal: '读到一个人的手机号 vs 拖走全站用户表。',
    },
    {
      name: '按行业标准',
      plain: '业界怎么称呼它？（OWASP、CWE、CVE、CVSS）——决定「怎么沟通」。',
      signal: '报告里写 CWE-89 比写「那个引号洞」专业。',
    },
  ],
  signals: [
    '程序把「不可信的数据」放到了「可信的指令 / 命令 / 查询条件」的位置——数据该待在数据位，却被当成指令解析。',
    '在 Source 与 Sink 之间找不到「好好检查」的动作（没有参数化 / 白名单 / 类型校验）。',
    '一个低危信息泄露 + 一个注入，能串成一条打穿系统的漏洞链（铁律三）。',
  ],
  impact:
    '单点漏洞价值有限，漏洞链才是杀伤力：一个信息泄露给出数据库口令 → 打开 SQL 注入 → 读到管理员 token → 进后台。评估一个漏洞时要问：它能把我送到哪一步？',
  verify: [
    '先找 Source：网址参数、表单、Header、Cookie、文件名、上传内容、第三方回调、消息队列，甚至数据库里的历史脏数据。',
    '再找 Sink：SQL 执行、系统命令、文件读写、反序列化、模板渲染、发起 HTTP 请求、重定向、写日志。',
    '看两者之间那条通路有没有被好好检查——L2 的「先找 call、再看名字」就是最小版的 Sink；L4 的「两道关」就是在通路中间加检查。',
  ],
  protect: {
    root: '一切外部输入都不可信：让数据永远待在数据位（参数化 / 白名单），别让输入流到指令位。',
    harden: '单点漏洞按「漏洞链」评估：堵住能把你送往下一步的那一环，别只盯当前危害星级。',
    fallback: '编号（OWASP / CWE / CVE / CVSS）只作知识锚点，用于沟通，不要求背。',
  },
  mistakes: [
    '以为危险度★高的就更难学——★回答「被利用有多惨」，难度档回答「零基础学会要迈多高台阶」，两者不能互相推导。',
    '以为过滤几个危险词就安全——黑名单永远在追新写法，根治是数据与指令分离。',
    '把「看起来安全」的地方漏掉：后台、旧接口、报表、ORM 原生 SQL 都是高发区。',
  ],
  quiz: [
    {
      kind: 'identify',
      material:
        '某登录接口把用户输入的用户名直接拼进一条数据库查询语句；另一个系统把用户输入的文件名直接拼进一条压缩命令。',
      question: '这两个场景的共同点是什么？',
      options: [
        {
          text: '都是把「用户数据」放到了「指令/命令」的位置',
          correct: true,
          explain:
            '正确。这就是信任边界被穿越——数据本该待在数据位，结果被当成指令解析。前者是 SQL 注入，后者是命令注入，本质同一条。',
        },
        {
          text: '都一定会导致服务器被完全控制',
          correct: false,
          explain:
            '错误。危害取决于数据库/命令的权限，不能一概而论；但「本质相同」这个判断是对的。',
        },
        {
          text: '都是因为没用 HTTPS',
          correct: false,
          explain:
            '错误。HTTPS 保护传输过程，不阻止应用把输入拼进指令。这是两件不同的事。',
        },
        {
          text: '都只影响当前用户自己',
          correct: false,
          explain:
            '错误。影响范围取决于系统怎么用这些数据，常见情况是能读到别人的数据。',
        },
      ],
    },
    {
      kind: 'protect',
      material:
        '开发说「我在输入框里过滤了 `union`、`;`、`\'` 等，把危险词都挡住了，肯定安全」。',
      question: '按第 0 章的思路，这个防法的根本问题在哪？',
      options: [
        {
          text: '它在「输入黑名单」上打转，没做到「数据与指令分离」',
          correct: true,
          explain:
            '正确。根治是让数据永远待在数据位（参数化/白名单），黑名单永远在追新写法，追不完。对应注入类四层防护的第一层「分离」。',
        },
        {
          text: '过滤的词还不够多',
          correct: false,
          explain: '错误。加再多词也是在打补丁，不是根治。',
        },
        {
          text: '应该改 HTTPS',
          correct: false,
          explain: '错误。HTTPS 保护传输，不解决输入被当指令。',
        },
        {
          text: '没问题，过滤就够了',
          correct: false,
          explain: '错误。这是把「减少攻击面」误当成「阻断执行」。',
        },
      ],
    },
    {
      kind: 'mistake',
      material:
        '某漏洞危险度 ★★★★★，但概念只要一句「把输入当命令」；另一漏洞危险度 ★★☆☆☆，但要理解一套业务流程才能发现。',
      question: '按本站口径，哪个更适合零基础先学？',
      options: [
        {
          text: '第一个 —— 危险度高不代表学习难度高',
          correct: true,
          explain:
            '正确。危险度和难度是两个维度；第一个概念简单、信号直观，适合入门，虽然它一旦被利用很严重。',
        },
        {
          text: '第二个 —— 危险度低更安全，先学它',
          correct: false,
          explain:
            '错误。危险度低只是危害小，不代表好学会；「先学危害小的」不是本站的分档逻辑。',
        },
        {
          text: '都先别学，先看完全部 16 章',
          correct: false,
          explain: '错误。本库无顺序、无门槛，按兴趣选即可。',
        },
        {
          text: '先看 ★ 数量决定',
          correct: false,
          explain: '错误。★不参与难度筛选，它只是右上角的小提醒。',
        },
      ],
    },
  ],
  terms: [
    'source',
    'sink',
    'trust-boundary',
    'source-sink',
    'owasp',
    'cwe',
    'cve',
    'cvss',
    'deserialization',
  ],
  relatedTerms: ['source', 'sink', 'trust-boundary', 'source-sink'],
  pinyin: {
    full: 'lou dong fen lei kuang jia',
    joined: 'loudongfenleikuangjia',
    initial: 'ldflkj',
  },
  related: ['sql-injection', 'command-injection', 'm01-three-laws'],
  source: 'demo',
  format: 'card',
};

export const ch0Entries: CardEntry[] = [frameworkCard];
export default ch0Entries;
