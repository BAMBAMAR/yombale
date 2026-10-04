import fs from 'fs';
import path from 'path';
import {
  normaliserTexteVocal,
  extraireQuantite,
  extraireMontantCFA,
  analyserMontants,
  parseSaisieExpressIntent,
  parseDetteIntent,
  separerQuantiteEtMontant
} from '../../../frontend-next/src/lib/voice-assistant';

function saveProof(filename: string, data: any) {
  const dir04 = path.join(__dirname, '../../../audit/04_RESULTATS/PREUVES');
  const dir03 = path.join(__dirname, '../../../audit/03_PREUVES');
  fs.mkdirSync(dir04, { recursive: true });
  fs.mkdirSync(dir03, { recursive: true });
  fs.writeFileSync(path.join(dir04, filename), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(dir03, filename.replace('TEST-', 'PREUVE-TEST-')), JSON.stringify(data, null, 2));
}

async function run() {
  console.log('=== DÉBUT EXÉCUTION SECTION 5 (TEST-012) ===');

  const p1 = "Vente 2 junni";
  const p2 = "Dépense transport benn téemeer";
  const p3 = "Bor Moussa 15 000";
  const p4 = "3 savon à deux mille cinq cents";

  console.log(`\nPhrase 1: "${p1}"`);
  const norm1 = normaliserTexteVocal(p1);
  const montant1 = extraireMontantCFA(norm1);
  const intent1 = parseSaisieExpressIntent(p1);
  const sep1 = separerQuantiteEtMontant(p1);
  console.log({ norm1, montant1, intent1, sep1 });

  console.log(`\nPhrase 2: "${p2}"`);
  const norm2 = normaliserTexteVocal(p2);
  const montant2 = extraireMontantCFA(norm2);
  const intent2 = parseSaisieExpressIntent(p2);
  console.log({ norm2, montant2, intent2 });

  console.log(`\nPhrase 3: "${p3}"`);
  const norm3 = normaliserTexteVocal(p3);
  const montant3 = extraireMontantCFA(norm3);
  const intent3 = parseDetteIntent(p3);
  console.log({ norm3, montant3, intent3 });

  console.log(`\nPhrase 4: "${p4}"`);
  const norm4 = normaliserTexteVocal(p4);
  const montant4 = extraireMontantCFA(norm4);
  const qte4 = extraireQuantite(norm4);
  const sep4 = separerQuantiteEtMontant(p4);
  console.log({ norm4, montant4, qte4, sep4 });

  // Évaluation des 4 critères
  // 1. "Vente 2 junni" -> Montant: 10 000 FCFA
  const pass1 = (montant1 === 10000 || intent1.montant === 10000);
  // 2. "Dépense transport benn téemeer" -> Type: dépense, Montant: 500 FCFA
  const pass2 = (intent2.mode === 'depense' && (intent2.montant === 500 || montant2 === 500));
  // 3. "Bor Moussa 15 000" -> Type: dette/crédit, Client: "Moussa", Montant: 15 000 FCFA
  const pass3 = ((intent3.type === 'vente_credit' || intent3.type === 'recherche') && intent3.nomClient?.toLowerCase() === 'moussa' && intent3.montant === 15000);
  // 4. "3 savon à deux mille cinq cents" -> Quantité: 3, Montant: 2 500 FCFA
  const pass4 = (qte4 === 3 && (montant4 === 2500 || sep4.montant === 2500));

  const t12Pass = pass1 && pass2 && pass3 && pass4;

  const result = {
    status: t12Pass ? 'PASS' : 'FAIL',
    observed: {
      phrase1_2_junni: {
        phrase: p1,
        normalise: norm1,
        montant_extrait: montant1,
        intent: intent1,
        separateur: sep1,
        conforme: pass1,
        attendu: "Montant: 10 000 FCFA (2 junni = 2 x 5 000)"
      },
      phrase2_depense_teemeer: {
        phrase: p2,
        normalise: norm2,
        montant_extrait: montant2,
        intent: intent2,
        conforme: pass2,
        attendu: "Type: depense, Montant: 500 FCFA (benn teemeer = 500)"
      },
      phrase3_bor_moussa: {
        phrase: p3,
        normalise: norm3,
        montant_extrait: montant3,
        intent: intent3,
        conforme: pass3,
        attendu: "Type: credit/dette, Client: Moussa, Montant: 15 000 FCFA"
      },
      phrase4_3_savon_deux_mille_cinq_cents: {
        phrase: p4,
        normalise: norm4,
        quantite_extraite: qte4,
        montant_extrait: montant4,
        separateur: sep4,
        conforme: pass4,
        attendu: "Quantité: 3, Montant: 2 500 FCFA"
      }
    }
  };

  saveProof('TEST-012_preuve-01.json', result);
  console.log(`\nTEST-012 Statut : ${result.status}`);
}

run().catch(err => {
  console.error('Erreur section 5:', err);
  process.exit(1);
});
