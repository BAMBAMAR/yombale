@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: Définition du répertoire du projet
set "PROJECT_DIR=%~dp0.."
cd /d "%PROJECT_DIR%"

:: Création du dossier logs si absent
if not exist "logs" mkdir "logs"
set "LOG_FILE=%PROJECT_DIR%\logs\scraper-task.log"

echo =================================================== >> "%LOG_FILE%"
echo [!DATE! !TIME!] Lancement de la tâche de scraping >> "%LOG_FILE%"

:: Recherche de l'exécutable Node.js
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
        echo [!DATE! !TIME!] ERREUR: Node.js introuvable. Installez Node.js ou ajoutez-le au PATH. >> "%LOG_FILE%"
        exit /b 1
    )
)

:: Arguments passés ou par défaut --facebook
set "ARGS=%*"
if "%ARGS%"=="" set "ARGS=--facebook"

echo [!DATE! !TIME!] Execution: "%NODE_CMD%" scripts/sync-immo-local.js %ARGS% >> "%LOG_FILE%"
echo ========================================================
echo   LANCEMENT DU SCRAPING LOCAL NOPALOU
echo   Logs enregistres dans : logs\scraper-task.log
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { & '%NODE_CMD%' scripts\sync-immo-local.js %ARGS% } 2>&1 | Tee-Object -FilePath '%LOG_FILE%' -Append"
set "EXIT_CODE=%errorlevel%"

echo [!DATE! !TIME!] Fin de la tâche avec code de sortie: %EXIT_CODE% >> "%LOG_FILE%"
echo =================================================== >> "%LOG_FILE%"

echo.
echo ========================================================
echo Scraping termine (Code de sortie: %EXIT_CODE%).
echo ========================================================
pause

exit /b %EXIT_CODE%
