@echo off
setlocal enabledelayedexpansion
title Connexion Facebook - Nopalou

set "PROJECT_DIR=%~dp0.."
cd /d "%PROJECT_DIR%"

:: Verification du chemin de Node.js
set "NODE_CMD=node"
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files (x86)\nodejs\node.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "NODE_CMD=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    ) else (
        echo [ERREUR] Node.js est introuvable sur le systeme.
        pause
        exit /b 1
    )
)

echo ========================================================
echo   LANCEMENT DE LA SESSION FACEBOOK (SCRAPING LOCAL)
echo ========================================================
echo.
echo Une fenetre de navigateur Chromium va s'ouvrir.
echo Veuillez vous connecter a votre compte Facebook.
echo.

"%NODE_CMD%" scripts\fb-login-setup.js

echo.
echo ========================================================
pause
