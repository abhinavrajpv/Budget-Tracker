@echo off
title Zenith To-Do - Phone Server (No Signup)
cd /d "%~dp0"
echo ===================================================
echo Starting Zenith Tasks Server (No Signup / No Plans)...
echo ===================================================
node server.js
if %errorlevel% neq 0 (
  echo Node failed, attempting Python fallback...
  python -m http.server 8000
)
pause
