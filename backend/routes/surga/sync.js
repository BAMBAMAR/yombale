const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../../models/db');
const { tokenOptional } = require('../../middlewares/surga-auth');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assurerUUID(id, idMappings) {
  if (id && UUID_REGEX.test(id)) {
    return id;
  }
  const cleanUuid = crypto.randomUUID();
  if (id) {
    idMappings[id] = cleanUuid;
  }
  return cleanUuid;
}

// POST /api/surga/sync
// Réconcilie les créations/mises à jour accumulées en mode avion
// Une colonne DATE est rendue par le pilote comme un instant à minuit, heure du serveur : on en reprend le jour.
const jourSeul = (v) => {
  if (!v) return v;
  if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  return String(v).slice(0, 10);
};

router.post('/sync', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const corps = req.body || {};
    // Bornes : une synchronisation transporte les saisies en attente d'un appareil, pas un historique.
    const borne = (v) => (Array.isArray(v) ? v.slice(0, 500) : []);
    const notes = borne(corps.notes), depenses = borne(corps.depenses), agenda = borne(corps.agenda);
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const idsValides = (v) => borne(v).filter((x) => typeof x === 'string' && UUID.test(x));
    const suppressions = corps.suppressions || {};

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        synced_at: new Date().toISOString(),
        message: 'Synchronisation locale (mode invité)',
      });
    }

    const idMappings = {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Sync notes
      for (const n of notes) {
        if (!n.titre || !n.id) continue;
        const validId = assurerUUID(n.id, idMappings);
        await client.query(
          // SRG-A1-021 / SRG-A2-002 : tous les champs d'une note sont enregistrés (catégorie, couleur, épingle, liste de tâches).
          `INSERT INTO surga_notes (id, user_id, titre, contenu, categorie, couleur, epingle, is_checklist, checklist, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, COALESCE($10, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre,
             contenu = EXCLUDED.contenu,
             categorie = EXCLUDED.categorie,
             couleur = EXCLUDED.couleur,
             epingle = EXCLUDED.epingle,
             is_checklist = EXCLUDED.is_checklist,
             checklist = EXCLUDED.checklist,
             updated_at = NOW()
           WHERE surga_notes.user_id = $2`,
          [
            validId,
            userId,
            String(n.titre).trim().slice(0, 255),
            n.contenu || '',
            String(n.categorie || 'general').slice(0, 32),
            String(n.couleur || 'creme').slice(0, 20),
            Boolean(n.epingle),
            Boolean(n.is_checklist),
            JSON.stringify(Array.isArray(n.checklist) ? n.checklist : []),
            n.created_at || null,
          ]
        );
      }

      // 2. Sync dépenses
      for (const d of depenses) {
        if (!d.montant_xof || !d.id) continue;
        const montant = parseInt(d.montant_xof, 10);
        if (Number.isNaN(montant) || montant <= 0) continue;
        const validId = assurerUUID(d.id, idMappings);
        await client.query(
          `INSERT INTO surga_depenses (id, user_id, montant_xof, categorie, date_depense, note, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             montant_xof = EXCLUDED.montant_xof,
             categorie = EXCLUDED.categorie,
             date_depense = EXCLUDED.date_depense,
             note = EXCLUDED.note,
             updated_at = NOW()
           WHERE surga_depenses.user_id = $2`,
          [
            validId,
            userId,
            montant,
            d.categorie || 'Autre',
            d.date_depense || new Date().toISOString().slice(0, 10),
            d.note || null,
            d.created_at || null,
          ]
        );
      }

      // 3. Sync agenda & rappels
      for (const a of agenda) {
        if (!a.titre || !a.id) continue;
        const validId = assurerUUID(a.id, idMappings);
        await client.query(
          // SRG-A1-021 : priorité, catégorie et lieu sont enregistrés. Un changement de date ou d'heure réarme le rappel.
          `INSERT INTO surga_agenda (id, user_id, titre, description, date_evenement, heure_evenement, est_rappel, repetition, termine, priorite, categorie, lieu, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre,
             description = EXCLUDED.description,
             notification_envoyee = CASE
               WHEN surga_agenda.date_evenement IS DISTINCT FROM EXCLUDED.date_evenement
                 OR surga_agenda.heure_evenement IS DISTINCT FROM EXCLUDED.heure_evenement THEN FALSE
               ELSE surga_agenda.notification_envoyee END,
             date_evenement = EXCLUDED.date_evenement,
             heure_evenement = EXCLUDED.heure_evenement,
             est_rappel = EXCLUDED.est_rappel,
             repetition = EXCLUDED.repetition,
             termine = EXCLUDED.termine,
             priorite = EXCLUDED.priorite,
             categorie = EXCLUDED.categorie,
             lieu = EXCLUDED.lieu,
             updated_at = NOW()
           WHERE surga_agenda.user_id = $2`,
          [
            validId,
            userId,
            String(a.titre).trim().slice(0, 255),
            a.description || null,
            String(a.date_evenement || new Date().toISOString()).slice(0, 10),
            a.heure_evenement ? String(a.heure_evenement).slice(0, 5) : null,
            Boolean(a.est_rappel ?? true),
            a.repetition || 'AUCUNE',
            Boolean(a.termine),
            String(a.priorite || 'normale').slice(0, 20),
            String(a.categorie || 'rdv').slice(0, 32),
            a.lieu ? String(a.lieu).slice(0, 255) : null,
            a.created_at || null,
          ]
        );
      }

      // 4. Suppressions faites sur l'appareil (SRG-A2-008), limitées aux lignes du compte.
      const aSupprimer = { surga_notes: idsValides(suppressions.notes), surga_depenses: idsValides(suppressions.depenses), surga_agenda: idsValides(suppressions.agenda) };
      for (const [table, ids] of Object.entries(aSupprimer)) {
        if (ids.length) await client.query(`DELETE FROM ${table} WHERE user_id = $1 AND id = ANY($2::uuid[])`, [userId, ids]);
      }

      await client.query('COMMIT');

      // Récupération de l'état consolidé.
      // SRG-A5-001 : ces lectures passent par la connexion déjà prise. Les demander au groupe (pool.query) pendant
      // que cette requête en tient une bloquait toute l'API dès 20 synchronisations simultanées.
      const freshNotes = await client.query(
        'SELECT * FROM surga_notes WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );

      const freshDepenses = await client.query(
        'SELECT * FROM surga_depenses WHERE user_id = $1 ORDER BY date_depense DESC, created_at DESC',
        [userId]
      );

      const freshAgenda = await client.query(
        'SELECT * FROM surga_agenda WHERE user_id = $1 ORDER BY date_evenement ASC, heure_evenement ASC NULLS LAST',
        [userId]
      );

      return res.json({
        success: true,
        synced_at: new Date().toISOString(),
        id_mappings: idMappings,
        notes: freshNotes.rows,
        // SRG-A2-004 : les dates partent au format AAAA-MM-JJ. Envoyées comme instants (« …T00:00:00.000Z »), elles
        // n'étaient plus reconnues par l'appareil : un compte connecté n'était jamais prévenu de ses rappels.
        depenses: freshDepenses.rows.map((d) => ({ ...d, date_depense: jourSeul(d.date_depense) })),
        agenda: freshAgenda.rows.map((a) => ({ ...a, date_evenement: jourSeul(a.date_evenement) })),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[SURGA SYNC ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Échec de la synchronisation' });
  }
});

module.exports = router;
