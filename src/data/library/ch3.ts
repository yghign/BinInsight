/**
 * 认证与会话 —— 10 条。内容逐字取自 docs/10 v2。
 * 低 3 条（weak-password/brute-force-enumeration/captcha-defect）= 形态 A 知识卡 + 3 题；
 * 中 4 条（session-management/jwt-defects/mfa-bypass/persistent-token）与高 3 条（oauth-defects/sso-saml/password-reset）= 形态 B 案例演示 + 指导（stages 留空，templateId: TPL-AUTHZ）。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, CardEntry, InteractiveEntry } from './types';

const weakPassword: CardEntry = {
  id: 'weak-password',
  kind: 'vuln',
  chapter: 3,
  title: '弱口令与撞库',
  hazard: 5,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['弱口令', '弱密码', '撞库', '凭证填充', 'Credential Stuffing'],
  oneLiner:
    '用户使用可猜测的口令，或攻击者拿泄露的账号密码库批量尝试登录，直接获得合法身份。',
  cause:
    '两个入口叠加——用户侧口令强度不足（123456、生日、与用户名相同），系统侧无频控与检测（注册/登录接口可被批量调用、无失败次数限制、无 MFA、无异常登录检测）。撞库的前提是「同一个邮箱密码在别的网站泄露过」，攻击者赌的就是用户习惯复用密码。',
  where:
    '登录接口、注册接口、找回密码的验证步骤、后台管理登录、API 的 Basic/自定义认证端点、未接风控的批量调用入口。',
  kinds: [
    { name: '弱口令', plain: '密码本身可猜测', signal: '无复杂度要求、常见口令可登录' },
    { name: '撞库', plain: '别处泄露的密码拿来批量试', signal: '同一 IP 短时间多账号、成功率异常' },
    { name: '密码喷洒', plain: '一个常用密码打大量账号', signal: '单密码多账号的横向尝试' },
  ],
  signals: [
    '无密码复杂度要求；注册接受 123456 级别口令。',
    '登录无频率限制（连续 20 次失败仍可继续尝试）。',
    '无 MFA；无异常登录检测（异地/多设备登录无提示）。',
    '注册/登录接口可批量调用（无验证码、无风控）。',
  ],
  impact:
    '账号接管、数据泄露；同一口令复用时成为横向移动起点（拿下一个账号顺带一串）；管理员弱口令可直接失守整个后台。',
  verify: [
    '检查登录失败次数限制：连续多次失败后是否仍可尝试、是否有账号/IP 维度的退避。',
    '检查错误提示差异（顺带发现账号枚举）。',
    '检查验证码是否真的服务端校验、能否被跳过。',
    '检查 MFA 能否被跳过；管理员是否强制 MFA。',
    '观察撞库特征：同一 IP 多账号、同一账号多 IP 的检测是否存在。',
  ],
  protect: {
    root: '强制口令策略（长度+复杂度+禁用常见弱口令，比对公开泄露口令库）；强制 MFA（管理员必选）。',
    harden: '登录失败指数退避 + 账号/IP 双维度限速；检测撞库特征（同 IP 多账号、同账号多 IP）并告警；异常登录检测（异地、新设备）。',
    fallback: '风控模型与人工审核；审计留痕便于追溯。',
  },
  mistakes: [
    '只在前端做密码强度校验（抓包改一下就绕过）。',
    '锁定策略可被反向利用做拒绝服务（攻击者故意输错锁死他人账号）——锁定要配合验证码而非一刀切。',
    '限速只按 IP（代理池绕过），必须加账号维度。',
    '以为「内部系统不用管」——内网弱口令是横向移动第一块跳板。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某登录接口连续 30 次输错密码仍不限制；同一 IP 一小时内尝试了 200 个不同账号。',
      question: '这暴露了什么问题？',
      options: [
        { text: '无频控的撞库风险——批量尝试凭证且无账号/IP 双维度限制', correct: true, explain: '正确。同 IP 多账号是撞库典型特征，没有限速等于把接口敞开。' },
        { text: '只是用户密码太简单', correct: false, explain: '错误。现象是系统侧无防护，与个别密码强弱无关。' },
        { text: '这是 SQL 注入', correct: false, explain: '错误。没有涉及查询结构被改写。' },
        { text: '这是 DDoS 攻击', correct: false, explain: '错误。目的是试出可用凭证，不是打瘫服务。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 账号/IP 双维度限速 + 指数退避 + 强制 MFA；② 只在前端提示「密码太简单」；③ 把登录错误提示改详细；④ 加一层 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 频控 + MFA + 口令策略', correct: true, explain: '正确。限速砍掉批量尝试，MFA 让拿密码也进不来，口令策略从源头提高猜测成本。' },
        { text: '② 前端提示', correct: false, explain: '错误。抓包绕过，服务端无约束。' },
        { text: '③ 详细错误提示', correct: false, explain: '错误。反而帮攻击者定位（还引入账号枚举）。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底，不替代频控与 MFA。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「连续错 5 次就锁号，肯定安全」。',
      question: '为什么还不够？',
      options: [
        { text: '锁号可被用来锁死他人账号（拒绝服务），且锁定不等于防住撞库', correct: true, explain: '正确。锁定要做成退避+验证码而非硬锁；防撞库还要有 MFA 与双维度限速。' },
        { text: '错误次数再少一点就行', correct: false, explain: '错误。次数调小只是让拒绝服务更容易。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。HTTPS 保护传输，不阻止批量尝试。' },
        { text: '用户自己设强密码就行', correct: false, explain: '错误。系统侧必须有兜底防护，不能全推给用户。' },
      ],
    },
  ],
  terms: ['authentication', 'password-policy', 'credential-stuffing', 'mfa', 'rate-limiting'],
  relatedTerms: ['credential-stuffing', 'password-policy', 'mfa'],
  pinyin: { full: 'ruo kou ling yu zhuang ku', joined: 'ruokoulingyuzhuangku', initial: 'rklyzk' },
  related: ['brute-force-enumeration', 'mfa-bypass', 'captcha-defect'],
  source: 'demo',
  format: 'card',
};

const bruteForceEnumeration: CardEntry = {
  id: 'brute-force-enumeration',
  kind: 'vuln',
  chapter: 3,
  title: '暴力破解与账号枚举',
  hazard: 3,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['暴力破解', '账号枚举', '用户枚举', '爆破', 'Enumeration'],
  oneLiner:
    '响应差异或时序差异泄露了「账号是否存在」，攻击者先筛出真实账号，再对它们集中爆破口令。',
  cause:
    '登录/注册/找回流程对「账号存在」与「账号不存在」返回了不同结果——提示文案不同、HTTP 状态码不同、响应长度不同，或存在账号时后端做了真实密码校验导致响应更慢。攻击者据此把爆破范围从「所有用户名」缩小到「确定存在的用户名」，效率翻倍。',
  where:
    '登录接口、注册接口（「该手机号已注册」）、密码重置（「邮件已发送」vs「用户不存在」）、邀请/添加成员接口。',
  kinds: [
    { name: '提示差异枚举', plain: '报错文案不一样', signal: '「用户不存在」vs「密码错误」' },
    { name: '时序差异枚举', plain: '响应快慢不一样', signal: '存在的账号响应更慢（做了真实校验）' },
    { name: '状态码/长度枚举', plain: 'HTTP 状态或响应长度不同', signal: '404 vs 401、响应字节数不同' },
    { name: '流程泄露枚举', plain: '其他接口泄露存在性', signal: '注册提示「已注册」、重置提示「用户不存在」' },
  ],
  signals: [
    '「用户名不存在」与「密码错误」提示不同、HTTP 状态码不同、响应长度不同。',
    '存在账号的响应比不存在账号慢（后端做了真实密码校验，不存在的账号提前返回）。',
    '注册接口提示「该手机号已注册」；密码重置提示「邮件已发送」vs「用户不存在」。',
  ],
  impact:
    '账号存在性泄露；爆破效率大幅提升；配合撞库形成完整攻击链；组织架构/员工账号清单泄露。',
  verify: [
    '同一接口分别用存在/不存在的账号请求，对比提示文案、状态码、响应长度、响应时间。',
    '时间差异要多次测量取均值（网络抖动会干扰单次结果）。',
    '检查注册、找回、邀请等旁路接口的提示是否泄露存在性。',
    '统一为模糊提示后，再确认限速与验证码是否补齐（枚举修了但爆破还在）。',
  ],
  protect: {
    root: '统一错误提示与响应结构（「用户名或密码错误」一视同仁）；对不存在的账号也跑一次假的密码哈希运算（dummy hash，即假哈希运算——让「账号存在」和「账号不存在」的响应时间一致），抹平时间差。',
    harden: '注册/找回流程改「若存在则发送」的模糊提示（不透露账号是否存在）；限速 + 验证码 + 风控。',
    fallback: '异常批量探测告警；审计留痕。',
  },
  mistakes: [
    '只统一了提示文案，忘了响应时间差异（时序枚举照样成立）。',
    '只修登录口，注册/找回接口仍提示「已注册/用户不存在」。',
    '抹平了枚举就以为爆破也没了——频控与验证码要另配。',
    '用「返回 200 但内容不同」以为安全——内容长度差异同样泄露。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '登录接口对不存在的用户名返回「用户不存在」，对存在的用户名返回「密码错误」。',
      question: '这暴露了什么？',
      options: [
        { text: '账号枚举——提示差异泄露了账号是否存在', correct: true, explain: '正确。攻击者用这个差异先筛出真实账号，再集中爆破，效率翻倍。' },
        { text: '密码策略太弱', correct: false, explain: '错误。这是信息泄露问题，与密码强度无关。' },
        { text: '这是暴力破解本身', correct: false, explain: '错误。枚举是给爆破铺路的信息泄露，两者是不同缺陷。' },
        { text: '这是 CSRF', correct: false, explain: '错误。没有借身份发请求。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 统一提示「用户名或密码错误」并对不存在账号做假哈希抹平时间差；② 只把提示文案改模糊但保留响应时间差；③ 把错误码改成 500；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 提示与时间双抹平', correct: true, explain: '正确。文案、状态、长度、时间全部一致，没有任何差异可依据。' },
        { text: '② 只改文案', correct: false, explain: '错误。时序枚举仍然成立（存在的账号响应更慢）。' },
        { text: '③ 改错误码', correct: false, explain: '错误。换个差异而已，枚举照旧。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 管不住业务响应的差异。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发统一了登录错误提示，认为「枚举已修复」。',
      question: '还有什么要做？',
      options: [
        { text: '限速与验证码要另配，且注册/找回接口也要统一模糊提示', correct: true, explain: '正确。修复枚举只堵信息泄露，爆破风险与旁路接口还在。' },
        { text: '已经够了', correct: false, explain: '错误。爆破与旁路泄露仍在。' },
        { text: '只需把提示翻译成英文', correct: false, explain: '错误。语言无关，差异才是问题。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。传输加密不解决响应差异。' },
      ],
    },
  ],
  terms: ['brute-force', 'account-enumeration', 'rate-limiting', 'captcha', 'authentication'],
  relatedTerms: ['account-enumeration', 'rate-limiting', 'captcha'],
  pinyin: { full: 'bao li po jie yu zhang hao mei ju', joined: 'baolipojieyuzhanghaomeiju', initial: 'blpjyzhmj' },
  related: ['weak-password', 'captcha-defect', 'password-reset'],
  source: 'demo',
  format: 'card',
};

const sessionManagement: InteractiveEntry = {
  id: 'session-management',
  kind: 'vuln',
  chapter: 3,
  title: '会话固定 / 会话预测 / 会话不失效',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['会话固定', '会话劫持', 'Session Fixation', '会话预测', '会话不失效'],
  oneLiner:
    '会话标识可被预先设定（固定）、可被猜出（预测），或注销改密后仍有效（不失效），攻击者借此顶替他人身份。',
  cause:
    '会话标识（Session ID）是服务端判断「你这次是谁」的唯一依据，但三个环节出问题：① 登录成功后不重新生成标识——攻击者预先塞给受害者的标识登录后依然有效（会话固定）；② 标识生成可预测——自增、时间戳、短随机（会话预测）；③ 注销/改密后服务端不使旧会话失效（会话不失效）。为什么登录后要换 ID：如果登录前后标识不变，攻击者只要在登录前把自己的标识种进受害者浏览器（URL 参数、子域 Cookie、XSS），受害者登录后这个标识就升格为「已登录身份」，攻击者拿着同一个标识直接进入——登录动作反而替攻击者完成了认证。',
  where:
    '登录接口（登录成功回调）、注销接口、改密流程、支持 URL 传会话的老式应用、多设备会话管理。',
  kinds: [
    { name: '会话固定', plain: '登录前后 SESSIONID 不变', signal: '用登录前拿到的标识可进入已登录态' },
    { name: '会话预测', plain: '标识能被猜出来', signal: 'ID 呈自增/时间戳/短随机规律' },
    { name: '会话不失效', plain: '注销/改密后旧会话还活着', signal: '注销后旧 Cookie 仍能访问受保护页面' },
  ],
  signals: [
    '登录前后 SESSIONID 不变（未重新生成）。',
    'Session ID 明显可预测（自增、时间戳、短随机数）。',
    '注销后旧 Cookie 仍可访问受保护页面。',
    '改密后其他设备会话仍然有效。',
  ],
  impact:
    '身份劫持（以受害者身份操作一切受保护功能）；注销形同虚设（设备丢失/共享场景下旧会话长期有效）；改密不能止损（旧会话继续可用，改密后攻击者仍在）。',
  verify: [
    '登录前后抓取会话标识，对比是否变化——不变即会话固定。',
    '收集多个标识样本，看随机性（长度、字符集、递增/时间规律）。',
    '注销后用旧 Cookie 重放受保护请求，看是否仍成功。',
    '改密后用旧会话请求，检查是否全部失效。',
    '检查空闲超时与绝对超时是否配置合理。',
  ],
  protect: {
    root: '登录成功、权限变更、改密后立即重新生成会话 ID；标识用密码学安全随机数（≥128 bit）。',
    harden: '服务端维护会话状态并支持集中失效（注销/改密吊销全部或他人会话）；设置合理的空闲超时与绝对超时。',
    fallback: '异常会话检测（同标识多地使用）并告警。',
  },
  mistakes: [
    '只在前端删除 Token，服务端会话未失效（刷新旧值照样能用）。',
    '以为「注销了就安全」——服务端不吊销，Cookie 可重放。',
    '只防固定不防预测（ID 随机性不足照样被猜）。',
    '改密后不使旧会话失效——攻击者在改密后依然在线。',
  ],
  terms: ['session', 'session-fixation', 'authentication', 'cookie-flags'],
  relatedTerms: ['session', 'session-fixation', 'cookie-flags'],
  pinyin: { full: 'hui hua gu ding', joined: 'huihuaguding', initial: 'hhgd' },
  related: ['jwt-defects', 'password-reset', 'persistent-token'],
  caseDemo: {
    material:
      '场景（演示样例，虚构站点 example.com）：\n1. 攻击者访问站点，拿到一个未登录的 SESSIONID=abc123\n2. 攻击者诱导受害者打开 example.com/?SID=abc123\n   （站点老式设计：接受 URL 中的会话参数，且服务端沿用该标识）\n3. 受害者在该会话里登录，服务端登录成功但没有重新生成会话 ID\n   → 受害者当前会话仍是 abc123，状态升格为「已登录」\n4. 攻击者用自己的浏览器带上 SESSIONID=abc123 访问受保护页面\n   → 以受害者身份进入\n\n逻辑链自查：\n输入（攻击者种入 abc123 + 受害者登录）\n→ 机制（登录不重生成 ID，标识承载了登录态）\n→ 结果（攻击者复用同一标识 = 受害者身份）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与标识为虚构，非现场运行、非真实系统。修法对照：登录成功后重新生成 ID，第 3 步会换发新标识，攻击者的 abc123 停留在未登录态，第 4 步失效。',
    source: 'demo',
  },
  guide: {
    why: '会话标识就是「你这次是谁」的数字替身。盯两个动作：登录后有没有换替身（防固定）、替身能不能被猜（防预测）。看注销/改密是否在服务端真正作废旧替身（防不失效）。',
    how: '① 抓登录前后两个会话标识对比是否变化；② 采样多个标识看随机性；③ 注销/改密后拿旧标识重放请求；④ 修复按「登录后重生成 + 强随机 + 服务端集中失效」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
};

const jwtDefects: InteractiveEntry = {
  id: 'jwt-defects',
  kind: 'vuln',
  chapter: 3,
  title: 'JSON Web Token 缺陷',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['JWT 缺陷', 'JSON Web Token', '令牌伪造', 'alg none', '算法混淆'],
  oneLiner:
    'JWT 的签名、算法、密钥或校验逻辑存在缺陷时，攻击者可以伪造任意身份的令牌。',
  cause:
    'JWT 由「头（声明算法）+ 载荷（身份数据）+ 签名」三段组成，三段都只是 Base64 编码——任何人都能解码阅读、能修改，安全完全依赖签名校验。出问题的地方都在校验环节：服务端信了攻击者自己声明的算法（alg:none）、密钥太弱可爆破、算法用错（RS256 公钥被当 HS256 密钥）、kid 参数被拼进文件路径或 SQL、或干脆只解码不验证。alg:none 为什么能绕过：JWT 的头部自带 "alg" 字段声明「我用什么算法签名」。如果服务端按这个声明去选择校验方式，攻击者把 alg 改成 none 并删掉签名段，服务端就会跳过验签、直接接受伪造的载荷——把「怎么验」的决定权交给了令牌自己，等于让考生自己出题。为什么 JWT 不是加密：载荷只是 Base64 编码（可逆编码，不是加密），任何人拿到令牌都能解码看到里面的角色、用户 ID——敏感信息放进去就等于明文公开。',
  where:
    '登录签发令牌处、每次请求的令牌校验中间件、刷新令牌接口、微服务间信任令牌、kid/jku 头参数处理处。',
  kinds: [
    { name: 'alg: none', plain: '服务端接受无签名令牌', signal: '改成 none 并删除签名段' },
    { name: '弱密钥', plain: 'HS256 密钥可爆破', signal: '用字典离线爆破签名' },
    { name: '算法混淆', plain: 'RS256 公钥被当作 HS256 密钥', signal: '用公钥内容做 HMAC 签名' },
    { name: 'kid 注入', plain: 'kid 被拼进文件路径/SQL', signal: '路径穿越或注入' },
    { name: '不校验签名', plain: '只解码不验证', signal: '改 payload 后仍通过' },
    { name: '不校验 exp/aud/iss', plain: '过期令牌可用、跨服务复用', signal: '用过期的 token 请求' },
    { name: '敏感信息明文', plain: 'payload 只是 Base64', signal: '直接解码读权限字段' },
    { name: '权限字段可篡改', plain: '角色写在 payload 且签名失效', signal: '改 role: admin' },
  ],
  signals: [
    '修改 payload 后请求仍被接受（签名未校验）。',
    'alg 改成 none 后令牌仍有效。',
    '令牌可在 jwt.io 解码看到角色/权限字段（敏感信息入载荷）。',
    '密钥是常见词、长度过短（离线爆破可成）。',
  ],
  impact:
    '任意用户身份伪造、越权至管理员、跨系统横向（一个服务的令牌被另一个服务信任时）；过期令牌长期可用（无法止损）。',
  verify: [
    '解码令牌看载荷结构（在线工具或 Base64 手动解），找出身份/权限字段。',
    '改 alg 为 none 并删除签名，重新发请求看是否接受。',
    '改 payload（如角色字段）保留原签名，看是否校验签名。',
    '用过期令牌请求，看 exp 是否校验；换一个服务请求，看 aud/iss 是否校验。',
    '对 HS256 令牌尝试弱密钥字典爆破（授权环境）；检查 kid 参数是否可控。',
  ],
  protect: {
    root: '服务端固定期望算法（不接受 none、不信客户端声明的 alg）；强密钥（≥256 bit 随机，存放于密钥管理系统）；严格校验 exp/nbf/aud/iss。',
    harden: 'kid 只做映射表查询（不拼路径/SQL）；敏感信息不放载荷；支持吊销（黑名单，或短过期 + 刷新令牌轮换）。',
    fallback: '令牌异常使用告警；密钥定期轮换。',
  },
  mistakes: [
    '把 JWT 当加密（它只是签名 + Base64，载荷人人可读）。',
    '前端校验过期时间而后端不校验（前端一切可绕）。',
    '密钥硬编码在代码仓库（进版本库即泄露）。',
    '以为「有签名就安全」——alg:none 与算法混淆专门绕签名这一步。',
  ],
  terms: ['jwt', 'signature', 'authentication', 'session'],
  relatedTerms: ['signature', 'jwt', 'authentication'],
  pinyin: { full: 'json web token que xian', joined: 'jsonwebtokenquexian', initial: 'jwtqx' },
  related: ['session-management', 'persistent-token', 'sso-saml'],
  caseDemo: {
    material:
      '原始令牌（演示样例，三段式）：\n  头：{"alg":"HS256","typ":"JWT"}\n  载荷：{"sub":"user101","role":"user","exp":…}\n  签名：Sxxx（用服务端密钥算出）\n\n攻击步骤（演示样例，alg:none 变体）：\n  1. 改载荷：role: "user" → "admin"\n  2. 改头部：alg: "HS256" → "none"\n  3. 删除签名段（令牌变成 两段 + 空签名）\n  4. 带伪造令牌请求受保护接口\n\n漏洞服务端的处理（演示样例）：\n  读头部 alg=none → 按 none 处理 → 跳过验签 → 直接信任载荷\n  → 以 admin 身份通过\n\n逻辑链自查：\n输入（改 role + 改 alg:none + 去签名）\n→ 机制（服务端信了令牌自带的 alg 声明，none 意味着不验签）\n→ 结果（伪造载荷被当作已认证身份）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，令牌与站点为虚构，非现场运行、非真实系统。修法对照：服务端固定期望算法为 HS256（或 RS256），收到 alg=none 直接拒绝，第 4 步失败。',
    source: 'demo',
  },
  guide: {
    why: 'JWT 的安全全部押在签名校验上。盯住一个问题：「谁决定用什么算法验签」——如果答案是「令牌自己声明的」，攻击者就能用 alg:none 把验签关掉。再盯「载荷里有没有敏感信息」（Base64 不是加密）。',
    how: '① 解码令牌看载荷与头部 alg；② 试 alg:none 与改载荷两种变体；③ 检查 exp/aud/iss 是否校验、kid 是否可控；④ 修复按「固定算法 + 强密钥 + 完整声明校验 + 可吊销」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
};

const oauthDefects: InteractiveEntry = {
  id: 'oauth-defects',
  kind: 'vuln',
  chapter: 3,
  title: 'OAuth 2.0 / OIDC 缺陷',
  hazard: 4,
  difficulty: 'advanced',
  scene: ['Web', 'API'],
  aliases: ['OAuth 缺陷', 'OAuth 2.0', 'OIDC', '第三方登录漏洞', '授权码劫持', '登录 CSRF'],
  oneLiner:
    '授权流程中的 redirect_uri、state、授权码、令牌校验存在缺陷时，授权码或令牌被劫持，或第三方账号被绑到受害者账号上导致接管。',
  cause:
    'OAuth 授权码流程像「三方转帐」：用户在授权服务器批准 → 授权服务器把授权码寄到 redirect_uri 指定的地址 → 第三方应用拿码换令牌。三个薄弱点：① redirect_uri 校验不严（子串匹配/通配/配合开放重定向）——授权码被寄到攻击者域名；② state 缺失或不校验——攻击者把自己的第三方账号「绑」到受害者账号（登录 CSRF）；③ 授权码可重复使用、未绑定 client_id/redirect_uri——码被截获后可换令牌。为什么绑定接口是接管高发点：「绑定第三方账号」这个动作的语义是「把 A 平台身份挂到当前登录的 B 账号上」。如果流程里受害者「不知不觉」完成了绑定（state 缺失导致的登录 CSRF），攻击者自己的第三方账号就挂在了受害者账号下——以后攻击者点「用第三方登录」就直接进入受害者账号。',
  where:
    '第三方登录/绑定接口、授权回调（redirect_uri 处理）、state 生成与校验处、授权码兑换令牌接口、id_token 校验处（OIDC）。',
  kinds: [
    { name: 'redirect_uri 失守', plain: '授权码寄到攻击者域名', signal: '子串匹配、通配、可加路径/参数' },
    { name: 'state 缺失', plain: '绑定流程无 CSRF 防护', signal: '删掉 state 流程仍成功' },
    { name: '授权码复用', plain: '一个码能换多次令牌', signal: '重复兑换仍成功' },
    { name: '隐式流暴露', plain: '令牌出现在 URL/Referer', signal: 'response_type=token' },
    { name: 'id_token 不校验', plain: '签名/iss/aud/nonce 不查', signal: '篡改 id_token 仍通过' },
  ],
  signals: [
    'redirect_uri 改成外域/加路径/加 @、//、%2f 后仍被接受。',
    '删掉 state 参数流程仍走通（登录 CSRF 成立）。',
    '授权码在有效期内可重复兑换。',
    '「绑定第三方账号」接口不校验当前登录用户、不要求重新认证。',
  ],
  impact:
    '账号接管（最常见路径：第三方登录绑定逻辑缺陷）；授权码/令牌失窃；受害者账号被攻击者第三方身份长期绑定。',
  verify: [
    '抓取完整授权流程，逐参数增删改（redirect_uri、state、scope、response_type）。',
    '测 redirect_uri 变体：加路径、加子域、加 @、//、%2f、?、#。',
    '测删除 state 后流程是否仍成功（登录 CSRF）。',
    '测授权码能否在有效期内重复兑换、是否绑定 client_id。',
    '重点测「绑定第三方账号」接口：是否校验当前登录用户、是否要求重新认证（常见接管点）。',
  ],
  protect: {
    root: 'redirect_uri 严格全等白名单；强制 state 且一次性校验；授权码一次性、短时效、绑定 client_id 与 redirect_uri。',
    harden: '使用 PKCE（公钥码挑战——给授权码再加一把锁：第三方应用先发一个随机值的哈希，换令牌时再证明自己知道原随机值，这样就算授权码被截获，攻击者没有原随机值也换不了令牌）；id_token 完整校验签名与 iss/aud/nonce；敏感绑定操作要求重新认证。',
    fallback: '绑定/解绑操作通知用户并留审计。',
  },
  mistakes: [
    'redirect_uri 用「包含本站域名」校验（子串绕过）。',
    '只防授权码劫持不管绑定接口（接管最常见路径在绑定）。',
    '以为「用了 OAuth 就安全」——流程实现里的每一环都可能松。',
    '隐式流（response_type=token）把令牌暴露在 URL 与 Referer 里。',
  ],
  terms: ['oauth', 'authorization-code', 'oauth-redirect', 'origin-check'],
  relatedTerms: ['oauth', 'authorization-code', 'oauth-redirect'],
  pinyin: { full: 'oauth ren quan liu cheng que xian', joined: 'oauthrenquanliuchengquexian', initial: 'oarlcqx' },
  related: ['open-redirect', 'password-reset', 'sso-saml'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 支持第三方登录）：\n1. 攻击者用自己的第三方账号走授权流程，走到「即将回调」一步停住\n   ——回调 URL 中带有攻击者账号的授权凭据（state 缺失时无 CSRF 防护）\n2. 攻击者把这个回调 URL 发给已登录 example.com 的受害者，诱使其打开\n3. 受害者浏览器完成回调 → 站点把「攻击者的第三方账号」绑定到受害者账号\n4. 攻击者之后点「用第三方登录」→ 直接进入受害者账号\n\n逻辑链自查：\n输入（攻击者构造带自己凭据的回调 + 诱使受害者打开）\n→ 机制（绑定接口未校验 state、未要求受害者重新认证，凭据被挂到当前会话）\n→ 结果（攻击者第三方账号绑定成功 → 登录接管）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与账号为虚构，非现场运行、非真实系统。修法对照：强制 state 一次性校验（第 2 步回调因 state 不匹配被拒）+ 绑定操作要求重新认证（第 3 步被挡）。',
    source: 'demo',
  },
  guide: {
    why: 'OAuth 是「三方互信」流程，链路长、参数多，任何一环松了整个链就断。两个最值钱的盯点：授权码寄到哪（redirect_uri）和绑定动作挂到谁身上（state/重新认证）——前者失守丢码，后者失守直接丢号。',
    how: '① 抓全流程列出全部参数；② 逐个测 redirect_uri 变体与 state 删除；③ 重点测绑定接口的会话校验；④ 修复按「全等白名单 + state 一次性 + 授权码绑定 + 绑定重认证」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-301', summary: 'OAuth 授权码劫持与账号绑定接管实验（成因：redirect_uri 校验不严 / state 缺失；教训：全等白名单 + state 一次性校验 + 绑定操作重认证）', lesson: '全等白名单 + state 一次性校验 + 绑定操作重认证', source: 'PortSwigger Web Security Academy — OAuth 实验', credibility: '平台' },
  ],
};

const ssoSaml: InteractiveEntry = {
  id: 'sso-saml',
  kind: 'vuln',
  chapter: 3,
  title: 'SSO / SAML 缺陷',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', 'API'],
  aliases: ['SAML 缺陷', 'SSO 缺陷', '单点登录漏洞', '断言伪造', '签名包裹', 'XSW'],
  oneLiner:
    'SAML 断言的签名校验存在缺陷（签名包裹、注释截断、未校验签名位置），攻击者可伪造任意用户的断言，直接登录他人账号。',
  cause:
    'SSO 里身份证明是断言（一份 XML 文档，写着「我是谁」），安全性靠 XML 签名保证「断言没被改过」。问题出在「签名覆盖了什么」：① 服务端只检查「文档里有没有签名」而不检查「签名盖的是不是这段断言」——攻击者把断言内容改掉、把签名挪到不覆盖它的地方（签名包裹/XSW）；② XML 注释截断——签名验证时被注释截断的内容与实际处理的内容不一致；③ 接受未签名断言；④ Recipient/Audience/NotOnOrAfter 未校验（断言可跨服务、超期使用）。为什么签名在却还能伪造：签名只能保证「被它盖住的那部分」没被改。如果服务端只看「文档里存在签名」，攻击者可以保留签名、把伪造的身份声明放在签名覆盖范围之外，或用两个相同 ID 的元素让校验器与解析器读到不同内容——签名是真的，但它盖的不是你读到的那段。',
  where:
    'SAML Response 处理端、SSO 回调（ACS 端点）、断言解析与签名校验代码、跨租户/跨应用的单点登录集成。',
  kinds: [
    { name: '签名包裹（XSW）', plain: '签名被挪到不覆盖断言的位置', signal: '改断言内容后仍被接受' },
    { name: '注释截断', plain: '校验与解析读到的 XML 不同', signal: '注释技巧可造成两义性' },
    { name: '接受未签名断言', plain: '不签名也放行', signal: '删掉签名仍登录成功' },
    { name: '声明不校验', plain: 'Audience/时效等不查', signal: '跨服务复用、超期断言可用' },
  ],
  signals: [
    'SAML Response 修改（如换用户名）后仍被接受。',
    'XML 签名被移到不影响校验的位置后仍通过。',
    '接受未签名断言；Recipient/Audience/NotOnOrAfter 未校验。',
  ],
  impact:
    '伪造任意用户（含管理员）的登录断言——整个 SSO 体系失守；一次缺陷影响所有接入该 SSO 的系统。',
  verify: [
    '抓取 SAML Response，尝试修改身份声明后原样重放。',
    '测试签名包裹：把签名移到旁支元素/复制元素改 ID（演示样例，授权环境）。',
    '测试删除签名后是否被接受（未签名断言检查）。',
    '检查 Audience、Recipient、NotOnOrAfter、InResponseTo 是否校验。',
  ],
  protect: {
    root: '使用成熟库并开启严格模式；校验签名覆盖范围（引用 URI 必须指向被断言元素本身）；拒绝未签名断言。',
    harden: '校验 Audience、Recipient、时效、InResponseTo；禁用 DTD（顺带防 XXE——XML 外部实体注入：XML 解析器把文档里的外部引用当成数据去读取/请求，可被利用读文件、发请求，属于服务端请求与解析主题，禁用 DTD 可同时防住）。',
    fallback: 'SSO 登录异常告警；审计留痕。',
  },
  mistakes: [
    '自己实现 XML 签名校验（极易出错——校验器与解析器的细微差异就是漏洞）。',
    '只校验「存在签名」而不校验签名覆盖的内容。',
    '忘了时效与受众校验（签名真但断言过期/跨服务）。',
  ],
  terms: ['saml', 'sso', 'signature', 'authentication'],
  relatedTerms: ['saml', 'sso', 'signature'],
  pinyin: { full: 'sso saml que xian', joined: 'ssosamlquexian', initial: 'ssosmlqx' },
  related: ['jwt-defects', 'oauth-defects', 'signature'],
  caseDemo: {
    material:
      '原始 SAML Response 结构（演示样例，示意）：\n  <Assertion> 用户名=user101 …（被签名覆盖）</Assertion>\n  <Signature> 对 Assertion 的签名 S </Signature>\n\n攻击步骤（演示样例，签名包裹思想）：\n  1. 复制一份 Assertion 节点，用户名改为 admin，放在签名不覆盖的位置\n  2. 保留原签名 S（签名本身真实有效，但盖的是旧内容）\n  3. 提交修改后的 Response\n\n漏洞服务端的处理（演示样例）：\n  检查「文档里有签名 S」→ 是 → 放行\n  解析身份时读到的是 改过的 admin 节点\n  → 以 admin 身份登录\n\n逻辑链自查：\n输入（伪造断言 + 保留真签名）\n→ 机制（只验「有无签名」不验「签名覆盖哪段」，校验与解析读到不同节点）\n→ 结果（伪造身份被接受）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，断言与站点为虚构、结构经简化，非现场运行、非真实系统。修法对照：校验签名覆盖范围（引用必须指向实际解析的断言元素），第 3 步被拒；拒绝未签名断言，旁支伪造节点不被采信。',
    source: 'demo',
  },
  guide: {
    why: 'SAML 的命门是「签名盖住了什么」。盯住校验代码问一句：它校验的是「这段断言没被改」还是「文档里有签名」——两者的差别就是漏洞宽度。次盯「未签名断言放不放行」「Audience/时效查不查」。',
    how: '① 抓 SAML Response 试改身份后重放；② 试签名包裹与删签名两个变体；③ 检查 Audience/Recipient/时效校验；④ 修复按「成熟库严格模式 + 签名覆盖范围校验 + 拒绝未签名 + 声明全校验」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-302', summary: 'SAML 断言签名校验缺陷实验（成因：签名包裹/未校验签名覆盖范围，改断言后仍被接受；教训：严格校验签名覆盖范围 + 拒绝未签名断言 + 校验 Audience/时效）', lesson: '严格校验签名覆盖范围 + 拒绝未签名断言 + 校验 Audience/时效', source: 'PortSwigger Web Security Academy — SAML 实验', credibility: '平台' },
    { refId: 'RC-303', summary: 'OWASP 认证与会话管理 Cheat Sheet（SAML/SSO 校验要点汇总）', lesson: 'SAML/SSO 校验要点', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const passwordReset: InteractiveEntry = {
  id: 'password-reset',
  kind: 'vuln',
  chapter: 3,
  title: '密码重置逻辑缺陷',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', 'API'],
  aliases: ['密码重置', '找回密码', '重置令牌', 'Password Reset', '令牌劫持'],
  oneLiner:
    '找回密码流程的令牌生成、传递或校验有缺陷时，攻击者可以重置任意账号（包括管理员）的密码。',
  cause:
    '重置令牌是「临时身份凭证」，安全要求是：不可预测、单次使用、短时效、强绑定用户。常见缺陷：令牌可预测（时间戳/自增/短随机/用户名哈希）；不过期、用后不失效、不绑定用户；令牌经 URL 传递泄露到 Referer/日志/历史；重置链接的 Host 取自请求头（Host 头注入→令牌发到攻击者服务器）；校验时只比对令牌不比对用户（token 有效即可重置任意账号）；响应体直接返回令牌；账号参数可篡改（{"email":"victim@x.com","token":"自己的"}）。为什么令牌必须绑定用户：令牌的语义是「允许重置某一个账号的密码」。如果校验只问「这个令牌是不是有效的」而不问「这个令牌是不是给这个账号的」，攻击者就能用自己账号申请到的有效令牌，去重置受害者账号的密码——令牌成了万能钥匙。',
  where:
    '忘记密码流程（申请→邮件/短信→重置页）、邮箱/手机号修改流程、密保问题重置、后台代客重置。',
  kinds: [
    { name: '令牌可预测', plain: '令牌有规律可猜', signal: '含时间戳/用户名/自增部分' },
    { name: '令牌不绑定用户', plain: '有效令牌能重置任意账号', signal: '换账号参数后仍成功' },
    { name: '令牌泄露', plain: '令牌从旁路流出', signal: 'Referer/日志/响应体含令牌' },
    { name: 'Host 头注入', plain: '重置链接发给攻击者', signal: '改 Host 头后链接跟着变' },
    { name: '参数篡改', plain: '账号字段可被改', signal: '请求体里账号可替换' },
  ],
  signals: [
    '重置令牌长度短、字符集窄、含可猜测信息。',
    '令牌使用一次后再用仍有效；超过有效期仍可用。',
    '令牌出现在 URL、响应体、Referer 中可被第三方看到。',
    '修改请求中的账号参数，服务端以「请求中的账号」为准而非「令牌所属用户」。',
  ],
  impact:
    '任意账号（含管理员）密码被重置 = 账号接管；配合账号枚举可定向打击；重置后若不使旧会话失效，攻击者与受害者同时在线。',
  verify: [
    '完整走一遍找回流程，观察令牌形态（长度、字符集、是否含时间/用户名信息）。',
    '修改请求中的账号参数，看服务端以「令牌所属用户」还是「请求中的账号」为准。',
    '令牌用一次后再用一次看是否失效；等过有效期再用。',
    '修改 Host 头，看重置链接是否跟着变。',
    '检查响应体、Header、跳转 URL 是否泄露令牌。',
  ],
  protect: {
    root: '令牌用密码学安全随机数生成（≥128 bit）、哈希后存储、单次使用、短时效（15~30 分钟）、强绑定用户（校验令牌时同时比对归属）。',
    harden: '重置链接域名用配置常量而非 Host 头；重置成功后使所有会话失效并通知用户；敏感流程加二次验证。',
    fallback: '重置行为告警与审计留痕。',
  },
  mistakes: [
    '只比对令牌不比对用户（万能钥匙缺陷）。',
    '令牌明文存储（库泄露即全体可重置）。',
    '重置后不忘旧会话——攻击者改密前后都在线。',
    '令牌通过 URL 传递却不清理 Referer/历史泄露面。',
  ],
  terms: ['reset-token', 'authentication', 'session', 'account-enumeration'],
  relatedTerms: ['reset-token', 'authentication', 'session'],
  pinyin: { full: 'mi ma chong zhi que xian', joined: 'mimachongzhiquexian', initial: 'mmczqx' },
  related: ['session-management', 'jwt-defects', 'account-enumeration'],
  caseDemo: {
    material:
      '漏洞流程（演示样例，站点 example.com）：\n1. 攻击者对自己账号申请重置，拿到令牌 T（T 对「攻击者账号」有效）\n2. 攻击者发送重置请求，请求体里把账号改成受害者：\n     POST /reset  { "account": "victim@x.com", "token": "T", "newPassword": "..." }\n3. 服务端校验「令牌 T 有效」→ 通过\n   ——但没有校验「T 是否属于 victim@x.com」\n4. 受害者账号密码被改成攻击者设定的值\n\n逻辑链自查：\n输入（攻击者账号的有效令牌 + 篡改成受害者的账号参数）\n→ 机制（校验只问令牌有效性、不问令牌归属）\n→ 结果（受害者密码被重置）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与令牌为虚构，非现场运行、非真实系统。修法对照：校验令牌时强绑定归属用户（第 3 步发现 T 不属于 victim，拒绝），缺陷堵死。',
    source: 'demo',
  },
  guide: {
    why: '重置令牌是「临时身份凭证」，盯它的四个属性：谁能生成（可预测吗）、给谁用（绑定用户吗）、能用几次（单次吗）、用多久（时效吗）。最常见的翻车点是「只验令牌不验归属」——令牌从临时钥匙变成万能钥匙。',
    how: '① 走全流程看令牌形态与传递路径；② 换账号参数做归属测试；③ 测重复使用/过期/Host 头；④ 修复按「随机生成 + 哈希存储 + 强绑定用户 + 单次短时效 + 重置后全会话失效」五件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-304', summary: '密码重置令牌缺陷实验（成因：令牌不绑定用户/Host 头注入致令牌外泄；教训：令牌强绑定用户 + 单次短时效 + 重置后全会话失效）', lesson: '令牌强绑定用户 + 单次短时效 + 重置后全会话失效', source: 'PortSwigger Web Security Academy — Authentication 实验', credibility: '平台' },
    { refId: 'RC-305', summary: 'OWASP 忘记密码 Cheat Sheet（重置令牌生成/存储/校验规范）', lesson: '重置令牌生成/存储/校验规范', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const mfaBypass: InteractiveEntry = {
  id: 'mfa-bypass',
  kind: 'vuln',
  chapter: 3,
  title: 'MFA 绕过',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['MFA 绕过', '多因素认证绕过', '二步验证绕过', '2FA Bypass'],
  oneLiner:
    '多因素认证在流程设计上可被跳过——只校验了第一步，或第二步的验证结果可被篡改。',
  cause:
    'MFA 的正确设计是服务端维护认证状态机：密码通过 → 状态置为 mfa_required → 仅当第二因素通过 → 置为 mfa_passed → 才放行受保护接口。缺陷都在「状态机有洞」：① 第一步通过后直接放行后续页面（服务端没标记「MFA 未完成」）；② 验证码在响应中返回（等于把答案发给攻击者）；③ 验证码可复用、无次数限制、与用户/会话不绑定；④ 备用码无限次尝试；⑤「记住此设备」的 Cookie 可伪造。为什么要状态机：如果服务端不记录「这一步走到哪了」，只靠前端页面顺序（先跳验证码页再跳主页）控制流程，攻击者直接请求主页 URL 就跳过了第二步——流程顺序必须由服务端说了算，前端只负责展示。',
  where:
    '登录第二步（短信/邮箱/图形验证码、TOTP）、备用码验证、「记住此设备」标记、管理员登录。',
  kinds: [
    { name: '步骤跳过', plain: '不做第二步直接进', signal: '第一步后直接访问后续页面成功' },
    { name: '验证码泄露', plain: '答案被返回给客户端', signal: '响应体含验证码明文' },
    { name: '验证码可复用/不限次', plain: '一次验证反复用、可爆破', signal: '同一验证码多次成功/可穷举' },
    { name: '记住设备伪造', plain: '设备标记可被构造', signal: 'Cookie 可预测/可篡改' },
  ],
  signals: [
    '第一步（密码）通过后，直接访问受保护页面即成功（未要求第二步）。',
    '验证码在响应中被返回；验证码可复用、无次数限制、与用户不绑定。',
    '备用码无限次尝试；「记住此设备」的 Cookie 可伪造。',
  ],
  impact:
    'MFA 形同虚设——密码泄露即等于账号失守（MFA 这道防线白加）；管理员账号同样可被绕过，扩大到全站失守。',
  verify: [
    '通过第一步后不走第二步，直接请求受保护接口/页面，看是否放行。',
    '抓第二步响应，检查验证码是否被返回。',
    '同一验证码重复使用、错多次后是否锁定（次数限制）。',
    '验证码是否与会话/用户绑定（换会话用同一验证码试试）。',
    '测「记住此设备」标记的可伪造性；测备用码的尝试次数限制。',
  ],
  protect: {
    root: '服务端维护认证状态机（mfa_required → mfa_passed），所有受保护接口校验最终状态，不依赖前端页面顺序。',
    harden: '验证码一次性、限次、绑定会话与用户；备用码一次性且限次；「记住设备」用签名令牌。',
    fallback: '异常尝试告警；审计留痕。',
  },
  mistakes: [
    '用前端页面跳转控制流程顺序（直接请求 URL 即绕过）。',
    '只保护「登录入口」不保护已登录接口（状态机没贯穿到每个受保护路由）。',
    '验证码做了一次性校验却不限尝试次数（可爆破）。',
    '「记住此设备」不做签名（伪造 Cookie 即免第二步）。',
  ],
  terms: ['mfa', 'authentication', 'captcha', 'rate-limiting'],
  relatedTerms: ['mfa', 'authentication', 'captcha'],
  pinyin: { full: 'mfa rao guo', joined: 'mfaraoguo', initial: 'mfrg' },
  related: ['weak-password', 'captcha-defect', 'persistent-token'],
  caseDemo: {
    material:
      '漏洞流程（演示样例，站点 example.com 开启 MFA）：\n1. 攻击者知道受害者密码，提交密码 → 服务端返回「请输入验证码」页面\n   ——但服务端已把会话标记为「已认证」（状态机缺失，只做了前端跳转）\n2. 攻击者不输验证码，直接请求受保护页面 /dashboard\n3. 服务端看到会话「已认证」→ 放行\n   → 仅凭密码进入，MFA 被绕过\n\n逻辑链自查：\n输入（正确密码 + 跳过第二步直接请求）\n→ 机制（服务端无 mfa_required/mfa_passed 状态，密码过即算认证完成）\n→ 结果（绕过 MFA 进入）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点为虚构，非现场运行、非真实系统。修法对照：服务端状态机要求 mfa_passed，第 3 步会话状态仍是 mfa_required，请求被拒。',
    source: 'demo',
  },
  guide: {
    why: 'MFA 的强度 = 流程的完整性，不是验证码本身有多难。盯「第二步没做，服务端放不放行」——这是最常见也最致命的洞。次盯验证码的生命周期（一次性/限次/绑定）与「记住设备」的可伪造性。',
    how: '① 第一步后直接请求受保护接口；② 抓验证码响应看是否泄露；③ 测复用/限次/绑定；④ 修复按「服务端状态机贯穿所有受保护接口 + 验证码一次性限次绑定 + 设备标记签名」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
};

const persistentToken: InteractiveEntry = {
  id: 'persistent-token',
  kind: 'vuln',
  chapter: 3,
  title: '「记住我」/ 持久登录令牌',
  hazard: 3,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['记住我', '持久登录', 'Remember Me', '自动登录令牌', '长期令牌'],
  oneLiner:
    '长期有效的自动登录令牌若可预测、不绑定设备、不轮换、可被窃取复用，等于给账号留了长期后门。',
  cause:
    '「记住我」令牌本意是免重复登录，安全要求是：随机不可预测、哈希存储、每次使用后轮换（旧的立即失效）、支持用户吊销。缺陷：令牌用可预测值（顺序 ID、时间戳）；明文/弱哈希存储；不轮换（一次窃取长期有效）；不绑定设备（异地可用不告警）；无吊销入口（用户发现异常也没法断）。令牌结构推荐「选择器 + 验证器」：选择器像储物柜号码牌（用来找到柜子，不敏感），验证器像柜门锁的钥匙（真正开锁的秘密，库里只存钥匙的哈希）——泄露库也拿不到可用令牌。为什么每次使用后要轮换：不轮换的令牌像「一把永不失效的钥匙」——一旦被偷（设备丢失、共享电脑、XSS），攻击者可无限期使用。轮换后每次使用都换新钥匙，旧的立刻作废；同一旧令牌再次出现就说明被复制了（重放），系统可立即吊销全部会话。',
  where: '登录页「记住我」勾选、自动登录 Cookie 生成与校验、多设备管理、长期 API 令牌。',
  kinds: [
    { name: '令牌可预测', plain: '能猜出他人令牌', signal: '有规律（自增/时间戳）' },
    { name: '令牌不轮换', plain: '用很久都不变', signal: '每次使用同一令牌' },
    { name: '令牌可重放', plain: '复制的令牌照样用', signal: '同令牌多地同时有效' },
    { name: '无吊销能力', plain: '用户断不掉', signal: '无「退出所有设备」入口' },
  ],
  signals: [
    '令牌值可预测（顺序、时间戳、短随机）。',
    '令牌长期不变（使用后不轮换）；异地使用不告警、不重新认证。',
    '无「查看/吊销已登录设备」入口。',
  ],
  impact: '长期账号冒用（数周甚至数月）；设备丢失/共享后持续暴露；无法止损（无吊销）。',
  verify: [
    '取「记住我」令牌观察形态（长度、字符集、可预测性）。',
    '使用一次后再使用旧令牌，看是否轮换（旧的失效吗）。',
    '复制令牌到另一设备使用，看是否绑定设备/告警。',
    '检查有无用户可见的吊销入口。',
  ],
  protect: {
    root: '令牌随机且哈希存储；使用「选择器 + 验证器」结构；每次使用后轮换（检测到重放即失效全部会话）。',
    harden: '绑定设备指纹；支持用户查看与吊销；长期令牌与会话令牌分离（权限最小化）。',
    fallback: '异常使用告警（异地、多设备同令牌）。',
  },
  mistakes: [
    '令牌不轮换（一次窃取长期有效——最常见）。',
    '令牌明文/弱哈希存库（库泄露即全体失守）。',
    '无吊销入口（用户发现异常无法断）。',
    '把「记住我」令牌当会话令牌用（权限过大）。',
  ],
  terms: ['persistent-token', 'session', 'authentication', 'signature'],
  relatedTerms: ['persistent-token', 'session', 'signature'],
  pinyin: { full: 'ji zhu wo ling pai', joined: 'jizhuwolingpai', initial: 'jzwlp' },
  related: ['session-management', 'jwt-defects', 'mfa-bypass'],
  caseDemo: {
    material:
      '漏洞流程（演示样例，站点 example.com 有「记住我」）：\n1. 受害者勾选「记住我」，获得持久令牌 P（不轮换、无绑定）\n2. 攻击者经共享电脑读到 P（或经 XSS 窃取）\n3. 攻击者在自己浏览器带上 P → 自动登录为受害者\n4. 之后每周重复使用 P，一直有效（无轮换、无吊销、无告警）\n   ——受害者「退出登录」只清了本地 Cookie，服务端 P 仍有效\n\n逻辑链自查：\n输入（窃取到的持久令牌）\n→ 机制（令牌不轮换、不绑定、服务端只认令牌值）\n→ 结果（长期自动登录为受害者）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与令牌为虚构，非现场运行、非真实系统。修法对照：每次使用后轮换（第 4 步旧 P 立即失效、重放触发全会话吊销）+ 选择器/验证器结构（窃到 Cookie 里的验证器也换不了新令牌）。',
    source: 'demo',
  },
  guide: {
    why: '持久令牌是「长期身份」，风险窗口比会话大一个量级。盯三个动作：生成随机吗、用后轮换吗、用户能吊销吗。三者缺一，「记住我」就变成「记住攻击者」。',
    how: '① 看令牌形态与存储方式；② 用一次后试旧令牌（轮换测试）；③ 跨设备试绑定与吊销入口；④ 修复按「随机 + 哈希存储 + 选择器/验证器 + 使用后轮换 + 可吊销」五件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
};

const captchaDefect: CardEntry = {
  id: 'captcha-defect',
  kind: 'vuln',
  chapter: 3,
  title: '验证码缺陷',
  hazard: 2,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['验证码缺陷', '图形验证码', '短信验证码', 'Captcha 缺陷'],
  oneLiner:
    '验证码只在前端校验、可重复使用、无时效、与业务无绑定时，人机校验形同虚设。',
  cause:
    '验证码本意是「挡住批量自动化」，失效方式都是「校验没做到位」：① 只在前端校验（抓包删参数即绕过）；② 可重复使用（一次通过多次有效）；③ 可被 OCR 识别（图形形同虚设）；④ 无时效（长期有效）；⑤ 与业务无绑定（验证码未绑手机号/会话——短信可被「轰炸」、验证码可被挪用）；⑥ 验证码接口返回明文答案。',
  where:
    '登录、注册、找回密码、短信发送接口、敏感操作二次确认、评论/发帖防灌水。',
  kinds: [
    { name: '前端校验', plain: '只有浏览器在查', signal: '抓包删参数仍成功' },
    { name: '可复用', plain: '一次验证多次有效', signal: '同一验证码多次成功' },
    { name: '无时效/无绑定', plain: '长期有效、可挪用', signal: '过期仍可用、未绑会话' },
    { name: '答案泄露', plain: '答案被返回', signal: '响应体含明文答案' },
  ],
  signals: [
    '抓包删除验证码参数仍成功。',
    '同一验证码可用多次；验证码接口返回明文答案。',
    '验证码未与手机号/会话绑定（可被挪用；短信接口可被轰炸）。',
  ],
  impact:
    '人机校验失效——批量注册、爆破、撞库重新可行；短信轰炸（骚扰 + 成本）；验证码挪用完成他人验证步骤。',
  verify: [
    '抓包删除/修改验证码参数，看请求是否仍成功（前端校验检测）。',
    '同一验证码重复使用；等待超过合理时间再用（时效检测）。',
    '检查验证码是否与会话/手机号/业务绑定（挪用检测）。',
    '检查验证码答案是否出现在响应中；短信发送是否有频率限制（手机号/IP/设备维度）。',
  ],
  protect: {
    root: '服务端校验 + 一次性 + 短时效（≤5 分钟）+ 与业务标识绑定（手机号/会话/用途）。',
    harden: '发送频率限制（手机号/IP/设备三维度）；图形验证码防 OCR（干扰、行为式）；验证码答案不返回客户端。',
    fallback: '异常验证行为告警；风控补充。',
  },
  mistakes: [
    '只做前端校验（最常见——抓包即绕过）。',
    '验证码不绑定业务（A 处验证码挪到 B 处用）。',
    '防了 OCR 却不限发送频率（短信轰炸照旧）。',
    '以为「有验证码就不用限速」——验证码挡自动化，限速挡批量，两者都要。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某登录页有图形验证码，但抓包把 captcha 参数删掉后请求仍登录成功。',
      question: '这说明什么？',
      options: [
        { text: '验证码只在前端校验，服务端没查', correct: true, explain: '正确。前端校验可以被绕过（删参数、改请求），服务端不校验等于没有。' },
        { text: '验证码太简单被 OCR 了', correct: false, explain: '错误。请求里根本没有验证码参数，与识别难度无关。' },
        { text: '这是暴力破解', correct: false, explain: '错误。爆破是攻击行为，这里是防护缺失。' },
        { text: 'HTTPS 没开', correct: false, explain: '错误。与传输加密无关。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 服务端校验 + 一次性 + 与会话绑定 + 5 分钟过期；② 把图形做得更花；③ 只在前端加校验；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 服务端一次性校验 + 绑定 + 时效', correct: true, explain: '正确。服务端校验堵住删参数，一次性堵住复用，绑定堵住挪用，时效堵住长期有效。' },
        { text: '② 图形更花', correct: false, explain: '错误。防 OCR 有用但不解决删参数/复用/挪用。' },
        { text: '③ 前端校验', correct: false, explain: '错误。抓包绕过，正是缺陷本身。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 管不住业务校验逻辑。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「短信验证码 6 位数字，够安全了」。',
      question: '忽略了什么？',
      options: [
        { text: '6 位也要限尝试次数、绑定手机号、限发送频率——否则可爆破、可挪用、可轰炸', correct: true, explain: '正确。位数只影响爆破成本，不限次/不绑定/不限频照样失守。' },
        { text: '位数改成 8 位就行', correct: false, explain: '错误。治标不治本。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。与传输无关。' },
        { text: '有图形验证码就不用管短信了', correct: false, explain: '错误。短信接口是独立风险面（轰炸、爆破）。' },
      ],
    },
  ],
  terms: ['captcha', 'rate-limiting', 'mfa', 'authentication'],
  relatedTerms: ['captcha', 'rate-limiting', 'mfa'],
  pinyin: { full: 'yan zheng ma que xian', joined: 'yanzhengmaquexian', initial: 'yzmqx' },
  related: ['brute-force-enumeration', 'mfa-bypass', 'weak-password'],
  source: 'demo',
  format: 'card',
};

export const ch3Entries: LearningEntry[] = [
  weakPassword,
  bruteForceEnumeration,
  sessionManagement,
  jwtDefects,
  oauthDefects,
  ssoSaml,
  passwordReset,
  mfaBypass,
  persistentToken,
  captchaDefect,
];

export default ch3Entries;
