// backend/lib/clubVip.js — Nopalou Club VIP : palier calculé CÔTÉ SERVEUR à partir des commandes réellement livrées ou encaissées.
// Source unique pour la route de statut (affichage) et pour le checkout (facturation) : ce qui est affiché est ce qui est facturé.
// AUD-084 : l'ancienne requête lisait la table `commandes` (colonnes `client_telephone`/`total` inexistantes) et retombait
// silencieusement sur « Bronze » ; la remise n'a donc jamais pu être vérifiée côté serveur.

const PALIERS = [
  { min: 10, minDepense: 300000, palier: 'Platine VIP', badge: 'Acheteur Platine VIP', reduction: 2500, offerte: true,
    description: 'Livraison Tiak-Tiak 100% offerte (jusqu\'à 2 500 FCFA pris en charge par Nopalou)' },
  { min: 5, minDepense: 150000, palier: 'Gold', badge: 'Acheteur Vérifié Gold', reduction: 1000, offerte: false,
    description: 'Remise de 1 000 FCFA déduite sur toutes vos livraisons Tiak-Tiak' },
  { min: 2, minDepense: 50000, palier: 'Silver', badge: 'Acheteur Silver', reduction: 500, offerte: false,
    description: 'Remise de 500 FCFA déduite sur votre livraison Tiak-Tiak' },
];

function derniers9(telephone) {
  const digits = String(telephone || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : '';
}

function palierPour(nbCommandes, totalDepense) {
  const p = PALIERS.find(x => nbCommandes >= x.min || totalDepense >= x.minDepense);
  if (p) {
    const idx = PALIERS.indexOf(p);
    const suivant = idx > 0 ? PALIERS[idx - 1] : null;
    return {
      palier: p.palier, badge: p.badge, reduction_livraison: p.reduction, livraison_offerte: p.offerte, description: p.description,
      prochain_palier: suivant ? { nom: suivant.palier, commandes_restantes: Math.max(1, suivant.min - nbCommandes), reduction_livraison: suivant.reduction } : null,
    };
  }
  return {
    palier: 'Bronze', badge: 'Acheteur Bronze', reduction_livraison: 0, livraison_offerte: false,
    description: 'Effectuez encore 1 commande pour passer Silver et économiser 500 FCFA sur vos livraisons Tiak-Tiak',
    prochain_palier: { nom: 'Silver', commandes_restantes: Math.max(1, 2 - nbCommandes), reduction_livraison: 500 },
  };
}

// `db` : pool ou client de transaction. Ne lève jamais : en cas d'erreur, palier Bronze (aucune remise accordée).
async function statutClubVip(db, telephone) {
  const tel9 = derniers9(telephone);
  let nbCommandes = 0;
  let totalDepense = 0;
  if (tel9) {
    try {
      const { rows } = await db.query(
        `SELECT COUNT(*) AS nb_commandes, COALESCE(SUM(montant_total + COALESCE(remise_club_vip, 0)), 0) AS total_depense
           FROM commandes_boutique
          WHERE RIGHT(regexp_replace(COALESCE(client_telephone, ''), '[^0-9]', '', 'g'), 9) = $1
            AND (statut IN ('livree', 'reverse') OR paiement_recu = true)
            AND statut <> 'annulee'`,
        [tel9]
      );
      if (rows && rows[0]) {
        nbCommandes = parseInt(rows[0].nb_commandes || 0, 10);
        totalDepense = Math.round(Number(rows[0].total_depense || 0));
      }
    } catch (e) {
      console.warn('[CLUB VIP] statut indisponible, aucune remise accordée :', e.message);
    }
  }
  return { telephone: tel9, nb_commandes: nbCommandes, total_depense: totalDepense, ...palierPour(nbCommandes, totalDepense) };
}

// Remise de livraison réellement applicable : jamais au-delà des frais restant à payer.
function remiseLivraison(statut, fraisRestants) {
  return Math.max(0, Math.min(Number(fraisRestants) || 0, Number(statut?.reduction_livraison) || 0));
}

module.exports = { statutClubVip, remiseLivraison, palierPour, derniers9 };
