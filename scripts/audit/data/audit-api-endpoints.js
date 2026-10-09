// scripts/audit/data/audit-api-endpoints.js
// Audit technique des réponses des services et routes Surga (sans nécessiter de serveur HTTP externe)
require('dotenv').config();

async function testerEndpoints() {
  console.log('=== TEST ET AUDIT DES SERVICES ET RÉPONSES SURGA ===\n');

  // 1. CONCOURS
  console.log('--- 1. CONCOURS-SERVICE ---');
  try {
    const concoursService = require('../../../backend/services/surga/concours-service');
    const { concours, total } = await concoursService.listerConcours({ limit: 5 });
    console.log(`Total concours : ${total}`);
    for (const c of concours.slice(0, 3)) {
      console.log(` - ID: ${c.id} | Titre: ${c.titre} | Statut: ${c.statut} | Clôture: ${c.date_cloture} | Echéances:`, c.echeances);
    }

    const cesti = await concoursService.recupererConcoursParId('concours-cesti-2026');
    console.log('\n[Fiche CESTI détaillée renvoyée par le service] :');
    console.log('  Titre :', cesti?.titre);
    console.log('  Organisme :', cesti?.organisme);
    console.log('  Niveau requis :', cesti?.niveau_requis);
    console.log('  Âge max :', cesti?.age_max);
    console.log('  Frais de dossier :', cesti?.frais_dossier_xof);
    console.log('  Statut :', cesti?.statut);
    console.log('  Date clôture :', cesti?.date_cloture);
    console.log('  Date épreuves :', cesti?.date_epreuves);
    console.log('  Date résultats :', cesti?.date_resultats);
    console.log('  Pièces à fournir :', cesti?.pieces_a_fournir);
    console.log('  Échéances calculées :', cesti?.echeances);
    console.log('  Lien officiel :', cesti?.lien_officiel);
  } catch (err) {
    console.error('Erreur concours-service :', err.message);
  }

  // 2. DÉMARCHES
  console.log('\n--- 2. DEMARCHES-SERVICE ---');
  try {
    const demarchesService = require('../../../backend/services/surga/demarches-service');
    const { demarches, total } = await demarchesService.rechercherDemarches({ limit: 3 });
    console.log(`Total démarches : ${total}`);
    for (const d of demarches) {
      console.log(` - [${d.id}] ${d.titre} | Statut: ${d.statut} | Source: ${d.source_officielle} | Date verif: ${d.date_verification}`);
    }
  } catch (err) {
    console.error('Erreur demarches-service :', err.message);
  }

  // 3. MÉTÉO & SOURCES EXTERNES
  console.log('\n--- 3. METEO-SERVICE & SOURCES-EXTERNES ---');
  try {
    const meteoService = require('../../../backend/services/surga/meteo-service');
    const meteoDakar = await meteoService.getMeteo('Dakar');
    console.log('Météo Dakar :', {
      temperature: meteoDakar?.temperature,
      condition: meteoDakar?.condition_texte,
      source: meteoDakar?.source,
      updated_at: meteoDakar?.updated_at,
      non_actualise: meteoDakar?.non_actualise,
      maree: meteoDakar?.maree,
      qualite_air: meteoDakar?.qualite_air,
    });
  } catch (err) {
    console.error('Erreur meteo-service :', err.message);
  }

  // 4. SPORT
  console.log('\n--- 4. SPORT-SERVICE ---');
  try {
    const sportService = require('../../../backend/services/surga/sport-service');
    const sports = await sportService.chargerDonneesSportEnDirect();
    console.log(`Matchs retournés : ${sports.length}`);
    if (sports.length > 0) {
      console.log('Exemple match 1 :', sports[0]);
    }
  } catch (err) {
    console.error('Erreur sport-service :', err.message);
  }

  // 5. TRAFIC
  console.log('\n--- 5. TRAFIC-SERVICE ---');
  try {
    const traficService = require('../../../backend/services/surga/trafic-service');
    const trafic = await traficService.getEtatTraficComplet();
    console.log('Trafic synthèse :', trafic?.synthese);
    console.log('Axes retournés :', (trafic?.axes || []).map(a => `${a.nom}: ${a.niveau_actuel} (${a.temps_estime_min} min / hab. ${a.temps_habituel_min} min, source: ${a.source || 'inconnue'})`));
  } catch (err) {
    console.error('Erreur trafic-service :', err.message);
  }

  // 6. KIOSQUE DES UNES
  console.log('\n--- 6. KIOSQUE-SERVICE ---');
  try {
    const kiosqueService = require('../../../backend/services/surga/kiosque-service');
    const unes = await kiosqueService.recupererUnesDuJour();
    console.log(`Unes du jour retournées : ${unes.length}`);
    if (unes.length > 0) {
      console.log('Premières unes :', unes.slice(0, 3).map(u => ({ journal: u.nom_journal, date: u.date_parution, source: u.source, img: u.image_url })));
    }
  } catch (err) {
    console.error('Erreur kiosque-service :', err.message);
  }

  // 7. BONNES ADRESSES (PLACES)
  console.log('\n--- 7. PLACES-SERVICE ---');
  try {
    const placesService = require('../../../backend/services/surga/places-service');
    const { places, total } = await placesService.rechercherPlaces({ limit: 3 });
    console.log(`Total places : ${total}`);
    for (const p of places) {
      console.log(` - ${p.nom} (${p.categorie}) à ${p.quartier} | Note: ${p.note_moyenne} (${p.nb_avis} avis) | Vérifié: ${p.verifie}`);
    }
  } catch (err) {
    console.error('Erreur places-service :', err.message);
  }

  process.exit(0);
}

testerEndpoints().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
