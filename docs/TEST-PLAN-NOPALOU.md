# CAHIER DE TEST — NOPALOU
> Version 2.0 — Juin 2026
> URL de test : https://nopalou.com
> Testeur : _________________ | Date : _________________

---

## LÉGENDE

| Statut | Signification |
|--------|--------------|
| ✅ PASS | Fonctionne correctement |
| ❌ FAIL | Bug ou comportement incorrect |
| ⚠️ PARTIEL | Présent mais incomplet |
| ⏭ SKIP | Non testé / hors périmètre |

---

## CAMPAGNE 1 — NAVIGATION ET LAYOUT

### TC-NAV-001 — Chargement de la page d'accueil
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir https://nopalou.com | Page d'accueil chargée en < 5s | | |
| 2 | Vérifier le titre de l'onglet | Contient "Nopalou" | | |
| 3 | Vérifier la navbar | Logo + liens Produits / Immo / Télécom / Annonces / Boutiques visible | | |
| 4 | Vérifier le H1 | Contient "Sénégal" | | |
| 5 | Faire défiler jusqu'au footer | Footer visible avec liens légaux | | |

### TC-NAV-002 — Liens navbar principaux
**Précondition :** Être sur la page d'accueil

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Cliquer "Immobilier" | Navigation vers /immo | | |
| 2 | Cliquer "Télécom" | Navigation vers /telecom | | |
| 3 | Cliquer "Annonces" | Navigation vers /annonces | | |
| 4 | Cliquer "Boutiques" | Navigation vers /boutiques | | |
| 5 | Cliquer logo Nopalou | Retour à l'accueil | | |

### TC-NAV-003 — Bouton "+ Publier"
**Précondition :** Non connecté

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Cliquer "+ Publier" dans la navbar | Redirection vers /connexion?redirect=/deposer-annonce | | |
| 2 | Se connecter | Redirection vers /deposer-annonce | | |

### TC-NAV-004 — Responsivité mobile
**Précondition :** Réduire la fenêtre à 390px (iPhone)

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Vérifier l'accueil en mobile | Mise en page adaptée, pas de débordement horizontal | | |
| 2 | Vérifier la navbar mobile | Menu burger ou barre de navigation adaptée | | |
| 3 | Vérifier /immo en mobile | Page lisible, filtres accessibles | | |

---

## CAMPAGNE 2 — RECHERCHE ET PRODUITS

### TC-PROD-001 — Barre de recherche
**Précondition :** Être sur la page d'accueil

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Taper "Samsung" dans la barre de recherche | Suggestions ou résultats apparaissent | | |
| 2 | Appuyer sur Entrée | Résultats filtrés affichés (URL contient q=Samsung) | | |
| 3 | Vérifier les résultats | Produits Samsung listés avec prix | | |
| 4 | Effacer la recherche | Tous les produits réapparaissent | | |

### TC-PROD-002 — Filtres produits
**Précondition :** Être sur la page d'accueil

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Filtrer par prix min (ex: 50000) | Produits < 50 000 FCFA exclus | | |
| 2 | Filtrer par prix max (ex: 200000) | Produits > 200 000 FCFA exclus | | |
| 3 | Changer le tri | Produits triés selon le critère choisi | | |

### TC-PROD-003 — Fiche produit
**Précondition :** Des produits sont affichés

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Cliquer sur un produit | Navigation vers /produit/{id} | | |
| 2 | Vérifier le titre de la page | Contient le nom du produit | | |
| 3 | Vérifier les prix | Tableau comparatif des prix par boutique visible | | |
| 4 | Vérifier le bouton "Acheter" | Ouvre le site marchand | | |
| 5 | Tester le bouton favoris (♡) | Produit ajouté aux favoris (icône change) | | |

### TC-PROD-004 — Pages catégories SEO
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /categorie/smartphones | Page chargée avec H1 sur smartphones | | |
| 2 | Ouvrir /categorie/informatique | Page chargée | | |
| 3 | Ouvrir /categorie/tv-electro | Page chargée | | |
| 4 | Ouvrir /categorie/mode | Page chargée | | |
| 5 | Ouvrir /categorie/maison | Page chargée | | |
| 6 | Ouvrir /categorie/auto-moto | Page chargée | | |
| 7 | Cliquer sur un produit depuis une catégorie | Navigation vers la fiche produit | | |

### TC-PROD-005 — Comparateur
**Précondition :** Des produits sont affichés

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Cocher 2 produits à comparer | Barre de comparaison apparaît en bas | | |
| 2 | Cocher 3 produits | 3 produits dans la barre | | |
| 3 | Cliquer "Comparer" | Page /comparaison avec tableau comparatif | | |
| 4 | Cliquer "Supprimer" sur un produit | Produit retiré de la comparaison | | |

---

## CAMPAGNE 3 — IMMOBILIER

### TC-IMMO-001 — Liste des annonces immo
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /immo | Page chargée avec annonces immo | | |
| 2 | Vérifier le H1 | Présent et visible | | |
| 3 | Vérifier les cartes d'annonces | Titre, prix, ville, type bien visible | | |

### TC-IMMO-002 — Filtres immobiliers
**Précondition :** Être sur /immo

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Filtrer par type "Location" | Seules les locations affichées | | |
| 2 | Filtrer par ville "Dakar" | Seules les annonces à Dakar | | |
| 3 | Filtrer par prix max | Annonces filtrées par budget | | |
| 4 | Filtrer par nb chambres (ex: 2) | Annonces avec ≥ 2 chambres | | |
| 5 | Filtrer "Meublé" | Seules les annonces meublées | | |
| 6 | Réinitialiser les filtres | Toutes les annonces réapparaissent | | |

---

## CAMPAGNE 4 — TÉLÉCOM

### TC-TEL-001 — Page télécom
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /telecom | Page chargée avec forfaits | | |
| 2 | Vérifier les opérateurs | Orange, Free, Expresso visibles | | |
| 3 | Filtrer par opérateur | Forfaits filtrés | | |
| 4 | Filtrer par type (Data/Voix) | Forfaits filtrés | | |
| 5 | Comparer 2 forfaits | Comparaison affichée | | |

---

## CAMPAGNE 5 — ANNONCES CLASSIFIÉES

### TC-ANN-001 — Liste des annonces
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /annonces | Page chargée avec annonces | | |
| 2 | Vérifier les cartes | Titre, prix, ville, photo visible | | |
| 3 | Filtrer par catégorie | Annonces filtrées | | |
| 4 | Rechercher un terme | Annonces correspondantes affichées | | |
| 5 | Cliquer sur une annonce | Détail de l'annonce visible | | |

---

## CAMPAGNE 6 — AUTHENTIFICATION

### TC-AUTH-001 — Inscription
**Précondition :** Email non utilisé sur le site

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /inscription | Formulaire d'inscription visible | | |
| 2 | Remplir nom, email, mot de passe | Champs renseignés | | |
| 3 | Soumettre le formulaire | Redirection vers /compte ou /connexion | | |
| 4 | Tester avec email déjà utilisé | Message d'erreur "email déjà utilisé" | | |
| 5 | Tester avec mot de passe trop court | Message d'erreur validation | | |

### TC-AUTH-002 — Connexion
**Précondition :** Avoir un compte existant

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /connexion | Formulaire visible | | |
| 2 | Entrer email + mot de passe corrects | Redirection vers page d'accueil ou /compte | | |
| 3 | Vérifier la navbar après connexion | Nom de l'utilisateur visible | | |
| 4 | Tester avec mauvais mot de passe | Message d'erreur "identifiants incorrects" | | |
| 5 | Tester avec email inexistant | Message d'erreur | | |

### TC-AUTH-003 — Pages protégées sans connexion
**Précondition :** Ne pas être connecté

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Accéder à /compte | Redirection vers /connexion | | |
| 2 | Accéder à /mes-annonces | Redirection vers /connexion | | |
| 3 | Accéder à /deposer-annonce | Redirection vers /connexion | | |
| 4 | Accéder à /deposer-immo | Redirection vers /connexion | | |
| 5 | Accéder à /boutique | Redirection vers /connexion | | |

### TC-AUTH-004 — Déconnexion
**Précondition :** Être connecté

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Cliquer sur le bouton de déconnexion | Session supprimée, retour à l'accueil | | |
| 2 | Accéder à /compte après déconnexion | Redirection vers /connexion | | |

---

## CAMPAGNE 7 — PUBLICATION D'ANNONCE ⚠️ (BUG SIGNALÉ)

### TC-PUB-001 — Publier une annonce classifiée
**Précondition :** Être connecté avec un compte valide

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Cliquer "+ Publier" ou aller sur /deposer-annonce | Formulaire étape 1 visible (choix catégorie) | | |
| 2 | Choisir "Téléphone" | Passage à l'étape 2 | | |
| 3 | Remplir : Titre "iPhone 13 test" | Champ renseigné | | |
| 4 | Remplir : Prix 250000 | Champ renseigné | | |
| 5 | Remplir : Marque "Apple" | Champ renseigné | | |
| 6 | Sélectionner État "Bon état" | Sélectionné | | |
| 7 | Sélectionner Ville "Dakar" | Sélectionné | | |
| 8 | Remplir : Téléphone "77 123 45 67" | Champ renseigné | | |
| 9 | Cliquer "Continuer → Photos" | Passage à l'étape 3 | | |
| 10 | Cliquer "🚀 Publier l'annonce" sans photo | **Redirection vers /payer-annonce/{id} ou /mes-annonces** | | **⚠️ BUG SIGNALÉ : erreur à cette étape** |
| 11 | Si erreur, noter le message exact | Message d'erreur visible | | |

### TC-PUB-002 — Publier une annonce immo
**Précondition :** Être connecté avec un compte valide

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Aller sur /deposer-immo | Formulaire visible | | |
| 2 | Remplir : Titre "Appartement F3 Plateau" | Champ renseigné | | |
| 3 | Sélectionner Type "Appartement" | Sélectionné | | |
| 4 | Sélectionner Transaction "Location" | Sélectionné | | |
| 5 | Remplir : Prix 200000 | Champ renseigné | | |
| 6 | Remplir : Surface 80 | Champ renseigné | | |
| 7 | Sélectionner Ville "Dakar" | Sélectionné | | |
| 8 | Remplir : Téléphone "77 123 45 67" | Champ renseigné | | |
| 9 | Cliquer "Publier" | **Redirection vers /mes-annonces-immo** | | **⚠️ À tester** |
| 10 | Si erreur, noter le message exact | Message d'erreur visible | | |

### TC-PUB-003 — Diagnostic erreur de publication
**Précondition :** TC-PUB-001 ou TC-PUB-002 échoue

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir les DevTools (F12) → onglet Console | Pas d'erreur réseau rouge | | |
| 2 | Onglet Network → chercher la requête POST | Vérifier le code de statut HTTP | | |
| 3 | Si statut 401 | JWT_SECRET manquant dans Render → voir section "Résolution" | | |
| 4 | Si statut 500 | Erreur serveur → vérifier les logs Render backend | | |
| 5 | Si "Failed to fetch" | BACKEND_URL manquant dans Render → voir section "Résolution" | | |
| 6 | Si statut 400 | Champ manquant ou invalide dans le formulaire | | |

---

## CAMPAGNE 8 — MON COMPTE

### TC-CPT-001 — Page compte
**Précondition :** Être connecté

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /compte | Page avec infos utilisateur | | |
| 2 | Vérifier affichage nom + email | Données correctes | | |

### TC-CPT-002 — Mes annonces classifiées
**Précondition :** Être connecté, avoir au moins une annonce

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /mes-annonces | Liste des annonces publiées | | |
| 2 | Vérifier statut de chaque annonce | Actif / En attente / Rejeté visible | | |
| 3 | Cliquer "Supprimer" sur une annonce | Confirmation demandée | | |
| 4 | Confirmer la suppression | Annonce supprimée, liste mise à jour | | |

### TC-CPT-003 — Mes annonces immo
**Précondition :** Être connecté, avoir au moins une annonce immo

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /mes-annonces-immo | Liste des annonces immo | | |
| 2 | Cliquer "Supprimer" | Confirmation + suppression | | |

### TC-CPT-004 — Favoris
**Précondition :** Avoir ajouté des produits en favoris

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /favoris | Liste des produits favoris | | |
| 2 | Retirer un favori | Produit retiré | | |
| 3 | Fermer et rouvrir le navigateur | Favoris conservés (localStorage) | | |

---

## CAMPAGNE 9 — BOUTIQUES

### TC-BOUT-001 — Liste boutiques
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /boutiques | Liste des boutiques partenaires | | |
| 2 | Cliquer sur une boutique | Page boutique avec ses produits | | |

### TC-BOUT-002 — Ma boutique
**Précondition :** Être connecté

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /boutique | Page de ma boutique | | |
| 2 | Vérifier les infos | Nom, description, produits | | |

---

## CAMPAGNE 10 — GUIDES

### TC-GUIDE-001 — Guide d'achat intelligent
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /guide-achat | Page guide visible | | |
| 2 | Définir un budget max 200000 | Champ renseigné | | |
| 3 | Sélectionner catégorie "Smartphones" | Catégorie sélectionnée | | |
| 4 | Cliquer "Lancer la recherche" | Résultats triés par score | | |
| 5 | Naviguer vers un produit puis revenir | Les filtres sont conservés dans l'URL | | |
| 6 | Vérifier la barre CTA en bas | Meilleur produit affiché avec bouton "Voir la fiche" | | |

### TC-GUIDE-002 — Guide immo
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /guide-immo | Page guide immo visible | | |
| 2 | Filtrer par budget et ville | Résultats filtrés | | |

### TC-GUIDE-003 — Guide forfaits télécom
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /guide-forfait | Page guide télécom visible | | |
| 2 | Filtrer par usage (data/voix) | Forfaits adaptés affichés | | |

---

## CAMPAGNE 11 — ADMINISTRATION

### TC-ADMIN-001 — Accès admin
**Précondition :** Connaître le secret admin (ADMIN_SECRET)

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /admin | Redirection vers /admin/login | | |
| 2 | Entrer le bon secret | Redirection vers /admin (dashboard) | | |
| 3 | Entrer un mauvais secret | Message d'erreur, rester sur /admin/login | | |
| 4 | Cliquer "Dashboard" | Rester connecté (pas de déconnexion) | | |
| 5 | Cliquer "Déconnexion" | Redirection vers /admin/login | | |
| 6 | Accéder à /admin après déconnexion | Redirection vers /admin/login | | |

### TC-ADMIN-002 — Modération annonces
**Précondition :** Être connecté en admin, avoir des annonces en attente

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /admin/annonces | Liste des annonces avec statut | | |
| 2 | Cliquer "Approuver" sur une annonce | Annonce approuvée, statut mis à jour | | |
| 3 | Cliquer "Rejeter" sur une annonce | Annonce rejetée | | |

### TC-ADMIN-003 — Validation immo
**Précondition :** Être connecté en admin, avoir des annonces immo en attente

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /admin/immo | Liste des annonces immo en attente | | |
| 2 | Valider une annonce | Annonce publiée | | |
| 3 | Rejeter une annonce | Annonce rejetée | | |

### TC-ADMIN-004 — Section SEO
**Précondition :** Être connecté en admin

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /admin/seo | Page SEO avec stats et pages indexées | | |
| 2 | Cliquer "Sitemap XML" | Sitemap ouvert dans un nouvel onglet | | |
| 3 | Cliquer "Google Search Console" | Lien externe ouvert | | |

---

## CAMPAGNE 12 — PWA ET PERFORMANCES

### TC-PWA-001 — Manifest et icônes
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /manifest.json | JSON valide avec name, icons, start_url | | |
| 2 | Vérifier /icons/icon-192.svg | Image accessible | | |
| 3 | Sur Chrome mobile → "Ajouter à l'écran d'accueil" | Option disponible | | |

### TC-PWA-002 — SEO technique
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /sitemap.xml | XML valide avec toutes les URLs | | |
| 2 | Ouvrir /robots.txt | Fichier avec Sitemap et Allow/Disallow | | |
| 3 | Tester https://nopalou.com sur PageSpeed | Score ≥ 70 mobile, ≥ 85 desktop | | |

---

## CAMPAGNE 13 — PAGES LÉGALES

### TC-LEGAL-001 — Pages légales accessibles
**Précondition :** Aucune

| # | Étape | Résultat attendu | Statut | Remarque |
|---|-------|-----------------|--------|----------|
| 1 | Ouvrir /mentions-legales | Page chargée avec contenu | | |
| 2 | Ouvrir /confidentialite | Page chargée avec contenu | | |
| 3 | Ouvrir /cgu | Page chargée avec contenu | | |
| 4 | Vérifier les liens dans le footer | Tous pointent vers les bonnes pages | | |

---

## RÉSOLUTION BUG — PUBLICATION

Si TC-PUB-001 échoue avec "Erreur 401" ou "Erreur réseau" :

### Étape 1 — Vérifier les variables d'environnement sur Render

1. Se connecter sur https://dashboard.render.com
2. Ouvrir le service **nopalou-frontend**
3. Aller dans **Environment**
4. Vérifier que ces variables sont définies :

| Variable | Valeur attendue |
|----------|----------------|
| `BACKEND_URL` | URL du backend Render (ex: https://yombale-backend.onrender.com) |
| `JWT_SECRET` | **Même valeur exacte** que `JWT_SECRET` du service yombale-backend |
| `SESSION_SECRET` | Chaîne aléatoire ≥ 32 caractères |
| `NEXT_PUBLIC_BACKEND_URL` | Même URL que BACKEND_URL |

### Étape 2 — Redéployer après modification

Après avoir ajouté les variables → Render redéploie automatiquement (~3 min).

### Étape 3 — Vérifier dans la console navigateur

Ouvrir DevTools (F12) → Network → soumettre le formulaire → chercher la requête POST vers `/api/annonces` → vérifier le code retour :
- **401** → JWT_SECRET incorrect ou manquant
- **0 / Failed** → BACKEND_URL incorrect ou manquant
- **400** → Champ obligatoire manquant (téléphone, titre, catégorie)
- **200/201** → Publication réussie

---

## RÉCAPITULATIF CAMPAGNES

| Campagne | Nb TC | Statut global |
|----------|-------|--------------|
| 1 — Navigation | 4 | |
| 2 — Produits | 5 | |
| 3 — Immobilier | 2 | |
| 4 — Télécom | 1 | |
| 5 — Annonces | 1 | |
| 6 — Authentification | 4 | |
| 7 — **Publication** ⚠️ | 3 | |
| 8 — Mon compte | 4 | |
| 9 — Boutiques | 2 | |
| 10 — Guides | 3 | |
| 11 — Administration | 4 | |
| 12 — PWA & Perfs | 2 | |
| 13 — Pages légales | 1 | |
| **TOTAL** | **36** | |

---

*Généré le 27 juin 2026 — Nopalou v2*
