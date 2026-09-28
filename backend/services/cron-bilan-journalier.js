// backend/services/cron-bilan-journalier.js
// Envoi automatique du bilan de caisse quotidien aux marchands sur WhatsApp

const db = require('../models/db');
const pool = db.pool || db;
const { genererMagicToken } = require('../lib/magicAuthToken');
const { normaliserTelephone, estNumeroValide } = require('../lib/phoneNormalizer');

let whatsappService;
try {
  whatsappService = require('./whatsapp');
} catch (e) {
  whatsappService = null;
}

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

/**
 * Traite et envoie le bilan de caisse quotidien aux marchands dont l'heure correspond.
 * @param {string|null} boutiqueIdOptionnel - Si renseigné, force le bilan pour cette boutique
 */
async function traiterBilansQuotidiens(boutiqueIdOptionnel = null) {
  try {
    const dakarDate = new Date();
    // Fuseau horaire Dakar = UTC+0 (GMT)
    const heureDakar = dakarDate.getUTCHours();

    console.log(`[BILAN CAISSE CRON] Démarrage de la vérification (Heure Dakar: ${heureDakar}h)...`);

    let query = `
      SELECT 
        b.id,
        b.nom,
        b.slug,
        b.telephone,
        b.whatsapp,
        b.utilisateur_id as proprietaire_id,
        b.notif_bilan_caisse,
        b.notif_heure_bilan,
        b.relances_suspendues
      FROM boutiques b
      WHERE b.actif = true
        AND b.relances_suspendues = false
        AND b.notif_bilan_caisse = true
    `;

    const params = [];
    if (boutiqueIdOptionnel) {
      params.push(boutiqueIdOptionnel);
      query += ` AND b.id = $1`;
    } else {
      params.push(heureDakar);
      query += ` AND COALESCE(b.notif_heure_bilan, 21) = $1`;
    }

    const { rows: boutiques } = await pool.query(query, params);
    if (!boutiques || boutiques.length === 0) {
      console.log(`[BILAN CAISSE CRON] Aucune boutique programmée pour l'heure actuelle (${heureDakar}h).`);
      return { succes: true, envoyes: 0 };
    }

    console.log(`[BILAN CAISSE CRON] 📊 ${boutiques.length} boutique(s) éligible(s) pour le bilan de caisse.`);

    let nbEnvoyes = 0;
    const dateJourSql = dakarDate.toISOString().slice(0, 10);
    const dateJourFmt = dakarDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    for (const bq of boutiques) {
      const telDest = bq.whatsapp || bq.telephone;
      if (!telDest) continue;

      const normTel = normaliserTelephone(telDest);
      if (!normTel || !estNumeroValide(normTel)) continue;

      // Anti-harassment: vérification blacklist
      if (typeof whatsappService?.estDesinscrit === 'function' && await whatsappService.estDesinscrit(normTel)) {
        console.log(`[BILAN CAISSE CRON] Numéro ${normTel} désinscrit (STOP), ignoré.`);
        continue;
      }

      // 1. Calcul des ventes du jour
      const rVentes = await pool.query(
        `SELECT 
           COUNT(*) as nb_ventes,
           COALESCE(SUM(montant_total), 0) as ca_total,
           COALESCE(SUM(CASE WHEN methode_paiement ILIKE '%wave%' THEN montant_total ELSE 0 END), 0) as ca_wave,
           COALESCE(SUM(CASE WHEN methode_paiement ILIKE '%espece%' OR methode_paiement ILIKE '%cash%' THEN montant_total ELSE 0 END), 0) as ca_especes,
           COALESCE(SUM(CASE WHEN methode_paiement ILIKE '%orange%' THEN montant_total ELSE 0 END), 0) as ca_om
         FROM ventes
         WHERE boutique_id = $1 
           AND created_at >= $2::date 
           AND created_at < ($2::date + INTERVAL '1 day')`,
        [bq.id, dateJourSql]
      );

      const v = rVentes.rows[0];
      const nbVentes = parseInt(v.nb_ventes, 10) || 0;
      const caTotal = Math.round(Number(v.ca_total || 0));
      const caWave = Math.round(Number(v.ca_wave || 0));
      const caEspeces = Math.round(Number(v.ca_especes || 0));
      const caOm = Math.round(Number(v.ca_om || 0));

      // 2. Calcul des crédits et règlements du jour
      let creditAccorde = 0;
      let creditRembourse = 0;
      try {
        const rCredits = await pool.query(
          `SELECT 
             COALESCE(SUM(CASE WHEN type = 'vente_credit' THEN montant ELSE 0 END), 0) as accorde,
             COALESCE(SUM(CASE WHEN type = 'remboursement' THEN montant ELSE 0 END), 0) as rembourse
           FROM caisse_credit_historique
           WHERE boutique_id = $1
             AND created_at >= $2::date
             AND created_at < ($2::date + INTERVAL '1 day')`,
          [bq.id, dateJourSql]
        );
        creditAccorde = Math.round(Number(rCredits.rows[0]?.accorde || 0));
        creditRembourse = Math.round(Number(rCredits.rows[0]?.rembourse || 0));
      } catch (_) {}

      // Ne pas spammer si la boutique n'a eu aucune activité aujourd'hui et a 0 vente
      // (Évite de déranger le marchand avec des bilans à 0 s'il n'a pas ouvert sa caisse)
      if (nbVentes === 0 && creditAccorde === 0 && creditRembourse === 0 && !boutiqueIdOptionnel) {
        continue;
      }

      // 3. Génération du Magic Link vers la caisse
      let lienCaisse = `${SITE}/boutique/caisse`;
      try {
        if (bq.proprietaire_id) {
          const magicToken = genererMagicToken({
            userId: bq.proprietaire_id,
            boutiqueId: bq.id,
            role: 'admin'
          }, 48);
          lienCaisse = `${SITE}/boutique/caisse?auth_token=${magicToken}`;
        }
      } catch (_) {}

      // 4. Construction du message WhatsApp
      const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

      let msg = 
        `📊 *Bilan de Caisse du Jour — ${bq.nom}*\n` +
        `📅 _${dateJourFmt}_\n\n` +
        `🛒 *Ventes enregistrées* : ${nbVentes} vente(s)\n` +
        `💰 *Total encaissé* : *${fmt(caTotal)} FCFA*\n`;

      if (caWave > 0) msg += `• 🌊 Wave : ${fmt(caWave)} FCFA\n`;
      if (caEspeces > 0) msg += `• 💵 Espèces : ${fmt(caEspeces)} FCFA\n`;
      if (caOm > 0) msg += `• 🟠 Orange Money : ${fmt(caOm)} FCFA\n`;

      if (creditAccorde > 0 || creditRembourse > 0) {
        msg += `\n💳 *Mouvements Carnet de Dettes :*\n`;
        if (creditAccorde > 0) msg += `• Crédits accordés : ${fmt(creditAccorde)} FCFA\n`;
        if (creditRembourse > 0) msg += `• Règlements perçus : +${fmt(creditRembourse)} FCFA\n`;
      }

      msg += 
        `\n👉 *Consulter votre caisse et vos stocks (accès 1-clic) :*\n${lienCaisse}\n\n` +
        `_Pour ajuster l'heure de ce bilan ou l'interrompre, rendez-vous dans les paramètres boutique ou répondez STOP._`;

      try {
        if (whatsappService?.sendWhatsAppText) {
          await whatsappService.sendWhatsAppText(normTel, msg);
          nbEnvoyes++;
          console.log(`[BILAN CAISSE CRON] Envoyé avec succès à ${bq.nom} (${normTel}).`);
        }
      } catch (errSend) {
        console.warn(`[BILAN CAISSE CRON] Erreur envoi vers ${normTel}:`, errSend.message);
      }
    }

    console.log(`[BILAN CAISSE CRON] Terminé : ${nbEnvoyes} bilan(s) envoyé(s).`);
    return { succes: true, envoyes: nbEnvoyes };
  } catch (err) {
    console.error('[BILAN CAISSE CRON FAIL]:', err);
    return { succes: false, error: err.message, envoyes: 0 };
  }
}

// Planification horaire (vérification toutes les heures en début d'heure)
if (process.env.NODE_ENV !== 'test') {
  const { executerTacheCron } = require('../lib/cronLogger');
  setTimeout(() => {
    executerTacheCron('bilan_journalier_caisse', () => traiterBilansQuotidiens()).catch(() => {});
    // Exécuter chaque heure à la minute 05
    setInterval(() => {
      executerTacheCron('bilan_journalier_caisse', () => traiterBilansQuotidiens()).catch(() => {});
    }, 60 * 60 * 1000);
  }, 15000);
}

module.exports = {
  traiterBilansQuotidiens
};
