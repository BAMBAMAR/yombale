# Démarre la pile d'audit isolée : backend :4100 (et frontend :3001 avec -Frontend). PostgreSQL local (service postgresql-x64-16, port 54329) doit tourner.
# Usage : powershell -File scripts\audit\start-stack.ps1 [-Frontend] [-Db nopalou_audit|nopalou_audit_data]
param([switch]$Frontend, [string]$Db = 'nopalou_audit')
$kit = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $kit '..\..')
. (Join-Path $kit 'audit-env.ps1')
$env:DATABASE_URL = $env:DATABASE_URL -replace '/nopalou_audit$', "/$Db"
if ((Get-Service postgresql-x64-16).Status -ne 'Running') { Start-Service postgresql-x64-16 }
$log = Join-Path $kit '.local'
Set-Location $root
$b = Start-Process node -ArgumentList 'backend\app.js' -PassThru -WindowStyle Hidden -RedirectStandardOutput "$log\backend.out.log" -RedirectStandardError "$log\backend.err.log"
Set-Content "$log\backend.pid" $b.Id
if ($Frontend) {
  $env:BACKEND_URL='http://127.0.0.1:4100'; $env:NEXT_PUBLIC_BACKEND_URL='http://127.0.0.1:4100'; $env:PORT='3001'
  Set-Location (Join-Path $root 'frontend-next')
  $f = Start-Process cmd -ArgumentList '/c','npx next dev -p 3001' -PassThru -WindowStyle Hidden -RedirectStandardOutput "$log\front.out.log" -RedirectStandardError "$log\front.err.log"
  Set-Content "$log\front.pid" $f.Id
}
Start-Sleep 15
try { 'backend : ' + (Invoke-WebRequest http://localhost:4100/api/health -UseBasicParsing -TimeoutSec 30).StatusCode } catch { 'backend : KO ' + $_.Exception.Message }
