# AGENT 8 — démarre une copie INTACTE du commit HEAD (4c02372, avant correctifs) sur le port 4101,
# contre la même base locale isolée nopalou_audit, pour comparer avant/après (reproduction réelle de l'anomalie initiale).
# Aucune modification du code du projet : la copie est extraite par `git archive` dans scripts/audit/.local/baseline-head (ignoré par git).
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
. (Join-Path $root 'scripts\audit\audit-env.ps1')
$env:PORT = '4101'
$env:BACKEND_URL = 'http://localhost:4101'
$log = Join-Path $root 'scripts\audit\.local'
Set-Location (Join-Path $root 'scripts\audit\.local\baseline-head')
$b = Start-Process node -ArgumentList 'backend\app.js' -PassThru -WindowStyle Hidden -RedirectStandardOutput "$log\baseline.out.log" -RedirectStandardError "$log\baseline.err.log"
Set-Content "$log\baseline.pid" $b.Id
Start-Sleep 15
try { 'baseline HEAD backend : ' + (Invoke-WebRequest http://localhost:4101/api/health -UseBasicParsing -TimeoutSec 30).StatusCode } catch { 'baseline : KO ' + $_.Exception.Message }
