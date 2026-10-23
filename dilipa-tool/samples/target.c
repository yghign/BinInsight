#include <stdio.h>
#include <string.h>

/* 故意写得漏洞百出, 用于 Dilipa 测试 */

void process_input(char *input) {
    char buffer[64];
    strcpy(buffer, input);    /* 危险 CWE-120 */
    printf("Input: %s\n", buffer);
}

int parse_cmd() {
    char cmd[128];
    gets(cmd);                 /* 危险 CWE-242 */
    if (strncmp(cmd, "SYSTEM", 6) == 0) {
        return 1;
    }
    return 0;
}

int main() {
    char user_input[256];
    gets(user_input);          /* 危险 CWE-242 */
    process_input(user_input);
    parse_cmd();
    return 0;
}
