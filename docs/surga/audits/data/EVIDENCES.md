# REGISTRE DES PREUVES TECHNIQUES — AUDIT DATA SURGA

Date de collecte : 2026-10-09  
Environnement : PostgreSQL Production Render + Node.js v24.19.0 (Windows)  
Branche active : `feature/surga`

---

## 1. Cas de Référence n°1 : Le Concours CESTI (Journalisme UCAD)

### 1.1. Constat Factuel & Comparaison Champ par Champ

Sources primaires consultées :
- Portail officiel CESTI/UCAD : `https://cesti.ucad.sn`
- Avis officiel de concours et communiqués des résultats de la session 2026 (publiés le 24 septembre 2026 par la direction du CESTI)
- Code Surga : `backend/services/surga/concours-service.js` (lignes 443–470)
- Table PostgreSQL : `surga_concours` (ligne `concours-cesti-2026`)
- Interface utilisateur : `SurgaConcoursCard.tsx` et `SurgaConcoursDetailModal.tsx`

| Champ | Source Officielle (CESTI / UCAD) | Valeur Stockée & Servie par Surga | Conforme ? | Cause Technique / Niveau d'Erreur |
|:---|:---|:---|:---:|:---|
| **Titre** | Concours d'entrée au CESTI (Licence en Journalisme et Communication) | Concours d entrée au Centre d Études des Sciences et Techniques de l Information (CESTI Journalisme) | **Partiel** | Simplification éditoriale acceptable. |
| **Organisme** | Centre d'Études des Sciences et Techniques de l'Information (UCAD) | Université Cheikh Anta Diop de Dakar (UCAD) | **OK** | Exact. |
| **Niveau requis** | Bacheliers / Élèves de Terminale sous réserve OU Professionnels (4 ans d'expérience) OU Master (accès direct L2) | Baccalauréat ou Licence | **NON** | **Extraction erronée** : le CESTI n'a pas de concours niveau Licence ; les niveaux sont L1 (Bac) ou L2 (Master). |
| **Âge limite** | **17 ans au moins et 24 ans au plus** pour les bacheliers. **Aucune limite d'âge** pour les professionnels et titulaires de Master. | **27 ans** (valeur unique `age_max: 27`) | **NON** | **Donnée inventée / extrapolée** : Surga invente "27 ans" pour tout le monde, induisant en erreur les bacheliers de 25-27 ans (qui seront rejetés) et les professionnels de > 27 ans (qui pensent ne pas pouvoir postuler). |
| **Frais de dossier** | **10 000 FCFA** (dépôt dans les CAOSP régionaux) / **10 100 FCFA** (dépôt au CESTI Dakar) | **10 000 FCFA** (`frais_dossier_xof: 10000`) | **Partiel** | Omet la distinction Dakar (10 100 FCFA) vs Régions (10 000 FCFA). |
| **Statut réel (au 09/10/2026)** | **TERMINÉ** (Épreuves passées le 03/09/2026, résultats proclamés le 24/09/2026) | **`ouvert`** | **NON (CRITIQUE)** | **Absence de fraîcheur** : Statut hardcodé statiquement dans le code JS sans synchronisation. |
| **Date d'ouverture** | Mai 2026 | `2026-09-01T08:00:00.000Z` | **NON** | **Donnée inventée** : date arbitraire calée sur la rentrée scolaire. |
| **Date limite de clôture** | Juin 2026 (clôture des dépôts) | `2026-11-05T17:00:00.000Z` | **NON (CRITIQUE)** | **Donnée inventée** : Surga annonce une clôture le 05/11/2026 alors que le concours est clos depuis juin ! |
| **Date des épreuves** | 3 septembre 2026 | `2026-11-25T08:00:00.000Z` | **NON (CRITIQUE)** | **Donnée inventée** : les épreuves ont eu lieu le 03/09/2026. |
| **Date des résultats** | 24 septembre 2026 | `2026-12-18T14:00:00.000Z` | **NON (CRITIQUE)** | **Donnée inventée** : résultats déjà publiés le 24/09/2026. |
| **Pièces à fournir** | Demande manuscrite au Directeur CESTI, Fiche individuelle, Photo d'identité, CNI/extrait naissance, Attestation Bac légalisée (ou certificat scolarité + relevés 2nde/1ère pour Terminale, bulletins salaire pour pros, attestation Master pour L2) | - Formulaire de candidature en ligne CESTI<br>- Photocopie légalisée attestation Bac ou Licence<br>- Extrait acte de naissance<br>- Relevé notes Bac<br>- **Lettre de motivation manuscrite détaillant le projet journalistique**<br>- Reçu de versement | **NON (CRITIQUE)** | **Hallucination de pièces** : La "Lettre de motivation manuscrite détaillant le projet journalistique" est **totalement absente du règlement officiel**. La fiche individuelle et les certificats conditionnels sont omis. |
| **Message de délai calculé** | Inscriptions closes depuis plusieurs mois | « Clôture dans 27 jours — Préparez vos pièces » | **NON (CRITIQUE)** | Conséquence directe du calcul déterministe sur date fausse (`diffMs = cloture - maintenant`). |
| **Label affiché** | Avis officiel | « Calendrier officiel des étapes » | **NON** | Label mensonger : le calendrier affiché n'a rien d'officiel. |

---

## 2. Preuves Techniques dans le Code Source Backend

### 2.1. Concours codés en dur (`backend/services/surga/concours-service.js`)

Extrait des lignes 443 à 470 :
```javascript
  {
    id: 'concours-cesti-2026',
    slug: 'cesti-journalisme-2026',
    titre: 'Concours d entrée au Centre d Études des Sciences et Techniques de l Information (CESTI Journalisme)',
    sigle: 'CESTI',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat ou Licence',
    age_max: 27,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-11-05T17:00:00.000Z',
    date_epreuves: '2026-11-25T08:00:00.000Z',
    date_resultats: '2026-12-18T14:00:00.000Z',
    pieces_a_fournir: [
      'Formulaire de candidature en ligne CESTI',
      'Photocopie légalisée de l attestation du Baccalauréat ou de la Licence',
      'Extrait d acte de naissance',
      'Relevé de notes officiel du Baccalauréat',
      'Lettre de motivation manuscrite détaillant le projet journalistique',
      'Reçu de versement des frais de dossier de 10 000 FCFA',
    ],
    description: 'Formation d excellence aux métiers du journalisme...',
    lien_officiel: 'https://cesti.ucad.sn',
    centres_prepa: [],
    actif: true,
  },
```

### 2.2. Écrasement forcé en base PostgreSQL à chaque appel (`concours-service.js`)

Extrait des lignes 672 à 715 :
```javascript
async function assurerConcoursInitiaux() {
  if (concoursInitialises || !pool) return;
  try {
    for (const c of CONCOURS_NATIONAUX_SENEGAL) {
      await pool.query(
        `INSERT INTO surga_concours (...)
         VALUES (...)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           titre = EXCLUDED.titre,
           ...
           date_cloture = EXCLUDED.date_cloture,
           date_epreuves = EXCLUDED.date_epreuves,
           ...
           updated_at = NOW()`
      );
    }
    concoursInitialises = true;
  } ...
}
```
**Conséquence** : Même si un administrateur corrigeait la table `surga_concours` directement en base pour actualiser les dates ou fermer le concours, le code réécrirait les fausses valeurs au redémarrage !

---

## 3. Preuves en Base de Données PostgreSQL

### 3.1. État des 22 enregistrements de `surga_concours`
Requête exécutée le 2026-10-09 via `scripts/audit/data/inspecter-donnees-surga.js` :
```text
[CESTI] Clôture: 2026-11-05 | Epreuves: 2026-11-25 | Statut: ouvert | Âge: 27
[CFJ] Clôture: 2026-12-15 | Epreuves: 2027-01-20 | Statut: ouvert | Âge: 35
[CREM] Clôture: 2026-11-25 | Epreuves: 2026-12-12 | Statut: ouvert | Âge: 30
[DOUANES] Clôture: 2026-11-10 | Epreuves: 2026-12-05 | Statut: ouvert | Âge: 28
[EAMAC] Clôture: 2026-12-10 | Epreuves: 2027-01-15 | Statut: ouvert | Âge: 24
[ENA] Clôture: 2026-10-31 | Epreuves: 2026-11-28 | Statut: ouvert | Âge: 33
[ENDSS] Clôture: 2026-11-20 | Epreuves: 2026-12-10 | Statut: ouvert | Âge: 28
[ENSA] Clôture: 2026-11-08 | Epreuves: 2026-11-29 | Statut: ouvert | Âge: 22
[ENTSS] Clôture: 2026-11-28 | Epreuves: 2026-12-15 | Statut: ouvert | Âge: 32
[EPT] Clôture: 2026-11-20 | Epreuves: 2026-12-12 | Statut: ouvert | Âge: 22
[ESP] Clôture: 2026-11-15 | Epreuves: 2026-12-08 | Statut: ouvert | Âge: 23
[FASTEF] Clôture: 2026-11-05 | Epreuves: 2026-11-20 | Statut: ouvert | Âge: 35
[INTERNAT MÉDECINE] Clôture: 2026-12-15 | Epreuves: 2027-01-08 | Statut: ouvert | Âge: 32
[FONCTION PUBLIQUE] Clôture: 2026-11-20 | Epreuves: 2026-12-15 | Statut: ouvert | Âge: 35
[GENDARMERIE] Clôture: 2026-11-30 | Epreuves: 2026-12-20 | Statut: ouvert | Âge: 24
[INSEPS] Clôture: 2026-11-12 | Epreuves: 2026-12-01 | Statut: ouvert | Âge: 25
[DAP] Clôture: 2026-12-18 | Epreuves: 2027-01-10 | Statut: ouvert | Âge: 28
[POLICE] Clôture: 2026-10-25 | Epreuves: 2026-11-15 | Statut: ouvert | Âge: 26
[BNSP] Clôture: 2026-12-05 | Epreuves: 2026-12-27 | Statut: ouvert | Âge: 25
[BAC] Clôture: 2027-01-15 | Epreuves: 2027-07-02 | Statut: ouvert | Âge: null
[BFEM] Clôture: 2027-01-30 | Epreuves: 2027-07-15 | Statut: ouvert | Âge: null
[CFEE] Clôture: 2027-02-15 | Epreuves: 2027-06-25 | Statut: ouvert | Âge: null
```
**Constat flagrant** : 100% des 22 concours sont stockés avec `statut: 'ouvert'`. Aucun mécanisme de passage à 'termine' ou 'clos' n'existe en base de données.

### 3.2. État de `surga_demarches`
```text
Total fiches : 20
Statut en DB pour les 20 fiches : 'BROUILLON'
Statut 'PUBLIE' : 0 fiche
Résultat API publique : { success: true, fiches: [], total: 0 }
```

### 3.3. Table `surga_trafic_signalements` — Anomalie de Schéma SQL
Erreur constatée lors de l'exécution de `getEtatTraficComplet()` :
```text
[SurgaTrafic] Signalements illisibles : column "statut" does not exist
```
La colonne `statut` a été ajoutée dans `backend/migrate-inline.js` mais n'a jamais été appliquée sur la table de production, provoquant l'échec systématique de la lecture des signalements des usagers.

### 3.4. Table `surga_unes_presse` — Noms génériques
Dans `surga_unes_presse` (136 enregistrements), au-delà des 32 journaux de `KNOWN_PAPERS`, les Unes sont insérées sous des noms tels que :
```text
- Journal N°33
- Journal N°34
...
- Journal N°44
- Journal N°50
```
L'utilisateur voit donc dans le carrousel des Unes des cartes intitulées "Journal N°44" au lieu du véritable quotidien concerné.

---

## 4. Preuves d'Appels API Réels

### 4.1. Appel Service Concours CESTI
```json
{
  "id": "concours-cesti-2026",
  "titre": "Concours d entrée au Centre d Études des Sciences et Techniques de l Information (CESTI Journalisme)",
  "sigle": "CESTI",
  "organisme": "Université Cheikh Anta Diop de Dakar (UCAD)",
  "niveau_requis": "Baccalauréat ou Licence",
  "age_max": 27,
  "frais_dossier_xof": 10000,
  "statut": "ouvert",
  "date_cloture": "2026-11-05T17:00:00.000Z",
  "echeances": {
    "joursRestantsCloture": 28,
    "phaseAlerte": "j-30",
    "messageDelai": "Clôture dans 28 jours — Préparez vos pièces",
    "estCloture": false
  }
}
```

### 4.2. Appel Service Météo
```json
{
  "temperature": 28,
  "condition": "Éclaircies",
  "source": "MET Norway",
  "updated_at": "2026-10-09T01:17:31.000Z",
  "non_actualise": false,
  "maree": null,
  "qualite_air": null
}
```
**Constat Météo** : La météo MET Norway fonctionne et est sourcée. Les marées et qualité de l'air sont à `null` faute de clé payante Open-Meteo, sans invention de valeur (conforme D57/D65).

### 4.3. Appel Service Sport
```json
{
  "id": "401900908",
  "competition": "Saudi Pro League",
  "equipe_domicile": "Al Kholood",
  "equipe_exterieur": "Al Qadsiah",
  "score_domicile": null,
  "score_exterieur": null,
  "statut": "A_VENIR",
  "date_debut": "2026-10-09T13:50Z",
  "source": "ESPN"
}
```
**Constat Sport** : Les matchs internationaux viennent d'ESPN en direct. La Ligue 1 sénégalaise est silencieuse sans clé TheSportsDB (conforme D53).

### 4.4. Appel Service Places (Bonnes Adresses)
```json
{
  "nom": "Mamma Mia Gelato Italiano",
  "categorie": "brunch_crepe",
  "quartier": "Almadies",
  "note_moyenne": 4.8,
  "nb_avis": 1920,
  "verifie": true
}
```
**Constat Places** : La note `4.8` et le nombre d'avis `1920` sont codés en dur dans le fichier local JSON `data/surga-places-catalogue.json`. Ils ne proviennent pas d'une synchronisation Google My Business ou TripAdvisor. Le label `verifie: true` n'est rattaché à aucun audit ou vérification de terrain documentée.
