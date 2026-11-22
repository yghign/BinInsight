/**
 * 信息泄露与配置 —— 9 条。内容逐字取自 docs/17 v2。
 * 低 3 条（error-disclosure/directory-listing/default-credentials）= 形态 A 知识卡 + 3 题；
 * 中 6 条（hardcoded-secret/source-leak/debug-endpoint/cache-cdn-misconfig/host-header-attack/log-monitoring-leak）= 形态 B 案例演示 + 指导。
 * templateId：TPL-CHAIN×4 + 不挂×2（hardcoded-secret/log-monitoring-leak，附理由）+ 低档 card×3 不带。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, CardEntry, InteractiveEntry } from './types';

const hardcodedSecret: InteractiveEntry = {
  id: 'hardcoded-secret',
  kind: 'vuln',
  chapter: 8,
  title: '敏感信息硬编码',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', '移动'],
  aliases: ['敏感信息硬编码', '密钥硬编码', '硬编码密钥', 'AK/SK 泄露'],
  oneLiner:
    '密钥、口令、内部地址被写进代码或前端产物时，谁拿到产物（JS bundle、App 包、Git 历史）谁就拿到钥匙。',
  cause:
    '开发时图省事把凭证写进代码/配置/前端；发布时产物原样下发。四个载体各有一条泄露路径：前端 JS bundle 随页面下发（打开即见）、源码配置随部署落地、App 包反编译即得、Git 历史记录一切（删了也能翻出来）。',
  where:
    '前端 JS bundle（AK/SK、地图 key、内部接口地址、测试账号）；源码/配置（数据库口令、JWT 密钥、支付密钥）；移动 App 包（反编译）；Git 历史（被删的密钥）。',
  kinds: [
    { name: '前端 bundle 硬编码', plain: '密钥随 JS 下发', signal: 'F12 看 JS 里有 AK/SK、key' },
    { name: '源码/配置硬编码', plain: '口令写在配置里', signal: '配置文件含数据库口令、JWT 密钥' },
    { name: 'App 包硬编码', plain: '打包进移动应用', signal: '反编译包里有密钥' },
    { name: 'Git 历史泄露', plain: '删掉的密钥还在历史里', signal: 'git log 能翻出旧版密钥' },
  ],
  signals: [
    '前端 JS bundle 中出现 AK/SK、地图 key、内部接口地址、测试账号。',
    '源码/配置中出现数据库口令、JWT 密钥、第三方支付密钥。',
    '移动 App 包中硬编码密钥（反编译即得）。',
    'Git 历史中有被「删除」的密钥（历史仍可查）。',
  ],
  impact:
    '云端资源被接管（AK/SK 直接调云 API）；数据库失守；JWT 可伪造任意身份（联动认证与会话主题 JWT 缺陷）；测试账号进生产。',
  verify: [
    '前端：打开 F12 / 读打包后的 JS，搜 key、secret、token，以及云厂商密钥前缀（AWS=AKIA、腾讯云=AKID、阿里云=LTAI）等模式（演示样例，自有资产）。',
    '源码/配置：检查部署产物里的配置文件；注意区分「占位符」与「真实值」。',
    'App：反编译检查字符串常量。',
    'Git：git log -p 翻历史（含被删行）。',
  ],
  protect: {
    root: '密钥统一放密钥管理服务（KMS/Vault）；前端不持有任何长期密钥（用短时令牌换）。',
    harden: 'CI 集成密钥扫描（提交前拦）；移动端用服务端换发令牌。',
    fallback: '密钥泄露后立即轮换（不只是删除代码——Git 历史还在）。',
  },
  mistakes: [
    '删代码当止血（Git 历史仍可查，必须轮换）。',
    '只查源码不查产物（bundle/App 是下发到用户手里的）。',
    '以为「内部 key 不重要」（地图 key 被刷量、测试账号进生产都算）。',
    'CI 扫描只扫新增不扫历史。',
  ],
  terms: ['hardcoded-secret', 'info-leak'],
  relatedTerms: ['info-leak'],
  pinyin: { full: 'min gan xin xi ying bian ma', joined: 'minganxinxiyingbianma', initial: 'mgxxybm' },
  related: ['source-leak', 'debug-endpoint'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的前端页面）：\n服务端下发打包后的 JS（演示样例）：\n  main.js 内含一行：var AK = "AKIDEXAMPLEKEY123456"   ← 硬编码的云密钥\n\n攻击步骤：\n1. 浏览器 F12 打开 Sources/Network 读 main.js（无需任何攻击构造）\n2. 搜到 AK 字符串 → 复制\n3. 用该 AK 调云厂商 API（演示样例，虚构密钥）→ 直接通过认证\n\n逻辑链自查（硬标准：密钥字符串与目标服务识别的格式逐字符对上）：\n输入（读取前端产物）\n→ 机制（密钥硬编码在 bundle 里随页面下发到每个用户手里）\n→ 结果（拿到可用密钥）✔\n逐字符核对：main.js 中的 AKIDEXAMPLEKEY123456 与云厂商 AK 格式逐字符一致（前缀+长度，格式不符则第 3 步不成立）✔\n           Git 历史变体：git log -p 中被删行的密钥与现行密钥格式逐字符一致——删了不算数 ✔',
    language: 'plaintext',
    note: '材料为演示样例，密钥为虚构无害字符串，非现场运行、非真实系统。修法对照：密钥进 KMS（bundle 里无密钥）+ 短时令牌换发 + 泄露即轮换（历史里的旧密钥作废）。',
    source: 'demo',
  },
  guide: {
    why: '盯「下发到用户手里的产物里有没有秘密」。钥匙不能压在欢迎垫下——产物在哪，秘密就不能在哪。Git 历史是第四条隐蔽路径：删掉的行还在版本记录里，所以修法是轮换不是删除。',
    how: '① 四载体逐一看（bundle/配置/App/Git 历史）；② 区分占位符与真实值；③ 评估拿到的密钥能干什么（调云 API？伪造 JWT？）；④ 修复按「KMS+短时令牌+CI 扫描+轮换」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-801', summary: '密钥管理防护 Cheat Sheet（成因：密钥硬编码进代码/产物；教训：KMS 统一管理 + 泄露即轮换）', lesson: 'KMS 统一管理 + 泄露即轮换', source: 'OWASP Cheat Sheet Series — Secrets Management', credibility: '权威' },
  ],
};

const sourceLeak: InteractiveEntry = {
  id: 'source-leak',
  kind: 'vuln',
  chapter: 8,
  title: '源码与备份文件泄露',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['源码泄露', '备份文件泄露', '.git 泄露', '源码与备份泄露'],
  oneLiner:
    '.git、备份包、.env 这类文件被发布到了 Web 根目录，攻击者敲个地址就能拿走源码、配置和密钥。',
  cause:
    '发布流程把「家底」搬进了前台——源码仓库目录（.git/.svn）、备份压缩包（www.zip/backup.sql）、编辑器残留（.bak/.swp/~）、配置文件（.env）被打包进 Web 可访问目录。Web 服务器只看「在不在 Web 根」，不看「该不该被看」。',
  where:
    '/.git/config、/.svn/entries、/www.zip、/backup.sql、/index.php.bak、/.DS_Store、/.env、/composer.lock、/package.json。',
  kinds: [
    { name: '版本库暴露', plain: '整个 Git/SVN 历史可下载', signal: '/.git/HEAD 返回 ref: refs/heads/...' },
    { name: '备份包暴露', plain: '打包的源码/数据库可下载', signal: '/www.zip、/backup.sql 可访问' },
    { name: '编辑器残留', plain: '编辑器备份文件没清', signal: '.bak、.swp、~ 后缀可访问' },
    { name: '配置文件暴露', plain: '配置随部署落地', signal: '/.env、composer.lock 可访问' },
  ],
  signals: [
    '/.git/config、/.svn/entries、/www.zip、/backup.sql、/index.php.bak、/.DS_Store、/.env、/composer.lock、/package.json 可访问。',
    '/.git/HEAD 返回 ref: refs/heads/master 类内容（或 ref: refs/heads/main，新仓库默认分支）（版本库完整可还原）。',
  ],
  impact:
    '拿到源码即可白盒审计（找注入、密钥、内网地址——所有攻击链的起点）；.git 可还原完整历史（联动 8.1 硬编码的历史密钥）；.env 直接给数据库口令。',
  verify: [
    '目录扫描 + 常见备份后缀（.bak .old .swp .zip .tar.gz .sql ~）。',
    '.git 探测：请求 /.git/HEAD，看是否返回 ref: refs/heads/...（演示样例，自有资产）。',
    '拿到源码后评估可挖什么（密钥/注入点/内部地址）——这就是「链式起点」。',
  ],
  protect: {
    root: 'Web 根目录只放静态资源与入口文件；发布流程禁止把源码/配置打包到 Web 目录；.git 目录不可外置到 Web 根。',
    harden: '禁止访问隐藏文件与备份后缀（服务器配置层面）；定期扫描残留。',
    fallback: '监控对备份/隐藏路径的异常访问。',
  },
  mistakes: [
    '只防「下载接口」不防「直接敲路径」（本条是暴露面不是接口问题）。',
    '以为「.git 没什么」——它包含全部源码与历史。',
    '发布脚本把整个工程目录 rsync 进 Web 根。',
    '只删线上文件不清部署包（/www.zip 还在）。',
  ],
  terms: ['source-leak', 'info-leak', 'arbitrary-rw'],
  relatedTerms: ['info-leak', 'arbitrary-rw'],
  pinyin: { full: 'yuan ma yu bei fen wen jian xie lou', joined: 'yuanmayubeifenwenjianxielou', initial: 'ymybfwjxl' },
  related: ['hardcoded-secret', 'directory-listing', 'forced-browsing'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com）：\n服务端逻辑（演示样例）：发布时整个工程目录被放进 Web 根（含 .git）\n\n攻击步骤：\n1. 请求 GET /.git/HEAD（无需任何绕过构造）\n2. 响应返回（演示样例）：\n     ref: refs/heads/master\n   ——该字符串是 Git 版本库的标准特征（或 ref: refs/heads/main，新仓库默认分支）\n3. 用版本库下载工具还原完整源码与历史 → 翻出配置里的数据库口令\n\n逻辑链自查（硬标准：请求路径与目标文件路径逐字符对上，响应特征字符串逐字符一致）：\n输入（GET /.git/HEAD）\n→ 机制（版本库目录被发布到 Web 根，服务器照常返回文件内容）\n→ 结果（源码与历史可完整还原）✔\n逐字符核对：请求路径 /.git/HEAD 与服务器上 .git 目录位置逐字符一致（多一层/少一层都不命中）✔\n           响应特征 "ref: refs/heads/master" 逐字符一致（或 "ref: refs/heads/main"，新仓库默认分支——Git 版本库识别特征，格式不符则第 3 步不成立）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点为虚构，非现场运行、非真实系统。修法对照：发布面收敛（.git 不进 Web 根）+ 服务器禁访问隐藏文件/备份后缀，第 1 步 404 即断链。',
    source: 'demo',
  },
  guide: {
    why: '盯「Web 根里放了什么」。这不是「怎么拿」的问题（不需要穿越、不需要越权），是「放错了」的问题——家底不该搬进前台。.git 的危害尤其大：它是完整的源码+历史，等于把仓库搬到了门口。',
    how: '① 目录扫描（备份后缀+隐藏文件）；② .git/HEAD 探测特征确认；③ 拿到源码后评估链式影响（密钥/注入/内网地址）；④ 修复按「发布面收敛+禁隐藏文件+定期扫描」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-802', summary: '源码与备份文件泄露实验（成因：.git/备份包被发布到 Web 目录；教训：发布面收敛 + 禁隐藏文件访问）', lesson: '发布面收敛 + 禁隐藏文件访问', source: 'PortSwigger Web Security Academy — Information disclosure 实验', credibility: '平台' },
  ],
};

const errorDisclosure: CardEntry = {
  id: 'error-disclosure',
  kind: 'vuln',
  chapter: 8,
  title: '报错信息泄露',
  hazard: 2,
  difficulty: 'beginner',
  scene: ['Web'],
  aliases: ['报错信息泄露', '错误信息泄露', '堆栈泄露', 'verbose error'],
  oneLiner:
    '生产环境的报错页把堆栈、SQL 语句、绝对路径、版本号摊给访客看——报错是给开发者排障的，不是给用户看的。',
  cause:
    'debug 模式没关（DEBUG=True、app.debug=true），或错误处理把内部异常详情直接写进响应。为什么报错会泄密：报错信息是给开发者排障的「调试说明书」，里面自然带着内部细节——生产环境等于把说明书摊在了每个访客面前。与注入类主题报错回显的边界：注入类的报错是信号面（借报错证明注入存在、带出数据），本条是信息本身的泄露——报错是货物不是工具。',
  where: '未关 debug 的生产环境、异常处理中间件、API 错误响应体、HTTP 500 页面。',
  kinds: [
    { name: '堆栈泄露', plain: '异常调用栈直接返回', signal: '响应含框架类名、行号' },
    { name: 'SQL/查询泄露', plain: '报错带出 SQL', signal: '响应含 SQL 语句片段' },
    { name: '路径/版本泄露', plain: '绝对路径、版本号可见', signal: '响应含服务器路径、框架版本' },
  ],
  signals: ['堆栈信息', 'SQL 语句片段', '绝对路径', '框架与版本号', '内部 IP', '依赖版本'],
  impact:
    '为后续攻击供料——绝对路径帮 4.3/5.3 定位文件、SQL 片段帮注入类理解查询结构、版本号帮找已知缺陷（联动组件主题）；单独看是低危，是攻击链的起点。',
  verify: [
    '触发一次报错（传畸形参数、超长输入、类型错误），看响应体（演示样例，自有资产）。',
    '分辨「用户友好的错误页」与「调试页」——后者带堆栈/路径/SQL。',
    '记录泄露的版本号/路径，评估为后续攻击供了什么料。',
  ],
  protect: {
    root: '生产环境统一错误页；关闭 debug 模式（DEBUG=False、app.debug=false）。',
    harden: '错误码与内部细节分离（用户看错误码，细节只落日志）；日志只落服务端。',
    fallback: '线上异常监控（错误率突增告警）。',
  },
  mistakes: [
    '以为「有错误页就算处理了」——错误页里带着堆栈等于没处理。',
    '只关了 Web 框架 debug，没关 ORM/数据库的详细报错。',
    '把「日志只落服务端」理解成「日志可以不脱敏」（联动 8.9）。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某 API 传入畸形参数后返回 HTTP 500，响应体含完整 Java 堆栈与服务器绝对路径。',
      question: '这暴露了什么？',
      options: [
        { text: '报错信息泄露——调试细节摊给了访客', correct: true, explain: '正确。堆栈和绝对路径是给开发者排障的，不该出现在生产响应里。' },
        { text: 'SQL 注入', correct: false, explain: '错误。没看到注入构造与查询结构被改写。' },
        { text: '这是拒绝服务', correct: false, explain: '错误。服务返回了错误页，不是被打瘫。' },
        { text: '这是版本泄露的全部', correct: false, explain: '错误。版本号只是泄露面之一，堆栈/路径/SQL 都算。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 生产统一错误页 + 关 debug，细节只落日志；② 把堆栈翻译成英文；③ 报错页加公司 logo；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 统一错误页 + 关 debug + 细节落日志', correct: true, explain: '正确。用户看错误码，细节只进服务端日志——泄露面收敛到内部。' },
        { text: '② 翻译成英文', correct: false, explain: '错误。换了语言，细节还在。' },
        { text: '③ 加 logo', correct: false, explain: '错误。美化不是收敛。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 不管响应内容。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「日志里有完整堆栈就够了，报错页也可以带一点方便调试」。',
      question: '为什么不行？',
      options: [
        { text: '报错页是对外的——细节进日志可以，进响应就是泄露', correct: true, explain: '正确。对外/对内要分清，方便调试不能靠把调试信息发给用户。' },
        { text: '日志里也不该有堆栈', correct: false, explain: '错误。日志是内部的，堆栈进日志是对的。' },
        { text: '只要加 HTTPS 就行', correct: false, explain: '错误。与传输无关。' },
        { text: '只要错误码够长就行', correct: false, explain: '错误。错误码是掩护，不是根治。' },
      ],
    },
  ],
  terms: ['error-disclosure', 'info-leak'],
  relatedTerms: ['info-leak', 'source-leak'],
  pinyin: { full: 'bao cuo xin xi xie lou', joined: 'baocuoxinxixielou', initial: 'bcxxl' },
  related: ['source-leak', 'debug-endpoint'],
  source: 'demo',
  format: 'card',
};

const directoryListing: CardEntry = {
  id: 'directory-listing',
  kind: 'vuln',
  chapter: 8,
  title: '目录列举与文件元数据',
  hazard: 2,
  difficulty: 'beginner',
  scene: ['Web'],
  aliases: ['目录列举', '目录列表', 'EXIF 泄露', '文件元数据泄露'],
  oneLiner:
    '访问目录返回文件列表、图片 EXIF 带着 GPS、文档属性写着内部用户名——系统把「有什么、在哪」直接念给了访客。',
  cause:
    'Web 服务器的目录列举（autoindex）没关；上传的图片/文档没清理元数据。为什么目录列举省了攻击者一半功夫：攻击面发现本来靠「猜」（字典爆破、路径枚举），目录列表把「猜」变成了「读清单」——文件名、备份包、隐藏目录一字排开。',
  where: '开放 autoindex 的静态目录、上传目录、图片 EXIF（GPS/设备）、文档属性（用户名/路径）。',
  kinds: [
    { name: '目录列举', plain: '访问目录返回文件清单', signal: '目录 URL 显示文件列表页' },
    { name: 'EXIF 泄露', plain: '图片元数据带隐私', signal: 'GPS 坐标、设备型号、拍摄时间' },
    { name: '文档属性泄露', plain: '文档内嵌内部信息', signal: '作者名、内部路径、修订历史' },
  ],
  signals: ['访问目录返回文件列表', '图片 EXIF 含 GPS 与设备信息', '文档属性含内部用户名与路径'],
  impact: '文件名/路径清单直接喂给 8.2/8.6（找备份、找调试端点）；GPS 泄露住址与行动轨迹；文档属性泄露内部用户名（联动枚举）。',
  verify: [
    '访问静态目录（去掉文件名只留路径），看是否返回列表页（演示样例，自有资产）。',
    '下载图片看 EXIF（位置/设备）；看文档属性（作者/路径/修订）。',
    '清点暴露的文件名能为后续攻击供什么料。',
  ],
  protect: {
    root: '关闭 autoindex（Nginx autoindex off）；上传图片重编码去 EXIF；文档导出前清理元数据。',
    harden: '目录放默认页（index.html）而非列表；敏感目录不放静态服务器。',
    fallback: '定期扫描目录列举暴露。',
  },
  mistakes: [
    '以为「目录里没敏感文件就没事」——文件名清单本身就是情报。',
    '只清 EXIF 不清文档属性（Word/PDF 的作者、路径同算）。',
    '混淆「目录列举」与「强制浏览」（4.4）：前者是配置暴露清单，后者是端点缺鉴权。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '访问 /uploads/ 返回一个文件列表页，列出全部上传文件名。',
      question: '这暴露了什么？',
      options: [
        { text: '目录列举——把文件清单念给了访客', correct: true, explain: '正确。攻击面发现从「猜」变「读清单」，省一半功夫。' },
        { text: '这是路径穿越', correct: false, explain: '错误。没人走出目录，是清单被列出来了。' },
        { text: '这是任意文件读取', correct: false, explain: '错误。还没读到文件内容，只是看到名字。' },
        { text: '这是 XSS', correct: false, explain: '错误。没有脚本执行。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 关 autoindex + 图片重编码去 EXIF + 文档清元数据；② 把目录路径改长；③ 文件名加密；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 关列表 + 清元数据', correct: true, explain: '正确。不列清单、不留元数据，两个泄露面都收敛。' },
        { text: '② 路径改长', correct: false, explain: '错误。仍是隐晦式安全，可被扫到。' },
        { text: '③ 文件名加密', correct: false, explain: '错误。防了名单没防 EXIF/文档属性。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 不管响应列表。' },
      ],
    },
    {
      kind: 'mistake',
      material: '开发说「图片压缩过了，EXIF 一定没了」。',
      question: '为什么还要验证？',
      options: [
        { text: '压缩不一定重编码，看一步 EXIF 才算数；文档属性也要单独清', correct: true, explain: '正确。处理方式不等于结果，验证处理后的产物才算。' },
        { text: '压缩一定会去 EXIF', correct: false, explain: '错误。保留元数据的压缩方式很多。' },
        { text: '加 HTTPS 就行', correct: false, explain: '错误。与传输无关。' },
        { text: '只要目录放深一点', correct: false, explain: '错误。路径深度不解决列举。' },
      ],
    },
  ],
  terms: ['directory-listing', 'info-leak'],
  relatedTerms: ['info-leak', 'source-leak'],
  pinyin: { full: 'mu lu lie ju yu yuan shu ju', joined: 'mululiejiyuyuanshuju', initial: 'mlljyysj' },
  related: ['source-leak', 'forced-browsing'],
  source: 'demo',
  format: 'card',
};

const defaultCredentials: CardEntry = {
  id: 'default-credentials',
  kind: 'vuln',
  chapter: 8,
  title: '默认配置与默认口令',
  hazard: 5,
  difficulty: 'beginner',
  scene: ['Web', '系统'],
  aliases: ['默认口令', '默认密码', '出厂口令', '默认配置风险'],
  oneLiner:
    '中间件管理台、数据库、设备出厂口令没改，或服务压根没开认证——等于把管理权限写在了说明书上，说明书人人可查。',
  cause:
    '装完即用、没人改默认口令；数据库/缓存直接裸奔（无认证、端口对外）。为什么默认口令能直接进：出厂口令写在产品手册里、网上一搜就有——等于所有同款设备共享一把公开的钥匙，「装完没改」就是「没设锁」。',
  where:
    '中间件管理台（Tomcat Manager、WebLogic Console、Jenkins）默认口令；数据库/缓存未授权（Redis 6379、MongoDB 27017、Elasticsearch 9200、Memcached）；设备出厂口令（摄像头、路由器、工控设备）。',
  kinds: [
    { name: '默认口令', plain: '出厂账号密码没改', signal: 'admin/admin 类组合可登录' },
    { name: '未授权访问', plain: '服务压根没开认证', signal: 'Redis/MongoDB/ES 端口直连即进' },
    { name: '默认配置', plain: '危险默认值没关', signal: '默认管理端口对外、默认目录可写' },
  ],
  signals: ['中间件管理台默认口令可登录', '数据库/缓存端口未授权可直连', '设备出厂口令可登录'],
  impact: '管理台失守（部署/配置/代码执行）；数据库全量数据失守（联动 8.2 之后的任意读取）；设备被控（摄像头、工控）。',
  verify: [
    '资产清点管理端口（6379/27017/9200/8080 等），测试未授权直连与默认口令（演示样例，自有资产）。',
    '查产品手册/公开默认口令列表，逐台核对是否改过。',
    '检查服务认证开关（Redis requirepass、MongoDB auth 等）。',
  ],
  protect: {
    root: '安装即改默认口令；管理端口不对外（绑定内网/跳板机）。',
    harden: '开启认证与 TLS；定期基线核查（扫默认口令/未授权端口）。',
    fallback: '弱口令/未授权登录告警。',
  },
  mistakes: [
    '以为「端口没公布就没人找」（全网扫描常态化，联动 4.4 隐晦式安全教训）。',
    '只改 Web 管理台不查数据库/缓存/设备。',
    '以为「内网就不用认证」（内网失陷即全裸）。',
  ],
  quiz: [
    {
      kind: 'identify',
      material: '某 Redis 端口 6379 对公网开放且未设 requirepass，直连即可 KEYS *。',
      question: '这暴露了什么？',
      options: [
        { text: '默认配置与未授权访问——服务没开认证', correct: true, explain: '正确。裸奔的服务等于把数据放在门口。' },
        { text: '这是弱口令', correct: false, explain: '错误。连口令都没有，是未授权。' },
        { text: '这是信息泄露', correct: false, explain: '错误。这是权限失守，不只是信息。' },
        { text: '这是注入', correct: false, explain: '错误。没有数据被当指令。' },
      ],
    },
    {
      kind: 'protect',
      material: '四种改法：① 改默认口令 + 端口绑内网 + 开认证；② 端口改非标准号；③ 把服务名藏起来；④ 加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 改口令 + 收网络 + 开认证', correct: true, explain: '正确。锁、门、钥匙三样都到位。' },
        { text: '② 改端口号', correct: false, explain: '错误。扫描会发现，仍是隐晦式安全。' },
        { text: '③ 藏服务名', correct: false, explain: '错误。指纹识别照样认出来。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 不管未授权端口。' },
      ],
    },
    {
      kind: 'mistake',
      material: '运维说「设备在内网，出厂口令不用改」。',
      question: '为什么不行？',
      options: [
        { text: '内网失陷即全裸，且设备口令手册公开可查——纵深防御要求内外一致', correct: true, explain: '正确。信任边界会破，口令是最后一道。' },
        { text: '内网绝对安全', correct: false, explain: '错误。内网横向移动是常规攻击路径。' },
        { text: '改口令影响自动化脚本', correct: false, explain: '错误。脚本同步更新口令即可。' },
        { text: '只要监控端口就行', correct: false, explain: '错误。监控不拦访问。' },
      ],
    },
  ],
  terms: ['default-credentials', 'password-policy'],
  relatedTerms: ['password-policy', 'debug-endpoint'],
  pinyin: { full: 'mo ren pei zhi yu mo ren kou ling', joined: 'morenpeizhiyumorenkouling', initial: 'mrpzmrkl' },
  related: ['debug-endpoint', 'hardcoded-secret'],
  source: 'demo',
  format: 'card',
};

const debugEndpoint: InteractiveEntry = {
  id: 'debug-endpoint',
  kind: 'vuln',
  chapter: 8,
  title: '调试与管理端点未授权',
  hazard: 5,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['调试端点暴露', '管理端点未授权', 'actuator 泄露', 'swagger 泄露'],
  oneLiner:
    'Actuator、Swagger、Druid 这些调试/管理端点留在生产环境且未授权时，配置、内存里的密钥、全部接口清单直接可读。',
  cause:
    '框架自带的调试/管理端点在生产未关闭或未鉴权。为什么调试端点危害大：它们的设计目标是「方便看内部」——/actuator/env 吐环境变量（含密钥）、/actuator/heapdump 把内存整个端走（内存里有密钥和会话）、Swagger 文档把全部接口摊开。调试工具的「方便」在生产就是「裸奔」。',
  where:
    'Spring Boot Actuator：/actuator/env、/actuator/heapdump（可提取内存中的密钥）、/actuator/gateway/routes（可 RCE，需 Spring Cloud Gateway）、/actuator/jolokia。Swagger / Knife4j：/swagger-ui.html、/v2/api-docs（暴露全部接口）。Druid：/druid/index.html（session 可被读取）。Nacos：/nacos/v1/auth/users（默认口令）。H2 Console：/h2-console；phpinfo、/debug、/console、/graphql（内省）。',
  kinds: [
    { name: 'Actuator 端点', plain: 'Spring 运维端点暴露', signal: '/actuator/env 返回配置含密钥' },
    { name: '接口文档暴露', plain: 'Swagger 摊开全部接口', signal: '/swagger-ui.html 可访问' },
    { name: '连接池/注册台', plain: 'Druid/Nacos 管理台', signal: '/druid/index.html、Nacos 用户接口' },
    { name: '调试控制台', plain: 'H2/phpinfo 残留', signal: '/h2-console、phpinfo 可访问' },
    { name: 'heapdump 内存泄露', plain: '内存镜像可下载', signal: '/actuator/heapdump 可下载' },
  ],
  signals: [
    '/actuator/env 返回环境变量（含密钥、数据库口令）。',
    '/swagger-ui.html、/v2/api-docs 可访问（全部接口清单）。',
    '/actuator/heapdump 可下载（内存含密钥/会话）。',
    'Druid/Nacos/H2/phpinfo 控制台可访问。',
  ],
  impact:
    '配置与密钥泄露（联动 8.1）；heapdump 提取内存密钥与会话（直接接管）；接口清单喂给访问控制主题做越权测试；部分端点直达 RCE（/actuator/gateway/routes 类，需 Spring Cloud Gateway）。',
  verify: [
    '逐族探测五类端点路径（演示样例，自有资产），看是否可访问/需鉴权。',
    '/actuator/env 看配置；Swagger 看接口清单；heapdump 看内存内容。',
    '评估拿到的东西（密钥/会话/接口清单）的链式价值。',
  ],
  protect: {
    root: '生产环境关闭或鉴权调试/管理端点；只在内网暴露。',
    harden: '禁用危险端点（Spring Boot management.endpoints.web.exposure.include 白名单，只开需要的）；接口文档不进生产。',
    fallback: '对端点路径的访问审计与告警。',
  },
  mistakes: [
    '以为「调试端点是框架自带的所以安全」（自带=人人知道路径）。',
    '只关 /actuator 首页不关子端点（/actuator/env 可单独访问）。',
    'Swagger 留在生产「方便联调」（联调用测试环境）。',
    '混淆「补鉴权」（4.4 修法）与「关端点」（本条修法）——调试端点最佳做法是生产直接关。',
  ],
  terms: ['debug-endpoint', 'info-leak'],
  relatedTerms: ['info-leak'],
  pinyin: { full: 'diao shi duan dian wei shou quan', joined: 'diaoshiduandianweishouquan', initial: 'dsddwsq' },
  related: ['forced-browsing', 'default-credentials', 'hardcoded-secret'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com，Spring Boot 应用）：\n服务端逻辑（演示样例）：Actuator 端点在生产暴露且无鉴权\n\n攻击步骤：\n1. 请求 GET /actuator/env（框架自带路径，无需绕过）\n2. 响应返回（演示样例，JSON 节选）：\n     { "activeProfiles": [], "propertySources": [ { "name": "systemEnvironment", "properties": { "DB_PASSWORD": { "value": "..." } } } ] }\n   ——环境变量里带出数据库口令\n3. 用口令直连数据库 → 全量数据失守\n\n逻辑链自查（硬标准：端点路径与框架默认路径逐字符对上，响应字段名逐字符一致）：\n输入（GET /actuator/env）\n→ 机制（Actuator 设计为运维看内部状态，生产暴露即把配置摊给访客）\n→ 结果（数据库口令泄露，链式接管）✔\n逐字符核对：路径 /actuator/env 与 Spring Boot 默认端点路径逐字符一致（/actuator/env 与 /env 不同，后者不命中）✔\n           响应字段 propertySources[].properties 与 Actuator env 端点的 propertySources 嵌套结构逐字符一致（节选）✔\n           heapdump 变体：/actuator/heapdump 路径逐字符一致——内存镜像里可提取密钥（链式升级）✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与口令为虚构，非现场运行、非真实系统；实际返回为多层级嵌套（多个 propertySources），此处为节选。修法对照：生产关闭 Actuator 或端点白名单+鉴权（第 1 步 404/403 即断链）+ 内网暴露（公网不可达）。',
    source: 'demo',
  },
  guide: {
    why: '盯「调试/管理端点在生产有没有关」。这些端点是框架自带的后门——设计目标是看内部，所以一开放就是全裸。与 4.4 分工：4.4 教你「隐藏的端点要补鉴权」，本条教你「调试端点最佳做法是生产直接关」。',
    how: '① 五族端点逐个探测；② 看 env/heapdump/接口清单的泄露内容；③ 评估链式价值（密钥/会话/RCE）；④ 修复按「关闭或白名单+鉴权+仅内网」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-804', summary: 'Actuator 端点安全配置指引（成因：调试端点生产暴露未授权；教训：端点白名单 + 鉴权 + 仅内网）', lesson: '端点白名单 + 鉴权 + 仅内网', source: 'Spring Boot 官方文档 — Securing Endpoints', credibility: '权威' },
  ],
};

const cacheCdnMisconfig: InteractiveEntry = {
  id: 'cache-cdn-misconfig',
  kind: 'vuln',
  chapter: 8,
  title: '缓存与 CDN 配置缺陷',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['缓存投毒', '缓存欺骗', 'CDN 回源绕过', 'Web Cache Poisoning'],
  oneLiner:
    '缓存键没包含所有影响响应的输入时，攻击者注入一次恶意响应就被缓存下来，后面的每个用户拿到的都是它。',
  cause:
    '缓存按「缓存键」（通常只有 URL/部分头）判断「是不是同一份响应」；如果某些输入（X-Forwarded-Host 等）影响了响应内容却没进缓存键，攻击者的恶意响应就会被当成「正常响应」存进公共缓存。为什么投毒影响所有人：缓存是共享的一份——一个人触发的坏响应被存下来，后面所有人拿到的都是它。主类比：像在公共饮水机里投药——第一个接水的人没事，后面全中招。',
  where:
    '未纳入缓存键的 Header（X-Forwarded-Host、X-Forwarded-Scheme）；伪造静态后缀让 CDN 缓存隐私页（/account/profile.css）；源站 IP 直连绕过 CDN/WAF。',
  kinds: [
    { name: '缓存投毒', plain: '坏响应被缓存给所有人', signal: '一次构造后所有访客拿到恶意响应' },
    { name: '缓存欺骗', plain: '隐私页被 CDN 当静态缓存', signal: '/account/profile.css 被缓存公开' },
    { name: '回源绕过', plain: '直连源站绕过防护', signal: '源站 IP 直接可达（绕过 WAF）' },
  ],
  signals: [
    '响应里出现攻击者注入的内容（如链接指向恶意域名），且多个用户都拿到。',
    '改 X-Forwarded-Host 后响应变化，且该响应被缓存（第二次不带该头也拿到注入内容）。',
    '/account/profile.css 这类含隐私的页面被 CDN 缓存。',
    '源站 IP 可直接访问（绕过 CDN/WAF）。',
  ],
  impact: '一次投毒影响所有后续用户（规模化 XSS——联动客户端攻击主题）；隐私页被公开缓存（用户资料泄露）；绕过 WAF 的防护。',
  verify: [
    '找未入缓存键的输入（对每个影响响应的 Header 做「加头→响应变→不带头→仍变」的双请求验证，演示样例，自有资产）。',
    '测缓存欺骗：对含隐私的页面加静态后缀，看是否被缓存。',
    '测回源：解析源站 IP 直接访问，看是否绕过 CDN。',
  ],
  protect: {
    root: '缓存键包含所有影响响应的输入；不缓存含用户数据的响应（Cache-Control: private, no-store）。',
    harden: '源站只允许 CDN 回源 IP；校验 Host。',
    fallback: '缓存内容异常监测；定期清理可疑缓存。',
  },
  mistakes: [
    '缓存键只看 URL 不看影响响应的 Header（投毒入口）。',
    '把含用户数据的页面当静态缓存（隐私页被公开）。',
    '以为「有 CDN 就安全了」（回源绕过直接到源站）。',
  ],
  terms: ['cache-poisoning', 'cache-deception', 'info-leak'],
  relatedTerms: ['cache-poisoning', 'cache-deception'],
  pinyin: { full: 'huan cun yu cdn pei zhi que xian', joined: 'huancunycdnpeizhiquexian', initial: 'hcycpzqx' },
  related: ['xss', 'cors-misconfig', 'error-disclosure'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 前面有 CDN 缓存）：\n服务端逻辑（演示样例）：响应里的链接域名取自 X-Forwarded-Host 头，但缓存键只含 URL（不含该头）\n\n攻击步骤（演示样例，两请求）：\n1. 投毒请求：GET /page  +  X-Forwarded-Host: evil.example\n   → 响应里的链接变成 https://evil.example/...\n   → CDN 把这份响应按 URL=/page 存进缓存（缓存键没含 X-Forwarded-Host）\n2. 受害请求：GET /page（不带任何特殊头）\n   → CDN 直接返回缓存里那份 → 受害者看到的是 evil.example 的链接\n   → 所有后续访客拿到同一份被污染的响应\n\n逻辑链自查（硬标准：Header 名与缓存键未含的输入逐字符对上，响应中域名逐字符一致）：\n输入（带 X-Forwarded-Host: evil.example 的请求）\n→ 机制（响应内容受该头影响，但缓存键不含它——缓存把「不同来源的响应」当成同一份）\n→ 结果（坏响应被缓存，所有用户拿到）✔\n逐字符核对：Header 名 X-Forwarded-Host 与未入缓存键的输入逐字符一致（写成 X-Forwarded-Domain 不命中）✔\n           响应中 evil.example 与注入值逐字符一致 ✔\n           受害请求不带该头仍拿到注入内容——证明「来自缓存而非当场生成」✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与域名为虚构，非现场运行、非真实系统。修法对照：缓存键纳入全部影响响应的输入（第 1 步的投毒响应与正常响应分开缓存）+ 私有响应不缓存（Cache-Control: private, no-store），投毒失效。',
    source: 'demo',
  },
  guide: {
    why: '盯「哪些输入影响响应、哪些进了缓存键」。两者的差集就是投毒入口。缓存的共享性让一次构造变成全员受害——这份坏响应是公共的（像在公共饮水机里投药，第一个接水的人没事，后面全中招）。',
    how: '① 对影响响应的 Header 逐个做「加头→变、不带→仍变」双请求验证；② 测静态后缀缓存欺骗与回源绕过；③ 修复按「缓存键完备+私有不缓存+回源白名单」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-805', summary: 'Web 缓存投毒实验（成因：响应受未入缓存键的 Header 影响；教训：缓存键完备 + 私有响应不缓存）', lesson: '缓存键完备 + 私有响应不缓存', source: 'PortSwigger Web Security Academy — Web cache poisoning 实验', credibility: '平台' },
  ],
};

const hostHeaderAttack: InteractiveEntry = {
  id: 'host-header-attack',
  kind: 'vuln',
  chapter: 8,
  title: 'Host 头攻击',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web'],
  aliases: ['Host 头攻击', 'Host 头注入', 'Host Header Attack', 'X-Forwarded-Host 注入'],
  oneLiner:
    '应用用请求里的 Host 头拼链接（密码重置、邮件、跳转）时，攻击者篡改它就能把重置链接指向恶意域名、窃取令牌。',
  cause:
    '应用生成链接（密码重置、邮件、跳转）时用请求自带的 Host 头当域名——但 Host 头是客户端请求带来的、攻击者可控。为什么改 Host 能骗到人：应用以为「Host 头 = 自己的域名」，实际它是信封上的回邮地址——寄信人可以随便写。重置链接的域名一变，受害者点开链接时令牌就发到了攻击者手里。',
  where: '密码重置邮件链接、通知邮件里的链接、跳转目标、缓存键（联动 8.7）、SSR 校验。',
  kinds: [
    { name: '重置链接劫持', plain: '邮件链接域名被改', signal: '改 Host 后重置邮件链接指向恶意域' },
    { name: '缓存投毒联动', plain: 'Host 进缓存键面', signal: 'X-Forwarded-Host 影响缓存（联动 8.7）' },
    { name: '跳转劫持', plain: '跳转目标被改', signal: '跳转域名跟着 Host 变' },
  ],
  signals: [
    '改 Host: evil.com 后，密码重置邮件的链接域名变了。',
    'X-Forwarded-Host 同样生效（反代信任转发头）。',
  ],
  impact: '重置令牌被窃（联动认证与会话主题密码重置——令牌泄露即账号接管）；用户被导向恶意域名（钓鱼）；配合缓存投毒放大。',
  verify: [
    '抓密码重置/通知邮件流程，改 Host/X-Forwarded-Host 后触发邮件，看链接域名（演示样例，自有资产）。',
    '看跳转目标是否跟着 Host 变。',
    '联动 8.7：Host 是否参与缓存键。',
  ],
  protect: {
    root: '用配置中的固定域名生成链接（不读 Host 头）；校验 Host 白名单。',
    harden: 'X-Forwarded-Host 只在可信代理后使用（代理覆盖掉客户端值）。',
    fallback: '邮件链接域名异常告警。',
  },
  mistakes: [
    '以为「Host 头是服务器自己的」（它是请求带来的）。',
    '只校验 Host 不校验 X-Forwarded-Host（反代后两者都可被带入）。',
    '修了密码重置没修通知邮件/跳转（同一拼链接代码处处复用）。',
  ],
  terms: ['host-header-attack', 'reset-token', 'open-redirect'],
  relatedTerms: ['reset-token', 'cache-poisoning', 'open-redirect'],
  pinyin: { full: 'host tou gong ji', joined: 'hosttougongji', initial: 'htgj' },
  related: ['reset-token', 'cache-poisoning', 'open-redirect'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的密码重置流程）：\n服务端逻辑（演示样例）：\n  reset_link = "https://" + request.Host + "/reset?token=..."\n  发邮件给用户（用 Host 头拼链接域名）\n\n攻击步骤：\n1. 攻击者发起受害者的重置请求，改头：Host: evil.example（攻击者已知受害者邮箱）\n   （演示样例，响应走反代未校验 Host）\n2. 服务端拼出链接：https://evil.example/reset?token=abc123\n   ——邮件里的链接域名变成 evil.example\n3. 受害者点邮件链接 → 令牌 abc123 发到攻击者服务器\n   → 攻击者用令牌重置受害者密码（联动认证与会话主题密码重置）\n\n逻辑链自查（硬标准：Host 头值与邮件链接域名逐字符对上，令牌参数逐字符一致）：\n输入（Host: evil.example 的重置请求）\n→ 机制（应用用请求自带 Host 拼链接——Host 是客户端可控的信封回邮地址）\n→ 结果（邮件链接指向攻击者域名，令牌被窃）✔\n逐字符核对：Host 头值 evil.example 与邮件链接中域名逐字符一致（含协议头 https:// 部分拼接正确）✔\n           令牌参数 token=abc123 在链接与后续使用中逐字符一致 ✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与令牌为虚构，非现场运行、非真实系统。修法对照：固定域名生成链接（第 2 步链接域名始终是 example.com，改 Host 无效）+ Host 白名单校验（第 1 步被拒）。',
    source: 'demo',
  },
  guide: {
    why: '盯「链接域名从哪来」。凡是从请求头取域名拼链接的，都是把回邮地址交给了寄信人。重置链接最值钱（含令牌），但通知邮件、跳转是同一类问题。',
    how: '① 找所有拼链接的代码（Host/X-Forwarded-Host 来源）；② 改头触发邮件/跳转看效果；③ 联动 8.7 查缓存键；④ 修复按「固定域名+Host 白名单+代理覆盖转发头」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-806', summary: 'Host 头攻击实验（成因：用请求 Host 拼链接；教训：固定域名 + Host 白名单）', lesson: '固定域名 + Host 白名单', source: 'PortSwigger Web Security Academy — Host header attacks 实验', credibility: '平台' },
  ],
};

const logMonitoringLeak: InteractiveEntry = {
  id: 'log-monitoring-leak',
  kind: 'vuln',
  chapter: 8,
  title: '日志与监控系统泄露',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['系统', 'Web'],
  aliases: ['日志泄露', '监控系统泄露', '日志脱敏缺失', 'Kibana 未授权'],
  oneLiner:
    '监控系统未授权、日志里躺着明文密码与身份证号时，日志这个「记事本」成了攻击者的情报库。',
  cause:
    '两个面叠加：① 监控/管理系统（Kibana、Grafana、Prometheus、RabbitMQ）未鉴权或暴露公网；② 日志记录时未脱敏（明文密码、Token、身份证号、银行卡号被顺手记进日志）。为什么日志会泄密：日志为排障记录「一切细节」——密码、Token 被顺手记了进去，而日志系统又常常裸奔；记事本锁在抽屉里没事，放在桌上就是情报库。',
  where: 'Kibana/Grafana/Prometheus/RabbitMQ 管理台；应用日志（登录日志、请求日志、错误日志）；审计日志。',
  kinds: [
    { name: '监控台暴露', plain: '管理台未授权/公网', signal: 'Kibana/Grafana 可匿名访问' },
    { name: '日志明文', plain: '敏感数据没脱敏', signal: '日志含明文密码、Token、身份证号' },
    { name: '日志权限过宽', plain: '谁都能看日志', signal: '日志目录可读、日志接口无鉴权' },
  ],
  signals: ['Kibana / Grafana / Prometheus / RabbitMQ 管理台未授权', '日志中含有明文密码、Token、身份证号'],
  impact: '监控台失守（看到全站流量、配置、内网拓扑）；日志里的明文密码/Token 直接可用（凭证泄露）；身份证/银行卡泄露（合规风险）。',
  verify: [
    '探测监控系统端口/路径是否需鉴权（演示样例，自有资产）。',
    '检查日志内容：搜 password、token、身份证/银行卡模式。',
    '评估泄露内容可直接利用的程度（凭证可登录？）。',
  ],
  protect: {
    root: '监控系统鉴权 + 网络隔离（不暴露公网）；日志脱敏（手机号、身份证、银行卡、密码、Token）。',
    harden: '日志访问审计；日志最小权限。',
    fallback: '日志敏感信息扫描告警。',
  },
  mistakes: [
    '只防应用不防监控系统（监控台是另一个入口）。',
    '「先记下来再说」——日志里记了明文密码，脱敏忘了做。',
    '以为「日志是内部的」（内部系统未授权照样被扫到，联动 8.5「内网也要认证」教训）。',
  ],
  terms: ['log-masking', 'info-leak'],
  relatedTerms: ['log-masking'],
  pinyin: { full: 'ri zhi yu jian kong xi tong xie lou', joined: 'rizhiyujiankongxitongxielou', initial: 'rzyjkxtxl' },
  related: ['debug-endpoint', 'error-disclosure', 'info-leak'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的监控与日志）：\n现状（演示样例）：Kibana 未授权可访问；应用日志记了登录请求原文（含密码）\n\n攻击步骤：\n1. 访问 Kibana（未授权）→ 看到全站请求日志\n2. 在日志里搜 password 字段（演示样例，日志行）：\n     POST /login {"user":"alice","password":"..."}\n   ——明文密码躺在日志里\n3. 直接用该密码登录 alice 账号\n\n逻辑链自查（硬标准：日志中字段名与请求原文逐字符对上，密码值逐字符一致）：\n输入（访问未授权监控台 + 检索日志）\n→ 机制（监控台无鉴权 + 日志未脱敏，两个暴露面叠加）\n→ 结果（明文密码可直接使用）✔\n逐字符核对：日志中 password 字段与登录请求原文的字段名逐字符一致 ✔\n           密码值与用户实际输入逐字符一致（脱敏后应为 ******，明文即缺陷）✔\n           Kibana 路径可匿名访问——监控台鉴权缺失面确认 ✔',
    language: 'plaintext',
    note: '材料为演示样例，站点与日志为虚构，非现场运行、非真实系统。修法对照：监控台鉴权+网络隔离（第 1 步被拒）+ 日志脱敏（第 2 步日志里 password 是 ******），两面各堵。',
    source: 'demo',
  },
  guide: {
    why: '盯两个面——监控台的门锁了吗、日志里有没有不该记的。日志本该是排障的记事本，记了明文凭证就成了情报库；监控台本该是运维的仪表盘，没锁就成了全站流量的放映厅。',
    how: '① 探测监控系统鉴权；② 日志搜敏感模式（password/token/身份证）；③ 修复按「监控鉴权隔离+日志脱敏+访问审计」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-807', summary: '日志脱敏与监控系统防护规范（成因：日志含明文凭证 + 监控台未授权；教训：脱敏 + 鉴权隔离）', lesson: '脱敏 + 鉴权隔离', source: 'OWASP Logging Cheat Sheet', credibility: '权威' },
  ],
};

export const ch8Entries: LearningEntry[] = [
  hardcodedSecret,
  sourceLeak,
  errorDisclosure,
  directoryListing,
  defaultCredentials,
  debugEndpoint,
  cacheCdnMisconfig,
  hostHeaderAttack,
  logMonitoringLeak,
];

export default ch8Entries;
