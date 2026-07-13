# backend/scripts/notifier-scraper-fb.ps1
# Affiche une notification Windows (toast) avec le resume de la derniere execution
# du scraper Facebook. Appele par scraper-facebook-auto.bat apres chaque run.

param(
    [string]$ResumeFile
)

$texte = if (Test-Path $ResumeFile) { Get-Content $ResumeFile -Raw } else { "Resultat inconnu (fichier resume manquant)" }

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$textNodes = $template.GetElementsByTagName("text")
$textNodes.Item(0).AppendChild($template.CreateTextNode("Scraper Facebook Nopalou")) | Out-Null
$textNodes.Item(1).AppendChild($template.CreateTextNode($texte)) | Out-Null

$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Nopalou Scraper").Show($toast)
