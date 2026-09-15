require('dotenv').config();
const { pool } = require('../models/db');
const { enregistrerAgenceAuditLog } = require('../lib/auditLoggerImmo');

async function main() {
  try {
    const agenceId = 'b896e4f8-cbc9-4291-abb6-d577942f1b61'; // amar-immo
    const userId = '9f51e682-296f-4f57-ac86-98116487a3ed'; // BAMBA

    await enregistrerAgenceAuditLog(
      agenceId,
      userId,
      'BAMBA (Directeur Agence)',
      'creation_facture_immo',
      "Émission de la facture d'honoraires FACT-2026-TR01 (honoraires_vente) - Montant: 5 310 100 FCFA pour Babacar Ndiaye",
      { numero_facture: 'FACT-2026-TR01', type: 'honoraires_vente', montant_ttc: 5310100 }
    );

    await enregistrerAgenceAuditLog(
      agenceId,
      userId,
      'BAMBA (Directeur Agence)',
      'encaissement_facture_immo',
      "Règlement encaissé pour la facture d'honoraires FACT-2026-GL09 (29 600 FCFA) via virement bancaire",
      { numero_facture: 'FACT-2026-GL09', type: 'gestion_locative', montant_ttc: 29600 }
    );

    await enregistrerAgenceAuditLog(
      agenceId,
      userId,
      'BAMBA (Directeur Agence)',
      'encaissement_facture_immo',
      "Règlement encaissé pour la facture d'honoraires FACT-2026-LOC02 (147 600 FCFA) via Wave",
      { numero_facture: 'FACT-2026-LOC02', type: 'honoraires_location', montant_ttc: 147600 }
    );

    console.log('✅ Audit logs factures insérés avec succès !');
    await pool.end();
  } catch (err) {
    console.error('Erreur seed audit logs:', err);
    process.exit(1);
  }
}

main();
