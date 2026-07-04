# Stratégie commerciale & rentabilité — Nopalou

## 1. Positionnement

Nopalou n'est pas "encore un site d'annonces" — c'est un **comparateur** (prix, immo, télécom) doublé d'un canal de transaction **WhatsApp natif**, dans un marché (Sénégal) où WhatsApp est déjà l'outil de commerce de facto pour les commerçants informels. C'est l'angle différenciant à marteler face à Coinafrique, Expat-Dakar, Jumia et les groupes Facebook Marketplace : eux n'ont pas de comparateur de prix structuré, ni de chatbot d'achat.

**Segments cibles :**
| Segment | Besoin | Produit |
|---|---|---|
| Acheteur particulier | Comparer avant d'acheter | Recherche + alertes prix (gratuit) |
| Vendeur particulier | Vendre un bien/objet | Annonce classifiée (1500 FCFA) |
| Commerçant / boutique | Vitrine en ligne + ventes | Boutique Pro/Business |
| Agence immobilière | Visibilité biens | Annonces immo + sponsoring |
| Comparateurs/médias tiers | Données prix | API partenaire |

## 2. Grille tarifaire actuelle (déjà en base, ajustable sans redéploiement)

| Flux | Prix | Nature |
|---|---|---|
| Annonce classifiée | 1500 FCFA | Ponctuel |
| Sponsoring 30j (immo/produit/boutique) | 5000 FCFA | Ponctuel |
| Boost annonce urgence 7j | 500 FCFA | Ponctuel |
| Abonnement Boutique Pro | 15 000 FCFA/mois | Récurrent |
| Abonnement Boutique Business | 35 000 FCFA/mois + 2% commission | Récurrent |
| API partenaire | Gratuit jusqu'à 1000 req/mois, payant au-delà | Récurrent |

**Recommandation** : ne pas toucher aux prix ponctuels (bas, adaptés au marché sénégalais), mais concentrer l'effort commercial sur les **abonnements récurrents** (Pro/Business) — c'est le seul revenu prévisible qui permet de couvrir les coûts fixes (hosting, WhatsApp Business API, Cloudinary).

## 3. Modèle de rentabilité

### Coûts fixes mensuels estimés
- Hosting Render (backend + DB) : ~25-50 $/mois selon plan
- Cloudinary (images) : gratuit jusqu'à un seuil, puis payant au volume
- Resend (emails transactionnels) : gratuit jusqu'à 3000 emails/mois
- WhatsApp Business API : facturé **à la conversation** par Meta (les 1000 premières conversations/mois sont gratuites, ensuite coût par catégorie de conversation — utilitaire moins cher que marketing)

→ Coût fixe de départ très faible (< 100 $/mois), ce qui laisse une marge confortable : **le seuil de rentabilité peut être atteint avec un petit nombre d'abonnés payants**.

### Seuil de rentabilité (exemple indicatif)
- 5 boutiques Pro (15 000 FCFA) = 75 000 FCFA/mois
- 2 boutiques Business (35 000 FCFA) = 70 000 FCFA/mois
- → ~145 000 FCFA/mois (~240 $) suffit largement à couvrir l'infra de départ, le reste (annonces, sponsoring, boost) est un bonus.

**Priorité n°1 : convertir 5-10 commerçants en Pro/Business dans le premier mois** plutôt que de viser du volume d'annonces gratuites.

## 4. Stratégie de lancement des prix

Un marketplace sans offre n'attire pas de demande — il faut amorcer l'inventaire avant de monétiser agressivement :

- **Phase 1 (semaines 1-4)** : offrir 30 jours d'essai gratuit Pro aux 20-30 premiers commerçants recrutés manuellement (démarchage direct, réseau personnel, marchés/quartiers ciblés). Objectif : remplir la plateforme de contenu réel avant d'ouvrir au grand public.
- **Phase 2 (mois 2)** : activer la facturation Pro/Business normale pour les nouveaux inscrits, garder les early adopters à un tarif préférentiel (fidélisation, bouche-à-oreille).
- **Phase 3 (mois 3+)** : ajuster les prix selon le taux de conversion observé (le panel `/admin/tarifs` permet de tester différents prix sans redéploiement).

## 5. Programme de parrainage

La mécanique existe en base (`parrainages`, `ref_code`) mais la récompense n'est pas encore définie côté produit. Recommandation simple à activer rapidement :
- **1 mois d'abonnement Pro offert** par filleul qui devient payant (boutique) — coût marginal nul pour Nopalou (pas de cash out), effet d'acquisition direct.
- Pour les particuliers : offrir un boost gratuit (500 FCFA de valeur) par filleul inscrit et actif.

## 5bis. Programme apporteur d'affaires (implémenté 4 juillet 2026)

Distinct du parrainage ci-dessus : ici l'apporteur touche une **commission en argent réel**, récurrente, sur les abonnements Pro/Business de boutiques qu'il recrute — pensé pour un réseau de démarcheurs (voir kit dans `/admin/communication`), pas pour l'acquisition virale grand public.

- **Taux** : 10% par défaut, récurrent chaque mois tant que l'abonnement recruté reste actif — paramétrable sans redéploiement (`/admin/apporteurs`, clé settings `apporteur_taux_commission`).
- **Seuil de règlement** : 3000 FCFA cumulés par défaut avant de pouvoir marquer une commission payée (évite les micro-paiements Wave/Orange coûteux en frais) — paramétrable (`apporteur_seuil_paiement`).
- **Parcours** : un utilisateur active le statut apporteur depuis `/compte/apporteur`, reçoit un code unique et un lien à partager (`nopalou.com/boutique?apporteur=CODE`). Le commerçant recruté crée sa boutique via ce lien (ou saisit le code manuellement) ; la boutique est liée à l'apporteur. Chaque paiement d'abonnement réellement encaissé déclenche une ligne de commission ; l'admin règle manuellement (Wave/Orange) et coche "payé" dans `/admin/apporteurs`.
- **Kit apporteur intégré à `/compte/apporteur`** : bouton copier le lien, partage WhatsApp pré-rempli, visuel téléchargeable, guide "Comment ça marche" en 3 étapes et un argumentaire court à dire — pour que l'apporteur n'ait pas besoin de contacter l'équipe pour démarcher efficacement.
- **Découvrabilité** : programme accessible depuis le footer du site (section "Mon compte") et depuis le guide public `/guide-emploi` — plus seulement en connaissant l'URL directement.
- **Hors scope actuel** (voir spec complète) : pas de virement automatique, pas de paliers de commission selon volume, pas de notifications automatiques à l'apporteur.

## 6. Commission Business (2%)

À comparer aux alternatives locales avant lancement massif :
- Jumia prend des commissions vendeur significativement plus élevées (souvent 5-15% selon catégorie)
- Coinafrique/Expat-Dakar n'ont pas de commission (juste annonces payantes)
- 2% + abonnement fixe est positionné comme "juste milieu" — à mettre en avant dans l'argumentaire B2B : "pas de commission cachée, tarif prévisible".

## 7. KPIs à suivre dès le lancement

| KPI | Objectif mois 1 | Où le lire |
|---|---|---|
| Boutiques Pro/Business actives | 10+ | `/admin/tarifs`, DB `boutiques` |
| Annonces publiées (classifieds + immo) | 100+ | Admin annonces/immo |
| Taux conversion visiteur → compte | > 3% | À instrumenter (analytics) |
| Taux annonce gratuite → boostée | > 10% | `commandes` (boost) |
| MRR abonnements | Suivre chaque semaine | `commandes_boutique`, `settings` |
| Conversations WhatsApp actives | Suivre volume (coût Meta) | `/admin/whatsapp` sessions |

## Prochaine étape

Avant tout lancement public, définir concrètement le budget d'acquisition (démarchage terrain à Dakar en priorité — marché le plus dense) et fixer une date de lancement Phase 1 après validation de la checklist technique.
