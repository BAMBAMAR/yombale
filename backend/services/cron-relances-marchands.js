// backend/services/cron-relances-marchands.js — Moteur de relances et d'onboarding marchands (J+1, J+7, J+25)
const { pool } = require('../models/db');
const { genererMagicToken } = require('../lib/magicAuthToken');
const { executerTacheCron } = require('../lib/cronLogger');
let sendWhatsAppNotification;
let estDesinscrit;
try {
  const ws = require('./whatsapp');
  sendWhatsAppNotification = ws.sendWhatsAppNotification;
  estDesinscrit = ws.estDesinscrit;
} catch (e) {
  sendWhatsAppNotification = null;
  estDesinscrit = async () => false;
}

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

/**
 * Exécute les vagues de relances marchands automatiques (J+1, J+7, J+25)
 */
async function traiterRelancesMarchands() {
  return executerTacheCron('relances_marchands', async () => {
    const stats = { j1: 0, j7: 0, j25: 0, total: 0, erreurs: [] };

  // Garde-fou horaire strict : Fuseau horaire Dakar (UTC+0).
  // Aucun envoi avant 09h00 ou après 20h30.
  const heureDakar = new Date().getUTCHours();
  if (heureDakar < 9 || heureDakar >= 21) {
    console.log('[RELANCES MARCHANDS] En dehors des heures autorisées (09h-21h GMT). Reporté.');
    return { succes: false, report: true, raison: 'hors_plage_horaire', stats };
  }

  try {
    // ── 1. Relance J+1 : Partage Statut WhatsApp (Créée il y a ~24h) ───────────
    const qJ1 = `
      SELECT b.id, b.nom, b.slug, b.utilisateur_id, COALESCE(b.whatsapp, b.telephone) AS telephone, u.nom AS gerant_nom
      FROM boutiques b
      JOIN utilisateurs u ON u.id = b.utilisateur_id
      WHERE b.actif = true
        AND b.relances_suspendues IS NOT TRUE
        AND COALESCE(b.nb_relances_sans_reponse, 0) < 3
        AND b.created_at::date = (CURRENT_DATE - INTERVAL '1 day')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone) 
            AND message_envoye LIKE '%Astuce N°1%'
        )
    `;
    const resJ1 = await pool.query(qJ1);

    for (const b of resJ1.rows) {
      if (!b.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(b.telephone))) {
        await pool.query('UPDATE boutiques SET relances_suspendues = true WHERE id = $1', [b.id]);
        continue;
      }

      let magicToken = '';
      if (b.utilisateur_id) {
        try {
          magicToken = genererMagicToken({ userId: b.utilisateur_id, boutiqueId: b.id });
        } catch (_) {}
      }

      const lienStudio = magicToken
        ? `${SITE}/api/auth/magic-login?token=${magicToken}&redirect=${encodeURIComponent('/boutique?tab=personnaliser')}`
        : `${SITE}/boutique?tab=personnaliser`;

      const msg =
        `Salam ${b.nom} ! 🎉 Félicitations pour votre 1er jour sur Nopalou.\n\n` +
        `💡 *Astuce N°1 pour faire votre première vente aujourd'hui :*\n` +
        `Partagez le lien de votre vitrine dans votre statut WhatsApp :\n` +
        `👉 ${SITE}/boutiques/${b.slug}\n\n` +
        `🎨 *Conseil identité :* Personnalisez vos couleurs, votre slogan et votre bannière en 1 clic sans mot de passe :\n` +
        `👉 ${lienStudio}\n\n` +
        `Vos clients pourront voir l'ensemble de vos articles et commander directement.\n\n` +
        `_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

      if (sendWhatsAppNotification && typeof sendWhatsAppNotification === 'function') {
        try {
          const res = await sendWhatsAppNotification(b.telephone, {
            textMessage: msg,
            title: `🎉 1er jour sur Nopalou — ${b.nom}`.slice(0, 60),
            montant: 'Gratuit',
            detail: `Partagez votre vitrine sur WhatsApp : ${SITE}/boutiques/${b.slug} pour faire votre 1ère vente !`,
            url: lienStudio,
            buttonParam: magicToken ? `api/auth/magic-login?token=${magicToken}` : `boutique?tab=personnaliser`,
            type: 'service',
          });
          const isSent = !!(res && res.messages?.[0]?.id);
          stats.j1++;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, $3)`,
            [b.telephone, msg, isSent ? 'envoye' : 'echec']
          );
          await pool.query(
            `UPDATE boutiques SET nb_relances_sans_reponse = COALESCE(nb_relances_sans_reponse, 0) + 1 WHERE id = $1`,
            [b.id]
          );
        } catch (e) {
          stats.erreurs.push({ bq: b.nom, type: 'J+1', err: e.message });
        }
      }
    }

    // ── 2. Relance J+7 : Découverte Carnet de Dettes & Caisse POS ──────────────
    const qJ7 = `
      SELECT b.id, b.nom, b.slug, b.utilisateur_id, COALESCE(b.whatsapp, b.telephone) AS telephone, u.nom AS gerant_nom
      FROM boutiques b
      JOIN utilisateurs u ON u.id = b.utilisateur_id
      WHERE b.actif = true
        AND b.relances_suspendues IS NOT TRUE
        AND COALESCE(b.nb_relances_sans_reponse, 0) < 3
        AND b.created_at::date = (CURRENT_DATE - INTERVAL '7 days')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone) 
            AND message_envoye LIKE '%Carnet de Dettes%'
        )
    `;
    const resJ7 = await pool.query(qJ7);

    for (const b of resJ7.rows) {
      if (!b.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(b.telephone))) {
        await pool.query('UPDATE boutiques SET relances_suspendues = true WHERE id = $1', [b.id]);
        continue;
      }

      let magicToken = '';
      if (b.utilisateur_id) {
        try {
          magicToken = genererMagicToken({ userId: b.utilisateur_id, boutiqueId: b.id });
        } catch (_) {}
      }

      const lienCaisse = magicToken
        ? `${SITE}/api/auth/magic-login?token=${magicToken}&redirect=${encodeURIComponent('/boutique/caisse')}`
        : `${SITE}/boutique/caisse`;

      const msg =
        `Salam ${b.nom} ! 👋\n\n` +
        `Saviez-vous que Nopalou intègre une *Caisse Tactile POS* et un *Carnet de Dettes intelligent* ?\n\n` +
        `📒 Notez les crédits de vos clients et relancez-les poliment sur WhatsApp en 1 seul clic sans effort !\n\n` +
        `👉 Accédez directement à votre caisse ici (1-clic) :\n${lienCaisse}\n\n` +
        `_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

      if (sendWhatsAppNotification && typeof sendWhatsAppNotification === 'function') {
        try {
          const res = await sendWhatsAppNotification(b.telephone, {
            textMessage: msg,
            title: `📒 Caisse & Carnet de Dettes — ${b.nom}`.slice(0, 60),
            montant: 'Inclus',
            detail: `Notez les crédits clients et relancez-les en 1 clic. Accédez à votre caisse : ${SITE}/boutique/caisse`,
            url: lienCaisse,
            buttonParam: magicToken ? `api/auth/magic-login?token=${magicToken}` : 'boutique/caisse',
            type: 'service',
          });
          const isSent = !!(res && res.messages?.[0]?.id);
          stats.j7++;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, $3)`,
            [b.telephone, msg, isSent ? 'envoye' : 'echec']
          );
          await pool.query(
            `UPDATE boutiques SET nb_relances_sans_reponse = COALESCE(nb_relances_sans_reponse, 0) + 1 WHERE id = $1`,
            [b.id]
          );
        } catch (e) {
          stats.erreurs.push({ bq: b.nom, type: 'J+7', err: e.message });
        }
      }
    }

    // ── 3. Relance J-3 : Expiration Essai Imminente (Fin dans 3 jours) ────────
    const qJMoins3 = `
      SELECT a.id, a.fin, b.nom, b.slug, COALESCE(b.whatsapp, b.telephone, u.telephone) AS telephone
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      JOIN boutiques b ON b.utilisateur_id = u.id
      WHERE a.statut = 'actif' AND a.is_trial = true
        AND a.fin::date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone, u.telephone) 
            AND message_envoye LIKE '%Fin dans 3 jours%'
        )
    `;
    const resJMoins3 = await pool.query(qJMoins3);

    for (const a of resJMoins3.rows) {
      if (!a.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(a.telephone))) continue;

      const msg =
        `Salam ${a.nom} ! ⏳\n\n` +
        `Votre période d'essai gratuit sur Nopalou se termine dans 3 jours.\n\n` +
        `Pour continuer à encaisser vos clients sur votre caisse POS et garder votre vitrine active sans interruption, choisissez votre formule à partir de 2 500 FCFA/mois :\n` +
        `👉 ${SITE}/tarifs-boutique\n\n` +
        `🎁 Remise annuelle : -25% (3 mois offerts) si vous réglez par an !\n\n` +
        `_Pour ne plus recevoir de rappel, répondez STOP._`;

      if (sendWhatsAppNotification && typeof sendWhatsAppNotification === 'function') {
        try {
          const res = await sendWhatsAppNotification(a.telephone, {
            textMessage: msg,
            title: `⏳ Fin dans 3 jours — ${a.nom}`.slice(0, 60),
            montant: 'Dès 2 500 F',
            detail: `Votre essai se termine dans 3 jours. Choisissez votre plan pour continuer : ${SITE}/tarifs-boutique`,
            url: `${SITE}/tarifs-boutique`,
            buttonParam: 'tarifs-boutique',
            type: 'service',
          });
          const isSent = !!(res && res.messages?.[0]?.id);
          stats.jMoins3 = (stats.jMoins3 || 0) + 1;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, $3)`,
            [a.telephone, msg, isSent ? 'envoye' : 'echec']
          );
        } catch (e) {
          stats.erreurs.push({ bq: a.nom, type: 'J-3', err: e.message });
        }
      }
    }

    // ── 4. Relance J-1 : Alerte Clôture Caisse Demain ──────────────────────────
    const qJMoins1 = `
      SELECT a.id, a.fin, b.nom, b.slug, COALESCE(b.whatsapp, b.telephone, u.telephone) AS telephone
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      JOIN boutiques b ON b.utilisateur_id = u.id
      WHERE a.statut = 'actif' AND a.is_trial = true
        AND a.fin::date = (CURRENT_DATE + INTERVAL '1 day')::date
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone, u.telephone) 
            AND message_envoye LIKE '%Dernier jour%'
        )
    `;
    const resJMoins1 = await pool.query(qJMoins1);

    for (const a of resJMoins1.rows) {
      if (!a.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(a.telephone))) continue;

      const msg =
        `Salam ${a.nom} ! ⚠️ *Dernier jour d'essai gratuit sur Nopalou !*\n\n` +
        `Dès demain, l'encaissement sur votre Caisse POS et votre catalogue seront suspendus.\n\n` +
        `Ne perdez pas vos habitudes : activez votre abonnement Pro (5 000 FCFA/mois) en 1 clic pour continuer à vendre sereinement :\n` +
        `👉 ${SITE}/boutique/abonnement\n\n` +
        `_Pour ne plus recevoir de rappel, répondez STOP._`;

      if (sendWhatsAppNotification && typeof sendWhatsAppNotification === 'function') {
        try {
          const res = await sendWhatsAppNotification(a.telephone, {
            textMessage: msg,
            title: `⚠️ Dernier jour d'essai — ${a.nom}`.slice(0, 60),
            montant: 'Plan Pro',
            detail: `Dès demain la caisse sera suspendue. Activez votre plan en 1 clic : ${SITE}/boutique/abonnement`,
            url: `${SITE}/boutique/abonnement`,
            buttonParam: 'boutique/abonnement',
            type: 'service',
          });
          const isSent = !!(res && res.messages?.[0]?.id);
          stats.jMoins1 = (stats.jMoins1 || 0) + 1;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, $3)`,
            [a.telephone, msg, isSent ? 'envoye' : 'echec']
          );
        } catch (e) {
          stats.erreurs.push({ bq: a.nom, type: 'J-1', err: e.message });
        }
      }
    }

    // ── 5. Relance J+1 Expiré : Réactivation Immédiate sans Perte ─────────────
    const qJPlus1 = `
      SELECT a.id, a.fin, b.nom, b.slug, COALESCE(b.whatsapp, b.telephone, u.telephone) AS telephone
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      JOIN boutiques b ON b.utilisateur_id = u.id
      WHERE a.fin::date = (CURRENT_DATE - INTERVAL '1 day')::date
        AND NOT EXISTS (
          SELECT 1 FROM abonnements a2
          WHERE a2.utilisateur_id = u.id AND a2.statut = 'actif' AND a2.fin > NOW()
        )
        AND NOT EXISTS (
          SELECT 1 FROM prospection_messages_log 
          WHERE destinataire = COALESCE(b.whatsapp, b.telephone, u.telephone) 
            AND message_envoye LIKE '%Réactivez votre boutique%'
        )
    `;
    const resJPlus1 = await pool.query(qJPlus1);

    for (const a of resJPlus1.rows) {
      if (!a.telephone) continue;
      if (estDesinscrit && (await estDesinscrit(a.telephone))) continue;

      const msg =
        `Salam ${a.nom} ! 👋\n\n` +
        `Votre période d'essai gratuit Nopalou est arrivée à son terme.\n\n` +
        `🔒 *Rassurez-vous :* Toutes vos données (articles, historique des ventes, carnet de dettes clients) sont conservées en toute sécurité.\n\n` +
        `👉 Réactivez votre boutique et votre caisse en 1 clic pour reprendre vos encaissements :\n` +
        `👉 ${SITE}/boutique/abonnement\n\n` +
        `_Besoin d'aide ou d'un conseil ? Répondez directement à ce message WhatsApp._`;

      if (sendWhatsAppNotification && typeof sendWhatsAppNotification === 'function') {
        try {
          const res = await sendWhatsAppNotification(a.telephone, {
            textMessage: msg,
            title: `🔒 Réactivez votre boutique — ${a.nom}`.slice(0, 60),
            montant: 'Réactivation',
            detail: `Vos données sont conservées en sécurité. Réactivez votre boutique : ${SITE}/boutique/abonnement`,
            url: `${SITE}/boutique/abonnement`,
            buttonParam: 'boutique/abonnement',
            type: 'service',
          });
          const isSent = !!(res && res.messages?.[0]?.id);
          stats.jPlus1 = (stats.jPlus1 || 0) + 1;
          stats.total++;
          await pool.query(
            `INSERT INTO prospection_messages_log (canal, destinataire, message_envoye, statut)
             VALUES ('whatsapp', $1, $2, $3)`,
            [a.telephone, msg, isSent ? 'envoye' : 'echec']
          );
        } catch (e) {
          stats.erreurs.push({ bq: a.nom, type: 'J+1_exp', err: e.message });
        }
      }
    }

    console.log(`[CRON RELANCES MARCHANDS] ✅ Traité : ${stats.total} envois (J+1: ${stats.j1}, J+7: ${stats.j7}, J-3: ${stats.jMoins3 || 0}, J-1: ${stats.jMoins1 || 0}, J+1_exp: ${stats.jPlus1 || 0})`);
    return { succes: true, stats };
    } catch (err) {
      console.error('[CRON RELANCES MARCHANDS FAIL]', err);
      throw err;
    }
  });
}

// Planification automatique quotidienne
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    traiterRelancesMarchands().catch(() => {});
    setInterval(() => {
      traiterRelancesMarchands().catch(() => {});
    }, 24 * 60 * 60 * 1000); // 24 heures
  }, 15000);
}

module.exports = {
  traiterRelancesMarchands,
};
