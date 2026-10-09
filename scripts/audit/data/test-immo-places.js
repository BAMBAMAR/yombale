require('dotenv').config();
const { rechercherBiensImmo } = require('../../../backend/services/surga/immo-service');
const { rechercherPlaces } = require('../../../backend/services/surga/places-service');

async function test() {
  console.log('=== TEST RECHERCHE IMMO & PLACES ===');
  
  // Immo
  const resImmo = await rechercherBiensImmo({ limit: 10 });
  console.log(`\nImmo trouvé : ${resImmo.biens.length} biens`);
  if (resImmo.biens.length > 0) {
    console.log('Premier bien :', {
      id: resImmo.biens[0].id,
      titre: resImmo.biens[0].titre,
      prix: resImmo.biens[0].prix,
      quartier: resImmo.biens[0].quartier,
      type_bien: resImmo.biens[0].type_bien,
      photosCount: resImmo.biens[0].photos.length,
      contact_tel: resImmo.biens[0].contact_tel,
      verifie: resImmo.biens[0].verifie
    });
  }

  // Places
  const resPlaces = await rechercherPlaces({ limit: 10 });
  console.log(`\nPlaces trouvé : ${resPlaces.places.length} adresses (total: ${resPlaces.total})`);
  if (resPlaces.places.length > 0) {
    console.log('Première adresse :', {
      id: resPlaces.places[0].id,
      nom: resPlaces.places[0].nom,
      categorie: resPlaces.places[0].categorie,
      quartier: resPlaces.places[0].quartier,
      budget: resPlaces.places[0].budget_moyen_xof,
      note: resPlaces.places[0].note_moyenne,
      specialite: resPlaces.places[0].specialite,
      photosCount: resPlaces.places[0].photos.length,
      contact_tel: resPlaces.places[0].contact_tel
    });
  }

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
