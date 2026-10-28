@echo off
title Deploy to GitHub Pages (Free 24/7 Hosting)
cd /d "%~dp0"
echo ========================================================
echo       DEPLOY TO GITHUB PAGES (FREE FOREVER)
echo ========================================================
echo.
git init
git add .
git commit -m "Deploy Zenith Tasks"
git branch -M main
echo.
echo Please create a new empty repository on https://github.com/new
set /p REPO_URL="Paste your GitHub repository link here: "
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git push -u origin main
echo.
echo ========================================================
echo Code pushed! Now:
echo 1. Go to your repo Settings -^> Pages
echo 2. Select 'main' branch and click Save
echo 3. GitHub gives you a permanent 24/7 link for your phone!
echo ========================================================
pause
