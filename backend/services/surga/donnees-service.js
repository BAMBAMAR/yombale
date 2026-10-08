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

// Tables purgées en premier, dans cet ordre, avec leur compteur dans le bilan rendu à l'utilisateur.
const BILAN_PAR_TABLE = {
  surga_notes: 'notes_supprimees',
  surga_depenses: 'depenses_supprimees',
  surga_agenda: 'agenda_supprime',
  surga_alertes_immo: 'alertes_immo_supprimees',
  surga_suivi_concours: 'concours_suivis_supprimes',
  surga_favoris_places: 'favoris_supprimes',
  surga_video_abonnements: 'video_abonnements_supprimes',
  surga_documents_emploi: 'documents_emploi_supprimes',
  surga_demarches_suivis: 'demarches_suivies_supprimees',
};
// Les abonnements suivent une règle à part (D39) : ils ne passent pas par la suppression générale.
const TABLE_ABONNEMENTS = 'surga_abonnements';
const NOM_TABLE_SURGA = /^surga_[a-z0-9_]+$/;

/**
 * Tables surga_* portant une colonne donnée, lues dans le schéma.
 * SRG-A1-019 / SRG-A1-020 : la purge suivait une liste écrite à la main ; chaque table ajoutée ensuite y échappait.
 */
async function tablesSurgaAvecColonne(executeur, colonne) {
  const { rows } = await executeur.query(
    `SELECT table_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name LIKE 'surga\\_%' AND column_name = $1
     ORDER BY table_name`,
    [colonne]
  );
  return rows.filter((r) => NOM_TABLE_SURGA.test(r.table_name));
}

// La colonne user_id est de type uuid dans les migrations ; une base retouchée à la main peut la porter en texte.
const filtreUserId = (type, parametre) => (type === 'uuid' ? `user_id = ${parametre}::uuid` : `user_id::text = ${parametre}::text`);

/**
 * Supprime de façon irréversible et complète l'intégralité des données personnelles de l'utilisateur.
 * D39 : tout est supprimé, sauf les abonnements encaissés, conservés sans téléphone ni identifiant.
 */
async function supprimerDonneesUtilisateur({ userId }) {
  if (!userId) {
    throw new Error('Identifiant utilisateur requis pour la suppression.');
  }
  // SRG-A1-017 / SRG-A1-019 : sans base, la purge n'a pas eu lieu. Le dire, au lieu de renvoyer un bilan de succès.
  if (!pool) throw new Error('Base de données indisponible : aucune donnée n\'a été supprimée.');

  const resultats = {
    notes_supprimees: 0,
    depenses_supprimees: 0,
    agenda_supprime: 0,
    alertes_immo_supprimees: 0,
    concours_suivis_supprimes: 0,
    favoris_supprimes: 0,
    preferences_reinitialisees: false,
    abonnements_supprimes: 0,
    abonnements_conserves_anonymises: 0,
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT telephone FROM utilisateurs WHERE id = $1', [userId]);
    const phone = userRes.rows[0]?.telephone || null;
    // Le numéro est stocké avec ou sans « + » selon la table ; la comparaison se fait sur les chiffres du numéro
    // complet (jamais sur un suffixe, qui confondrait deux pays).
    const chiffres = phone ? String(phone).replace(/\D/g, '') : '';
    const parTelephone = chiffres.length >= 8;

    // 1. Abonnements (D39)
    const proprietaire = parTelephone
      ? "(user_id = $1 OR regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $2)"
      : 'user_id = $1';
    const paramsAbo = parTelephone ? [userId, chiffres] : [userId];
    const encaisse = "statut NOT IN ('en_attente', 'echoue', 'annule') AND montant_xof > 0";
    const resAboSup = await client.query(`DELETE FROM ${TABLE_ABONNEMENTS} WHERE ${proprietaire} AND NOT (${encaisse})`, paramsAbo);
    resultats.abonnements_supprimes = resAboSup.rowCount;
    const resAboAnon = await client.query(
      `UPDATE ${TABLE_ABONNEMENTS}
       SET user_id = NULL, phone = NULL, client_metadata = '{}'::jsonb, updated_at = NOW()
       WHERE ${proprietaire}`,
      paramsAbo
    );
    resultats.abonnements_conserves_anonymises = resAboAnon.rowCount;

    // 2. Toutes les tables Surga rattachées au compte
    const tablesUser = (await tablesSurgaAvecColonne(client, 'user_id')).filter((t) => t.table_name !== TABLE_ABONNEMENTS);
    const connues = Object.keys(BILAN_PAR_TABLE);
    tablesUser.sort((a, b) => {
      const ia = connues.indexOf(a.table_name), ib = connues.indexOf(b.table_name);
      return (ia < 0 ? connues.length : ia) - (ib < 0 ? connues.length : ib);
    });
    for (const t of tablesUser) {
      const res = await client.query(`DELETE FROM ${t.table_name} WHERE ${filtreUserId(t.data_type, '$1')}`, [userId]);
      const cle = BILAN_PAR_TABLE[t.table_name];
      if (cle) resultats[cle] = res.rowCount;
      if (t.table_name === 'surga_profil_pro') resultats.profil_pro_supprime = res.rowCount > 0;
      if (t.table_name === 'surga_preferences') resultats.preferences_reinitialisees = true;
    }

    // 3. Lignes rattachées au seul numéro (sessions et compteurs WhatsApp, alertes posées sans compte)
    if (parTelephone) {
      const tablesTel = (await tablesSurgaAvecColonne(client, 'phone')).filter((t) => t.table_name !== TABLE_ABONNEMENTS);
      for (const t of tablesTel) {
        await client.query(`DELETE FROM ${t.table_name} WHERE regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1`, [chiffres]);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[SURGA PURGE ERREUR]:', err.message);
    throw err;
  } finally {
    client.release();
  }

  return resultats;
}

const DELAI_GRACE_JOURS = 30;

/**
 * SRG-A1-020 : supprime les données Surga des comptes supprimés.
 * Un compte est concerné s'il a été anonymisé, ou si sa demande de suppression a plus de trente jours (le délai
 * annoncé à l'utilisateur). La suppression du compte lui-même reste l'affaire de Nopalou : rien n'est écrit dans
 * la table utilisateurs.
 * Limite : un compte déjà anonymisé n'a plus de numéro ; ses lignes rattachées au seul numéro ne sont plus retrouvables.
 */
async function purgerDonneesComptesSupprimes({ limite = 50 } = {}) {
  const bilan = { comptes_trouves: 0, comptes_purges: 0, echecs: 0 };
  if (!pool) throw new Error('Base de données indisponible.');

  const tables = await tablesSurgaAvecColonne(pool, 'user_id');
  if (!tables.length) return bilan;
  const aDesDonnees = tables
    .map((t) => `EXISTS (SELECT 1 FROM ${t.table_name} s WHERE ${t.data_type === 'uuid' ? 's.user_id = u.id' : 's.user_id::text = u.id::text'})`)
    .join(' OR ');
  const { rows } = await pool.query(
    `SELECT u.id FROM utilisateurs u
     WHERE (u.anonymise_le IS NOT NULL OR u.supprime_le <= NOW() - ($1 || ' days')::interval)
       AND (${aDesDonnees})
     ORDER BY u.id LIMIT $2`,
    [String(DELAI_GRACE_JOURS), limite]
  );
  bilan.comptes_trouves = rows.length;
  for (const { id } of rows) {
    try {
      await supprimerDonneesUtilisateur({ userId: id });
      bilan.comptes_purges++;
    } catch (err) {
      bilan.echecs++;
      console.error('[SURGA PURGE COMPTES SUPPRIMES]:', err.message);
    }
  }
  return bilan;
}

module.exports = {
  exporterDonneesUtilisateur,
  supprimerDonneesUtilisateur,
  purgerDonneesComptesSupprimes,
};
