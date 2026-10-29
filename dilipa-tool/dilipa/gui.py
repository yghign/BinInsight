"""Dilipa GUI — 用 tkinter 套一层，双击 dilipa.exe 就能跑。

核心流程:
  选 ELF 文件 → 调用 analyze/lift 内部函数 → 把结果渲染到表格 + 反汇编视图

不依赖 Kali、不依赖 WSL、不依赖 gcc —— 纯 Python + pyelftools + capstone。
"""
from __future__ import annotations
import json
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext, ttk

from . import __version__
from .cli import (
    parse_elf,
    disassemble,
    call_sites_to_dicts,
    _read_text_section,
    _make_pseudo_c,
    _suggest_fix,
    ElfInfo,
)
from .danger_funcs import safe_replace, cwe_of


APP_TITLE = f"Dilipa v{__version__} — ELF 二进制微补丁工具"


class DilipaApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1080x680")
        self.minsize(900, 560)

        self.current_elf_path: str | None = None
        self.current_info: ElfInfo | None = None
        self._build_ui()

    # ── UI 搭建 ──────────────────────────────────────────────
    def _build_ui(self) -> None:
        self._apply_theme()

        # 顶部工具条
        toolbar = ttk.Frame(self, padding=(12, 10))
        toolbar.pack(side="top", fill="x")

        ttk.Button(toolbar, text="📂 打开 ELF 文件", command=self._on_open).pack(side="left")
        self._path_var = tk.StringVar(value="(未选择文件)")
        ttk.Label(toolbar, textvariable=self._path_var, foreground="#666").pack(
            side="left", padx=(12, 0)
        )

        ttk.Separator(toolbar, orient="vertical").pack(side="left", fill="y", padx=14)

        self._btn_analyze = ttk.Button(
            toolbar, text="🔍 扫描危险函数", command=self._on_analyze, state="disabled"
        )
        self._btn_analyze.pack(side="left")
        self._btn_pseudo = ttk.Button(
            toolbar, text="📝 生成伪 C", command=self._on_pseudo_c, state="disabled"
        )
        self._btn_pseudo.pack(side="left", padx=(6, 0))
        self._btn_export = ttk.Button(
            toolbar, text="💾 导出 JSON", command=self._on_export, state="disabled"
        )
        self._btn_export.pack(side="left", padx=(6, 0))

        # 主区域: 左信息 + 中表格 + 右反汇编
        body = ttk.Frame(self)
        body.pack(side="top", fill="both", expand=True, padx=12, pady=(0, 6))

        # 左侧: 基本信息
        left = ttk.LabelFrame(body, text="二进制信息", padding=8)
        left.pack(side="left", fill="y")
        self._info_text = scrolledtext.ScrolledText(
            left, width=32, height=22, wrap="word", state="disabled",
            font=("Consolas", 10), background="#1e1e1e", foreground="#d4d4d4",
            borderwidth=0, highlightthickness=0,
        )
        self._info_text.pack(fill="both", expand=True)

        # 右侧: Notebook 表格 + 反汇编
        right = ttk.Frame(body)
        right.pack(side="left", fill="both", expand=True, padx=(10, 0))

        self._nb = ttk.Notebook(right)
        self._nb.pack(fill="both", expand=True)

        # Tab 1: 危险调用表格
        tab_call = ttk.Frame(self._nb, padding=6)
        self._nb.add(tab_call, text="危险调用")

        cols = ("addr", "func", "cwe", "safe_alt", "suggest")
        self._tree = ttk.Treeview(tab_call, columns=cols, show="headings", selectmode="browse")
        self._tree.heading("addr", text="地址")
        self._tree.heading("func", text="危险函数")
        self._tree.heading("cwe", text="CWE")
        self._tree.heading("safe_alt", text="安全替代")
        self._tree.heading("suggest", text="修复建议")
        self._tree.column("addr", width=90, anchor="center")
        self._tree.column("func", width=130, anchor="w")
        self._tree.column("cwe", width=90, anchor="center")
        self._tree.column("safe_alt", width=130, anchor="w")
        self._tree.column("suggest", width=280, anchor="w")

        vsb = ttk.Scrollbar(tab_call, orient="vertical", command=self._tree.yview)
        self._tree.configure(yscrollcommand=vsb.set)
        self._tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        # Tab 2: 反汇编视图
        tab_dis = ttk.Frame(self._nb, padding=6)
        self._nb.add(tab_dis, text="反汇编")
        self._disasm_text = scrolledtext.ScrolledText(
            tab_dis, wrap="none", state="disabled",
            font=("Consolas", 10), background="#0d1117", foreground="#c9d1d9",
            borderwidth=0, highlightthickness=0,
        )
        self._disasm_text.pack(fill="both", expand=True)
        # 语法标记
        self._disasm_text.tag_configure("addr", foreground="#79c0ff")
        self._disasm_text.tag_configure("call", foreground="#ff7b72")
        self._disasm_text.tag_configure("danger", background="#3a1f1f")
        self._disasm_text.tag_configure("plt", foreground="#d2a8ff")

        # Tab 3: 伪 C 视图
        tab_c = ttk.Frame(self._nb, padding=6)
        self._nb.add(tab_c, text="伪 C")
        self._pseudo_text = scrolledtext.ScrolledText(
            tab_c, wrap="word", state="disabled",
            font=("Consolas", 11), background="#161b22", foreground="#e6edf3",
            borderwidth=0, highlightthickness=0,
        )
        self._pseudo_text.pack(fill="both", expand=True)
        self._pseudo_text.tag_configure("danger", foreground="#ff7b72")
        self._pseudo_text.tag_configure("comment", foreground="#8b949e")

        # 底部状态栏
        self._status_var = tk.StringVar(value="就绪 — 选择一个 ELF 文件开始分析")
        ttk.Label(self, textvariable=self._status_var, anchor="w", padding=(12, 4),
                  foreground="#888").pack(side="bottom", fill="x")

    def _apply_theme(self) -> None:
        """Clam 主题 + 深色 accent。"""
        try:
            self.tk.call("tk", "scaling", 1.2)
        except tk.TclError:
            pass
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("Treeview", font=("Segoe UI", 10), rowheight=24)
        style.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"))

    # ── 事件处理 ──────────────────────────────────────────────
    def _on_open(self) -> None:
        path = filedialog.askopenfilename(
            title="选择 ELF 二进制",
            filetypes=[("ELF 文件", "*.elf *.so *.out"), ("可执行文件", "*.*")],
        )
        if not path:
            return
        self.current_elf_path = path
        self._path_var.set(path)
        self._btn_analyze.config(state="normal")
        self._btn_pseudo.config(state="normal")
        self._btn_export.config(state="normal")
        self._status_var.set(f"已加载 {Path(path).name}  —  点击「扫描危险函数」开始")
        self._reset_panels()

    def _on_analyze(self) -> None:
        if not self.current_elf_path:
            return
        self._status_var.set("正在分析…")
        self.update_idletasks()
        threading.Thread(target=self._run_analyze, daemon=True).start()

    def _run_analyze(self) -> None:
        try:
            info = parse_elf(self.current_elf_path)
        except Exception as e:
            self.after(0, lambda: messagebox.showerror("解析失败", str(e)))
            self.after(0, lambda: self._status_var.set(f"解析失败: {e}"))
            return

        if info.text_offset is None:
            self.after(0, lambda: messagebox.showwarning(
                "无 .text 段", f"{Path(self.current_elf_path).name} 不含 .text 段, 无法反汇编"
            ))
            return

        try:
            code = _read_text_section(self.current_elf_path, info)
            result = disassemble(code, info.text_vaddr or 0, info.arch, info.bits)
        except Exception as e:
            self.after(0, lambda: messagebox.showerror("反汇编失败", str(e)))
            return

        self.current_info = info
        self._last_result = result
        self._last_calls = call_sites_to_dicts(result.call_sites)

        # 回主线程刷新 UI
        self.after(0, self._render_info, info)
        self.after(0, self._render_calls, result.call_sites)
        self.after(0, self._render_disasm, result.instructions, result.call_sites)
        dangerous = [c for c in self._last_calls if c["is_dangerous"]]
        self.after(0, lambda: self._status_var.set(
            f"✓ 指令 {len(result.instructions)} 条 · Call {len(result.call_sites)} 处 · 危险 {len(dangerous)} 处"
        ))

    def _on_pseudo_c(self) -> None:
        if not self.current_info or not hasattr(self, "_last_result"):
            messagebox.showinfo("提示", "请先点击「扫描危险函数」")
            return
        pseudo = _make_pseudo_c(self._last_result.call_sites, self.current_info)
        self._render_pseudo(pseudo)
        self._nb.select(2)  # 切到伪 C tab

    def _on_export(self) -> None:
        if not self.current_info or not hasattr(self, "_last_result"):
            messagebox.showinfo("提示", "请先扫描")
            return
        path = filedialog.asksaveasfilename(
            title="导出 dilipa-report.json",
            defaultextension=".json",
            initialfile="dilipa-report.json",
            filetypes=[("JSON", "*.json")],
        )
        if not path:
            return

        from .cli import _header
        report = _header(self.current_info)
        report["calls"] = self._last_calls
        report["dangerous"] = [c for c in self._last_calls if c["is_dangerous"]]
        report["instruction_count"] = len(self._last_result.instructions)

        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            messagebox.showinfo("导出成功", f"已保存到 {path}")
        except Exception as e:
            messagebox.showerror("导出失败", str(e))

    # ── 渲染 ──────────────────────────────────────────────────
    def _reset_panels(self) -> None:
        for item in self._tree.get_children():
            self._tree.delete(item)
        self._info_text.config(state="normal"); self._info_text.delete("1.0", "end"); self._info_text.config(state="disabled")
        self._disasm_text.config(state="normal"); self._disasm_text.delete("1.0", "end"); self._disasm_text.config(state="disabled")
        self._pseudo_text.config(state="normal"); self._pseudo_text.delete("1.0", "end"); self._pseudo_text.config(state="disabled")

    def _render_info(self, info: ElfInfo) -> None:
        self._info_text.config(state="normal")
        self._info_text.delete("1.0", "end")
        parts = [
            f"文件: {Path(info.path).name}",
            f"",
            f"架构:      {info.arch}",
            f"位数:      {info.bits}-bit",
            f"字节序:    {info.endian}",
            f"类型:      {info.e_type}",
            f"入口点:    {info.entry}",
            f"",
            f".text 段:",
            f"  偏移:    {info.text_offset}",
            f"  虚拟地址:{info.text_vaddr}",
            f"  大小:    {info.text_size} bytes",
            f"",
            f"段列表 ({len(info.sections)}):",
        ]
        for s in info.sections:
            parts.append(f"  · {s}")
        self._info_text.insert("end", "\n".join(parts))
        self._info_text.config(state="disabled")

    def _render_calls(self, call_sites) -> None:
        for item in self._tree.get_children():
            self._tree.delete(item)
        for cs in call_sites:
            if not cs.is_dangerous:
                continue  # 表格只显示危险的
            fix_hint = _suggest_fix(cs.target_func, cs.safe_alt) if cs.safe_alt else ""
            self._tree.insert("", "end", values=(
                hex(cs.address),
                cs.target_func,
                cs.cwe or "",
                cs.safe_alt or "",
                fix_hint,
            ))

    def _render_disasm(self, instructions, call_sites) -> None:
        # 建立 call 地址 → call_site 映射
        danger_addrs = {cs.address for cs in call_sites if cs.is_dangerous}
        plt_map: dict[int, str] = {}
        for cs in call_sites:
            plt_map[cs.address] = cs.target_plt

        self._disasm_text.config(state="normal")
        self._disasm_text.delete("1.0", "end")

        for ins in instructions:
            addr_hex = ins["addr"]
            addr_int = int(addr_hex, 16)
            line = f"{addr_hex}  {ins['mnemonic']:<7} {ins['op_str']}\n"

            # 用不同 tag 标记
            if ins["mnemonic"] == "call" and addr_int in danger_addrs:
                self._disasm_text.insert("end", line, ("danger", "call"))
            elif ins["mnemonic"] == "call":
                tag = ("plt",) if addr_int in plt_map else ()
                self._disasm_text.insert("end", line, tag + ("call",))
            else:
                self._disasm_text.insert("end", line)

        self._disasm_text.config(state="disabled")

    def _render_pseudo(self, pseudo_c: str) -> None:
        self._pseudo_text.config(state="normal")
        self._pseudo_text.delete("1.0", "end")

        for raw in pseudo_c.split("\n"):
            line = raw + "\n"
            if raw.lstrip().startswith("//"):
                self._pseudo_text.insert("end", line, "comment")
            elif "[危险]" in raw:
                self._pseudo_text.insert("end", line, "danger")
            else:
                self._pseudo_text.insert("end", line)

        self._pseudo_text.config(state="disabled")


def run_gui() -> None:
    app = DilipaApp()
    app.mainloop()


if __name__ == "__main__":
    run_gui()
