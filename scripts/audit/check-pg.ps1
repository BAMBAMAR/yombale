# Vérifie que le PostgreSQL local d'audit est utilisable : service, port, mot de passe (pgpass.txt), bases attendues.
# Usage : powershell -File scripts\audit\check-pg.ps1
$kit = Split-Path -Parent $MyInvocation.MyCommand.Path
$pwFile = Join-Path $kit '.local\pgpass.txt'
$psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
$svc = Get-Service postgresql-x64-16 -ErrorAction SilentlyContinue
if (-not $svc) { 'KO : service postgresql-x64-16 introuvable (voir README, Installation)'; exit 1 }
if ($svc.Status -ne 'Running') { 'KO : service arrêté (Start-Service postgresql-x64-16, droits administrateur)'; exit 1 }
if (-not (Test-Path $pwFile)) { 'KO : scripts\audit\.local\pgpass.txt absent (voir README, section "Mot de passe perdu")'; exit 1 }
$env:PGPASSWORD = (Get-Content $pwFile -Raw).Trim(); $env:PGCONNECT_TIMEOUT = '5'
$dbs = & $psql -h 127.0.0.1 -p 54329 -U postgres -d postgres -At -c "select datname from pg_database where not datistemplate order by 1" 2>&1
Remove-Item Env:PGPASSWORD
if ($LASTEXITCODE -ne 0) { "KO : connexion refusée, mot de passe de pgpass.txt périmé (voir README, section `"Mot de passe perdu`")"; exit 1 }
"OK : PostgreSQL local joignable. Bases : " + ($dbs -join ', ')
foreach ($b in 'nopalou_audit') { if ($dbs -notcontains $b) { "ATTENTION : base $b absente (la reconstruire avec freshmig.js)" } }
