/**
 * 客户端攻击（XSS 家族）—— 10 条。内容逐字取自 docs/09 v2。
 * 低 6 条（xss/csrf/clickjacking/open-redirect/css-injection/client-storage-leak）= 形态 A 知识卡 + 3 题；
 * 中 4 条（prototype-pollution/postmessage-communication/dom-clobbering/frontend-supply-chain）= 形态 B 案例演示 + 指导（stages 留空，templateId 预留）。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, CardEntry, InteractiveEntry } from './types';

const xss: CardEntry = {
  id: 'xss',
  kind: 'vuln',
  chapter: 2,
  title: '跨站脚本（XSS）',
  hazard: 4,
  difficulty: 'beginner',
  scene: ['Web'],
  aliases: ['跨站脚本', 'XSS', 'Cross-Site Scripting', '反射型 XSS', '存储型 XSS', 'DOM 型 XSS'],
  oneLiner:
    '用户可控内容未经输出编码就进入 HTML 页面，浏览器将其当作脚本执行，攻击者可借受害者身份操作页面、窃取凭证。',
  cause:
    '输出位置把用户数据拼进页面而未做上下文编码。输出上下文决定载荷形态与修复方式：HTML 正文（如 <div>用户输入</div>）标签被解析，需 HTML 实体编码；HTML 属性（如 <input value="用户输入">）引号逃逸后可挂 on* 事件；JS 上下文（如 var a = "用户输入";）引号/反斜杠逃逸进脚本；CSS 上下文（如 style="background:url(用户输入)"）可注入样式规则；URL 上下文（如 <a href="用户输入">）javascript: 伪协议可执行。',
  where:
    '搜索框回显、错误页、跳转参数、评论/昵称/工单/后台列表（存储型）、富文本编辑器、Markdown 渲染、PDF 预览、SVG 上传、文件名展示、导出文件与邮件通知。',
  kinds: [
    { name: '反射型', plain: '请求 → 服务端 → 立刻回显；需诱导点击，一次性', signal: '搜索框、错误页、跳转参数' },
    { name: '存储型', plain: '请求 → 入库 → 他人访问时输出；无需交互、可蠕虫化，最危险', signal: '评论、昵称、工单、后台列表' },
    { name: 'DOM 型', plain: '前端脚本直接读取不可信源写入危险位置；服务端日志里看不到载荷', signal: 'innerHTML、document.write、eval、location' },
  ],
  signals: [
    '输入 <b>test</b> 后页面出现加粗（HTML 标签被解析）。',
    '输入 "><img src=x onerror=alert(1)> 触发弹窗（演示样例，无害验证载荷）。',
    '输入 javascript:alert(1) 放进链接后点击可执行。',
    '单引号/双引号/反斜杠导致页面脚本报错（说明处于 JS 字符串上下文）。',
  ],
  impact:
    '窃取 Cookie / localStorage 中的凭证（无 HttpOnly 时）；以受害者身份发起转账、改密、加管理员等操作；键盘记录、伪造登录框钓鱼；借助受害者浏览器探测内网；存储型 XSS 在管理后台触发时可直接触及管理员权限。为什么 XSS 能绕过 CSRF 防护：CSRF 防护的核心假设是「攻击者拿不到 Token」；XSS 让攻击者能在受害者浏览器里执行脚本，自然就能读到页面里的 Token——所以只要存在 XSS，CSRF 防护就形同虚设。这也是 XSS 危险度通常高于 CSRF 的原因：前者能直接突破后者。',
  verify: [
    '找所有回显点：搜索关键词是否出现在响应里（含 JS 变量、属性、注释、JSON 返回）。',
    '判断上下文，用最小编码验证：HTML 上下文用 <b>，属性用 "，JS 用 \';。',
    '验证可执行性：把无害标记（alert(1) 或 console.log）放到真实上下文，确认浏览器真的执行。',
    '检查防护强度：是否只过滤 <script>（<img onerror>、<svg onload> 可绕）；是否只在前端过滤（抓包绕过）。',
    'DOM 型：搜源码中 innerHTML、outerHTML、document.write、eval、location.hash、postMessage，追踪数据流。',
    '存储型：提交后到所有展示位置查看（列表、详情、导出文件、邮件通知、后台审核页）。',
  ],
  protect: {
    root: '按上下文输出编码——HTML 实体编码、属性编码、JS 字符串编码、URL 编码、CSS 编码，一套编码不能打天下。富文本用成熟净化库做标签/属性白名单（如 DOMPurify）。',
    harden: "CSP（default-src 'self'; script-src 'self' 'nonce-…'，禁用 unsafe-inline）；Cookie 加 HttpOnly + Secure + SameSite；框架默认转义保持有效，重点审查 dangerouslySetInnerHTML、v-html；前端用 textContent 替代 innerHTML。",
    fallback: 'WAF 规则仅作兜底；编码变形、分片、注释常可绕过单一规则。',
  },
  mistakes: [
    '只做输入过滤（黑名单）不做输出编码——绕过方式无穷。',
    '只在搜索框测，忽略 Header、文件名、JSON 错误信息、日志展示页。',
    '忘记二次编码问题：URL 编码后又被解码，导致绕过。',
    '认为「有 WAF 就安全」。',
    '忽略 <svg>、<math>、<details> 等非 script 执行向量。',
    '把 DOM 型 XSS 当成服务端问题排查——它的载荷在服务端日志里根本看不到。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某评论区提交 <b>hi</b>，重新打开评论列表时 hi 显示为加粗。',
      question: '这说明什么？',
      options: [
        { text: '输出未经编码，HTML 标签被浏览器解析了', correct: true, explain: '正确。本该是纯文字的内容被当成标记渲染，这是 XSS 的第一信号。' },
        { text: '浏览器把字体自动加粗了', correct: false, explain: '错误。加粗是 <b> 标签被解析的结果，不是浏览器自动行为。' },
        { text: '网络传输丢了部分数据', correct: false, explain: '错误。数据完整到达并被渲染，问题在输出端。' },
        { text: '这是 SQL 注入', correct: false, explain: '错误。没有碰数据库，问题在页面渲染。' },
      ],
    },
    {
      kind: 'protect',
      material: '同一评论区，开发给出四种改法：① 输出时做 HTML 实体编码；② 过滤 <script 关键字；③ 前端限制输入 20 个字符；④ 加一层 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 按上下文输出编码', correct: true, explain: '正确。编码后 < 变成文字实体，标签永远不会被解析——根治。' },
        { text: '② 过滤 <script', correct: false, explain: '错误。<img onerror>、<svg onload>、大小写与编码变形都能绕。' },
        { text: '③ 限制长度', correct: false, explain: '错误。短载荷同样可执行（如 <svg/onload=…>）。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底，不替代输出编码。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「输入里含 <script 的一律拒绝，安全了」。',
      question: '为什么不够？',
      options: [
        { text: '执行向量不止 <script>，根治是输出编码不是黑名单', correct: true, explain: '正确。事件属性、svg/math 标签、编码变形都能触发执行。' },
        { text: '过滤得再全一点就够了', correct: false, explain: '错误。黑名单永远追不完新向量。' },
        { text: '只要前端也过滤一遍就安全', correct: false, explain: '错误。前端过滤可被抓包绕过，服务端输出编码才是关键。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。HTTPS 保护传输，不解决页面把输入当脚本执行。' },
      ],
    },
  ],
  terms: ['xss', 'output-encoding', 'html-sanitize', 'csp', 'cookie-flags', 'waf'],
  relatedTerms: ['output-encoding', 'html-sanitize', 'csp', 'cookie-flags'],
  pinyin: { full: 'kua zhan jiao ben', joined: 'kuazhanjiaoben', initial: 'kzjb' },
  related: ['csrf', 'open-redirect', 'client-storage-leak', 'm01-three-laws'],
  realCases: [
    { refId: 'RC-201', summary: '某社交平台存储型 XSS 蠕虫（成因：个人简介字段未编码入库展示；教训：输出编码 + 净化库白名单）', lesson: '输出编码 + 净化库白名单', source: 'PortSwigger Web Security Academy — XSS 实验', credibility: '平台' },
    { refId: 'RC-202', summary: '某论坛反射型 XSS 经搜索参数触发（成因：关键词回显未编码；教训：按上下文编码）', lesson: '按上下文编码', source: 'OWASP XSS 防护说明', credibility: '权威' },
  ],
  source: 'demo',
  format: 'card',
};

const csrf: CardEntry = {
  id: 'csrf',
  kind: 'vuln',
  chapter: 2,
  title: '跨站请求伪造（CSRF）',
  hazard: 3,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['CSRF', '跨站请求伪造', 'Cross-Site Request Forgery', 'XSRF'],
  oneLiner:
    '攻击者诱导已登录用户在不知情下向目标站点发出带凭证的请求，借其登录态完成改密、转账等敏感操作。',
  cause:
    '服务端仅靠 Cookie 识别身份，且不校验请求是否来自本站——没有不可预测的随机 Token、没有 Origin/Referer 校验、Cookie 缺 SameSite。浏览器的自动凭证携带机制被利用：任何页面发出的同站请求都会附带用户的登录 Cookie。',
  where:
    '改密、改邮箱、绑卡、下单、转账、加管理员、授权第三方应用等一切改变状态的接口；GET 方法实现的敏感操作尤其危险。',
  kinds: [
    { name: '经典表单 CSRF', plain: '自动提交的跨站表单带用户 Cookie 发请求', signal: '敏感操作无随机 Token' },
    { name: 'JSON CSRF', plain: 'Content-Type: text/plain 的跨域表单可被服务端接受', signal: '接受非 JSON 内容类型' },
    { name: '登录 CSRF', plain: '强迫受害者登录攻击者账号后留下操作痕迹', signal: '登录接口无来源校验' },
  ],
  signals: [
    '关键操作（改密、改邮箱、下单、加管理员）没有任何随机 Token。',
    '请求参数完全可预测；GET 方法就能完成敏感操作。',
    '删除 Referer 头后请求依旧成功。',
    'Content-Type: text/plain 的跨域表单能被服务端接受。',
  ],
  impact:
    '以受害者身份执行敏感操作（改密、转账、绑卡、授权）；常与 XSS 组合——XSS 可直接读取 Token，绕过 CSRF 防护，此时 CSRF 防护形同虚设。',
  verify: [
    '抓取敏感操作请求，看是否有不可预测的 Token 且服务端强校验。',
    "检查 Cookie 的 SameSite 属性（Lax 挡住大部分跨站 POST，但挡不住顶层 GET 导航）。顶层 GET 导航示例（演示样例）：攻击者诱导用户点击 <a href='https://bank.com/transfer?to=attacker&amount=1000'>点我领红包</a>——点击后浏览器顶层跳转到银行网站，SameSite=Lax 的 Cookie 会被携带，转账请求生效。这是 Lax 的已知边界，敏感操作不能只靠 Lax。",
    '去掉 Referer / 改成外域后重放请求，看是否仍成功。',
    '尝试把 POST 改 GET、把 JSON 改 form 或 text/plain，看是否被接受。',
    '构造 PoC HTML（自动提交表单，演示样例）验证。',
  ],
  protect: {
    root: 'CSRF Token——每会话/每请求随机、与用户绑定、服务端强校验（不在前端校验）；敏感操作不用 GET。',
    harden: 'Cookie SameSite=Lax 起步、敏感操作配 Strict；校验 Origin / Referer 作辅助；敏感操作二次确认（密码/短信验证码）。',
    fallback: 'WAF 对跨站表单特征做拦截，仅作兜底。',
  },
  mistakes: [
    '只保护「改密」，忽略改邮箱/绑卡/授权第三方——这些同样能接管账号。',
    'Token 可复用、不与用户绑定、过期不限。',
    '只在前端校验 Token，服务端照单全收。',
    '以为 SameSite=Lax 就万事大吉——顶层 GET 导航仍可触发。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '用户登录某银行网站后访问第三方页面；该页面含一个隐藏表单自动提交到银行的转账接口，转账在用户不知情时完成。',
      question: '这是什么问题？',
      options: [
        { text: '跨站请求伪造——浏览器自动带上了用户的登录凭证', correct: true, explain: '正确。用户已登录、浏览器自动携带 Cookie、请求由第三方页面发起，三者凑齐就是 CSRF。' },
        { text: '跨站脚本——第三方页面执行了银行的脚本', correct: false, explain: '错误。没有脚本在银行页面执行，只是借身份发请求。' },
        { text: '银行密码被猜到了', correct: false, explain: '错误。全程没有涉及密码，凭证是浏览器自动带的。' },
        { text: '网络被劫持', correct: false, explain: '错误。链路安全与否与此无关，问题在身份校验机制。' },
      ],
    },
    {
      kind: 'protect',
      material: '同一转账接口，开发给出四种改法：① 每次请求带随机 CSRF Token，服务端强校验；② 校验 Referer 必须含本站域名；③ 转账改用 POST；④ 全站加 HTTPS。',
      question: '哪个是根治？',
      options: [
        { text: '① CSRF Token 服务端强校验', correct: true, explain: '正确。Token 不可预测且与会话绑定，跨站页面拿不到，伪造请求无法通过。' },
        { text: '② 只校验 Referer', correct: false, explain: '错误。Referer 可被剥掉或伪造，只能作辅助。' },
        { text: '③ 改 POST', correct: false, explain: '错误。跨站表单同样能发 POST。' },
        { text: '④ 加 HTTPS', correct: false, explain: '错误。HTTPS 保护传输，不阻止跨站携带凭证。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发只给「修改密码」加了 CSRF Token，改邮箱、绑卡、授权第三方应用都没有。',
      question: '这样够吗？',
      options: [
        { text: '不够——改邮箱/绑卡/授权同样可用来接管账号', correct: true, explain: '正确。所有状态变更接口都要保护，接管路径不止改密一条。' },
        { text: '够了，改密最危险', correct: false, explain: '错误。改邮箱后走「忘记密码」即可接管，风险同级。' },
        { text: '只要 Token 不重复使用就不用保护其他接口', correct: false, explain: '错误。Token 复用与覆盖面是两个问题。' },
        { text: '加一层 WAF 就不用管了', correct: false, explain: '错误。WAF 是兜底，覆盖面缺失必须补。' },
      ],
    },
  ],
  terms: ['csrf', 'cookie-flags', 'same-origin-policy', 'waf'],
  relatedTerms: ['cookie-flags', 'same-origin-policy', 'xss'],
  pinyin: { full: 'kua zhan qing qiu wei zao', joined: 'kuazhanqingqiuweizao', initial: 'kzqqwz' },
  related: ['xss', 'clickjacking', 'client-storage-leak'],
  realCases: [
    { refId: 'RC-203', summary: '某邮箱服务改密接口 CSRF（成因：状态变更接口无随机 Token；教训：Token 服务端强校验 + SameSite）', lesson: 'Token 服务端强校验 + SameSite', source: 'PortSwigger Web Security Academy — CSRF 实验', credibility: '平台' },
  ],
  source: 'demo',
  format: 'card',
};

const clickjacking: CardEntry = {
  id: 'clickjacking',
  kind: 'vuln',
  chapter: 2,
  title: '点击劫持（Clickjacking）',
  hazard: 2,
  difficulty: 'beginner',
  scene: ['Web'],
  aliases: ['点击劫持', 'Clickjacking', 'UI 覆盖攻击', '界面伪装'],
  oneLiner:
    '攻击者用透明 iframe 覆盖目标页面，诱导用户点击「看起来是别的按钮」的位置，实际触发授权、转账、删除等操作。',
  cause:
    '页面允许被任意站点嵌入 iframe，且敏感操作只需要一次点击。攻击者把自己的页面垫在下面、把目标页面透明化叠在上面，用户看到的是攻击者设计的界面，点到的却是目标页面的真实按钮。',
  where: 'OAuth 授权页、支付/转账按钮、关注/点赞、删除/注销、开启摄像头/麦克风的授权提示。',
  kinds: [
    { name: '全页覆盖', plain: '目标页整页透明叠放', signal: '整页被嵌入' },
    { name: '局部覆盖', plain: '只盖住目标页的某一个按钮区域', signal: '按钮区域被覆盖' },
  ],
  signals: [
    '响应头缺少 X-Frame-Options 与 CSP frame-ancestors。',
    '页面 JS 有 top != self 之类的 frame busting 逻辑，但可被 sandbox 属性绕过。',
    '目标页能被任意来源 iframe 嵌入且不报错。',
  ],
  impact:
    '诱导用户完成 OAuth 授权（授权给攻击者应用）、诱导转账、诱导开启摄像头/麦克风、诱导删除数据——一切「一次点击即生效」的敏感操作都可被劫持。',
  verify: [
    '检查响应头是否有 X-Frame-Options: DENY/SAMEORIGIN 或 CSP frame-ancestors。',
    '用本地 HTML（演示样例）把目标页嵌进 iframe 并设透明度，看是否成功嵌入。',
    '若有 JS frame busting，尝试 iframe 加 sandbox 属性，看是否被绕过。',
  ],
  protect: {
    root: "Content-Security-Policy: frame-ancestors 'self'（或白名单来源）；X-Frame-Options: DENY / SAMEORIGIN。优先级：两者同存时以 CSP frame-ancestors 为准（X-Frame-Options 是旧标准、语义更粗）；但老旧浏览器可能只认 X-Frame-Options——兼容起见两个响应头都配，效果取交集。",
    harden: '敏感操作增加二次确认（输入密码/验证码）；重要页面可检测自身是否被嵌入并跳转脱壳。',
    fallback: '提示用户留意页面完整性，仅作辅助。',
  },
  mistakes: [
    '只用 JS frame busting（if (top != self) …）——sandbox 属性可绕过。',
    '只保护首页，支付页/授权页反而裸奔。',
    '以为「页面视觉上没有 iframe 就没事」——透明嵌入不留痕迹。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某抽奖页把一个透明 iframe 盖在「立即抽奖」按钮上，iframe 里的目标是某网盘的「删除文件」按钮；用户点「抽奖」，文件被删除。',
      question: '这是什么攻击？',
      options: [
        { text: '点击劫持——用透明层把用户的点击引到别的按钮上', correct: true, explain: '正确。用户以为点的是抽奖，实际点到的是被覆盖的真实按钮。' },
        { text: 'CSRF——借用户身份发了删除请求', correct: false, explain: '错误。CSRF 是「自动带凭证发请求」，不需要用户点击；这里是诱导点击。' },
        { text: 'XSS——页面被注入了脚本', correct: false, explain: '错误。目标页面没有被注入脚本，只是被嵌入。' },
        { text: '钓鱼——伪造了网盘页面', correct: false, explain: '错误。页面是真实的，被嵌入的是真页面。' },
      ],
    },
    {
      kind: 'protect',
      material: "开发给出四种改法：① 响应头加 Content-Security-Policy: frame-ancestors 'self'；② JS 里判断 top != self 就跳转；③ 弹窗提醒用户别乱点；④ 把按钮改成两步确认。",
      question: '哪个是根治？',
      options: [
        { text: '① 用 frame-ancestors 禁止被嵌入', correct: true, explain: '正确。浏览器层面直接拒绝嵌入，透明层无从叠起。' },
        { text: '② JS frame busting', correct: false, explain: '错误。可被 sandbox 属性绕过，只算加固。' },
        { text: '③ 提醒用户', correct: false, explain: '错误。透明层用户根本看不见，提醒无效。' },
        { text: '④ 两步确认', correct: false, explain: '错误。这是加固手段（也有用），但根治是禁止嵌入。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「我加了 if (top != self) top.location = self.location，安全了」。',
      question: '为什么不够？',
      options: [
        { text: 'iframe 加 sandbox 属性就能绕过这段 JS', correct: true, explain: '正确。JS 判断运行在被嵌入页里，sandbox 可限制脚本执行从而绕过；必须用响应头。' },
        { text: '这段代码写得不对，改对就行', correct: false, explain: '错误。思路本身不可靠，改语法没用。' },
        { text: '只要在 HTTPS 下就安全', correct: false, explain: '错误。与传输加密无关。' },
        { text: '加 WAF 就行', correct: false, explain: '错误。WAF 管不到浏览器的嵌入行为。' },
      ],
    },
  ],
  terms: ['clickjacking', 'frame-protection', 'csp', 'csrf'],
  relatedTerms: ['frame-protection', 'csp', 'csrf'],
  pinyin: { full: 'dian ji jie chi', joined: 'dianjijiechi', initial: 'djjc' },
  related: ['csrf', 'xss'],
  realCases: [
    { refId: 'RC-204', summary: '某 OAuth 授权页可被嵌套导致误授权（成因：授权页无 frame-ancestors 限制；教训：授权页禁止被嵌入 + 二次确认）', lesson: '授权页禁止被嵌入 + 二次确认', source: 'OWASP Clickjacking 防护说明', credibility: '权威' },
  ],
  source: 'demo',
  format: 'card',
};

const prototypePollution: InteractiveEntry = {
  id: 'prototype-pollution',
  kind: 'vuln',
  chapter: 2,
  title: '原型污染（Prototype Pollution）',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['原型污染', 'Prototype Pollution', '__proto__ 污染'],
  oneLiner:
    '攻击者用 __proto__、constructor.prototype 等键名污染 JS 对象的共享原型，使所有对象继承恶意属性，轻则逻辑绕过，重则在 Node 服务端达成代码执行。',
  cause:
    '递归合并/深拷贝函数对键名不设防——用户控制的键名一路写进对象原型。高发位置：不安全的 merge/extend/cloneDeep、JSON.parse 后按路径赋值、URL 参数解析库、模板渲染的属性访问、Node 服务端的配置合并。',
  where:
    '前后端的对象合并工具函数、配置合并、lodash 等库的深合并调用点、表单/JSON 结构动态赋值处。',
  kinds: [
    { name: '原型链污染', plain: '通过 __proto__ 键改写对象底座', signal: 'Object.prototype 上出现意外属性' },
    { name: '构造器污染', plain: '通过 constructor.prototype 间接改写', signal: 'constructor[prototype] 路径赋值生效' },
    { name: '服务端污染', plain: 'Node 侧合并被污染，触发危险调用链', signal: '报错消失、默认值异常、拒绝服务' },
  ],
  signals: [
    '传 {"__proto__":{"isAdmin":true}} 后权限判断被绕过。',
    '传 ?__proto__[x]=1 后全局对象出现该属性。',
    '前端库报错消失或出现意外默认值；服务端出现拒绝服务（污染 toString 等内置属性）。',
  ],
  impact:
    '前端逻辑绕过（可串成 XSS 等利用链）、服务端拒绝服务、Node.js 环境下借助调用链可达远程代码执行（RCE）。',
  verify: [
    '找所有「接收对象并递归合并」的入口（配置、表单、JSON、URL 参数解析）。',
    '用 __proto__、constructor[prototype]、prototype 三种键名分别测试。',
    '用 Object.prototype.x 是否被设置确认污染成立（演示样例，无害属性即可）。',
    'Node 侧再评估是否存在可被污染触发的危险调用链（只在授权环境评估）。',
  ],
  protect: {
    root: '合并前过滤 __proto__、constructor、prototype 三个键；用 Object.create(null) 或 Map 承接用户数据。',
    harden: 'JSON.parse 后做 schema 校验（字段与类型白名单）；升级有修复的依赖版本。',
    fallback: '运行时监控异常属性出现，仅作兜底。',
  },
  mistakes: [
    '只测前端忽略 Node 服务端（服务端才是 RCE 的入口）。',
    '只测 __proto__ 不测 constructor.prototype——两条路径都要堵。',
    '把「合并前过滤」写在一处，另一处调用忘了复用同一工具函数。',
  ],
  terms: ['prototype-pollution', 'prototype-chain', 'rce', 'type-validation'],
  relatedTerms: ['prototype-chain', 'type-validation', 'rce'],
  pinyin: { full: 'yuan xing wu ran', joined: 'yuanxingwuran', initial: 'yxwr' },
  related: ['xss', 'postmessage-communication', 'dom-clobbering'],
  caseDemo: {
    material:
      '接口：POST /api/settings  （body 为 JSON，服务端做深合并）\n请求体：\n{ "theme": "dark", "__proto__": { "isAdmin": true } }\n\n合并后控制台验证（演示样例）：\n> ({ }).isAdmin\n  true        ← 所有对象都继承到了 isAdmin',
    language: 'plaintext',
    note: '材料为演示样例，非现场运行、非真实系统；验证属性为无害标记。',
    source: 'demo',
  },
  guide: {
    why: '注入点不在引号，而在键名。普通字段写进对象，__proto__ 这类特殊键写进的是「所有对象共享的底座」——一个键污染全场，这是它比普通注入更隐蔽的地方。',
    how: '① 找到「用户数据被合并进对象」的位置；② 用无害标记（如 polluted: 1）试三种键名；③ 检查 Object.prototype 是否多出属性；④ 成立即按「合并前过滤三个键」修，再评估服务端调用链。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-INJECT',
  source: 'demo',
  format: 'interactive',
};

const postmessageCommunication: InteractiveEntry = {
  id: 'postmessage-communication',
  kind: 'vuln',
  chapter: 2,
  title: 'postMessage 跨窗口通信缺陷',
  hazard: 3,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['postMessage', '跨窗口通信缺陷', 'message 事件注入', '跨域消息'],
  oneLiner:
    '页面接收跨窗口消息时不校验来源与消息结构，任意站点都能向它注入指令或窃取数据，消息内容直达危险汇聚点时可升级为 XSS。',
  cause:
    "addEventListener('message', …) 回调里不校验 event.origin 与 event.source，或 postMessage(data, '*') 使用通配目标来源；消息内容直接进 innerHTML、eval 等危险汇聚点。高发位置：iframe 嵌入的支付/登录组件、跨域父子页面通信、微前端消息总线。",
  where:
    '父子窗口/iframe 之间传数据的页面、SDK 接收配置的页面、跨域单点登录回调。',
  kinds: [
    { name: '来源不校验', plain: '任何站点都能发消息进来', signal: '监听器里没有 origin 白名单' },
    { name: '目标用通配', plain: '消息发给「所有窗口」', signal: "postMessage(data, '*')" },
    { name: '消息进危险点', plain: '消息内容直接当 HTML/脚本', signal: '消息体流入 innerHTML/eval' },
  ],
  signals: [
    "源码中 addEventListener('message', …) 内没有 origin 校验。",
    "postMessage(data, '*') 使用通配目标来源。",
    '消息内容直接进 innerHTML 或 eval。',
  ],
  impact: '跨域数据窃取（token、用户信息）、消息驱动的 DOM XSS、在嵌入方页面执行越权操作。',
  verify: [
    '搜源码所有 message 事件监听与 postMessage 调用。',
    '检查监听器是否用白名单精确匹配 event.origin（协议+域名+端口全等）。',
    '追踪消息体去向：是否流入 innerHTML/eval/location 等危险汇聚点。',
    '用外部测试页（演示样例）发送伪造消息，观察目标页行为变化。',
  ],
  protect: {
    root: "严格校验 event.origin——白名单精确匹配（协议+域名+端口全等），不用 indexOf/includes 子串判断；postMessage 指定确切目标 origin，不用 *。",
    harden: '校验 event.source；消息体做结构校验（字段白名单、类型校验，复用 type-validation）；消息内容输出前按上下文编码。',
    fallback: 'CSP 限制可嵌入来源，仅作兜底。',
  },
  mistakes: [
    "用 origin.includes('trusted.com') 判断——trusted.com.evil.com 可绕过。",
    '只校验前缀不校验协议与端口（http 冒充 https、端口偷换）。',
    '以为「消息来自 iframe 就可信」——iframe 的来源仍需校验。',
  ],
  terms: ['postmessage-communication', 'origin-check', 'same-origin-policy', 'xss'],
  relatedTerms: ['same-origin-policy', 'origin-check', 'xss'],
  pinyin: { full: 'kua chuang kou tong xin que xian', joined: 'kuachuangkoutongxinquexian', initial: 'kcktxqx' },
  related: ['xss', 'dom-clobbering', 'prototype-pollution'],
  caseDemo: {
    material:
      "目标页（演示样例）：\nwindow.addEventListener('message', (e) => {\n  document.getElementById('box').innerHTML = e.data.html;   // 无 origin 校验\n});\nwindow.parent.postMessage({ token: 'abc123' }, '*');        // 通配目标\n\n攻击页（演示样例，同浏览器另一标签）：\ntarget.postMessage({ html: '<img src=x onerror=…>' }, '*');\n→ 目标页面执行注入内容；且 token 已被通配广播出去",
    language: 'plaintext',
    note: '材料为演示样例，载荷为无害验证标记，非现场运行、非真实系统。',
    source: 'demo',
  },
  guide: {
    why: 'message 事件是浏览器里的「收件口」，任何窗口都可投递。安全性全靠两道闸：来源校验（谁寄的）与消息结构校验（里面是什么）——两道都缺，收件口就是敞开的。',
    how: '① 盯监听器第一行有没有 event.origin 精确匹配；② 看发送侧第二个参数是不是 *；③ 追消息体流向是否进 innerHTML/eval；④ 修复按「精确来源白名单 + 结构校验」两件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CLIENT',
  source: 'demo',
  format: 'interactive',
};

const openRedirect: CardEntry = {
  id: 'open-redirect',
  kind: 'vuln',
  chapter: 2,
  title: '开放重定向（Open Redirect）',
  hazard: 2,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['开放重定向', 'Open Redirect', '跳转漏洞', '重定向注入'],
  oneLiner:
    '跳转目标完全由用户参数控制，攻击者可把用户从可信域名导向钓鱼站点，链接因此带上了可信外衣。',
  cause:
    '跳转地址直接取自用户参数而不做目标校验，或只做「包含可信域名」的子串校验。高发位置：登录后回跳（next/returnUrl）、退出跳转、短链服务、OAuth redirect_uri、callback 参数。',
  where: 'next、return、redirect、url、callback、continue 等跳转参数。',
  kinds: [
    { name: '协议相对跳转', plain: '//evil.com 省略协议照样跳', signal: '跳转到外域' },
    { name: '符号绕过', plain: 'https:evil.com、@evil.com、/\\evil.com', signal: '解析结果与预期不符' },
    { name: '子串匹配绕过', plain: 'trusted.com.evil.com 骗过「包含即通过」', signal: '白名单校验形同虚设' },
  ],
  signals: [
    '?next=https://evil.com、?returnUrl=//evil.com、?url=/\\evil.com 均能跳出本站。',
    '跳转参数可改成任意外域而无提示。',
    'OAuth 场景下 redirect_uri 只做前缀/子串校验。',
  ],
  impact:
    '钓鱼（链接域名可信、受害者不易起疑）；OAuth 授权码被导向攻击者域名（复用 oauth-redirect 术语）；配合 SSRF 白名单绕过（跳转点被当作可信出口）。',
  verify: [
    '收集所有跳转参数（next/return/redirect/url/callback/continue）。',
    '测试 //evil.com、https:evil.com、@evil.com、%2f%2fevil.com 等变体（演示样例，指向无害测试地址）。',
    '测白名单子串匹配绕过：trusted.com.evil.com。',
    'OAuth 场景重点核对 redirect_uri 校验方式。',
  ],
  protect: {
    root: '跳转目标用相对路径白名单或映射表（id → 真实 URL），绝不直接使用用户传入的完整 URL；必须支持外跳时，解析 URL 后对 host 做全等比较。',
    harden: '跳转前提示「即将离开本站」；OAuth redirect_uri 用精确注册值比对。',
    fallback: '网关层对跳转参数做外域告警，仅作兜底。',
  },
  mistakes: [
    '只校验「是否包含可信域名」——trusted.com.evil.com 子串绕过。',
    '只校验 http:// 前缀——//evil.com、https:evil.com 照样跳。',
    '只防钓鱼不看 OAuth 场景——redirect_uri 失守直接丢授权码。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某登录页 ?next=//evil.example，登录成功后浏览器跳到 evil.example，地址栏闪过的却是本站登录链接。',
      question: '这是什么问题？',
      options: [
        { text: '开放重定向——跳转目标被用户参数控制', correct: true, explain: '正确。可信域名做外衣、实际落点是外域，正是钓鱼的温床。' },
        { text: 'XSS——跳转页执行了脚本', correct: false, explain: '错误。没有脚本执行，只是跳去了外域。' },
        { text: 'CSRF——借身份发了请求', correct: false, explain: '错误。没有对本站发伪造请求。' },
        { text: '服务器被入侵', correct: false, explain: '错误。服务器行为正常，只是没校验跳转目标。' },
      ],
    },
    {
      kind: 'protect',
      material: '同一跳转参数，四种改法：① 用映射表（id → 真实 URL），不接收完整 URL；② 校验参数「包含本站域名」；③ 只允许 http:// 开头；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 映射表/相对路径白名单', correct: true, explain: '正确。跳转目标完全由服务端决定，用户只能选预设项，无外跳可能。' },
        { text: '② 包含本站域名', correct: false, explain: '错误。trusted.com.evil.com 可绕。' },
        { text: '③ 只允许 http:// 开头', correct: false, explain: '错误。http://evil.com 也满足前缀。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「我校验了 redirect 参数必须包含 oursite.com，肯定安全」。',
      question: '为什么不够？',
      options: [
        { text: '子串匹配可被 oursite.com.evil.com 绕过，要解析后 host 全等', correct: true, explain: '正确。「包含」不等于「等于」，域名比较必须全等。' },
        { text: '包含校验够了，攻击者注册不到那个域名', correct: false, explain: '错误。oursite.com.evil.com 的域名是 evil.com，攻击者可注册。' },
        { text: '只要全程 HTTPS 就安全', correct: false, explain: '错误。HTTPS 不改变跳转目标校验问题。' },
        { text: '加重提示语就行', correct: false, explain: '错误。提示是加固不是根治。' },
      ],
    },
  ],
  terms: ['open-redirect', 'origin-check', 'allowlist', 'oauth-redirect'],
  relatedTerms: ['origin-check', 'allowlist', 'oauth-redirect'],
  pinyin: { full: 'kai fang chong ding xiang', joined: 'kaifangchongdingxiang', initial: 'kfcdx' },
  related: ['xss', 'csrf', 'oauth-redirect'],
  realCases: [
    { refId: 'RC-205', summary: '某 OAuth 提供方 redirect_uri 校验不严致授权码泄露（成因：子串匹配白名单；教训：精确注册比对）', lesson: '精确注册比对', source: 'PortSwigger Web Security Academy — OAuth 跳转实验', credibility: '平台' },
  ],
  source: 'demo',
  format: 'card',
};

const domClobbering: InteractiveEntry = {
  id: 'dom-clobbering',
  kind: 'vuln',
  chapter: 2,
  title: 'DOM 覆盖（DOM Clobbering）',
  hazard: 2,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['DOM Clobbering', 'DOM 覆盖', '全局变量覆盖', 'HTML 元素覆盖'],
  oneLiner:
    '攻击者用 HTML 元素的 id/name 顶替前端脚本依赖的全局变量或 DOM 属性，使脚本读到攻击者构造的对象，校验被绕过。',
  cause:
    '页面脚本用 window.config、document.forms.x 之类的全局引用取值，而页面又允许用户插入带 id/name 的 HTML——浏览器会把该元素挂到全局命名空间，遮蔽原有变量。高发位置：允许自定义 HTML 的富文本、个人主页、模板配置、<form>/<img>/<iframe> 的 id/name 属性可控处。',
  where:
    '前端脚本读取 window.x / document.x 全局引用的页面；允许用户输入 HTML 标签属性（尤其 id、name）的位置。',
  kinds: [
    { name: '变量覆盖', plain: '元素顶替 window.x 变量', signal: '脚本读配置读到了 DOM 元素' },
    { name: '表单/集合覆盖', plain: 'document.forms.x 被同名元素截胡', signal: '表单引用指向攻击者元素' },
    { name: '校验绕过', plain: '布尔判断读到元素的属性', signal: 'if (window.config.ok) 恒真/恒假失真' },
  ],
  signals: [
    '页面脚本使用 window.config、document.forms.x 等全局引用。',
    '页面允许用户插入带 id/name 的 HTML（富文本、自定义模块）。',
    '读取配置的脚本值出现异常（类型不再是预期的对象/字符串）。',
  ],
  impact:
    '前端校验绕过（如权限判断失真）、配合其他缺陷串成利用链（复用 m07-vuln-chains 思路）、在少数场景升级为脚本执行。',
  verify: [
    '搜前端源码里对 window.x、document.x 的全局引用。',
    '确认用户 HTML 是否允许 id/name 属性（富文本/自定义模块）。',
    '插入带 id 的元素（演示样例，无害标记），看脚本读取的值是否被替换。',
    '检查读取处有无类型校验（预期对象却拿到元素时是否报错/拒绝）。',
  ],
  protect: {
    root: '不依赖全局 DOM 引用取配置——用显式查找（document.getElementById）并校验类型；配置走 JS 闭包/模块作用域，不挂全局。',
    harden: '用户 HTML 过滤 id/name 属性（标签/属性白名单，复用 html-sanitize）；框架层禁用全局变量注入。',
    fallback: '入口处做类型断言，异常即拒绝，仅作兜底。',
  },
  mistakes: [
    '只净化「标签」不管「属性」——id/name 属性才是覆盖的入口。',
    '以为「Vue/React 项目没这问题」——只要代码里用 window.x 全局引用就存在风险。',
    '只查 <img> 忽略 <form>、<iframe>、<object>——都能参与覆盖。',
  ],
  terms: ['dom-clobbering', 'html-sanitize', 'type-validation', 'xss'],
  relatedTerms: ['html-sanitize', 'type-validation', 'xss'],
  pinyin: { full: 'dom fu gai', joined: 'domfugai', initial: 'dfg' },
  related: ['xss', 'postmessage-communication', 'prototype-pollution'],
  caseDemo: {
    material:
      '页面脚本（演示样例）：\n  if (window.config && window.config.isAdmin) { showAdminPanel(); }\n\n用户可控 HTML（演示样例，个人主页自定义模块）——嵌套构造：\n  <form id="config"><input name="isAdmin" value="true"></form>\n\n结果：\n  window.config 变成该 <form> 元素\n  window.config.isAdmin 变成其内部的 <input> 元素（truthy）\n  → 两个条件都满足，校验被绕过（演示样例，无害验证）\n\n对比（错误做法，仅第一层顶替）：\n  <img name="config">        ← window.config 变元素，但 config.isAdmin\n                                仍是 undefined，第二个条件 falsy，绕不过去',
    language: 'plaintext',
    note: '材料为演示样例，载荷为无害验证标记，非现场运行、非真实系统。要点：单一 id/name 只能顶替第一层引用；要绕过嵌套属性检查必须构造父子结构（<form> + 命名子元素，或两个同名元素形成 HTMLCollection）。',
    source: 'demo',
  },
  guide: {
    why: '这里的「注入点」是元素属性名。id/name 不只是展示标识——浏览器会把带它们的元素挂进全局命名空间，脚本再按名字去取，取到的就是攻击者的元素。名字相同即顶替，这是浏览器的既定行为而非 bug。',
    how: '① 列出脚本依赖的全局引用清单；② 看用户 HTML 允许哪些属性；③ 插入无害元素验证替换——注意单一的 id/name 只能顶替第一层引用（如 window.config），要绕过嵌套属性检查（如 config.isAdmin）需要构造父子结构（<form id="config"><input name="isAdmin"> 或两个同名元素）；④ 修复按「去掉全局引用 + 类型校验 + 属性白名单」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CLIENT',
  source: 'demo',
  format: 'interactive',
};

const cssInjection: CardEntry = {
  id: 'css-injection',
  kind: 'vuln',
  chapter: 2,
  title: 'CSS 注入 / 内容欺骗',
  hazard: 1,
  difficulty: 'beginner',
  scene: ['Web'],
  aliases: ['CSS 注入', '样式注入', '内容欺骗', 'CSS Injection'],
  oneLiner:
    '用户输入被拼进 CSS 后，攻击者可覆盖页面样式、伪造界面诱导操作，还能配合属性选择器逐字符外带数据。',
  cause:
    '用户内容直接进入 <style> 块或 style 属性且未做值级过滤。高发位置：主题/皮肤自定义、富文本样式、邮件模板样式、用户昵称进 style 属性。',
  where: '自定义主题色/字体、style="…用户输入…"、模板样式配置。',
  kinds: [
    { name: '界面伪造', plain: '覆盖页面样式伪装成别的界面', signal: '页面出现非预期的覆盖层/假按钮' },
    { name: '数据外带', plain: '属性选择器逐字符猜数据', signal: '页面加载外域图片请求呈规律性' },
  ],
  signals: [
    '用户输入进入 <style> 或 style 属性后页面样式被改写。',
    '构造 } 闭合样式规则后出现非预期样式效果。',
    '出现按字符试探的外域资源请求（属性选择器外带）。',
  ],
  impact:
    '界面伪造诱导点击（钓鱼）、配合属性选择器外带敏感数据（如 CSRF Token 的字符）、破坏页面可用性。危险度低（★☆），但常被忽视而成为组合利用的一环。',
  verify: [
    '找用户内容进入 <style>/style 属性的位置。',
    '用 } 尝试闭合规则（演示样例，改无害样式如背景色），看效果是否可控。',
    '若样式值可含 url()，检查是否可加载外域资源。',
  ],
  protect: {
    root: 'CSS 值用白名单/数值化（颜色取色板、字号取枚举）；用户内容不进 <style> 与 style 属性。',
    harden: '模板样式与用户数据分离；富文本净化覆盖 style 属性（复用 html-sanitize）。',
    fallback: 'CSP 限制样式来源，仅作兜底。',
  },
  mistakes: [
    '以为「CSS 不能执行代码就不危险」——界面伪造与数据外带同样有杀伤力。',
    '只过滤 <script> 标签不管样式上下文。',
    '忽略 url() 可加载外域资源这一点。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某主题设置里输入 red; } body{display:none 后整个页面变空白，只留一个假登录框。',
      question: '这说明什么？',
      options: [
        { text: '输入拼进了 CSS，样式规则被改写（界面伪造）', correct: true, explain: '正确。;/} 让输入逃出原规则、写入新规则，页面被攻击者重绘。' },
        { text: '浏览器故障', correct: false, explain: '错误。只在提交该输入后出现，且效果与输入一致。' },
        { text: '这是 XSS', correct: false, explain: '错误。没有脚本执行，只是样式被改写。' },
        { text: '网络加载失败', correct: false, explain: '错误。页面元素齐全，只是样式被覆盖。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 颜色/字号用白名单枚举，用户数据不进 style；② 过滤 <script；③ 限制输入长度；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 值级白名单 + 用户数据不进样式', correct: true, explain: '正确。攻击者只能选预设样式值，规则无法被改写。' },
        { text: '② 过滤 script', correct: false, explain: '错误。与样式上下文无关。' },
        { text: '③ 限长度', correct: false, explain: '错误。短输入也能闭合规则。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「CSS 注入才一星，不用管」。',
      question: '产品口径怎么看？',
      options: [
        { text: '危害小≠可忽略，它常是组合利用（界面伪造钓鱼）的一环', correct: true, explain: '正确。★只说独立危害大小；组合链条里它可放大其他漏洞。' },
        { text: '一星漏洞都不用修', correct: false, explain: '错误。没有这条规则。' },
        { text: '一星说明学习难度也低，可以直接跳过不学', correct: false, explain: '错误。危险度与学习难度是两个维度。' },
        { text: '只要页面视觉正常就没事', correct: false, explain: '错误。数据外带（属性选择器）不改视觉也可发生。' },
      ],
    },
  ],
  terms: ['css-injection', 'html-sanitize', 'allowlist'],
  relatedTerms: ['html-sanitize', 'allowlist', 'xss'],
  pinyin: { full: 'css zhu ru', joined: 'csszhuru', initial: 'csszr' },
  related: ['xss', 'clickjacking'],
  source: 'demo',
  format: 'card',
};

const clientStorageLeak: CardEntry = {
  id: 'client-storage-leak',
  kind: 'vuln',
  chapter: 2,
  title: '客户端存储泄露',
  hazard: 3,
  difficulty: 'beginner',
  scene: ['Web', '移动'],
  aliases: ['客户端存储泄露', 'localStorage 泄露', '前端存储泄露', 'Token 明文存储'],
  oneLiner:
    'Token、密钥、个人信息明文存在 localStorage、sessionStorage、IndexedDB 或无 HttpOnly 的 Cookie 中，一旦页面脚本失守或设备被接触即被读取。',
  cause:
    '图省事把长期凭证放客户端存储，且未做加密与过期控制。高发位置：localStorage.getItem(\'token\')、前端打包产物里硬编码 AK/SK、Cookie 缺 HttpOnly、记住密码功能明文落盘。',
  where:
    '登录后把 Token 写入 localStorage/sessionStorage 的代码；前端 bundle（JS 资源）里的常量；Cookie 属性配置。',
  kinds: [
    { name: '凭证明文', plain: 'Token 原样存本地', signal: '存储面板可见完整 Token' },
    { name: '密钥硬编码', plain: 'AK/SK 打进前端代码', signal: 'bundle 里出现密钥常量' },
    { name: 'Cookie 裸奔', plain: 'Cookie 无 HttpOnly', signal: '脚本可读 document.cookie' },
  ],
  signals: [
    'localStorage.getItem(\'token\') / sessionStorage 里存着凭证。',
    '前端 bundle（JS 资源）中出现 AK/SK、API Key 等常量。',
    'Cookie 缺 HttpOnly，document.cookie 可读到会话标识。',
  ],
  impact:
    '凭证/密钥泄露导致账号接管、接口被滥用（越权读写数据）；与 XSS 组合时无需破解即可直接窃取；设备被接触（共享电脑、维修）同样泄露。',
  verify: [
    '打开浏览器存储面板（Application 页签）逐项查看 localStorage/sessionStorage/IndexedDB/Cookie。IndexedDB 查法：展开 Application 页签的 IndexedDB 节点——它是结构化数据库，一个站点可能存在多张表，需逐库、逐表检查有无敏感数据（Token、个人信息）。',
    '全文搜前端 bundle 里的 token、secret、apiKey、AK/SK 常量。',
    '检查会话 Cookie 的 HttpOnly/Secure/SameSite 三属性（复用 cookie-flags）。',
    '评估「设备被接触」场景下的暴露面（共享设备、导出数据）。',
  ],
  protect: {
    root: '会话 Token 放 HttpOnly + Secure + SameSite Cookie；不在前端存长期密钥，密钥只存服务端。',
    harden: '确需本地暂存的敏感数据做加密并设过期；最小化存储范围；构建流程扫出 bundle 里的密钥（防硬编码）。',
    fallback: 'Token 可吊销、可轮换；异常读取告警，仅作兜底。',
  },
  mistakes: [
    '以为「localStorage 只有 XSS 才能读」——设备被接触、共享电脑、浏览器插件同样能读。',
    '把「前端加密」当防护——密钥也在前端，等于没锁。',
    '只检查 localStorage 漏了 Cookie 属性与 bundle 硬编码。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '打开浏览器存储面板，localStorage 里有一条明文 token=eyJhbGciOi…。',
      question: '这属于什么问题？',
      options: [
        { text: '客户端存储泄露——凭证明文存放在可被脚本读取的位置', correct: true, explain: '正确。任何脚本（含注入的恶意脚本）都能读走它。' },
        { text: '这是正常做法，不算问题', correct: false, explain: '错误。明文 Token 可被任意脚本读取，暴露面过大。' },
        { text: '这是 CSRF', correct: false, explain: '错误。CSRF 是借身份发请求，这里是凭证存放不当。' },
        { text: '浏览器缓存问题', correct: false, explain: '错误。localStorage 是主动写入的持久存储。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① Token 改存 HttpOnly+Secure+SameSite Cookie；② localStorage 里把 Token 做「前端加密」；③ 只存 sessionStorage；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① HttpOnly Cookie——脚本根本读不到', correct: true, explain: '正确。HttpOnly 隔绝脚本访问，配合 Secure/SameSite 是会话凭证的标准存放方式。' },
        { text: '② 前端加密', correct: false, explain: '错误。解密密钥也在前端，等价于没加密。' },
        { text: '③ 换 sessionStorage', correct: false, explain: '错误。同一页面脚本照样能读。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 管不到浏览器存储。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「Token 存 localStorage 没事，反正只有 XSS 才能偷，我们没有 XSS」。',
      question: '为什么站不住？',
      options: [
        { text: '设备被接触、共享电脑、恶意浏览器插件都能读，且「现在没有 XSS」不等于永远没有', correct: true, explain: '正确。存储位置决定暴露面，不能赌漏洞不存在。' },
        { text: '他说得对', correct: false, explain: '错误。暴露面不因「当前无 XSS」而消失。' },
        { text: '只要 Token 设短过期就行', correct: false, explain: '错误。过期是缓解，不是存放方式的根治。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。HTTPS 保护传输，不保护本地存储。' },
      ],
    },
  ],
  terms: ['client-storage-leak', 'cookie-flags', 'info-leak', 'arbitrary-rw'],
  relatedTerms: ['cookie-flags', 'info-leak', 'xss'],
  pinyin: { full: 'ke hu duan cun chu xie lou', joined: 'kehuduancunchuxielou', initial: 'khdcckxl' },
  related: ['xss', 'csrf', 'frontend-supply-chain'],
  realCases: [
    { refId: 'RC-206', summary: '某单页应用 Token 明文存 localStorage 被插件窃取（成因：凭证存放不当；教训：HttpOnly Cookie + 最小化存储）', lesson: 'HttpOnly Cookie + 最小化存储', source: 'OWASP 会话管理说明', credibility: '权威' },
  ],
  source: 'demo',
  format: 'card',
};

const frontendSupplyChain: InteractiveEntry = {
  id: 'frontend-supply-chain',
  kind: 'vuln',
  chapter: 2,
  title: '浏览器扩展与前端供应链',
  hazard: 3,
  difficulty: 'intermediate',
  scene: ['Web', '通用'],
  aliases: ['前端供应链', '浏览器扩展滥用', '第三方脚本风险', '前端组件投毒'],
  oneLiner:
    '被入侵或恶意的浏览器扩展、第三方脚本（广告、统计、客服 SDK）拥有页面完全控制权，可窃取表单、注入脚本，把供应链变成攻击入口。',
  cause:
    '页面无条件信任引入的第三方代码——脚本权限与自研代码等同，一旦上游被篡改或本身就恶意，攻击直达所有用户。高发位置：CDN 引入的公共库、统计/广告/客服 SDK、浏览器扩展的用户量变现、前端组件包（都属于 supply-chain 供应链攻击的前端形态）。',
  where: '<script src="…"> 外链脚本、npm 安装的前端组件、浏览器扩展、CDN 资源。',
  kinds: [
    { name: '恶意扩展', plain: '扩展读表单/改页面', signal: '扩展申请过宽权限' },
    { name: '第三方脚本被篡改', plain: 'CDN/SDK 上游被投毒', signal: '脚本哈希与预期不符' },
    { name: '组件投毒', plain: '依赖包作者被收买/被盗号', signal: '依赖版本异常更新、代码风格突变' },
  ],
  signals: [
    '页面从第三方域名加载脚本且无完整性校验。',
    '引入的 SDK 权限过宽（可读全部 DOM、可发任意请求）。',
    '依赖包出现异常版本更新、安装脚本可疑。',
  ],
  impact:
    '窃取表单数据（含密码、支付信息）、注入脚本（等同 XSS 的全量能力）、批量影响所有访问用户——供应链一旦失守是「一处污染、全量中招」。',
  verify: [
    '盘点页面全部外链脚本/样式与 npm 直接依赖清单。',
    '检查是否配置 SRI（integrity 属性）与 CSP（复用 csp）限制脚本来源。',
    '评估第三方组件申请的权限范围（DOM 访问、网络请求、存储读写）。',
    '审查依赖更新记录与发布者变更（组件来源可信度）。',
  ],
  protect: {
    root: '最小化第三方脚本——非必要不引入；必要引入用 SRI（子资源完整性，复用 sri）钉死哈希。',
    harden: 'CSP 限定脚本来源（复用 csp）；定期审计第三方组件与扩展权限；依赖锁定版本、审查更新。',
    fallback: '内容变更告警与快速下线机制，仅作兜底。',
  },
  mistakes: [
    '以为「大厂 CDN 就安全」——上游被篡改照样中招。',
    '只审计自己代码不审第三方脚本与扩展。',
    '引入 SRI 后忘了更新哈希，脚本升级后被浏览器拒绝加载（可用性问题），反过来又把 SRI 摘掉。',
    'SRI 只适用静态资源（固定版本的库文件）；动态生成的脚本（统计脚本、A/B 测试脚本）无法钉死哈希，SRI 用不上——这类脚本只能用 CSP 限制来源，并尽量少引。',
  ],
  terms: ['frontend-supply-chain', 'supply-chain', 'sri', 'csp', 'third-party-script'],
  relatedTerms: ['supply-chain', 'sri', 'csp', 'third-party-script'],
  pinyin: { full: 'qian duan gong ying lian', joined: 'qianduangongyinglian', initial: 'qdgyl' },
  related: ['xss', 'client-storage-leak', 'prototype-pollution'],
  caseDemo: {
    material:
      '页面引入（演示样例）：\n  <script src="https://cdn.example.com/analytics.js"></script>   ← 无 integrity\n\n上游被篡改后（演示样例）：\n  analytics.js 内容变成读取表单并外发的脚本\n  → 所有用户中招，而本站代码一行未改\n\n加 SRI 后（演示样例）：\n  <script src="…" integrity="sha384-…" crossorigin="anonymous"></script>\n  → 哈希不符，浏览器拒绝执行被篡改的脚本',
    language: 'plaintext',
    note: '材料为演示样例，域名与哈希为占位示例，非现场运行、非真实系统。',
    source: 'demo',
  },
  guide: {
    why: '判断「引入的代码是不是等于自己写的代码」。外链脚本与扩展跑在页面里，权限与自研代码完全一样——信任它们就等于把页面钥匙交出去。供应链攻击的狠处是：本站代码一行没改，用户却全量中招。',
    how: '① 列出全部第三方脚本/依赖清单；② 逐个问「有没有完整性校验（SRI）」「来源是否被 CSP 限制」；③ 检查扩展与 SDK 的权限申请是否超出所需；④ 修复按「最小化引入 + SRI + CSP + 定期审计」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
};

export const ch2Entries: LearningEntry[] = [
  xss,
  csrf,
  clickjacking,
  prototypePollution,
  postmessageCommunication,
  openRedirect,
  domClobbering,
  cssInjection,
  clientStorageLeak,
  frontendSupplyChain,
];

export default ch2Entries;
