# REGISTRE DES ANOMALIES DE DONNÉES — AUDIT TECHNIQUE SURGA

Date : 2026-10-09  
Statut : Confirmé sur preuves réelles  

---

## Synthèse du Registre

| ID | Module | Intitulé | Sévérité | Chaîne d'apparition | Statut |
|:---|:---|:---|:---:|:---|:---:|
| **DAT-ANO-01** | Concours | Concours CESTI : Dates, épreuves et clôture fictives servant un concours terminé comme actif | **CRITIQUE** | Extraction → DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-02** | Concours | Concours CESTI : Hallucination de pièces justificatives (lettre manuscrite) et omission des pièces officielles | **CRITIQUE** | Extraction → DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-03** | Concours | Concours CESTI : Écrasement des conditions d'âge différenciées en un chiffre unique (27 ans) | **CRITIQUE** | Normalisation → DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-04** | Concours | Catalogue Concours : 100% des 22 concours forcés à `statut: 'ouvert'` avec écrasement automatique en DB | **CRITIQUE** | Collecte → DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-05** | Démarches | Écran public Démarches complètement vide (0 fiche servie sur 20 existantes en base) | **HAUTE** | DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-06** | Démarches | Horodatage de vérification factice injecté automatiquement lors du seed | **HAUTE** | Collecte → Transformation → DB → Frontend | **CADRÉ** |
| **DAT-ANO-07** | Trafic | Crash SQL sur `surga_trafic_signalements` (colonne `statut` absente de la DB de prod) | **HAUTE** | DB → Service → API | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-08** | Kiosque | Titres de journaux remplacés par des libellés génériques (« Journal N°44 ») | **MOYENNE** | Transformation → DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-09** | Kiosque | Fallback de date de parution au jour courant pour des Unes plus anciennes | **MOYENNE** | Transformation → DB → API → Frontend | **RÉSOLU & VALIDÉ** |
| **DAT-ANO-10** | Places | Faux volumes d'avis (1920 avis, 4.8★) et faux label « vérifié » hardcodés dans le catalogue | **MOYENNE** | Source → DB → API → Frontend | **DOCUMENTÉ** |
| **DAT-ANO-11** | Transverse | Utilisation abusive de labels institutionnels (« Calendrier officiel », « Vérifié ») | **MOYENNE** | Frontend | **RÉSOLU & VALIDÉ** |

---

## Détail des Anomalies Confirmées

### DAT-ANO-01 : Concours CESTI — Dates et statut fictifs (Concours terminé affiché comme actif)
- **Sévérité** : **CRITIQUE**
- **Composant(s)** : `backend/services/surga/concours-service.js` (lignes 443–470, 725–769), table `surga_concours`, `SurgaConcoursCard.tsx`, `SurgaConcoursDetailModal.tsx`.
- **Chaîne exacte d'erreur** :
  $$\text{SOURCE (Avis CESTI)} \not\rightarrow \text{EXTRACTION (Dates fictives codées en dur)} \rightarrow \text{DB (`statut: 'ouvert'`)} \rightarrow \text{API (`diffMs > 0`)} \rightarrow \text{FRONTEND (« Clôture dans 28 jours »)}$$
- **Description** :
  La session 2026 du concours d'entrée au CESTI est **terminée depuis le 24 septembre 2026** (épreuves le 3 septembre 2026, dépôts clos en juin). Surga affiche pourtant :
  - `statut: 'ouvert'`
  - `date_cloture: '2026-11-05T17:00:00.000Z'`
  - `date_epreuves: '2026-11-25T08:00:00.000Z'`
  - `date_resultats: '2026-12-18T14:00:00.000Z'`
  - Calcul dynamique de l'API : *« Clôture dans 28 jours — Préparez vos pièces »*.
- **Impact Utilisateur** :
  Un candidat sénégalais préparant le concours CESTI pense qu'il est encore temps de déposer son dossier pour la session 2026, alors qu'il a 4 mois de retard et que les lauréats sont déjà admis. Risque de préjudice financier (frais engagés, démarches de légalisation inutiles) et de perte de confiance absolue dans Surga.

---

### DAT-ANO-02 : Concours CESTI — Hallucination de pièces justificatives
- **Sévérité** : **CRITIQUE**
- **Composant(s)** : `backend/services/surga/concours-service.js` (lignes 458–465), `SurgaConcoursDetailModal.tsx` (lignes 223–255).
- **Chaîne exacte d'erreur** :
  $$\text{EXTRACTION (Rédaction manuelle erronée)} \rightarrow \text{DB (`pieces_a_fournir`)} \rightarrow \text{API} \rightarrow \text{FRONTEND (Checklist interactive)}$$
- **Description** :
  La liste des pièces de Surga inclut :
  - *« Lettre de motivation manuscrite détaillant le projet journalistique »* : **TOTALEMENT FICTIF**. Le règlement officiel du CESTI ne demande aucune lettre de motivation de ce type pour le concours direct bachelier.
  - Omission des pièces réelles : Fiche individuelle de candidature obligatoire, certificats de scolarité et relevés de notes de 2nde/1ère pour les candidats sous réserve du Bac, contrat de travail et bulletins de salaire pour les professionnels.
- **Impact Utilisateur** :
  Le candidat passe du temps à rédiger une fausse pièce inutile et se présente sans les pièces officielles requises par le secrétariat du CESTI, risquant le rejet immédiat de sa candidature.

---

### DAT-ANO-03 : Concours CESTI — Écrasement des conditions d'âge différenciées
- **Sévérité** : **CRITIQUE**
- **Composant(s)** : `backend/services/surga/concours-service.js` (ligne 451), `SurgaConcoursDetailModal.tsx` (ligne 210).
- **Chaîne exacte d'erreur** :
  $$\text{SOURCE (Âge max 24 ans bachelier / Aucune limite pros)} \rightarrow \text{NORMALISATION (`age_max: 27`)} \rightarrow \text{DB} \rightarrow \text{API} \rightarrow \text{FRONTEND (« 27 ans au 31 décembre »)}$$
- **Description** :
  Le schéma de données stocke un entier unique `age_max: 27`. Dans les textes officiels du CESTI :
  - Candidats bacheliers : **24 ans au plus**.
  - Candidats professionnels : **aucune limite d'âge**.
  - Titulaires de Master : **aucune limite d'âge**.
- **Impact Utilisateur** :
  Un bachelier de 25 ou 26 ans pense être éligible (induit en erreur par Surga) et verra son dossier rejeté par l'UCAD. Un professionnel de 30 ans pense être inéligible et renonce à candidater.

---

### DAT-ANO-04 : Catalogue Concours — Statut 'ouvert' forcé pour 100% des concours
- **Sévérité** : **CRITIQUE**
- **Composant(s)** : `backend/services/surga/concours-service.js` (lignes 29–665, 672–715).
- **Chaîne exacte d'erreur** :
  $$\text{COLLECTE (Aucun worker / scraper)} \rightarrow \text{CODE (Tableau statique)} \xrightarrow{\text{assurerConcoursInitiaux()}} \text{DB (22 lignes `statut: 'ouvert'` forcé)}$$
- **Description** :
  Les 22 concours répertoriés sont tous marqués avec `statut: 'ouvert'`. À chaque initialisation de l'application, `assurerConcoursInitiaux()` exécute un `ON CONFLICT (id) DO UPDATE` qui réécrase les enregistrements avec les valeurs codées en dur, interdisant toute mise à jour pérenne en base.
- **Impact Utilisateur** :
  Tous les concours du pays semblent miraculeusement « ouverts » et accessibles toute l'année, ce qui est matériellement faux.

---

### DAT-ANO-05 : Démarches Administratives — Écran public complètement vide
- **Sévérité** : **HAUTE**
- **Composant(s)** : `backend/services/surga/demarches-service.js` (lignes 698–700), `backend/routes/surga/demarches.js` (ligne 21), table `surga_demarches`.
- **Chaîne exacte d'erreur** :
  $$\text{DB (20 fiches avec `statut = 'BROUILLON'`)} \rightarrow \text{API (`WHERE statut = 'PUBLIE'`)} \rightarrow \text{RÉPONSE (`{ fiches: [], total: 0 }`)} \rightarrow \text{FRONTEND (Écran vide)}$$
- **Description** :
  Dans la table `surga_demarches`, les 20 fiches ont été créées avec le statut `'BROUILLON'`. La route publique `/api/surga/demarches` filtre strictement `WHERE statut = 'PUBLIE'` (décision de sécurité correcte). En conséquence, le service retourne 0 fiche. L'utilisateur qui consulte les démarches administratives sénégalaises voit un écran vide avec le message "Cette démarche n'est pas encore couverte".
- **Impact Utilisateur** :
  Fonctionnalité complètement inopérante pour le grand public.

---

### DAT-ANO-06 : Démarches Administratives — Horodatage de vérification factice
- **Sévérité** : **HAUTE**
- **Composant(s)** : `backend/services/surga/demarches-service.js` (lignes 86, 222, 248...).
- **Chaîne exacte d'erreur** :
  $$\text{CODE (`date_verification: new Date().toISOString()`)} \rightarrow \text{DB} \rightarrow \text{FRONTEND (« Vérifié le 06/10/2026 »)}$$
- **Description** :
  Les fiches portent un champ `date_verification` et `date_prochaine_verification (+ 90j)`. Ce champ n'est pas alimenté par une opération humaine ou automatisée de vérification sur `e-senegal.sn`, mais par `new Date().toISOString()` lors de l'exécution du script de migration.
- **Impact Utilisateur** :
  Surga prétend qu'une fiche a été vérifiée récemment, alors que le contenu est un simple template statique jamais revalidé contre le portail officiel.

---

### DAT-ANO-07 : Trafic Routier — Crash SQL sur `surga_trafic_signalements`
- **Sévérité** : **HAUTE**
- **Composant(s)** : `backend/services/surga/trafic-service.js` (ligne 469), table `surga_trafic_signalements`.
- **Chaîne exacte d'erreur** :
  $$\text{CODE (`WHERE statut <> 'rejete'`)} \rightarrow \text{DB (Erreur `column "statut" does not exist`)} \rightarrow \text{CATCH (signalements ignorés)}$$
- **Description** :
  La table PostgreSQL `surga_trafic_signalements` sur l'environnement de production ne possède pas la colonne `statut`. La requête exécutée dans `getEtatTraficComplet()` échoue avec `[SurgaTrafic] Signalements illisibles : column "statut" does not exist`.
- **Impact Utilisateur** :
  Les signalements réels de bouchons, accidents ou ralentissements envoyés par les conducteurs dakarois ne sont jamais pris en compte dans le calcul de l'état du trafic.

---

### DAT-ANO-08 : Kiosque des Unes — Titres de journaux génériques (« Journal N°44 »)
- **Sévérité** : **MOYENNE**
- **Composant(s)** : `backend/services/surga/kiosque-service.js` (lignes 156–159), table `surga_unes_presse`.
- **Chaîne exacte d'erreur** :
  $$\text{INGESTION ProjetBI} \rightarrow \text{CODE (`idx >= 32`)} \rightarrow \text{DB (`nom_journal: 'Journal N°44'`)} \rightarrow \text{FRONTEND}$$
- **Description** :
  Lorsque le flux ProjetBI contient plus de 32 journaux, les journaux au-delà de la liste prédéfinie `KNOWN_PAPERS` sont renommés `Journal N°33`, `Journal N°34`, ... `Journal N°50`.
- **Impact Utilisateur** :
  L'utilisateur voit une Une de journal avec pour légende "Journal N°44" au lieu du véritable nom de la publication (ex: Le Quotidien, Enquête, etc.).

---

### DAT-ANO-09 : Kiosque des Unes — Fallback de date au jour courant
- **Sévérité** : **MOYENNE**
- **Composant(s)** : `backend/services/surga/kiosque-service.js` (ligne 161).
- **Chaîne exacte d'erreur** :
  $$\text{INGESTION (date manquante)} \rightarrow \text{TRANSFORMATION (`dateParution = dateAujourdhui`)} \rightarrow \text{DB}$$
- **Description** :
  Si l'élément de presse n'a pas de date parsable, le code lui attribue automatiquement la date du jour d'exécution.
- **Impact Utilisateur** :
  Une ancienne Une (par exemple du week-end ou de la veille) peut être présentée comme la "Une d'aujourd'hui".

---

### DAT-ANO-10 : Places — Faux volumes d'avis et faux label « vérifié »
- **Sévérité** : **MOYENNE**
- **Composant(s)** : `backend/data/surga-places-catalogue.json`, `surga-places`, `SurgaPlacesModal.tsx`.
- **Chaîne exacte d'erreur** :
  $$\text{FICHIER JSON STATIQUE} \rightarrow \text{DB (`nb_avis: 1920`, `verifie: true`)} \rightarrow \text{FRONTEND}$$
- **Description** :
  Les fiches de bonnes adresses affichent des métadonnées crédibles telles que "4.8 ★ (1920 avis)" et un badge vert "Vérifié", mais ces chiffres ne proviennent d'aucune API publique d'avis (Google Places, TripAdvisor) ni d'un audit de terrain vérifiable.
- **Impact Utilisateur** :
  L'utilisateur accorde une confiance indue à des métriques rédigées manuellement.

---

### DAT-ANO-11 : Transverse — Labels d'autorité institutionnelle non étayés
- **Sévérité** : **MOYENNE**
- **Composant(s)** : `SurgaConcoursDetailModal.tsx` ("Calendrier officiel des étapes"), `SurgaDemarchesModal.tsx` ("Vérifié"), `SurgaPlacesCard.tsx` ("Vérifié").
- **Description** :
  Présence d'étiquettes de réassurance dans l'interface donnant un niveau de certitude supérieur à ce que le backend est techniquement capable de garantir.
- **Impact Utilisateur** :
  Sentiment trompeur d'infaillibilité de l'outil.
