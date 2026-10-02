# Sondes UX / parcours (audit du 02/10/2026)

À lancer sur la pile isolée (`. scripts\audit\audit-env.ps1`, backend :4100, frontend :3001 en build de production), avec la
base `nopalou_audit_data` (copie de production : données personnelles, jamais commitée). Jamais contre la production.
Les sondes écrivent dans la base LOCALE (comptes `audit.ux.*`, boutiques « … Audit », commandes de test).

| Script | Rôle | Fiche |
|---|---|---|
| `01-sweep.js` | balayage mobile + desktop (statut, H1, débordement, cibles tactiles, erreurs de page) ; `PAGES=/,/immo` pour limiter | transverse |
| `02-acheteur.js`, `03-panier-commande.js` | recherche → panier → commande (`whatsapp`, `formulaire`, `vide`), zone par indice | AUD-216/217/220 |
| `04-suivi.js` | suivi public par référence / téléphone | AUD-215 |
| `05-compte.js`, `06-compte-menu.js`, `07-connexion-erreurs.js` | inscription, compte, menus, messages de connexion | AUD-224/226 |
| `08-…10-wizard-complet.js`, `09-wizard-erreur.js` | assistant de création de boutique (OTP simulé dans le navigateur uniquement ; `BLOQUER_ACTION=1` pour le contrôle de cause) | AUD-213/214/223 |
| `11-immo.js`, `20-fiche-immo-barre.js` | recherche immo et barre de contact mobile | AUD-228 |
| `12-annonce.js`, `13-annonce-brouillon.js` | dépôt d'annonce et brouillon | AUD-219 |
| `14-bot-whatsapp.js` | scénarios du bot (vrai code, envois Meta capturés) ; échoue si `dict_snowball.dll` est bloqué par la politique du poste | AUD-221/222 |
| `15-hydratation-diff.js`, `16-reseau-continu.js`, `19-hydratation-dev.js` | hydratation (message exact en mode dev : `next dev -p 3002`), activité réseau | AUD-229 |
| `17-axe.js` | axe-core WCAG 2.1 AA avec synthèse par couple de couleurs | AUD-230 |
| `sql.js` | requête SQL en LECTURE SEULE sur la base locale | — |

Pièges : redémarrer le backend entre deux gros balayages (limiteur global 1 000 requêtes / 15 min) ; terminer le serveur par
son port (`Get-NetTCPConnection`), le fichier de PID désigne parfois l'enveloppe ; `next build` modifie `public/sw.js`
(`git checkout` après coup) ; le journal du backend reste ouvert, ne pas le supprimer.
