# scripts/gerer-taches-planifiees.ps1
# Gestionnaire de tâches planifiées pour le scraping Nopalou (Facebook, Expat, CoinAfrique)

param (
    [ValidateSet('creer', 'creer-facebook', 'creer-omnisource', 'creer-combo', 'creer-all', 'lancer', 'status', 'logs', 'supprimer')]
    [string]$Action = 'status',
    [string]$Heure = '04:00',
    [int]$IntervalleHeures = 6
)

$ProjectPath = Split-Path -Parent $PSScriptRoot
$BatPath = Join-Path $ProjectPath "scripts\run-scraper-task.bat"
$TaskNameFB = "Nopalou_Scraper_Facebook"
$TaskNameOmni = "Nopalou_Scraper_Omnisource"
$TaskNameCombo = "Nopalou_Scraper_Combo"
$TaskNameAll = "Nopalou_Scraper_All"
$LogPath = Join-Path $ProjectPath "logs\scraper-task.log"

switch ($Action) {
    { $_ -in @('creer', 'creer-facebook') } {
        Write-Host "Création de la tâche planifiée $TaskNameFB (quotidienne à $Heure avec persistance photos)..." -ForegroundColor Cyan
        $ActionFB = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"`"$BatPath`" --facebook --scheduled`"" -WorkingDirectory $ProjectPath
        $Trigger = New-ScheduledTaskTrigger -Daily -At $Heure
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        Register-ScheduledTask -TaskName $TaskNameFB -Action $ActionFB -Trigger $Trigger -Settings $Settings -Force | Out-Null
        Write-Host "✅ Tâche $TaskNameFB configurée avec succès !" -ForegroundColor Green
    }
    'creer-omnisource' {
        Write-Host "Création de la tâche planifiée $TaskNameOmni (toutes les $IntervalleHeures heures : Google, Maps, TikTok, Insta)..." -ForegroundColor Cyan
        $ActionOmni = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"`"$BatPath`" --omnisource --scheduled`"" -WorkingDirectory $ProjectPath
        $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours(4) -RepetitionInterval (New-TimeSpan -Hours $IntervalleHeures) -RepetitionDuration (New-TimeSpan -Days 3650)
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        Register-ScheduledTask -TaskName $TaskNameOmni -Action $ActionOmni -Trigger $Trigger -Settings $Settings -Force | Out-Null
        Write-Host "✅ Tâche $TaskNameOmni configurée avec succès (récurrence toutes les $IntervalleHeures h) !" -ForegroundColor Green
    }
    'creer-combo' {
        Write-Host "Création de la tâche planifiée $TaskNameCombo (Collecte complète Omnisource + Facebook Immo avec photos)..." -ForegroundColor Cyan
        $ActionCombo = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"`"$BatPath`" --full --scheduled`"" -WorkingDirectory $ProjectPath
        $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours(4) -RepetitionInterval (New-TimeSpan -Hours $IntervalleHeures) -RepetitionDuration (New-TimeSpan -Days 3650)
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        Register-ScheduledTask -TaskName $TaskNameCombo -Action $ActionCombo -Trigger $Trigger -Settings $Settings -Force | Out-Null
        Write-Host "✅ Tâche $TaskNameCombo configurée avec succès (Omnisource + Facebook Immo, toutes les $IntervalleHeures h) !" -ForegroundColor Green
    }
    'creer-all' {
        Write-Host "Création de la tâche planifiée $TaskNameAll (quotidienne à $Heure pour toutes les sources)..." -ForegroundColor Cyan
        $ActionAll = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"`"$BatPath`" --all --scheduled`"" -WorkingDirectory $ProjectPath
        $Trigger = New-ScheduledTaskTrigger -Daily -At $Heure
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        Register-ScheduledTask -TaskName $TaskNameAll -Action $ActionAll -Trigger $Trigger -Settings $Settings -Force | Out-Null
        Write-Host "✅ Tâche $TaskNameAll configurée avec succès !" -ForegroundColor Green
    }
    'lancer' {
        Write-Host "Lancement immédiat de la tâche dans le planificateur Windows..." -ForegroundColor Cyan
        schtasks /Run /TN $TaskNameFB
        Write-Host "🚀 Tâche démarrée en tâche de fond. Consultez les logs avec: powershell scripts/gerer-taches-planifiees.ps1 -Action logs" -ForegroundColor Yellow
    }
    'status' {
        Write-Host "=== État des tâches Nopalou ===" -ForegroundColor Cyan
        schtasks /Query /TN $TaskNameFB /FO LIST 2>$null
        schtasks /Query /TN $TaskNameOmni /FO LIST 2>$null
        schtasks /Query /TN $TaskNameCombo /FO LIST 2>$null
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
        schtasks /Delete /TN $TaskNameOmni /F 2>$null
        schtasks /Delete /TN $TaskNameCombo /F 2>$null
        schtasks /Delete /TN $TaskNameAll /F 2>$null
        Write-Host "✅ Tâches supprimées." -ForegroundColor Green
    }
}
