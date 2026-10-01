# Recrée la copie jetable de rejeu `nopalou_scrap_audit` à partir de `nopalou_audit_data` et la migre (les migrations créent f_unaccent et scraping_runs : AUD-172, AUD-176).
# Les rejeux ÉCRIVENT dans cette copie : la recréer avant chaque série. La base source n'est jamais modifiée.
# La copie contient des données personnelles (copie de production) : ne jamais l'exporter ni la committer, la supprimer ensuite
#   (powershell -File scripts\audit\scraping\prepare-copy.ps1 -Drop).
# Usage : powershell -File scripts\audit\scraping\prepare-copy.ps1 [-Drop]
param([switch]$Drop)
$kit = Split-Path -Parent $PSScriptRoot
$pwFile = Join-Path $kit '.local\pgpass.txt'
if (-not (Test-Path $pwFile)) { throw "REFUS : $pwFile absent (voir scripts/audit/README.md)" }
$psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
$repo = Split-Path -Parent (Split-Path -Parent $kit)
$env:PGPASSWORD = (Get-Content $pwFile -Raw).Trim()
function Sql($db, $cmd) { & $psql -h 127.0.0.1 -p 54329 -U postgres -d $db -w -v ON_ERROR_STOP=1 -c $cmd }
try {
  Sql 'postgres' 'DROP DATABASE IF EXISTS nopalou_scrap_audit'
  if ($Drop) { 'Copie supprimée.'; return }
  Sql 'postgres' 'CREATE DATABASE nopalou_scrap_audit TEMPLATE nopalou_audit_data'
} finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
# Migrations courantes sur la copie, rejouées 2 fois (la base du 24/09 précède les migrations récentes ; la 2e passe prouve l'idempotence)
. (Join-Path $kit 'audit-env.ps1')
$env:DATABASE_URL = $env:DATABASE_URL -replace '/nopalou_audit$', '/nopalou_scrap_audit'; $env:NODE_ENV = 'development'
Push-Location $repo
try { 1..2 | ForEach-Object { node -e "require('./backend/migrate-inline')().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})" | Select-Object -Last 1 } } finally { Pop-Location }
'Copie prête : DATABASE_URL = ' + ($env:DATABASE_URL -replace ':[^:@]+@', ':***@')
