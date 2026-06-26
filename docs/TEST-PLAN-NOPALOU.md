# 📋 PLAN DE TEST NOPALOU — Format Squash TM
> Version 1.0 — Juin 2026 | Référence : legacy `frontend/` vs Next.js `frontend-next/`
> Testeur : _________________ | Date test : _________________

---

## LÉGENDE STATUTS
| Statut | Signification |
|--------|--------------|
| ✅ PASS | Fonctionnel et conforme au legacy |
| ❌ FAIL | Bug ou comportement incorrect |
| 🔴 MANQUANT | Feature absente du Next.js |
| ⚠️ PARTIEL | Présent mais incomplet |
| ⏭ SKIP | Non applicable / hors périmètre |

---

## CAMPAGNE 1 — NAVIGATION & LAYOUT GLOBAL
> URL de base : http://localhost:3001

### TC-NAV-001 — Logo et accueil
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Ouvrir http://localhost:3001 | Page d'accueil chargée | |
| 2 | Cliquer sur le logo "Nopalou" | Retour à l'accueil (/) | |
| 3 | Vérifier la couleur du logo | "Nopa" en navy #1C2B4A, "lou" en orange #C75B00 | |

### TC-NAV-002 — Liens navbar principaux
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer "Produits" dans la navbar | Redirige vers / | |
| 2 | Cliquer "Immobilier" | Redirige vers /immo | |
| 3 | Cliquer "Télécom" | Redirige vers /telecom | |

### TC-NAV-003 — Barre de recherche navbar
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer l'icône loupe dans la navbar | Input de recherche s'ouvre | |
| 2 | Taper "samsung" et appuyer Entrée | Redirige vers /recherche?q=samsung | |
| 3 | Cliquer ailleurs sans taper | Input se referme | |

### TC-NAV-004 — Boutons d'action navbar (visiteur)
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier les boutons sans être connecté | "+ Déposer" + "Connexion" + "S'inscrire" visibles | |
| 2 | Cliquer "+ Déposer" sans session | Redirige vers /connexion (redirect) | |
| 3 | Cliquer "Connexion" | Redirige vers /connexion | |
| 4 | Cliquer "S'inscrire" | Redirige vers /inscription | |

### TC-NAV-005 — Navbar connecté
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Se connecter avec un compte | Navbar affiche nom utilisateur au lieu de Connexion/S'inscrire | |
| 2 | Cliquer sur le nom/avatar | Dropdown avec "Mon compte" et "Déconnexion" | |
| 3 | Cliquer "Déconnexion" | Session supprimée, retour état visiteur | |

### TC-NAV-006 — ⚠️ Guides dropdown (LEGACY FEATURE)
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher un dropdown "Guides" dans la navbar | Devrait exister avec 3 liens : Guide d'achat / Guide forfait / Guide immo | 🔴 MANQUANT |

### TC-NAV-007 — Footer colonnes
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Scroller jusqu'au footer | Footer visible avec fond navy | |
| 2 | Vérifier colonne "Catégories" | 9 liens : Téléphones, Informatique, TV & Électro, Mode, Maison, Auto & Moto, Télécom, Immobilier, Annonces | |
| 3 | Vérifier colonne "Mon compte" | 6 liens : Connexion, Inscription, Déposer, Mes annonces, Favoris, Profil | |
| 4 | Vérifier colonne "Informations" | 4 liens : Mentions légales, Confidentialité, CGU, Boutiques | |
| 5 | Vérifier icônes réseaux sociaux | f / 𝕏 / ▣ cliquables | |
| 6 | Vérifier copyright | "© 2026 Nopalou — Dakar, Sénégal" | |

### TC-NAV-008 — Compare Bar sticky
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Ajouter un produit à la comparaison (⚖) | Barre bleue apparaît en bas de l'écran | |
| 2 | Ajouter un 2e produit | Barre affiche 2 items | |
| 3 | Cliquer "Comparer" | Redirige vers /comparaison?ids=... | |
| 4 | Cliquer ✕ | Barre disparaît, comparaison vidée | |

---

## CAMPAGNE 2 — PAGE D'ACCUEIL PRODUITS
> URL : http://localhost:3001

### TC-HOME-001 — Hero section
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier le titre hero | "Meilleur prix au Sénégal" ou équivalent | |
| 2 | Vérifier la barre de recherche centrale | Input visible avec placeholder | |
| 3 | Vérifier les stats strip | 4 indicateurs : sites partenaires / produits / gratuit / zones | |

### TC-HOME-002 — Filtres catégories
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier les pills de catégories | Au moins 8 catégories visibles | |
| 2 | Cliquer "Téléphones" | Filtre actif, grille mise à jour | |
| 3 | Cliquer "Immobilier" | Redirige vers /immo | |
| 4 | Cliquer "Annonces" | Redirige vers /annonces | |
| 5 | Cliquer "Télécom & Forfaits" | Redirige vers /telecom | |

### TC-HOME-003 — Filtres budget
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer "< 5 000 FCFA" | Produits filtrés prixMax=5000 | |
| 2 | Cliquer "5k – 15k" | Filtre prixMin=5000&prixMax=15000 | |
| 3 | Cliquer un budget actif | Filtre retiré, tous les produits | |

### TC-HOME-004 — Recherche produits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Taper "Samsung Galaxy" dans la recherche | Produits Samsung affichés | |
| 2 | Taper "iphone" (minuscule) | Produits iPhone affichés (insensible à la casse) | |
| 3 | Taper une requête sans résultat | Message "Aucun produit trouvé" | |
| 4 | Effacer la recherche | Tous les produits affichés | |

### TC-HOME-005 — Grille produits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier l'affichage des cartes | Image + nom + marque + prix + nb offres | |
| 2 | Vérifier le badge économie | Badge "-X%" si écart prix min/max | |
| 3 | Cliquer sur une carte produit | Redirige vers /produit/[id] | |
| 4 | Vérifier les boutons ⚖ et ❤ | Présents sur chaque carte | |

### TC-HOME-006 — ⚠️ Tri produits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher un sélecteur de tri | Devrait avoir : Pertinence / Prix ↑ / Prix ↓ / A→Z | ⚠️ PARTIEL |
| 2 | Tri Prix croissant | Produits réordonnés prix le plus bas en premier | |
| 3 | Tri Prix décroissant | Produits réordonnés prix le plus haut en premier | |

### TC-HOME-007 — ⚠️ Vue liste / grille
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher un bouton switch vue | Bouton Grille / Liste | 🔴 MANQUANT |
| 2 | Cliquer "Vue liste" | Cartes en mode horizontal compact | 🔴 MANQUANT |

### TC-HOME-008 — Pagination / chargement
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Scroller jusqu'en bas de la grille | Pagination ou bouton "Charger plus" | |
| 2 | Cliquer page suivante | Produits suivants chargés | |

### TC-HOME-009 — ⚠️ Dashboard analyse (après recherche)
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher "écouteurs" | Dashboard KPIs : prix min/max/moy + nb produits | 🔴 MANQUANT |
| 2 | Vérifier histogrammes marques | Graphique barres par marque avec prix min | 🔴 MANQUANT |
| 3 | Vérifier recommandations rapides | "Meilleur prix" / "Meilleur rapport Q/P" / "Milieu gamme" | 🔴 MANQUANT |

---

## CAMPAGNE 3 — FICHE PRODUIT
> URL : http://localhost:3001/produit/[id]

### TC-PRODUIT-001 — Affichage général
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer sur un produit depuis l'accueil | Page fiche produit chargée | |
| 2 | Vérifier breadcrumb | Accueil › Catégorie › Nom produit | |
| 3 | Vérifier image produit | Image affichée (ou placeholder) | |
| 4 | Vérifier prix minimum | Box verte avec prix min + nb marchands | |
| 5 | Vérifier trust badges | 🔒 Sécurisé / 🚚 Livraison / ✅ Prix vérifiés | |

### TC-PRODUIT-002 — Section offres
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier la liste des offres | Au moins 1 offre avec marchand + prix + lien | |
| 2 | Vérifier badge "Meilleur prix" | 🏆 sur l'offre la moins chère | |
| 3 | Cliquer "Voir l'offre" | Lien externe vers le marchand | |
| 4 | Vérifier badge "Prix suspect" | ⚠️ si prix aberrant détecté | |

### TC-PRODUIT-003 — ⚠️ Historique des prix
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher un onglet ou section "Historique" | Graphique/tableau 90 derniers jours | 🔴 MANQUANT |
| 2 | Vérifier courbe de prix | Points par date avec prix | 🔴 MANQUANT |

### TC-PRODUIT-004 — ⚠️ Produits similaires
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Scroller jusqu'en bas de la fiche | Section "Produits similaires" ou "Vous aimerez aussi" | 🔴 MANQUANT |
| 2 | Vérifier 4-6 produits recommandés | Même marque ou même catégorie / gamme de prix | 🔴 MANQUANT |

### TC-PRODUIT-005 — Favoris
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer ❤ sur la fiche produit | Produit ajouté aux favoris, bouton change d'état | |
| 2 | Aller sur /favoris | Produit présent dans la liste | |
| 3 | Cliquer "Retirer" sur /favoris | Produit supprimé de la liste | |

### TC-PRODUIT-006 — Alerte prix
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier la sidebar droite | Bouton "🔔 Créer alerte prix" présent | |
| 2 | Cliquer le bouton | Formulaire avec prix cible (pré-rempli 90% prix min) | |
| 3 | Connecté : soumettre l'alerte | Message succès + alerte créée | |
| 4 | Non connecté : cliquer | Redirection vers /connexion | |

### TC-PRODUIT-007 — Ajout comparaison depuis fiche
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer ⚖ sur la fiche | Produit ajouté, Compare Bar apparaît | |
| 2 | Ajouter 3 produits | Max 3, alerte si dépassé | |

---

## CAMPAGNE 4 — COMPARAISON PRODUITS
> URL : http://localhost:3001/comparaison?ids=...

### TC-COMP-001 — Accès page comparaison
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Sélectionner 2 produits avec ⚖ | Compare Bar visible | |
| 2 | Cliquer "Comparer" | Page /comparaison avec table | |
| 3 | Accéder sans ids dans l'URL | Message "Sélectionnez 2 produits minimum" | |

### TC-COMP-002 — Table de comparaison
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier en-têtes | Images + noms des produits | |
| 2 | Vérifier ligne "Prix le plus bas" | Colonne du moins cher surlignée en vert | |
| 3 | Vérifier "Nombre d'offres" | Compte des marchands par produit | |
| 4 | Vérifier "Top 3 offres" | Mini-cartes avec marchand + prix | |
| 5 | Vérifier CTA "Voir la fiche" | Lien vers /produit/[id] par colonne | |

### TC-COMP-003 — Comparaison 3 produits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Comparer 3 produits | Table à 3 colonnes | |
| 2 | Vérifier "Meilleur prix" | Badge sur le moins cher | |

---

## CAMPAGNE 5 — FAVORIS
> URL : http://localhost:3001/favoris

### TC-FAV-001 — Page favoris vide
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder à /favoris sans favoris | Message "Vous n'avez pas encore de favoris" + lien browse | |

### TC-FAV-002 — Favoris avec produits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Ajouter 3 produits en favori | Accéder à /favoris | |
| 2 | Vérifier affichage | Grille avec image + nom + prix + boutons | |
| 3 | Cliquer "Voir les offres" | Redirige vers /produit/[id] | |
| 4 | Cliquer "Retirer" | Produit supprimé de la liste et du localStorage | |
| 5 | Recharger la page | Favoris persistants (localStorage) | |

---

## CAMPAGNE 6 — IMMOBILIER
> URL : http://localhost:3001/immo

### TC-IMMO-001 — Filtres page immo
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier toggle Location/Vente | Deux options cliquables | |
| 2 | Cliquer "Vente" | Annonces de vente chargées, gammes de prix changent | |
| 3 | Filtrer par type de bien "Appartement" | Seulement les appartements | |
| 4 | Filtrer budget "<100 000 FCFA" (location) | Annonces dans la tranche | |
| 5 | Trier par "Prix ↑" | Annonces du moins cher au plus cher | |
| 6 | Trier par "Surface ↓" | Annonces les plus grandes d'abord | |

### TC-IMMO-002 — Grille annonces immo
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier une carte immo | Image + titre + localisation + surface + prix | |
| 2 | Vérifier badge transaction | "Location" en bleu ou "Vente" en vert | |
| 3 | Vérifier badge "Sponsorisée" | Badge doré si sponsorisée | |
| 4 | Cliquer sur une carte | Redirige vers /immo/[id] | |

### TC-IMMO-003 — Fiche annonce immo
> URL : http://localhost:3001/immo/[id]
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier hero image | Image pleine largeur | |
| 2 | Vérifier breadcrumb | Accueil › Immobilier › Titre | |
| 3 | Vérifier caractéristiques | Type bien · surface · pièces · chambres | |
| 4 | Vérifier prix affiché | Montant + /mois si location | |
| 5 | Vérifier description | Texte complet de l'annonce | |
| 6 | Vérifier contact | Nom + téléphone vendeur | |
| 7 | Lien "Voir l'annonce originale" | Lien externe si source scrapée | |

### TC-IMMO-004 — ⚠️ Wizard immobilier
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher un bouton "Trouver mon logement" ou wizard | Wizard budget + type + quartier → résultats | 🔴 MANQUANT |

### TC-IMMO-005 — ⚠️ Annonces similaires immo
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Scroller en bas de /immo/[id] | Section "Annonces similaires dans le quartier" | 🔴 MANQUANT |

---

## CAMPAGNE 7 — TÉLÉCOM & FORFAITS
> URL : http://localhost:3001/telecom

### TC-TEL-001 — Filtres télécom
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier badges opérateurs | Tous / Orange / Free / Expresso / Wave | |
| 2 | Cliquer "Orange" | Seulement les forfaits Orange | |
| 3 | Filtrer par type "Internet" | Seulement les forfaits data | |
| 4 | Tri "Plus de data ↓" | Forfaits avec le plus de data d'abord | |

### TC-TEL-002 — Cartes forfaits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier une carte forfait | Badge opérateur coloré + data/min/sms/validité + prix | |
| 2 | Vérifier formatage data | "X Go" si ≥ 1024 Mo, sinon "X Mo" | |
| 3 | Cliquer "Voir l'offre" | Lien externe ou détail | |

### TC-TEL-003 — ⚠️ Scoring et badge Recommandé
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher un badge "🏆 Recommandé" | Badge sur le meilleur forfait par profil et validité | 🔴 MANQUANT |
| 2 | Chercher onglets profil | Internet / Appels / Mixte → reorder forfaits | 🔴 MANQUANT |
| 3 | Groupage par validité | Groupe 1j / 7j / 30j avec recommandé par groupe | 🔴 MANQUANT |

### TC-TEL-004 — ⚠️ Wizard "Trouver mon forfait"
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher bouton "🎯 Trouver mon forfait" | Bouton dans les filtres | 🔴 MANQUANT |
| 2 | Saisir budget max 3 000 FCFA | Formulaire budget | 🔴 MANQUANT |
| 3 | Choisir usage "Internet" | Forfaits data filtrés et scorés | 🔴 MANQUANT |
| 4 | Voir résultats | Liste scorée par critères | 🔴 MANQUANT |

### TC-TEL-005 — ⚠️ Comparaison forfaits
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Sélectionner 2-3 forfaits | Bouton ⚖ sur chaque carte | 🔴 MANQUANT |
| 2 | Ouvrir comparaison forfaits | Table : prix/jour, data%, min%, prix/Go, prix/min | 🔴 MANQUANT |
| 3 | Vérifier verdict par profil | "Meilleur choix", "Moins cher", "Plus de data" | 🔴 MANQUANT |

---

## CAMPAGNE 8 — ANNONCES CLASSIFIÉES
> URL : http://localhost:3001/annonces

### TC-ANN-001 — Page listing annonces
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder à /annonces | Page avec titre + grille d'annonces | |
| 2 | Vérifier le compte total | "X annonces" affiché | |
| 3 | Vérifier le bouton "Déposer une annonce" | Bouton orange en haut à droite | |

### TC-ANN-002 — Filtres catégories annonces
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer "Téléphones" | Filtre actif, annonces smartphones | |
| 2 | Cliquer "Mode" | Annonces vêtements/chaussures | |
| 3 | Cliquer "Toutes" | Toutes les annonces | |
| 4 | Vérifier pill actif | Fond orange sur la catégorie sélectionnée | |

### TC-ANN-003 — Cartes annonces
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier une carte | Image (ou emoji placeholder) + titre + prix + ville + date | |
| 2 | Vérifier badge catégorie | Overlay en bas à gauche de l'image | |
| 3 | "Prix à négocier" si pas de prix | Affiché en vert | |
| 4 | Cliquer la carte | Redirige vers /annonces/[id] | |

### TC-ANN-004 — Pagination annonces
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Si > 24 annonces | Boutons Précédent / Page X / Y / Suivant | |
| 2 | Cliquer "Suivant" | Page 2 chargée, URL ?page=2 | |

### TC-ANN-005 — Détail annonce
> URL : http://localhost:3001/annonces/[id]
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer sur une annonce | Page /annonces/[id] chargée | |
| 2 | Vérifier breadcrumb | Accueil › Annonces › Catégorie › Titre | |
| 3 | Vérifier galerie photos | Photo principale + miniatures si > 1 | |
| 4 | Vérifier badge catégorie | Pill orange avec le nom de catégorie | |
| 5 | Vérifier titre et localisation | Titre H1 + ville + quartier + date | |
| 6 | Vérifier prix | Box verte avec montant ou "Prix à négocier" | |
| 7 | Vérifier description | Texte complet | |
| 8 | Vérifier caractéristiques | Tableau marque/état/etc. si disponibles | |
| 9 | Vérifier sidebar contact | Card navy avec nom vendeur + tel + WhatsApp | |
| 10 | Cliquer numéro téléphone | Lance l'appel (tel:) | |
| 11 | Cliquer "WhatsApp" | Ouvre WhatsApp avec message pré-rempli | |
| 12 | Vérifier avertissement | "Ne payez jamais à l'avance" visible | |

### TC-ANN-006 — Dépôt annonce
> URL : http://localhost:3001/deposer-annonce
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder sans session | Redirige vers /connexion | |
| 2 | Se connecter puis accéder | Formulaire 3 étapes visible | |
| 3 | Étape 1 : choisir "Téléphones" | Passe à l'étape 2 avec champs marque/état | |
| 4 | Étape 2 : remplir titre + prix + ville | Champs validés | |
| 5 | Étape 3 : ajouter une photo | Preview de la photo | |
| 6 | Soumettre | Annonce créée (si quota ok : active, sinon paiement) | |

---

## CAMPAGNE 9 — PAIEMENT
> URL : http://localhost:3001/payer-annonce/[id]

### TC-PAY-001 — Page paiement annonce
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Avoir une annonce non payée dans /mes-annonces | Bouton "💳 Activer" | |
| 2 | Cliquer "Activer" | Page /payer-annonce/[id] | |
| 3 | Vérifier montant | 1 500 FCFA affiché | |
| 4 | Vérifier options | Wave (cyan) + Orange Money (orange) | |
| 5 | Cliquer "Wave" | Redirection vers checkout Wave | |
| 6 | Revenir après paiement | Page succès /paiement/succes | |

### TC-PAY-002 — Pages retour paiement
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /paiement/succes | ✅ "Paiement confirmé" + référence | |
| 2 | Accéder /paiement/erreur | ❌ "Paiement annulé" + aucun débit | |
| 3 | Liens CTA succès | "Voir mes annonces" + "Déposer une autre" | |

---

## CAMPAGNE 10 — AUTHENTIFICATION
> URLs : /connexion · /inscription

### TC-AUTH-001 — Connexion
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder à /connexion | Formulaire email + mot de passe | |
| 2 | Saisir mauvais identifiants | Message d'erreur "Email ou mot de passe incorrect" | |
| 3 | Saisir bons identifiants | Redirection vers / (ou page précédente) + session créée | |
| 4 | Accéder /connexion déjà connecté | Redirige vers /compte | |

### TC-AUTH-002 — Inscription
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder à /inscription | Formulaire nom + email + mot de passe | |
| 2 | Email déjà utilisé | Message "Email déjà utilisé" | |
| 3 | Mot de passe < 6 caractères | Validation erreur | |
| 4 | Inscription réussie | Compte créé + session + redirection | |

---

## CAMPAGNE 11 — COMPTE UTILISATEUR
> URL : http://localhost:3001/compte

### TC-COMPTE-001 — Dashboard compte
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /compte sans session | Redirige vers /connexion | |
| 2 | Accéder /compte connecté | Avatar + "Bonjour, {nom}" + grille 5 cartes | |
| 3 | Vérifier les 5 cartes | Mes annonces / Ma boutique / Favoris / Déposer / Mon profil | |

### TC-COMPTE-002 — Mon profil
> URL : http://localhost:3001/compte/profil
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer "Mon profil" | Page profil avec nom + email (lecture seule) | |
| 2 | Cliquer "Réinitialiser mon mot de passe" | Email de reset envoyé | |
| 3 | Cliquer "Se déconnecter" | Session supprimée + redirection | |

### TC-COMPTE-003 — Mes annonces
> URL : http://localhost:3001/mes-annonces
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder sans annonce | Message vide + bouton "Déposer" | |
| 2 | Annonce active | Badge vert "Active" | |
| 3 | Annonce en attente | Badge orange "En attente" | |
| 4 | Annonce rejetée | Badge rouge "Rejetée" | |
| 5 | Annonce non payée | Badge + bouton "💳 Activer (1 500 FCFA)" | |
| 6 | Cliquer "Supprimer" | Confirmation + suppression | |

### TC-COMPTE-004 — Ma boutique
> URL : http://localhost:3001/boutique
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder sans boutique | Placeholder "Créez votre boutique" | |
| 2 | Créer une boutique | Formulaire : nom + description + catégorie + tel + ville | |
| 3 | Max 3 boutiques | Bouton "+" désactivé après 3 | |

---

## CAMPAGNE 12 — GUIDES D'ACHAT ⚠️
> ENTIÈREMENT MANQUANT DANS NEXT.JS

### TC-GUIDE-001 — Guide d'achat intelligent
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder aux guides depuis la navbar | Dropdown "Guides" avec 3-4 options | 🔴 MANQUANT |
| 2 | Cliquer "Guide d'achat" | Wizard : type de produit → budget → usage → recommandations | 🔴 MANQUANT |

### TC-GUIDE-002 — Guide forfait télécom
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer "Guide forfait" dans navbar ou page télécom | Wizard : budget max + usage + minimums → résultats scorés | 🔴 MANQUANT |
| 2 | Renseigner budget 5 000 FCFA + usage Internet | Forfaits data filtrés et classés | 🔴 MANQUANT |
| 3 | Changer le profil (Appels) | Résultats recalculés | 🔴 MANQUANT |

### TC-GUIDE-003 — Guide immobilier
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Cliquer "Guide immobilier" | Wizard : ville + type + budget + surface → annonces filtrées | 🔴 MANQUANT |

---

## CAMPAGNE 13 — RECHERCHE GLOBALE
> URL : http://localhost:3001/recherche?q=...

### TC-SEARCH-001 — Page recherche
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /recherche?q=samsung | Résultats groupés Produits + Annonces | |
| 2 | Vérifier section Produits | Grid cards avec image + nom + prix | |
| 3 | Vérifier section Annonces | Grid cards avec image + titre + ville | |
| 4 | Recherche sans résultat | "Aucun résultat pour X" | |
| 5 | /recherche sans ?q | "Tapez un mot-clé" | |
| 6 | Cliquer un produit | Redirige vers /produit/[id] | |

### TC-SEARCH-002 — ⚠️ Autocomplete
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Taper 2 caractères dans la barre de recherche | Suggestions dropdown apparaissent | 🔴 MANQUANT |
| 2 | Cliquer une suggestion | Recherche lancée avec ce terme | 🔴 MANQUANT |

---

## CAMPAGNE 14 — ADMINISTRATION
> URL : http://localhost:3001/admin

### TC-ADMIN-001 — Connexion admin
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /admin | Redirige vers /admin/login | |
| 2 | Saisir mauvais secret | Message "Secret incorrect" | |
| 3 | Saisir bon secret (ADMIN_SECRET du .env) | Redirige vers /admin (dashboard) | |
| 4 | Cookie expiré après 8h | Redirige vers /admin/login | |

### TC-ADMIN-002 — Dashboard stats
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier les 6 KPI cards | Produits / Annonces total / Actives / En attente / Rejetées / Immo | |
| 2 | Badge "Modérer" avec count | Badge orange si annonces en attente > 0 | |
| 3 | Navigation sidebar | Dashboard / Annonces classifiées / Immo à valider | |

### TC-ADMIN-003 — Modération annonces
> URL : http://localhost:3001/admin/annonces
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier sections | En attente / Actives / Rejetées | |
| 2 | Cliquer "Approuver" | Annonce passe en active (refresh) | |
| 3 | Cliquer "Désactiver" | Annonce désactivée | |
| 4 | Cliquer "Réactiver" sur rejetée | Annonce réactivée | |

### TC-ADMIN-004 — Modération immo
> URL : http://localhost:3001/admin/immo
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Vérifier liste annonces immo utilisateurs | Annonces source='utilisateur' actif=false | |
| 2 | Cliquer "Valider" | Annonce activée et visible sur /immo | |
| 3 | Cliquer "Désactiver" | Annonce cachée | |

### TC-ADMIN-005 — ⚠️ Gestion télécom
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher onglet "Télécom" dans sidebar admin | CRUD forfaits | 🔴 MANQUANT |

### TC-ADMIN-006 — ⚠️ Gestion partenaires
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Chercher onglet "Partenaires" dans sidebar admin | Approuver/rejeter demandes | 🔴 MANQUANT |

---

## CAMPAGNE 15 — PAGES LÉGALES & CONTENU STATIQUE

### TC-LEGAL-001 — Pages légales
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /mentions-legales | Page avec sections éditeur + hébergement + responsabilité | |
| 2 | Accéder /confidentialite | Page avec données collectées + droits utilisateur | |
| 3 | Accéder /cgu | Page avec conditions annonces + paiement + comportements | |
| 4 | Liens depuis le footer | Tous les 3 liens fonctionnels | |

### TC-LEGAL-002 — ⚠️ Page Contact
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /contact | Formulaire de contact ou email | 🔴 MANQUANT |

### TC-LEGAL-003 — ⚠️ Page À propos
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /a-propos | Présentation de Nopalou | 🔴 MANQUANT |

---

## CAMPAGNE 16 — SEO & PERFORMANCE

### TC-SEO-001 — Métadonnées
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | View Source de / | `<title>Nopalou — Comparateur de prix Sénégal</title>` | |
| 2 | View Source /produit/[id] | `<title>` contient nom du produit | |
| 3 | Vérifier meta description | Présente sur toutes les pages principales | |
| 4 | Vérifier og:image | Image Open Graph définie | |

### TC-SEO-002 — Robots et sitemap
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /robots.txt | Disallow: /compte/, /mes-annonces, etc. + lien sitemap | |
| 2 | Accéder /sitemap.xml | Liste des URLs statiques + produits + immo | |

### TC-SEO-003 — PWA Manifest
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /manifest.json | JSON valide avec name, icons, theme_color #C75B00 | |
| 2 | Vérifier installabilité | Chrome DevTools → Application → Manifest | |

### TC-SEO-004 — Performance loading
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Accéder /immo pendant chargement | Skeleton animé shimmer visible | |
| 2 | Accéder /telecom pendant chargement | Skeleton visible | |
| 3 | Simuler erreur réseau | Page error.tsx avec "Réessayer" | |

---

## CAMPAGNE 17 — RESPONSIVE MOBILE
> Tester à 375px (iPhone SE) et 768px (tablet)

### TC-MOBILE-001 — Navbar mobile
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Réduire à 375px | Liens navbar cachés, boutons action compacts | |
| 2 | Vérifier barre de recherche | Bouton loupe visible et fonctionnel | |
| 3 | Vérifier "+ Déposer" | Toujours visible et cliquable | |

### TC-MOBILE-002 — Grille produits mobile
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Grille à 375px | 2 colonnes minimum | |
| 2 | Grille à 768px | 3 colonnes | |

### TC-MOBILE-003 — Annonce détail mobile
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Fiche annonce à 375px | Layout 1 colonne (sidebar dessous) | |
| 2 | Boutons contact visibles | Tel + WhatsApp accessibles sans scroll excessif | |

### TC-MOBILE-004 — Footer mobile
| # | Étape | Résultat attendu | Statut |
|---|-------|-----------------|--------|
| 1 | Footer à 375px | Colonnes empilées verticalement | |

---

## RÉCAPITULATIF EXÉCUTIF

### Comptage statuts (à remplir après tests)
| Statut | Nombre | % |
|--------|--------|---|
| ✅ PASS | | |
| ❌ FAIL | | |
| 🔴 MANQUANT | 21 | |
| ⚠️ PARTIEL | 4 | |
| **TOTAL cas de test** | **~120** | |

### Features MANQUANTES identifiées (21)
| ID | Feature manquante | Sprint prévu |
|----|------------------|-------------|
| TC-NAV-006 | Dropdown Guides (navbar) | Sprint 15/16 |
| TC-HOME-007 | Switch vue liste/grille | Sprint 16 |
| TC-HOME-009 | Dashboard analyse recherche (KPIs + histogrammes) | Backlog |
| TC-PRODUIT-003 | Historique des prix (graphique 90j) | Sprint 14 |
| TC-PRODUIT-004 | Produits similaires | Sprint 14 |
| TC-IMMO-004 | Wizard immobilier | Backlog |
| TC-IMMO-005 | Annonces similaires sur fiche immo | Sprint 14 |
| TC-TEL-003 | Scoring + badge Recommandé + profils | Sprint 15 |
| TC-TEL-004 | Wizard "Trouver mon forfait" | Sprint 15 |
| TC-TEL-005 | Comparaison forfaits télécom | Sprint 15 |
| TC-GUIDE-001 | Guide d'achat intelligent | Sprint 15/16 |
| TC-GUIDE-002 | Guide forfait télécom | Sprint 15 |
| TC-GUIDE-003 | Guide immobilier | Backlog |
| TC-SEARCH-002 | Autocomplete suggestions | Sprint 16 |
| TC-ADMIN-005 | Admin gestion télécom | Sprint 16 |
| TC-ADMIN-006 | Admin gestion partenaires | Sprint 16 |
| TC-LEGAL-002 | Page Contact | Sprint 16 |
| TC-LEGAL-003 | Page À propos | Sprint 16 |
| TC-HOME-006 | Tri produits UI complet | Sprint 16 |
| TC-IMMO-001 | Filtres immo (villes API) | Sprint 14 |
| TC-TEL-003b | Groupage forfaits par validité | Sprint 15 |
