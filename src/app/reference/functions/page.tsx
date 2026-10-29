import { RefHeader, RefSection, RefTable, RefCallout, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '危险函数库 · 知识库 · BinInsight',
  description: 'C 标准库危险函数全表：风险等级、漏洞类型与安全替代品。',
};

const EXTREME = <span style={{ color: 'var(--accent-red)' }}>极高</span>;
const HIGH = <span style={{ color: 'var(--accent-orange)' }}>高</span>;

export default function FunctionsPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="Dangerous Functions"
        title="危险函数库"
        desc="漏洞审计的第一步往往是从符号表或导入表里搜这几个名字。本页按用途分组，给出风险等级、漏洞类型与安全替代品。"
      />

      {/* 1. 字符串操作 */}
      <RefSection num="01" title="字符串操作（最经典）">
        <P>
          这一组是栈溢出教材的常客，共同特点是<B>拷贝长度由输入内容决定</B>（遇 \0 才停），
          而不是由调用者显式限制。
        </P>
        <RefTable
          columns={['函数', '风险等级', '漏洞类型', '安全替代', '备注']}
          monoCols={[0, 3]}
          rows={[
            ['strcpy', EXTREME, '栈溢出', 'strlcpy', '无长度限制，遇 \\0 才停'],
            ['strcat', EXTREME, '栈溢出', 'strlcat', '拼接前不检查目标缓冲区剩余空间'],
            ['sprintf', EXTREME, '栈溢出 + 格式化串', 'snprintf', '格式化与长度双重风险'],
            ['vsprintf', EXTREME, '栈溢出', 'vsnprintf', '可变参数版本的 sprintf'],
            ['gets', EXTREME, '栈溢出', 'fgets', 'C11 标准已移除：不读长度，遇换行才停'],
            ['scanf("%s")', HIGH, '栈溢出', '限定宽度 "%31s"', '不写宽度时等价于 gets'],
          ]}
        />
        <P>
          注意 <C>strncpy</C> 并不是安全版 strcpy：当源串长度 ≥ n 时<B>不会补 \0</B>，
          后续字符串操作会直接越界读。真正的现代替代是 strlcpy / snprintf，
          或者在明确计算长度后使用 memcpy。
        </P>
      </RefSection>

      {/* 2. 格式化输出 */}
      <RefSection num="02" title="格式化输出">
        <P>
          把用户输入直接当作格式串，攻击者就能用 <C>%x</C> 泄露栈上数据、用 <C>%n</C> 向任意地址写入。
        </P>
        <RefTable
          columns={['函数', '危险用法', '后果']}
          monoCols={[0, 1]}
          rows={[
            ['printf', 'printf(user_input)', '%x 泄露内存，%n 任意地址写'],
            ['fprintf', 'fprintf(fp, user_input)', '同上，输出目标是文件流'],
            ['sprintf', 'sprintf(buf, user_input)', '格式化串与栈溢出双重风险'],
            ['syslog', 'syslog(priority, user_input)', '守护进程中最常见的格式化串漏洞点'],
          ]}
        />
        <RefCallout tone="red" title="审计口诀">
          <p>
            「printf 的第一个参数必须是常量。」看到 printf / sprintf / syslog 的格式参数来自变量，就是漏洞。
            修复只需一行：<C>printf("%s", user_input)</C>。
          </p>
        </RefCallout>
      </RefSection>

      {/* 3. 内存操作 */}
      <RefSection num="03" title="内存操作">
        <RefTable
          columns={['函数', '风险', '说明']}
          rows={[
            ['memcpy', '长度参数来自用户 = 溢出', '函数本身安全，危险的是第三个参数 n 不可信'],
            ['memmove', '同 memcpy', '允许源与目标区域重叠，其余风险相同'],
            ['realloc', '返回 NULL 时原指针泄漏', '直接 p = realloc(p, n) 会在失败时丢失原指针'],
            ['alloca', '栈上分配且长度可控', '分配大小来自输入时可直接耗尽栈空间'],
            ['strdup', '隐式分配', '返回的副本需手动 free，遗忘即内存泄漏'],
          ]}
        />
        <P>
          共同点：<B>长度参数必须由程序自身计算得出</B>，而不是直接采信数据包或文件头里的字段。
        </P>
      </RefSection>

      {/* 4. 命令与路径执行 */}
      <RefSection num="04" title="命令与路径执行">
        <RefTable
          columns={['函数', '风险', '说明']}
          monoCols={[0]}
          rows={[
            ['system', '命令注入', '参数经 shell 解析，;、$( )、| 都能注入命令'],
            ['popen', '命令注入', '与 system 相同，且会返回命令输出流'],
            ['execlp / execvp', 'PATH 劫持', '按 PATH 搜索程序：搜索路径可控时执行的是假冒程序'],
            ['dlopen', '相对路径加载', '相对路径的 .so 可能被替换为恶意库'],
          ]}
        />
      </RefSection>

      {/* 5. 整数相关陷阱 */}
      <RefSection num="05" title="整数相关陷阱">
        <RefTable
          columns={['写法', '陷阱', '后果']}
          monoCols={[0]}
          rows={[
            ['atoi', '无错误检查', '非法输入返回 0，无法区分 "0" 与 "abc"'],
            ['int len; if (len > 256)', '有符号 / 无符号比较', 'len 为负时绕过上限检查，后续 memcpy 中它被当作巨大的无符号数'],
            ['malloc(n * size)', '乘法回绕', 'n × size 溢出后分配出过小的缓冲区，写入时造成堆溢出'],
          ]}
        />
      </RefSection>

      <RefCallout tone="brand" title="审计工作流：5 分钟定位危险调用点">
        <p>
          用 <C>readelf -s ./prog</C> 查看导入的动态符号，或在 IDA 中对危险函数按 X 查交叉引用（XREF），
          所有调用点一览无余 —— 这正是教学第 2 步「危险函数定位」在真实项目中的样子。
        </p>
      </RefCallout>

      <RefPager
        prev={{ slug: 'syscalls', title: '系统调用表' }}
        next={{ slug: 'vulns', title: '漏洞类型全谱' }}
      />
    </div>
  );
}
