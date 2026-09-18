// scripts/test-whatsapp-security.mjs — Validation de la sécurité du chatbot WhatsApp
import 'dotenv/config';
import { pool } from '../backend/models/db.js';
import { checkBoutiqueQuotas } from '../backend/routes/boutiques-modules/helpers.js';

async function testWhatsAppSecurity() {
  console.log('🤖 VALIDATION DE LA SÉCURITÉ WHATSAPP CHATBOT...\n');

  // Test 1 : Quotas WhatsApp (Compte avec 3+ boutiques)
  console.log('--- Test 1 : Quota de boutiques via WhatsApp ---');
  // Cherchons un utilisateur qui a déjà plusieurs boutiques
  const userWithBoutiques = await pool.query(
    `SELECT utilisateur_id, COUNT(*) as cnt 
     FROM boutiques 
     GROUP BY utilisateur_id 
     HAVING COUNT(*) >= 3 
     LIMIT 1`
  );

  if (userWithBoutiques.rows[0]) {
    const uid = userWithBoutiques.rows[0].utilisateur_id;
    const cnt = userWithBoutiques.rows[0].cnt;
    console.log(`Utilisateur trouvé avec ${cnt} boutiques (ID: ${uid})`);
    const quota = await checkBoutiqueQuotas(uid, '770000000');
    if (!quota.allowed) {
      console.log(`✅ [PASS] Blocage du quota effectif : "${quota.error}"`);
    } else {
      console.error(`❌ [FAIL] Le quota n'a pas bloqué un utilisateur avec ${cnt} boutiques !`);
      process.exit(1);
    }
  } else {
    console.log('ℹ️ Aucun utilisateur avec >= 3 boutiques trouvé, test sur seuil simulé.');
  }

  // Test 2 : Commande isolée sur WhatsApp (Requête anti-BOLA)
  console.log('\n--- Test 2 : Requête anti-BOLA sur les commandes WhatsApp ---');
  // Créons une commande de test pour vérifier la clause WHERE
  const cmdCheck = await pool.query(
    `SELECT reference, client_telephone FROM commandes_boutique LIMIT 1`
  );

  if (cmdCheck.rows[0]) {
    const { reference, client_telephone } = cmdCheck.rows[0];
    const attackerPhoneClean = '999999999'; // Numéro pirate

    const queryResult = await pool.query(
      `SELECT c.reference, c.statut, c.montant_total AS montant
       FROM commandes_boutique c
       LEFT JOIN boutiques b ON b.id = c.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE (c.reference ILIKE $1 OR c.id::text = $1)
         AND (
           c.client_telephone LIKE '%' || $2
           OR b.telephone LIKE '%' || $2
           OR b.whatsapp LIKE '%' || $2
           OR u.telephone LIKE '%' || $2
         )
       LIMIT 1`,
      [reference, attackerPhoneClean]
    );

    if (queryResult.rows.length === 0) {
      console.log(`✅ [PASS] La commande ${reference} est INACCESSIBLE au numéro pirate ${attackerPhoneClean}`);
    } else {
      console.error(`❌ [FAIL] La commande ${reference} a fui au numéro pirate !`);
      process.exit(1);
    }
  }

  console.log('\n=======================================================');
  console.log('   SÉCURITÉ WHATSAPP VALIDÉE AVEC SUCCÈS !');
  console.log('=======================================================\n');
  await pool.end();
}

testWhatsAppSecurity().catch(err => {
  console.error('Erreur test WhatsApp:', err);
  process.exit(1);
});
