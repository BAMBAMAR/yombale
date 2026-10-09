# DATASET DE RÉFÉRENCE ET ANTI-RÉGRESSION — DONNÉES SURGA

Ce document définit les cas de test factuels et les valeurs de vérité terrain (*Ground Truth*) indispensables pour garantir la fiabilité des données et valider les campagnes anti-régression de Surga.

---

## 1. Jeux de Référence : Concours & Examens Nationaux

### Cas REF-CONC-01 : Concours CESTI (UCAD Dakar)
- **ID Système** : `concours-cesti-2026`
- **Source Primaire Certifiée** : `https://cesti.ucad.sn` (Avis officiel session 2026 / Communiqué des résultats UCAD)
- **Valeurs de Vérité Terrain** :
  - **Organisme** : Centre d'Études des Sciences et Techniques de l'Information (UCAD)
  - **Formations** : Licence en Journalisme et Communication
  - **Statut au 09/10/2026** : **`termine`** (ou `inscriptions_closes`)
  - **Date clôture inscriptions** : Passée (Juin 2026)
  - **Date épreuves écrites** : 3 septembre 2026
  - **Date proclamation résultats** : 24 septembre 2026
  - **Frais de dossier** : 10 000 FCFA (CAOSP en région) / 10 100 FCFA (CESTI Dakar)
  - **Conditions d'âge** :
    - Candidats bacheliers : $\ge 17$ ans et $\le 24$ ans
    - Candidats professionnels : Aucune limite d'âge
    - Candidats titulaires d'un Master (accès direct L2) : Aucune limite d'âge
  - **Pièces obligatoires (Bacheliers)** :
    1. Demande manuscrite adressée au Directeur du CESTI
    2. Fiche individuelle de candidature
    3. Copie certifiée conforme de la CNI ou extrait de naissance
    4. Photo d'identité récente
    5. Copie certifiée conforme de l'attestation du Baccalauréat
    6. Quittance de paiement des frais de dossier
  - **Pièces conditionnelles** :
    - *Candidats en Terminale (sous réserve du Bac)* : Certificat de scolarité de l'année en cours + relevés de notes officiels de Seconde et Première
    - *Candidats professionnels* : Contrat de travail ou 3 derniers bulletins de salaire prouvant 4 années d'exercice
    - *Candidats Master* : Copie certifiée conforme de l'attestation de Master
  - **Interdiction Formelle** : Interdiction absolue d'inclure une "Lettre de motivation manuscrite" ou d'imposer 27 ans comme âge universel.

---

### Cas REF-CONC-02 : Concours ENA (Cycle Direct & Professionnel)
- **ID Système** : `concours-ena-2026`
- **Source Primaire** : `https://ena.sn` / Ministère de la Fonction Publique
- **Valeurs de Vérité Terrain** :
  - **Organisme** : École Nationale d'Administration (Sénégal)
  - **Cycles** : Cycle Supérieur (Master requis), Cycle Moyen (Licence requise), Cycle Moyen Secondaire (Bac requis)
  - **Âge limite (Cycle Direct)** : 33 ans au plus au 1er janvier de l'année du concours
  - **Âge limite (Cycle Professionnel)** : 45 ans pour fonctionnaires justifiant de 4 ou 5 ans de service effectif
  - **Frais de dossier** : 10 000 FCFA (quittance fiscale Trésor public)
  - **Pièces clés** : Demande manuscrite timbrée à 200 FCFA adressée au Directeur général, certificat de nationalité sénégalaise, casier judiciaire n°3 de moins de 3 mois, visite et contre-visite médicale.

---

### Cas REF-CONC-03 : Session Unique du Baccalauréat
- **ID Système** : `examen-baccalaureat-2026`
- **Source Primaire** : `https://officedubac.sn`
- **Valeurs de Vérité Terrain** :
  - **Organisme** : Office du Baccalauréat du Sénégal — UCAD
  - **Âge limite** : `null` (Aucune limite d'âge pour se présenter au Bac)
  - **Période des épreuves** : Fin juin / Début juillet de chaque année scolaire
  - **Frais d'examen** : 5 000 FCFA (candidats officiels) / spécifique candidats libres

---

## 2. Jeux de Référence : Démarches Administratives

### Cas REF-DEM-01 : Carte Nationale d'Identité CEDEAO
- **ID Système** : `dem-cni-cedeao`
- **Source Primaire** : `https://e-senegal.sn/#/home/demarches`
- **Valeurs de Vérité Terrain** :
  - **Coût légal** : 0 FCFA (Premier enrôlement et renouvellement légal gratuit)
  - **Délai officiel** : 2 à 4 semaines
  - **Lieux d'enrôlement** : Commissariats de police, brigades de gendarmerie, centres de services de la DAF
  - **Pièces requises** : Extrait d'acte de naissance de moins de 3 mois ou ancienne CNI pour renouvellement
  - **Statut requis pour affichage public** : `PUBLIE` (ne doit jamais rester bloqué en `BROUILLON`)

### Cas REF-DEM-02 : Passeport Biométrique Ordinaire
- **ID Système** : `dem-passeport-bio`
- **Source Primaire** : `https://e-senegal.sn/#/home/demarches`
- **Valeurs de Vérité Terrain** :
  - **Coût légal strict** : 20 000 FCFA (quittance fiscale Trésor Public)
  - **Délai officiel** : 3 à 8 jours ouvrés à Dakar
  - **Pièces obligatoires** : CNI biométrique CEDEAO en cours de validité, quittance Trésor de 20 000 FCFA

---

## 3. Jeux de Référence : Météo & Sources Externes

### Cas REF-METEO-01 : Relevé Météo Dakar
- **Source Primaire** : MET Norway Locationforecast 2.0
- **Règles Strictes de Validation** :
  - `temperature` : Nombre entier cohérent pour Dakar ($18^\circ\text{C} \le T \le 42^\circ\text{C}$)
  - `condition_code` : Appartenance stricte à la liste autorisée (`soleil`, `nuageux`, `partiellement_nuageux`, `pluie`, `averse`, `orage`)
  - `source` : Doit explicitement citer `MET Norway`
  - `updated_at` : Date ISO 8601 datant de moins de 12 heures
  - `non_actualise` : `true` si le calcul source dépasse 12 heures

### Cas REF-METEO-02 : Marées & Qualité de l'Air sans Clé Payante
- **Règles Strictes de Validation** :
  - Si `SURGA_OPEN_METEO_CLE` est absente et `SURGA_OPEN_METEO_ESSAI !== 'true'` :
  - `maree` doit être strictement `null`
  - `qualite_air` doit être strictement `null`
  - **Interdiction formelle** de renvoyer un coefficient fixe ou une heure de marée extrapolée.

---

## 4. Jeux de Référence : Trafic Routier Dakar

### Cas REF-TRAFIC-01 : Axes Majeurs
- **Nombre d'axes de référence** : 6 axes structurants mesurés (A1 entrant/sortant, VDN nord/sud, Ouest-Foire-Colobane, Corniche Ouest)
- **Règles Strictes de Validation** :
  - Si mesure Google Maps disponible : `source: 'google_maps'`, `tempsEstimeMin: INTEGER`, `vitesseReelleKmH: INTEGER`
  - Si aucune mesure disponible et aucun signalement : `source: 'aucune'`, `niveau: 'indisponible'`, `tempsEstimeMin: null`
  - Les signalements récents ne doivent pas être bloqués par une erreur SQL (`statut`).

---

## 5. Matrice des Assertions pour Tests Automatisés

```javascript
// Exemple d'assertion de non-régression pour le CESTI
describe('Anti-Régression Concours CESTI', () => {
  it('ne doit pas afficher le CESTI 2026 comme ouvert avec clôture future', async () => {
    const cesti = await concoursService.recupererConcoursParId('concours-cesti-2026');
    expect(cesti.statut).not.toBe('ouvert');
    expect(cesti.echeances.joursRestantsCloture).toBeLessThanOrEqual(0);
    expect(cesti.pieces_a_fournir).not.toContain(
      expect.stringMatching(/lettre de motivation/i)
    );
  });

  it('doit expliciter les conditions d âge selon le statut du candidat', async () => {
    const cesti = await concoursService.recupererConcoursParId('concours-cesti-2026');
    expect(cesti.conditions_detaillees).toBeDefined();
    expect(cesti.conditions_detaillees.age_bachelier).toBe(24);
    expect(cesti.conditions_detaillees.age_professionnel).toBeNull();
  });
});
```
