// backend/services/surga/donnees-service.js
// Service de portabilité, export et droit à l'oubli pour Surga (Tranche 16)
// Conformité stricte CDP Sénégal / RGPD, sécurité anti-IDOR, zéro émoji

const { pool } = require('../../models/db');

/**
 * Exporte l'intégralité des données personnelles liées à un utilisateur Surga
 */
async function exporterDonneesUtilisateur({ userId }) {
  if (!userId) {
    throw new Error('Identifiant utilisateur requis.');
  }

  let phone = null;
  if (pool) {
    try {
      const userRes = await pool.query('SELECT telephone FROM utilisateurs WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        phone = userRes.rows[0].telephone;
      }
    } catch (e) {
      console.warn('[SURGA DONNEES SERVICE]: Impossible de récupérer le téléphone', e.message);
    }
  }

  const exportGlobal = {
    date_export: new Date().toISOString(),
    utilisateur_id: userId,
    telephone: phone || null,
    preferences: null,
    notes: [],
    depenses: [],
    agenda: [],
    alertes_immo: [],
    concours_suivis: [],
    favoris_places: [],
    abonnements: [],
    video_abonnements: [],
    profil_pro: null,
    documents_emploi: [],
    usages: [],
    demarches_suivies: [],
    demarches_signalements: [],
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
        // SRG-A1-018 : colonnes réelles de la table (l'ancienne liste visait « tags », absente : l'export sortait vide)
        'SELECT id, titre, contenu, categorie, couleur, epingle, is_checklist, checklist, created_at, updated_at FROM surga_notes WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      exportGlobal.notes = notesRes.rows;
    }

    // 3. Dépenses
    if (userId) {
      const depensesRes = await pool.query(
        'SELECT id, montant_xof, categorie, note, date_depense, created_at FROM surga_depenses WHERE user_id = $1 ORDER BY date_depense DESC',
        [userId]
      );
      exportGlobal.depenses = depensesRes.rows;
    }

    // 4. Agenda
    if (userId) {
      const agendaRes = await pool.query(
        'SELECT id, titre, description, date_evenement, heure_evenement, priorite, categorie, lieu, est_rappel, repetition, termine, created_at FROM surga_agenda WHERE user_id = $1 ORDER BY date_evenement DESC',
        [userId]
      );
      exportGlobal.agenda = agendaRes.rows;
    }

    // 5. Alertes Immo
    if (userId) {
      const alertesRes = await pool.query(
        'SELECT * FROM surga_alertes_immo WHERE user_id = $1',
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

    // 9. Abonnements Séries & Vidéos
    if (userId) {
      const vidAbosRes = await pool.query(
        `SELECT va.id, va.source_id, va.canal, va.created_at, vs.nom as source_nom, vs.type as source_type
         FROM surga_video_abonnements va
         LEFT JOIN surga_video_sources vs ON va.source_id = vs.id
         WHERE va.user_id = $1`,
        [userId]
      );
      exportGlobal.video_abonnements = vidAbosRes.rows;
    }

    // 10. Profil Professionnel & Documents Emploi (Tranche 18)
    if (userId) {
      const profilRes = await pool.query(
        'SELECT * FROM surga_profil_pro WHERE user_id = $1',
        [userId]
      );
      if (profilRes.rows.length > 0) exportGlobal.profil_pro = profilRes.rows[0];

      const docsRes = await pool.query(
        'SELECT id, type, titre, modele, offre_texte, est_achete, created_at FROM surga_documents_emploi WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      exportGlobal.documents_emploi = docsRes.rows;

      const usagesRes = await pool.query(
        'SELECT service, periode, quantite, updated_at FROM surga_usages WHERE user_id = $1',
        [userId]
      );
      exportGlobal.usages = usagesRes.rows;

      // 11. Démarches administratives (Tranche 20)
      const demarchesRes = await pool.query(
        `SELECT s.id, s.demarche_id, s.date_echeance, s.notes, s.statut, s.created_at, d.titre, d.slug, d.categorie
         FROM surga_demarches_suivis s
         LEFT JOIN surga_demarches d ON s.demarche_id = d.id
         WHERE s.user_id = $1
         ORDER BY s.created_at DESC`,
        [userId]
      );
      exportGlobal.demarches_suivies = demarchesRes.rows;

      const sigRes = await pool.query(
        `SELECT id, demarche_id, message, statut, created_at
         FROM surga_demarches_signalements
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      exportGlobal.demarches_signalements = sigRes.rows;
    }
  } catch (err) {
    // SRG-A1-018 : une erreur de lecture ne doit plus produire un export partiel présenté comme complet.
    console.error('[SURGA EXPORT ERREUR]:', err.message);
    throw err;
  }

  return exportGlobal;
}

/**
 * Supprime de façon irréversible et complète l'intégralité des données personnelles de l'utilisateur
 */
async function supprimerDonneesUtilisateur({ userId }) {
  if (!userId) {
    throw new Error('Identifiant utilisateur requis pour la suppression.');
  }

  let phone = null;
  if (pool) {
    try {
      const userRes = await pool.query('SELECT telephone FROM utilisateurs WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        phone = userRes.rows[0].telephone;
      }
    } catch (e) {
      console.warn('[SURGA PURGE SERVICE]: Impossible de récupérer le téléphone', e.message);
    }
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

  let client = null;
  try {
    client = await pool.connect();
  } catch (errConnect) {
    // SRG-A1-017 / SRG-A1-019 : sans base, la purge n'a pas eu lieu. Le dire, au lieu de renvoyer un bilan de succès.
    throw errConnect;
  }
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

      // Abonnements vidéos
      const resVid = await client.query('DELETE FROM surga_video_abonnements WHERE user_id = $1', [userId]);
      resultats.video_abonnements_supprimes = resVid.rowCount;

      // Documents emploi et profil pro (Tranche 18)
      const resDocs = await client.query('DELETE FROM surga_documents_emploi WHERE user_id = $1', [userId]);
      resultats.documents_emploi_supprimes = resDocs.rowCount;

      const resProf = await client.query('DELETE FROM surga_profil_pro WHERE user_id = $1', [userId]);
      resultats.profil_pro_supprime = resProf.rowCount > 0;

      await client.query('DELETE FROM surga_usages WHERE user_id = $1', [userId]);

      // Démarches administratives (Tranche 20)
      const resDemSuivis = await client.query('DELETE FROM surga_demarches_suivis WHERE user_id = $1', [userId]);
      resultats.demarches_suivies_supprimees = resDemSuivis.rowCount;
      await client.query('DELETE FROM surga_demarches_signalements WHERE user_id = $1', [userId]);

      // Préférences
      await client.query('DELETE FROM surga_preferences WHERE user_id = $1', [userId]);
      resultats.preferences_reinitialisees = true;

      // SRG-A1-019 : tables oubliées par la purge (le journal des notifications porte le titre des rappels).
      await client.query('DELETE FROM surga_notifications_logs WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM surga_push_subscriptions WHERE user_id = $1', [userId]);
    }

    if (phone) {
      // SRG-A1-019 : le numéro est stocké avec ou sans « + » selon la table ; la comparaison se fait sur les chiffres
      // du numéro complet (jamais sur un suffixe, qui confondrait deux pays).
      const chiffres = String(phone).replace(/\D/g, '');
      if (chiffres.length >= 8) {
        await client.query("DELETE FROM surga_whatsapp_sessions WHERE regexp_replace(phone, '\\D', '', 'g') = $1", [chiffres]);
        await client.query("DELETE FROM surga_quotas WHERE regexp_replace(phone, '\\D', '', 'g') = $1", [chiffres]);
      }
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
