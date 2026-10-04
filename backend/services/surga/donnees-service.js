// backend/services/surga/donnees-service.js
// Service de portabilité, export et droit à l'oubli pour Surga (Tranche 16)
// Conformité stricte CDP Sénégal / RGPD, sécurité anti-IDOR, zéro émoji

const { pool } = require('../../models/db');

/**
 * Exporte l'intégralité des données personnelles liées à un utilisateur Surga
 */
async function exporterDonneesUtilisateur({ userId, phone }) {
  if (!userId && !phone) {
    throw new Error('Identifiant utilisateur ou numéro de téléphone requis.');
  }

  const exportGlobal = {
    date_export: new Date().toISOString(),
    utilisateur_id: userId || null,
    telephone: phone || null,
    preferences: null,
    notes: [],
    depenses: [],
    agenda: [],
    alertes_immo: [],
    concours_suivis: [],
    favoris_places: [],
    abonnements: [],
  };

  if (!pool) {
    return exportGlobal;
  }

  try {
    // 1. Préférences
    if (userId) {
      const prefsRes = await pool.query('SELECT * FROM surga_preferences WHERE user_id = $1', [userId]);
      if (prefsRes.rows.length > 0) exportGlobal.preferences = prefsRes.rows[0];
    }

    // 2. Notes
    if (userId) {
      const notesRes = await pool.query(
        'SELECT id, titre, contenu, tags, epingle, created_at, updated_at FROM surga_notes WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      exportGlobal.notes = notesRes.rows;
    }

    // 3. Dépenses
    if (userId) {
      const depensesRes = await pool.query(
        'SELECT id, montant, devise, categorie, description, date_depense, created_at FROM surga_depenses WHERE user_id = $1 ORDER BY date_depense DESC',
        [userId]
      );
      exportGlobal.depenses = depensesRes.rows;
    }

    // 4. Agenda
    if (userId) {
      const agendaRes = await pool.query(
        'SELECT id, titre, description, date_evenement, heure_evenement, termine, created_at FROM surga_agenda WHERE user_id = $1 ORDER BY date_evenement DESC',
        [userId]
      );
      exportGlobal.agenda = agendaRes.rows;
    }

    // 5. Alertes Immo
    if (userId) {
      const alertesRes = await pool.query(
        'SELECT id, criteres, actif, created_at FROM surga_alertes_immo WHERE user_id = $1',
        [userId]
      );
      exportGlobal.alertes_immo = alertesRes.rows;
    }

    // 6. Concours suivis
    if (userId) {
      const concoursRes = await pool.query(
        `SELECT s.id, s.concours_id, s.rappels_actifs, s.created_at, c.titre, c.sigle
         FROM surga_suivi_concours s
         LEFT JOIN surga_concours c ON s.concours_id = c.id
         WHERE s.user_id = $1`,
        [userId]
      );
      exportGlobal.concours_suivis = concoursRes.rows;
    }

    // 7. Favoris adresses
    if (userId) {
      const favRes = await pool.query(
        `SELECT f.id, f.place_id, f.created_at, p.nom, p.quartier, p.categorie
         FROM surga_favoris_places f
         LEFT JOIN surga_places p ON f.place_id = p.id
         WHERE f.user_id = $1`,
        [userId]
      );
      exportGlobal.favoris_places = favRes.rows;
    }

    // 8. Abonnements
    const aboConditions = [];
    const aboParams = [];
    if (userId) {
      aboParams.push(userId);
      aboConditions.push(`user_id = $${aboParams.length}`);
    }
    if (phone) {
      aboParams.push(phone);
      aboConditions.push(`phone = $${aboParams.length}`);
    }

    if (aboConditions.length > 0) {
      const abosRes = await pool.query(
        `SELECT id, plan, cycle, montant_xof, provider, statut, reference_paiement, debut, fin, created_at
         FROM surga_abonnements
         WHERE ${aboConditions.join(' OR ')}
         ORDER BY created_at DESC`,
        aboParams
      );
      exportGlobal.abonnements = abosRes.rows;
    }
  } catch (err) {
    console.warn('[SURGA EXPORT ERREUR]:', err.message);
  }

  return exportGlobal;
}

/**
 * Supprime de façon irréversible et complète l'intégralité des données personnelles de l'utilisateur
 */
async function supprimerDonneesUtilisateur({ userId, phone }) {
  if (!userId && !phone) {
    throw new Error('Identifiant utilisateur ou numéro de téléphone requis pour la suppression.');
  }

  const resultats = {
    notes_supprimees: 0,
    depenses_supprimees: 0,
    agenda_supprime: 0,
    alertes_immo_supprimees: 0,
    concours_suivis_supprimes: 0,
    favoris_supprimes: 0,
    preferences_reinitialisees: false,
  };

  if (!pool) return resultats;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (userId) {
      // Notes
      const resNotes = await client.query('DELETE FROM surga_notes WHERE user_id = $1', [userId]);
      resultats.notes_supprimees = resNotes.rowCount;

      // Dépenses
      const resDep = await client.query('DELETE FROM surga_depenses WHERE user_id = $1', [userId]);
      resultats.depenses_supprimees = resDep.rowCount;

      // Agenda
      const resAgenda = await client.query('DELETE FROM surga_agenda WHERE user_id = $1', [userId]);
      resultats.agenda_supprime = resAgenda.rowCount;

      // Alertes Immo
      const resImmo = await client.query('DELETE FROM surga_alertes_immo WHERE user_id = $1', [userId]);
      resultats.alertes_immo_supprimees = resImmo.rowCount;

      // Concours suivis
      const resConcours = await client.query('DELETE FROM surga_suivi_concours WHERE user_id = $1', [userId]);
      resultats.concours_suivis_supprimes = resConcours.rowCount;

      // Favoris places
      const resFav = await client.query('DELETE FROM surga_favoris_places WHERE user_id = $1', [userId]);
      resultats.favoris_supprimes = resFav.rowCount;

      // Préférences
      await client.query('DELETE FROM surga_preferences WHERE user_id = $1', [userId]);
      resultats.preferences_reinitialisees = true;
    }

    if (phone) {
      await client.query('DELETE FROM surga_whatsapp_sessions WHERE phone = $1', [phone]);
      await client.query('DELETE FROM surga_quotas WHERE phone = $1', [phone]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SURGA PURGE ERREUR]:', err.message);
    throw err;
  } finally {
    client.release();
  }

  return resultats;
}

module.exports = {
  exporterDonneesUtilisateur,
  supprimerDonneesUtilisateur,
};
