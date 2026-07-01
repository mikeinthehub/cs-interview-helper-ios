@echo off
chcp 65001 >nul
title CS 技术面试助手 - iOS 预览版

cd /d "%~dp0"

echo =============================================
echo   CS 技术面试助手 - iOS 版本
echo   iPhone 14 Pro Max 适配
echo =============================================
echo.

REM Build frontend if needed
if not exist "backend\static\index.html" (
    echo [1/2] Building frontend...
    cd frontend
    call npm install
    call npm run build
    cd ..
) else (
    echo [1/2] Frontend already built.
)

echo [2/2] Starting server...
echo.
echo ┌─────────────────────────────────────────┐
echo │  PC 预览:  http://127.0.0.1:8000       │
echo │                                            │
echo │  推荐使用 Chrome 并切换到 iPhone 14    │
echo │  Pro Max 设备模式查看效果:              │
echo │  F12 → 设备工具栏 → iPhone 14 Pro Max │
echo │                                            │
echo │  手机预览:  http://你的电脑IP:8000       │
echo │  手机 Safari 打开后可"添加到主屏幕"    │
echo └─────────────────────────────────────────┘
echo.
echo 按 Ctrl+C 停止服务

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001

pause
