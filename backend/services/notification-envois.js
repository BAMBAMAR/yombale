// backend/services/notification-envois.js
// Suivi de la LIVRAISON RÉELLE des notifications WhatsApp et repli automatique (e-mail, puis SMS).
//
// Pourquoi : Meta accepte un message (identifiant « wamid » renvoyé) puis peut le refuser quelques secondes plus tard
// par webhook (facture Meta impayée, numéro hors WhatsApp, plafond d'engagement...). Tant que seule l'acceptation
// comptait comme « envoyé », une commande pouvait ne jamais parvenir au marchand sans que personne ne le sache.

const { pool } = require('../models/db');

const SITE = () => process.env.FRONTEND_URL || 'https://nopalou.com';
const DELAI_SANS_ACCUSE_MIN = Math.max(1, parseInt(process.env.NOTIF_DELAI_SANS_ACCUSE_MIN, 10) || 5);
const FENETRE_MAX_HEURES = 48; // au-delà, une commande n'est plus relancée par ce mécanisme

function echapperHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Mémorise l'identifiant Meta d'une notification acceptée, avec de quoi construire le repli. */
async function enregistrerEnvoi({ wamid, type, referenceId, destinataire, boutiqueId, canal = 'whatsapp', payload = {} }) {
  if (!wamid) return null;
  try {
    const r = await pool.query(
      `INSERT INTO notification_envois (wamid, type, reference_id, destinataire, boutique_id, canal, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (wamid) DO NOTHING
       RETURNING *`,
      [wamid, type, referenceId || null, destinataire || null, boutiqueId ? String(boutiqueId) : null, canal, JSON.stringify(payload)]
    );
    return r.rows[0] || null;
  } catch (err) {
    console.error('[NOTIF ENVOIS] enregistrement impossible:', err.message);
    return null;
  }
}

async function ajouterNoteCommande(reference, note) {
  if (!reference) return;
  try {
    await pool.query(
      `UPDATE commandes_boutique SET note = COALESCE(note, '') || $1 WHERE reference = $2`,
      [` ${note}`, reference]
    );
  } catch (_) {}
}

async function journaliserEchec(envoi, erreur) {
  try {
    await pool.query(
      `INSERT INTO notification_echecs (type, reference_id, erreur) VALUES ($1, $2, $3)`,
      [`notif_vendeur_${envoi.type || 'inconnu'}`, envoi.reference_id, String(erreur || '').slice(0, 300)]
    );
  } catch (_) {}
}

/**
 * Repli e-mail (toujours) puis SMS (si demandé) vers le propriétaire de la boutique.
 * Idempotent : la ligne est « réclamée » (repli_at) avant tout envoi, un second appel ne renvoie rien.
 * @returns {Promise<string[]>} canaux utilisés
 */
async function declencherRepli(envoi, { motif, avecSms = false } = {}) {
  if (!envoi?.id) return [];
  const claim = await pool.query(
    `UPDATE notification_envois SET repli_at = NOW(), updated_at = NOW() WHERE id = $1 AND repli_at IS NULL RETURNING id`,
    [envoi.id]
  );
  if (!claim.rows.length) return [];

  const p = envoi.payload || {};
  const canaux = [];
  let email = null;
  let telephone = envoi.destinataire || null;

  if (p.utilisateur_id) {
    try {
      const u = await pool.query('SELECT email, telephone FROM utilisateurs WHERE id = $1', [p.utilisateur_id]);
      email = u.rows[0]?.email || null;
      telephone = telephone || u.rows[0]?.telephone || null;
    } catch (_) {}
  }

  // 1. E-mail : seul canal indépendant de Meta et de tout fournisseur SMS
  if (email) {
    try {
      let lien = p.lien || `${SITE()}/boutique`;
      try {
        if (p.utilisateur_id && p.lienChemin) {
          const { genererMagicToken } = require('../lib/magicAuthToken');
          const token = genererMagicToken({ userId: p.utilisateur_id, boutiqueId: p.boutique_id || '' });
          lien = `${SITE()}/api/auth/magic-login?token=${token}&redirect=${encodeURIComponent(p.lienChemin)}`;
        }
      } catch (_) {}
      const { envoyerEmail, templateEmail } = require('./email');
      const titre = p.titre || 'Nouvelle commande';
      const res = await envoyerEmail({
        to: email,
        subject: `${titre}${envoi.reference_id ? ` — ${envoi.reference_id}` : ''}`,
        html: templateEmail({
          preheader: `${titre} : consultez-la sans attendre`,
          titre,
          contenuHtml: `<p>${echapperHtml(p.resume || 'Une nouvelle commande vous attend.').replace(/\n/g, '<br>')}</p>` +
            `<p style="color:#64748B;font-size:13px">Cette alerte vous est envoyée par e-mail car la notification WhatsApp n'a pas pu vous parvenir.</p>`,
          boutonTexte: 'Voir la commande',
          boutonUrl: lien,
        }),
      });
      if (!res?.skipped) canaux.push('email');
    } catch (err) {
      console.error('[NOTIF REPLI] e-mail impossible:', err.message);
    }
  }

  // 2. SMS : uniquement sur échec confirmé (coût), si un fournisseur est configuré
  if (avecSms && telephone) {
    try {
      const { sendSMS } = require('./sms');
      const sms = await sendSMS(telephone, `Nopalou : ${p.titre || 'Nouvelle commande'} ${envoi.reference_id || ''}. ${p.lien || SITE() + '/boutique'}`.trim());
      if (sms?.success && !sms.simulated) canaux.push('sms');
    } catch (err) {
      console.error('[NOTIF REPLI] SMS impossible:', err.message);
    }
  }

  try {
    await pool.query(
      `UPDATE notification_envois SET repli_canaux = $1, updated_at = NOW() WHERE id = $2`,
      [canaux.join(',') || 'aucun', envoi.id]
    );
  } catch (_) {}

  const bilan = canaux.length ? `repli ${canaux.join('+')}` : 'AUCUN repli disponible (pas d\'e-mail ni de SMS)';
  console.warn(`[NOTIF REPLI] ${envoi.type} ${envoi.reference_id || ''} (${motif || 'échec'}) : ${bilan}`);
  await ajouterNoteCommande(envoi.reference_id, `[Notif vendeur : ${bilan}]`);

  // Aucun canal n'a pu joindre le marchand : seul l'admin peut encore intervenir (appel, WhatsApp manuel).
  if (!canaux.length) {
    try {
      const { alerterAdmin } = require('./admin-alerts');
      await alerterAdmin({
        type: 'notif_vendeur_injoignable',
        priorite: 'CRITIQUE',
        titre: 'Commande non notifiée au marchand',
        message: `La commande ${envoi.reference_id || ''} n'a pu être notifiée par aucun canal (WhatsApp ${motif || 'en échec'}, pas d'e-mail ni de SMS).`,
        details: p.resume || '',
        cooldownMs: 0,
      });
    } catch (_) {}
  }
  return canaux;
}

/** Applique un statut Meta reçu par webhook (delivered / read / failed) à l'envoi mémorisé. */
async function traiterStatut({ wamid, statut, erreur = null }) {
  if (!wamid || !statut) return null;
  // L'ordre des webhooks n'est pas garanti : un « delivered » tardif ne rétrograde pas un « read », un échec est définitif.
  const r = await pool.query(
    `WITH ancien AS (SELECT statut FROM notification_envois WHERE wamid = $1)
     UPDATE notification_envois
     SET statut = $2::varchar, erreur = COALESCE($3::text, erreur), updated_at = NOW()
     WHERE wamid = $1 AND statut <> 'echec' AND NOT (statut = 'read' AND $2::varchar = 'delivered')
     RETURNING *, (SELECT statut FROM ancien) AS ancien_statut`,
    [wamid, statut, erreur]
  );
  const envoi = r.rows[0];
  if (!envoi) return null; // message non suivi (texte libre, prospection...) : sans effet

  if (statut === 'delivered' || statut === 'read') {
    if (envoi.type === 'commande' && envoi.ancien_statut === 'envoye') {
      await ajouterNoteCommande(envoi.reference_id, '[Notif WhatsApp vendeur transmise]');
    }
    return envoi;
  }
  if (statut === 'echec') {
    await journaliserEchec(envoi, erreur);
    await ajouterNoteCommande(envoi.reference_id, `[Échec Notif WhatsApp: ${String(erreur || '').slice(0, 80)}]`);
    await declencherRepli(envoi, { motif: erreur || 'échec Meta', avecSms: true });
  }
  return envoi;
}

/** Envois acceptés par Meta mais sans accusé de réception après le délai : repli e-mail (sans SMS, pas d'échec prouvé). */
async function traiterEnvoisSansAccuse({ delaiMinutes = DELAI_SANS_ACCUSE_MIN, limite = 50 } = {}) {
  const r = await pool.query(
    `SELECT * FROM notification_envois
     WHERE statut = 'envoye' AND repli_at IS NULL
       AND created_at < NOW() - ($1::int * INTERVAL '1 minute')
       AND created_at > NOW() - ($2::int * INTERVAL '1 hour')
     ORDER BY created_at
     LIMIT $3`,
    [delaiMinutes, FENETRE_MAX_HEURES, limite]
  );
  let traites = 0;
  for (const envoi of r.rows) {
    await declencherRepli(envoi, { motif: `sans accusé après ${delaiMinutes} min`, avecSms: false });
    traites++;
  }
  return { traites };
}

module.exports = { enregistrerEnvoi, traiterStatut, declencherRepli, traiterEnvoisSansAccuse, DELAI_SANS_ACCUSE_MIN };
