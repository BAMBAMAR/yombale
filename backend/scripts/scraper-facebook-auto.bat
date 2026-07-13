@echo off
REM Lance le scraper Facebook automatiquement (via Windows Task Scheduler).
REM Ecrit un log horodate dans backend/scripts/logs/ a chaque execution, pour
REM pouvoir verifier apres coup que la tache planifiee a bien tourne.

cd /d "%~dp0..\.."
if not exist "backend\scripts\logs" mkdir "backend\scripts\logs"

set LOGFILE=backend\scripts\logs\fb-scraper-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%.log
set LOGFILE=%LOGFILE: =0%

powershell -NoProfile -ExecutionPolicy Bypass -File "backend\scripts\notifier-scraper-fb.ps1" -Message "Scraping demarre..."

node backend\scripts\scraper-facebook-local.js >> "%LOGFILE%" 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -File "backend\scripts\notifier-scraper-fb.ps1" -ResumeFile "backend\.fb-scraper-resume.txt"
