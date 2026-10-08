# Sépare la configuration des tâches de collecte de celle du dépôt (SRG-A5-011).
#
# Avant : le fichier .env du dépôt est la configuration de production. Les tâches planifiées de collecte s'en servent,
#         et tout backend lancé depuis ce dossier agit sur la vraie base et rejoue les tâches planifiées de production.
# Après : .env.collecte  = copie de l'ancien .env, lue par les seules tâches de collecte (scripts/lib/charger-env.js) ;
#         .env           = configuration locale : base locale, services externes neutralisés, collecte coupée ;
#         .env.avant-separation = l'ancien .env, pour revenir en arrière.
# Les trois fichiers sont ignorés par git. Aucune valeur n'est affichée.
#
# Sans -Appliquer, le script décrit ce qu'il ferait et ne touche à rien.
#   powershell -NoProfile -File scripts\poste\separer-configuration.ps1                  (aperçu)
#   powershell -NoProfile -File scripts\poste\separer-configuration.ps1 -Appliquer
#   powershell -NoProfile -File scripts\poste\separer-configuration.ps1 -Annuler         (remet l'ancien .env)
# -BaseLocale : adresse de la base locale. Par défaut, la base nopalou_dev du PostgreSQL local (port 54329), avec le
#               mot de passe de scripts\audit\.local\pgpass.txt.
# -CreerBase  : avec -Appliquer, crée cette base si elle manque (copie de nopalou_audit_data si elle existe, vide sinon).
param([switch]$Appliquer, [switch]$Annuler, [switch]$CreerBase, [string]$BaseLocale = '', [string]$Racine = '')
$ErrorActionPreference = 'Stop'
if (-not $Racine) { $Racine = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path }
$env0 = Join-Path $Racine '.env'
$collecte = Join-Path $Racine '.env.collecte'
$ancien = Join-Path $Racine '.env.avant-separation'
$utf8 = New-Object System.Text.UTF8Encoding($false)

if ($Annuler) {
  if (-not (Test-Path $ancien)) { throw "Rien à annuler : $ancien est absent." }
  [IO.File]::Copy($ancien, $env0, $true)
  if (Test-Path $collecte) { [IO.File]::Delete($collecte) }
  'Ancien .env remis en place ; .env.collecte retiré. Les tâches de collecte relisent .env.'
  return
}

if (-not (Test-Path $env0)) { throw "$env0 est absent." }
if (Test-Path $collecte) { throw ".env.collecte existe déjà : la séparation est faite. Utilisez -Annuler pour revenir en arrière." }
$lignes = [IO.File]::ReadAllLines($env0)
$base = ($lignes | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1)
if (-not $base) { throw 'DATABASE_URL est absente de .env.' }
if ($base -match '127\.0\.0\.1|localhost') { throw 'Le .env pointe déjà une base locale : rien à séparer.' }

if (-not $BaseLocale) {
  $pwFile = Join-Path $Racine 'scripts\audit\.local\pgpass.txt'
  if (-not (Test-Path $pwFile)) { throw "Mot de passe local introuvable ($pwFile). Donnez l'adresse par -BaseLocale." }
  $BaseLocale = "postgresql://postgres:$((Get-Content $pwFile -Raw).Trim())@127.0.0.1:54329/nopalou_dev"
}
if ($BaseLocale -notmatch '^postgres(ql)?://[^@]+@(127\.0\.0\.1|localhost)[:/]') { throw 'REFUS : -BaseLocale doit désigner une base de ce poste (127.0.0.1 ou localhost).' }

# Services réels : sur le poste, leurs clés deviennent factices. Une valeur vide serait ignorée sous Windows.
$reels = 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_CLOUD_NAME', 'FB_APP_ID', 'FB_APP_SECRET', 'FB_PAGE_ACCESS_TOKEN', 'FB_PAGE_ID',
  'FB_SESSION_JSON', 'IG_USER_ID', 'RESEND_API_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'WAVE_API_KEY', 'WAVE_SIGNING_SECRET', 'WAVE_WEBHOOK_SECRET',
  'WHATSAPP_API_TOKEN', 'WHATSAPP_APP_SECRET', 'WHATSAPP_CATALOG_ID', 'WHATSAPP_CATALOG_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN',
  'ORANGE_WEBHOOK_SECRET', 'TOMTOM_API_KEY', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_ACCOUNT_ID',
  'SURGA_GOOGLE_ROUTES_CLE', 'SURGA_THESPORTSDB_CLE', 'SURGA_OPEN_METEO_CLE', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'
$forces = @{ DATABASE_URL = $BaseLocale; NODE_ENV = 'development'; SCRAPING_DISABLED = 'true'; FRONTEND_URL = 'http://localhost:3001'; BACKEND_URL = 'http://localhost:3000' }

$neutralisees = @(); $vues = @{}
$nouveau = foreach ($l in $lignes) {
  if ($l -match '^\s*([A-Z0-9_]+)\s*=') {
    $k = $Matches[1]; $vues[$k] = $true
    if ($forces.ContainsKey($k)) { "$k=$($forces[$k])" }
    elseif ($reels -contains $k) { $neutralisees += $k; "$k=factice-poste-local" }
    else { $l }
  } else { $l }
}
$ajoutees = @($forces.Keys | Where-Object { -not $vues.ContainsKey($_) })
$entete = '# Configuration LOCALE du poste (scripts/poste/separer-configuration.ps1). La configuration de production des tâches', '# de collecte est dans .env.collecte ; l''ancien fichier est dans .env.avant-separation.'
$nouveau = @($entete) + @($nouveau) + @($ajoutees | ForEach-Object { "$_=$($forces[$_])" })

"Dossier : $Racine"
"Clés du .env actuel : $($vues.Count)"
".env.collecte : copie entière de l'ancien .env ($($vues.Count) clés), lue par les seules tâches de collecte."
"Nouveau .env : base locale ($(($BaseLocale -replace '://[^@]+@', '://***@'))), NODE_ENV=development, SCRAPING_DISABLED=true, adresses du site et du backend sur ce poste."
"Clés de services réels rendues factices dans le nouveau .env ($($neutralisees.Count)) : $($neutralisees -join ', ')"
"Clés laissées telles quelles : $(@($vues.Keys | Where-Object { -not $forces.ContainsKey($_) -and $neutralisees -notcontains $_ } | Sort-Object) -join ', ')"
if (-not $Appliquer) { ''; 'Aperçu seulement : rien n''a été modifié. Relancez avec -Appliquer.'; return }

if ($CreerBase) {
  $env:POSTE_BASE_LOCALE = $BaseLocale
  Push-Location $Racine; node scripts\poste\creer-base-locale.js; $codeBase = $LASTEXITCODE; Pop-Location
  $env:POSTE_BASE_LOCALE = $null
  if ($codeBase -ne 0) { throw 'La base locale n''a pas pu être créée : rien n''a été modifié.' }
}
[IO.File]::Copy($env0, $ancien, $true)
[IO.File]::Copy($env0, $collecte, $false)
[IO.File]::WriteAllLines($env0, [string[]]$nouveau, $utf8)
''
'Fait. À vérifier maintenant :'
'  1. à la prochaine exécution d''une tâche de collecte, logs\scraper-task.log doit contenir « Configuration lue : .env.collecte » ;'
'  2. un backend lancé depuis ce dossier doit se connecter à la base locale ;'
'  3. pour revenir en arrière : powershell -NoProfile -File scripts\poste\separer-configuration.ps1 -Annuler'
