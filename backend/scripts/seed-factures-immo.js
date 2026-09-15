require('dotenv').config();
const { pool } = require('../models/db');

async function main() {
  try {
    const agenceId = 'b896e4f8-cbc9-4291-abb6-d577942f1b61'; // amar-immo
    const bienId = '6b8f6650-18ac-482e-a0f0-04c201bc2ab7'; // APPART FOIRE

    // Vérifier si des factures existent déjà
    const { rows: existing } = await pool.query(
      `SELECT count(*) FROM factures_immo WHERE agence_id = $1`,
      [agenceId]
    );

    if (parseInt(existing[0].count, 10) > 0) {
      console.log(`Des factures existent déjà pour cette agence (${existing[0].count}).`);
      await pool.end();
      return;
    }

    const factures = [
      {
        numero: 'FACT-2026-TR01',
        type: 'honoraires_vente',
        client_nom: 'Babacar Ndiaye',
        client_tel: '+221 77 555 44 33',
        client_email: 'babacar.ndiaye@example.sn',
        bien_id: bienId,
        montant_ht: 4500000,
        taux_tva: 18,
        montant_tva: 810000,
        timbre: 100,
        montant_ttc: 5310100,
        statut: 'en_attente',
        date_emission: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        date_echeance: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        mode_paiement: 'virement',
        notes: "Mandat de vente N° MV-2026-004. Commission d'intermédiation de 5% sur vente net vendeur de 90 000 000 FCFA. Exigible à la signature authentique notariée.",
        lignes: [
          { designation: "Honoraires de transaction & négociation immobilière (5% de 90M FCFA)", montant: 4500000 }
        ]
      },
      {
        numero: 'FACT-2026-GL09',
        type: 'gestion_locative',
        client_nom: 'Moussa Sène',
        client_tel: '+221 77 621 12 34',
        client_email: 'moussa.sene@example.sn',
        bien_id: bienId,
        montant_ht: 25000,
        taux_tva: 18,
        montant_tva: 4500,
        timbre: 100,
        montant_ttc: 29600,
        statut: 'payee',
        date_emission: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        date_echeance: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        mode_paiement: 'prelevement_loyer',
        notes: "Honoraires mensuels de gérance locative (10% du loyer de 250 000 FCFA perçu pour APPART FOIRE). Retenu sur le décompte de reversement bailleur.",
        lignes: [
          { designation: "Gestion locative & quittancement numérique (10% sur 250 000 FCFA)", montant: 25000 }
        ]
      },
      {
        numero: 'FACT-2026-LOC02',
        type: 'honoraires_location',
        client_nom: 'Amar',
        client_tel: '+221 77 810 00 00',
        client_email: 'amar@example.sn',
        bien_id: bienId,
        montant_ht: 125000,
        taux_tva: 18,
        montant_tva: 22500,
        timbre: 100,
        montant_ttc: 147600,
        statut: 'payee',
        date_emission: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
        date_echeance: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
        mode_paiement: 'wave',
        notes: "Frais de rédaction de contrat de bail d'habitation et état des lieux contradictoire d'entrée. Part locataire acquittée par Wave.",
        lignes: [
          { designation: "Rédaction bail résidentiel, formalités d'enregistrement & état des lieux entrant", montant: 125000 }
        ]
      }
    ];

    for (const f of factures) {
      await pool.query(
        `INSERT INTO factures_immo (
          agence_id, numero_facture, type_facture, client_nom, client_tel, client_email,
          bien_id, montant_ht, taux_tva, montant_tva, timbre_fiscal, montant_ttc,
          statut, date_emission, date_echeance, mode_paiement, notes, lignes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          agenceId,
          f.numero,
          f.type,
          f.client_nom,
          f.client_tel,
          f.client_email,
          f.bien_id,
          f.montant_ht,
          f.taux_tva,
          f.montant_tva,
          f.timbre,
          f.montant_ttc,
          f.statut,
          f.date_emission,
          f.date_echeance,
          f.mode_paiement,
          f.notes,
          JSON.stringify(f.lignes)
        ]
      );
      console.log(`✅ Facture créée: ${f.numero} (${f.type}) - ${f.montant_ttc} FCFA`);
    }

    console.log('🎉 3 factures réelles d\'agence immobilière insérées avec succès pour amar-immo !');
    await pool.end();
  } catch (err) {
    console.error('Erreur seed factures immo:', err);
    process.exit(1);
  }
}

main();
