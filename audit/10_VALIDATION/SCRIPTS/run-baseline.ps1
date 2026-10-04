# Rejeu des runners de la baseline de regression (Agent 8) contre un backend donne.
# Usage : . .\scripts\audit\audit-env.ps1 ; .\audit\10_VALIDATION\SCRIPTS\run-baseline.ps1 -Port 4101 -Label before
param([int]$Port, [string]$Label)
$root = Split-Path (Split-Path (Split-Path $PSScriptRoot))
Set-Location $root
$env:BACKEND_URL = "http://localhost:$Port"
$out = Join-Path $root "audit\10_VALIDATION\PREUVES\regression\$Label"
New-Item -ItemType Directory -Force $out | Out-Null
$pre = Join-Path $PSScriptRoot 'xff-preload.js'
foreach ($s in 'section1-auth','section2-idor','section3-commerce','section4-pos','section6-whatsapp','section7-immo','section8-matching') {
  $log = Join-Path $out "$s.log"
  $env:NODE_OPTIONS = ''
  $res = & node -r $pre "scripts\audit\runners\$s.js" 2>&1 | Out-String
  $code = $LASTEXITCODE
  Set-Content -Path $log -Value ("# exit=$code port=$Port label=$Label date=" + (Get-Date -Format o) + "`n" + $res) -Encoding utf8
  # copie des preuves JSON produites par ce runner
  $pj = Join-Path $out "json_$s"
  New-Item -ItemType Directory -Force $pj | Out-Null
  Get-ChildItem "audit\04_RESULTATS\PREUVES" -File -Filter *.json | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-3) } | Copy-Item -Destination $pj -Force
  "$s exit=$code"
}
