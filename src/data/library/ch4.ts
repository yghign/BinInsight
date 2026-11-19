/**
 * 访问控制与授权 —— 8 条。内容逐字取自 docs/11 v2。
 * 低 3 条（forced-browsing/client-authorization/authz-bypass-checklist）= 形态 A 知识卡 + 3 题；
 * 中 5 条（idor/vertical-escalation/path-traversal/cors-misconfig/permission-model）= 形态 B 案例演示 + 指导（stages 留空）。
 * 4.8 authz-bypass-checklist 为「方法清单」条目：hazard 不填（UI 显示「方法清单」角标，不进危险度筛选桶），templateId 不挂。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, CardEntry, InteractiveEntry } from './types';

const idor: InteractiveEntry = {
  id: 'idor',
  kind: 'vuln',
  chapter: 4,
  title: '水平越权 / IDOR',
  hazard: 5,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['水平越权', 'IDOR', '不安全直接对象引用', '越权读取', '平行越权'],
  oneLiner:
    '服务端根据用户传入的对象标识（ID、订单号、文件名）返回数据，却不校验该对象是否属于当前用户——ID 是门牌号，不是钥匙。',
  cause:
    '接口把用户传入的对象标识直接用于查询/修改，省略了「这个对象归谁」的校验。为什么改个数字就能看别人的：URL 里的 ID 只是「门牌号」——告诉服务端要找哪一户；真正的钥匙应该是「校验请求者是不是这户的主人」。如果服务端只按门牌号取东西、不验主人，那么谁路过都能拿走任何一户的东西。出问题的位置是所有「按标识取资源」的接口，且查询与写入都可能中招（查做校验、写没做，是常见半截子修复）。',
  where:
    '/api/order/1001、/api/user/123/profile、?fileId=abc 这类按标识取资源的接口；批量接口（/api/users?ids=1,2,3）；导出/下载/预览；修改类接口（PUT /api/address/1002）；间接标识（文件名、路径、订单号、发票号、时间戳组合）。',
  kinds: [
    { name: '读取越权', plain: '看到不该看的数据', signal: '改 ID 后返回他人数据' },
    { name: '修改越权', plain: '改了不该改的数据', signal: '改他人订单/地址成功' },
    { name: '删除越权', plain: '删了不该删的数据', signal: 'DELETE 他人资源成功' },
    { name: '批量越权', plain: '一次捞一片', signal: '批量接口逐条无校验' },
  ],
  signals: [
    '接口形如 /api/order/1001、/api/user/123/profile、?fileId=abc。',
    '把 ID 改成相邻值或他人 ID，直接返回他人数据。',
    '使用 UUID 但 UUID 可从其他接口、导出文件、邮件链接、JS 源码中获得（UUID 不等于授权——它只是难猜的门牌号，仍然是门牌号）。',
    '批量接口返回全部；修改对象时越权成功。',
  ],
  impact:
    '批量数据泄露（用户信息、订单、聊天记录、发票、病历）；越权修改/删除；改他人邮箱/手机号升级为账号接管。',
  verify: [
    '注册两个账号 A、B，抓取 A 的所有请求，把其中的对象标识替换成 B 的，逐一重放。',
    '覆盖所有方法：GET 查、POST 增、PUT/PATCH 改、DELETE 删，以及导出/下载/预览。',
    '关注间接标识：文件名、路径、自增编号、订单号、发票号、时间戳组合。',
    '关注批量与嵌套：数组参数、嵌套对象里的 ID、GraphQL 的节点 ID。',
    '关注「先查后改」的两步流程：查询做了校验，写入没做。',
  ],
  protect: {
    root: '服务端强制对象级授权——每次访问资源都校验归属（resource.owner_id == current_user.id），且校验下沉到数据层（统一查询条件带上用户/租户 ID），不靠每个接口的开发者自觉。',
    harden: '批量接口逐条校验（不只校验第一条）；不可枚举 ID（UUID）只能降低风险、不能替代授权校验；建立「默认拒绝」的授权中间件（复用 authorization-middleware）。',
    fallback: '越权尝试告警留痕；敏感数据导出加二次校验。',
  },
  mistakes: [
    '只测 GET 不测 PUT/DELETE。',
    '只测主键不测「业务编号」（订单号、发票号）。',
    '认为前端不展示入口就不存在（隐藏接口照样能调）。',
    '只测 API 不测导出 Excel / 下载附件。',
    '把 UUID 当授权（难猜≠不可越权）。',
  ],
  terms: ['idor', 'authorization', 'privilege-escalation', 'authorization-middleware'],
  relatedTerms: ['authorization', 'privilege-escalation', 'tenant-isolation'],
  pinyin: { full: 'shui ping yue quan idor', joined: 'shuipingyuequanidor', initial: 'spyqidor' },
  related: ['privilege-escalation', 'tenant-isolation', 'vertical-escalation'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的订单接口）：\n1. 账号 A 登录，访问 /api/order/1001 → 返回 A 自己的订单（正常）\n   请求头带 A 的会话 Cookie\n2. 把路径里的 1001 改成 1002（账号 B 的订单号），其余不变，重放\n3. 服务端处理（演示样例）：\n   SELECT * FROM orders WHERE id = 1002   ← 只按 ID 取\n   （没有 AND owner_id = 当前用户 的归属校验）\n4. 返回 B 的订单明细（收货人、地址、金额）\n\n逻辑链自查：\n输入（A 的会话 + 把对象标识改成 B 的 1002）\n→ 机制（服务端按 ID 直接取数，不校验对象归属）\n→ 结果（A 读到了 B 的订单）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与订单为虚构，非现场运行、非真实系统。修法对照：查询条件加归属校验（AND owner_id = A），第 4 步返回空/403，越权被堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「每次取资源时，服务端有没有问一句『这东西是不是你的』」。ID 只是指路的门牌号，归属校验才是钥匙——这一句想通，本主题一大半条目都通了。',
    how: '① 双账号注册，抓 A 的全部请求；② 对象标识（含订单号等业务编号）换成 B 的逐一重放；③ 查/改/删/导出四个面都测；④ 修复按「对象级授权下沉数据层 + 批量逐条校验 + 默认拒绝」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-401', summary: 'IDOR 越权读取他人数据实验（成因：接口按 ID 取数无归属校验；教训：对象级授权下沉数据层）', lesson: '对象级授权下沉数据层', source: 'PortSwigger Web Security Academy — Access control / IDOR 实验', credibility: '平台' },
  ],
};

const verticalEscalation: InteractiveEntry = {
  id: 'vertical-escalation',
  kind: 'vuln',
  chapter: 4,
  title: '垂直越权（功能级授权缺失）',
  hazard: 5,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['垂直越权', '功能级授权缺失', '越权调用', '提权', '横向不到纵向到'],
  oneLiner:
    '低权限用户可以直接访问高权限功能接口——因为服务端只在页面/菜单层面做了权限控制，接口层没做。',
  cause:
    '权限控制被做在了「给谁看」而不是「给谁用」：菜单按角色显示/隐藏，但背后的接口没有独立鉴权。为什么菜单隐藏不算权限控制：菜单是给人看的界面，接口才是给机器调的门——用户看不到按钮，但按钮背后的地址（接口）一直都在，抓包直接敲门就进去了。前端任何「隐藏」「禁用」都只是视觉效果，控制不了请求。',
  where:
    '/admin/ 系列接口、管理后台 API、内部接口（/internal/、/actuator/、/debug/）、旧版本接口（/api/v1/）、不同角色共用的接口。',
  kinds: [
    { name: '直调管理接口', plain: '低权账号调 /admin/*', signal: '普通用户执行管理功能成功' },
    { name: '内部端点暴露', plain: '调试接口可访问', signal: '/actuator/、/debug/ 直达' },
    { name: '方法/路径/版本绕过', plain: '换写法过鉴权（换方法、换路径写法、换版本）', signal: '详见 4.8 招式 1-3，技巧集中清单卡维护' },
  ],
  signals: [
    '普通用户抓包调用 /admin/user/list、/admin/user/delete 成功。',
    '菜单被隐藏但接口可访问。',
    '接口权限依赖前端传的 role 字段；不同角色共用同一套接口、仅靠前端判断。',
  ],
  impact:
    '低权用户获得管理能力（管用户、改配置、删数据）；一次成功即整个后台失守；配合 4.8 技巧清单扩大绕过面。',
  verify: [
    '用低权限账号遍历高权限账号的功能接口（接口清单可从 JS 源码、Swagger、历史版本、报错堆栈中发现）。',
    '关注请求方法替换：GET 被拒时试 POST/PUT；路径大小写、末尾加 /、加 ;、加 .json。',
    '关注 API 版本：/api/v2/ 有校验，/api/v1/ 可能没有。',
    '关注内部接口：/internal/、/actuator/、/debug/。',
  ],
  protect: {
    root: '接口级统一鉴权（网关/中间件按「路径 + 方法 + 角色」拦截，复用 authorization-middleware），不依赖前端；默认拒绝。',
    harden: '权限矩阵测试纳入持续集成；隐藏接口也要鉴权；内部/调试端点生产环境关闭。',
    fallback: '越权调用告警留痕。',
  },
  mistakes: [
    '只保护「页面入口」不保护「接口」——页面拦得住眼睛，拦不住请求。',
    '以为「接口没写进文档就没人知道」——JS 源码、历史版本、报错堆栈都会泄露。',
    '只测当前版本接口，漏测 /api/v1/ 旧版。',
    '权限靠前端传的 role 字段判断（改包即提权）。',
  ],
  terms: ['vertical-escalation', 'privilege-escalation', 'authorization', 'authorization-middleware'],
  relatedTerms: ['privilege-escalation', 'authorization', 'authorization-middleware'],
  pinyin: { full: 'chui zhi yue quan', joined: 'chuizhiyuequan', initial: 'czyq' },
  related: ['idor', 'privilege-escalation', 'client-authorization'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 有管理后台）：\n1. 普通用户 U 登录，页面上没有「用户管理」菜单（前端按角色隐藏）\n2. U 在 JS 源码里看到路由表中有 /admin/user/list\n   用自己已登录的会话直接请求：GET /admin/user/list\n3. 服务端处理（演示样例）：\n   该接口只在「渲染菜单」时判断了角色\n   接口本身没有鉴权中间件 → 不检查 U 的角色\n4. 返回全站用户列表（含邮箱、手机号）\n\n逻辑链自查：\n输入（普通用户会话 + 直接请求管理接口）\n→ 机制（鉴权只做在菜单层，接口层无校验）\n→ 结果（低权用户拿到管理数据）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点为虚构，非现场运行、非真实系统。修法对照：接口级统一鉴权中间件（路径+方法+角色白名单），第 4 步返回 403，越权被堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「鉴权发生在哪一层」。如果答案是「前端页面/菜单」，那等于没防——每一个接口都必须自己把关，不看它有没有被藏起来。菜单给眼睛看，接口给请求调，两者是两道门。',
    how: '① 拿低权账号收集高权接口清单（JS 路由表/Swagger/历史版本）；② 逐个直调 + 换方法/路径/版本；③ 重点看内部与调试端点；④ 修复按「接口级统一鉴权 + 默认拒绝 + 权限矩阵回归」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-402', summary: '垂直越权直调管理接口实验（成因：鉴权只做在页面层；教训：接口级统一鉴权+默认拒绝）', lesson: '接口级统一鉴权+默认拒绝', source: 'PortSwigger Web Security Academy — Access control 实验', credibility: '平台' },
    { refId: 'RC-403', summary: 'OWASP 访问控制 Cheat Sheet（功能级/对象级授权设计规范）', lesson: '功能级/对象级授权设计规范', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const pathTraversal: InteractiveEntry = {
  id: 'path-traversal',
  kind: 'vuln',
  chapter: 4,
  title: '目录遍历 / 路径穿越',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['目录遍历', '路径穿越', 'Path Traversal', '目录穿越', '../ 穿越'],
  oneLiner:
    '文件路径参数未规范化时，攻击者用 ../ 跳出限定目录，读取或写入任意文件。',
  cause:
    '程序用用户输入拼接文件路径且不规范化。../ 的含义是「回到上一级目录」——连续使用就能从限定的子目录一路「走」到系统任何位置。为什么只过滤 ../ 不够：过滤发生在规范化之前就可能被变体绕过（如 ....// 去掉中间的 ../ 后又拼出 ../），或过滤了 ../ 漏了 ..\\（Windows 分隔符）与各种编码写法。正确顺序是先规范化、再校验结果是否仍在白名单目录内。',
  where:
    '下载、预览、模板加载、日志读取、语言包/皮肤切换、导出路径、图片/附件读取——一切「文件名/路径」参数。',
  kinds: [
    { name: '相对穿越', plain: '../ 逐级跳出', signal: '读到限定目录外的文件' },
    { name: '编码变体', plain: '换写法绕过滤', signal: '....//、%2e%2e%2f 生效' },
    { name: '绝对路径', plain: '直接给全路径', signal: '/etc/passwd、C:\\windows\\win.ini 可读' },
    { name: '分隔符差异', plain: '系统差异绕过', signal: '..\\、..%5c 在 Windows 生效' },
  ],
  signals: [
    '?file=../../etc/passwd、?path=..%2f..%2f、?img=....//....// 生效。',
    '不同系统分隔符差异（..\\、..%5c）绕过。',
    '文件存在/大小差异可观测（用于确认）。',
  ],
  impact:
    '读取配置、源码、密钥、系统口令文件；配合上传实现写入（属文件与服务端资源主题的上传缺陷）→ 可达远程代码执行（复用 rce）。',
  verify: [
    '收集所有「文件名/路径」参数（下载、预览、模板、日志、语言包、皮肤、导出路径）。',
    '测试编码变体（%2e%2e%2f、..%252f、UTF-8 超长编码、....//）。',
    '测试绝对路径（/etc/passwd、C:\\windows\\win.ini）。',
    '用文件是否存在/大小差异确认读取成功。',
  ],
  protect: {
    root: '不用用户输入拼路径——用 ID 映射真实路径（复用 4.1 的「标识→归属」思路）；确需拼接时，canonicalPath 规范化后再校验前缀是否在白名单目录内（复用 allowlist）。',
    harden: '作为纵深防御补充，可额外拒绝 ..、绝对路径、空字节，但不能替代 root 的「规范化 + 白名单」；且必须同时区分 .. 与 ..\\（Linux/Windows 分隔符差异）；以最小权限运行进程。',
    fallback: '文件访问审计留痕。',
  },
  mistakes: [
    '只过滤 ../（....// 绕过：去掉一层后重新拼出）。',
    '规范化前校验（顺序错误——必须先规范化再校验）。',
    '只校验 Linux 分隔符漏 Windows 的 ..\\。',
    '以为「读到的文件没价值」——配置与源码常是下一步攻击的钥匙。',
  ],
  terms: ['path-traversal', 'allowlist', 'arbitrary-rw', 'rce'],
  relatedTerms: ['allowlist', 'arbitrary-rw', 'rce'],
  pinyin: { full: 'lu jing chuan yue', joined: 'lujingchuanyue', initial: 'ljcy' },
  related: ['idor', 'forced-browsing', 'arbitrary-rw'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的模板下载接口）：\n1. 正常请求：GET /download?file=report.pdf\n   服务端拼路径：/var/app/templates/report.pdf → 下载成功（正常）\n2. 攻击请求：GET /download?file=../../../../etc/passwd\n   服务端拼路径：/var/app/templates/../../../../etc/passwd\n3. 文件系统逐级回退后解析为 /etc/passwd\n   —— 服务端只做了字符串拼接，无规范化、无白名单校验\n4. 返回系统口令文件内容\n\n逻辑链自查：\n输入（路径参数带 ../../ 穿越序列）\n→ 机制（拼接不规范化，../ 被文件系统解释为「上一级」）\n→ 结果（读到限定目录外的系统文件）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与路径为虚构，非现场运行、非真实系统。修法对照：先规范化路径、再校验结果前缀在白名单目录内，第 3 步校验失败返回 400，穿越被堵。',
    source: 'demo',
  },
  guide: {
    why: '盯「路径是拼出来的还是映射出来的」。凡是有「文件名/路径」参数的接口都问一句：../ 会不会被文件系统当成「上一级」。过滤不是不行，但顺序必须是先规范化再校验，否则变体绕过滤。',
    how: '① 收集全部路径参数；② 试 ../、编码变体、绝对路径三种面；③ 用文件存在性差异确认；④ 修复按「ID 映射路径 + 规范化后白名单 + 最小权限」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-FILE',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-405', summary: '路径穿越读取任意文件实验（成因：路径参数拼接未规范化；教训：规范化后白名单 + ID 映射路径）', lesson: '规范化后白名单 + ID 映射路径', source: 'PortSwigger Web Security Academy — Path Traversal 实验', credibility: '平台' },
  ],
};

const forcedBrowsing: CardEntry = {
  id: 'forced-browsing',
  kind: 'vuln',
  chapter: 4,
  title: '强制浏览 / 未授权访问敏感端点',
  hazard: 4,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['强制浏览', '未授权访问', 'Forced Browsing', '敏感端点暴露', '目录爆破'],
  oneLiner:
    '敏感页面或接口依赖「没被链接到」来保护（隐晦式安全），实际可被直接访问——找不到入口 ≠ 进不去。',
  cause:
    '开发者以为「没有入口链接就不会有人到」，于是这些端点没做鉴权——但 URL 是可以被猜、被扫、被从旁路（JS 源码、报错页、robots.txt）看到的。为什么隐晦不算安全：链接只是「告诉人地址在哪」，真正的防护是「进门时验身份权限」；攻击者不需要链接，直接敲地址就来了。安全必须靠「每次都验」，不能靠「希望别人找不到」。',
  where:
    '/admin、/backup.zip、/.git/config、/swagger-ui.html、/actuator/env、/phpinfo.php、/console、/druid/、/nacos/ 等管理/调试/备份端点（部分敏感文件暴露属信息泄露主题，此处关注「未授权可达」）。',
  kinds: [
    { name: '管理端点暴露', plain: '后台/管理页直访', signal: '/admin、/nacos/ 可达' },
    { name: '备份/配置文件', plain: '打包文件在 Web 根', signal: '/backup.zip、/.git/config' },
    { name: '框架默认端点', plain: '中间件自带入口', signal: '/actuator/env、/swagger-ui.html' },
    { name: '调试端点残留', plain: '上线没关调试', signal: '/console、/phpinfo.php' },
  ],
  signals: [
    '直接访问 /admin、/backup.zip、/.git/config 等成功。',
    'robots.txt、sitemap、错误页、JS 源码里出现未在导航中的路径。',
    '框架默认路径（/actuator、/swagger-ui.html）可访问。',
  ],
  impact:
    '管理后台失守、配置/源码/密钥泄露（常是下一步攻击的钥匙）、框架端点暴露系统信息。',
  verify: [
    '目录爆破（结合指纹选字典）。',
    '读取 JS/前端路由表找隐藏路径；看 robots.txt、sitemap、错误页。',
    '检查框架默认路径与调试端点是否残留。',
  ],
  protect: {
    root: '所有端点显式鉴权（默认拒绝，复用 authorization-middleware），不依赖「有没有链接」。',
    harden: '生产环境关闭管理/调试端点；统一网关拦截；敏感文件不放 Web 根目录。',
    fallback: '异常路径扫描告警。',
  },
  mistakes: [
    '把「没入口」当防护（隐晦式安全）。',
    '只清页面链接不清端点（删了导航链接，接口还在）。',
    '忘了 .git、备份文件、框架默认端点这类「不在业务里」的暴露面。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某站点导航里没有后台入口，但直接访问 /admin 出现了管理登录页。',
      question: '这说明什么？',
      options: [
        { text: '端点靠「隐藏」保护、没做鉴权——隐晦式安全', correct: true, explain: '正确。找不到入口 ≠ 进不去，直接敲地址就到了。' },
        { text: '这是正常设计，后台本来就不该有链接', correct: false, explain: '错误。问题不在链接，在于端点未鉴权。' },
        { text: '这是 SQL 注入', correct: false, explain: '错误。没有涉及查询结构。' },
        { text: '说明服务器被入侵了', correct: false, explain: '错误。端点本来就在，只是没防护。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 所有端点显式鉴权、默认拒绝；② 把 /admin 改名成 /admin_x8f2；③ 从导航里删掉链接；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 显式鉴权 + 默认拒绝', correct: true, explain: '正确。无论地址多隐蔽，每次访问都验身份权限，才是防护。' },
        { text: '② 改名', correct: false, explain: '错误。仍是隐晦式安全，路径可被扫出。' },
        { text: '③ 删链接', correct: false, explain: '错误。链接删了端点还在。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底，不替代鉴权。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「后台路径我改得很随机，没人猜得到」。',
      question: '为什么站不住？',
      options: [
        { text: '路径可被爆破/从 JS 与报错泄露，「猜不到」不是安全属性', correct: true, explain: '正确。安全要靠鉴权，不靠运气。' },
        { text: '随机性再强一点就行', correct: false, explain: '错误。治标不治本。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。与传输加密无关。' },
        { text: '只要不写进文档就安全', correct: false, explain: '错误。历史版本、JS 源码都会泄露。' },
      ],
    },
  ],
  terms: ['forced-browsing', 'access-control', 'authorization', 'authorization-middleware'],
  relatedTerms: ['access-control', 'authorization', 'authorization-middleware'],
  pinyin: { full: 'qiang zhi liu lan', joined: 'qiangzhiliulan', initial: 'qzll' },
  related: ['vertical-escalation', 'path-traversal', 'access-control'],
  source: 'demo',
  format: 'card',
};

const corsMisconfig: InteractiveEntry = {
  id: 'cors-misconfig',
  kind: 'vuln',
  chapter: 4,
  title: 'CORS 配置错误',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['CORS 配置错误', '跨域资源共享', 'CORS', 'Origin 反射'],
  oneLiner:
    '服务端把任意 Origin 反射进 Access-Control-Allow-Origin 且允许携带凭证时，任意站点都能读取用户在该站的数据。',
  cause:
    'CORS 是浏览器「同源策略」（复用 same-origin-policy）的放行清单：服务端用 Access-Control-Allow-Origin（ACAO）告诉浏览器「允许哪个站点的脚本读我的响应」。如果服务端把请求里的 Origin 原样反射回 ACAO、又开着 Allow-Credentials: true，就等于对攻击者说「你的站点可以带凭证读我」。为什么反射 Origin 等于开门：浏览器只看服务端回的 ACAO 是否等于「当前页面的域名」；反射 Origin 时它永远相等——不管请求来自谁，门都开。通配 * 单独用也危险（配合凭证时浏览器会拦，但 null、子串匹配等变体常绕）。',
  where:
    'API 响应头配置、反向代理/网关的 CORS 配置、Origin 校验代码（startsWith/endsWith 误用）、接受 Origin: null 的配置。',
  kinds: [
    { name: 'Origin 反射', plain: '谁来都回显谁', signal: 'ACAO 等于请求的 Origin' },
    { name: '通配 + 凭证', plain: '全放行还带凭证', signal: '* 与 Allow-Credentials 并存（配置意图）' },
    { name: 'null 放行', plain: '接受空来源', signal: 'Origin: null 被接受（sandbox/data: 可产生）' },
    { name: '子串匹配', plain: '校验用包含而非全等', signal: 'evil-trusted.com 绕过' },
  ],
  signals: [
    '响应头 Access-Control-Allow-Origin 动态反射请求的 Origin。',
    '同时存在 Access-Control-Allow-Credentials: true。',
    '接受 Origin: null；校验用 startsWith/endsWith（evil-trusted.com、trusted.com.evil.com 绕过）。',
  ],
  impact:
    '跨域读取用户敏感数据（配合诱导访问或既有 XSS），实质是「浏览器层面的越权」——身份是真的、会话是好的，但数据被别的站点读走了。',
  verify: [
    '用攻击者域名发跨域请求（带凭证），看 ACAO 是否反射该域。',
    '测 Origin: null、子串变体（evil-trusted.com）。',
    '只测 GET 不够——测带凭证请求；关注预检请求（OPTIONS）的差异。',
    '把「没有 ACAO 头」当作待验证而非无风险（要测实际能否读到响应体）。',
  ],
  protect: {
    root: 'Origin 严格全等白名单（复用 origin-check、allowlist）；只对必要接口开启 CORS。',
    harden: 'Allow-Credentials 与通配符不能同时使用；不反射 Origin；null 一律拒绝。',
    fallback: '敏感接口禁用 CORS 而非放宽；异常跨域来源告警。',
  },
  mistakes: [
    '只测 GET 不测带凭证请求。',
    '忽略预检请求（OPTIONS）的配置差异。',
    '把「没有 ACAO 头」当作无风险。',
    '校验用子串匹配（startsWith/endsWith）而非全等。',
  ],
  terms: ['cors-misconfig', 'same-origin-policy', 'origin-check', 'allowlist'],
  relatedTerms: ['same-origin-policy', 'origin-check', 'client-storage-leak'],
  pinyin: { full: 'kua yu zi yuan pei zhi cuo wu', joined: 'kuayuziyuanpeizhicuowu', initial: 'kyzypzcuw' },
  related: ['same-origin-policy', 'origin-check', 'client-storage-leak'],
  caseDemo: {
    material:
      "场景（演示样例，站点 bank.example 的 API 配置）：\n服务端逻辑（演示样例）：\n  resp.setHeader('Access-Control-Allow-Origin', req.headers.Origin)  ← 反射\n  resp.setHeader('Access-Control-Allow-Credentials', 'true')\n\n攻击步骤：\n1. 受害者已登录 bank.example（会话 Cookie 有效），访问攻击者页 evil.example\n2. evil.example 的脚本发跨域请求（带凭证）：\n   fetch('https://bank.example/api/me', { credentials: 'include' })\n3. 浏览器带受害者 Cookie 发请求 → 服务端把 evil.example 反射进 ACAO\n4. 浏览器比对：ACAO == evil.example（脚本所在域）→ 放行\n   evil 的脚本读到受害者账户资料（JSON）\n\n逻辑链自查：\n输入（攻击者页面发带凭证的跨域请求 + 受害者已登录）\n→ 机制（服务端反射 Origin + 允许凭证，浏览器按 ACAO 放行）\n→ 结果（攻击者脚本读到受害者数据）✔ 每步成立",
    language: 'plaintext',
    note: '材料为演示样例，站点为虚构，非现场运行、非真实系统；演示假设受害者会话 Cookie 允许跨站携带（SameSite=None 或旧配置）——若 Cookie 为 SameSite=Lax/Strict，跨站请求不带凭证，需结合站内 XSS 放大，本卡不展开。修法对照：Origin 全等白名单，第 3 步 ACAO 不含 evil.example，第 4 步浏览器拦截，跨域读失败。',
    source: 'demo',
  },
  guide: {
    why: 'CORS 是「谁能读我的响应」的放行清单。盯住两行配置问：ACAO 是不是反射了请求的 Origin、凭证是不是开着——两者同时成立时，任何站点都能借用户的身份读数据。这是浏览器层面的越权：身份没错，边界错了。',
    how: '① 用攻击者域名发带凭证跨域请求看 ACAO；② 测 null 与子串变体；③ 分清「无 ACAO 头」与「反射 ACAO」；④ 修复按「全等白名单 + 按接口最小开放 + 凭证与通配不共存」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-404', summary: 'CORS 反射 Origin 跨域读取实验（成因：ACAO 反射 + 允许凭证；教训：Origin 全等白名单）', lesson: 'Origin 全等白名单', source: 'PortSwigger Web Security Academy — CORS 实验', credibility: '平台' },
  ],
};

const permissionModel: InteractiveEntry = {
  id: 'permission-model',
  kind: 'vuln',
  chapter: 4,
  title: '权限模型缺陷',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', 'API'],
  aliases: ['权限模型缺陷', '批量赋值', '租户隔离缺失', '权限缓存', 'Mass Assignment'],
  oneLiner:
    '权限模型本身有洞——最典型的是注册/更新接口把请求字段照单全收，攻击者多塞一个 role: admin 就给自己授了权。',
  cause:
    '不是「某个接口忘了鉴权」，而是权限模型的设计与实现不一致：① 批量赋值——注册/更新接口把请求字段原样绑定到对象，攻击者提交 {"role":"admin"} 就给自己授了权；② 租户隔离缺失——多租户系统的租户 ID 由前端传，攻击者改个 ID 看到别家公司数据；③ 缓存不失效——角色变更后旧权限仍在生效；④ 判断用「包含」——admin 与 administrator 混淆。为什么批量赋值能提权：接口把「用户该填的字段」和「系统该定的字段」混在一条绑定里，攻击者在请求里多塞一个 role 字段，就搭了「合法请求」的便车给自己加了权限——字段该谁定，就只能谁定。',
  where:
    '注册/资料更新接口（批量赋值）、多租户数据查询（租户 ID 来源）、角色/权限变更流程（缓存失效）、权限判断代码（includes 误用）。',
  kinds: [
    { name: '批量赋值', plain: '请求字段直接绑对象', signal: '提交 role/isAdmin 成功' },
    { name: '租户隔离缺失', plain: '换租户 ID 看别家', signal: '租户 ID 由前端传' },
    { name: '缓存不失效', plain: '改了角色没生效', signal: '旧权限仍可用' },
    { name: '包含式判断', plain: '用「包含」比角色', signal: 'admin 匹配到 administrator' },
  ],
  signals: [
    '注册时提交 {"role":"admin"}、{"isAdmin":true} 成功。',
    '多租户系统中 A 公司账号能查到 B 公司数据（租户 ID 由前端传）。',
    '角色变更后旧权限仍生效（缓存未刷新）。',
    '权限判断用「包含」而非「全等」。',
  ],
  impact:
    '注册即提权（拿到管理员）；跨租户数据泄露（企业数据一锅端）；降权不生效（被撤职的账号仍能操作）。',
  verify: [
    '注册/更新接口试探多提交字段（role、isAdmin、tenantId），看是否被绑定生效。',
    '多租户系统改租户 ID 重放请求，看数据边界。',
    '角色降权后用旧会话/旧缓存重试。',
    '权限值用前缀/包含变体试（admin vs administrator）。',
  ],
  protect: {
    root: '字段级白名单绑定（DTO 只接收允许的字段，复用 allowlist）；租户 ID 从服务端会话取，绝不从请求参数取。',
    harden: '权限变更即时失效（缓存刷新）；权限判断用显式枚举全等比较。',
    fallback: '权限变更审计留痕。',
  },
  mistakes: [
    '以为「ORM 自动绑定」就安全——批量赋值恰恰是自动绑定的副作用。',
    '租户 ID 图省事从请求参数取（改包即跨租户）。',
    '只测「提权」不测「降权」（缓存不失效）。',
    '用字符串包含判断角色（administrator 命中 admin）。',
  ],
  terms: ['permission-model', 'mass-assignment', 'tenant-isolation', 'authorization'],
  relatedTerms: ['mass-assignment', 'tenant-isolation', 'authorization'],
  pinyin: { full: 'quan xian mo xing que xian', joined: 'quanxianmoxingquexian', initial: 'qxmxqx' },
  related: ['idor', 'vertical-escalation', 'mass-assignment'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的注册接口）：\n正常请求：POST /api/register\n  { "username": "alice", "password": "..." }\n服务端（演示样例）：把请求字段直接绑定到 User 对象并保存\n\n攻击请求：POST /api/register\n  { "username": "mallory", "password": "...", "role": "admin" }\n  ← 多塞一个 role 字段\n\n服务端处理：请求字段原样绑定（无字段白名单）\n  → User{username: mallory, role: admin} 入库\nmallory 登录后即拥有管理员权限\n\n逻辑链自查：\n输入（注册请求多提交 role:admin 字段）\n→ 机制（接口批量绑定请求字段，无字段白名单，系统字段被用户字段搭便车）\n→ 结果（注册出管理员账号）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点为虚构，非现场运行、非真实系统。修法对照：DTO 字段白名单（只收 username/password，role 由服务端默认值定），第 3 步 role 字段被丢弃，提权失败。',
    source: 'demo',
  },
  guide: {
    why: '这类洞不在「某个接口忘了检查」，而在权限模型本身。盯三件事：字段该谁定（批量赋值）、数据归谁（租户隔离）、变了有没有生效（缓存）。模型有洞时，修一个接口只是堵一个口。',
    how: '① 注册/更新接口试塞角色字段；② 多租户改 ID 试边界；③ 降权后试旧权限；④ 修复按「字段白名单 + 租户 ID 服务端取 + 变更即时失效 + 显式枚举比较」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-AUTHZ',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-406', summary: '批量赋值（Mass Assignment）提权防护规范（成因：接口照单绑定请求字段；教训：DTO 字段白名单、系统字段服务端定）', lesson: 'DTO 字段白名单、系统字段服务端定', source: 'OWASP Mass Assignment Prevention Cheat Sheet', credibility: '权威' },
  ],
};

const clientAuthorization: CardEntry = {
  id: 'client-authorization',
  kind: 'vuln',
  chapter: 4,
  title: '客户端授权（权限判断放前端）',
  hazard: 4,
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['客户端授权', '前端鉴权', '权限判断放前端', 'Client-side Authorization'],
  oneLiner:
    '前端隐藏按钮/菜单当作权限控制，后端接口无校验，抓包直接调用即可越权。',
  cause:
    '权限判断被放在了浏览器里——按角色显示/隐藏按钮、禁用输入框，后端接口却「信任前端已经把过关」。为什么前端隐藏按钮不算防护：前端代码全部在用户手里——隐藏只是把按钮从屏幕上拿掉，接口地址和请求参数都能从 JS 源码里读到、从抓包里看到；用户完全可以在浏览器外直接发请求。前端是「建议」，服务端才是「决定」。',
  where:
    '按角色显隐的按钮/菜单背后的接口、前端路由守卫保护的页面对应的 API、依赖前端传 role 字段判断的接口。',
  kinds: [
    { name: '按钮/菜单隐藏', plain: '界面不给入口', signal: '接口可直调' },
    { name: '前端路由守卫', plain: '页面跳转被拦', signal: 'API 直接可访问' },
    { name: '依赖前端字段', plain: '信前端传的角色', signal: '改包即提权' },
  ],
  signals: [
    '按钮隐藏但接口可直调成功。',
    '前端路由拦住了页面，但背后的 API 无校验。',
    '接口权限依赖请求里携带的 role/isAdmin 字段。',
  ],
  impact: '任何用户可越权执行高权功能（与 4.2 垂直越权同果）；前端「权限体系」整体失效。',
  verify: [
    '对比前端可见功能与实际接口清单（JS 源码/网络面板），找「隐藏但存在」的接口。',
    '用低权账号直调这些接口（抓包改请求）。',
    '检查请求里的角色/权限字段是否被服务端信任。',
  ],
  protect: {
    root: '前端隐藏只是体验优化，所有权限判断必须在服务端；接口层统一鉴权（复用 authorization-middleware）。',
    harden: '服务端不信任任何客户端传来的身份/角色字段（从会话取，与 4.6 联动）。',
    fallback: '前端一致性校验（隐藏处与接口权限对齐），仅作体验兜底。',
  },
  mistakes: [
    '把「前端没按钮」当「后端没权限」。',
    '以为「前端做了校验，后端不用重复」——重复的正是服务端的决定权。',
    '服务端信任请求里的 role 字段（改包即提权）。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某系统按角色隐藏「删除用户」按钮，但用普通账号抓包调用删除接口成功。',
      question: '这说明什么？',
      options: [
        { text: '权限判断只做在前端，服务端未鉴权', correct: true, explain: '正确。按钮隐藏只是界面效果，接口没有把关。' },
        { text: '前端代码写错了', correct: false, explain: '错误。问题在服务端缺校验，前端隐藏本身没错（错在当防护用）。' },
        { text: '这是 CSRF', correct: false, explain: '错误。没有借他人身份发请求，是自己的低权账号直调。' },
        { text: '说明删除接口有 SQL 注入', correct: false, explain: '错误。与查询结构无关。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 服务端接口级鉴权；② 前端把按钮删干净；③ 前端加校验拦截；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 服务端接口级鉴权', correct: true, explain: '正确。决定权在服务端，前端怎么显示都影响不了。' },
        { text: '② 删干净按钮', correct: false, explain: '错误。接口还在，直调照样成功。' },
        { text: '③ 前端加拦截', correct: false, explain: '错误。拦截在浏览器里，可绕过。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「前端已经按角色隐藏了，后端再校验是重复劳动」。',
      question: '为什么错？',
      options: [
        { text: '前端隐藏拦不住请求，服务端校验才是决定权，不是重复', correct: true, explain: '正确。前端是建议、服务端是决定，两者职责不同。' },
        { text: '他说得对，可以省', correct: false, explain: '错误。省掉的正是防护本体。' },
        { text: '只要加 HTTPS 就行', correct: false, explain: '错误。与传输加密无关。' },
        { text: '只要接口难猜就行', correct: false, explain: '错误。隐晦不算安全（见强制浏览）。' },
      ],
    },
  ],
  terms: ['client-authorization', 'authorization', 'authorization-middleware', 'access-control'],
  relatedTerms: ['authorization', 'authorization-middleware', 'access-control'],
  pinyin: { full: 'ke hu duan shou quan', joined: 'kehuduanshouquan', initial: 'khdsq' },
  related: ['vertical-escalation', 'forced-browsing', 'authorization'],
  source: 'demo',
  format: 'card',
};

const authzBypassChecklist: CardEntry = {
  id: 'authz-bypass-checklist',
  kind: 'vuln',
  chapter: 4,
  title: '授权绕过通用技巧清单',
  difficulty: 'beginner',
  scene: ['Web', 'API'],
  aliases: ['授权绕过技巧', '越权测试清单', 'Authorization Bypass Checklist'],
  oneLiner:
    '接口「看起来有校验」时的九招通用试探——换方法、换路径、换版本、换身份载体（含路径覆盖头 4b）、参数污染、类型混淆、大小写编码、覆盖字段、越权链。',
  cause:
    '鉴权逻辑常常只覆盖「默认路径」——只认一种 HTTP 方法、一种路径写法、一种参数形态。攻击者换一种写法就绕过检查，落到没被覆盖的分支。为什么换写法能绕过：鉴权中间件的匹配规则是「按路径+方法」写的清单，清单外的写法（大小写不同、多个斜杠、加后缀）不命中清单，就被当成「无需鉴权的请求」放行——规则按写法匹配，就按写法绕过。招式 4 与 4b 防御点不同：4 靠「不信任请求里的身份字段」（身份只从服务端会话取）；4b 靠「前后端路径规范化一致」（代理与应用认同一个路径，覆盖头不生效）。修 4 的身份问题修不了 4b 的路径问题，反之亦然。',
  where: '所有「看似受保护」的敏感接口——按清单 1→9 顺序逐招试用（第 4 招连同 4b 子项一起试）。',
  kinds: [
    { name: '换方法', plain: '同一路径换 HTTP 动词', signal: 'GET 被拒 → 试 POST/PUT/PATCH/DELETE/HEAD' },
    { name: '换路径写法', plain: '同一资源换 URL 写法', signal: '/admin → /admin/、/Admin、/admin/.、/admin%2f、//admin、/./admin、/admin;.css' },
    { name: '换版本', plain: '新版有校验旧版没有', signal: '/v3/ → /v1/、/v2/、/beta/、/internal/' },
    { name: '换身份载体', plain: '会话 Cookie → 改用 Authorization、X-User-Id、X-Forwarded-For 传身份（服务端信了这些头就提权）', signal: '抓包把 Cookie 删掉、加 X-User-Id: admin 重放' },
    { name: '路径覆盖头', plain: '加 X-Original-URL / X-Rewrite-URL，让代理按头里的路径做鉴权、按真实路径执行（防御点不同：4 靠不信任身份字段，4b 靠前后端路径规范化一致）', signal: 'GET /public + X-Original-URL: /admin' },
    { name: '参数污染', plain: '同一参数传多次', signal: 'id=1&id=2、role=user&role=admin（不同框架取值不同）' },
    { name: '类型混淆', plain: '换参数的数据形态', signal: 'id=1 → id[]=1、id=1.0、id=01、id=1e0' },
    { name: '大小写与编码', plain: '换字符写法', signal: 'Admin、%61dmin、Unicode 归一化差异' },
    { name: '覆盖字段', plain: '用重复字段改值', signal: '{"role":"user","role":"admin"}、嵌套对象、__proto__（原型污染见客户端攻击主题）' },
    { name: '越权链', plain: '两步连成一链', signal: '先越权读 → 拿到他人 token/邀请码 → 再越权写' },
  ],
  signals: ['任一招生效（响应变化、返回他人数据、执行成功）即说明鉴权匹配规则不完整。'],
  impact:
    '本身是测试方法；单招生效即对应具体越权（4.1/4.2/4.6 的放大器），可把「看起来有校验」的接口全部试穿。',
  verify: [
    '对每个「看似受保护」的敏感接口，按 1→9 顺序逐招试用（第 4 招连同 4b 子项一起试）。',
    '记录每招的响应差异（状态码/长度/耗时），对比基线。',
    '生效的招式即缺陷线索，回到对应条目（4.1/4.2/4.6）深挖。',
  ],
  protect: {
    root: '鉴权按「资源」而非「URL 写法」匹配——规范化路径后再鉴权（复用 4.3 的规范化思路）、HTTP 方法显式白名单、所有方法一视同仁。',
    harden: '身份只认一种载体（会话），不信请求参数里的身份字段；参数做类型强校验（复用 type-validation）；旧版本接口同样鉴权或下线。',
    fallback: '把 9 招（含 4b）纳入权限回归测试清单，持续集成跑一遍。',
  },
  mistakes: [
    '只测默认路径默认方法（清单 2/3/1 是最常漏的）。',
    '以为「加了 WAF 就不用测」——WAF 不替代鉴权完整性。',
    '测出一招就停（鉴权洞常是多招并存）。',
    '把清单当「攻击手册」只记招式不记防御（每招对应的防御点才是目的）。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某接口 GET /api/user/12 返回 403，但改成 POST /api/user/12 返回 200 且执行成功。',
      question: '这是清单里的哪一招？',
      options: [
        { text: '换方法——鉴权只覆盖了 GET', correct: true, explain: '正确。同一资源换 HTTP 动词绕过没覆盖的方法。' },
        { text: '换路径写法', correct: false, explain: '错误。路径没变，变的是方法。' },
        { text: '参数污染', correct: false, explain: '错误。没有重复传参数。' },
        { text: '类型混淆', correct: false, explain: '错误。参数形态没变。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 鉴权按资源匹配、所有 HTTP 方法一视同仁；② 只把 GET 改成 POST 对外；③ 过滤 HEAD 方法；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 按资源鉴权、方法全覆盖', correct: true, explain: '正确。不按写法匹配，换什么写法都落到同一道检查。' },
        { text: '② 换成 POST', correct: false, explain: '错误。只是换了种写法，清单第 1 招反过来照样绕。' },
        { text: '③ 过滤 HEAD', correct: false, explain: '错误。逐个封方法是打补丁，封不完。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底。' },
      ],
    },
    {
      kind: 'mistake',
      material: '测试同学说「我测了 GET 和 POST 都有鉴权，应该没问题了」。',
      question: '还漏了什么？',
      options: [
        { text: '换路径写法、换版本、换身份载体等其余招式——鉴权洞常藏在写法差异里', correct: true, explain: '正确。清单 9 招（含 4b）要按序全试，测两招不算覆盖。' },
        { text: '测够了', correct: false, explain: '错误。方法只是前两招。' },
        { text: '只要加 HTTPS 就行', correct: false, explain: '错误。与传输无关。' },
        { text: '只要限速就行', correct: false, explain: '错误。限速不解决鉴权匹配不完整。' },
      ],
    },
  ],
  terms: ['authz-bypass-checklist', 'authorization', 'type-validation', 'allowlist'],
  relatedTerms: ['authorization', 'type-validation', 'allowlist'],
  pinyin: { full: 'shou quan rao guo ji qiao qing dan', joined: 'shouquanraoguojiqiaoqingdan', initial: 'sqrgjqzd' },
  related: ['idor', 'vertical-escalation', 'forced-browsing'],
  source: 'demo',
  format: 'card',
};

export const ch4Entries: LearningEntry[] = [
  idor,
  verticalEscalation,
  pathTraversal,
  forcedBrowsing,
  corsMisconfig,
  permissionModel,
  clientAuthorization,
  authzBypassChecklist,
];

export default ch4Entries;
