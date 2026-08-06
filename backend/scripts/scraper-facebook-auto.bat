@echo off
chcp 65001 >nul
REM Lance le scraper Facebook localement (via Windows Task Scheduler ou double-clic).
REM Affiche la progression en direct sur la console ET sauvegarde dans backend/scripts/logs/

cd /d "%~dp0..\.."
if not exist "backend\scripts\logs" mkdir "backend\scripts\logs"

set LOGFILE=backend\scripts\logs\fb-scraper-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%.log
set LOGFILE=%LOGFILE: =0%

powershell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0lancer-scraper-facebook.ps1' | Tee-Object -FilePath '%LOGFILE%'"
