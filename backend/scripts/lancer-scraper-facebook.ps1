# backend/scripts/lancer-scraper-facebook.ps1
# Lance le scraper Facebook en affichant un suivi en direct colore sur PowerShell (style revue de presse)
# et declenche la notification Windows (Toast) en fin d'execution.

param(
    [switch]$DryRun,
    [switch]$Tout
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Continue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir   = Join-Path $scriptDir "..\.."
Set-Location $rootDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         SCRAPER FACEBOOK NOPALOU (LOCAL POWERSHELL)        " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Date/Heure : $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host " Mode       : $(if ($DryRun) { 'Apercu (--dry-run)' } else { 'LIVE (Insertion PostgreSQL)' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host " Perimetre  : $(if ($Tout) { 'Toutes les 22 sources (--tout)' } else { '5 sources (Fenetre glissante)' })" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------`n" -ForegroundColor Gray

# Notification Windows de demarrage
try { & "$scriptDir\notifier-scraper-fb.ps1" -Message "Scraping Facebook demarre..." } catch {}

# Lancer la commande Node.js et transmettre la sortie sur PowerShell avec mise en valeur
$nodeCmd = "node backend/scripts/scraper-facebook-local.js"
if ($DryRun) { $nodeCmd += " --dry-run" }
if ($Tout)   { $nodeCmd += " --tout" }

Invoke-Expression $nodeCmd

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " [OK] FIN DU SCRAPING FACEBOOK" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Notification Toast Windows finale
try { & "$scriptDir\notifier-scraper-fb.ps1" -ResumeFile "$rootDir\backend\.fb-scraper-resume.txt" } catch {}
