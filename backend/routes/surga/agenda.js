// backend/routes/surga/agenda.js
// API Agenda & Rappels programmés pour Surga (Tranche 4)
// Zéro émoji, sécurité multi-tenant, résilience hors ligne

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { tokenOptional } = require('../../middlewares/surga-auth');

const REPETITIONS_AUTORISEES = ['AUCUNE', 'QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL'];

// GET /api/surga/agenda
// Liste les événements et rappels avec filtres
router.get('/agenda', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { date, mois, a_venir } = req.query;

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        evenements: [],
        message: 'Mode invité actif : données locales uniquement',
      });
    }

    let sql = 'SELECT * FROM surga_agenda WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sql += ` AND date_evenement = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    } else if (mois && /^\d{4}-\d{2}$/.test(mois)) {
      sql += ` AND TO_CHAR(date_evenement, 'YYYY-MM') = $${paramIndex}`;
      params.push(mois);
      paramIndex++;
    } else if (a_venir === 'true') {
      sql += ` AND date_evenement >= CURRENT_DATE AND termine = FALSE`;
    }

    sql += ' ORDER BY date_evenement ASC, heure_evenement ASC NULLS LAST, created_at ASC';

    const { rows } = await pool.query(sql, params);
    return res.json({
      success: true,
      evenements: rows,
    });
  } catch (err) {
    console.error('[SURGA AGENDA GET ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l’agenda' });
  }
});

// POST /api/surga/agenda
// Crée ou synchronise un événement / rappel
router.post('/agenda', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const {
      id,
      titre,
      description,
      date_evenement,
      heure_evenement,
      priorite = 'normale',
      categorie = 'rdv',
      lieu = null,
      est_rappel = true,
      repetition = 'AUCUNE',
      termine = false,
    } = req.body;

    if (!titre || typeof titre !== 'string' || !titre.trim()) {
      return res.status(400).json({ success: false, error: 'Le titre est obligatoire' });
    }

    const dateEvt = date_evenement && /^\d{4}-\d{2}-\d{2}$/.test(date_evenement)
      ? date_evenement
      : new Date().toISOString().slice(0, 10);

    const heureEvt = heure_evenement && /^\d{2}:\d{2}$/.test(heure_evenement)
      ? heure_evenement
      : null;

    const rep = REPETITIONS_AUTORISEES.includes(repetition) ? repetition : 'AUCUNE';

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        evenement: {
          id: id || `local_${Date.now()}`,
          titre: titre.trim(),
          description: description || null,
          date_evenement: dateEvt,
          heure_evenement: heureEvt,
          priorite,
          categorie,
          lieu: lieu || null,
          est_rappel: Boolean(est_rappel),
          repetition: rep,
          termine: Boolean(termine),
          notification_envoyee: false,
          created_at: new Date().toISOString(),
        },
      });
    }

    let query;
    let params;

    if (id) {
      query = `
        INSERT INTO surga_agenda (
          id, user_id, titre, description, date_evenement, heure_evenement,
          priorite, categorie, lieu, est_rappel, repetition, termine, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (id) DO UPDATE SET
          titre = EXCLUDED.titre,
          description = EXCLUDED.description,
          date_evenement = EXCLUDED.date_evenement,
          heure_evenement = EXCLUDED.heure_evenement,
          priorite = EXCLUDED.priorite,
          categorie = EXCLUDED.categorie,
          lieu = EXCLUDED.lieu,
          est_rappel = EXCLUDED.est_rappel,
          repetition = EXCLUDED.repetition,
          termine = EXCLUDED.termine,
          updated_at = NOW()
        WHERE surga_agenda.user_id = $2
        RETURNING *
      `;
      params = [
        id,
        userId,
        titre.trim(),
        description || null,
        dateEvt,
        heureEvt,
        priorite,
        categorie,
        lieu || null,
        Boolean(est_rappel),
        rep,
        Boolean(termine),
      ];
    } else {
      query = `
        INSERT INTO surga_agenda (
          user_id, titre, description, date_evenement, heure_evenement,
          priorite, categorie, lieu, est_rappel, repetition, termine
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      params = [
        userId,
        titre.trim(),
        description || null,
        dateEvt,
        heureEvt,
        priorite,
        categorie,
        lieu || null,
        Boolean(est_rappel),
        rep,
        Boolean(termine),
      ];
    }

    const { rows } = await pool.query(query, params);
    return res.status(201).json({
      success: true,
      evenement: rows[0],
    });
  } catch (err) {
    console.error('[SURGA AGENDA POST ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’enregistrement de l’événement' });
  }
});

// PATCH /api/surga/agenda/:id/toggle
// Marque comme terminé ou réactive un événement
router.patch('/agenda/:id/toggle', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.json({ success: true, guest: true, toggledId: id });
    }

    const { rows } = await pool.query(
      `UPDATE surga_agenda
       SET termine = NOT termine, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Événement introuvable ou non autorisé' });
    }

    return res.json({
      success: true,
      evenement: rows[0],
    });
  } catch (err) {
    console.error('[SURGA AGENDA TOGGLE ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut' });
  }
});

// DELETE /api/surga/agenda/:id
// Supprime un rappel / événement avec contrôle anti-IDOR
router.delete('/agenda/:id', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.json({ success: true, guest: true, deletedId: id });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM surga_agenda WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Événement introuvable ou déjà supprimé' });
    }

    return res.json({ success: true, message: 'Événement supprimé avec succès', deletedId: id });
  } catch (err) {
    console.error('[SURGA AGENDA DELETE ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
  }
});

// ── Web Push Notifications VAPID ─────────────────────────────────────────────

// GET /api/surga/push/vapid-key
router.get('/push/vapid-key', async (req, res) => {
  try {
    const { getVapidPublicKey } = require('../../lib/vapidHelper');
    const publicKey = await getVapidPublicKey();
    return res.json({ success: true, publicKey });
  } catch (err) {
    console.error('[SURGA PUSH KEY ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur récupération clé VAPID' });
  }
});

// POST /api/surga/push/subscribe
router.post('/push/subscribe', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return res.status(400).json({ success: false, error: 'Payload d’abonnement Web Push invalide' });
    }

    const { endpoint, keys } = subscription;

    await pool.query(
      `INSERT INTO surga_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = COALESCE(EXCLUDED.user_id, surga_push_subscriptions.user_id),
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent,
         updated_at = NOW()`,
      [userId, endpoint, keys.p256dh, keys.auth, userAgent || req.headers['user-agent'] || null]
    );

    return res.json({ success: true, message: 'Abonnement Web Push enregistré avec succès' });
  } catch (err) {
    console.error('[SURGA PUSH SUBSCRIBE ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur enregistrement abonnement Web Push' });
  }
});

// POST /api/surga/push/unsubscribe
router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'Endpoint requis' });
    }

    await pool.query('DELETE FROM surga_push_subscriptions WHERE endpoint = $1', [endpoint]);
    return res.json({ success: true, message: 'Désabonnement réussi' });
  } catch (err) {
    console.error('[SURGA PUSH UNSUBSCRIBE ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur désabonnement' });
  }
});

// POST /api/surga/push/test
router.post('/push/test', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { subscription } = req.body;
    const { sendWebPushNotification } = require('../../lib/vapidHelper');

    const targetSub = subscription || (userId ? (await pool.query('SELECT endpoint, p256dh, auth FROM surga_push_subscriptions WHERE user_id = $1 LIMIT 1', [userId])).rows[0] : null);

    if (!targetSub || !targetSub.endpoint) {
      return res.status(400).json({ success: false, error: 'Aucun abonnement Web Push trouvé pour le test' });
    }

    const testPayload = {
      title: 'Surga — Test de notification',
      body: 'Le système de notifications Web Push est opérationnel.',
      icon: '/surga/icon-192.png',
      badge: '/surga/icon-192.png',
      url: '/surga?tab=agenda',
      tag: 'surga-test-notif',
    };

    const result = await sendWebPushNotification(targetSub, testPayload);
    return res.json({ success: result.success, result });
  } catch (err) {
    console.error('[SURGA PUSH TEST ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur test push' });
  }
});

module.exports = router;
