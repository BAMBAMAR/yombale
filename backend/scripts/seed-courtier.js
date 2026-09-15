// backend/scripts/seed-courtier.js
// Script de peuplement de courtiers partenaires et transactions liées pour l'agence
require('dotenv').config();
const { pool } = require('../models/db');
const bcrypt = require('bcryptjs');

async function seedCourtiers() {
  console.log('🌱 Démarrage du peuplement des courtiers & transactions...');

  try {
    // 1. Trouver l'agence amar-immo
    const { rows: agenceRows } = await pool.query("SELECT id, nom, slug, utilisateur_id FROM agences_immo WHERE slug = 'amar-immo'");
    if (agenceRows.length === 0) {
      console.log('Agence amar-immo introuvable.');
      process.exit(1);
    }
    const agence = agenceRows[0];
    console.log(`Agence trouvée : ${agence.nom} (${agence.id})`);

    // 2. Créer ou récupérer les comptes utilisateurs courtiers
    const courtiersData = [
      {
        nom: 'Diallo',
        prenom: 'Abdoulaye',
        email: 'abdoulaye.diallo.courtier@gmail.com',
        telephone: '+221 77 654 32 10',
        ville: 'Dakar',
        role_label: 'courtier',
        specialite: 'Courtier Financement Immobilier & Crédit Habitat (Cabinet Teranga Courtage)'
      },
      {
        nom: 'Sow',
        prenom: 'Aïssatou',
        email: 'aissatou.sow.courtage@gmail.com',
        telephone: '+221 78 543 21 09',
        ville: 'Dakar',
        role_label: 'courtier',
        specialite: 'Apporteuse d\'Affaires & Chasseur Immobilier Indépendante'
      }
    ];

    const seededCourtiers = [];

    for (const c of courtiersData) {
      let userId;
      const { rows: existingUser } = await pool.query('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER($1)', [c.email]);
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        console.log(`Utilisateur courtier existant : ${c.prenom} ${c.nom} (${userId})`);
      } else {
        const hash = await bcrypt.hash('Courtier2026!', 10);
        const { rows: newUser } = await pool.query(
          `INSERT INTO utilisateurs (nom, prenom, email, telephone, ville, mot_de_passe_hash, est_apporteur, email_verifie)
           VALUES ($1, $2, $3, $4, $5, $6, true, true)
           RETURNING id`,
          [c.nom, c.prenom, c.email, c.telephone, c.ville, hash]
        );
        userId = newUser[0].id;
        console.log(`Utilisateur courtier créé : ${c.prenom} ${c.nom} (${userId})`);
      }

      // Ajouter comme membre de l'agence
      await pool.query(
        `INSERT INTO agence_membres (agence_id, utilisateur_id, role, permissions, actif)
         VALUES ($1, $2, 'courtier', $3, true)
         ON CONFLICT (agence_id, utilisateur_id)
         DO UPDATE SET role = 'courtier', permissions = $3, actif = true`,
        [
          agence.id,
          userId,
          JSON.stringify({
            specialite: c.specialite,
            telephone: c.telephone,
            partage_taux_commission: 20,
            access_transactions: true,
          })
        ]
      );
      console.log(`Membre agence associé : ${c.prenom} ${c.nom} comme courtier`);
      seededCourtiers.push({ ...c, id: userId });
    }

    // 3. Créer ou récupérer un contact acquéreur et un propriétaire pour une transaction de vente
    let acquereurId, vendeurId;
    const { rows: existingAcq } = await pool.query(
      "SELECT id FROM contacts_immo WHERE agence_id = $1 AND email = 'moussa.ba@invest-sn.com'",
      [agence.id]
    );
    if (existingAcq.length > 0) {
      acquereurId = existingAcq[0].id;
    } else {
      const { rows: newAcq } = await pool.query(
        `INSERT INTO contacts_immo (agence_id, type_contact, prenom, nom, email, telephone, budget_max, notes)
         VALUES ($1, 'acquereur', 'Moussa', 'BA', 'moussa.ba@invest-sn.com', '+221 77 123 45 67', 200000000, 'Acquéreur qualifié via Courtier Teranga Finance')
         RETURNING id`,
        [agence.id]
      );
      acquereurId = newAcq[0].id;
    }

    const { rows: existingProprio } = await pool.query(
      "SELECT id FROM proprietaires_immo WHERE agence_id = $1 LIMIT 1",
      [agence.id]
    );
    if (existingProprio.length > 0) {
      vendeurId = existingProprio[0].id;
    } else {
      const { rows: newProprio } = await pool.query(
        `INSERT INTO proprietaires_immo (agence_id, prenom, nom, email, telephone, adresse)
         VALUES ($1, 'Fatou', 'Diop', 'fatou.diop@orange.sn', '+221 76 999 88 77', 'Almadies, Dakar')
         RETURNING id`,
        [agence.id]
      );
      vendeurId = newProprio[0].id;
    }

    // 4. Créer un bien en vente "Villa Duplex Almadies" s'il n'existe pas
    let bienVenteId;
    const { rows: existingBien } = await pool.query(
      "SELECT id FROM biens_immo WHERE agence_id = $1 AND titre ILIKE '%Villa Duplex Almadies%'",
      [agence.id]
    );
    if (existingBien.length > 0) {
      bienVenteId = existingBien[0].id;
    } else {
      const { rows: newBien } = await pool.query(
        `INSERT INTO biens_immo (
          agence_id, titre, type_bien, statut, prix_vente,
          nb_chambres, nb_sdb, surface_m2, adresse, quartier, ville, pays,
          description, photos
        ) VALUES (
          $1, 'Villa Duplex Almadies 5P', 'villa', 'sous_offre', 185000000,
          5, 4, 380, 'Route des Almadies', 'Almadies', 'Dakar', 'Sénégal',
          'Superbe villa contemporaine avec piscine, salon traversant, finitions grand luxe.',
          $2
        ) RETURNING id`,
        [
          agence.id,
          JSON.stringify(['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'])
        ]
      );
      bienVenteId = newBien[0].id;
      console.log(`Bien en vente créé : Villa Duplex Almadies (${bienVenteId})`);
    }

    // 5. Créer une transaction de vente avec le courtier Abdoulaye Diallo
    const courtierPrincipal = seededCourtiers[0];
    const { rows: existingTx } = await pool.query(
      "SELECT id FROM transactions_immo WHERE agence_id = $1 AND bien_id = $2",
      [agence.id, bienVenteId]
    );

    let txId;
    if (existingTx.length > 0) {
      txId = existingTx[0].id;
      await pool.query(
        `UPDATE transactions_immo
         SET courtier_id = $1, statut = 'compromis_signe', montant = 185000000
         WHERE id = $2`,
        [courtierPrincipal.id, txId]
      );
      console.log(`Transaction mise à jour avec courtier : ${txId}`);
    } else {
      const { rows: newTx } = await pool.query(
        `INSERT INTO transactions_immo (
          agence_id, bien_id, vendeur_id, acheteur_id, agent_id, courtier_id,
          type_transaction, montant, date_transaction, statut, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'vente', 185000000, CURRENT_DATE, 'compromis_signe',
          $7
        ) RETURNING id`,
        [
          agence.id,
          bienVenteId,
          vendeurId,
          acquereurId,
          agence.utilisateur_id,
          courtierPrincipal.id,
          'Acquéreur apporté par le courtier Abdoulaye Diallo (Teranga Courtage). Accord de prêt bancaire BOA 140M validé.'
        ]
      );
      txId = newTx[0].id;
      console.log(`Transaction créée avec courtier : ${txId}`);
    }

    // 6. Créer la commission associée (5% = 9 250 000 FCFA avec partage courtier 25% = 2 312 500 FCFA)
    const comBrute = 9250000;
    const partCourtier = 2312500;
    const partAgence = comBrute - partCourtier;

    const { rows: existingCom } = await pool.query(
      "SELECT id FROM commissions_immo WHERE transaction_id = $1",
      [txId]
    );

    const repartition = [
      { beneficiaire: 'Agence AMAR IMMO', type: 'agence', montant: partAgence, pourcentage: 75 },
      { beneficiaire: `${courtierPrincipal.prenom} ${courtierPrincipal.nom} (Courtier)`, type: 'courtier', montant: partCourtier, pourcentage: 25, user_id: courtierPrincipal.id }
    ];

    if (existingCom.length > 0) {
      await pool.query(
        `UPDATE commissions_immo
         SET montant_brut = $1, montant_net = $1, montant_restant = $1, repartition = $2
         WHERE id = $3`,
        [comBrute, JSON.stringify(repartition), existingCom[0].id]
      );
      console.log('Commission transaction mise à jour');
    } else {
      await pool.query(
        `INSERT INTO commissions_immo (
          agence_id, transaction_id, montant_brut, montant_net, montant_paye, montant_restant,
          repartition, statut, date_prevue, notes
        ) VALUES (
          $1, $2, $3, $3, 0, $3,
          $4, 'en_attente', CURRENT_DATE + INTERVAL '30 days',
          'Commission 5% sur vente villa 185M FCFA avec partage courtier 25%'
        )`,
        [agence.id, txId, comBrute, JSON.stringify(repartition)]
      );
      console.log('Commission créée avec répartition courtier');
    }

    console.log('✅ Peuplement des courtiers & transactions terminé avec succès !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seedCourtiers :', err);
    process.exit(1);
  }
}

seedCourtiers();
