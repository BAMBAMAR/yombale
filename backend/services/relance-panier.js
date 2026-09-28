// backend/services/relance-panier.js
// Nopalou — Relance Automatique de Panier Abandonné via WhatsApp (Audit P1)
// Récupère les ventes/commandes abandonnées après 45 minutes et relance le client avec son lien Wave

const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone, estDesinscrit } = require('./whatsapp');

let _migrated = false;
async function assurerColonnesRelance() {
  if (_migrated) return;
  try {
    await pool.query(`
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS relance_panier_envoyee BOOLEAN DEFAULT FALSE;
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS date_relance_panier TIMESTAMPTZ;
    `);
    _migrated = true;
  } catch (e) {
    _migrated = true;
  }
}

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

/**
 * Exécute une passe de détection et relance des paniers abandonnés
 */
async function executerRelancePaniers() {
  // Garde-fou horaire strict : Fuseau horaire Dakar (UTC+0).
  const heureDakar = new Date().getUTCHours();
  if (heureDakar < 9 || heureDakar >= 21) {
    return { count: 0, message: 'Relance paniers suspendue en dehors des heures ouvrées (09h-21h GMT)' };
  }

  try {
    await assurerColonnesRelance();

    // Commandes en attente créées il y a entre 45 minutes et 24 heures
    // Filtrées selon le choix du commerçant (notif_panier_abandonne) et statut non-suspendu
    const { rows } = await pool.query(`
      SELECT c.id, c.reference, c.client_nom, c.client_telephone, c.montant_total, c.nom_produit, c.quantite,
             b.nom as boutique_nom, b.telephone as boutique_tel, b.whatsapp as boutique_whatsapp
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      WHERE (c.statut = 'en_attente' OR c.statut = 'attente_paiement')
        AND (c.relance_panier_envoyee IS NOT TRUE)
        AND c.client_telephone IS NOT NULL
        AND length(trim(c.client_telephone)) >= 9
        AND COALESCE(b.notif_panier_abandonne, true) = true
        AND b.relances_suspendues IS NOT TRUE
        AND c.created_at <= NOW() - INTERVAL '45 minutes'
        AND c.created_at >= NOW() - INTERVAL '24 hours'
      LIMIT 15
    `);

    if (!rows.length) {
      return { count: 0, message: 'Aucun panier abandonné éligible' };
    }

    let relancesEnvoyees = 0;

    for (const cmd of rows) {
      try {
        const phone = normalisePhone(cmd.client_telephone);
        if (await estDesinscrit(phone)) {
          await pool.query('UPDATE commandes_boutique SET relance_panier_envoyee = TRUE WHERE id = $1', [cmd.id]);
          continue;
        }

        const prenom = cmd.client_nom ? cmd.client_nom.split(' ')[0] : 'Bonjour';
        const montantFmt = new Intl.NumberFormat('fr-FR').format(cmd.montant_total);
        const nomBoutique = cmd.boutique_nom || 'Nopalou Sénégal';
        const lienPaiement = `${SITE}/suivi-commande?ref=${encodeURIComponent(cmd.reference)}`;

        const msg = 
`👋 *${prenom}, avez-vous oublié vos articles chez ${nomBoutique} ?*

Votre commande *${cmd.reference}* (${cmd.quantite}x ${cmd.nom_produit || 'Produit'} — *${montantFmt} FCFA*) est réservée et prête pour expédition !

⚡ *Pour finaliser votre commande en 1 clic (Wave / OM / Cash) :*
👉 ${lienPaiement}

Besoin d'un renseignement ? Répondez directement à ce message pour échanger avec notre service client.

_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

        await sendWhatsAppText(phone, msg);

        await pool.query(`
          UPDATE commandes_boutique
          SET relance_panier_envoyee = TRUE, date_relance_panier = NOW()
          WHERE id = $1
        `, [cmd.id]);

        relancesEnvoyees++;
      } catch (errCmd) {
        console.warn(`[RELANCE PANIER] Erreur pour commande ${cmd.reference}:`, errCmd.message);
      }
    }

    // 2. Traitement des sessions de paniers abandonnés en ligne (table paniers_abandonnes)
    const { rows: paniersRows } = await pool.query(`
      SELECT p.id, p.client_nom, p.client_tel, p.articles, p.total, p.boutique_id,
             b.nom as boutique_nom, b.slug as boutique_slug
      FROM paniers_abandonnes p
      LEFT JOIN boutiques b ON b.id = p.boutique_id
      WHERE (p.relance_envoyee IS NOT TRUE)
        AND p.client_tel IS NOT NULL
        AND length(trim(p.client_tel)) >= 9
        AND p.created_at <= NOW() - INTERVAL '45 minutes'
      LIMIT 15
    `);

    for (const p of paniersRows) {
      try {
        const phone = normalisePhone(p.client_tel);
        if (await estDesinscrit(phone)) {
          await pool.query('UPDATE paniers_abandonnes SET relance_envoyee = TRUE WHERE id = $1', [p.id]);
          continue;
        }

        const prenom = p.client_nom ? p.client_nom.split(' ')[0] : 'Bonjour';
        const totalFmt = new Intl.NumberFormat('fr-FR').format(p.total || 0);
        const nomBoutique = p.boutique_nom || 'Nopalou Sénégal';
        const boutiqueUrl = `${SITE}/boutiques/${p.boutique_slug || p.boutique_id}`;

        let articlesList = '';
        if (Array.isArray(p.articles) && p.articles.length > 0) {
          articlesList = p.articles.map(a => `• ${a.quantite || 1}x ${a.nom || 'Article'}`).slice(0, 3).join('\n');
        }

        const msgPanier = 
`👋 *${prenom}, avez-vous oublié vos articles chez ${nomBoutique} ?*

Vos articles sont toujours mis de côté pour vous :
${articlesList ? articlesList + '\n' : ''}Total panier : *${totalFmt} FCFA*

⚡ *Pour finaliser votre commande directement avec le vendeur :*
👉 ${boutiqueUrl}

_Pour ne plus recevoir de rappel, répondez simplement STOP._`;

        await sendWhatsAppText(phone, msgPanier);

        await pool.query(`
          UPDATE paniers_abandonnes
          SET relance_envoyee = TRUE
          WHERE id = $1
        `, [p.id]);

        relancesEnvoyees++;
      } catch (errP) {
        console.warn(`[RELANCE PANIER ABANDONNE] Erreur pour panier ${p.id}:`, errP.message);
      }
    }

    return { count: relancesEnvoyees, message: `${relancesEnvoyees} relances envoyées avec succès` };
  } catch (err) {
    console.error('[RELANCE PANIER CRON ERR]:', err.message);
    return { count: 0, error: err.message };
  }
}

module.exports = {
  executerRelancePaniers,
  relancerPaniersAbandonnes: executerRelancePaniers,
  assurerColonnesRelance
};
