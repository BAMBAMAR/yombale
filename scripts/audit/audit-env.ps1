# Environnement d'audit : base PostgreSQL locale isolée, toutes les intégrations externes neutralisées.
# Usage : . scripts\audit\audit-env.ps1   (à "dot-sourcer", jamais à exécuter dans un autre shell)
# Le mot de passe PostgreSQL local est lu dans scripts\audit\.local\pgpass.txt (ignoré par git, jamais commité).
$kit = Split-Path -Parent $MyInvocation.MyCommand.Path
$pwFile = Join-Path $kit '.local\pgpass.txt'
if (-not (Test-Path $pwFile)) { & (Join-Path $kit 'pgpass-backup.ps1') -Action restore | Out-Null }  # restauration automatique depuis la sauvegarde chiffrée, si elle existe
if (-not (Test-Path $pwFile)) { throw "REFUS : $pwFile absent (voir scripts/audit/README.md, section Installation)" }
$pw = (Get-Content $pwFile -Raw).Trim()
$env:DATABASE_URL = "postgresql://postgres:$pw@127.0.0.1:54329/nopalou_audit"
if ($env:DATABASE_URL -match 'render\.com|onrender') { throw 'REFUS : base de production' }
$env:NODE_ENV='development'; $env:PORT='4100'; $env:PROCESS_TYPE='web'; $env:SCRAPING_DISABLED='true'
$env:FRONTEND_URL='http://localhost:3001'; $env:BACKEND_URL='http://localhost:4100'
$env:JWT_SECRET='audit-jwt-secret-not-prod'; $env:RESET_SECRET='audit-reset'; $env:VERIFY_SECRET='audit-verify'
$env:ADMIN_SECRET='audit-admin-secret'; $env:SSR_SECRET='audit-ssr'; $env:HASHIDS_SALT='audit-salt'
# Valeur factice NON VIDE : sur Windows une variable d'environnement vide est supprimée, et dotenv rechargerait alors la vraie valeur du .env
foreach($k in 'CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','CLOUDINARY_CLOUD_NAME','FB_APP_ID','FB_APP_SECRET','FB_PAGE_ACCESS_TOKEN','FB_PAGE_ID','FB_SESSION_JSON','IG_USER_ID','RESEND_API_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','WAVE_API_KEY','WAVE_SIGNING_SECRET','WAVE_WEBHOOK_SECRET','ORANGE_WEBHOOK_SECRET','WHATSAPP_API_TOKEN','WHATSAPP_APP_SECRET','WHATSAPP_CATALOG_ID','WHATSAPP_CATALOG_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_VERIFY_TOKEN','ADMIN_WHATSAPP_PHONE','ADMIN_EMAIL','EMAIL_FROM','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'){ Set-Item "env:$k" 'audit-disabled' }
# Garde réseau en liste blanche : seule la boucle locale peut être résolue
$env:NODE_OPTIONS = "--require $(((Join-Path $kit 'audit-guard.js')) -replace '\\','/')"
