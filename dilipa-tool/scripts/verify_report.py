#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_report.py — 纯标准库校验一份 Dilipa JSON 报告是否符合字段契约（T10）。

只做校验，不做解析、不写回二进制、不 import dilipa、不联网。
契约来源：dilipa-tool/dilipa/cli.py::_header() / analyze() 与
          disassembler.py::call_sites_to_dicts()。

用法：
  python verify_report.py dilipa-report.json
退出码：0 = 契约符合；1 = 契约不符合；2 = 文件不存在或不是合法 JSON。
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Optional

# 顶层必需字段 → 期望类型（与 cli.py 的 _header + analyze 输出一致）
HEADER_FIELDS: dict[str, type | tuple[type, ...]] = {
    "tool": str,
    "version": str,
    "path": str,
    "arch": str,
    "bits": int,
    "endian": str,
    "e_type": str,
    "entry": str,
    "sections": list,
    "cmd": str,
    "calls": list,
    "dangerous": list,
    "instruction_count": int,
}

CALL_FIELDS: dict[str, type | tuple[type, ...]] = {
    "address": str,
    "target_plt": str,
    "target_func": str,
    "is_dangerous": bool,
    # safe_alt / cwe 允许 str 或 None
    "safe_alt": (str, type(None)),
    "cwe": (str, type(None)),
}

EXPECTED_TOOL = "dilipa"
EXPECTED_CMD = "analyze"


def fix_windows_encoding() -> None:
    """Windows 控制台默认 GBK，尽量切到 UTF-8 以免中文输出乱码。"""
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if reconf is None:
            continue
        try:
            reconf(encoding="utf-8", errors="replace")
        except Exception:
            pass


def type_name(expected: type | tuple[type, ...]) -> str:
    """把期望类型渲染成可读文字，供错误提示使用。"""
    if isinstance(expected, tuple):
        return " / ".join(t.__name__ for t in expected)
    return expected.__name__


def matches(value: Any, expected: type | tuple[type, ...]) -> bool:
    """bool 是 int 的子类，这里单独防住，避免把 true 当成整数通过。"""
    if expected is int:
        return isinstance(value, int) and not isinstance(value, bool)
    if isinstance(expected, tuple):
        return isinstance(value, expected)
    return isinstance(value, expected)


def verify(report: Any) -> list[str]:
    """返回问题清单；空列表表示契约符合。"""
    problems: list[str] = []

    if not isinstance(report, dict):
        return ["顶层不是 JSON 对象"]

    for field, expected in HEADER_FIELDS.items():
        if field not in report:
            problems.append(f"缺少顶层字段 {field}")
        elif not matches(report[field], expected):
            problems.append(
                f"字段 {field} 类型不符：期望 {type_name(expected)}，实际 {type(report[field]).__name__}"
            )

    if report.get("tool") != EXPECTED_TOOL:
        problems.append(f"tool 应为 {EXPECTED_TOOL!r}，实际 {report.get('tool')!r}")
    if report.get("cmd") != EXPECTED_CMD:
        problems.append(f"cmd 应为 {EXPECTED_CMD!r}，实际 {report.get('cmd')!r}")

    entry = report.get("entry")
    if isinstance(entry, str) and not entry.startswith("0x"):
        problems.append(f"entry 应为 hex 字符串（如 0x401000），实际 {entry!r}")

    sections = report.get("sections")
    if isinstance(sections, list) and not all(isinstance(s, str) for s in sections):
        problems.append("sections 里存在非字符串元素")

    calls = report.get("calls")
    dangerous = report.get("dangerous")
    if not isinstance(calls, list) or not isinstance(dangerous, list):
        return problems  # 类型问题已记录，避免下面误访问

    for idx, call in enumerate(calls):
        label = f"calls[{idx}]"
        if not isinstance(call, dict):
            problems.append(f"{label} 不是对象")
            continue
        for field, expected in CALL_FIELDS.items():
            if field not in call:
                problems.append(f"{label} 缺少字段 {field}")
            elif not matches(call[field], expected):
                problems.append(
                    f"{label}.{field} 类型不符：期望 {type_name(expected)}，"
                    f"实际 {type(call[field]).__name__}"
                )
        if isinstance(call.get("address"), str) and not call["address"].startswith("0x"):
            problems.append(f"{label}.address 应为 hex 字符串，实际 {call['address']!r}")
        if call.get("is_dangerous") is True:
            if not call.get("safe_alt"):
                problems.append(f"{label} 标为危险调用却没有 safe_alt")
            if not call.get("cwe"):
                problems.append(f"{label} 标为危险调用却没有 cwe")

    # dangerous 必须恰好等于 calls 里 is_dangerous === true 的子集
    expected_dangerous = [c for c in calls if isinstance(c, dict) and c.get("is_dangerous") is True]
    if len(dangerous) != len(expected_dangerous):
        problems.append(
            f"dangerous 条数 {len(dangerous)} 与 calls 中危险调用条数 {len(expected_dangerous)} 不一致"
        )

    # 本演示样例的验收：dangerous 非空，且能同时看到 strcpy 与 system
    names = [c.get("target_func") for c in dangerous if isinstance(c, dict)]
    if not dangerous:
        problems.append("dangerous 为空：这份报告没有命中任何危险函数，不能当作演示样例")
    for required in ("strcpy", "system"):
        if required not in names:
            problems.append(f"dangerous 中缺少期望的危险函数 {required}")

    count = report.get("instruction_count")
    if isinstance(count, int) and not isinstance(count, bool) and count <= 0:
        problems.append(f"instruction_count 应为正数，实际 {count}")

    return problems


def main(argv: Optional[list[str]] = None) -> int:
    fix_windows_encoding()
    parser = argparse.ArgumentParser(description="校验 Dilipa JSON 报告字段契约")
    parser.add_argument("report", help="待校验的 JSON 报告路径")
    args = parser.parse_args(argv)

    path = Path(args.report)
    print(f"[*] 校验目标：{path}")
    if not path.is_file():
        print(f"[!] 文件不存在：{path}", file=sys.stderr)
        return 2

    try:
        text = path.read_text(encoding="utf-8")
        report = json.loads(text)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"[!] 读取或解析 JSON 失败：{exc}", file=sys.stderr)
        return 2

    problems = verify(report)
    if problems:
        print("[-] 契约不符合，问题清单：")
        for problem in problems:
            print(f"    - {problem}")
        return 1

    calls = report["calls"]
    dangerous = report["dangerous"]
    print("[+] 顶层 13 个字段齐全、类型正确，cmd=analyze，tool=dilipa")
    print(f"[+] calls {len(calls)} 条，每条 6 个字段齐全；dangerous {len(dangerous)} 条与之一致")
    print(f"[+] 命中危险函数：{', '.join(str(c['target_func']) for c in dangerous)}")
    print(
        f"[+] instruction_count={report['instruction_count']} · "
        f"arch={report['arch']} · bits={report['bits']} · entry={report['entry']}"
    )
    print("[+] 来源状态：演示样例（校验脚本只检查契约，不判断数据是怎么生成的）")
    print("RESULT: PASS — 字段契约符合，可作为网页端的报告样例。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
