require('dotenv').config();
const { pool } = require('../models/db');

async function main() {
  try {
    const agenceId = 'b896e4f8-cbc9-4291-abb6-d577942f1b61'; // amar-immo
    const bienId = '6b8f6650-18ac-482e-a0f0-04c201bc2ab7'; // APPART FOIRE
    const locId = '145dd175-fd79-4766-a52f-f17b1b704b55'; // amar

    // Check if already created
    const { rows: existing } = await pool.query(
      `SELECT id FROM baux_immo WHERE agence_id = $1`,
      [agenceId]
    );

    if (existing.length > 0) {
      console.log('Des baux existent déjà pour cette agence:', existing.length);
      await pool.end();
      return;
    }

    const { rows: [b] } = await pool.query(
      `INSERT INTO baux_immo (
        agence_id, bien_id, locataire_id, date_debut, date_fin, duree_mois,
        loyer_mensuel, charges, depot_garantie, jour_echeance, statut
      ) VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 12, 250000, 25000, 500000, 5, 'actif')
      RETURNING *`,
      [agenceId, bienId, locId]
    );

    console.log('✅ Bail créé:', b.id);

    const start = new Date(b.date_debut);
    for (let i = 0; i < 12; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      d.setDate(5);
      const per = d.toISOString().substring(0, 7);
      const ds = d.toISOString().split('T')[0];
      const isPast = i === 0;

      await pool.query(
        `INSERT INTO loyers_echeances (
          bail_id, agence_id, periode, date_echeance, montant_du, montant_paye, montant_restant, statut, date_paiement, mode_paiement, quittance_url
        ) VALUES ($1, $2, $3, $4, 275000, $5, $6, $7, $8, $9, $10)`,
        [
          b.id,
          agenceId,
          per,
          ds,
          isPast ? 275000 : 0,
          isPast ? 0 : 275000,
          isPast ? 'paye' : (i === 1 ? 'en_attente' : 'en_attente'),
          isPast ? ds : null,
          isPast ? 'wave' : null,
          isPast ? `QT-${per}-${b.id.slice(0, 6).toUpperCase()}` : null
        ]
      );
    }

    console.log('✅ 12 échéances de loyers générées avec succès pour Amar Immo !');
  } catch (err) {
    console.error('Erreur seed bail:', err);
  } finally {
    await pool.end();
  }
}

main();
