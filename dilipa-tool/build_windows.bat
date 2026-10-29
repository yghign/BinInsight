@echo off
REM Dilipa Windows 打包脚本
REM 产出: dist\dilipa.exe  — 双击就是 GUI, 带参数就是 CLI
REM 用法: 在 dilipa-tool\ 目录下执行, 或直接双击 .\build_windows.bat

echo [*] 检查依赖...
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt -q
python -m pip install pyinstaller -q

echo.
echo [*] 开始打包 dilipa.exe (onefile, GUI + CLI 混合)...
pyinstaller --noconfirm --onefile --windowed --name dilipa ^
    dilipa/__main__.py ^
    --collect-all capstone ^
    --collect-all elftools ^
    --collect-all pyelftools ^
    --hidden-import dilipa ^
    --hidden-import dilipa.gui ^
    --hidden-import dilipa.cli ^
    --hidden-import dilipa.elf_parser ^
    --hidden-import dilipa.disassembler ^
    --hidden-import dilipa.danger_funcs ^
    --distpath dist ^
    --workpath build ^
    --specpath .

echo.
if exist dist\dilipa.exe (
    for %%A in ("dist\dilipa.exe") do echo [✓] 打包完成: dist\dilipa.exe  (%%~zA bytes)
    echo.
    echo   双击 dist\dilipa.exe  → 启动 GUI 窗口
    echo   dist\dilipa.exe --cli analyze target.elf  → CLI 模式
) else (
    echo [x] 打包失败, 查看上面的错误信息
)

pause
