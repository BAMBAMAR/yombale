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

:: Détection du mode planifié (pas de pause interactive)
set "IS_SCHEDULED=0"
echo %* | findstr /i /c:"--scheduled" >nul
if %errorlevel% equ 0 set "IS_SCHEDULED=1"

:: Nettoyage de l'argument --scheduled pour Node
set "NODE_ARGS=%*"
set "NODE_ARGS=%NODE_ARGS:--scheduled=%"
set "NODE_ARGS=%NODE_ARGS:  = %"

:: AUD-177 : le code de sortie de Node est propage (sans '; exit $LASTEXITCODE' le pipeline Tee-Object le remplaçait par 0)
:: Script cible selon les options
set "TARGET_SCRIPT=scripts\run-collecte-v2.js"

echo %NODE_ARGS% | findstr /i /c:"--facebook" >nul
if %errorlevel% equ 0 (
    set "TARGET_SCRIPT=scripts\sync-immo-local.js"
    set "NODE_ARGS=--facebook"
)

echo %NODE_ARGS% | findstr /i /c:"--coinafrique" >nul
if %errorlevel% equ 0 (
    set "TARGET_SCRIPT=scripts\sync-immo-local.js"
    set "NODE_ARGS=--coinafrique"
)

echo %NODE_ARGS% | findstr /i /c:"--expat" >nul
if %errorlevel% equ 0 (
    set "TARGET_SCRIPT=scripts\sync-immo-local.js"
    set "NODE_ARGS="
)

echo %NODE_ARGS% | findstr /i /c:"--omnisource" >nul
if %errorlevel% equ 0 (
    set "TARGET_SCRIPT=scripts\collecte-omnisource.js"
    set "NODE_ARGS=%NODE_ARGS:--omnisource=%"
)

echo %NODE_ARGS% | findstr /i /c:"--full" >nul
if %errorlevel% equ 0 (
    set "TARGET_SCRIPT=scripts\run-full-combo.js"
    set "NODE_ARGS="
)

echo %NODE_ARGS% | findstr /i /c:"--v2" >nul
if %errorlevel% equ 0 (
    set "TARGET_SCRIPT=scripts\run-collecte-v2.js"
    set "NODE_ARGS="
)

echo [!DATE! !TIME!] Lancement tâche: %TARGET_SCRIPT% %NODE_ARGS% >> "%LOG_FILE%"
echo ========================================================
echo   LANCEMENT DE LA TÂCHE DE SCRAPING NOPALOU
echo   Logs enregistrés dans : logs\scraper-task.log
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { & '%NODE_CMD%' %TARGET_SCRIPT% %NODE_ARGS% } 2>&1 | Tee-Object -FilePath '%LOG_FILE%' -Append; exit $LASTEXITCODE"
set "EXIT_CODE=%errorlevel%"

echo [!DATE! !TIME!] Fin de la tâche avec code de sortie: %EXIT_CODE% >> "%LOG_FILE%"
echo =================================================== >> "%LOG_FILE%"

echo.
echo ========================================================
echo Scraping terminé (Code de sortie: %EXIT_CODE%).
echo ========================================================

if "%IS_SCHEDULED%"=="0" (
    echo Appuyez sur une touche pour fermer cette fenêtre...
    timeout /t 10 >nul 2>nul || pause
)

exit /b %EXIT_CODE%
