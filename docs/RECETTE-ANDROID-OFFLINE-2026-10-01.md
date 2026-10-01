# Recette sur Android réel — lot hors-ligne, PWA et WhatsApp (AUD-087 à AUD-107)

Branche `fix/offline-pwa-audit`. Les corrections ont été prouvées sur Chromium headless ; cette recette les rejoue sur un téléphone Android réel. Pile d'audit **locale** (base `nopalou_audit`, données de test, aucune intégration externe) exposée sur le Wi-Fi le temps de la recette seulement.

Légende du résultat : **OK** (conforme à l'attendu), **KO** (écart : décrire), **NT** (non testé). Un point jamais joué reste NON VALIDÉ.

## 1. Préparation

| Étape | Qui | Détail |
|---|---|---|
| Pare-feu | vous (PowerShell **administrateur**) | `New-NetFirewallRule -DisplayName "Nopalou audit 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -RemoteAddress LocalSubnet -Profile Any -Action Allow` |
| Serveurs | moi | backend `127.0.0.1:4100` (non exposé), frontend `0.0.0.0:3001` |
| Chrome Android | vous | ouvrir `chrome://flags`, chercher **« Insecure origins treated as secure »**, y saisir `http://192.168.1.8:3001`, passer en **Enabled**, **Relancer**. Sans cela le Service Worker ne s'enregistre pas (HTTP hors localhost) |
| Même Wi-Fi | vous | le téléphone et le PC sur le même réseau, pas de données mobiles prioritaires |
| Adresse | vous | `http://192.168.1.8:3001` dans Chrome |
| Comptes de test | — | marchand : `offm.muolr6sd@audit.test` / `Audit!Pass2026x` (onglet « Email — avec mot de passe »), PIN gérant de la caisse `1357`. Acheteur : `offz.muolr6sd@audit.test` |
| Fin de recette | vous (admin) | `Remove-NetFirewallRule -DisplayName "Nopalou audit 3001"` ; désactiver le drapeau Chrome |

**Prérequis techniques constatés (à prévoir si la recette se fait sur la pile locale en Wi-Fi)** — la pile locale n'est pas utilisable telle quelle depuis un téléphone :
- le frontend doit être construit avec `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001` (sinon le cookie de session est `Secure` et la connexion échoue en HTTP) et `NEXT_PUBLIC_BACKEND_URL=http://<IP du PC>:3001` (sinon les appels du panier visent le téléphone lui-même) ;
- `src/middleware.ts` ajoute `upgrade-insecure-requests` et HSTS en production : toutes les ressources sont alors demandées en HTTPS et la page ne s'affiche pas. Il faut les désactiver pour ce test seulement (ce que la production ne doit jamais faire) ;
- le garde d'isolation bloque la résolution de `0.0.0.0` : utiliser `scripts/audit/offline/audit-guard-lan.js` (n'autorise que l'adresse d'écoute, les connexions sortantes restent refusées) et démarrer `next start -H 0.0.0.0`.
Ces trois points n'ont pas été menés à terme : la recette n'a pas été jouée. Une alternative plus simple est de rejouer ces scénarios sur un environnement déployé en HTTPS (préproduction), où aucun de ces contournements n'est nécessaire.

**Rappel de sécurité** : pendant la recette, le port 3001 du PC est joignable par les appareils du Wi-Fi. Ne laissez pas la règle en place ensuite.

## 2. Scénarios

Pour chaque scénario : jouez les actions, notez le résultat, et dites-moi « fait » : je contrôle la base à ce moment-là.

| # | AUD | Actions sur le téléphone | Attendu à l'écran | Contrôle base (moi) | Résultat |
|---|---|---|---|---|---|
| 1 | 092, 107 | Ouvrir le site, naviguer (accueil, une boutique, une fiche produit). Menu Chrome → **Installer l'application**. Ouvrir l'icône installée. | Installation proposée ; l'icône est correctement détourée (maskable) ; l'appli s'ouvre en plein écran | — | |
| 2 | 092, 098 | Avec l'appli installée : activer le **mode avion**, fermer et rouvrir l'appli. Ouvrir la fiche produit déjà vue. Chercher un mot jamais cherché. | La fiche déjà vue s'affiche et **le bouton « Ajouter au panier » fonctionne**. La recherche inconnue affiche la page « Hors-ligne », jamais les résultats d'une autre recherche | — | |
| 3 | 099 | Toujours hors-ligne, rouvrir la fiche produit | Un bandeau « Page affichée depuis la mémoire de l'appareil… prix et stocks peuvent avoir changé » | — | |
| 4 | 095 | Hors-ligne : ajouter un produit au panier, **« Commander via WhatsApp Direct »** | Écran « EN ATTENTE D'ENVOI » (pas de référence inventée) ; WhatsApp s'ouvre avec le message sans « Réf » | 0 commande | |
| 5 | 095 | Couper le mode avion, attendre 15 s | — | la commande existe, `en_attente`, `cash`, référence unique | |
| 6 | 087, 093 | Se connecter en marchand (réseau actif), ouvrir **Caisse POS**, PIN 1357, **ouvrir la session** (fond 50 000) | Caisse prête | une session `ouverte` avec UUID, clé `loc_…` | |
| 7 | 087 | Ajouter 2 articles au ticket **sans encaisser**. Basculer le mode avion **3 fois** (2 s chacune). | Le ticket est conservé, la caisse **ne redemande pas le PIN**, aucun rechargement de page | — | |
| 8 | 087 | Ticket ouvert : aller sur une autre appli (WhatsApp, 30 s), revenir sur Chrome | Ticket conservé, caisse déverrouillée | — | |
| 9 | 088, 096 | **Mode avion.** Encaisser 2 ventes (T-Shirt, Robe). Noter l'heure. | Ventes acceptées, compteur « en attente » | 0 vente nouvelle | |
| 10 | 088 | Toujours en avion : **fermer Chrome complètement** (vue des applications, balayer), rouvrir la caisse (PIN). | Les 2 ventes sont toujours « en attente » | — | |
| 11 | 088, 096, 104 | Couper le mode avion. **Ne rien toucher** 30 s. | La file se vide, message « élément(s) synchronisé(s) » | 2 ventes, `created_at` = heures de l'étape 9 (pas l'heure de reconnexion), `session_id` renseigné | |
| 12 | 104 | Mode avion, 1 vente, **fermer l'appli installée**, couper l'avion **sans rouvrir la caisse**, attendre 2 min | (Background Sync) la vente part seule | la vente est en base **sans** réouverture : valide AUD-104. Si elle n'arrive qu'à la réouverture : repli applicatif seulement, noter | |
| 13 | 087 | Après une vente, laisser l'**impression automatique** se lancer (ou l'annuler) | La caisse **ne se recharge pas** et ne se reverrouille pas | — | |
| 14 | 097 | Mode avion, vendre le **dernier article** (« Dernier Article Off »). Pendant ce temps je vends le même article « sur un autre appareil ». Couper l'avion. | Synchronisation sans erreur | vente acceptée, **un écart** dans `stock_ecarts` ; bandeau « 1 écart de stock » à l'écran | |
| 15 | 089 | Mode avion, 1 vente. Je fais **expirer l'abonnement** côté serveur. Couper l'avion. | Bandeau **« 1 opération à traiter »** avec le message du serveur | aucune vente en base | |
| 16 | 089 | Je régularise l'abonnement. Toucher « Voir » puis **Renvoyer**. | La vente part, le bandeau disparaît | la vente est en base | |
| 17 | 090 | Hors-ligne : carnet de dettes (menu boutique → Carnet), **nouveau client**, puis **vente à crédit** pour ce client. Couper l'avion. | Client et dette synchronisés | un seul client, dette de ce client, solde exact | |
| 18 | 093 | Réseau actif : **Clôture Z** (compter les billets, valider) | « Session fermée avec succès » | session `cloturee`, écart calculé | |
| 19 | 099 | Réseau actif : ajouter un produit au panier ; je **modifie son prix** côté serveur ; valider la commande | Message « Le prix a changé… 15 000 → 16 000 », le tiroir **reste ouvert**, total mis à jour ; au second appui la commande part | commande à 16 000 | |
| 20 | tiroir | Ouvrir le panier, appuyer sur le bouton **Retour** d'Android | Le tiroir se ferme (et non la page précédente) | — | |
| 21 | 091 | Se **déconnecter** (menu compte). Mode avion. Rouvrir `…/boutique/caisse` puis `…/boutique`. | Page « Hors-Ligne » : **aucune donnée du marchand** visible | — | |
| 22 | 106 | Mode avion, ouvrir l'**assistant** (bulle) et envoyer un message | « Vous êtes hors-ligne… », badge « Hors-ligne » | — | |
| 23 | réseau lent | Réseau faible réel (s'éloigner du routeur ou 1 barre) : ouvrir une fiche produit déjà vue | Contenu servi, bandeau d'avertissement si issu du cache | — | |

## 3. Ce que cette recette ne couvre pas

Paiements réels Wave / Orange Money (intégrations bloquées), publication d'annonce (téléversement d'images externe), réseau mobile 3G/4G opérateur (le test se fait sur Wi-Fi), iOS / Safari (hors périmètre : pas d'appareil), mise à jour du Service Worker après un nouveau déploiement.

## 4. Compte rendu (à remplir)

| Appareil / Android / version de Chrome | Date | Testeur |
|---|---|---|
| | | |

Écarts constatés : voir colonne « Résultat ». Toute ligne KO ou NT est reprise dans `JOURNAL-LIVRAISONS.md`.
