# PLAN TECHNIQUE DE CORRECTION DES DONNÉES SURGA

Ce document formule le plan de remédiation d'ingénierie pour corriger les anomalies démontrées lors de l'audit.
Conformément aux règles de l'audit, **les corrections ne sont pas appliquées à la volée pendant la phase d'investigation** mais planifiées de façon structurée et pérenne.

---

## 1. Principes Directeurs d'Ingénierie (Anti-Slop & Anti-Hardcoding)

1. **Bannissement du Hardcoding Réactif** : Il est formellement interdit de corriger le cas CESTI en ajoutant un `if (id === 'concours-cesti-2026')`. La solution doit traiter le modèle de données et le pipeline d'ingestion.
2. **Gestion Native des Données Inconnues ou Non Communiquées** : Remplacer l'obligation de remplir des dates arbitraires par un statut explicite `date_cloture: null` ou `statut: 'a_venir'` avec mention claire côté client.
3. **Schéma Relationnel / JSONB pour Conditions Différenciées** : Remplacer les scalaires uniques destructeurs (`age_max: INTEGER`) par un objet structuré (`conditions_acces: JSONB`) distinguant les profils (bacheliers, professionnels, masters).
4. **Imperméabilité des Données Administrées vs Code** : Supprimer l'écrasement inconditionnel de la DB par le code au démarrage (`ON CONFLICT (id) DO UPDATE`), pour permettre des mises à jour pérennes via la console admin ou les crons.

---

## 2. Fiches de Correction par Anomalie

### Correction COR-DAT-01 : Modélisation des Concours & Traitement du Cas CESTI
- **Anomalies traitées** : `DAT-ANO-01`, `DAT-ANO-02`, `DAT-ANO-03`, `DAT-ANO-04`
- **Priorité** : **CRITIQUE**
- **Cause Démontrée** :
  - Absence de distinction entre sessions passées, en cours et futures.
  - Table statique écrasant la base de données à chaque démarrage.
  - Hallucination de pièces ("lettre de motivation") dans la définition initiale.
  - Absence de support des conditions d'éligibilité par catégorie de candidat.
- **Modifications Techniques Requises** :
  1. **Migration SQL** :
     - Ajouter à la table `surga_concours` :
       - `session_annee INT` (ex: 2026, 2027)
       - `conditions_eligibilite JSONB` (structure : `{ profils: [ { categorie: 'bachelier', age_min: 17, age_max: 24, diplome: 'Bac' }, { categorie: 'professionnel', age_min: null, age_max: null, experience_annees: 4 } ] }`)
       - `pieces_dossier JSONB` (structure : `{ obligatoires: [...], conditionnelles: [...] }`)
       - `date_statut VARCHAR(30)` (`ouvert`, `inscriptions_closes`, `epreuves_en_cours`, `termine`, `en_attente_arrete`)
  2. **Refonte de `concours-service.js`** :
     - Modifier `assurerConcoursInitiaux()` : Remplacer `ON CONFLICT (id) DO UPDATE` par `ON CONFLICT (id) DO NOTHING` (ou mise à jour conditionnelle ne touchant pas aux dates administrées).
     - Rectifier la fiche de vérité terrain pour le CESTI :
       - Statut session 2026 : `termine`
       - Supprimer la fausse pièce "Lettre de motivation manuscrite"
       - Renseigner les conditions exactes d'âge (24 ans bachelier / sans limite pros)
     - Adapter `calculerEcheances()` : Gérer proprement les concours terminés (`estCloture: true`, `messageDelai: "Session 2026 terminée — Résultats publiés"`).
  3. **Composants Frontend** :
     - `SurgaConcoursCard.tsx` : Afficher le badge "Terminé" sans faux compte à rebours.
     - `SurgaConcoursDetailModal.tsx` : Afficher les conditions par profil et scinder les pièces en *Pièces obligatoires* et *Pièces selon votre profil*.
- **Validation** :
  - Exécution du test unitaire Jest de non-régression CESTI.
  - Vérification de l'absence de régression sur les 21 autres concours.

---

### Correction COR-DAT-02 : Activation et Publication des Démarches Administratives
- **Anomalie traitée** : `DAT-ANO-05`
- **Priorité** : **HAUTE**
- **Cause Démontrée** : Les 20 fiches certifiées insérées en DB sont restées au statut `'BROUILLON'`, alors que la route client filtre exclusivement les fiches `'PUBLIE'`.
- **Modifications Techniques Requises** :
  1. **Migration SQL / Script d'administration** :
     - Passer les 20 fiches vérifiées au statut `'PUBLIE'` dans la base de données :
       ```sql
       UPDATE surga_demarches 
       SET statut = 'PUBLIE', updated_at = NOW() 
       WHERE statut = 'BROUILLON' AND id IN ('dem-cni-cedeao', 'dem-passeport-bio', ...);
       ```
  2. **Contrôle dans `demarches-service.js`** :
     - Assurer que `DEMARCHES_INITIALES` définit `statut: 'PUBLIE'` pour le catalogue de référence.
- **Validation** :
  - Appel de `GET /api/surga/demarches` doit retourner `total: 20` fiches actives avec leurs pièces et coûts légaux.

---

### Correction COR-DAT-03 : Correction du Schéma SQL de Trafic (`surga_trafic_signalements`)
- **Anomalie traitée** : `DAT-ANO-07`
- **Priorité** : **HAUTE**
- **Cause Démontrée** : La colonne `statut` est requêtée par `getEtatTraficComplet()` (`WHERE statut <> 'rejete'`) mais manque dans la table PostgreSQL de production.
- **Modifications Techniques Requises** :
  1. **Migration SQL** :
     ```sql
     ALTER TABLE surga_trafic_signalements 
     ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'en_attente',
     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
     ```
  2. **Sécurisation du code dans `trafic-service.js`** :
     - Entourer la clause de modération d'une gestion défensive si la colonne était altérée.
- **Validation** :
  - L'appel de `getEtatTraficComplet()` doit s'exécuter sans warning SQL et incorporer les signalements récents.

---

### Correction COR-DAT-04 : Normalisation des Titres et Dates du Kiosque des Unes
- **Anomalies traitées** : `DAT-ANO-08`, `DAT-ANO-09`
- **Priorité** : **MOYENNE**
- **Cause Démontrée** :
  - `idx >= KNOWN_PAPERS.length` génère des chaînes "Journal N°X".
  - Absence de validation sur la date de publication d'origine.
- **Modifications Techniques Requises** :
  1. Étendre `KNOWN_PAPERS` dans `backend/services/surga/kiosque-service.js` pour couvrir l'ensemble des titres répertoriés dans ProjetBI.
  2. Si un titre est inconnu, extraire le nom du fichier image (ex: `rewmi_2026.webp` -> `Rewmi`) au lieu d'un numéro anonyme.
  3. Rejeter ou dater avec la date réelle d'archive si la date de parution n'est pas celle du jour, sans prétendre qu'il s'agit de la Une d'aujourd'hui.
- **Validation** :
  - Aucun journal ne doit porter un libellé commençant par "Journal N°".

---

### Correction COR-DAT-05 : Assainissement des Bonnes Adresses et des Labels
- **Anomalies traitées** : `DAT-ANO-10`, `DAT-ANO-11`
- **Priorité** : **MOYENNE**
- **Modifications Techniques Requises** :
  1. Remplacer les faux chiffres d'avis par des indications sincères :
     - Supprimer la mention "1920 avis" si la source externe n'est pas connectée.
     - Préciser : *"Recommandation éditoriale locale"* au lieu de *"Vérifié"*.
  2. Nettoyer les mentions "Calendrier officiel" dans `SurgaConcoursDetailModal.tsx` pour n'utiliser cette mention que lorsqu'un arrêté ministériel officiel est joint en référence.
