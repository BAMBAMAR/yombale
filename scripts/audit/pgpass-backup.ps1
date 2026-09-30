# Sauvegarde / restauration chiffrée du mot de passe PostgreSQL d'audit, HORS du dépôt.
# Chiffrement DPAPI (ConvertFrom-SecureString) : le fichier n'est lisible que par CE compte Windows sur CE poste.
# Il survit à un nouveau clone du dépôt ; il ne protège pas d'une perte du poste ou du profil (voir README).
# Usage :
#   powershell -File scripts\audit\pgpass-backup.ps1 -Action save      (pgpass.txt -> sauvegarde chiffrée)
#   powershell -File scripts\audit\pgpass-backup.ps1 -Action restore   (sauvegarde chiffrée -> pgpass.txt)
#   powershell -File scripts\audit\pgpass-backup.ps1 -Action status
param([ValidateSet('save', 'restore', 'status')][string]$Action = 'status')
$kit = Split-Path -Parent $MyInvocation.MyCommand.Path
$pwFile = Join-Path $kit '.local\pgpass.txt'
$dir = Join-Path $env:USERPROFILE '.nopalou-audit'
$enc = Join-Path $dir 'pgpass.dpapi'
$encLocal = Join-Path $kit '.secrets\pgpass.dpapi'   # 2e copie chiffrée DANS le projet (ignorée par git)

switch ($Action) {
  'save' {
    if (-not (Test-Path $pwFile)) { 'KO : scripts\audit\.local\pgpass.txt absent, rien à sauvegarder'; exit 1 }
    New-Item -ItemType Directory -Force $dir | Out-Null
    $secure = ConvertTo-SecureString ((Get-Content $pwFile -Raw).Trim()) -AsPlainText -Force
    $chiffre = ConvertFrom-SecureString $secure
    New-Item -ItemType Directory -Force (Split-Path $encLocal) | Out-Null
    $chiffre | Set-Content $enc -Encoding ascii
    $chiffre | Set-Content $encLocal -Encoding ascii
    "OK : sauvegardes chiffrées écrites dans $enc et $encLocal (lisibles uniquement par $env:USERNAME sur $env:COMPUTERNAME)"
  }
  'restore' {
    $source = @($encLocal, $enc) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $source) { "KO : aucune sauvegarde ($encLocal, $enc)"; exit 1 }
    try {
      $secure = ConvertTo-SecureString (Get-Content $source -Raw).Trim()
    } catch { 'KO : sauvegarde illisible (autre compte Windows ou autre poste). Utiliser la procédure « Mot de passe perdu » du README.'; exit 1 }
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    New-Item -ItemType Directory -Force (Split-Path $pwFile) | Out-Null
    [IO.File]::WriteAllText($pwFile, $plain)
    'OK : scripts\audit\.local\pgpass.txt restauré depuis la sauvegarde chiffrée'
  }
  'status' {
    'pgpass.txt      : ' + $(if (Test-Path $pwFile) { 'présent' } else { 'ABSENT' })
    'sauvegarde projet : ' + $(if (Test-Path $encLocal) { 'présente' } else { 'ABSENTE' })
    'sauvegarde profil : ' + $(if (Test-Path $enc) { "présente ($enc)" } else { 'ABSENTE' })
  }
}
