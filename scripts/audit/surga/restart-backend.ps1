# Démarre ou redémarre un backend d'audit dans l'environnement isolé Surga. Remet à zéro les compteurs de débit en mémoire.
# Usage : powershell -NoProfile -File scripts\audit\surga\restart-backend.ps1 [-Db nopalou_audit] [-NoVapid] [-Port 4100] [-ProcessType web]
#   -Db base_absente -Port 4102   : second backend sans base (A1-057). Le service PostgreSQL n'est jamais arrêté.
#   -ProcessType worker -Port 4103 : second processus en mode worker (A1-081).
#   -Sources : garde reseau remplacee par la liste blanche de sources publiques sans cle (presse, MET Norway, Open-Meteo, ESPN,
#              TheSportsDB), lecture seule, pour VOIR meteo et scores dans l'application. Tout le reste reste refuse (Wave, Meta, base distante...).
param([string]$Db = 'nopalou_audit', [switch]$NoVapid, [string]$Port = '4100', [string]$ProcessType = 'web', [switch]$Sources)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$kit = Split-Path -Parent $here
$root = Resolve-Path (Join-Path $kit '..\..')
. (Join-Path $here 'env-surga.ps1')
if ($Sources) { $env:NODE_OPTIONS = "--require $((Join-Path $here 'a4\guard-sources.js') -replace '\\','/')" }
$env:DATABASE_URL = $env:DATABASE_URL -replace '/nopalou_audit$', "/$Db"
$env:PORT = $Port; $env:PROCESS_TYPE = $ProcessType
if ($NoVapid) { Remove-Item env:VAPID_PUBLIC_KEY, env:VAPID_PRIVATE_KEY -ErrorAction SilentlyContinue }  # .env ne definit aucune variable VAPID (verifie par nom) : le code bascule sur la table settings
$log = Join-Path $kit '.local'
$suffix = if ($Port -eq '4100') { '' } else { ".$Port" }
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
Set-Location $root
$stamp = Get-Date -Format 'HHmmss'
if (Test-Path "$log\backend$suffix.out.log") { Copy-Item "$log\backend$suffix.out.log" "$log\backend$suffix.out.$stamp.log" -Force; Copy-Item "$log\backend$suffix.err.log" "$log\backend$suffix.err.$stamp.log" -Force }
$b = Start-Process node -ArgumentList 'backend\app.js' -PassThru -WindowStyle Hidden -RedirectStandardOutput "$log\backend$suffix.out.log" -RedirectStandardError "$log\backend$suffix.err.log"
Set-Content "$log\backend$suffix.pid" $b.Id
$ok = $false
foreach ($i in 1..30) { Start-Sleep 2; try { $c = (Invoke-WebRequest "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec 5).StatusCode; if ($c) { $ok = $true; break } } catch { if ($_.Exception.Response) { $ok = $true; break } } }
"backend $ProcessType port $Port base $Db : repond=$ok (pid $($b.Id))"
