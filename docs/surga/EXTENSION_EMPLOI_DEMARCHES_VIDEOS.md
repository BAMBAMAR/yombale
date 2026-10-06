# EXTENSION — Alertes vidéos, Emploi, Démarches administratives (Tranches 17 à 20)

> **Statut : version finale, décisions validées (points ouverts en section 10).** Surga est déjà en production (tranches 1 à 16 et remédiations livrées). Ce document décrit uniquement ce qui s'ajoute. En cas de conflit avec le code réel, l'audit de la section 2 prime. Les numéros de décision sont provisoires (`D-NEW-x`) : à renuméroter dans `docs/surga/DECISIONS.md`.

---

## 1. Règles héritées (non négociables)
- **Discussion libre avec l'IA uniquement dans l'app**. WhatsApp reste limité aux notifications et aux commandes structurées (politique Meta sur l'API Business). L'entretien et le CV ne sont donc **pas** proposés en conversation WhatsApp.
- **Vouvoiement strict (D19)**, zéro émoji, icônes Lucide, tokens de `DESIGN_SYSTEM_SURGA.md`, composants < 450 lignes, montants en FCFA.
- **Aucun calcul par un modèle d'IA**.
- **Anti-IDOR** : `verifierToken` sur toute route privée, jamais d'identification par `?phone=` (leçon de CORR-P0-01).
- **Toute nouvelle table est ajoutée à l'export et à la purge** de `donnees-service.js` (leçon de Sama Xaalis, ajouté après coup à l'export).
- **Tout paiement est vérifié côté serveur** (session Wave complete ou webhook signé HMAC) avant de débloquer quoi que ce soit (leçon de CORR-P0-02).
- **Chaque appel d'IA ou de transcription est compté et plafonné**. Aucun contenu personnel en clair dans les logs.
- **Les nouvelles briques sont activables** (onboarding et Paramètres) et n'encombrent pas l'accueil : affichage conditionnel.

---

## 1 bis. Modèle gratuit et payant (toutes les nouvelles briques)

### Principes
1. **Chaque brique a une part gratuite réellement utile** : sans elle, l'habitude quotidienne ne s'installe pas.
2. **On limite ce qui coûte réellement** (appels d'IA, messages WhatsApp facturés par Meta, génération de documents), pas l'accès de base.
3. **Les limites sont appliquées côté serveur, jamais seulement dans l'interface**. Un service unique de droits (plan, limites, compteurs d'usage `surga_usages`) lit sa configuration dans l'onglet Plans de l'administration, déjà dynamique. C'est aussi l'occasion de n'avoir qu'une seule source de vérité pour les quotas, ce qui règle l'incohérence 2 contre 20.
4. **Au moment d'une limite, un message sobre explique ce qui est atteint et ce que le Premium débloque**, sans blocage silencieux. Hors limite, les fonctions payantes restent masquées plutôt que grisées avec un cadenas.
5. **Prix** : le Premium existant (1 500 FCFA par mois, 15 000 FCFA par an) reste la référence. Achat à l'acte d'un CV sans mention : **500 FCFA** (décidé), à ajuster selon les résultats.

### Tableau Référentiel des Quotas & Droits

| Brique | Gratuit | Payant (Premium ou à l'acte) |
|---|---|---|
| **Séries et lutte** | Suivre jusqu'à 3 sources, alertes dans l'app et le briefing | Sources illimitées, alertes WhatsApp (messages facturés), alertes prioritaires |
| **CV et lettres** | Profil complet, 1 CV avec un modèle sobre et une mention discrète en pied de page, 1 lettre par mois | Sans mention, tous les modèles, lettres dans un plafond d'usage raisonnable, plusieurs versions ; ou achat à l'acte (500 FCFA) d'un document sans mention |
| **Entretien** | Banque de questions types par secteur (sans IA, coût nul) et 1 simulation par semaine | Plus de simulations (plafond journalier), dictée vocale, retour détaillé, fiches de révision enregistrées |
| **Démarches** | Toutes les fiches (intérêt public, confiance, acquisition), checklist en Notes, 1 suivi avec rappel | Suivis et rappels d'échéance illimités |

*Les seuils et prix de ce tableau sont des points de départ : ils se fixent après mesure du coût réel d'une session d'IA et d'un document généré.*

---

## 2. Audit préalable de l'agent (lecture seule, avant toute ligne de code)
- [x] **Notifications serveur** : existe-t-il du Web Push (VAPID, table de souscriptions) ? D'après le journal, les rappels sont planifiés côté client (`surga-reminders.ts`), ce qui ne suffit pas pour alerter quand l'app est fermée. À confirmer.
- [x] **PDF** : un générateur existe-t-il déjà (quittances OHADA du pôle immobilier) ? Le réutiliser (`pdfkit` présent et déjà en production).
- [x] **Paiement ponctuel** : `abonnement-service.js` gère des abonnements ; un achat à l'acte est-il réalisable avec la même vérification de session Wave ?
- [x] **Client d'IA** : fournisseur, mesure des coûts, quotas, journalisation sans contenu.
- [x] **Patterns à réutiliser** : `surga-cross-actions.ts` (passerelles et toggles), checklist des concours, onglets de la console admin, `donnees-service.js`, `cron-surga-rss.js`.
- [x] **Incohérence de quota** : `CORR-P1-06` fixe 2 commandes gratuites par jour sur WhatsApp, alors que la console admin affiche 20 par jour (`AdminConfigTab`, `AdminComptesTab`). Une seule valeur doit faire foi, lue depuis un seul endroit. **Valeur retenue par défaut : 2 par jour (celle du code), modifiable depuis l'administration.**

---

## 3. Tranche 17 — Séries et lutte : alertes vidéos
*(Statut : 100% DONE — Livré et committé le 2026-10-06)*

### Objectif
L'utilisateur choisit les séries et les lutteurs ou événements qu'il suit, et reçoit une alerte quand une nouvelle vidéo sort.

### Principes
- Surga ne héberge et ne copie aucune vidéo : titre, lien et date uniquement, avec lien sortant vers la plateforme.
- Plateforme de départ : YouTube, qui propose un flux par chaîne (flux Atom XML via Cheerio, sans clé API payante). Facebook et TikTok n'offrent pas de flux équivalent simple : hors périmètre de cette tranche.
- Catalogue des séries et chaînes tenu par l'administration (nouvel onglet), pas par l'IA.
- Pas de miniatures par défaut (Low-Data).

### Données
- `surga_video_sources` : id, type (`SERIE`, `LUTTE`, `AUTRE`), nom, plateforme, identifiant du flux, actif.
- `surga_video_items` : id, source_id, titre, url, publie_le. Dédoublonnage par URL unique.
- `surga_video_abonnements` : user_id, source_id, canal.

### Fonctionnement
- Collecte via le cron existant (cycle de 30 minutes), sans nouveau processus.
- Alerte : push web si disponible, sinon dans le briefing de l'app. Message WhatsApp uniquement par modèle approuvé et avec opt-in explicite, car ces messages sont facturés par Meta.
- Lutte : combats annoncés et résultats rejoignent la brique Sport si une source fiable existe ; sinon, alertes vidéos seulement.
- Passerelle : un épisode ou un combat peut créer un rappel dans l'agenda.

### Critères d'acceptation
L'utilisateur suit une série, un nouvel épisode inséré en base déclenche une alerte dans le délai du cycle de collecte, le désabonnement coupe l'alerte, et l'export et la purge incluent ses abonnements.

---

## 4. Tranche 18 — Emploi : profil professionnel, CV et lettres de motivation

### Données
- `surga_profil_pro` : user_id, coordonnées, résumé, expériences, formations, compétences, langues (structure JSON versionnée).
- `surga_documents_emploi` : id, user_id, type (`CV`, `LETTRE`), titre, contenu, modèle, dates.
- `surga_usages` : user_id, service (`cv_generation`, `lettre_generation`, `entretien_simulation`), periode (`AAAA-MM` ou date), quantite, updated_at.

### Règles de l'IA & Zéro-Hallucination
- Elle reformule et met en forme **uniquement** ce que l'utilisateur a fourni. Elle n'invente ni diplôme, ni employeur, ni date, ni chiffre. Si une information manque, elle la demande.
- Case obligatoire « J'ai relu et je confirme l'exactitude » avant le téléchargement.
- Lettre : entrée = profil + texte de l'offre collé par l'utilisateur ; ton formel, vouvoiement.

### Sortie
- PDF léger, deux modèles sobres, sans photo par défaut (photo optionnelle en AVIF).
- Réutiliser le générateur PDF existant (`pdfkit`).
- **Langue : français uniquement au lancement. L'anglais est une évolution future, hors périmètre.**

### Monétisation
- Mix gratuit, achat à l'acte et Premium, voir la section 1 bis. Le PDF final n'est généré qu'après vérification serveur du droit d'accès (plan ou paiement).
- **Achat à l'acte (option A retenue) : 500 FCFA pour un CV sans mention, en plus du Premium**, payé par Wave ou Orange Money, avec vérification de la session ou du webhook signé avant de générer le PDF.
- Par défaut : le droit acheté couvre ce document et ses retouches, pas un autre document.

### Données sensibles
- Consentement dédié, suppression et export complets, pas de contenu en clair dans les logs.

### Critères d'acceptation
Un profil incomplet bloque la génération avec un message clair ; aucune donnée absente du profil ne figure dans le document ; un utilisateur ne peut jamais lire le document d'un autre (test IDOR) ; export et purge couvrent profil et documents.

---

## 5. Tranche 19 — Préparation à l'entretien

### Parcours (dans l'app uniquement)
1. Choix du poste ou du secteur, offre facultative.
2. Questions types : générales, de motivation, comportementales, adaptées au poste.
3. Simulation en questions-réponses, au clavier ou à la voix via le moteur vocal existant.
4. Retour structuré : clarté, structure, exemples concrets, points à approfondir. Aucune note chiffrée présentée comme objective, aucune promesse de résultat.
5. Fiche de révision enregistrable en Notes.

### Passerelles
- Date d'entretien vers l'Agenda, avec rappel la veille.
- Checklist du jour (pièces, trajet) vers Notes ; budget transport vers Sama Xaalis.
- Réutilise le profil et l'offre de la brique CV.

### Confidentialité et coûts
Sessions non conservées par défaut (enregistrement sur demande) ; limites gratuites et payantes selon la section 1 bis ; coût d'IA mesuré par session.

### Critères d'acceptation
Une session complète produit une fiche de révision ; sans enregistrement explicite, rien n'est conservé ; le plafond gratuit est appliqué côté serveur.

---

## 6. Tranche 20 — Démarches administratives

### Principe central
Des fiches vérifiées par un éditeur, pas des réponses générées. Une information fausse (frais, pièces, lieux) a un coût réel pour l'utilisateur. L'agent ne rédige aucun contenu de fiche à partir de sa mémoire : le contenu est saisi et validé en administration, avec sa source officielle.

### Condition de démarrage (décision en attente)
**Aucun responsable éditorial n'est encore désigné. Tant que ce n'est pas le cas, aucune fiche réelle n'est rédigée ni publiée. L'agent construit l'outil d'administration, le modèle de données et l'affichage avec des fiches de test marquées `BROUILLON`. La tranche est alors livrée « techniquement terminée, contenu en attente ».**

### Données
- `surga_demarches` : id, slug, titre, catégorie, public concerné, pièces, coût (FCFA), délai, lieux, étapes, source officielle, date de vérification, statut (`BROUILLON`, `PUBLIE`, `A_REVERIFIER`).
- `surga_demarches_signalements` : id, demarche_id, message, statut.

### Affichage & Recherche
- « Vérifié le jj/mm/aaaa », lien vers la source officielle, bouton « Signaler une erreur ». Si aucune fiche n'existe pour la recherche : message « Cette démarche n'est pas encore couverte » avec orientation vers le portail officiel, sans improvisation.
- Recherche : par mots-clés, avec le moteur déjà en place. Pas de réponse générative.
- Passerelles (même mécanique que les concours) : pièces vers une checklist en Notes, frais vers Sama Xaalis, échéance (ex. expiration d'un document) vers l'Agenda.

### Administration
- Nouvel onglet avec création et modification, file « à re-vérifier » après **90 jours** (valeur par défaut), file de signalements.
- Démarrage : 6 à 8 démarches parmi les plus demandées, choisies et rédigées par vous.

### Critères d'acceptation
Une fiche non vérifiée n'est jamais publiée ; une fiche périmée passe en « à re-vérifier » ; un signalement arrive dans la file d'administration ; les passerelles Notes, Sama Xaalis et Agenda fonctionnent comme pour les concours.

---

## 7. Tests à ajouter (Jest et frontend)
- Génération refusée sans paiement ni droit ;
- Limite gratuite appliquée côté serveur et impossible à contourner depuis le client ;
- Passage au Premium qui lève la limite après vérification du paiement ;
- Retour au gratuit qui conserve les données mais bloque les nouvelles actions payantes ;
- IDOR sur profil, documents et signalements ;
- Purge complète des nouvelles tables ;
- Dédoublonnage des vidéos ;
- Plafond de sessions d'entretien ;
- Fiche non publiée invisible côté utilisateur ;
- Aucun émoji, composants < 450 lignes, `tsc` et `lint:slop` au vert.

---

## 8. À coller dans `docs/surga/PLAN.md`
- [x] Tranche 17 : Séries et lutte (alertes vidéos). *(Fait)*
- [ ] Tranche 18 : Emploi, profil, CV et lettres.
- [ ] Tranche 19 : Préparation à l'entretien.
- [ ] Tranche 20 : Démarches administratives.

*Ordre proposé : 17, 18, 19, 20 (la 19 dépend du profil de la 18 ; la 20 est livrée techniquement, son contenu attend la désignation d'un responsable éditorial).*

---

## 9. Décisions à consigner (`D-NEW-x`)
1. Le CV, les lettres et l'entretien forment une seule brique « Emploi » partageant un profil.
2. Entretien et CV : dans l'app uniquement, jamais en conversation WhatsApp.
3. Démarches : fiches éditoriales vérifiées, sans réponse générative.
4. Vidéos : liens et métadonnées uniquement, aucun hébergement.
5. Modèle mixte gratuit, achat à l'acte et Premium (section 1 bis). Option A retenue : le CV sans mention s'achète à l'unité pour 500 FCFA, en plus du Premium.
6. CV et lettres en français uniquement au lancement.
7. Aucune fiche de démarche n'est publiée tant qu'un responsable éditorial n'est pas désigné.

---

## 10. Points ouverts
- Existence du Web Push serveur (section 2).
- Source fiable pour le calendrier de la lutte.
- Conditions d'utilisation des plateformes vidéo pour la collecte des flux.
- Responsable éditorial des démarches et liste initiale : bloque la publication du contenu, pas le développement.
- Rythme de re-vérification des fiches.
- Seuils gratuits (section 1 bis), à calibrer sur les coûts mesurés. Le prix à l'acte du CV est fixé à 500 FCFA.
- Droits sur les Unes de presse affichées par le kiosque (tranche 14 du journal) : à clarifier avec les éditeurs.

*Valeurs par défaut retenues (modifiables) : séries suivies via YouTube uniquement au départ ; re-vérification des fiches tous les 90 jours ; seuils gratuits du tableau de la section 1 bis ; quota WhatsApp gratuit de 2 par jour, lu depuis une configuration unique ; calendrier de la lutte et Web Push serveur établis par l'audit de l'agent.*