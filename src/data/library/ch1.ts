/**
 * 第 1 章 · 注入类漏洞（9 条样章）—— 内容逐字取自 docs/06 §8（v1.3）。
 * 低档 4 条走 format:'card'（8 段 + 3 题）；中高档 5 条走 format:'interactive'
 * （8 段 + caseDemo + guide，默认展开；stages 留空、templateId 预留，批 0 不实现闯关）。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, CardEntry, InteractiveEntry } from './types';

const sqlInjection: CardEntry = {
  id: 'sql-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: 'SQL 注入',
  hazard: 5 as const,
  difficulty: 'beginner' as const,
  scene: ['Web' as const, 'API' as const],
  aliases: ['SQL注入', 'SQLi', 'sql injection', 'sqlzr'],
  oneLiner:
    '把用户输入拼接进 SQL 语句，导致输入被当作 SQL 代码解析，攻击者可改写语句语义，造成未授权的数据读取、篡改或删除。',
  cause:
    '程序通过字符串拼接构造 SQL 语句时，用户输入直接进入语句结构：\n\n# 演示样例：危险写法\nsql = "SELECT * FROM users WHERE name = \'" + name + "\'"\n\n若输入为 alice，语句按预期查询该用户；若输入 alice\' OR \'1\'=\'1，引号闭合了字符串字面量，后续 OR 条件恒为真，查询返回全部行。该写法与主线 strcpy 的缺陷同源：均未对输入做边界或语义校验，数据进入了指令位。',
  where:
    '登录、搜索、排序（ORDER BY）、分页（LIMIT）、筛选、导出、报表、老版本接口，以及 ORM 里的「原生 SQL 逃生口」（Raw()、whereRaw()、createNativeQuery()）。',
  kinds: [
    { name: '联合查询注入', plain: '直接把数据库里的数据显示在页面上', signal: '页面出现本不该出现的值' },
    { name: '报错注入', plain: '故意让数据库报错，把数据藏在报错信息里带出来', signal: '构造非法表达式后返回数据库报错文本' },
    { name: '布尔盲注', plain: '页面只会「正常 / 异常」，靠真假两种状态一点点猜', signal: 'and 1=1 与 and 1=2 返回不同' },
    { name: '时间盲注', plain: '连正常异常都没差别，靠「慢不慢」猜', signal: '条件为真时响应明显变慢几百毫秒' },
    { name: '堆叠注入', plain: '一次执行多条 SQL，用分号隔开', signal: '能否用 ; 追加第二条语句' },
    { name: '二次注入', plain: '恶意数据先入库（转义后），取出再拼接时才触发', signal: '改完资料、再访问另一个页面才异常' },
    { name: '宽字节注入', plain: '某种编码下反斜杠被「吃掉」', signal: '单引号明明转义了仍能闭合' },
  ],
  signals: [
    '输入一个单引号 \' 或双引号 "，页面报错或 500。',
    '输入 \' and \'1\'=\'1 与 \' and \'1\'=\'2，两次结果不一样。',
    '数字型参数做加减：id=2-1 如果返回的是 id=1 的内容，说明输入被当算术表达式执行了。',
    '同样的请求，真假条件下耗时差几百毫秒以上（时间盲注）。',
  ],
  impact:
    '拖库（用户表、订单、密钥）；篡改与删除数据；条件合适时写文件拿到 WebShell，甚至通过数据库扩展执行系统命令；再借数据库权限往内网横向。',
  verify: [
    '列出所有输入点：不止表单，还有 Cookie、请求头、JSON 字段、文件路径参数、批量接口的数组元素。',
    '先做无害探测：\'、"、)、\\，看是否报错或行为变化。到这一步就停也已经有结论。',
    '确定是数字型还是字符型：用 and 1=1 / and 1=2 看差异，判断闭合方式。',
    '确定能不能回显：能回显就看能不能并查出数据；不能回显就看真假差异；连差异都没有再看时间差。',
    '确认权限边界：只读是谁、能不能跨库、能不能读写文件——这决定危害评级，不要一上来就往最坏处做。',
    '别漏掉「看起来安全」的地方：ORM 项目里的原生 SQL、报表模块、后台管理、旧版本接口。',
  ],
  protect: {
    root: '全部改成参数化查询/预编译（PreparedStatement、? 占位符、ORM 参数绑定）。数据就待在数据位，拼接的路被堵死。',
    harden:
      '表名、列名、排序方向这类「没法参数化」的位置，用白名单枚举；Web 应用用独立的低权限数据库账号；关掉详细报错（统一错误页）；收紧数据库扩展与文件写入权限。',
    fallback: 'WAF 规则 + 参数长度/类型强校验。只做兜底。',
  },
  mistakes: [
    '只过滤 union select、sleep 这几个词——注释、编码、大小写变体都能绕开。',
    '以为用了 ORM 就安全：whereRaw / orderBy(request(\'sort\')) 一样会注入。',
    '只测 GET/POST，不测请求头和 JSON。',
    '以为预编译什么都能保护——它只保护「值」，保护不了「表名、列名」这类标识符。',
  ],
  quiz: [
    {
      kind: 'identify' as const,
      material: '某搜索接口把关键词直接拼进 WHERE name LIKE \'%关键词%\'。输入 x\' OR \'1\'=\'1 后，页面列出了全部用户。',
      question: '最贴切的解释是？',
      options: [
        { text: '输入里的引号提前结束了字符串，后面的 OR 被数据库当成命令', correct: true, explain: '正确。原本用户输入只是「要搜的词」，引号让它跳出了数据位，OR \'1\'=\'1\' 让条件恒真。这正是「数据被当成指令」。' },
        { text: '数据库坏了，返回了缓存', correct: false, explain: '错误。返回全部用户是条件被改写成恒真的典型表现，不是缓存问题。' },
        { text: '前端把搜索框内容显示出来了', correct: false, explain: '错误。前端显示不等于数据库返回；这里是后端查询被改变。' },
        { text: '因为没做输入长度限制', correct: false, explain: '错误。长度限制不是根治手段；即使限制长度，引号仍能闭合语句。' },
      ],
    },
    {
      kind: 'protect' as const,
      material: '同一个搜索接口，开发给出四种改法：① 用参数化查询/预编译绑定关键词；② 把 \' 和 OR 过滤掉；③ 给关键词限制 20 个字符；④ 加一层 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 用参数化查询，让关键词永远待在数据位', correct: true, explain: '正确。数据与语句分离，输入再含引号也只是「要搜的字符串」，拼不出新条件——这是根治。' },
        { text: '② 过滤 \' 和 OR', correct: false, explain: '错误。有编码、注释、大小写等多种绕过方式，黑名单追不完，只能算减少攻击面。' },
        { text: '③ 限制长度', correct: false, explain: '错误。短 payload 也能闭合语句（如 \'--），长度挡不住注入。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底，不能替代正确的代码写法；规则不全时会被绕。' },
      ],
    },
    {
      kind: 'mistake' as const,
      material: '开发说「我们用了 ORM，所以不会有 SQL 注入」。代码中有一行 orderBy(request(\'sort\'))。',
      question: '这句话对吗？',
      options: [
        { text: '不对，排序字段拼进了语句，需要白名单枚举', correct: true, explain: '正确。ORM 能绑定「值」，但 order by 后面是「标识符」（列名），多数 ORM 不对它做参数绑定，必须用白名单。' },
        { text: '对，ORM 会自动转义所有输入', correct: false, explain: '错误。这是最常见的误解，ORM 的原生 SQL 与动态排序/筛选是注入高发区。' },
        { text: '对，因为 request(\'sort\') 来自服务器', correct: false, explain: '错误。它来自请求参数，是用户输入。' },
        { text: '无法判断，要看数据库版本', correct: false, explain: '错误。不看数据库也能判断：动态标识符拼接本身就是风险点。' },
      ],
    },
  ],
  terms: ['sql', 'sql-injection', 'parameterized-query', 'orm', 'blind-injection', 'union-injection', 'webshell', 'waf', 'cwe'],
  relatedTerms: ['sql-injection', 'parameterized-query', 'orm', 'blind-injection', 'waf'],
  pinyin: { full: 'sql zhu ru', joined: 'sqlzhuru', initial: 'sqlzr' },
  related: ['orm-hql-injection', 'nosql-injection', 'blind-injection', 'm01-three-laws'],
  realCases: [
    { refId: 'RC-001', summary: '某电商搜索接口 SQL 注入导致用户表泄露（成因：关键词直接拼接；教训：参数化查询）', lesson: '参数化查询堵住拼接', source: 'PortSwigger Web Security Academy SQL injection 实验', credibility: '平台' },
    { refId: 'RC-002', summary: '某 CMS 登录处字符型 SQL 注入（成因：引号未转义；教训：预编译 + 统一错误页）', lesson: '预编译 + 统一错误页', source: 'NVD / CVE 公开记录（教学用占位编号）', credibility: '权威' },
  ],
  source: 'demo' as const,
  format: 'card' as const,
};

const nosqlInjection: InteractiveEntry = {
  id: 'nosql-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: 'NoSQL 注入',
  hazard: 4 as const,
  difficulty: 'intermediate' as const,
  scene: ['Web' as const, 'API' as const],
  aliases: ['NoSQL注入', 'nosql injection', 'mongodb 注入', '操作符注入'],
  oneLiner:
    '部分非关系型数据库（如 MongoDB）的查询条件是对象而非字符串；若程序把用户输入原样注入查询对象，攻击者可植入操作符改写查询语义，例如将「密码等于 x」改为「密码不等于空」，直接通过认证。',
  cause:
    '主线里的 strcpy 未校验长度；此处的对应缺陷是未校验类型。程序期望收到字符串，却收到对象并直接提交给数据库：\n\n# 演示样例：期望 password 是字符串，实际收到对象\n{"username": "admin", "password": {"$ne": ""}}\n\n$ne 表示「不等于」，查询因此变为「用户名为 admin 且密码不等于空字符串」，任意非空密码均通过。风险写法还包括把整个请求体直接传入 find(req.body)，以及在 $where 中拼接 JavaScript。',
  where: '接收 JSON 的登录、查询、筛选接口；文件名 / 参数被解析成对象的位置。',
  kinds: [
    { name: '操作符注入', plain: '把字符串换成 {"$ne": ""} 这类对象', signal: '登录绕过、返回条数异常' },
    { name: '正则盲注', plain: '用 $regex 逐字符试探', signal: '响应随前缀匹配变化' },
    { name: 'JS 执行', plain: '$where / mapReduce 里拼接脚本', signal: '明显延迟或异常行为' },
    { name: '参数污染', plain: '同时传 a=x 和 a[$ne]=1，看后端怎么解析', signal: '类型转换后的意外结果' },
  ],
  signals: [
    '接口接收 JSON，把字符串值换成 {"$ne": null} 后行为改变。',
    'URL 参数写成 username[$ne]=1 后返回异常或直接登录成功（某些语言会把这种写法解析成数组/对象）。',
    '输入 $where 类表达式后出现明显延迟。',
  ],
  impact: '认证绕过、全量数据读取、服务端脚本执行（在支持 $where 的旧配置里）、正则灾难性回溯导致的拒绝服务。',
  verify: [
    '看接口是否接收 JSON，尝试把字符串换成对象 {"$ne": null}。',
    '试常见操作符：$ne、$gt、$regex、$in、$exists。',
    '用 {"$regex":"^a"} 观察响应差异，逐字符猜解。',
    '同时传 username=x&username[$ne]=1，看后端类型转换结果。',
    '注意 Content-Type: application/json 与表单参数的解析差异，两条路都要看。',
  ],
  protect: {
    root: '强制类型校验——期望字符串就必须是字符串，收到对象/数组直接拒绝。',
    harden: '用数据库驱动的查询构造器，禁止把整个请求体直接丢进 find()；关闭服务端 JS 执行（MongoDB 关闭 $where、mapReduce 的脚本能力）；按库授权数据库账号。',
    fallback: 'WAF / 网关层限制参数结构。',
  },
  mistakes: [
    '只想到 SQL 注入而忽略 JSON 接口。',
    '忽略表单参数与 JSON 的解析差异；a[$ne]=1 这种写法在部分框架里会被自动转成对象。',
    '以为 NoSQL「没有 SQL 语句」就没注入——注入的本质是「数据被当成查询结构」，与有无 SQL 无关。',
  ],
  terms: ['nosql', 'query-operator', 'type-validation', 'waf'],
  pinyin: { full: 'nosql zhu ru', joined: 'nosqlzhuru', initial: 'nosqlzr' },
  related: ['sql-injection', 'orm-hql-injection', 'command-injection'],
  caseDemo: {
    material:
      '演示样例：某登录接口接收 {"user":"admin","pass":"123456"}。把 pass 换成 {"$ne":""} 后返回登录成功。界面只显示「登录成功/失败」，没有回显查询内容。',
    language: 'plaintext',
    note: '演示样例，非现场运行、非真实系统。',
    source: 'demo',
  },
  guide: {
    why: '盯住「期望字符串的位置收到了对象」。NoSQL 的注入点不是引号，而是类型——这是它和 8.1 SQL 注入最大的不同。',
    how: '先正常登录一次看返回；再把字符串换成 {"$ne":null} 看返回是否变化；变化了就说明输入被当成查询操作符，而不是普通值。',
  },
  guideDefaultOn: true as const,
  stages: [] as [],
  templateId: 'TPL-INJECT' as const,
  source: 'demo' as const,
  format: 'interactive' as const,
};

const commandInjection: InteractiveEntry = {
  id: 'command-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: '命令注入（OS Command Injection）',
  hazard: 5 as const,
  difficulty: 'intermediate' as const,
  scene: ['Web' as const, 'API' as const, '系统' as const],
  aliases: ['命令注入', 'OS Command Injection', '命令执行', 'command injection', 'minglingzhuru'],
  oneLiner:
    '程序把用户输入拼接进系统命令，攻击者通过命令分隔符（如 ;）追加自有命令，导致服务器在原命令之后执行攻击者指定的指令。',
  cause:
    '主线 L3 讲述过「为复制函数增加长度上限」。此处的缺陷不是缺少长度上限，而是根本不应让外部输入进入命令行：\n\n# 演示样例：危险写法\nos.system("ping -c 1 " + host)\n\n若输入为 127.0.0.1; id，实际先执行 ping 再执行 id。高发功能：图片处理、视频转码、压缩解压、域名/IP 查询、二维码生成、PDF 生成、备份脚本——凡调用外部程序之处均需审查。',
  where: '凡调用外部程序的功能：图片处理、视频转码、压缩解压、域名/IP 查询、二维码、PDF 生成、备份脚本。',
  kinds: [
    { name: '有回显', plain: '命令输出直接显示在页面上', signal: '输入 ; id 后页面出现用户信息' },
    { name: '无回显 - 延时', plain: '看不到输出，但能让它「慢几秒」', signal: '; sleep 5 后响应明显变慢' },
    { name: '无回显 - 外带', plain: '让服务器主动访问攻击者能看到的地址', signal: 'DNSLog / HTTP 回连记录到请求' },
  ],
  signals: [
    '参数值里出现 ;、|、&、反引号、$()、%0a（换行）后行为变化。',
    '输入 127.0.0.1; id 出现命令输出（有回显时）。',
    '无回显时，; ping -c 3 你的域名（外带）或 ; sleep 5（延时）有可观察变化。',
  ],
  impact: '服务器完全沦陷——读配置、横向移动、留后门。通常直接评为严重。',
  verify: [
    '找出所有「调用了外部程序」的功能：格式转换、二维码、打包、域名查询、日志分析。',
    '判断输入是否经过 shell：; 与 | 哪个生效（| 生效通常说明经过 shell）。',
    '无回显时用「延时 + 外带」双路验证，避免误判。',
    '只在授权范围内验证；教学演示用无害的 sleep 或回连标记，不做破坏性命令。',
  ],
  protect: {
    root: '不调用 shell——用参数数组形式（ProcessBuilder(["convert", in, out])、subprocess.run([...], shell=False)）。命令与参数分开传递，分隔符就只是普通字符。',
    harden: '必须拼接时，参数用白名单（文件名只允许 [a-zA-Z0-9._-]）、路径规范化、禁止 ..；尽量用安全的库替代外部命令；运行账号降权（容器内非 root）。',
    fallback: 'WAF / 命令审计。只做黑名单过滤（;|&）几乎必然被绕过，不可当主防护。',
  },
  mistakes: [
    '只测表单不测文件名。',
    '只测常见分隔符，忘了换行 %0a。',
    '以为「参数被引号包住了」就安全——反引号与 $() 仍能突破。',
  ],
  terms: ['command-injection', 'shell', 'oob', 'allowlist', 'waf'],
  relatedTerms: ['command-injection', 'shell', 'oob', 'allowlist'],
  pinyin: { full: 'ming ling zhu ru', joined: 'minglingzhuru', initial: 'mlzr' },
  related: ['ssti', 'code-injection', 'm01-three-laws'],
  caseDemo: {
    material:
      '演示样例：某「网络测速」页，输入 host 执行 ping -c 1 <host>。输入 127.0.0.1; sleep 5 后页面卡 5 秒才回；输入 127.0.0.1; id 页面无输出。材料给「测速表单 + 两次请求的耗时截图」。',
    language: 'plaintext',
    note: '演示样例，非现场运行、非真实系统。',
    source: 'demo',
  },
  guide: {
    why: '先看「输入里多出来的符号有没有生效」。; 生效说明输入进了命令行，这是命令注入的第一信号。',
    how: '有回显就试 ; id 看输出；没回显就走两条路——; sleep 5（看时间差）或 ; ping 你的域名（看外带记录）。两条都只是确认，不做破坏。',
  },
  guideDefaultOn: true as const,
  stages: [] as [],
  templateId: 'TPL-INJECT' as const,
  source: 'demo' as const,
  format: 'interactive' as const,
};

const codeInjection: InteractiveEntry = {
  id: 'code-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: '代码 / 表达式注入',
  hazard: 5 as const,
  difficulty: 'advanced' as const,
  scene: ['Web' as const, 'API' as const],
  aliases: ['代码注入', '表达式注入', 'code injection', 'eval 注入', 'daimazhuru'],
  oneLiner:
    '程序把用户输入当作可求值的表达式交给解释器执行。输入 7*7 返回 49 即表明输入被求值，而非被显示；表达式求值可被进一步用于调用危险能力。',
  cause:
    '主线 L2 说「先找危险调用」。这里的危险调用是「表达式求值函数」：\n\n# 演示样例：危险写法\nresult = eval(user_input)          # 把用户输入当代码算\n\nJava 生态里更隐蔽：Spring 的 SpEL（${...} / #{...}）、Struts2 的 OGNL、JSP EL、脚本引擎。高发功能是「让用户输入公式」的地方——搜索条件、公式字段、报表自定义列、规则配置、低代码平台。和主线的对应：eval 就是 Web 版的「把输入当指令执行」，比 strcpy 更直接。',
  where: '让用户输入公式的位置：搜索条件、公式字段、报表自定义列、规则配置、低代码平台。',
  kinds: [
    { name: '通用 eval', plain: '把输入交给 eval 直接计算', signal: '输入 7*7 返回 49' },
    { name: 'Java SpEL', plain: 'Spring 表达式语言', signal: '${7*7} 返回 49；报错含 SpelEvaluationException' },
    { name: 'Struts2 OGNL', plain: 'Struts2 的表达式语言', signal: '%{7*7} 返回 49；报错含 OgnlException' },
    { name: 'JSP EL / Thymeleaf', plain: 'JSP/模板里的表达式', signal: '${7*7} 返回 49' },
  ],
  signals: [
    '输入 7*7、${7*7}、#{7*7} 返回 49。',
    '报错里出现 SpEL/OGNL 等引擎名为强信号。',
    '「可写公式/表达式」的功能一律优先看。',
  ],
  impact: '直接远程代码执行（RCE），等同拿到服务器。',
  verify: [
    '列出所有「用户能写表达式」的输入点。',
    '先用纯算术 7*7 探测是否被求值（无害）。',
    '确认引擎与沙箱后，再尝试读系统属性/环境变量，最后才谈命令执行——务必在授权范围内。',
    '关注版本：老框架有公开 CVE。',
  ],
  protect: {
    root: '不把用户输入交给表达式引擎；确需动态能力时用受限 DSL（只允许枚举字段与运算）。',
    harden: '升级框架、关闭危险动态特性（如 Struts2 静态方法访问）、沙箱隔离 + 超时限制。',
    fallback: 'WAF 规则，只做兜底。',
  },
  mistakes: [
    '以为「前端没入口」就安全——后端接口照样能调；忽略管理后台的表达式配置功能。',
  ],
  terms: ['code-injection', 'expression-engine', 'spel', 'rce', 'dsl', 'waf'],
  pinyin: { full: 'dai ma zhu ru', joined: 'daimazhuru', initial: 'dmzr' },
  related: ['ssti', 'command-injection', 'sql-injection'],
  caseDemo: {
    material: '演示样例：某报表「自定义计算列」允许输入公式，输入 ${7*7} 页面显示 49，输入常规文本原样显示。',
    language: 'plaintext',
    note: '演示样例，非现场运行、非真实系统。',
    source: 'demo',
  },
  guide: {
    why: '返回 49 说明输入被「算了」而不是「显示」了——这是表达式注入的指纹。',
    how: '先算术探测确认被求值 → 认引擎（看报错关键字）→ 再判断有无沙箱。只在授权环境推进到读属性一步。',
  },
  guideDefaultOn: true as const,
  stages: [] as [],
  templateId: 'TPL-INJECT' as const,
  source: 'demo' as const,
  format: 'interactive' as const,
};

const ssti: InteractiveEntry = {
  id: 'ssti',
  kind: 'vuln' as const,
  chapter: 1,
  title: '服务端模板注入 SSTI',
  hazard: 5 as const,
  difficulty: 'advanced' as const,
  scene: ['Web' as const],
  aliases: ['SSTI', '服务端模板注入', 'Server-Side Template Injection', 'ssti'],
  oneLiner:
    '用户输入被当成「模板内容」而不是「模板变量」来渲染，于是模板引擎的表达式被执行——输入 {{7*7}} 返回 49 就是信号，继续深入可读文件、拿环境变量，最终执行代码。',
  cause:
    '常规写法是模板固定、数据作为变量传入；风险写法把用户输入直接作为模板渲染：\n\n# 演示样例：危险写法（Flask + Jinja2）\nreturn render_template_string("你好 " + user_input)   # 用户输入成为模板内容\n\n若写成 render_template("hello.html", name=user_input)，用户输入仅作为变量，会被转义显示，安全。高发位置：把用户名/昵称拼入模板再渲染、邮件/短信/PDF 模板、页面装修、主题自定义。',
  where: '把用户名/昵称拼进模板再渲染、邮件/短信/PDF 模板、页面装修、主题自定义。',
  kinds: [
    { name: 'Jinja2 / Twig', plain: 'Python / PHP 常用模板引擎', signal: '{{7*7}} 返回 49' },
    { name: 'Freemarker', plain: 'Java 模板引擎', signal: '${7*7} 返回 49' },
    { name: 'ERB / EJS', plain: 'Ruby / Node 模板引擎', signal: '<%= 7*7 %> 返回 49' },
    { name: 'Velocity / Smarty / Handlebars', plain: '其它模板引擎', signal: '按引擎变体' },
  ],
  signals: [
    '输入 {{7*7}} 返回 49；输入 <b>x</b> 若被原样渲染成加粗而非转义显示，也是信号。',
    '报错暴露模板引擎名。',
    '「模板名可控」与「模板内容可控」是两种漏洞，后者更严重。',
  ],
  impact: '读服务器文件、环境变量、密钥，最终远程代码执行（RCE）。',
  verify: [
    '先确认输入是「被渲染」还是「被转义」：传 {{7*7}} 与 <b>x</b> 看输出。',
    '用不同语法定位引擎（看哪个载荷生效、报错叫什么）。',
    '定位后按该引擎公开路径验证：读配置 → 找对象链 → 命令执行（只在授权环境）。',
    '区分「模板名可控」与「模板内容可控」，后者优先。',
  ],
  protect: {
    root: '模板只允许开发者控制，用户数据只能作为变量传入并自动转义。',
    harden: '用沙箱模式（Jinja2 SandboxedEnvironment）禁用危险全局对象；模板管理功能加权限与审计；禁止用户自定义模板语法。',
    fallback: 'WAF，只做兜底。',
  },
  mistakes: [
    '以为「模板注入 = XSS」——危害量级完全不同（XSS 在浏览器，SSTI 在服务器）。',
    '只测 {{7*7}}，不测 ${}、<%= %> 等其他语法。',
  ],
  terms: ['ssti', 'template-engine', 'jinja2', 'server-side-render', 'rce', 'waf'],
  relatedTerms: ['ssti', 'template-engine', 'server-side-render', 'rce'],
  pinyin: { full: 'fu wu duan mo ban zhu ru', joined: 'fuwuduanmobanzhuru', initial: 'fwdmzr' },
  related: ['code-injection', 'command-injection'],
  realCases: [
    { refId: 'RC-003', summary: '某在线报表工具 SSTI（成因：把用户输入拼进模板字符串再渲染；教训：模板固定、用户数据只作变量传入并自动转义）', lesson: '模板固定 + 变量绑定 + 自动转义', source: 'PortSwigger Web Security Academy — Server-side template injection 实验', credibility: '平台' },
    { refId: 'RC-004', summary: '某 Python Web 应用 render_template_string 滥用导致 RCE（成因：用户输入成为模板内容；教训：用沙箱环境 + 禁用危险全局对象）', lesson: '沙箱环境 + 禁用危险全局对象', source: '安全厂商公开漏洞分析报告（教学用脱敏编号）', credibility: '平台' },
  ],
  caseDemo: {
    material:
      '演示样例：某网站「个人主页预览」功能，用户输入昵称后立即预览。\n\n请求 A：nick=Alice        → 页面显示：你好 Alice\n请求 B：nick={{7*7}}      → 页面显示：你好 49\n\n界面截图显示 B 的「49」而非「{{7*7}}」原文。搜索引擎报错页里出现过 jinja2 字样。',
    language: 'plaintext',
    note: '教学边界：载荷只到「读配置项」为止，不提供读取真实密钥或命令执行的可运行代码。',
    source: 'demo',
  },
  guide: {
    why: '「你好 49」是关键——你输入的是 {{7*7}}，页面却显示了 49。这说明你的输入没有被当成普通文字显示，而是被模板引擎当成表达式算掉了。普通用户输入永远不该触发「计算」。这就是模板注入的指纹，和表达式注入是同一类「输入被当代码」的问题，只是发生在不同地方。',
    how: '第一步：{{7*7}} → 49，确认「被渲染」而非「被转义」。第二步：认引擎——报错里出现 jinja2，说明是 Jinja2，用 {{ }} 这套语法。第三步（仅授权环境）：试着读一个环境配置项，看能否带出来；这一步只为确认严重程度，教学不做破坏。判断口诀：「输入被算出来 = 注入；输入被原样显示 = 安全」。',
  },
  guideDefaultOn: true as const,
  stages: [] as [],
  templateId: 'TPL-INJECT' as const,
  source: 'demo' as const,
  format: 'interactive' as const,
};

const ldapInjection: InteractiveEntry = {
  id: 'ldap-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: 'LDAP / XPath / XQuery 注入',
  hazard: 3 as const,
  difficulty: 'intermediate' as const,
  scene: ['Web' as const, '系统' as const],
  aliases: ['LDAP注入', 'XPath注入', '目录查询注入', 'ldap injection'],
  oneLiner:
    '程序把用户输入拼接进 LDAP 过滤器或 XPath 查询，改变查询逻辑——例如把限定单个用户的条件改写为匹配全部用户，从而绕过认证或读取越权数据。',
  cause:
    '和 SQL 注入同源，只是「被拼进去的语言」从 SQL 换成了 LDAP/XPath：\n\n# 演示样例：危险写法（LDAP 过滤器）\nfilter = "(&(uid=" + user + ")(userPassword=" + pwd + "))"\n\n高发位置：企业统一登录（AD/LDAP）、组织架构查询、XML 数据查询接口。',
  where: '企业统一登录（AD/LDAP）、组织架构查询、XML 数据查询接口。',
  kinds: [
    { name: 'LDAP 注入', plain: '拼进 LDAP 过滤器', signal: '登录框输入 *)(uid=* 类载荷可绕过' },
    { name: 'XPath 注入', plain: '拼进 XML 查询', signal: "输入 ' or '1'='1 返回全部节点" },
    { name: 'XQuery 注入', plain: '拼进 XQuery 表达式', signal: '报错泄露过滤器结构' },
  ],
  signals: [
    '登录框输入 *)(uid=*))(|(uid=* 类载荷可绕过（LDAP）。',
    "XPath 输入 ' or '1'='1 返回全部节点。",
    '报错泄露过滤器结构。',
  ],
  impact: '认证绕过、目录信息泄露（员工账号、手机号、组织结构）、越权读取 XML 数据。',
  verify: [
    '找出基于 AD/LDAP 的登录与查询功能。',
    '输入 *、)、( 观察行为差异。',
    '用真假条件差异判断过滤条件是否被改写。',
  ],
  protect: {
    root: 'LDAP 用官方转义函数（RFC 4515，转义 \\*()\\0）；XPath 用参数化 API（变量绑定）。',
    harden: '限制查询返回字段与条数。',
    fallback: 'WAF。',
  },
  mistakes: [
    '只转义 ( ) 漏掉 * 和 \\；把「密码错误」和「用户不存在」返回不同信息，造成账号枚举。',
  ],
  terms: ['ldap', 'xpath', 'rfc4515', 'directory-query', 'waf'],
  pinyin: { full: 'ldap zhu ru', joined: 'ldapzhuru', initial: 'ldapzr' },
  related: ['sql-injection', 'nosql-injection', 'command-injection'],
  caseDemo: {
    material:
      '演示样例：某企业内网登录页，输入用户名 admin、任意密码被拒；输入用户名 *)(uid=*))(|(uid=*、任意密码后登录成功并跳到首页。',
    language: 'plaintext',
    note: '演示样例，非现场运行、非真实系统。',
    source: 'demo',
  },
  guide: {
    why: '用户名里那串奇怪符号改变了「查询谁」的条件——这就是查询结构被改写，和 SQL 注入一个道理，只是语言换成 LDAP。',
    how: '先正常登录看失败 → 输入带 * ) 的探测串 → 看是否绕过 → 确认后用转义函数修。',
  },
  guideDefaultOn: true as const,
  stages: [] as [],
  templateId: 'TPL-INJECT' as const,
  source: 'demo' as const,
  format: 'interactive' as const,
};

const ormHqlInjection: CardEntry = {
  id: 'orm-hql-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: 'ORM / HQL 注入',
  hazard: 4 as const,
  difficulty: 'beginner' as const,
  scene: ['Web' as const, 'API' as const],
  aliases: ['ORM注入', 'HQL注入', 'orm hql', 'ormzhuru'],
  oneLiner:
    'ORM 框架本应隔离数据与语句，但其字符串查询接口被用于拼接用户输入，保护因此失效——本质仍是 SQL 注入。',
  cause:
    '正常写法 where(name=:n) 用绑定参数，安全；危险写法把用户输入拼进字符串：\n\n// 演示样例：危险写法\ncreateQuery("from User where name=\'" + n + "\'");   // HQL 拼接\n\n高发位置：whereRaw、nativeQuery、createQuery、order by 动态字段、like 拼接。',
  where: 'whereRaw、nativeQuery、createQuery、order by 动态字段、like 拼接。',
  kinds: [
    { name: 'HQL 拼接', plain: '拼进 Hibernate 查询语言', signal: 'createQuery 里出现字符串 +' },
    { name: '原生接口', plain: 'whereRaw / nativeQuery 拼原生 SQL', signal: '代码里搜 Raw、nativeQuery' },
    { name: '动态标识符', plain: 'order by 后的列名可控', signal: '排序/筛字段参数可注入' },
  ],
  signals: [
    '代码里搜 Raw、nativeQuery、createQuery、字符串 +。',
    '排序/筛选/导出功能的字段参数可注入。',
  ],
  impact: '与 SQL 注入同级，可拖库；HQL 还可能借实体属性访问到其他表。',
  verify: [
    '代码里搜 Raw、nativeQuery、createQuery、字符串拼接。',
    '对排序/筛选字段传特殊值（如 (select 1)）看是否报错。',
  ],
  protect: {
    root: '统一用绑定参数（:name / ?）。',
    harden: '动态标识符（表名/列名/排序方向）用白名单；代码评审加「禁止字符串拼接查询」静态检查。',
    fallback: 'WAF 只做兜底。',
  },
  mistakes: ['认为「用了 ORM 就不会注入」——这是最普遍的误解。'],
  quiz: [
    {
      kind: 'identify' as const,
      material: '某接口 orderBy(request(\'sort\'))，sort 来自用户输入，?sort=name 正常，改成 ?sort=(select 1) 后报错。',
      question: '这说明什么？',
      options: [
        { text: '排序参数被拼进 SQL 语句，用户输入被当成结构解析了', correct: true, explain: '正确。order by 后面是可控的，输入能改变查询结构，这就是注入信号。' },
        { text: '数据库不支持排序', correct: false, explain: '错误。正常排序能用，只是特殊输入触发了异常。' },
        { text: '这是前端校验问题', correct: false, explain: '错误。报错来自后端查询构造。' },
        { text: '参数长度不够', correct: false, explain: '错误。与长度无关。' },
      ],
    },
    {
      kind: 'protect' as const,
      material: '同一个动态排序接口，开发给出四种改法：① 用白名单枚举允许的排序列（name/age/id）；② 过滤 ( 和 select；③ 把 sort 转义后拼接；④ 只加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 用白名单，只允许从枚举的列名里选', correct: true, explain: '正确。标识符（列名）没法用绑定参数，白名单是唯一根治手段。' },
        { text: '② 过滤关键字', correct: false, explain: '错误。黑名单可绕，且合法列名里也可能含被过滤字符。' },
        { text: '③ 转义后拼接', correct: false, explain: '错误。转义解决的是「值」的问题，标识符位置仍被拼接。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底，不替代白名单。' },
      ],
    },
    {
      kind: 'mistake' as const,
      material: '开发说「我们换 HQL 了，不会 SQL 注入」。',
      question: '对吗？',
      options: [
        { text: '不对，HQL 字符串拼接同样可注入', correct: true, explain: '正确。本质都是「输入被当查询结构」。' },
        { text: '对，HQL 与 SQL 不同', correct: false, explain: '错误。语法不同但拼接风险相同。' },
        { text: '对，只要用了 ORM', correct: false, explain: '错误。ORM 的原生接口（createQuery/whereRaw）照样拼接。' },
        { text: '要看数据库版本', correct: false, explain: '错误。不看版本也能判断：动态拼接本身就是风险点。' },
      ],
    },
  ],
  terms: ['orm', 'hql', 'query-builder', 'identifier-whitelist', 'parameterized-query', 'cwe'],
  relatedTerms: ['orm', 'query-builder', 'parameterized-query'],
  pinyin: { full: 'orm hql zhu ru', joined: 'ormhqlzhuru', initial: 'ormhqlzr' },
  related: ['sql-injection', 'nosql-injection', 'ch0-framework'],
  source: 'demo' as const,
  format: 'card' as const,
};

const crlfInjection: CardEntry = {
  id: 'crlf-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: 'CRLF 注入',
  hazard: 3 as const,
  difficulty: 'beginner' as const,
  scene: ['Web' as const],
  aliases: ['CRLF注入', '头注入', '响应拆分', '%0d%0a', 'crlf injection'],
  oneLiner:
    '输入中的回车换行（CRLF）被写入本不应换行的位置（如 HTTP 响应头或日志），从而插入额外一行，攻击者可伪造响应头或日志记录。',
  cause:
    '回车换行在网址里写成 %0d%0a。程序若把用户输入原样拼进响应头，攻击者就能「另起一行」：\n\n# 演示样例：危险写法（重定向参数）\nLocation: /go?url=<用户输入>\n# 输入：/go?url=x%0d%0aSet-Cookie:admin=1\n# 结果：响应里真的多出一行 Set-Cookie:admin=1\n\n高发位置：重定向 URL 参数、写入响应头/邮件头/日志的字段。',
  where: '重定向 URL 参数、写入响应头/邮件头/日志的字段。',
  kinds: [
    { name: '响应拆分', plain: '注入 HTTP 响应头', signal: '会话固定、XSS、缓存投毒' },
    { name: '邮件头注入', plain: '注入邮件头', signal: '伪造发件人、群发钓鱼' },
    { name: '日志伪造', plain: '注入日志', signal: '伪造整行记录、掩盖攻击痕迹' },
  ],
  signals: [
    '输入 %0d%0aSet-Cookie:test=1，响应里出现新的 Set-Cookie 头。',
    '重定向参数可注入 Location。',
    '日志里出现格式规整、明显非程序生成的整行记录。',
  ],
  impact: '会话固定、缓存投毒、借拆分响应体造成 XSS、钓鱼邮件伪造、日志掩盖攻击痕迹。',
  verify: [
    '找所有「用户输入会被写进头/日志」的位置。',
    '在参数后加 %0d%0aX-Test:1，看响应是否多出 X-Test 头。',
    '确认后按注入目标分类评估危害。',
  ],
  protect: {
    root: '写入响应头/邮件头的值做严格白名单（只允许 URL 安全字符）；用框架提供的安全重定向 API，不手拼 Location。',
    harden: '框架层统一拒绝含 \\r、\\n 的输入。',
    fallback: '网关规则。',
  },
  mistakes: [
    '只过滤 \\n 不过滤 \\r；不同语言/中间件对换行处理不一致（%0d、%0a 的编码变体）。',
  ],
  quiz: [
    {
      kind: 'identify' as const,
      material: '输入 ?url=x%0d%0aSet-Cookie:admin=1 后，响应里真的多了一行 Set-Cookie:admin=1。',
      question: '最贴切的解释是？',
      options: [
        { text: '%0d%0a 是回车换行，使攻击者插入额外一行伪造响应头', correct: true, explain: '正确。本该是一行头的值被当成「新的一行」，这就是响应拆分。' },
        { text: '服务器自动给用户发了管理员 Cookie', correct: false, explain: '错误。是攻击者拼进去的，不是服务器本意。' },
        { text: '这是 SQL 注入', correct: false, explain: '错误。没有碰数据库。' },
        { text: '因为没用 HTTPS', correct: false, explain: '错误。HTTPS 不阻止把换行写进头。' },
      ],
    },
    {
      kind: 'protect' as const,
      material: '某重定向功能要把用户输入拼进 Location 头，开发给出四种改法：① 用框架的安全重定向 API、对写入头的值做严格白名单；② 过滤 %0d%0a 这几个字符；③ 把参数 URL 编码一次；④ 只加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 用安全 API + 白名单，只允许 URL 安全字符', correct: true, explain: '正确。输入永远进不了「头结构」的位置，另起一行无从谈起——根治。' },
        { text: '② 过滤 %0d%0a', correct: false, explain: '错误。有 %0d、%0a、双重编码等多种变体，黑名单追不完。' },
        { text: '③ URL 编码一次', correct: false, explain: '错误。编码可能被框架解码还原，不能作为唯一防线。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 是兜底。' },
      ],
    },
    {
      kind: 'mistake' as const,
      material: '开发说「我过滤了 \\n，安全了」。',
      question: '为什么不够？',
      options: [
        { text: '还要过滤 \\r，且编码变体多；根治是白名单 + 安全重定向 API', correct: true, explain: '正确。HTTP 头以 \\r\\n 分隔，只挡其中一个不够；且中间件解析差异多，白名单才稳。' },
        { text: '过滤 \\n 就够了', correct: false, explain: '错误。\\r 也能参与拆分。' },
        { text: '改用 POST', correct: false, explain: '错误。换行照样能写进头。' },
        { text: '加长响应头', correct: false, explain: '错误。无关。' },
      ],
    },
  ],
  terms: ['crlf', 'http-header', 'response-splitting', 'whitelist'],
  pinyin: { full: 'crlf zhu ru', joined: 'crlfzhuru', initial: 'crlfzr' },
  related: ['log-injection', 'sql-injection', 'ch0-framework'],
  source: 'demo' as const,
  format: 'card' as const,
};

const logInjection: CardEntry = {
  id: 'log-injection',
  kind: 'vuln' as const,
  chapter: 1,
  title: '日志注入 / 终端转义注入',
  hazard: 2 as const,
  difficulty: 'beginner' as const,
  scene: ['Web' as const, '系统' as const],
  aliases: ['日志注入', '终端转义注入', 'log injection', 'rizhizhuru'],
  oneLiner:
    '恶意输入被写进日志，管理员在终端查看日志时，里面的 ANSI 控制码被终端执行——能改窗口标题、把某行隐藏、或伪造出一条看似正常的日志，干扰审计。',
  cause:
    '日志系统若把用户输入原样写入，输入里的控制字符（如 \\x1b）就进了日志文件。查看器若渲染 ANSI 转义序列，就会「执行」它。高发位置：记录用户名、URL、请求参数的日志字段；运维用 cat 直接看日志的场景。',
  where: '记录用户名、URL、请求参数的日志字段；运维用 cat 直接看日志的场景。',
  kinds: [
    { name: '日志伪造', plain: '塞入假记录', signal: '日志里出现整行「正常」记录' },
    { name: '终端转义注入', plain: '塞入 ANSI 控制码改显示', signal: '终端查看出现异常显示' },
  ],
  signals: [
    '输入里含 \\x1b[ 等控制码后在终端查看出现异常显示。',
    '日志里出现格式与程序输出不一致的「整行正常记录」。',
  ],
  impact: '干扰审计、掩盖攻击痕迹、在特定场景误导运维（★低，因为通常只影响查看体验与审计准确性）。',
  verify: [
    '找写进日志的用户输入字段。',
    '输入含 \\x1b[ 的控制码，看终端查看时是否异常。',
  ],
  protect: {
    root: '日志输出时转义控制字符；日志查看器禁用 ANSI 渲染。',
    harden: '用结构化日志（JSON）并把用户数据放独立字段。',
    fallback: 'WAF 管不到日志查看环节，不作为主防护。',
  },
  mistakes: [
    '以为「危害小就不用防」——它常与其他漏洞组合，用来掩盖入侵痕迹（铁律三「漏洞链」）。',
  ],
  quiz: [
    {
      kind: 'identify' as const,
      material: '某字段名被写入日志，运维 cat 日志时终端标题被改成了一条假消息。',
      question: '原因最可能是？',
      options: [
        { text: '输入里的 ANSI 控制码被终端执行了', correct: true, explain: '正确。控制码随输入进了日志，查看时被终端当成指令渲染。' },
        { text: '服务器被完全控制', correct: false, explain: '错误。危害通常仅限显示层。' },
        { text: '这是 XSS', correct: false, explain: '错误。发生在终端查看日志时，不是浏览器。' },
        { text: '日志系统自动生成的', correct: false, explain: '错误。是输入带进来的。' },
      ],
    },
    {
      kind: 'protect' as const,
      material: '日志系统要把用户名写进日志，开发给出四种改法：① 输出时转义控制字符 + 用结构化日志（JSON）把用户数据放独立字段；② 过滤 \\x1b[ 这几个字符；③ 把用户名缩短；④ 只加 WAF。',
      question: '哪个是根治？',
      options: [
        { text: '① 转义控制字符 + 结构化日志', correct: true, explain: '正确。控制字符到不了「被终端当指令执行」的位置，用户数据在独立字段里——根治。' },
        { text: '② 过滤 \\x1b[', correct: false, explain: '错误。控制码有多种写法，黑名单追不完。' },
        { text: '③ 缩短用户名', correct: false, explain: '错误。短字符串也能藏控制码。' },
        { text: '④ 加 WAF', correct: false, explain: '错误。WAF 管不到日志查看环节。' },
      ],
    },
    {
      kind: 'mistake' as const,
      material: '开发说「这个洞危害才两星，不用管」。',
      question: '产品口径怎么看？',
      options: [
        { text: '危害低≠可忽略，它常用来掩盖其他攻击痕迹', correct: true, explain: '正确。★只说危害大小，且漏洞可串联（铁律三）。' },
        { text: '两星以下都不用修', correct: false, explain: '错误。没有这条规则。' },
        { text: '危害低说明学习难度也低', correct: false, explain: '错误。危害与难度是两个维度。' },
        { text: '只加 WAF', correct: false, explain: '错误。根治是转义控制字符 + 结构化日志。' },
      ],
    },
  ],
  terms: ['log-injection', 'ansi-escape', 'structured-logging', 'crlf'],
  pinyin: { full: 'ri zhi zhu ru', joined: 'rizhizhuru', initial: 'rzzr' },
  related: ['crlf-injection', 'ch0-framework'],
  source: 'demo' as const,
  format: 'card' as const,
};

export const ch1Entries: LearningEntry[] = [
  sqlInjection,
  nosqlInjection,
  commandInjection,
  codeInjection,
  ssti,
  ldapInjection,
  ormHqlInjection,
  crlfInjection,
  logInjection,
];

export default ch1Entries;
