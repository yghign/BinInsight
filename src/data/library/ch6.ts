/**
 * 服务端请求与数据解析 —— 6 条。内容逐字取自 docs/15 v2。
 * 6 条全为形态 B 知识卡 + 案例演示 + 指导（本主题无低档条目，故无 3 题自测）：
 * 中 3（xxe/parser-defect/redos）+ 高 3（ssrf/insecure-deserialization/sandbox-escape）。
 * templateId：TPL-CHAIN×4（ssrf/insecure-deserialization/sandbox-escape/redos）+ TPL-INJECT×2（xxe/parser-defect）。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, InteractiveEntry } from './types';

const ssrf: InteractiveEntry = {
  id: 'ssrf',
  kind: 'vuln',
  chapter: 6,
  title: 'SSRF（服务端请求伪造）',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', '云'],
  aliases: ['SSRF', '服务端请求伪造', 'Server-Side Request Forgery', '服务器端请求伪造'],
  oneLiner:
    '服务端按用户提供的 URL 发起请求时，攻击者借此让服务器访问内网服务、云元数据或本地文件，突破网络隔离。',
  cause:
    '图片/链接抓取、URL 预览、WebHook、PDF/截图生成、文件导入（?url=）、代理接口、RSS 订阅、翻译/OCR、回调验证——凡「由服务端发请求」且 URL 可控（哪怕只部分可控：域名可控、路径可控）的功能都是入口。为什么服务器发起的请求更危险：外网进不去的门（内网服务、云配置接口），服务器自己去敲就开了——它站在内网里、带着内网信任，甚至带着云主机的临时凭证。攻击者的 URL 只是「让谁去敲门」的指令。',
  where:
    '?url=、?image=、?callback=、?target=、?webhook= 等完整 URL 参数；导出/截图/预览服务；第三方回调验证。',
  kinds: [
    { name: '回显型 SSRF', plain: '响应里带回目标内容', signal: '能读到 http://127.0.0.1:端口 的响应' },
    { name: '盲 SSRF', plain: '看不到响应但请求发出', signal: '带外平台/DNSLog 收到服务器的请求' },
    { name: '协议滥用', plain: '换协议读文件/发命令', signal: 'file://、gopher://、dict:// 生效' },
    { name: '重定向/DNS 绕过', plain: '校验后目标再变', signal: '外部 302 跳内网、DNS 重绑定' },
  ],
  signals: [
    '参数是完整 URL：?url=、?image=、?callback=、?target=、?webhook=。',
    '可让服务器访问你自己的 HTTP 服务（用带外平台或自建监听确认）。',
    '能读到 http://127.0.0.1:端口 的响应（回显型）；能访问云元数据地址（如 http://169.254.169.254/latest/meta-data/——IMDS，云主机内默认可访问的「本机配置查询口」，可查临时凭证）。',
    '地址变形（十进制/十六进制/IPv6 缩写）与重定向后目标变化。',
  ],
  impact:
    '内网探测与端口扫描；访问未授权内部服务（Redis、Elasticsearch、K8s API、Jenkins 等）；窃取云主机临时凭证（AWS/GCP/阿里云元数据）→ 接管云资源；读取本地文件（file://）；经 gopher 等协议构造内部服务命令。',
  verify: [
    '列出所有「由服务端发请求」的功能，确认 URL 是否可控（域名可控/路径可控都算）。',
    '用带外通道（DNSLog / 自建 HTTP 服务，复用 oob 思路）确认服务器真的发出了请求。',
    '测试协议：http、https、file、gopher、dict、ftp。',
    '测试地址变形：127.0.0.1、localhost、0.0.0.0、[::1]、十进制/十六进制表示、127.1、foo@127.0.0.1。',
    '测试重定向绕过（外部 URL 302 跳内网——校验只发生在第一次请求）与 DNS 重绑定（首次解析到公网过校验、再次解析到内网）。',
    '盲 SSRF：以时间差异判断端口开放。',
  ],
  protect: {
    root: '协议白名单（只允许 http/https）+ 目标白名单（只允许业务确需的域名/IP 段，复用 allowlist）；解析后校验——先 DNS 解析，对解析出的 IP 做内网/保留地址校验，并且用校验过的 IP 发起请求（防 DNS 重绑定）。',
    harden: '禁止跟随重定向，或对每一跳重新校验；网络层隔离（业务服务器不达元数据服务与管理网段；云上使用 IMDSv2——需临时令牌且限制跳数）；不把原始响应体返回给用户（降低回显型价值）。',
    fallback: '出站流量统一走代理并审计；异常出站告警。',
  },
  mistakes: [
    '只黑名单 127.0.0.1（十进制/十六进制/IPv6 缩写/DNS 变形绕过）。',
    '只校验第一次请求（302 重定向绕过）。',
    '校验用字符串匹配而不解析 URL（http://evil.com#@127.0.0.1 之类的解析差异）。',
    '忽略盲 SSRF——看不到回显不等于没打到内网（带外确认照样成立）。',
  ],
  terms: ['ssrf', 'oob', 'allowlist', 'rce', 'info-leak'],
  relatedTerms: ['oob', 'allowlist'],
  pinyin: { full: 'fu wu duan qing qiu wei zao', joined: 'fuwuqingqiuweizao', initial: 'fwdqqwz' },
  related: ['xxe', 'parser-defect', 'client-storage-leak'],
  caseDemo: {
    material:
      "场景（演示样例，站点 example.com 的「网页预览」功能）：\n服务端逻辑（演示样例）：\n  resp = http_get($_GET['url']);     ← 用用户给的 URL 发起请求，返回内容摘要\n\n攻击步骤：\n1. 正常请求：GET /preview?url=https://example.org/page\n   → 服务端抓取外网页（正常）\n2. 内网探测：GET /preview?url=http://127.0.0.1:6379/\n   → 服务端从自己所在网段访问本机 Redis 端口（外网进不来的门，服务器自己敲就开）\n3. 云元数据：GET /preview?url=http://169.254.169.254/latest/meta-data/\n   → 服务端访问云元数据服务（IMDS），返回云主机临时凭证（演示样例，虚构响应）\n\n逻辑链自查（硬标准：参数与目标逐字符对上，包括协议/主机/端口/路径，无隐藏前后缀拼接）：\n输入（url 参数，服务端原样使用、无前缀后缀包装）\n→ 机制（服务端以自己的网络身份发起请求，带着内网位置与云凭证）\n→ 结果（②探到内网端口、③读到云元数据）✔\n逐字符核对：url=http://169.254.169.254/latest/meta-data/\n  → 请求目标即该 URL 本体：协议 http、主机 169.254.169.254、路径 /latest/meta-data/ ✔ 无拼接\n  → url=http://127.0.0.1:6379/ → 目标为本机 6379 端口本体 ✔",
    language: 'plaintext',
    note: '材料为演示样例，站点、端口、响应均为虚构，非现场运行、非真实系统。修法对照：协议白名单（第 3 步的 file/gopher 类被拒）+ 目标白名单（127.0.0.1/169.254.169.254 不在名单被拒）+ 解析后校验用校验过的 IP 发起（重绑定失效），任一层到位即断链。DNS 重绑定口径：重绑定场景需两次 DNS 解析间隔（首次解析到公网过校验、再次解析到内网），本卡不展开；修法「用校验过的 IP 发起请求」正是堵这个窗口。',
    source: 'demo',
  },
  guide: {
    why: '盯「服务端会不会按用户给的地址去敲门」。关键不是「有没有 url= 参数」，而是服务器替谁干活、带着什么信任——内网位置、云凭证都是它的「通行证」，攻击者只是递了张纸条。盲 SSRF 也要盯：看不到响应≠没敲到门（带外确认）。',
    how: '① 盘点所有服务端出站请求功能；② 带外确认 + 协议/地址变体/重定向三层测；③ 评估敲到什么（内网服务/元数据/本地文件）；④ 修复按「协议白名单+目标白名单+解析后校验+网络隔离」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-601', summary: 'SSRF 访问云元数据与内网服务实验（成因：URL 参数直通服务端请求；教训：协议+目标白名单 + 解析后校验 + 元数据隔离）', lesson: '协议+目标白名单 + 解析后校验 + 元数据隔离', source: 'PortSwigger Web Security Academy — SSRF 实验', credibility: '平台' },
  ],
};

const xxe: InteractiveEntry = {
  id: 'xxe',
  kind: 'vuln',
  chapter: 6,
  title: 'XXE（XML 外部实体注入）',
  hazard: 5,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['XXE', 'XML 外部实体注入', 'XML External Entity', 'XML 实体注入'],
  oneLiner:
    'XML 解析器允许外部实体时，攻击者可在 XML 里定义实体引用本地文件或远程 URL，从而读取文件、发起请求，特定环境下可执行代码。',
  cause:
    '默认配置的 XML 解析器（Java DocumentBuilderFactory/XMLReader、Python lxml、PHP SimpleXML 等）会解析文档里的实体声明。「实体」本是给内容起别名的机制（写一次 &xxe; 多处复用），但别名可以指向外部资源（SYSTEM "file:///etc/passwd"）——解析器展开实体时就替用户去取。为什么 XML 能读文件：文档变成了「取件单」——&xxe; 是取件码，SYSTEM 后的地址是取件柜，解析器照单取件、把内容填回文档。入口伪装多：SOAP 接口、SVG 上传、DOCX/XLSX（本质是 zip+XML）、RSS、SAML 断言、配置文件导入。',
  where:
    'Content-Type: application/xml / SOAP 接口、SVG 图片、Office 文件导入、.xml 配置导入、SAML 断言（认证与会话主题的 SAML 条目已注明 XXE 归本主题——本条落地即收编该引用）。',
  kinds: [
    { name: '有回显 XXE', plain: '文件内容直接回显', signal: '响应中出现文件内容' },
    { name: '盲 XXE / OOB', plain: '无回显但外部请求发出', signal: '实体指向攻击者服务器，DNS/HTTP 日志可见' },
    { name: '参数实体外带', plain: '用外部 DTD 借道外带', signal: '组合参数实体把文件内容发到外部' },
    { name: '膨胀拒绝服务', plain: '实体递归撑爆内存', signal: 'Billion Laughs 类载荷（解析缺陷面，见 6.5）' },
  ],
  signals: [
    '插入 DOCTYPE 与实体定义后被接受、被解析（返回内容中出现文件内容=有回显）。',
    '无回显时实体指向外部服务器，DNS/HTTP 日志出现解析器的请求（盲 XXE/OOB）。',
    '报错信息中出现实体解析相关错误。',
    '入口在 SVG/Office/SAML 等「不像 XML」的地方。',
  ],
  impact:
    '读取任意文件（配置、密钥、源码）；SSRF（解析器代发请求，与 6.1 同害）；内网探测；拒绝服务（实体膨胀）；特定环境下代码执行（如 PHP expect:// 类封装、配合反序列化链）。',
  verify: [
    '找所有接收 XML 的接口（Content-Type: application/xml、SOAP、文件导入、SVG/Office 上传）。',
    '尝试插入 DOCTYPE 与实体定义，观察是否被接受、是否解析。',
    '有回显 → 直接读文件；无回显 → 外部 DTD + 参数实体做 OOB 外带（复用 oob）。',
    '注意入口伪装：SVG、DOCX/XLSX/PPTX、.xml 配置、SAML 断言。',
  ],
  protect: {
    root: '解析器禁用 DTD 与外部实体（Java disallow-doctype-decl、Python lxml resolve_entities=False、.NET DtdProcessing=Prohibit）；业务允许时用 JSON 替代 XML。',
    harden: '上传的 Office/SVG 做安全解析或转换（与文件与服务端资源主题 5.5 的解析面互引）；升级解析库，避免已知绕过（部分老版本防护开关可被绕过）。',
    fallback: '解析资源限额（防膨胀，见 6.5）；异常解析告警。',
  },
  mistakes: [
    '只防一个解析器（项目里常有多处 XML 解析入口）。',
    '只测 SOAP 不测文件上传（SVG/Office 就是 XML）。',
    '以为「内网接口不需要防」——内网接口被 XXE 打穿同样失守。',
    '只关外部实体不关 DTD（部分场景仍可膨胀/绕过）。',
  ],
  terms: ['xxe', 'deserialization', 'oob', 'info-leak'],
  relatedTerms: ['ssrf', 'deserialization', 'parser-defect', 'oob'],
  pinyin: { full: 'wai bu shi ti zhu ru', joined: 'waibushitizhuru', initial: 'wbstzr' },
  related: ['ssrf', 'deserialization', 'parser-defect'],
  caseDemo: {
    material:
      "场景（演示样例，站点 example.com 的 XML 数据接口）：\n服务端逻辑（演示样例）：\n  parser.parse($_POST['xml']);    ← 默认配置的 XML 解析器，允许外部实体\n\n攻击请求体（演示样例）：\n<?xml version=\"1.0\"?>\n<!DOCTYPE root [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>\n<root>&xxe;</root>\n\n攻击步骤：\n1. 正常请求：<root>hello</root> → 解析成功（正常）\n2. 实体读文件：提交上方载荷 → 解析器展开 &xxe; 时按声明去读 file:///etc/passwd\n   → 响应中出现系统文件内容（有回显）\n3. 盲外带（演示样例）：实体指向攻击者服务器 http://attacker.example/collect\n   → 解析器发出外部请求，攻击者 DNS/HTTP 日志可见（无回显时的确认手段）\n   极简构造思路：在攻击者服务器放一个外部 DTD，XML 里用参数实体引用它，\n   由外部 DTD 定义「把文件内容拼进一次外发 URL」的实体——借解析器的外发请求把内容带出来。\n   完整构造需组合参数实体外带，本卡不展开（与边界说明口径一致）。\n\n逻辑链自查（硬标准：实体声明与引用逐字符对上，包括实体名与 SYSTEM 后的 URI）：\n输入（含 DOCTYPE 实体声明的 XML）\n→ 机制（解析器把实体引用展开，替用户去取外部资源，内容填回文档）\n→ 结果（②文件内容回显、③外带请求发出）✔\n逐字符核对：声明实体名 xxe 与引用 &xxe; 逐字符一致 ✔\n           SYSTEM 后 URI \"file:///etc/passwd\" 引号闭合、协议 file:/// 三斜杠、目标路径完整 ✔\n           <root>&xxe;</root> 的 root 与 DOCTYPE root 逐字符一致 ✔",
    language: 'plaintext',
    note: '材料为演示样例，站点与文件为虚构，非现场运行、非真实系统。修法对照：禁用 DTD 与外部实体（第 2 步实体声明被拒），全链断开。',
    source: 'demo',
  },
  guide: {
    why: '盯「解析器会不会照着文档里的取件单去取东西」。XML 的实体机制让文档可以「引用外部内容」——引用是功能、被用户控制就是漏洞。入口别只盯 application/xml：SVG、Office、SAML 断言都是 XML（与文件主题 5.5 的解析面互引）。',
    how: '① 盘点全部 XML 入口（含伪装入口）；② 实体声明是否被接受（有无回显都测，盲测用带外）；③ 检查解析器配置开关；④ 修复按「禁 DTD+禁外部实体+JSON 替代+限额」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-INJECT',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-602', summary: 'XXE 外部实体注入防护 Cheat Sheet（成因：解析器默认允许外部实体；教训：禁 DTD/外部实体 + 入口全覆盖）', lesson: '禁 DTD/外部实体 + 入口全覆盖', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const insecureDeserialization: InteractiveEntry = {
  id: 'insecure-deserialization',
  kind: 'vuln',
  chapter: 6,
  title: '反序列化漏洞',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', '系统'],
  aliases: ['反序列化漏洞', '不安全反序列化', 'Insecure Deserialization', 'gadget 链'],
  oneLiner:
    '程序把不可信数据按字节流「还原成对象」时，攻击者塞进去的类名和调用关系被当作指令执行，触发任意代码。',
  cause:
    '序列化是「把对象变成字节流」，反序列化是「按字节流重建对象」——重建过程会照着数据里的类名与调用关系走。攻击者只要能提交字节流，就能塞进「要重建什么类、重建时触发什么」的指令。为什么还原对象会执行代码：还原不是「读数据」，而是「按说明书组装」——说明书（字节流）由攻击者写，组装线上有带副作用的零件（gadget）。gadget 链像多米诺：第一块倒下，后面连环触发——单个类的读取/析构方法无害，但类与类连成链就通到命令执行。入口：Java ObjectInputStream、Fastjson @type、Shiro rememberMe Cookie、PHP unserialize()、Python pickle.loads/yaml.load、.NET BinaryFormatter、Node node-serialize。',
  where:
    'Cookie/请求体里的长 Base64（data、token、state、viewState 参数）、Session 存储、缓存（Redis 对象）、RMI/中间件协议（T3 等）、JSON 的 @type 字段。',
  kinds: [
    { name: '字节流还原', plain: '二进制序列化载荷', signal: 'rO0AB（Java Base64 头）、aced0005 魔术字节' },
    { name: 'JSON 自动类型', plain: 'JSON 里的类型声明被当指令', signal: '{"@type":"..."} 类字段' },
    { name: '魔术方法触发', plain: '还原/销毁时钩子被调用', signal: 'PHP __destruct/__wakeup、Python __reduce__' },
    { name: 'gadget 链利用', plain: '类与类连成链，连环触发到危险操作', signal: '目标环境组件匹配（Commons 系/Spring 系等）' },
    { name: '中间件/缓存还原', plain: '存储里的对象被还原', signal: 'Redis 缓存对象、Session 反序列化' },
  ],
  signals: [
    '请求体或 Cookie 中出现 rO0AB（Java 序列化 Base64 头）、aced0005（十六进制魔术字节）、O:8:"stdClass"（PHP）、__reduce__（Python）。',
    'Cookie rememberMe=deleteMe（Shiro 特征）；JSON 可提交 {"@type":"..."}。',
    '参数名像 data/token/state/viewState，内容是长 Base64。',
  ],
  impact:
    '即使无可用 gadget 链，也可造成拒绝服务或信息泄露（复用 info-leak，这是更常见的情形）；一旦有匹配的 gadget 链则直达远程代码执行（复用 rce，通常直接判严重）。',
  verify: [
    '识别：抓包看数据特征（Base64 解码看魔术字节）；看框架指纹（Shiro、Fastjson、WebLogic 等）。',
    '确认还原点：修改数据后是否报反序列化相关错误（类找不到/类不匹配异常）——报错即证明在还原。',
    '构造利用链：需要与目标组件匹配的 gadget（常用 ysoserial 类工具生成载荷，授权环境）。',
    '无回显时用带外/延时确认执行成功（复用 oob）。',
    '注意「看起来不是序列化」的地方：viewState、Session、缓存对象、远程调用协议。',
  ],
  protect: {
    root: '不还原不可信数据——首选架构方案改用 JSON + 严格结构校验（复用 type-validation）；必须使用时类白名单（只允许可还原的类）。',
    harden: '签名校验（HMAC 防篡改）；禁用自动类型（Fastjson 安全模式）；更换硬编码默认密钥（如 RememberMe 的 AES key 硬编码是经典问题）；升级组件（Shiro/Fastjson/XStream 历史缺陷多）。',
    fallback: '隔离运行（低权限、容器、出站限制）——即使被利用也难以横向。',
  },
  mistakes: [
    '只关注请求体忽略 Cookie/Session/缓存。',
    '只测 Java 忽略 PHP/Python/.NET。',
    '以为「用了 JSON 就安全」——JSON 库的自动类型机制同样是反序列化。',
    '忽略中间件与缓存（Redis 里的对象还原）。',
  ],
  terms: ['gadget-chain', 'deserialization', 'rce', 'type-validation'],
  relatedTerms: ['deserialization', 'gadget-chain', 'rce'],
  pinyin: { full: 'fan lie xua hua lou dong', joined: 'fanliexuhualoudong', initial: 'flxhld' },
  related: ['parser-defect', 'xxe', 'sandbox-escape'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的「记住偏好」Cookie）：\n服务端逻辑（演示样例）：\n  $prefs = unserialize($_COOKIE[\'prefs\']);   ← 还原 Cookie 里的序列化对象\n\n正常值（演示样例）：\n  O:8:"stdClass":1:{s:5:"theme";s:4:"dark";}\n  ——O:8 表示「对象、类名长 8 字符」，"stdClass" 恰好 8 字符（长度数字与类名逐字符对上）\n\n攻击载荷（演示样例，结构同类）：\n  O:8:"EvilCls":1:{...}   ← 类名换成带危险魔术方法的类，或走 gadget 链\n  还原时触发 __destruct/__wakeup 等钩子 → 构造代码被执行\n\n逻辑链自查（硬标准：序列化结构的长度数字与内容逐字符对上，包括类名长度、字段名长度）：\n输入（构造的序列化字符串，prefs Cookie 可控）\n→ 机制（还原=按字节流重建对象，魔术方法/调用链被触发）\n→ 结果（构造代码执行）✔\n逐字符核对：O:8:"stdClass" 的 8 ↔ "stdClass" 8 个字符 ✔\n           s:5:"theme" 的 5 ↔ "theme" 5 个字符 ✔\n           s:4:"dark" 的 4 ↔ "dark" 4 个字符 ✔\n           （攻击载荷同理：类名长度数字必须与类名逐字符对上，否则解析失败——这正是自查要盯的）',
    language: 'plaintext',
    note: '材料为演示样例，站点、类名、载荷均为虚构无害，非现场运行、非真实系统。修法对照：不反序列化不可信数据（改 JSON+结构校验，第 2 步不再走还原）+ 类白名单（EvilCls 不在名单被拒）。',
    source: 'demo',
  },
  guide: {
    why: '盯「有没有把用户数据当说明书组装对象」。判断它存在不难（魔术字节/报错特征），难在理解为什么危险——还原过程会执行数据里的调用链。一句话记牢：字节流是递件人写的说明书，组装线不能照单全收。',
    how: '① 识别数据特征与框架指纹；② 确认还原点（改数据看报错）；③ 授权环境验证链式利用；④ 修复按「不反序列化+类白名单+签名校验+隔离」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-603', summary: '反序列化防护 Cheat Sheet（成因：还原不可信字节流；教训：不反序列化 + 类白名单 + 签名校验）', lesson: '不反序列化 + 类白名单 + 签名校验', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const sandboxEscape: InteractiveEntry = {
  id: 'sandbox-escape',
  kind: 'vuln',
  chapter: 6,
  title: '表达式/脚本沙箱逃逸',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', '系统'],
  aliases: ['沙箱逃逸', '表达式逃逸', '脚本逃逸', 'Sandbox Escape'],
  oneLiner:
    '应用提供「可执行用户脚本」的能力（规则引擎、公式、插件、表达式）时，沙箱限制不严可逃逸到宿主系统执行任意操作。',
  cause:
    '规则引擎/公式字段/插件系统/模板表达式（JEXL、Groovy、JS 引擎、SpEL 等，表达式引擎概念复用 expression-engine）让用户能写「一点逻辑」。为什么给了脚本能力就危险：脚本的表达力与宿主系统只隔一层限制——限制靠黑名单（禁几个关键字）就总有旁路（反射、内置对象、类加载器），限制不严即穿透到宿主。沙箱的本质是「能力白名单」，不是「危险词过滤」。',
  where:
    '低代码平台的公式/表达式字段、规则引擎、模板表达式（SSTI 的姊妹面，见注入类主题）、报表自定义脚本、插件机制、工作流条件表达式。',
  kinds: [
    { name: '反射逃逸', plain: '绕过黑名单摸到危险类', signal: '反射/类加载拿到宿主能力' },
    { name: '内置对象滥用', plain: '从脚本环境的内置对象出发', signal: '经内置对象链走到系统 API' },
    { name: '危险 API 未禁', plain: '白名单没盖住危险能力', signal: '文件/网络/进程 API 可调' },
    { name: '资源无限制', plain: '算力被脚本吃满', signal: '死循环/巨量分配拖垮服务' },
  ],
  signals: [
    '应用接受用户提交的表达式/脚本片段并在服务端求值。',
    '沙箱靠「禁用几个关键字/类名」实现（黑名单式）。',
    '脚本环境里可访问反射、类加载、文件/网络/进程 API。',
    '表达式引擎版本老旧（历史逃逸缺陷多）。',
  ],
  impact: '宿主系统任意代码执行（复用 rce）；数据读取/篡改；拒绝服务（资源耗尽）。',
  verify: [
    '盘点「用户能写逻辑」的功能（公式、规则、插件、模板表达式）。',
    '确认求值位置（服务端还是客户端）与沙箱实现方式（黑名单/白名单/独立进程）。',
    '授权环境试探逃逸手法（内置对象链、反射类名，无害验证）；测试资源限制（超时/内存上限）。',
  ],
  protect: {
    root: '不给用户脚本能力（用预置规则选项替代表达式）；必须给时白名单 API（只暴露必要函数）。',
    harden: '独立进程 + 容器 + 无网络 + 只读文件系统 + 严格超时与资源限制；表达式引擎升级到无已知逃逸的版本。',
    fallback: '脚本执行审计留痕；异常调用告警。',
  },
  mistakes: [
    '用黑名单禁关键字当沙箱（反射/内置对象旁路无穷）。',
    '只限制函数不限制资源（死循环照样拖垮）。',
    '以为「客户端求值就安全」——逻辑一旦回服务端求值就是服务端风险。',
    '与注入类主题的表达式注入混为一谈（那里是「输入进表达式」，本条是「给了表达式能力」——入口不同、根治同源）。',
  ],
  terms: ['sandbox-escape', 'sandbox', 'expression-engine', 'rce'],
  relatedTerms: ['sandbox', 'expression-engine', 'rce'],
  pinyin: { full: 'biao da shi sha xiang tao yi', joined: 'biaodashishaxiangtaoyi', initial: 'bdsxty' },
  related: ['expression-engine', 'insecure-deserialization', 'rce'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的「自定义折扣规则」字段）：\n服务端逻辑（演示样例）：\n  eval_rule(user_expression, sandbox={math: Math})   ← 规则引擎求值用户表达式\n  黑名单：禁止出现 Runtime、ProcessBuilder、exec 字样\n\n攻击表达式（演示样例，经反射绕过字面黑名单）：\n  用内置对象的类加载/反射链取到宿主能力，触发无害验证命令\n  （黑名单只拦「字样」，拦不住「引用」——反射拿到的类名不在字面黑名单里）\n\n逻辑链自查（硬标准：逃逸构造里的类名/方法名与引擎环境逐字符对上，包括大小写与包路径）：\n输入（用户表达式字段，服务端求值）\n→ 机制（沙箱黑名单只校验字面，反射/内置对象链绕过字面检查直达危险 API）\n→ 结果（宿主命令被执行，逃逸成立）✔\n逐字符核对：黑名单匹配的是字面 Runtime/ProcessBuilder/exec ✔\n           反射构造里目标类名/方法名与目标环境 API 逐字符对上（大小写、包路径一致）✔\n           （若类名写错一个字符，逃逸即失败——自查重点）',
    language: 'plaintext',
    note: '材料为演示样例，站点与表达式为虚构、命令为无害验证，非现场运行、非真实系统；效果依赖引擎具体实现与限制配置。修法对照：不给表达式能力（换预置选项）+ 白名单 API + 独立进程容器隔离（逃逸后也被困）。',
    source: 'demo',
  },
  guide: {
    why: '盯「用户能不能在服务端写一点逻辑」。一旦能，就问沙箱是白名单能力还是黑名单词表——黑名单永远有旁路。表达力与宿主只隔一层限制，这层限制必须是「默认拒绝」而非「默认允许」。',
    how: '① 盘点用户写逻辑的功能；② 看求值位置与沙箱实现；③ 授权环境试逃逸与资源限；④ 修复按「不给能力/白名单 API/独立进程容器/资源限额」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-604', summary: '表达式引擎沙箱隔离防护说明（成因：用户脚本能力 + 黑名单式沙箱；教训：白名单 API + 独立进程容器 + 资源限制）', lesson: '白名单 API + 独立进程容器 + 资源限制', source: 'OWASP 沙箱隔离编码实践', credibility: '权威' },
  ],
};

const parserDefect: InteractiveEntry = {
  id: 'parser-defect',
  kind: 'vuln',
  chapter: 6,
  title: 'XML / JSON / YAML 解析缺陷',
  hazard: 3,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['解析缺陷', 'Billion Laughs', 'YAML 反序列化', '重复键', 'JSON 深嵌套'],
  oneLiner:
    'XML/JSON/YAML 解析器被攻击者构造的数据结构触发缺陷——实体膨胀撑爆内存、深层嵌套耗尽 CPU、重复键造成取值分歧、精度丢失造成金额篡改。',
  cause:
    '结构化数据的「结构」本身携带指令性——XML 实体可递归展开、JSON 可无限嵌套、YAML 可声明任意对象、键可重复。解析器照单处理时没有限额与一致性约束，缺陷就出在「结构被信任过头」。为什么重复键能改权限：{"role":"user","role":"admin"} 里两个同名键，不同解析器取值不同（有的取第一个、有的取最后一个）——攻击者让「校验层看 user、执行层看 admin」，两段代码各取所需，权限分歧就成了绕过。',
  where: 'XML/JSON/YAML 接口与文件导入、配置解析、金额/数量字段、带权限字段的请求体。',
  kinds: [
    { name: '实体膨胀', plain: '递归实体撑爆内存', signal: 'Billion Laughs 类载荷致拒绝服务' },
    { name: 'YAML 不安全加载', plain: 'YAML 声明任意对象', signal: 'yaml.load 可构造对象 → 还原执行（联动 6.3）' },
    { name: 'JSON 深嵌套', plain: '超深嵌套耗尽资源', signal: '栈溢出/CPU 耗尽' },
    { name: '重复键分歧', plain: '同名键各取所需', signal: '校验层与执行层取值不同' },
    { name: '数字精度', plain: '大数/浮点丢精度', signal: '金额篡改（JSON 与后端语言精度差异）' },
  ],
  signals: [
    '小体积载荷引发大资源消耗（膨胀/深嵌套）。',
    '重复键请求体在不同层行为不一致。',
    '金额/数量在传输后发生微小变化（精度丢失）。',
    'YAML 加载用的是不安全模式（非 safe_load）。',
  ],
  impact: '拒绝服务（内存/CPU 耗尽）；权限绕过（重复键）；金额篡改（精度）；YAML 不安全加载直达代码执行（与 6.3 同害）。',
  verify: [
    '构造实体膨胀/深嵌套载荷（演示样例，限资源环境），观察内存/CPU 与响应时间。',
    '重复键载荷分别观察校验层与执行层的取值。',
    '金额字段传大整数/高精度浮点，核对入账值。',
    '检查 YAML 加载模式（safe_load 与否）、JSON 解析库的深度/大小限制。',
  ],
  protect: {
    root: '限制实体展开、文档大小与嵌套深度；YAML 用 safe_load（复用 type-validation 思路）；拒绝重复键。',
    harden: '金额用字符串或整数分传递（不走浮点）；解析超时与内存上限。',
    fallback: '解析异常告警；组件升级。',
  },
  mistakes: [
    '只测功能正确性不测畸形输入（解析缺陷都是「怪输入」触发的）。',
    '以为「JSON 比 XML 安全」——深嵌套、重复键、精度问题 JSON 同样有。',
    'YAML 沿用不安全加载（历史上多次直接 RCE）。',
    '重复键当小问题（它是权限绕过，见访问控制与授权主题的参数污染招式）。',
  ],
  terms: ['parser-defect', 'deserialization', 'type-validation', 'info-leak'],
  relatedTerms: ['xxe', 'deserialization', 'redos', 'type-validation'],
  pinyin: { full: 'jie xi que xian', joined: 'jiexiquexian', initial: 'jxqx' },
  related: ['xxe', 'insecure-deserialization', 'redos'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的「更新个人资料」JSON 接口）：\n服务端逻辑（演示样例）：\n  body = json_parse(request.body)      ← 解析 JSON\n  validate(body.role)                  ← 校验层看 role\n  user.role = body.role                ← 执行层赋值\n\n攻击请求体（演示样例）：\n{ "name": "mallory", "role": "user", "role": "admin" }\n  ——同名键 role 出现两次（重复键）\n\n结果（演示样例，解析器取最后一个）：\n  校验层看到 role=user（第一个/或按自己策略取）→ 放行\n  执行层赋值 role=admin（最后一个）→ 权限绕过\n\n逻辑链自查（硬标准：重复键的键名与取值逐字符对上，两次出现的拼写必须完全一致）：\n输入（含重复 role 键的 JSON）\n→ 机制（校验层与执行层对重复键取值不一致——两段代码各取所需）\n→ 结果（校验按 user 放行、赋值按 admin 生效）✔\n逐字符核对："role"（第 1 次）与 "role"（第 2 次）逐字符一致 ✔\n           值 "user" / "admin" 各自完整闭合 ✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与请求体为虚构，非现场运行、非真实系统。修法对照：解析器拒绝重复键（第 2 步解析失败）+ 校验/赋值用同一份解析结果（取值分歧不存在）。',
    source: 'demo',
  },
  guide: {
    why: '盯「结构本身会不会发号施令」。膨胀=结构让解析器做重活、深嵌套=结构让解析器走死路、重复键=结构让两段代码各看各的、精度=结构在传输中变形。一句话：结构不能带指令性，解析器要限额、要一致、要拒绝歧义。',
    how: '① 找全部结构化数据入口；② 四类畸形载荷各试一遍（膨胀/嵌套/重复键/精度）；③ 查 YAML 加载模式与解析限额；④ 修复按「限额+safe_load+拒重复键+金额字符串化」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-INJECT',
  source: 'demo',
  format: 'interactive',
};

const redos: InteractiveEntry = {
  id: 'redos',
  kind: 'vuln',
  chapter: 6,
  title: 'ReDoS（正则表达式拒绝服务）',
  hazard: 2,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['ReDoS', '正则拒绝服务', '正则表达式拒绝服务', 'Regular Expression DoS'],
  oneLiner:
    '存在灾难性回溯的正则（如嵌套量词 (a+)+$）处理超长恶意输入时，匹配尝试指数爆炸，CPU 被拖满、服务不可用。',
  cause:
    '正则引擎匹配失败时会逐个尝试所有可能的分组组合（回溯）。嵌套量词（(a+)+）+ 重叠分支让组合数随输入长度指数增长。为什么正则能拖垮服务：引擎找不到匹配时不甘心，把每条岔路都走一遍再回头——岔路数量随输入指数增长，一个小输入就能让 CPU 一直算下去。校验接口（邮箱/手机号/密码规则）是最常见入口：校验器本该是防线，却成了拒绝服务的入口。',
  where: '输入校验的正则（邮箱、手机号、密码强度、URL、身份证）、搜索/过滤的正则参数、日志分析规则。',
  kinds: [
    { name: '嵌套量词', plain: '(a+)+ 类模式', signal: '特定长输入响应指数变慢' },
    { name: '重叠分支', plain: '(a|a)+ 类模式', signal: '两个分支能匹配同一段' },
    { name: '回溯炸弹', plain: '精心构造的失败串', signal: '短输入引发长耗时' },
  ],
  signals: [
    '某个输入校验接口在特定字符串下响应时间指数增长。',
    '正则含嵌套量词（(x+)+、(x*)*）或重叠分支（(a|a)+）。',
    '无输入长度限制、无正则执行超时。',
  ],
  impact:
    '单请求即可拖满 CPU、无需并发——与一般 DoS（靠流量/并发堆资源）有本质区别，一个精心构造的输入就足以让服务不可用；配合并发可放大成全站不可用。',
  verify: [
    '收集全部服务端正则（校验/解析/过滤），识别嵌套量词与重叠分支。',
    '构造递增长度的失败输入（演示样例），测响应时间曲线（指数增长即命中）。',
    '测输入长度限制与执行超时是否存在。',
  ],
  protect: {
    root: '避免嵌套量词与重叠分支；改用线性时间的正则引擎（RE2 类，无回溯设计）。',
    harden: '限制输入长度；正则执行设超时。',
    fallback: '慢请求告警与限流（复用 rate-limiting）。',
  },
  mistakes: [
    '以为「正则只是校验，无风险」——校验器正是被怪输入打的入口。',
    '只限制请求频率不限输入长度（单个长请求照样拖满）。',
    '用复杂正则追求「一条全匹配」——复杂度正是风险来源。',
  ],
  terms: ['redos', 'parser-defect', 'rate-limiting'],
  relatedTerms: ['parser-defect', 'rate-limiting'],
  pinyin: { full: 'zheng ze biao da shi ju jue fu wu', joined: 'zhengzebiaodashijujiefuwu', initial: 'zzbdsjjfw' },
  related: ['parser-defect', 'rate-limiting'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的邮箱格式校验）：\n服务端逻辑（演示样例）：\n  re.match(r\'^(\\w+\\s?)*$\', user_input)    ← 嵌套量词 (\\w+\\s?)*\n\n攻击输入（演示样例）：\n  "aaaaaaaaaaaaaaaaaaaaaaa!"             ← 24 个 a + 感叹号（结尾不匹配）\n\n机制：\n  引擎把 24 个 a 按 (\\w+\\s?)* 的所有分组组合逐一尝试后失败\n  组合数随 a 的个数指数增长 → CPU 耗时指数上升\n\n逻辑链自查（硬标准：正则模式与触发串逐字符对上，包括量词嵌套与结尾不匹配字符）：\n输入（结尾不匹配的长串，触发回溯）\n→ 机制（嵌套量词使匹配尝试组合数指数爆炸，引擎逐条回溯）\n→ 结果（单请求 CPU 耗尽，接口不可用）✔\n逐字符核对：模式 ^(\\w+\\s?)*$ 为嵌套量词结构（(\\w+\\s?)* 外层 * 内层 +）✔\n           触发串 "aaa…a!" 结尾字符 ! 不在 \\w/\\s 类 → 全部组合尝试后失败 ✔\n           （若串以 a 结尾会匹配成功、无爆炸——不匹配的结尾是触发关键）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与正则为虚构，输入为无害字符，非现场运行、非真实系统。修法对照：改线性引擎/拆解正则（无指数回溯）+ 输入长度限制 + 执行超时（第 2 步机制不成立）。',
    source: 'demo',
  },
  guide: {
    why: '盯「校验用的正则长什么样」。嵌套量词 + 失败结尾 = 回溯炸弹。校验器是每个请求都要过的门——门本身被怪输入卡死，全员过不去。风险不在正则「复杂」，在「回溯组合数」。',
    how: '① 收集服务端正则，找嵌套量词/重叠分支；② 递增长度失败输入测时间曲线；③ 查长度限制与超时；④ 修复按「线性引擎/拆正则+限长度+设超时」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-605', summary: 'ReDoS 灾难性回溯防护说明（成因：嵌套量词正则 + 无超时；教训：线性引擎 + 输入长度限制）', lesson: '线性引擎 + 输入长度限制', source: 'OWASP ReDoS 防护说明', credibility: '权威' },
  ],
};

export const ch6Entries: LearningEntry[] = [
  ssrf,
  xxe,
  insecureDeserialization,
  sandboxEscape,
  parserDefect,
  redos,
];

export default ch6Entries;
