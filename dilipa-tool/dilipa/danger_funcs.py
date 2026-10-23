"""危险函数名单 + 安全替代方案.

来源: CWE-120 (Buffer Copy without Checking Size of Input)
     CWE-242 (Use of Function with Inherent Risk)
"""

# (危险函数, 安全替代, CWE)
DANGER_FUNCS = [
    ("gets",        "fgets",       "CWE-242"),
    ("strcpy",      "strncpy",     "CWE-120"),
    ("strcat",      "strncat",     "CWE-120"),
    ("sprintf",     "snprintf",    "CWE-120"),
    ("vsprintf",    "vsnprintf",   "CWE-120"),
    ("scanf",       "scanf_s",     "CWE-242"),       # 需 MS CRT; 或限制宽度
    ("system",      "execvp",      "CWE-78"),        # 命令注入
    ("popen",       "pipe+execvp", "CWE-78"),
    ("atoi",        "strtol",      "CWE-190"),       # 溢出
    ("atol",        "strtol",      "CWE-190"),
]

DANGER_NAMES = {name for name, _, _ in DANGER_FUNCS}

def safe_replace(name: str) -> str | None:
    """返回危险函数的安全替代, 没记录则返回 None."""
    for danger, safe, _ in DANGER_FUNCS:
        if name == danger:
            return safe
    return None

def cwe_of(name: str) -> str | None:
    for danger, _, cwe in DANGER_FUNCS:
        if name == danger:
            return cwe
    return None
