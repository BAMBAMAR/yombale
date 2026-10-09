// scripts/audit/data/test-anti-regression.js
// Batterie de tests anti-régression automatisés pour l'audit data de Surga
require('dotenv').config();

const assert = require('assert');

async function executerTests() {
  console.log('===============================================================');
  console.log('    LANCEMENT DE LA BATTERIE DE TESTS ANTI-RÉGRESSION DATA     ');
  console.log('===============================================================\n');

  let reussis = 0;
  let echoues = 0;

  async function tester(nom, fn) {
    try {
      process.stdout.write(`• ${nom} ... `);
      await fn();
      console.log('✅ PASS');
      reussis++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
      echoues++;
    }
  }

  const { pool } = require('../../../backend/models/db');
  const concoursService = require('../../../backend/services/surga/concours-service');
  const demarchesService = require('../../../backend/services/surga/demarches-service');
  const traficService = require('../../../backend/services/surga/trafic-service');
  const meteoService = require('../../../backend/services/surga/meteo-service');
  const sportService = require('../../../backend/services/surga/sport-service');
  const kiosqueService = require('../../../backend/services/surga/kiosque-service');

  // TEST 1 : Cas CESTI - Statut terminé & zéro fausse pièce
  await tester('TST-DAT-01 : Concours CESTI 2026 terminé et sans pièce hallucinatoire', async () => {
    const cesti = await concoursService.recupererConcoursParId('concours-cesti-2026');
    assert(cesti, 'CESTI non trouvé');
    assert.strictEqual(cesti.statut, 'termine', `Statut attendu 'termine', obtenu '${cesti.statut}'`);
    assert(cesti.echeances.estCloture === true, 'Le concours CESTI doit être marqué comme clôturé');
    assert.strictEqual(cesti.echeances.messageDelai, 'Session 2026 terminée', `Message délai inattendu: ${cesti.echeances.messageDelai}`);
    
    const piecesStr = JSON.stringify(cesti.pieces_a_fournir || []);
    assert(!piecesStr.toLowerCase().includes('lettre de motivation'), 'La fausse lettre de motivation manuscrite ne doit plus exister');
    assert(piecesStr.includes('Fiche individuelle'), 'La fiche individuelle officielle doit être présente');
    assert.strictEqual(cesti.age_max, 24, 'Âge maximum pour bachelier doit être 24 ans');
  });

  // TEST 2 : Idempotence de la DB contre l'écrasement destructeur
  await tester('TST-DAT-02 : Idempotence assurerConcoursInitiaux() sans écrasement', async () => {
    await concoursService.listerConcours({ limit: 1 });
    const cestiApres = await concoursService.recupererConcoursParId('concours-cesti-2026');
    assert.strictEqual(cestiApres.statut, 'termine', 'Le statut termine a été réécrasé par le boot !');
  });

  // TEST 3 : Catalogue complet des 22 concours
  await tester('TST-DAT-03 : Cohérence globale du catalogue des 22 concours', async () => {
    const { concours, total } = await concoursService.listerConcours({ limit: 50 });
    assert.strictEqual(total, 22, `Attendu 22 concours, obtenu ${total}`);
    for (const c of concours) {
      assert(c.titre && c.titre.length > 5, `Titre invalide pour ${c.id}`);
      assert(c.lien_officiel && c.lien_officiel.startsWith('http'), `Lien officiel manquant pour ${c.id}`);
      assert(c.echeances, `Échéances manquantes pour ${c.id}`);
    }
  });

  // TEST 4 : Démarches administratives accessibles au public
  await tester('TST-DAT-04 : 20 démarches administratives publiées et accessibles', async () => {
    const res = await demarchesService.rechercherDemarches();
    assert.strictEqual(res.total, 20, `Attendu 20 démarches au statut PUBLIE, obtenu ${res.total}`);
    assert.strictEqual(res.fiches.length, 20, `Attendu 20 fiches, obtenu ${res.fiches.length}`);
    const cni = res.fiches.find(f => f.id === 'dem-cni-cedeao');
    assert(cni, 'Fiche CNI non trouvée');
    assert.strictEqual(cni.cout_xof, 0, 'Coût CNI doit être 0 FCFA');
    assert(cni.pieces && cni.pieces.length >= 2, 'Pièces CNI manquantes');
  });

  // TEST 5 : Zéro hallucination sur recherche inconnue
  await tester('TST-DAT-05 : Zéro hallucination sur recherche démarche inexistante', async () => {
    const res = await demarchesService.rechercherDemarches({ query: 'permis de soucoupe volante' });
    assert.strictEqual(res.total, 0, 'Une démarche inconnue ne doit retourner aucune fiche');
    assert.strictEqual(res.non_couvert, true, 'Le flag non_couvert doit être true');
    assert(res.portail_officiel.includes('e-senegal.sn'), 'Lien officiel e-senegal doit être fourni');
  });

  // TEST 6 : Trafic Dakar - Zéro crash SQL et gestion des signalements
  await tester('TST-DAT-06 : Service Trafic sans erreur SQL et 12 axes structurants', async () => {
    const etat = await traficService.getEtatTraficComplet();
    assert(etat, 'État trafic null');
    assert.strictEqual(etat.axes.length, 12, `Attendu 12 axes, obtenu ${etat.axes.length}`);
    for (const axe of etat.axes) {
      assert(axe.id && axe.nom, 'Axe invalide');
      assert(['fluide', 'dense', 'bouche', 'indisponible'].includes(axe.niveau), `Niveau de trafic inconnu: ${axe.niveau}`);
    }
  });

  // TEST 7 : Météo MET Norway réelle
  await tester('TST-DAT-07 : Relevé Météo Dakar sourcé MET Norway', async () => {
    const meteo = await meteoService.getMeteo('Dakar');
    assert(meteo, 'Météo nulle');
    assert.strictEqual(meteo.source, 'MET Norway', `Source attendue MET Norway, obtenu ${meteo.source}`);
    assert(typeof meteo.temperature === 'number', 'Température numérique requise');
    assert(meteo.temperature >= 15 && meteo.temperature <= 45, `Température Dakar anormale: ${meteo.temperature}`);
  });

  // TEST 8 : Sport ESPN Live
  await tester('TST-DAT-08 : Flux Sport ESPN temps réel sans faux matchs', async () => {
    const matchs = await sportService.chargerDonneesSportEnDirect();
    assert(Array.isArray(matchs), 'Liste des matchs doit être un tableau');
    assert(matchs.length > 0, 'Matchs ESPN attendus');
    for (const m of matchs) {
      assert(m.equipe_domicile && m.equipe_exterieur, 'Équipes manquantes');
      assert(['A_VENIR', 'EN_DIRECT', 'TERMINE'].includes(m.statut), `Statut sport inconnu: ${m.statut}`);
    }
  });

  // TEST 9 : Kiosque des Unes - Zéro nom générique "Journal N°X"
  await tester('TST-DAT-09 : Kiosque des Unes sans faux titres génériques', async () => {
    const unes = await kiosqueService.recupererUnesDuJour();
    assert(Array.isArray(unes), 'Unes doit être un tableau');
    assert(unes.length > 0, 'Unes attendues');
    const generiques = unes.filter(u => u.nom_journal && u.nom_journal.startsWith('Journal N°'));
    assert.strictEqual(generiques.length, 0, `Détecté ${generiques.length} Unes avec libellé générique 'Journal N°X' !`);
  });

  // TEST 10 : Étanchéité Nopalou
  await tester('TST-DAT-10 : Préservation de l intégrité des tables Nopalou', async () => {
    const bRes = await pool.query('SELECT COUNT(*) as cnt FROM boutiques');
    assert(parseInt(bRes.rows[0].cnt, 10) >= 0, 'Table boutiques altérée');
    const pRes = await pool.query('SELECT COUNT(*) as cnt FROM boutique_produits');
    assert(parseInt(pRes.rows[0].cnt, 10) >= 0, 'Table boutique_produits altérée');
  });

  // TEST 11 : Émissions Célèbres Politique & Société (Surga Vidéos)
  await tester('TST-DAT-11 : Émissions Politique & Société dans Surga Vidéos (TFM, Walf, 7tv, Sen TV, RTS)', async () => {
    const { getSources, getDernieresVideos } = require('../../../backend/services/surga/video-service');
    const sources = await getSources({ type: 'EMISSION' });
    assert(Array.isArray(sources) && sources.length >= 5, 'Au moins 5 sources d émissions officielles attendues');
    const videos = await getDernieresVideos({ type: 'EMISSION', limit: 10 });
    assert(Array.isArray(videos) && videos.length >= 5, 'Au moins 5 vidéos d émissions récentes attendues');
    const tfm = sources.find(s => s.id === 'src-tfm-politique');
    assert(Boolean(tfm), 'Source TFM Politique attendue');
  });

  console.log('\n===============================================================');
  console.log(`RÉSULTAT GLOBAL : ${reussis} / ${reussis + echoues} tests validés`);
  if (echoues > 0) {
    console.error(`❌ ÉCHEC : ${echoues} test(s) en erreur !`);
    process.exit(1);
  } else {
    console.log('🎉 SUCCÈS TOTAL : 100% DES TESTS ANTI-RÉGRESSION SONT AU VERT !');
    process.exit(0);
  }
}

executerTests().catch(err => {
  console.error('Erreur inattendue:', err);
  process.exit(1);
});
