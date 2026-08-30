# scripts/gerer-taches-planifiees.ps1
# Gestionnaire de tâches planifiées pour le scraping Nopalou (Facebook, Expat, CoinAfrique)

param (
    [ValidateSet('creer', 'creer-all', 'lancer', 'status', 'logs', 'supprimer')]
    [string]$Action = 'status',
    [string]$Heure = '04:00'
)

$ProjectPath = Split-Path -Parent $PSScriptRoot
$BatPath = Join-Path $ProjectPath "scripts\run-scraper-task.bat"
$TaskNameFB = "Nopalou_Scraper_Facebook"
$TaskNameAll = "Nopalou_Scraper_All"
$LogPath = Join-Path $ProjectPath "logs\scraper-task.log"

switch ($Action) {
    'creer' {
        Write-Host "Création de la tâche planifiée $TaskNameFB (quotidienne à $Heure)..." -ForegroundColor Cyan
        schtasks /Create /TN $TaskNameFB /TR "`"$BatPath`" --facebook" /SC DAILY /ST $Heure /F
        Write-Host "✅ Tâche $TaskNameFB configurée avec succès !" -ForegroundColor Green
    }
    'creer-all' {
        Write-Host "Création de la tâche planifiée $TaskNameAll (quotidienne à $Heure pour toutes les sources)..." -ForegroundColor Cyan
        schtasks /Create /TN $TaskNameAll /TR "`"$BatPath`" --all" /SC DAILY /ST $Heure /F
        Write-Host "✅ Tâche $TaskNameAll configurée avec succès !" -ForegroundColor Green
    }
    'lancer' {
        Write-Host "Lancement immédiat de la tâche de scraping..." -ForegroundColor Cyan
        schtasks /Run /TN $TaskNameFB
        Write-Host "🚀 Tâche démarrée en tâche de fond. Consultez les logs avec: powershell scripts/gerer-taches-planifiees.ps1 -Action logs" -ForegroundColor Yellow
    }
    'status' {
        Write-Host "=== État des tâches Nopalou ===" -ForegroundColor Cyan
        schtasks /Query /TN $TaskNameFB /FO LIST 2>$null
        schtasks /Query /TN $TaskNameAll /FO LIST 2>$null
    }
    'logs' {
        if (Test-Path $LogPath) {
            Write-Host "=== Dernières lignes de logs ($LogPath) ===" -ForegroundColor Cyan
            Get-Content $LogPath -Tail 30
        } else {
            Write-Host "Aucun fichier de log trouvé pour le moment ($LogPath)." -ForegroundColor Yellow
        }
    }
    'supprimer' {
        Write-Host "Suppression des tâches planifiées Nopalou..." -ForegroundColor Red
        schtasks /Delete /TN $TaskNameFB /F 2>$null
        schtasks /Delete /TN $TaskNameAll /F 2>$null
        Write-Host "✅ Tâches supprimées." -ForegroundColor Green
    }
}
