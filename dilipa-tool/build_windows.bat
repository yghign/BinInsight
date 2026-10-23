@echo off
REM Dilipa 打包脚本 — 生成 Windows exe
REM 用法: 双击运行, 或在 dilipa-tool\ 目录下执行 .\build_windows.bat

echo [*] 安装依赖...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install pyinstaller

echo.
echo [*] 打包 dilipa.exe ...
pyinstaller --onefile --name dilipa dilipa/__main__.py ^
    --collect-all capstone ^
    --collect-all elftools ^
    --hidden-import dilipa ^
    --hidden-import dilipa.cli ^
    --hidden-import dilipa.elf_parser ^
    --hidden-import dilipa.disassembler ^
    --hidden-import dilipa.danger_funcs ^
    --distpath dist ^
    --workpath build ^
    --specpath .

echo.
if exist dist\dilipa.exe (
    echo [✓] 打包完成: dist\dilipa.exe
    echo     测试: dist\dilipa.exe --help
) else (
    echo [x] 打包失败, 查看上面的错误信息
)

pause
