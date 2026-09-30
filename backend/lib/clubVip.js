// backend/lib/clubVip.js — Nopalou Club VIP : palier calculé CÔTÉ SERVEUR à partir des commandes réellement livrées ou encaissées.
// Source unique pour la route de statut (affichage) et pour le checkout (facturation) : ce qui est affiché est ce qui est facturé.
// Tout est paramétrable PAR BOUTIQUE (boutiques.club_vip_config) : paliers, seuils, montants, portée du comptage.
// La remise est à la charge du marchand qui l'active (boutiques.club_vip_actif).

const PLAFOND_ILLIMITE = 10_000_000; // « livraison offerte » sans plafond : la remise est de toute façon bornée aux frais restants

const CONFIG_DEFAUT = Object.freeze({
  portee: 'plateforme', // 'plateforme' : toutes les commandes Nopalou du client ; 'boutique' : uniquement cette boutique
  paliers: [
    { nom: 'Silver', min_commandes: 2, min_depense: 50000, remise_fcfa: 500, livraison_offerte: false },
    { nom: 'Gold', min_commandes: 5, min_depense: 150000, remise_fcfa: 1000, livraison_offerte: false },
    { nom: 'Platine VIP', min_commandes: 10, min_depense: 300000, remise_fcfa: 2500, livraison_offerte: true },
  ],
});

const MAX_PALIERS = 6;

function erreurConfig(message) {
  const e = new Error(message);
  e.status = 400;
  return e;
}

function entierBorne(valeur, min, max, libelle) {
  const n = Number(valeur);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    throw erreurConfig(`${libelle} doit être un nombre entier entre ${min} et ${max}.`);
  }
  return n;
}

// Valide et normalise une configuration saisie par un marchand. Lève une erreur .status 400 avec un message clair.
function normaliserConfig(entree) {
  if (!entree || typeof entree !== 'object' || Array.isArray(entree)) throw erreurConfig('Configuration Club VIP invalide.');
  const portee = entree.portee === undefined ? CONFIG_DEFAUT.portee : entree.portee;
  if (portee !== 'plateforme' && portee !== 'boutique') throw erreurConfig('La portée du comptage doit être "plateforme" ou "boutique".');
  if (!Array.isArray(entree.paliers) || entree.paliers.length < 1 || entree.paliers.length > MAX_PALIERS) {
    throw erreurConfig(`Définissez entre 1 et ${MAX_PALIERS} paliers.`);
  }
  const noms = new Set();
  const paliers = entree.paliers.map((p, i) => {
    const nom = String(p?.nom ?? '').trim();
    if (!nom || nom.length > 40) throw erreurConfig(`Palier ${i + 1} : le nom est requis (40 caractères maximum).`);
    if (noms.has(nom.toLowerCase())) throw erreurConfig(`Palier ${i + 1} : le nom "${nom}" est déjà utilisé.`);
    noms.add(nom.toLowerCase());
    const min_commandes = entierBorne(p.min_commandes, 1, 1000, `Palier "${nom}" : le nombre de commandes`);
    const depenseBrute = p.min_depense === null || p.min_depense === undefined || p.min_depense === '' ? null : p.min_depense;
    const min_depense = depenseBrute === null ? null : entierBorne(depenseBrute, 1, 100_000_000, `Palier "${nom}" : la dépense minimale`);
    const livraison_offerte = p.livraison_offerte === true;
    const remise_fcfa = entierBorne(p.remise_fcfa ?? 0, 0, 1_000_000, `Palier "${nom}" : la remise`);
    if (!livraison_offerte && remise_fcfa <= 0) throw erreurConfig(`Palier "${nom}" : indiquez une remise en FCFA ou cochez « livraison offerte ».`);
    return { nom, min_commandes, min_depense, remise_fcfa, livraison_offerte };
  });
  return { portee, paliers };
}

// Lit la configuration stockée ; toute valeur absente ou corrompue retombe sur les valeurs par défaut.
function configEffective(brute) {
  try {
    const c = typeof brute === 'string' ? JSON.parse(brute) : brute;
    if (c && typeof c === 'object') return normaliserConfig(c);
  } catch (_) { /* configuration illisible : défauts */ }
  return { portee: CONFIG_DEFAUT.portee, paliers: CONFIG_DEFAUT.paliers.map(p => ({ ...p })) };
}

function plafondPalier(p) {
  return p.livraison_offerte ? (p.remise_fcfa > 0 ? p.remise_fcfa : PLAFOND_ILLIMITE) : p.remise_fcfa;
}

function atteint(p, nbCommandes, totalDepense) {
  return nbCommandes >= p.min_commandes || (p.min_depense !== null && totalDepense >= p.min_depense);
}

function descriptionPalier(p) {
  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
  if (p.livraison_offerte) {
    return p.remise_fcfa > 0
      ? `Livraison offerte (jusqu'à ${fmt(p.remise_fcfa)} FCFA pris en charge par la boutique)`
      : 'Livraison offerte par la boutique';
  }
  return `Remise de ${fmt(p.remise_fcfa)} FCFA déduite sur votre livraison`;
}

function palierPour(nbCommandes, totalDepense, config) {
  const cfg = configEffective(config);
  const atteints = cfg.paliers.filter(p => atteint(p, nbCommandes, totalDepense));
  const meilleur = atteints.sort((a, b) => plafondPalier(b) - plafondPalier(a))[0] || null;
  const restants = cfg.paliers
    .filter(p => !atteint(p, nbCommandes, totalDepense) && (!meilleur || plafondPalier(p) > plafondPalier(meilleur)))
    .sort((a, b) => a.min_commandes - b.min_commandes);
  const suivant = restants[0] || null;
  const prochain_palier = suivant
    ? { nom: suivant.nom, commandes_restantes: Math.max(1, suivant.min_commandes - nbCommandes), reduction_livraison: plafondPalier(suivant) }
    : null;
  if (meilleur) {
    return {
      palier: meilleur.nom, badge: `Acheteur ${meilleur.nom}`, reduction_livraison: plafondPalier(meilleur),
      livraison_offerte: meilleur.livraison_offerte, description: descriptionPalier(meilleur), prochain_palier,
    };
  }
  return {
    palier: 'Bronze', badge: 'Acheteur Bronze', reduction_livraison: 0, livraison_offerte: false,
    description: suivant ? `Encore ${prochain_palier.commandes_restantes} commande(s) pour passer ${suivant.nom} : ${descriptionPalier(suivant).toLowerCase()}` : 'Aucun avantage Club VIP configuré.',
    prochain_palier,
  };
}

function derniers9(telephone) {
  const digits = String(telephone || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : '';
}

// `db` : pool ou client. `options` : { config (brute ou normalisée), boutiqueId }.
// Ne lève jamais : en cas d'erreur, palier Bronze (aucune remise accordée).
async function statutClubVip(db, telephone, options = {}) {
  const cfg = configEffective(options.config);
  const tel9 = derniers9(telephone);
  let nbCommandes = 0;
  let totalDepense = 0;
  if (tel9) {
    try {
      const params = [tel9];
      let filtreBoutique = '';
      if (cfg.portee === 'boutique' && options.boutiqueId) {
        params.push(options.boutiqueId);
        filtreBoutique = ' AND boutique_id = $2';
      }
      const { rows } = await db.query(
        `SELECT COUNT(*) AS nb_commandes, COALESCE(SUM(montant_total + COALESCE(remise_club_vip, 0)), 0) AS total_depense
           FROM commandes_boutique
          WHERE RIGHT(regexp_replace(COALESCE(client_telephone, ''), '[^0-9]', '', 'g'), 9) = $1
            AND (statut IN ('livree', 'reverse') OR paiement_recu = true)
            AND statut <> 'annulee'${filtreBoutique}`,
        params
      );
      if (rows && rows[0]) {
        nbCommandes = parseInt(rows[0].nb_commandes || 0, 10);
        totalDepense = Math.round(Number(rows[0].total_depense || 0));
      }
    } catch (e) {
      console.warn('[CLUB VIP] statut indisponible, aucune remise accordée :', e.message);
    }
  }
  return { telephone: tel9, nb_commandes: nbCommandes, total_depense: totalDepense, portee: cfg.portee, ...palierPour(nbCommandes, totalDepense, cfg) };
}

// Remise de livraison réellement applicable : jamais au-delà des frais restant à payer.
function remiseLivraison(statut, fraisRestants) {
  return Math.max(0, Math.min(Number(fraisRestants) || 0, Number(statut?.reduction_livraison) || 0));
}

module.exports = { statutClubVip, remiseLivraison, palierPour, derniers9, normaliserConfig, configEffective, CONFIG_DEFAUT, MAX_PALIERS };
