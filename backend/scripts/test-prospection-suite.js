const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const {
  normaliserTelephoneSenegal,
  nettoyerNomBoutique,
  nettoyerContactNom,
  estLeadEmploiOuInvalide,
  estNomPropreAuthentique,
  detecterQuartier,
  interpolerMessage,
  traiterSpintax,
  TEMPLATES_PAR_DEFAUT
} = require('../services/prospection');
const { ajouterBlacklist, retirerBlacklist, estDesinscrit } = require('../services/whatsapp');

async function runTests() {
  console.log('==================================================');
  console.log('=== TEST SUITE MOTEUR DE PROSPECTION NOPALOU ===');
  console.log('==================================================\n');

  const results = {
    phoneNormalization: [],
    nameCleaning: [],
    categoryAndEmploymentFilter: [],
    blacklistBehavior: [],
    spintaxAndInterpolation: [],
    crmPersistCheck: [],
  };

  // 1. TEST NORMALISATION TÉLÉPHONES (DIFFÉRENTS FORMATS ET CAS PIÈGES)
  const phoneTests = [
    { input: '77 123 45 67', expectedValid: true, expectedNat: '221771234567', op: 'Orange' },
    { input: '+221 78 987 65 43', expectedValid: true, expectedNat: '221789876543', op: 'Orange' },
    { input: '00221 76 555 44 33', expectedValid: true, expectedNat: '221765554433', op: 'Free (Yas)' },
    { input: '221701112233', expectedValid: true, expectedNat: '221701112233', op: 'Expresso' },
    { input: '75 000 11 22', expectedValid: true, expectedNat: '221750001122', op: 'Promobile' },
    { input: '33 821 00 00', expectedValid: true, expectedNat: '221338210000', op: 'Fixe' }, // Fixe (ne doit pas être ciblé par WhatsApp)
    { input: '77 123 45', expectedValid: false, desc: 'Trop court (7 chiffres)' },
    { input: '+33 6 12 34 56 78', expectedValid: false, desc: 'France (hors Sénégal)' },
    { input: '77 123 45 67 89', expectedValid: false, desc: 'Trop long (11 chiffres)' },
    { input: 'Voir sur Facebook', expectedValid: false, desc: 'Texte d\'annonce résiduel' },
    { input: null, expectedValid: false, desc: 'Null' },
  ];

  console.log('1. TEST NORMALISATION TÉLÉPHONES:');
  for (const t of phoneTests) {
    const res = normaliserTelephoneSenegal(t.input);
    const pass = res.valide === t.expectedValid && (!t.expectedNat || res.national === t.expectedNat);
    console.log(`  ${pass ? '✅' : '❌'} Input: "${t.input}" -> Valide: ${res.valide} | National: ${res.national || 'N/A'} | Op: ${res.operateur || res.erreur}`);
    results.phoneNormalization.push({ input: t.input, pass, res });
  }

  // 2. TEST NETTOYAGE DES NOMS ET ENSEIGNES
  const nameTests = [
    { raw: 'Boutique Fatou Dakar', cat: 'mode', q: 'Dakar' },
    { raw: 'Fatou Shop Sandaga', cat: 'mode', q: 'Sandaga' },
    { raw: 'Vente de Robe Soie 15000 FCFA 771234567', cat: 'mode', q: 'Dakar' },
    { raw: 'URGENCE A VENDRE PEUGEOT 308 CLIMATISÉE', cat: 'auto-moto', q: 'Dakar' },
    { raw: 'Participant(e) anonyme', cat: 'divers', q: 'Dakar' },
    { raw: 'Waly Rassoul Diop est à Scat Urbam', cat: 'divers', q: 'Dakar' },
    { raw: 'Cherche emploi chauffeur Dakar', cat: 'emploi', q: 'Dakar' },
    { raw: 'Bamba Ndiaye Tech', cat: 'tech', q: 'Sandaga' },
    { raw: 'Chez Awa Parfumerie', cat: 'beaute', q: 'Plateau' },
    { raw: 'Agence Immobilière HLM', cat: 'immo', q: 'HLM' },
  ];

  console.log('\n2. TEST NETTOYAGE DES NOMS:');
  for (const t of nameTests) {
    const clean = nettoyerNomBoutique(t.raw, t.cat, t.q);
    const isAuth = estNomPropreAuthentique(clean);
    console.log(`  Raw: "${t.raw}" -> Nettoyé: "${clean}" (Authentique: ${isAuth})`);
    results.nameCleaning.push({ raw: t.raw, clean, isAuth });
  }

  // 3. TEST DÉTECTION EMPLOI / FAUX POSITIFS
  const emploiTests = [
    { nom_boutique: 'Chauffeur cherche emploi', notes: 'disponible immédiatement', categorie: 'divers', expected: true },
    { nom_boutique: 'Boutique Mode', notes: 'recrutement de vendeuses', categorie: 'mode', expected: true },
    { nom_boutique: 'Agence Sécurité', notes: 'recrutement agents de sécurité', categorie: 'services', expected: true },
    { nom_boutique: 'Fatou Fashion', notes: 'Robe bazin disponible', categorie: 'mode', expected: false },
    { nom_boutique: 'Tech Dakar GSM', notes: 'iPhone 15 pro max', categorie: 'tech', expected: false },
  ];

  console.log('\n3. TEST DÉTECTION HORS-CIBLE (EMPLOI / RECRUTEMENT):');
  for (const t of emploiTests) {
    const isEmploi = estLeadEmploiOuInvalide(t);
    const pass = isEmploi === t.expected;
    console.log(`  ${pass ? '✅' : '❌'} "${t.nom_boutique}" (Notes: "${t.notes}") -> Faux positif: ${isEmploi} (Attendu: ${t.expected})`);
    results.categoryAndEmploymentFilter.push({ input: t, isEmploi, pass });
  }

  // 4. TEST DE LA BLACKLIST & DÉSINCRIPTION
  console.log('\n4. TEST BLACKLIST & RESPECT STOP:');
  const testPhone = '221770009999';
  await ajouterBlacklist(testPhone, 'test_audit_suite');
  const isBlocked = await estDesinscrit(testPhone);
  console.log(`  Ajout ${testPhone} à la blacklist -> Bloqué: ${isBlocked ? '✅ OUI' : '❌ NON'}`);

  // Test variation d'écriture
  const isBlockedFormatted = await estDesinscrit('+221 77 000 99 99');
  console.log(`  Vérification variation "+221 77 000 99 99" -> Bloqué: ${isBlockedFormatted ? '✅ OUI' : '❌ NON'}`);

  await retirerBlacklist(testPhone);
  const isUnblocked = await estDesinscrit(testPhone);
  console.log(`  Retrait de la blacklist -> Bloqué: ${isUnblocked ? '❌ TOUJOURS BLOQUÉ' : '✅ DÉBLOQUÉ'}`);

  // 5. TEST INTERPOLATION SPINTAX ET MESSAGES
  console.log('\n5. TEST INTERPOLATION SPINTAX ET PERSONNALISATION:');
  const templateTest = TEMPLATES_PAR_DEFAUT[0].texte;
  const lead1 = { nom_boutique: 'Fatou Chic', contact_nom: 'Fatou Ndiaye', quartier: 'HLM', categorie: 'mode', telephone: '221771234567' };
  const lead2 = { nom_boutique: 'Mode', contact_nom: null, quartier: 'Dakar', categorie: 'mode', telephone: '221779998877' };
  const lead3 = { nom_boutique: 'Véhicules', contact_nom: null, quartier: 'Thiès', categorie: 'auto-moto', telephone: '221785554433' };

  console.log('--- MSG LEAD AVEC VRAI NOM (Fatou Chic): ---');
  console.log(interpolerMessage(templateTest, lead1).slice(0, 180) + '...\n');

  console.log('--- MSG LEAD NOM GÉNÉRIQUE (Mode): ---');
  console.log(interpolerMessage(templateTest, lead2).slice(0, 180) + '...\n');

  console.log('--- MSG LEAD VÉHICULES GÉNÉRIQUE (Véhicules): ---');
  console.log(interpolerMessage(templateTest, lead3).slice(0, 180) + '...\n');

  console.log('SUITE DE TESTS TERMINÉE.');
}

runTests().then(() => pool.end());
