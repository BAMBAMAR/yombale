# Arrête le backend et le frontend d'audit (PostgreSQL reste en service).
$log = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '.local'
foreach ($n in 'backend','front') {
  $f = "$log\$n.pid"
  if (Test-Path $f) { cmd /c "taskkill /PID $(Get-Content $f) /T /F" | Out-Null; Remove-Item $f }
}
