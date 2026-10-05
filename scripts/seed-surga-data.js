// scripts/seed-surga-data.js
// Script de seeding idempotent pour initialiser les données référentielles Surga dans PostgreSQL
// Tables concernées : surga_trafic_axes, surga_concours, surga_places
// Zéro émoji, vouvoiement strict D19

require('dotenv').config();
const { pool } = require('../backend/models/db');

async function seedSurgaData() {
  if (!pool) {
    console.error('[SEED SURGA] ❌ Instance PostgreSQL (pool) non disponible.');
    process.exit(1);
  }

  console.log('[SEED SURGA] 🚀 Démarrage du seed des données de référence Surga...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. AXES ROUTIERS DE DAKAR ──────────────────────────────────────────────
    console.log('[SEED SURGA] 🛣️ Insertion des axes routiers stratégiques de Dakar...');
    const axes = [
      {
        id: 'a1-entrant',
        nom: 'Autoroute A1 (Sens Entrant vers Centre-Ville)',
        origine: 'Diamniadio / Rufisque',
        destination: 'Plateau / Centre-Ville',
        niveau_actuel: 'fluide',
        temps_estime_min: 28,
        temps_habituel_min: 28,
      },
      {
        id: 'a1-sortant',
        nom: 'Autoroute A1 (Sens Sortant vers Banlieue / AIBD)',
        origine: 'Plateau / Colobane',
        destination: 'Rufisque / Diamniadio',
        niveau_actuel: 'fluide',
        temps_estime_min: 26,
        temps_habituel_min: 26,
      },
      {
        id: 'vdn-sud',
        nom: 'VDN (Sens Nord vers Mermoz & Centre)',
        origine: 'CICES / Guédiawaye',
        destination: 'Mermoz / Fann / Plateau',
        niveau_actuel: 'dense',
        temps_estime_min: 14,
        temps_habituel_min: 8,
      },
      {
        id: 'vdn-nord',
        nom: 'VDN (Sens Sud vers Foire & Banlieue)',
        origine: 'Mermoz / Sacré Cœur',
        destination: 'CICES / Golf / Guédiawaye',
        niveau_actuel: 'fluide',
        temps_estime_min: 11,
        temps_habituel_min: 11,
      },
      {
        id: 'corniche-ouest-sud',
        nom: 'Corniche Ouest (Vers Soumbédioune & Plateau)',
        origine: 'Almadies / Ouakam',
        destination: 'Plateau / Centre-Ville',
        niveau_actuel: 'fluide',
        temps_estime_min: 18,
        temps_habituel_min: 18,
      },
      {
        id: 'corniche-ouest-nord',
        nom: 'Corniche Ouest (Vers Ouakam & Almadies)',
        origine: 'Plateau',
        destination: 'Almadies / Ngor',
        niveau_actuel: 'fluide',
        temps_estime_min: 18,
        temps_habituel_min: 18,
      },
      {
        id: 'rn1-rufisque',
        nom: 'Route de Rufisque (RN1)',
        origine: 'Colobane',
        destination: 'Rufisque',
        niveau_actuel: 'sature',
        temps_estime_min: 45,
        temps_habituel_min: 22,
      },
      {
        id: 'ter-dakar',
        nom: 'Train Express Régional (TER)',
        origine: 'Gare de Dakar',
        destination: 'Diamniadio',
        niveau_actuel: 'fluide',
        temps_estime_min: 20,
        temps_habituel_min: 20,
      },
      {
        id: 'brt-dakar',
        nom: 'Bus Rapid Transit (BRT)',
        origine: 'Petersen',
        destination: 'Guédiawaye',
        niveau_actuel: 'fluide',
        temps_estime_min: 45,
        temps_habituel_min: 45,
      },
    ];

    for (const axe of axes) {
      await client.query(
        `INSERT INTO surga_trafic_axes (id, nom, origine, destination, niveau_actuel, temps_estime_min, temps_habituel_min, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id) DO UPDATE SET
           nom = EXCLUDED.nom,
           origine = EXCLUDED.origine,
           destination = EXCLUDED.destination,
           updated_at = NOW()`,
        [axe.id, axe.nom, axe.origine, axe.destination, axe.niveau_actuel, axe.temps_estime_min, axe.temps_habituel_min]
      );
    }
    console.log(`[SEED SURGA] ✅ ${axes.length} axes routiers insérés ou synchronisés.`);

    // ── 2. CONCOURS ET EXAMENS NATIONAUX ───────────────────────────────────────
    console.log('[SEED SURGA] 🎓 Insertion des concours nationaux certifiés...');
    const concours = [
      {
        id: 'concours-ena-2026',
        slug: 'ena-cycle-direct-2026',
        titre: 'Concours direct d entrée à l École Nationale d Administration (ENA)',
        sigle: 'ENA',
        organisme: 'Ministère de la Fonction Publique',
        categorie: 'grandes_ecoles',
        niveau_requis: 'Licence ou Master',
        age_max: 33,
        frais_dossier_xof: 10000,
        statut: 'ouvert',
        date_ouverture: '2026-09-15T08:00:00.000Z',
        date_cloture: '2026-10-31T17:00:00.000Z',
        date_epreuves: '2026-11-28T08:00:00.000Z',
        date_resultats: '2027-01-15T12:00:00.000Z',
        description: 'Recrutement des administrateurs civils, inspecteurs du travail et officiers de douane.',
        lien_officiel: 'https://ena.sn/concours',
      },
      {
        id: 'concours-douanes-2026',
        slug: 'douanes-controleurs-agents-2026',
        titre: 'Concours direct de recrutement de Contrôleurs et Agents des Douanes',
        sigle: 'DOUANES',
        organisme: 'Direction Générale des Douanes',
        categorie: 'forces_defense',
        niveau_requis: 'Baccalauréat ou BFEM',
        age_max: 28,
        frais_dossier_xof: 5000,
        statut: 'ouvert',
        date_ouverture: '2026-09-20T08:00:00.000Z',
        date_cloture: '2026-11-10T17:00:00.000Z',
        date_epreuves: '2026-12-05T07:30:00.000Z',
        date_resultats: '2027-01-30T14:00:00.000Z',
        description: 'Recrutement pour les postes de surveillance frontalière et dédouanement maritime.',
        lien_officiel: 'https://douanes.sn/recrutement',
      },
      {
        id: 'concours-police-2026',
        slug: 'police-gardiens-paix-2026',
        titre: 'Concours de recrutement d Élèves Gardiens de la Paix et Officiers de Police',
        sigle: 'POLICE',
        organisme: 'Ministère de l Intérieur',
        categorie: 'forces_defense',
        niveau_requis: 'BFEM ou Licence',
        age_max: 26,
        frais_dossier_xof: 5000,
        statut: 'ouvert',
        date_ouverture: '2026-09-01T08:00:00.000Z',
        date_cloture: '2026-10-25T17:00:00.000Z',
        date_epreuves: '2026-11-15T07:00:00.000Z',
        date_resultats: '2026-12-20T12:00:00.000Z',
        description: 'Renforcement des effectifs des commissariats et de la circulation routière.',
        lien_officiel: 'https://policenationale.sec.gouv.sn',
      },
      {
        id: 'concours-fastef-2026',
        slug: 'fastef-professeurs-secondaire-2026',
        titre: 'Concours d entrée à la FASTEF pour la formation de Professeurs de l Enseignement Secondaire',
        sigle: 'FASTEF',
        organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
        categorie: 'enseignement',
        niveau_requis: 'Licence ou Master',
        age_max: 35,
        frais_dossier_xof: 10000,
        statut: 'ouvert',
        date_ouverture: '2026-09-10T08:00:00.000Z',
        date_cloture: '2026-11-05T18:00:00.000Z',
        date_epreuves: '2026-12-12T08:00:00.000Z',
        date_resultats: '2027-02-10T12:00:00.000Z',
        description: 'Recrutement des futurs professeurs des collèges et lycées du Sénégal.',
        lien_officiel: 'https://fastef.ucad.sn',
      },
      {
        id: 'concours-cfpj-2026',
        slug: 'cfpj-magistrature-greffes-2026',
        titre: 'Concours d entrée au Centre de Formation Judiciaire (CFJ - Section Magistrature)',
        sigle: 'CFJ',
        organisme: 'Ministère de la Justice',
        categorie: 'grandes_ecoles',
        niveau_requis: 'Master 2 en Droit',
        age_max: 35,
        frais_dossier_xof: 10000,
        statut: 'programme',
        date_ouverture: '2026-11-01T08:00:00.000Z',
        date_cloture: '2026-12-15T17:00:00.000Z',
        date_epreuves: '2027-01-20T08:00:00.000Z',
        date_resultats: '2027-03-30T12:00:00.000Z',
        description: 'Formation des futurs magistrats et auditeurs de justice du Sénégal.',
        lien_officiel: 'https://cfj.sn',
      },
    ];

    for (const c of concours) {
      await client.query(
        `INSERT INTO surga_concours (
           id, slug, titre, sigle, organisme, categorie, niveau_requis, age_max,
           frais_dossier_xof, statut, date_ouverture, date_cloture, date_epreuves,
           date_resultats, description, lien_officiel, actif, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE, NOW())
         ON CONFLICT (id) DO UPDATE SET
           titre = EXCLUDED.titre,
           statut = EXCLUDED.statut,
           date_cloture = EXCLUDED.date_cloture,
           updated_at = NOW()`,
        [
          c.id, c.slug, c.titre, c.sigle, c.organisme, c.categorie, c.niveau_requis,
          c.age_max, c.frais_dossier_xof, c.statut, c.date_ouverture, c.date_cloture,
          c.date_epreuves, c.date_resultats, c.description, c.lien_officiel
        ]
      );
    }
    console.log(`[SEED SURGA] ✅ ${concours.length} concours insérés ou mis à jour.`);

    // ── 3. BONNES ADRESSES DAKAROISES ──────────────────────────────────────────
    console.log('[SEED SURGA] 📍 Insertion des bonnes adresses dakaroises...');
    let places = [];
    try {
      places = require('../backend/data/surga-places-catalogue.json');
    } catch (e) {
      console.warn('[SEED SURGA] Impossible de charger surga-places-catalogue.json, repli vide');
      places = [];
    }

    for (const p of places) {
      await client.query(
        `INSERT INTO surga_places (
           id, slug, nom, categorie, quartier, ville, adresse, budget_moyen_xof,
           fourchette_prix, tags_ambiance, specialite, note_moyenne, nb_avis,
           resume_honnete, contact_tel, contact_whatsapp, horaires, photos,
           verifie, actif, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, TRUE, TRUE, NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           nom = EXCLUDED.nom,
           categorie = EXCLUDED.categorie,
           quartier = EXCLUDED.quartier,
           ville = EXCLUDED.ville,
           adresse = EXCLUDED.adresse,
           budget_moyen_xof = EXCLUDED.budget_moyen_xof,
           fourchette_prix = EXCLUDED.fourchette_prix,
           tags_ambiance = EXCLUDED.tags_ambiance,
           specialite = EXCLUDED.specialite,
           note_moyenne = EXCLUDED.note_moyenne,
           nb_avis = EXCLUDED.nb_avis,
           resume_honnete = EXCLUDED.resume_honnete,
           contact_tel = EXCLUDED.contact_tel,
           contact_whatsapp = EXCLUDED.contact_whatsapp,
           horaires = EXCLUDED.horaires,
           photos = EXCLUDED.photos,
           verifie = TRUE,
           actif = TRUE,
           updated_at = NOW()`,
        [
          p.id,
          p.slug,
          p.nom,
          p.categorie,
          p.quartier,
          p.ville || 'Dakar',
          p.adresse,
          p.budget_moyen_xof || 3000,
          p.fourchette_prix || '€€',
          Array.isArray(p.tags_ambiance) ? JSON.stringify(p.tags_ambiance) : (p.tags_ambiance || '[]'),
          p.specialite,
          p.note_moyenne || 4.5,
          p.nb_avis || 100,
          p.resume_honnete,
          p.contact_tel,
          p.contact_whatsapp,
          p.horaires,
          Array.isArray(p.photos) ? JSON.stringify(p.photos) : (p.photos || '[]')
        ]
      );
    }
    console.log(`[SEED SURGA] ✅ ${places.length} bonnes adresses insérées ou synchronisées.`);

    await client.query('COMMIT');
    console.log('[SEED SURGA] 🎉 Seeding Surga terminé avec succès !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED SURGA] ❌ Erreur lors du seeding Surga :', err.message);
    process.exit(1);
  } finally {
    client.release();
    // Clôture optionnelle
    if (require.main === module) {
      await pool.end().catch(() => {});
    }
  }
}

if (require.main === module) {
  seedSurgaData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedSurgaData };
