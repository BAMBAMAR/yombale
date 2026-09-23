// backend/scripts/consolidate-immo-classifiees.js
// Décloisonnement du catalogue : Consolidation idempotente des annonces classifiées 'immo'
// vers le portail unifié annonces_immo (IMM-003)

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../models/db');

function infererTransaction(titre = '', description = '') {
  const text = `${titre} ${description}`.toLowerCase();
  if (/\b(à louer|a louer|location|bail|loue|colocation)\b/i.test(text)) {
    return 'location';
  }
  if (/\b(à vendre|a vendre|vente|vends|terrain|titre foncier|tf|parcelle|bail à céder)\b/i.test(text)) {
    return 'vente';
  }
  return 'location';
}

function infererTypeBien(titre = '', description = '') {
  const text = `${titre} ${description}`.toLowerCase();
  if (/\b(terrain|parcelle|hectare|m2 agricole|titre foncier)\b/i.test(text)) return 'terrain';
  if (/\b(villa|maison|duplex|triplex|immeuble)\b/i.test(text)) return 'villa';
  if (/\b(studio)\b/i.test(text)) return 'studio';
  if (/\b(chambre)\b/i.test(text)) return 'chambre';
  if (/\b(bureau|local|commerce|magasin|hangar|entrepot)\b/i.test(text)) return 'bureau';
  return 'appartement';
}

async function consolidateImmoClassifiees() {
  console.log('🔄 Démarrage de la consolidation des annonces classifiées immo...');

  const { rows: ads } = await pool.query(`
    SELECT id, utilisateur_id, titre, description, prix, ville, quartier,
           photos, contact_nom, contact_tel, actif, supprimee, created_at, updated_at
    FROM annonces_classifiees
    WHERE categorie_slug = 'immo'
    ORDER BY created_at ASC
  `);

  console.log(`📋 Annonces classifiées immo trouvées : ${ads.length}`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const ad of ads) {
    if (ad.supprimee) {
      // Si supprimée, désactiver le miroir dans annonces_immo si existant
      await pool.query(`
        UPDATE annonces_immo 
        SET supprimee = true, actif = false, updated_at = NOW() 
        WHERE source = 'particulier_annonce' AND ref_externe = $1
      `, [`classifiee-${ad.id}`]);
      skipped++;
      continue;
    }

    const transaction = infererTransaction(ad.titre, ad.description);
    const type_bien = infererTypeBien(ad.titre, ad.description);
    const photosJson = Array.isArray(ad.photos) ? JSON.stringify(ad.photos) : (typeof ad.photos === 'string' ? ad.photos : '[]');
    const ville = ad.ville ? ad.ville.trim() : 'Dakar';
    const ref_externe = `classifiee-${ad.id}`;

    // Nettoyer prix aberrant si < 10 000 FCFA
    const prix = (ad.prix && Number(ad.prix) >= 10000) ? Number(ad.prix) : null;

    const res = await pool.query(`
      INSERT INTO annonces_immo (
        titre, type_bien, transaction, prix, ville, quartier, description,
        photos, source, ref_externe, actif, supprimee, contact_nom, contact_tel,
        utilisateur_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8::jsonb, 'particulier_annonce', $9, $10, false, $11, $12,
        $13, $14, $15
      )
      ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
      DO UPDATE SET
        titre = EXCLUDED.titre,
        type_bien = EXCLUDED.type_bien,
        transaction = EXCLUDED.transaction,
        prix = EXCLUDED.prix,
        ville = EXCLUDED.ville,
        quartier = EXCLUDED.quartier,
        description = EXCLUDED.description,
        photos = EXCLUDED.photos,
        actif = EXCLUDED.actif,
        supprimee = EXCLUDED.supprimee,
        contact_nom = EXCLUDED.contact_nom,
        contact_tel = EXCLUDED.contact_tel,
        updated_at = NOW()
      RETURNING (xmax = 0) AS is_insert;
    `, [
      ad.titre,
      type_bien,
      transaction,
      prix,
      ville,
      ad.quartier || null,
      ad.description || null,
      photosJson,
      ref_externe,
      Boolean(ad.actif),
      ad.contact_nom || null,
      ad.contact_tel || null,
      ad.utilisateur_id || null,
      ad.created_at || new Date(),
      ad.updated_at || new Date(),
    ]);

    if (res.rows[0]?.is_insert) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`✅ Consolidation terminée avec succès :`);
  console.log(`   - Insérées : ${inserted}`);
  console.log(`   - Mises à jour : ${updated}`);
  console.log(`   - Ignorées/Supprimées : ${skipped}`);

  const { rows: countRows } = await pool.query(`
    SELECT COUNT(*) as total_immo,
           COUNT(*) FILTER (WHERE source = 'particulier_annonce') as total_pont_classifiees,
           COUNT(*) FILTER (WHERE source = 'coinafrique') as total_coin,
           COUNT(*) FILTER (WHERE source = 'expat-dakar') as total_expat
    FROM annonces_immo
    WHERE supprimee = false
  `);

  console.log('📊 État final catalogue annonces_immo :', countRows[0]);
}

if (require.main === module) {
  consolidateImmoClassifiees()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Erreur consolidation :', err);
      process.exit(1);
    });
}

module.exports = { consolidateImmoClassifiees, infererTransaction, infererTypeBien };
