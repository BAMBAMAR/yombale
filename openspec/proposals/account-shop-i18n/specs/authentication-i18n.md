# Spécification i18n — Authentification

## Périmètre
- `/connexion` (Formulaire Email, Formulaire WhatsApp OTP, messages d'erreurs)
- `/inscription` (Formulaire création de compte)
- `/mot-de-passe-oublie` (Demande de réinitialisation)
- `/verification-email` (Bannières et toasts d'invitation)

## Exigences
1. Un `LanguageSelector` flottant ou placé dans l'en-tête de la carte d'authentification.
2. Basculement immédiat de tous les libellés sans perte des valeurs saisies dans les champs actifs.
3. Traduction des messages de validation et des retours d'état (chargement, succès, erreurs réseau).
