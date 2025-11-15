@echo off
chcp 65001 >nul
echo ========================================
echo     💰 智能记账系统 - 本地服务器
echo ========================================
echo.
echo 正在启动本地服务器...
echo.
echo 启动成功！请在浏览器中访问：
echo.
echo    http://localhost:8000
echo.
echo 按 Ctrl+C 可停止服务器
echo ========================================
echo.

python -m http.server 8000
