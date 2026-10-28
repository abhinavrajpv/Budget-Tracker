@echo off
title Zenith To-Do - Public Internet Link (No Signup)
cd /d "%~dp0"
echo ==========================================================
echo Starting Local Server in the background...
echo ==========================================================
start "" node server.js
timeout /t 2 /nobreak >nul
echo.
echo Connecting to public tunnel (ZERO signup, ZERO account)...
echo This will generate a public https:// link for your phone!
echo.
npx --yes localtunnel --port 8000
pause
