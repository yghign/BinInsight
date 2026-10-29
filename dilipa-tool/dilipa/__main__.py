"""入口: python -m dilipa

行为:
  python -m dilipa             → 启动 GUI (tkinter 窗口)
  python -m dilipa --cli ...   → 走命令行版 (analyze/lift/patch)
  python -m dilipa --help      → CLI help
  python -m dilipa --gui       → 显式启动 GUI
"""
import sys


def _gui_launched():
    from .gui import run_gui
    run_gui()


if __name__ == "__main__":
    args = sys.argv[1:]

    # 纯 GUI 场景 — dilipa.exe 双击 / python -m dilipa
    if not args:
        _gui_launched()
        sys.exit(0)

    if args[0] == "--gui":
        _gui_launched()
        sys.exit(0)

    # CLI 场景
    from .cli import main
    main()
