@echo off
chcp 65001 >nul
REM Lance le scraper Facebook localement (via Windows Task Scheduler ou double-clic).
REM Affiche la progression en direct sur la console ET sauvegarde dans backend/scripts/logs/

cd /d "%~dp0..\.."
if not exist "backend\scripts\logs" mkdir "backend\scripts\logs"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ts = Get-Date -Format 'yyyyMMdd-HHmmss'; $log = Join-Path 'backend\scripts\logs' ('fb-scraper-' + $ts + '.log'); & '%~dp0lancer-scraper-facebook.ps1' 2>&1 | Tee-Object -FilePath $log"

echo.
echo ========================================================
pause
