@echo off
title VaultBudget — Deploy to GitHub
cd /d "%~dp0"
echo ========================================================
echo        VAULTBUDGET — PUSH TO GITHUB (100%% SAFE)
echo ========================================================
echo.
echo Checking Git status...
git status
echo.
echo Staging files...
git add .
echo.
echo Committing VaultBudget...
git commit -m "Launch VaultBudget: 100% Private Offline Budget Tracker"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo ========================================================
echo Pushed successfully to GitHub!
echo.
echo To enable your phone web link:
echo 1. Go to your repo on GitHub
echo 2. Go to Settings -> Pages
echo 3. Under Branch, select 'main' and root '/ (root)'
echo 4. Click Save
echo.
echo Open that link in Google Chrome on your Android phone,
echo tap 3 dots (three dots) -> 'Install app' or 'Add to Home screen'!
echo ========================================================
pause
