import { RefHeader, RefSection, RefTable, RefCallout, RefCode, RefPager, P, B, C } from '../components';

export const metadata = {
  title: '漏洞类型全谱 · 知识库 · BinInsight',
  description: '栈溢出、堆溢出、UAF、Double Free、整数溢出、格式化字符串、竞态与类型混淆的成因、示例与利用检测。',
};

export default function VulnsPage() {
  return (
    <div className="space-y-14">
      <RefHeader
        eyebrow="Vulnerability Classes"
        title="漏洞类型全谱"
        desc="内存破坏是二进制漏洞的主战场。理解每一类漏洞的成因、内存布局与利用终点，才能在看反汇编时一眼认出「这段代码有洞」。"
      />

      {/* 1. 总览 */}
      <RefSection num="01" title="内存破坏类漏洞总览">
        <P>
          所有内存破坏漏洞的本质都是一句话：<B>程序写了它不该写的内存，或读了它不该读的内存</B>。
          区别只在于发生在哪里、能控制多少字节、最终能换来什么原语。
        </P>
        <RefTable
          columns={['漏洞类型', '内存区域', '直接后果', '典型利用终点']}
          rows={[
            ['栈溢出', '栈', '覆盖返回地址', '控制 RIP'],
            ['堆溢出', '堆', '覆写 chunk 元数据或相邻对象', '任意写'],
            ['UAF', '堆', '悬垂指针指向已释放内存', '类型混淆'],
            ['Double Free', '堆', '同一 chunk 进两次空闲链', '任意分配'],
            ['整数溢出', '—', '回绕导致小分配大拷贝', '堆或栈溢出'],
            ['格式化字符串', '栈 + 全局', '%n 任意写、%x 泄露', '任意写'],
            ['OOB 读写', '任意', '越界读写', '信息泄露或破坏'],
          ]}
        />
      </RefSection>

      {/* 2. 栈溢出 */}
      <RefSection num="02" title="栈溢出（Stack Overflow）">
        <P>
          局部缓冲区没有边界检查，超长输入一路向<B>高地址</B>覆盖，直到改写返回地址。
          这是最古老、也是最直观的一类漏洞。
        </P>
        <RefCode
          title="最小示例：strcpy 无界拷贝"
          badge="c"
          language="c"
          code={`void vuln(char *input) {
    char buf[64];            // 栈上 64 字节缓冲区
    strcpy(buf, input);      // 无边界检查：超长输入一路覆盖
}                            // 返回时 ret 跳到被覆写的地址

// 栈布局（向高地址方向）：
// buf[64] -> canary -> 保存的 rbp -> 返回地址
// 覆盖顺序也按此进行，先踩 canary 才能碰到返回地址`}
        />
        <P>
          <B>利用与检测</B>： fuzz 或用 <C>cyclic</C> 模式串打崩程序，
          从崩溃时 RIP 的值反推出返回地址相对缓冲区起点的偏移；
          有 Canary 时需先泄露或绕过金丝雀。调试器里看栈回溯可快速定位溢出点。
        </P>
      </RefSection>

      {/* 3. 堆溢出 */}
      <RefSection num="03" title="堆溢出（Heap Overflow）">
        <P>
          堆缓冲区溢出不会碰到返回地址，而是踩到<B>相邻 chunk 的元数据或相邻对象</B>，
          利用思路从"改返回地址"变成"骗过分配器"。
        </P>
        <RefCode
          title="最小示例：覆写相邻 chunk"
          badge="c"
          language="c"
          code={`char *p = malloc(64);
char *q = malloc(64);
strcpy(p, input);        // input 超 64 字节 -> 溢出到 q 的 chunk 头
// 覆写 q 的 size / fd 指针，或覆写相邻结构体的函数指针
free(q);                 // 分配器按被篡改的元数据操作 -> 任意写`}
        />
        <P>
          <B>利用与检测</B>：覆写 chunk 的 <C>size</C> 域可制造重叠 chunk（overlapping），
          覆写空闲 chunk 的 <C>fd</C> 指针可做 tcache poisoning 实现任意地址分配。
          ASan（<C>-fsanitize=address</C>）能在溢出发生的第一时间报出 redzone 越界。
        </P>
      </RefSection>

      {/* 4. UAF */}
      <RefSection num="04" title="释放后使用（Use-After-Free）">
        <P>
          指针在 <C>free</C> 后没有置空，之后仍被解引用 —— 此时它指向的内存可能已被
          <B>另一个对象</B>占用，同一块内存被按两种类型解读。
        </P>
        <RefCode
          title="最小示例：悬垂指针"
          badge="c"
          language="c"
          code={`struct obj { char name[32]; void (*func)(void); };

struct obj *p = malloc(sizeof(*p));
free(p);                 // 未置 NULL，p 成为悬垂指针

char *x = malloc(sizeof(*p));  // 新分配复用同一块内存
strcpy(x, attacker_data);      // 攻击者控制了这块内存的内容

p->func();               // 按旧类型调用"函数指针" -> 类型混淆`}
        />
        <P>
          <B>利用与检测</B>：关键在于<B>在 free 与 use 之间占坑</B>——用可控数据的新分配
          顶替原 chunk，把函数指针或虚表指针换成攻击者目标。
          ASan 的 quarantine 机制能在解引用悬垂指针时直接报 heap-use-after-free。
        </P>
      </RefSection>

      {/* 5. Double Free */}
      <RefSection num="05" title="双重释放（Double Free）">
        <P>
          同一块内存被释放两次，空闲链表里出现两个指向同一 chunk 的节点，
          于是<B>两次 malloc 返回同一地址</B>——等价于凭空造出一个 UAF。
        </P>
        <RefCode
          title="最小示例：连续两次 free"
          badge="c"
          language="c"
          code={`char *p = malloc(64);
free(p);
free(p);                 // 同一 chunk 进入两次空闲链

char *a = malloc(64);
char *b = malloc(64);    // a == b，两个指针共享同一块内存`}
        />
        <P>
          <B>利用与检测</B>：glibc 的 tcache 有 <C>double free 检查</C>（比较 key 字段），
          常见绕过是 free 后先置空另一个指针、或跨 bin 释放（先进 tcache 再进 fastbin）。
          glibc 2.26+ 会直接 abort 报 "double free or corruption"，崩溃信息本身就是检测信号。
        </P>
      </RefSection>

      {/* 6. 整数溢出 */}
      <RefSection num="06" title="整数溢出（Integer Overflow）">
        <P>
          整数漏洞本身不直接破坏内存，但它让<B>分配的尺寸</B>与<B>拷贝的尺寸</B>不一致，
          是堆 / 栈溢出的头号引线。
        </P>
        <RefCode
          title="最小示例：乘法回绕与符号性陷阱"
          badge="c"
          language="c"
          code={`int n = atoi(argv[1]);
char *p = malloc(n * 8);   // n 很大时乘法回绕成小正数 -> 分配过小
for (int i = 0; i < n; i++)
    p[i * 8] = 1;          // 按原始 n 写入 -> 堆溢出

int len = read_len();      // 返回 -1 表示错误
if (len > 256) return;     // len 为负：有符号比较放行
memcpy(buf, data, len);    // 转无符号后 len 变巨大 -> 溢出`}
        />
        <P>
          <B>利用与检测</B>：关注所有"用户可控整数参与乘法 / 加法后再分配"的位置，
          以及有符号与无符号混用的比较。
          UBSan（<C>-fsanitize=integer</C> / <C>signed-integer-overflow</C>）可在运行时捕获回绕。
        </P>
      </RefSection>

      {/* 7. 格式化字符串 */}
      <RefSection num="07" title="格式化字符串（Format String）">
        <P>
          把用户输入直接当作格式串传给 <C>printf</C>，用户就拿到了
          <B>读栈</B>（%x / %p）与<B>写内存</B>（%n）两个原语。
        </P>
        <RefCode
          title="最小示例：printf(buf) 陷阱"
          badge="c"
          language="c"
          code={`char buf[128];
fgets(buf, sizeof(buf), stdin);
printf(buf);             // 危险：buf 被当作格式串解析
// 输入 %p %p %p -> 泄露栈上数据（含 canary、返回地址）
// 输入 %n        -> 向栈上某个指针指向的地址写入"已输出字符数"

// 修复：printf("%s", buf);  或 puts(buf);`}
        />
        <P>
          <B>利用与检测</B>：先用一串 <C>%p</C> 探测参数位置，定位 canary 与返回地址；
          再用 <C>%hn</C> / <C>%hhn</C> 按字节写入，经典目标是 GOT 表项或 <C>__free_hook</C>。
          编译器 <C>-Wformat-security</C> 与 FORTIFY 的 <C>__printf_chk</C> 能拦下一部分裸用。
        </P>
      </RefSection>

      {/* 8. 竞态条件 */}
      <RefSection num="08" title="竞态条件（TOCTOU）">
        <P>
          <B>检查</B>与<B>使用</B>之间存在时间窗，攻击者在窗口内偷换目标，
          让程序对自己没权限的对象执行操作。
        </P>
        <RefCode
          title="最小示例：access 之后再 open"
          badge="c"
          language="c"
          code={`// setuid root 程序：检查用户能否读该文件
if (access(path, R_OK) == 0) {
    // 时间窗：攻击者此时把 path 换成指向 /etc/shadow 的符号链接
    int fd = open(path, O_RDONLY);   // 实际打开的是被替换后的目标
    send_to_user(fd);
}`}
        />
        <P>
          <B>利用与检测</B>：经典场景是 setuid 程序与 <C>/tmp</C> 下的临时文件，
          攻击者用循环不断重建符号链接提高命中概率。
          修复方向是原子操作：直接 <C>open</C> 后用 <C>fstat</C> 检查已打开的 fd，
          或使用 <C>O_NOFOLLOW</C>、<C>openat2(RESOLVE_NO_SYMLINKS)</C>。
        </P>
      </RefSection>

      {/* 9. 类型混淆与信息泄露 */}
      <RefSection num="09" title="类型混淆与信息泄露">
        <P>
          同一块内存被按<B>错误的类型</B>解读：C++ 里常由 UAF 或错误转换触发，
          虚表指针一旦被篡改，虚函数调用就成了任意跳转。
        </P>
        <RefCode
          title="最小示例：虚表劫持"
          badge="cpp"
          language="cpp"
          code={`class Base { public: virtual void run() { puts("base"); } };

Base *p = new Base;
delete p;                       // UAF：p 悬垂
char *x = new char[sizeof(Base)];
memcpy(x, fake_vtable, ...);    // 占坑并覆写虚表指针

p->run();                       // 查被篡改的虚表 -> 跳到攻击者代码`}
        />
        <P>
          <B>信息泄露</B>是另一半故事：未初始化的栈变量被打印、结构体 padding 被拷贝到用户态，
          都会泄出指针。最著名的案例是 Heartbleed —— OpenSSL 按用户声称的长度回读堆内存，
          一次 OOB read 泄出私钥。在利用链中，泄露负责破除 ASLR，价值不亚于任意写。
        </P>
      </RefSection>

      <RefCallout tone="red" title="漏洞从不单打独斗">
        <p>
          漏洞之间常组合使用 —— <B>信息泄露破 ASLR + UAF 得任意写 + 栈迁移拿控制流</B>，
          是现代利用的常态。练单点漏洞时，也要想清楚它能为你换来哪一级原语：
          读、写，还是控制流。
        </p>
      </RefCallout>

      <RefPager
        prev={{ slug: 'functions', title: '危险函数库' }}
        next={{ slug: 'protections', title: '防护与对抗' }}
      />
    </div>
  );
}
