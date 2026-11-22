/**
 * 逻辑与业务流程 —— 8 条。内容逐字取自 docs/16 v2。
 * 低 1 条（limit-bypass）= 形态 A 知识卡 + 3 题；
 * 中 5（parameter-tampering/business-race/reward-abuse/approval-bypass/idempotency-missing）+ 高 2（workflow-bypass/payment-logic）= 形态 B 案例演示 + 指导。
 * templateId：TPL-CHAIN×4 + TPL-AUTHZ×1（approval-bypass）+ 不挂×2（reward-abuse/idempotency-missing）；
 * limit-bypass 为低档 card，本形态不带 templateId（文档标注「若升级交互挂 TPL-AUTHZ」，留待二期）。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, CardEntry, InteractiveEntry } from './types';

const parameterTampering: InteractiveEntry = {
  id: 'parameter-tampering',
  kind: 'vuln',
  chapter: 7,
  title: '价格与数量篡改',
  hazard: 5,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['价格篡改', '数量篡改', '金额篡改', '参数篡改'],
  oneLiner:
    '服务端信任客户端提交的价格、数量、折扣等字段时，改一个数字就能低价购买，数量改负数还能套现。',
  cause:
    '下单/结算接口把请求体里的 price、amount、total、discount、freight 直接采信进订单。为什么改个数字就能改结果：价格本该是服务端按商品与规则算出来的结论，不是客户端报上来的选项——把结论的位置让给了客户端，客户端写什么就是什么。出问题的位置：一切「客户端上报数值、服务端直接用」的接口。',
  where:
    '下单/结算请求体（price、amount、total、discount、freight 字段）、批量改价接口、运费/优惠计算参数。',
  kinds: [
    { name: '价格篡改', plain: '报低价直接成交', signal: '改 price/total 后订单金额异常' },
    { name: '数量篡改', plain: '数量为负倒扣钱', signal: 'quantity=-1 总价变负（余额增加）' },
    { name: '折扣/运费篡改', plain: '改折扣率或运费', signal: 'discount/freight 字段可提交' },
    { name: '数值形态绕过', plain: '换数值写法过校验', signal: '0.01、1e-10、科学计数法、超大值' },
  ],
  signals: [
    '请求体里有 price、amount、total、discount、freight 字段。',
    '改成 0、-1、0.01、超大值、科学计数法 1e-10 后订单金额异常。',
    '数量改成负数，总价变负（余额增加）。',
    '前端显示与后端计算不一致（只改前端不算，要改请求）。',
  ],
  impact: '低价/零元购；负数数量套现（余额增加）；批量薅差价；财务对账失衡。',
  verify: [
    '抓下单/结算请求，列出全部数值字段（钱、量、折扣、运费）。',
    '逐字段改值（0/负数/极小值/科学计数法/超大值）重放，核对订单金额（演示样例，测试环境）。',
    '注意只改请求不改前端（改前端不算）；核对前端显示与后端计算是否一致。',
    '关注数量为负时总价方向（加钱还是扣钱）。',
  ],
  protect: {
    root: '价格、折扣、运费全部由服务端根据商品与规则计算，客户端只传商品 ID 与数量；数量做范围校验（正整数、上限）。',
    harden: '金额用整数分存储（不走浮点，呼应数据解析主题的精度教训）；最终金额二次校验；订单快照（下单时价格定格）。',
    fallback: '异常金额告警；对账脚本核差。',
  },
  mistakes: [
    '只校验前端不校验服务端（抓包改请求即绕）。',
    '只测 price 不测数量/折扣/运费（四类字段都算钱）。',
    '数量没做正整数与上限校验（负数=套现）。',
    '金额走浮点（精度丢失，联动数据解析主题精度变体）。',
  ],
  terms: ['parameter-tampering', 'business-logic', 'type-validation', 'allowlist'],
  relatedTerms: ['business-logic', 'type-validation'],
  pinyin: { full: 'can shu cuan gai', joined: 'canshucuangai', initial: 'cscg' },
  related: ['payment-logic', 'reward-abuse', 'permission-model'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的下单接口）：\n正常请求（演示样例）：\n  POST /api/order\n  { "productId": 1001, "quantity": 1, "price": 999, "discount": 0 }\n  → 服务端直接采信 price=999 入订单\n\n攻击请求（演示样例）：\n  POST /api/order\n  { "productId": 1001, "quantity": -1, "price": 0.01, "discount": 0 }\n  → 服务端同样直接采信 → 订单金额按 0.01 与 -1 计算，金额异常（演示样例）\n\n逻辑链自查（硬标准：字段名与数值形态与服务端读取处逐字符对上）：\n输入（请求体数值字段被篡改：price 999→0.01、quantity 1→-1）\n→ 机制（服务端直接采信客户端上报数值，无服务端计算与范围校验）\n→ 结果（订单金额异常，低价/套现成立）✔\n逐字符核对：字段名 price/quantity/discount 与服务端读取的键名逐字符一致 ✔\n           值 0.01 为数字形态（非字符串）、-1 为负整数，与解析后类型逐字符一致 ✔\n           服务端读取的是同名字段（若服务端只读 productId 则本构造不成立——自查确认读取面）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与数值为虚构，非现场运行、非真实系统。修法对照：服务端按 productId 查价计算（price 字段被忽略）+ 数量正整数范围校验（-1 被拒），两层任一到位即断链。',
    source: 'demo',
  },
  guide: {
    why: '盯「这个数值是客户端报的还是服务端算的」。钱的数量必须是服务端的结论，不能是客户端的输入——判断标准一句话：请求里能改到金额字段，就是本条。',
    how: '① 抓下单/结算请求列出全部数值字段；② 四类形态各试（0/负数/极小值/科学计数法）；③ 核对订单金额与前端显示；④ 修复按「服务端计算+范围校验+整数分+订单快照」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-701', summary: '价格/金额参数篡改实验（成因：服务端采信客户端上报数值；教训：服务端计算 + 范围校验）', lesson: '服务端计算 + 范围校验', source: 'PortSwigger Web Security Academy — Business logic 实验', credibility: '平台' },
  ],
};

const workflowBypass: InteractiveEntry = {
  id: 'workflow-bypass',
  kind: 'vuln',
  chapter: 7,
  title: '流程绕过（状态机缺陷）',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', 'API'],
  aliases: ['流程绕过', '状态机缺陷', '步骤跳过', '状态机绕过'],
  oneLiner:
    '服务端只按「当前请求」处理、不校验前置状态时，必要步骤（验证、支付、审核）可被跳过，直接到达终态。',
  cause:
    '业务流程有先后顺序（先验证、再支付、后完成），但服务端每接一个请求只看「这个请求本身合不合法」，不看「上一步做完没有」。为什么能跳步：流程顺序只画在流程图和前端页面上，服务端没站岗——「支付成功回调」接口不问订单付没付、「发布」接口不问审核过没过，谁来调都照办。状态机（复用机制词 state-machine：系统允许的状态与合法迁移的清单）的缺口就是：合法迁移没被写进代码，只写在纸上。',
  where: '支付回调接口、实名/审核后置步骤、订单状态参数（status=）、步骤参数（step=）、发布/提现等终态操作。',
  kinds: [
    { name: '步骤跳过', plain: '不做前置步骤直接到终态', signal: '直接请求「支付成功回调」置已支付' },
    { name: '状态参数篡改', plain: '改状态字段直达终态', signal: 'status=paid 直接提交' },
    { name: '步骤回退', plain: '回到已过步骤覆盖确认', signal: 'step=3 重新提交覆盖已确认信息' },
    { name: '前置条件缺失', plain: '关键前置没查', signal: '跳过实名直接下单/提现' },
  ],
  signals: [
    '直接请求「支付成功回调」接口即可把订单置为已支付。',
    '跳过实名认证直接下单/提现；跳过审核直接发布内容。',
    '修改订单状态参数（status=paid）生效。',
    '步骤参数可回退（step=3 重新提交覆盖已确认信息）。',
  ],
  impact: '未支付拿货（直接经济损失）；未实名提现（合规风险）；未审核内容上线；流程整体失控。',
  verify: [
    '画出完整业务流程图，列出每个状态与合法迁移。',
    '对每步问「能不能跳过」：直接请求后一步接口，看前置状态是否被校验。',
    '改状态/步骤参数（status、step）重放，看是否直达终态。',
    '测回退：回到上一步改已确认信息，看是否覆盖生效。',
  ],
  protect: {
    root: '服务端维护状态机（state-machine 本条新增），明确合法状态迁移（待支付 → 已支付 → 已发货），非法迁移一律拒绝；关键步骤完成状态存服务端（不靠前端参数）。',
    harden: '支付以支付网关异步通知 + 主动查询为准并校验签名（与 7.5 联动）；步骤回退需显式授权。',
    fallback: '状态迁移全量留痕；异常迁移告警。',
  },
  mistakes: [
    '只在前端按顺序展示步骤（服务端没站岗）。',
    '只校验「当前请求合法性」不校验「前置状态」。',
    '支付结果信回调不主动查询（与 7.5 联动）。',
    '状态参数由客户端提交（status=paid 直达终态）。',
  ],
  terms: ['state-machine', 'workflow-defect', 'type-validation'],
  relatedTerms: ['state-machine', 'workflow-defect'],
  pinyin: { full: 'liu cheng rao guo', joined: 'liuchengraoguo', initial: 'lcrg' },
  related: ['approval-bypass', 'payment-logic', 'authz-bypass-checklist'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的订单流程）：\n合法流程：待支付 →（支付）→ 已支付 →（发货）→ 已完成\n服务端逻辑（演示样例）：\n  POST /api/order/complete  { "orderId": 1001, "status": "done" }\n  → 按 status 参数置订单状态（不查当前状态是否允许该迁移）\n\n攻击步骤：\n1. 正常创建订单（状态：待支付），不支付\n2. 直接请求完成接口：POST /api/order/complete { "orderId": 1001, "status": "done" }\n   → 服务端不查「订单当前是不是已支付」，直接置为已完成\n3. 未支付的订单进入终态（跳过支付步骤）\n\n逻辑链自查（硬标准：接口路径/字段名/状态值与服务端读取处逐字符对上）：\n输入（带 status 参数的终态请求，前置步骤未完成）\n→ 机制（服务端只按当前请求处理，不校验前置状态——状态机的合法迁移未约束）\n→ 结果（跳过支付直达终态）✔\n逐字符核对：字段名 orderId/status 与服务端读取的键名逐字符一致 ✔\n           状态值 "done" 与状态机里的终态命名逐字符一致（写成 "complete" 就不命中）✔\n           接口路径 /api/order/complete 与真实路由逐字符一致 ✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与状态值为虚构，非现场运行、非真实系统。修法对照：服务端状态机只允许「已支付→已完成」（第 2 步请求因「待支付→done」非法迁移被拒）+ 支付以网关通知为准，跳步被堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「每一步之前，服务端查不查前置状态」。流程顺序必须由服务端说了算——状态机就是那张「允许怎么走」的清单，清单没写进代码，流程就是敞开的。技术绕过 vs 逻辑绕过（与访问控制主题授权绕过技巧的边界）：那是鉴权匹配规则被绕（敲门姿势变了），本条是流程本身没关（门与门之间没关）。',
    how: '① 画流程图列状态与合法迁移；② 每步测「跳过」（直接请求下一步）与「篡改」（改 status/step）；③ 测回退覆盖；④ 修复按「服务端状态机+完成状态服务端存+网关通知为准」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-702', summary: '业务流程跳步/状态机缺陷实验（成因：服务端不校验前置状态；教训：状态机约束合法迁移）', lesson: '状态机约束合法迁移', source: 'PortSwigger Web Security Academy — Business logic 实验', credibility: '平台' },
  ],
};

const businessRace: InteractiveEntry = {
  id: 'business-race',
  kind: 'vuln',
  chapter: 7,
  title: '竞态条件（业务面）',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['业务竞态', '并发竞态', '竞争条件（业务面）', '超额提现', '超卖'],
  oneLiner:
    '「检查余额→扣款」两步之间存在时间窗时，并发请求都能通过检查，导致超额提现、重复领券、库存超卖。',
  cause:
    '先查后改（查余额够不够→扣款）是两步操作，两步之间另一个请求也完成了检查——两个请求都以为钱够，都扣。为什么检查过还会超：检查和扣款不是一口气做的，中间的空隙里别人也过了检查——和文件主题 TOCTOU 同一个道理，只是「被调包的对象」从文件换成了余额/库存/券状态。高发位置：提现/支付（余额）、抢购（库存）、领券（券状态）、积分（额度）——一切「先查后改」处。',
  where: '提现/转账（余额）、下单扣库存、优惠券核销、积分扣减、抽奖次数。',
  kinds: [
    { name: '余额竞态', plain: '并发提现超额', signal: '余额 100 并发 10 笔提现成功多笔' },
    { name: '库存竞态', plain: '并发抢购超卖', signal: '库存 1 件卖出多件' },
    { name: '券/额度竞态', plain: '并发重复使用', signal: '同一券被并发多次核销' },
  ],
  signals: [
    '余额 100 元，同时发 10 个提现 100 的请求，成功多个。',
    '优惠券可被并发多次使用；库存 1 件卖出多件。',
  ],
  impact: '超额提现（直接资金损失）；超卖（履约损失）；券/积分被重复薅；对账混乱。',
  verify: [
    '用并发工具（如 Burp 的并发/Turbo Intruder）同一时间点发多个相同请求（演示样例，测试环境）。',
    '观察是否都成功；关注「先查后改」逻辑（余额、库存、额度、券状态）。',
    '对比串行执行（一个个来）与并发执行的结果差异。',
  ],
  protect: {
    root: '把「检查 + 更新」合并为一条原子 SQL（UPDATE … WHERE balance >= ?）；或数据库行锁（SELECT … FOR UPDATE）/乐观锁（版本号）。',
    harden: '唯一约束（幂等键，idempotency 本章后条）；分布式锁；关键操作幂等。',
    fallback: '超卖/超额告警；对账脚本核差。',
  },
  mistakes: [
    '只在应用层加锁（多实例/多进程下失效）。',
    '检查与更新分两条 SQL（中间窗口就是竞态）。',
    '以为「并发概率低」不处理（工具一发就是百十个）。',
    '用「再查一次」缓解（不原子，同 TOCTOU 教训）。',
  ],
  terms: ['business-race', 'idempotency', 'toctou', 'toctou-race'],
  relatedTerms: ['toctou', 'toctou-race', 'idempotency'],
  pinyin: { full: 'jing zheng tiao jian', joined: 'jingzhengtiaojian', initial: 'jztj' },
  related: ['toctou-race', 'idempotency-missing', 'payment-logic'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的提现接口）：\n服务端逻辑（演示样例，两步不原子）：\n  ① SELECT balance FROM account WHERE uid=1     → 100，检查「够提 100」\n  ② UPDATE account SET balance=balance-100 …    → 扣款\n\n攻击步骤（演示样例，并发两请求）：\n1. 请求 A 与请求 B 同时到达，都执行 ①：余额都是 100 → 检查都通过\n2. 都执行 ②：各扣 100 → 余额 -100，但提现出了 200\n\n逻辑链自查（硬标准：余额数值/请求参数与服务端读取处逐字符对上）：\n输入（两个并发提现 100 的请求）\n→ 机制（检查与扣款两步之间有时间窗，两请求都通过检查——先查后改不原子）\n→ 结果（余额 100 提出 200，超额成立）✔\n逐字符核对：提现金额 100 与余额 100 数值逐字符一致（100 vs 100.0 类型差异需核对）✔\n           uid=1 与账号标识逐字符一致 ✔\n           （若服务端用一条 UPDATE … WHERE balance>=100 原子执行，第 2 步只有一笔成功——修法对照）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与数值为虚构，非现场运行、非真实系统。修法对照：原子 SQL（第二笔因余额不足被拒）+ 幂等键，窗口不存在。',
    source: 'demo',
  },
  guide: {
    why: '盯「检查和更新是不是一口气做的」。两步之间的时间窗就是并发插队的缝隙——检查的结论只对「检查那一刻」负责，更新前必须让结论保鲜（原子化）。与文件主题临时文件竞态分工：机制在文件主题讲过（TOCTOU 时间窗），本条练的是业务面的「先查后改」四处（钱/库/券/额）。',
    how: '① 找所有「先查后改」逻辑；② 并发工具同时发多请求对比结果；③ 看 SQL 是否原子（WHERE balance>=? 形态）；④ 修复按「原子 SQL/行锁/乐观锁 + 幂等键」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-703', summary: '并发竞态条件实验（成因：先查后改时间窗；教训：原子 SQL + 行锁 + 幂等）', lesson: '原子 SQL + 行锁 + 幂等', source: 'PortSwigger Web Security Academy — Race conditions 实验', credibility: '平台' },
  ],
};

const rewardAbuse: InteractiveEntry = {
  id: 'reward-abuse',
  kind: 'vuln',
  chapter: 7,
  title: '优惠券 / 积分 / 邀请滥用',
  hazard: 3,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['优惠券滥用', '积分滥用', '邀请滥用', '薅羊毛', '券规则绕过'],
  oneLiner:
    '券/积分/邀请的规则写了「每人一张」「不可叠加」「过期作废」，但规则没在领用处强制时，批量注册、重复使用、退款回刷都能薅。',
  cause:
    '营销规则声明在活动页（每人限领一张、券不可叠加、过期作废），但领用接口没强制——规则是声明，不是锁。为什么券会被薅：规则写在页面上给人看，接口没在「发券/核销」那一刻校验（谁领过、用过没有、过没过期、退没退款）——声明与强制是两回事，和「前端隐藏不算防护」同一教训的业务版。',
  where: '领券接口、核销接口、邀请奖励发放、积分扣减、抽奖次数、退款退券逻辑。',
  kinds: [
    { name: '邀请滥用', plain: '邀请自己拿奖励', signal: '同设备/同手机号段自邀' },
    { name: '批量注册薅券', plain: '新人券被批量领', signal: '短时间大量新号领新人券' },
    { name: '叠加超限', plain: '不可叠加的券叠用', signal: '多券同单超出优惠上限' },
    { name: '过期/退款回刷', plain: '作废券仍可用', signal: '过期券生效；退款后券退回可重复用' },
  ],
  signals: [
    '邀请自己（同设备/同手机号段）拿奖励。',
    '批量注册领新人券；券可叠加超限；券与商品不匹配。',
    '过期券仍可用；退款后券退回可重复用。',
  ],
  impact: '营销成本被薅穿；积分套现；活动失效；财务损失。',
  verify: [
    '列出全部营销规则（领取次数、叠加、过期、退款策略）。',
    '对每条规则问「能不能绕过/重复/篡改」：自邀、换号、并发（联动 7.3）、过期券重放、退款后重复用。',
    '关注券状态机（未用→已用→已退）迁移是否被约束（联动 7.2）。',
  ],
  protect: {
    root: '券规则服务端计算；一人一券唯一约束；券状态机（state-machine 本章前条）与幂等（idempotency 本章后条）。',
    harden: '设备指纹 + 手机号 + 实名多维风控（与 7.6 联动）；退款策略明确（券退回后不可重复用或降额度）。',
    fallback: '异常领取告警；营销预算熔断。',
  },
  mistakes: [
    '规则只展示不强制（接口没校验领取/使用记录）。',
    '只防单点不防组合（批量注册+自邀+并发一起上）。',
    '退款退券不改状态（退回即可重复用）。',
    '风控只绑账号（换号即绕，与 7.6 联动）。',
  ],
  terms: ['state-machine', 'idempotency', 'mass-assignment'],
  relatedTerms: ['idempotency', 'state-machine'],
  pinyin: { full: 'you hui quan lan yong', joined: 'youhuiquanlanyong', initial: 'yhqly' },
  related: ['parameter-tampering', 'business-race', 'limit-bypass'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的新人券活动）：\n规则（活动页声明）：每人限领 1 张新人券，券不可叠加\n服务端逻辑（演示样例）：\n  POST /api/coupon/claim  { "couponId": "NEW10" }\n  → 发券（不查该设备/手机号是否已领过）\n\n攻击步骤：\n1. 用账号 A 领券（正常）\n2. 同设备注册账号 B，再领：POST /api/coupon/claim { "couponId": "NEW10" }\n   → 服务端不查「同设备/同手机号段是否已领」→ B 也领到\n3. 批量注册即可批量领\n\n逻辑链自查（硬标准：券 ID 与请求字段与服务端读取处逐字符对上）：\n输入（多账号重复领取同 couponId）\n→ 机制（规则只声明「每人 1 张」，领用接口未强制——无唯一约束、无设备维度校验）\n→ 结果（同设备多账号各领 1 张，规则被绕）✔\n逐字符核对：couponId "NEW10" 与服务端券库标识逐字符一致（写成 "new10" 不命中）✔\n           请求字段名 couponId 与服务端读取的键名逐字符一致 ✔\n           （若服务端按设备指纹做唯一约束，第 2 步被拒——修法对照）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与券 ID 为虚构，非现场运行、非真实系统。修法对照：一人一券唯一约束（含设备/手机号维度）+ 券状态机 + 退款策略明确，三件套到位即堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「规则写在哪、强制在哪」。规则声明在页面、强制在接口——两处分离就是薅羊毛的入口。每条规则问三句：能绕过吗？能重复吗？能篡改吗？（与章导语通用挖掘方法一致）。',
    how: '① 列全部营销规则；② 逐规则变体试（自邀/换号/并发/过期/退款）；③ 看券状态机迁移；④ 修复按「服务端算规则+唯一约束+状态机幂等+多维风控」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-707', summary: '优惠券/积分滥用实验（成因：规则声明未在领用处强制；教训：服务端算规则 + 唯一约束 + 多维风控）', lesson: '服务端算规则 + 唯一约束 + 多维风控', source: 'PortSwigger Web Security Academy — Business logic 实验', credibility: '平台' },
  ],
};

const paymentLogic: InteractiveEntry = {
  id: 'payment-logic',
  kind: 'vuln',
  chapter: 7,
  title: '支付与退款逻辑',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', 'API'],
  aliases: ['支付逻辑', '退款逻辑', '支付金额篡改', '支付回调伪造', '支付重放'],
  oneLiner:
    '支付回调不验签或金额不校验时，一分钱能买大额商品；回调可重放时，一次支付多次发货。',
  cause:
    '支付完成与否，权威在支付网关，服务端只该「收通知→验签→核金额→改状态」。四个环节各有缺口：① 不验签——谁都能 POST 一句「已支付」；② 金额不校验——回调说 1 分就是 1 分；③ 不幂等——同一回调处理多次，重复发货；④ 退款金额客户端可改、可重复退。为什么伪造回调能成功：服务端把「收到一条支付成功消息」当成了「支付真的成功了」——消息可以伪造，验签才是「消息来自网关」的证明；金额要自己核（服务端算的钱为准），不能信消息里说的数。',
  where: '支付回调接口（/pay/notify）、退款接口、金额单位转换处（分/元）、部分退款逻辑。',
  kinds: [
    { name: '回调伪造', plain: '假装支付成功', signal: '回调不验签/验签可绕过' },
    { name: '回调重放', plain: '一次支付多次发货', signal: '同一回调多次生效' },
    { name: '金额不核', plain: '1 分钱买大额', signal: '回调金额未与订单金额比对' },
    { name: '退款失控', plain: '退款可改可重复', signal: '退款金额客户端上报；部分退款超原额' },
  ],
  signals: [
    '支付回调不验签/验签可绕过 → 伪造支付成功。',
    '回调可重放 → 重复发货。',
    '金额以分为单位但回调金额未校验 → 1 分钱买大额商品。',
    '退款金额可改、可重复退款；部分退款后总退款额超过原订单。',
  ],
  impact: '伪造支付（直接资金损失）；重复发货；1 分钱买大额（薅穿）；重复退款；财务对账失衡。',
  verify: [
    '抓支付回调请求，测不带签名/带错签名是否仍被接受。',
    '同一回调重放，看订单/发货状态是否重复推进。',
    '构造金额不一致的回调（演示样例，测试商户），看服务端是否核对订单金额。',
    '退款：改退款金额、重复退款、部分退款累计超原额。',
  ],
  protect: {
    root: '回调验签 + 校验订单金额与状态（金额以服务端订单为准）+ 幂等（同一流水号只处理一次，idempotency 本章后条）。',
    harden: '主动查询对账（不只信通知）；退款金额服务端计算且不超过可退余额；金额整数分（联动 7.1）。',
    fallback: '对账脚本核差；异常支付告警。',
  },
  mistakes: [
    '只信异步通知不主动查询（通知可伪造/丢失）。',
    '验签了但不核金额（签名真的、金额假的照样中招）。',
    '回调没做幂等（重复通知=重复发货）。',
    '退款金额信任客户端（联动 7.1 同教训）。',
  ],
  terms: ['state-machine', 'replay-attack', 'idempotency', 'signature'],
  relatedTerms: ['signature', 'state-machine', 'replay-attack', 'idempotency'],
  pinyin: { full: 'zhi fu tui kuan luo ji', joined: 'zhifutuikuanluoji', initial: 'zftklj' },
  related: ['parameter-tampering', 'workflow-bypass', 'idempotency-missing'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的支付回调）：\n服务端逻辑（演示样例）：\n  POST /pay/notify  { "orderId": 1001, "amount": 1, "status": "paid" }\n  → 置订单为已支付（不验签、不核金额、不幂等）\n\n攻击步骤：\n1. 正常下单：订单 1001 应付 99900 分（999 元）\n2. 伪造回调（演示样例）：POST /pay/notify { "orderId": 1001, "amount": 1, "status": "paid" }\n   → 服务端不验签（谁都能调）+ 不核金额（说 1 分就 1 分）→ 订单置已支付\n3. 重放同一回调 → 订单再次推进/重复发货（无幂等）\n\n逻辑链自查（硬标准：字段名/金额单位/状态值与服务端读取处逐字符对上）：\n输入（伪造的支付回调：金额 1 分、状态 paid）\n→ 机制（回调无验签、金额不与订单比对、无幂等——「收到消息」被当成「支付成功」）\n→ 结果（1 分钱拿到 999 元商品；重放再发一单）✔\n逐字符核对：字段名 orderId/amount/status 与服务端读取的键名逐字符一致 ✔\n           金额单位为「分」（1 = 1 分，不是 1 元——单位写错即构造不成立）✔\n           状态值 "paid" 与服务端状态命名逐字符一致 ✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与金额为虚构，非现场运行、非真实系统。修法对照：验签（第 2 步伪造被拒）+ 金额与订单比对（1 分 ≠ 99900 分被拒）+ 流水号幂等（第 3 步重放无效），三件套到位即堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「钱的结论听谁的」。支付完成与否只听支付网关的（验签），金额多少只听服务端订单的（比对）——两个都不信回调自己说的。回调重放面盯幂等（同一流水号只处理一次）。',
    how: '① 测回调验签（无签/错签）；② 测金额比对（改回调金额）；③ 测重放（同回调多次）；④ 退款三面（金额/重复/累计）；⑤ 修复按「验签+金额状态比对+流水号幂等+主动对账」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-704', summary: '支付回调伪造/重放防护说明（成因：回调不验签不核金额；教训：验签 + 金额比对 + 流水号幂等 + 主动对账）', lesson: '验签 + 金额比对 + 流水号幂等 + 主动对账', source: 'OWASP 业务逻辑/支付安全防护说明', credibility: '权威' },
  ],
};

const limitBypass: CardEntry = {
  id: 'limit-bypass',
  kind: 'vuln',
  chapter: 7,
  title: '限购 / 风控绕过',
  hazard: 2,
  difficulty: 'beginner',
  scene: ['Web'],
  aliases: ['限购绕过', '风控绕过', '限购刷单', '换壳绕过'],
  oneLiner:
    '限购绑在最容易换的东西上（账号、IP、前端上报的设备 ID）时，换一个就是新用户，限购形同虚设。',
  cause:
    '限购/风控的「身份维度」选错了——按账号限购（换账号）、按 IP（换代理）、信前端 X-Forwarded-For（可伪造）、信前端生成的设备 ID（可改）。为什么换账号就绕过：限购绑在外壳上而不是人上——账号/IP 都是可以换的外壳，实名、设备指纹、支付账户才是换不动的里子。',
  where: '限购接口、抢购资格判断、新人资格判断、风控字段（X-Forwarded-For、设备 ID）。',
  kinds: [
    { name: '账号维度', plain: '换账号即新用户', signal: '限购按账号计数' },
    { name: 'IP 维度', plain: '换代理即新 IP', signal: '限购按 IP，代理池绕过' },
    { name: '前端字段', plain: '改上报字段即绕', signal: '信 X-Forwarded-For/前端设备 ID' },
  ],
  signals: [
    '限购按账号，换账号即可；限购按 IP，换代理即可。',
    '风控依赖 X-Forwarded-For（可伪造）；设备 ID 由前端生成（可改）。',
  ],
  impact: '限购被刷（黄牛囤货）；新人福利被薅；风控失效。',
  verify: [
    '确认限购/风控绑定了哪些维度（账号/IP/设备/实名/支付账户）。',
    '逐维度替换验证（换账号、换代理、改前端字段）。',
    '检查设备标识由谁生成（前端可改）。',
  ],
  protect: {
    root: '多维度绑定（实名、设备、支付账户、收货地址）；服务端生成设备标识。',
    harden: '不信任任何客户端上报的风控字段（X-Forwarded-For 仅参考）；多维交叉验证。',
    fallback: '异常下单模式告警。',
  },
  mistakes: [
    '限购绑单一维度（换壳即绕）。',
    '信前端上报的设备 ID/XFF（抓包可改）。',
    '以为「一个账号一个」就够（黄牛就是多账号）。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某限购活动「每人限 1 台」，换账号再下一单即成功。',
      question: '这说明什么？',
      options: [
        { text: '限购绑在账号维度，换账号即绕过', correct: true, explain: '正确。绑在可换的外壳上，不是绑在「人」上。' },
        { text: '这是竞争条件', correct: false, explain: '错误。没有并发，是换身份重试。' },
        { text: '这是越权', correct: false, explain: '错误。每个账号都是自己下单，不涉及他人数据。' },
        { text: '系统没做限购', correct: false, explain: '错误。限购做了，但维度选错。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 多维度绑定（实名+设备+支付账户）；② 限购改按 IP；③ 前端生成设备 ID；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 多维度绑定换不动的「里子」', correct: true, explain: '正确。实名/设备/支付账户换不动，交叉绑定才拦得住换壳。' },
        { text: '② 按 IP', correct: false, explain: '错误。代理池即绕。' },
        { text: '③ 前端设备 ID', correct: false, explain: '错误。前端字段可改。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 不管业务维度。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「设备 ID 是前端生成的唯一 ID，绑它就安全了」。',
      question: '为什么不行？',
      options: [
        { text: '前端上报的字段可改，设备标识必须服务端生成', correct: true, explain: '正确。客户端给的「身份」都不是身份。' },
        { text: '设备 ID 长度不够', correct: false, explain: '错误。长度不是问题，来源才是。' },
        { text: '加密一下就行', correct: false, explain: '错误。加密不改变「客户端可控」。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。与传输无关。' },
      ],
    },
  ],
  terms: ['business-logic', 'access-control'],
  relatedTerms: ['business-logic', 'access-control', 'mass-assignment'],
  pinyin: { full: 'xian gou rao guo', joined: 'xiangouraoguo', initial: 'xgrg' },
  related: ['reward-abuse', 'idor', 'business-race'],
  source: 'demo',
  format: 'card',
};

const approvalBypass: InteractiveEntry = {
  id: 'approval-bypass',
  kind: 'vuln',
  chapter: 7,
  title: '越权审批与工作流缺陷',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['越权审批', '审批流缺陷', '工作流缺陷', '自审自批'],
  oneLiner:
    '审批人能审批自己的单据、能替他人审批、审批通过后还能改内容时，审批这道「制衡」只画在流程图上，服务端没站岗。',
  cause:
    '审批的本意是制衡（发起人≠审批人、审过即锁定），但服务端没强制：① 不查发起人与审批人是否同一人（自审）；② 审批流节点可被修改（改审批人/跳节点）；③ 审批通过后内容仍可改（先审后改——审的是 A 版，放行的是 B 版）。为什么能自己批自己：制衡只画在流程图上给人看，服务端没校验「发起人≠审批人」——又是「声明不等于强制」的同款教训（联动 4.7、7.4）。',
  where: '审批接口、审批流配置、审批后内容编辑接口、代审批/转审功能。',
  kinds: [
    { name: '自审自批', plain: '自己批自己的单', signal: '发起人=审批人仍可通过' },
    { name: '替他人审批', plain: '冒用审批人身份', signal: '可替他人点通过' },
    { name: '审批流篡改', plain: '改节点/改审批人', signal: '审批流节点参数可提交' },
    { name: '先审后改', plain: '审过再改内容', signal: '审批通过后内容仍可编辑' },
  ],
  signals: [
    '审批人可审批自己的单据。',
    '可修改审批流节点；可替他人审批。',
    '审批通过后仍可修改内容（先审后改）。',
  ],
  impact: '虚假报销/违规放行；制衡机制失效（审批形同虚设）；合规风险（审批留痕与实际不符）。',
  verify: [
    '用同一账号发起并审批自己的单据，看是否被拦。',
    '改审批流节点/审批人参数（演示样例），看是否生效。',
    '审批通过后编辑内容，看是否需重新审批。',
    '测替他人审批（换审批人身份参数）。',
  ],
  protect: {
    root: '审批人与发起人强制分离（服务端校验）；审批流由服务端固定（不接受客户端提交的节点）。',
    harden: '审批后内容锁定（修改需重新审批）；所有审批操作留痕。',
    fallback: '异常审批模式告警（同人高频自审等）。',
  },
  mistakes: [
    '只在前端隐藏「自己的单据的审批按钮」（抓包即调）。',
    '审批流节点由客户端提交（改节点即绕）。',
    '审批后不锁内容（先审后改）。',
    '以为「有审批环节」就等于有制衡（强制才算）。',
  ],
  terms: ['workflow-defect', 'state-machine', 'authorization'],
  relatedTerms: ['workflow-defect', 'state-machine'],
  pinyin: { full: 'yue quan shen pi', joined: 'yuequanshenpi', initial: 'yqsp' },
  related: ['workflow-bypass', 'vertical-escalation', 'workflow-defect'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的报销审批）：\n服务端逻辑（演示样例）：\n  POST /api/approve  { "claimId": 5001 }\n  → 审批人从服务端会话取 → 置审批通过（只查 claimId 存在，不查发起人==审批人）\n\n攻击步骤：\n1. 账号 A 登录（会话身份=A），发起报销单 5001（发起人 = A）\n2. 同一账号调审批接口：POST /api/approve { "claimId": 5001 }\n   （审批人由服务端从会话取 = A）\n   → 服务端只查 claimId 存在、不查「发起人==审批人」→ 审批通过\n3. A 自己的报销单被自己批准（制衡失效）\n\n逻辑链自查（硬标准：字段名与服务端读取处逐字符对上）：\n输入（同一账号既发起又审批，会话身份=A）\n→ 机制（服务端只查 claimId 存在，不查发起人==审批人——制衡只在流程图上，未强制）\n→ 结果（自审通过，审批形同虚设）✔\n逐字符核对：字段名 claimId 与服务端读取的键名逐字符一致 ✔\n           审批人取自服务端会话（请求体不含 approverId 字段）✔\n           （若服务端校验发起人≠审批人，第 2 步被拒——修法对照）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与单据为虚构，非现场运行、非真实系统。修法对照：职责分离校验（第 2 步被拒）+ 审批流服务端固定 + 审批后锁内容，三件套到位即堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「制衡有没有被强制」。审批的价值在分离（发起≠审批）与定格（审过即锁定）——两件事都要服务端说算。为什么能自己批自己：制衡是给人看的图，不是给机器执行的规则。',
    how: '① 同账号自审测试；② 改节点/替审测试；③ 审后改内容测试；④ 修复按「职责分离+流程固定+审后锁定」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-705', summary: '业务逻辑安全 Cheat Sheet（审批职责分离与流程固定规范）', lesson: '审批职责分离与流程固定规范', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const idempotencyMissing: InteractiveEntry = {
  id: 'idempotency-missing',
  kind: 'vuln',
  chapter: 7,
  title: '数据一致性与幂等缺失',
  hazard: 3,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['幂等缺失', '重复提交', '重复扣款', '幂等键缺失'],
  oneLiner:
    '同一操作重复到达却重复生效时——重复提交生成多笔订单、接口重试重复扣款、消息重复消费重复发货——缺的是「同一件事只算一次」的幂等约束。',
  cause:
    '服务端把「每次请求」当成「一件事」——但用户点两次、网络重试一次、消息队列投递两次，都是「同一件事的多份副本」。为什么重复提交会重复生效：服务端没给「同一件事」发身份证（幂等键，idempotency 本条新增：同一操作的唯一标识，处理过就不再处理）——同一张票不能剪两次，再递也不剪，缺了剪票口的记性，每张都剪。高发位置：下单表单、支付/扣款接口、消息消费者。与 7.5 的分工：7.5 聚焦支付回调的信任边界（验签+核金额+回调幂等），本条聚焦通用幂等约束（表单/接口/消息三面）。回调重放是幂等缺失在支付场景的具体表现，已在 7.5 讲过，本条不重复。',
  where: '下单/支付/扣款接口、表单提交、消息队列消费者、回调处理（与 7.5 联动）。',
  kinds: [
    { name: '表单重复提交', plain: '点两次生成两单', signal: '重复提交生成多笔订单' },
    { name: '接口重试重复', plain: '重试导致重复扣款', signal: '网络重试后重复扣款' },
    { name: '消息重复消费', plain: '重复消息重复发货', signal: '消息重复消费导致重复发货' },
  ],
  signals: [
    '重复提交表单生成多笔订单。',
    '接口重试导致重复扣款；消息重复消费导致重复发货。',
  ],
  impact: '重复扣款/重复发货（资金损失）；数据不一致（订单/库存/账目对不上）；用户投诉。',
  verify: [
    '同一请求连发两次（演示样例，测试环境），看是否产生两笔效果。',
    '三面都测：表单提交、接口调用、消息消费。',
    '检查幂等键是否存在（requestId/流水号）、服务端是否去重。',
  ],
  protect: {
    root: '幂等键（客户端生成 requestId，服务端去重，idempotency 本条新增）；数据库唯一约束。',
    harden: '消息消费去重表；关键操作状态机保护（已处理即终态）。',
    fallback: '前端防重复提交只是体验优化，服务端必须兜底。',
  },
  mistakes: [
    '只靠前端防重复提交（抓包重放即绕）。',
    '幂等键不与业务绑定（换 key 即重复）。',
    '只做接口幂等不做消息幂等（队列重复投递照样重复）。',
    '以为「低概率」不处理（重试与双击是常态）。',
  ],
  terms: ['idempotency', 'replay-attack', 'type-validation'],
  relatedTerms: ['idempotency', 'replay-attack'],
  pinyin: { full: 'mi deng que shi', joined: 'midengqueshi', initial: 'mdqs' },
  related: ['business-race', 'payment-logic', 'workflow-bypass'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的下单接口）：\n服务端逻辑（演示样例）：\n  POST /api/order  { "productId": 1001, "quantity": 1 }\n  → 创建订单（无幂等键，收到几次创建几单）\n\n攻击/触发步骤（演示样例，同请求连发两次）：\n1. 请求 A：POST /api/order { "productId": 1001, "quantity": 1 } → 订单 1\n2. 请求 B（同参数再发）：POST /api/order { "productId": 1001, "quantity": 1 } → 订单 2\n   → 两笔订单（重复生效）；用户双击/网络重试即触发\n\n逻辑链自查（硬标准：请求参数与服务端读取处逐字符对上，两次请求参数完全一致）：\n输入（同一操作的两个副本请求，参数逐字符相同）\n→ 机制（服务端无幂等键去重，每次请求都当新事件处理）\n→ 结果（重复生成订单/重复扣款）✔\n逐字符核对：两次请求的 productId/quantity 逐字符一致（副本判定依据）✔\n           请求字段名与服务端读取的键名逐字符一致 ✔\n           （若服务端按 requestId 去重/唯一约束，第 2 步被拒——修法对照）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与订单为虚构，非现场运行、非真实系统。修法对照：幂等键（requestId 去重）+ 数据库唯一约束，第 2 步不产生新订单。',
    source: 'demo',
  },
  guide: {
    why: '盯「同一件事，服务端认几次」。用户双击、网络重试、消息重投都是同一件事的多份副本——服务端必须认出「这是同一件事」（幂等键）并只办一次。同一张票不能剪两次，再递也不剪——缺的就是剪票口的记性。',
    how: '① 三面测重复（表单/接口/消息）；② 查幂等键与唯一约束；③ 看前端防重是否被当成唯一防线；④ 修复按「幂等键+唯一约束+消费去重表」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-706', summary: '重复提交/重放防护说明（成因：无幂等键去重；教训：幂等键 + 唯一约束 + 服务端兜底）', lesson: '幂等键 + 唯一约束 + 服务端兜底', source: 'OWASP 业务逻辑防护说明', credibility: '权威' },
  ],
};

export const ch7Entries: LearningEntry[] = [
  parameterTampering,
  workflowBypass,
  businessRace,
  rewardAbuse,
  paymentLogic,
  limitBypass,
  approvalBypass,
  idempotencyMissing,
];

export default ch7Entries;
