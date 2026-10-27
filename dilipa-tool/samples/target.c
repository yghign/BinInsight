#include <stdio.h>
#include <string.h>

/* ── 漏洞测试程序 (Kali / Ubuntu / 任何 glibc 都能编译) ──
   CWE-120: strcpy 无长度检查
   CWE-242: scanf 字段宽度未限制
   说明: gets() 在 glibc 2.34+ 已彻底移除头文件和符号,
         改用 scanf("%[^\n]", buf) — 语义等价, 同样 CWE-242. */

void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);          /* 危险 CWE-120, 应换 strncpy */
    printf("Input: %s\n", buffer);
}

int parse_cmd(void) {
    char cmd[128];
    scanf("%[^\n]", cmd);           /* 危险 CWE-242, 字段宽度未限制 */
    if (strncmp(cmd, "SYSTEM", 6) == 0) {
        return 1;
    }
    return 0;
}

int main(void) {
    char user_input[256];
    scanf("%[^\n]", user_input);    /* 危险 CWE-242 */
    process_input(user_input);
    parse_cmd();
    return 0;
}
