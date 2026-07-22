// backend/routes/facebook-posts.js — Gestion des publications Facebook + Instagram
const express = require('express');
const router  = express.Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const settingsCache = require('../lib/settingsCache');
const https = require('https');
const qs    = require('querystring');

// Miroir de PALIERS_BOUTIQUE (frontend-next/src/lib/fonctionnalites-data.ts) — dupliqué ici
// car ce fichier backend CommonJS ne peut pas importer un module TypeScript Next.js.
// Si les avantages ou couleurs par palier changent côté frontend, mettre à jour aussi ici.
const PALIERS_AVANTAGES = {
  pro: {
    label: 'Boutique Pro',
    avantages: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      'Catalogue produits avec photos et prix',
    ],
  },
  business: {
    label: 'Boutique Business',
    avantages: [
      'Tout ce qui est inclus dans Pro',
      'URL dédiée /boutiques/[votre-nom]',
      '15 annonces classées incluses/mois',
    ],
  },
};

router.use(adminSecretOnly);

// ── Helpers token ────────────────────────────────────────────────────────────

async function getToken() {
  try {
    const { rows } = await pool.query(`SELECT value FROM settings WHERE key='fb_page_access_token'`);
    if (rows.length && rows[0].value) return rows[0].value;
  } catch (_) {}
  return process.env.FB_PAGE_ACCESS_TOKEN || null;
}

async function setToken(token) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('fb_page_access_token', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
    [token]
  );
}

// GET /api/facebook-posts/token-status
router.get('/token-status', async (req, res) => {
  const token = await getToken();
  if (!token) return res.json({ status: 'missing', message: 'Aucun token configuré' });
  try {
    const r    = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${token}`);
    const data = await r.json();
    if (data.error) {
      return res.json({ status: 'expired', message: data.error.message });
    }
    // Récupère la date d'expiration via debug_token
    const appToken = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
    const dbg  = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${token}&access_token=${appToken}`);
    const dbgD = await dbg.json();
    const exp  = dbgD.data?.expires_at;
    const type = dbgD.data?.type;
    return res.json({
      status: 'ok',
      name: data.name,
      id: data.id,
      type,
      expires_at: exp ? new Date(exp * 1000).toISOString() : null,
      is_page_token: type === 'PAGE',
    });
  } catch (e) {
    return res.json({ status: 'error', message: e.message });
  }
});

// POST /api/facebook-posts/token — mettre à jour le token FB (page token direct)
router.post('/token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token requis' });
  try {
    const r    = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${token}`);
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: `Token invalide : ${data.error.message}` });
    await setToken(token);
    res.json({ ok: true, name: data.name, id: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook-posts/token-exchange — échange un user token court en page token permanent
// 1. Échange user_token court → long-lived user token (60j)
// 2. Récupère le page token depuis ce long-lived token → ne expire jamais
router.post('/token-exchange', async (req, res) => {
  const { user_token } = req.body;
  if (!user_token) return res.status(400).json({ error: 'user_token requis' });

  const appId     = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const pageId    = process.env.FB_PAGE_ID;
  if (!appId || !appSecret) return res.status(500).json({ error: 'FB_APP_ID / FB_APP_SECRET non configurés côté serveur' });
  if (!pageId)              return res.status(500).json({ error: 'FB_PAGE_ID non configuré côté serveur' });

  try {
    // Étape 1 : long-lived user token
    const llRes  = await fetch(
      `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(user_token)}`
    );
    const llData = await llRes.json();
    if (llData.error) return res.status(400).json({ error: `Échange échoué : ${llData.error.message}` });
    const longLivedToken = llData.access_token;

    // Étape 2 : page access token (ne expire pas)
    const pgRes  = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=access_token,name&access_token=${longLivedToken}`
    );
    const pgData = await pgRes.json();
    if (pgData.error) return res.status(400).json({ error: `Récupération page token échouée : ${pgData.error.message}` });
    if (!pgData.access_token) return res.status(400).json({ error: 'Aucun page token retourné — vérifiez que vous avez les droits pages_manage_posts sur cette page' });

    await setToken(pgData.access_token);
    res.json({ ok: true, name: pgData.name, permanent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook-posts/generer/:type — génère un brouillon depuis la DB
router.get('/generer/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let result = null;

    if (type === 'bon-plan') {
      const { rows } = await pool.query(`
        SELECT p.nom, p.marque, p.image_url, p.id as produit_id,
               MIN(o.prix) as prix_min,
               MAX(o.prix) as prix_max,
               (SELECT m.nom FROM marchands m
                JOIN offres o2 ON o2.marchand_id = m.id
                WHERE o2.produit_id = p.id AND o2.stock = true AND o2.prix > 0
                ORDER BY o2.prix ASC LIMIT 1) as marchand
        FROM produits p
        JOIN offres o ON o.produit_id = p.id
        WHERE o.stock = true AND o.prix > 0 AND p.image_url IS NOT NULL
        GROUP BY p.id, p.nom, p.marque, p.image_url
        HAVING MAX(o.prix) - MIN(o.prix) > 500
        ORDER BY RANDOM()
        LIMIT 30
      `);
      if (rows.length) {
        const p = rows[Math.floor(Math.random() * rows.length)];
        const eco = Math.round(p.prix_max - p.prix_min);
        const nom = [p.marque, p.nom].filter(Boolean).join(' ');
        const gabarits = [
          `🔥 BON PLAN DU JOUR !\n\n📱 ${nom}\n💰 À partir de ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA chez ${p.marchand || 'nos marchands partenaires'}\n\nÉconomisez jusqu'à ${eco > 0 ? eco.toLocaleString('fr-FR') + ' FCFA' : 'plusieurs milliers de FCFA'} en comparant avant d'acheter !\n\n👉 Comparez tous les prix sur nopalou.com\n\n#Nopalou #BonPlan #Dakar #Sénégal #PrixMoinsCher`,
          `⚡ PROMO REPÉRÉE !\n\n${nom} disponible dès ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA${p.marchand ? ` chez ${p.marchand}` : ''} — un des meilleurs prix du marché en ce moment.\n\n💸 Économie potentielle : ${eco.toLocaleString('fr-FR')} FCFA par rapport aux offres plus chères.\n\n👉 nopalou.com pour voir toutes les offres\n\n#Nopalou #Promo #Dakar #Sénégal #BonPlan`,
          `👀 À NE PAS RATER\n\n${nom} — les prix varient énormément selon le vendeur au Sénégal.\n\n✅ Meilleur prix trouvé : ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA\n✅ Économie possible : jusqu'à ${eco.toLocaleString('fr-FR')} FCFA\n\n👉 Comparez avant d'acheter sur nopalou.com\n\n#Nopalou #Shopping #Dakar #Sénégal #PrixMoinsCher`,
          `🛍️ MEILLEUR PRIX REPÉRÉ !\n\n${nom}\n\n🏷️ Tarif de départ : ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA\n📍 Nopalou compare les offres de plusieurs marchands pour vous trouver le meilleur deal.\n\n👉 nopalou.com\n\n#Nopalou #BonneAffaire #Dakar #Sénégal`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: p.image_url,
          lien: `https://nopalou.com/produit/${p.produit_id}`,
        };
      }
    }

    else if (type === 'immo') {
      const { rows } = await pool.query(`
        SELECT id, titre, prix, ville, quartier, type_bien, transaction, photos
        FROM annonces_immo
        WHERE actif = true AND supprimee = false AND photos IS NOT NULL AND jsonb_array_length(photos) > 0
        ORDER BY RANDOM() LIMIT 20
      `);
      if (rows.length) {
        const a = rows[Math.floor(Math.random() * rows.length)];
        const loc = [a.quartier, a.ville].filter(Boolean).join(', ') || 'Dakar';
        const typeBien = a.transaction === 'vente' ? 'À VENDRE' : 'À LOUER';
        const prix = a.prix ? `${Number(a.prix).toLocaleString('fr-FR')} FCFA${a.transaction !== 'vente' ? '/mois' : ''}` : 'Prix à négocier';
        const hashtagTransaction = a.transaction === 'vente' ? 'Vente' : 'Location';
        const gabarits = [
          `🏠 ${typeBien} — ${a.type_bien || 'Bien immobilier'}\n\n📍 ${loc}\n💰 ${prix}\n\n${a.titre}\n\nDes centaines d'annonces immo disponibles sur Nopalou — villas, appartements, terrains à Dakar et partout au Sénégal.\n\n👉 nopalou.com/immo\n\n#Immobilier #Dakar #Sénégal #${hashtagTransaction} #Nopalou`,
          `📍 NOUVEAU SUR NOPALOU\n\n${a.type_bien || 'Bien immobilier'} ${typeBien.toLowerCase()} à ${loc}\n\n💰 ${prix}\n\n${a.titre}\n\nParcourez toutes les annonces immo vérifiées du Sénégal sur Nopalou.\n\n👉 nopalou.com/immo\n\n#Immo #Dakar #Sénégal #${hashtagTransaction} #Nopalou`,
          `🔑 ${a.type_bien || 'Bien'} disponible ${typeBien === 'À VENDRE' ? 'à la vente' : 'à la location'}\n\n📍 ${loc}\n💰 ${prix}\n\n${a.titre}\n\nNopalou référence des centaines de biens immobiliers partout au Sénégal — mis à jour en continu.\n\n👉 nopalou.com/immo\n\n#Immobilier #Dakar #Sénégal #${hashtagTransaction} #Nopalou`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: a.photos?.[0] || null,
          lien: `https://nopalou.com/immo/${a.id}`,
        };
      }
    }

    else if (type === 'comparatif') {
      const { rows } = await pool.query(`
        SELECT p.nom, p.marque, p.image_url, p.id as produit_id,
               COUNT(DISTINCT o.marchand_id) as nb_marchands,
               MIN(o.prix) as prix_min, MAX(o.prix) as prix_max
        FROM produits p
        JOIN offres o ON o.produit_id = p.id
        WHERE o.stock = true AND o.prix > 0 AND p.image_url IS NOT NULL
        GROUP BY p.id, p.nom, p.marque, p.image_url
        HAVING COUNT(DISTINCT o.marchand_id) >= 2
        ORDER BY RANDOM()
        LIMIT 30
      `);
      if (rows.length) {
        const p = rows[Math.floor(Math.random() * rows.length)];
        const eco = Math.round(p.prix_max - p.prix_min);
        const nom = [p.marque, p.nom].filter(Boolean).join(' ');
        const hashtagMarque = (p.marque || 'Tech').replace(/\s/g,'');
        const gabarits = [
          `📊 COMPARER C'EST ÉCONOMISER !\n\n${nom} est vendu à des prix très différents selon le marchand au Sénégal.\n\n💸 Jusqu'à ${eco > 0 ? eco.toLocaleString('fr-FR') + ' FCFA' : 'plusieurs milliers de FCFA'} de différence entre les vendeurs !\n\nNopalou compare ${p.nb_marchands} marchands en temps réel pour vous trouver le meilleur prix.\n\n👉 Voir tous les prix sur nopalou.com\n\n#Nopalou #Comparateur #${hashtagMarque} #Dakar #Sénégal #PrixMoinsCher`,
          `🤔 SAVIEZ-VOUS QUE LES PRIX VARIENT AUTANT ?\n\nPour ${nom}, l'écart entre le prix le plus bas et le plus haut atteint ${eco.toLocaleString('fr-FR')} FCFA au Sénégal.\n\nNopalou surveille ${p.nb_marchands} marchands en temps réel pour vous faire gagner cet argent.\n\n👉 nopalou.com\n\n#Nopalou #Comparateur #${hashtagMarque} #Dakar #Sénégal`,
          `💸 NE PAYEZ PAS PLUS CHER QUE NÉCESSAIRE\n\n${nom} : jusqu'à ${eco.toLocaleString('fr-FR')} FCFA d'écart entre marchands sur ${p.nb_marchands} sites comparés par Nopalou.\n\nUn coup d'œil avant d'acheter peut vous faire économiser gros.\n\n👉 Comparez sur nopalou.com\n\n#Nopalou #BonPlan #${hashtagMarque} #Dakar #Sénégal`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: p.image_url,
          lien: `https://nopalou.com/produit/${p.produit_id}`,
        };
      }
    }

    else if (type === 'conseil') {
      const conseils = [
        {
          message: `💡 CONSEIL ACHAT #1\n\nAvant d'acheter un téléphone en ligne au Sénégal :\n\n✅ Comparez les prix sur plusieurs sites\n✅ Vérifiez la garantie (locale ou importée)\n✅ Lisez les avis des acheteurs\n✅ Privilégiez les vendeurs vérifiés\n✅ Gardez votre reçu de paiement\n\nNopalou compare automatiquement les prix chez tous les marchands en ligne.\n\n👉 nopalou.com\n\n#ConseilAchat #Smartphone #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com',
        },
        {
          message: `💡 LE SAVIEZ-VOUS ?\n\nAu Sénégal, le même produit peut coûter jusqu'à 40% moins cher selon le site où vous l'achetez.\n\nNopalou indexe en temps réel :\n📦 +3 000 produits\n🏪 9 sites partenaires\n🔄 Mis à jour toutes les 6h\n\nComparez avant d'acheter — c'est gratuit !\n\n👉 nopalou.com\n\n#Nopalou #BonPlan #Dakar #Sénégal #Shopping #PrixMoinsCher`,
          image_url: null, lien: 'https://nopalou.com',
        },
        {
          message: `💡 AVANT DE LOUER OU ACHETER UN BIEN\n\n✅ Visitez toujours le bien en personne avant tout paiement\n✅ Vérifiez les documents de propriété ou le contrat de bail\n✅ Méfiez-vous des prix anormalement bas\n✅ Ne versez jamais d'acompte sans avoir vu le bien\n\nNopalou référence des centaines d'annonces immo vérifiées à Dakar et partout au Sénégal.\n\n👉 nopalou.com/immo\n\n#ConseilImmo #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com/immo',
        },
        {
          message: `💡 CHOISIR SON FORFAIT TÉLÉCOM\n\n✅ Comparez le prix au Go entre opérateurs\n✅ Vérifiez la validité (jours) avant de choisir\n✅ Un forfait data illimité n'est pas toujours le plus rentable\n✅ Certains forfaits incluent des appels/SMS bonus\n\nNopalou compare tous les forfaits Orange, Yas, Promobile et Expresso en un coup d'œil.\n\n👉 nopalou.com/telecom\n\n#ConseilTelecom #Forfait #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com/telecom',
        },
        {
          message: `💡 PAYER EN LIGNE EN TOUTE SÉCURITÉ\n\n✅ Ne partagez jamais votre code PIN Wave/Orange Money\n✅ Vérifiez le numéro du destinataire avant de valider\n✅ Privilégiez le paiement à la livraison si possible\n✅ Gardez toujours une preuve de transaction\n\nNopalou facilite la mise en relation, mais la prudence reste votre meilleure protection.\n\n👉 nopalou.com\n\n#SécuritéPaiement #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com',
        },
        {
          message: `💡 REPÉRER UN BON VENDEUR EN LIGNE\n\n✅ Regardez depuis combien de temps la boutique existe\n✅ Un numéro de téléphone actif et qui répond est bon signe\n✅ Comparez ses prix avec le marché\n✅ Privilégiez les boutiques avec badge "Vendeur Pro" sur Nopalou\n\nLes boutiques Nopalou sont identifiables et contactables directement sur WhatsApp.\n\n👉 nopalou.com/boutiques\n\n#ConseilAchat #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com/boutiques',
        },
        {
          message: `💡 NE RATEZ PLUS UNE BAISSE DE PRIX\n\nSur Nopalou, vous pouvez créer une alerte gratuite sur n'importe quel produit :\n\n🔔 Vous êtes notifié dès que le prix baisse\n📊 Comparez l'historique de prix sur 30 jours\n💰 Achetez au meilleur moment, pas dans la précipitation\n\n👉 Activez une alerte sur nopalou.com\n\n#AlertePrix #BonPlan #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com',
        },
        {
          message: `💡 COMMANDEZ SANS QUITTER WHATSAPP\n\nSaviez-vous que l'assistant Nopalou fonctionne directement sur WhatsApp ?\n\n🔍 Recherchez un produit\n🛒 Commandez auprès d'une boutique\n📦 Suivez votre commande\n\nAucune application à installer, juste WhatsApp.\n\n👉 wa.me/221708717942\n\n#AssistantWhatsApp #Dakar #Sénégal #Nopalou`,
          image_url: null, lien: 'https://nopalou.com/assistant-whatsapp',
        },
      ];
      result = conseils[Math.floor(Math.random() * conseils.length)];
    }

    else if (type === 'abonnement') {
      const palierId = Math.random() < 0.5 ? 'pro' : 'business';
      const palier = PALIERS_AVANTAGES[palierId];
      const prix = await settingsCache.getNum(`plan_${palierId}_prix`);
      const avantagesTexte = palier.avantages.map(a => `✅ ${a}`).join('\n');
      const gabarits = [
        `⭐ ${palier.label.toUpperCase()}\n\nVous vendez sur Nopalou ? Passez au niveau supérieur :\n\n${avantagesTexte}\n\n💰 ${prix.toLocaleString('fr-FR')} FCFA/mois seulement\n\n👉 Créez votre boutique ou passez à ${palier.label} sur nopalou.com\n\n#Nopalou #Boutique #Vendeur #Dakar #Sénégal #Ecommerce`,
        `🚀 BOOSTEZ VOS VENTES AVEC ${palier.label.toUpperCase()}\n\nVos clients vous trouvent déjà sur WhatsApp ? Avec ${palier.label}, offrez-leur une vraie vitrine en ligne :\n\n${avantagesTexte}\n\n💰 Seulement ${prix.toLocaleString('fr-FR')} FCFA/mois\n\n👉 nopalou.com/boutique/abonnement\n\n#Nopalou #CommerceDigital #Dakar #Sénégal #Boutique`,
        `💼 COMMERÇANTS SÉNÉGALAIS — NOPALOU ${palier.label.toUpperCase()}\n\nDes milliers d'acheteurs visitent Nopalou chaque jour. Mettez votre boutique devant eux :\n\n${avantagesTexte}\n\n✅ Commandes directement sur WhatsApp\n✅ Catalogue produits avec photos\n\n💰 ${prix.toLocaleString('fr-FR')} FCFA/mois\n\n👉 nopalou.com\n\n#Nopalou #Vendeur #Ecommerce #Dakar #Sénégal`,
        `📦 VENDEZ PLUS, GÉREZ MIEUX — ${palier.label.toUpperCase()}\n\nNopalou ${palier.label} vous donne les outils pour développer votre business en ligne au Sénégal :\n\n${avantagesTexte}\n\n💡 Vos clients commandent directement depuis le site ou WhatsApp.\n\n💰 ${prix.toLocaleString('fr-FR')} FCFA/mois — sans commission sur les ventes\n\n👉 nopalou.com/boutique\n\n#Nopalou #Business #Boutique #Dakar #Sénégal`,
      ];
      result = {
        message: gabarits[Math.floor(Math.random() * gabarits.length)],
        image_url: `https://nopalou.com/assets/palier/${palierId}/carre`,
        lien: 'https://nopalou.com/boutique/abonnement',
      };
    }

    else if (type === 'boutiques') {
      let b = null;
      let nbProduits = 0;
      try {
        const { rows } = await pool.query(`
          SELECT b.nom, b.description, b.slug, b.logo_url,
                 COUNT(bp.id) as nb_produits
          FROM boutiques b
          LEFT JOIN boutique_produits bp ON bp.boutique_id = b.id AND bp.actif = true
          WHERE b.actif = true
          GROUP BY b.id, b.nom, b.description, b.slug, b.logo_url
          ORDER BY RANDOM()
          LIMIT 5
        `);
        if (rows.length) {
          b = rows[Math.floor(Math.random() * rows.length)];
          nbProduits = Number(b.nb_produits || 0);
        }
      } catch (_) {}

      if (b) {
        const lien = b.slug ? `https://nopalou.com/boutique/${b.slug}` : 'https://nopalou.com/boutiques';
        const gabarits = [
          `🏪 DÉCOUVREZ NOS BOUTIQUES EN LIGNE !\n\n${b.nom}${b.description ? ` — ${b.description.slice(0, 80)}` : ''}\n\n✅ ${nbProduits > 0 ? nbProduits + ' produit(s) disponibles' : 'Boutique vérifiée sur Nopalou'}\n✅ Commandez directement sur WhatsApp\n✅ Livraison à Dakar et dans les régions\n\n👉 Visitez la boutique sur nopalou.com\n\n#Nopalou #Boutique #Shopping #Dakar #Sénégal`,
          `🛍️ SHOPPING EN LIGNE AU SÉNÉGAL\n\nNopalou héberge des dizaines de boutiques locales vérifiées.\n\nDécouvrez ${b.nom} et ses produits disponibles dès maintenant.\n\n✅ Commande directe par WhatsApp\n✅ Prix transparents\n✅ Vendeurs vérifiés\n\n👉 nopalou.com/boutiques\n\n#Nopalou #BoutiqueLocale #Dakar #Sénégal #Shopping`,
          `💚 SOUTENEZ LES COMMERÇANTS LOCAUX\n\n${b.nom} est l'une des boutiques partenaires de Nopalou.\n\n🏪 Catalogue en ligne\n📲 Commandez via WhatsApp en 1 clic\n🚚 Livraison à domicile possible\n\nRetrouvez toutes nos boutiques sur nopalou.com/boutiques\n\n#CommerceLocal #Dakar #Sénégal #Nopalou #Shopping`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: b.logo_url || null,
          lien,
        };
      } else {
        // Fallback générique si aucune boutique en base
        const gabarits = [
          `🏪 DÉCOUVREZ LES BOUTIQUES PARTENAIRES NOPALOU !\n\nDes dizaines de vendeurs et commerçants sénégalais présentent leurs produits sur Nopalou.\n\n✅ Produits électroniques, mode, cosmétiques, maison\n✅ Commandes directes sur WhatsApp\n✅ Prix transparents & vendeurs vérifiés\n\n👉 Explorez les boutiques sur nopalou.com/boutiques\n\n#Nopalou #Boutiques #ShoppingDakar #Sénégal #CommerceLocal`,
          `🛍️ VOUS CHERCHEZ UNE BOUTIQUE EN LIGNE FIABLE AU SÉNÉGAL ?\n\nSur Nopalou, découvrez les boutiques partenaires vérifiées à Dakar et dans les régions.\n\n📱 Parcourez les catalogues\n📲 Contactez le vendeur sur WhatsApp en un clic\n🚚 Faites-vous livrer chez vous\n\n👉 nopalou.com/boutiques\n\n#Nopalou #BoutiqueEnLigne #Dakar #Sénégal`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: null,
          lien: 'https://nopalou.com/boutiques',
        };
      }
    }

    else if (type === 'telecom') {
      let f = null;
      try {
        const { rows } = await pool.query(`
          SELECT f.nom, f.operateur, f.prix, f.data_mo, f.validite_jours, f.type
          FROM forfaits_telecom f
          WHERE f.actif = true AND f.prix > 0
          ORDER BY RANDOM()
          LIMIT 10
        `);
        if (rows.length) {
          f = rows[Math.floor(Math.random() * rows.length)];
        }
      } catch (_) {}

      if (f) {
        const dataText = f.data_mo ? (f.data_mo >= 1024 ? `${(f.data_mo / 1024).toFixed(0)} Go de data` : `${f.data_mo} Mo de data`) : 'data inclus';
        const validite = f.validite_jours ? `valable ${f.validite_jours} jours` : '';
        const gabarits = [
          `📱 BON PLAN TÉLÉCOM !\n\n${f.operateur} — ${f.nom}\n\n✅ ${dataText}${validite ? `\n⏱️ ${validite}` : ''}\n💰 ${Number(f.prix).toLocaleString('fr-FR')} FCFA\n\nNopalou compare tous les forfaits Orange, Yas, Promobile et Expresso pour vous trouver la meilleure offre.\n\n👉 nopalou.com/telecom\n\n#Telecom #Forfait #${f.operateur.replace(/\s/g,'')} #Dakar #Sénégal #Nopalou`,
          `📡 COMPAREZ LES FORFAITS MOBILES\n\nPas sûr de choisir le bon forfait ? Nopalou compare en temps réel tous les opérateurs :\n\n📱 Orange · Yas · Promobile · Expresso\n\nExemple : ${f.operateur} propose ${f.nom} à ${Number(f.prix).toLocaleString('fr-FR')} FCFA (${dataText}${validite ? `, ${validite}` : ''}).\n\n👉 Trouvez votre forfait idéal sur nopalou.com/telecom\n\n#Telecom #Forfait #Dakar #Sénégal #Nopalou`,
          `💡 ÉCONOMISEZ SUR VOTRE FORFAIT !\n\nSaviez-vous que le même budget donne des résultats très différents selon l'opérateur ?\n\nNopalou compare tous les forfaits data, voix et SMS en un clin d'œil.\n\n📱 Offre repérée : ${f.operateur} — ${f.nom} (${dataText}) à ${Number(f.prix).toLocaleString('fr-FR')} FCFA\n\n👉 nopalou.com/telecom\n\n#Telecom #Forfait #Internet #Dakar #Sénégal #Nopalou`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: null,
          lien: 'https://nopalou.com/telecom',
        };
      } else {
        // Gabarit générique si aucun forfait en base
        const gabarits = [
          `📱 COMPAREZ TOUS LES FORFAITS MOBILES AU SÉNÉGAL\n\nOrange, Yas, Promobile, Expresso — Nopalou compare en temps réel les meilleures offres data, voix et SMS.\n\n✅ Comparaison gratuite\n✅ Mis à jour en continu\n✅ Trouvez le meilleur rapport qualité-prix\n\n👉 nopalou.com/telecom\n\n#Telecom #Forfait #Mobile #Dakar #Sénégal #Nopalou`,
          `📶 FORFAIT INTERNET : NE PAYEZ PAS PLUS CHER !\n\nComparez le prix au Go entre les différents opérateurs au Sénégal avant de recharger.\n\n📊 Comparez Orange, Yas, Promobile et Expresso en 1 clic.\n\n👉 nopalou.com/telecom\n\n#Telecom #Data #Internet #Dakar #Sénégal #Nopalou`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: null,
          lien: 'https://nopalou.com/telecom',
        };
      }
    }

    else if (type === 'apporteur') {
      const taux = await settingsCache.getNum('apporteur_taux_commission');
      const prixPro = await settingsCache.getNum('plan_pro_prix');
      const prixBusiness = await settingsCache.getNum('plan_business_prix');
      const commPro = Math.round(prixPro * (taux / 100));
      const commBusiness = Math.round(prixBusiness * (taux / 100));
      const gabarits = [
        `💼 GAGNEZ DE L'ARGENT AVEC NOPALOU !\n\nDevenez apporteur d'affaires Nopalou — recommandez la plateforme aux commerçants et touchez une commission chaque mois :\n\n✅ ${taux}% de commission récurrente sur chaque boutique recrutée\n💰 Ex : ${commPro.toLocaleString('fr-FR')} FCFA/mois pour une boutique Pro\n💰 Ex : ${commBusiness.toLocaleString('fr-FR')} FCFA/mois pour une boutique Business\n\n🚀 Pas d'investissement, pas d'engagement\n\n👉 Inscrivez-vous sur nopalou.com/compte/apporteur\n\n#Nopalou #Apporteur #CommissionRecurrente #Dakar #Sénégal`,
        `🤝 VOUS CONNAISSEZ DES COMMERÇANTS ?\n\nTransformez votre réseau en source de revenus !\n\nNopalou cherche des apporteurs d'affaires pour recruter des boutiques partenaires au Sénégal.\n\n✅ ${taux}% de commission mensuelle récurrente\n✅ Sans investissement\n✅ Lien de parrainage personnel + suivi\n\n💡 Plus vous recrutez, plus vous gagnez — chaque mois, automatiquement.\n\n👉 nopalou.com/compte/apporteur\n\n#Nopalou #Apporteur #Business #Dakar #Sénégal`,
        `💰 OPPORTUNITÉ BUSINESS — APPORTEUR NOPALOU\n\nVous avez le contact des boutiques, agences immo ou vendeurs de Dakar ?\n\nPrésentez-leur Nopalou et recevez ${taux}% de leur abonnement mensuel — tant qu'ils restent abonnés.\n\n📊 Exemple de revenus :\n• 5 boutiques Pro : ${(5 * commPro).toLocaleString('fr-FR')} FCFA/mois\n• 10 boutiques Business : ${(10 * commBusiness).toLocaleString('fr-FR')} FCFA/mois\n\n👉 nopalou.com/compte/apporteur\n\n#Nopalou #Apporteur #OpportunitéBusiness #Dakar #Sénégal`,
        `📣 REJOIGNEZ LE RÉSEAU NOPALOU !\n\nSoyez au cœur du développement du e-commerce sénégalais :\n\n✅ Recrutez des boutiques locales sur Nopalou\n✅ Touchez ${taux}% de commission récurrente à vie\n✅ Accès à votre tableau de bord de suivi\n✅ Kit de présentation prêt à l'emploi\n\n👉 Démarrez gratuitement : nopalou.com/compte/apporteur\n\n#Nopalou #Apporteur #ResseauBusiness #Dakar #Sénégal`,
      ];
      result = {
        message: gabarits[Math.floor(Math.random() * gabarits.length)],
        image_url: null,
        lien: 'https://nopalou.com/compte/apporteur',
      };
    }

    else if (type === 'vente-flash') {
      const { rows } = await pool.query(`
        SELECT p.nom, p.marque, p.image_url, p.id as produit_id,
               MIN(o.prix) as prix_min,
               (SELECT m.nom FROM marchands m
                JOIN offres o2 ON o2.marchand_id = m.id
                WHERE o2.produit_id = p.id AND o2.stock = true AND o2.prix > 0
                ORDER BY o2.prix ASC LIMIT 1) as marchand
        FROM produits p
        JOIN offres o ON o.produit_id = p.id
        WHERE o.stock = true AND o.prix > 0 AND p.image_url IS NOT NULL
        GROUP BY p.id, p.nom, p.marque, p.image_url
        ORDER BY RANDOM()
        LIMIT 5
      `);
      if (rows.length) {
        const p = rows[Math.floor(Math.random() * rows.length)];
        const nom = [p.marque, p.nom].filter(Boolean).join(' ');
        const gabarits = [
          `⚡ VENTE FLASH — OFFRE LIMITÉE !\n\n🔥 ${nom}\n💰 Prix : ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA chez ${p.marchand}\n\n⏰ Offre valable tant que le stock dure !\n\n🛒 Commandez maintenant et économisez en comparant avant d'acheter sur Nopalou.\n\n👉 nopalou.com\n\n#VenteFlash #BonPlan #Dakar #Sénégal #Nopalou #Shopping`,
          `🔴 ALERTE BON PRIX — NE RATEZ PAS ÇA !\n\n${nom} à seulement ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA chez ${p.marchand}.\n\n⏳ Ce prix peut changer à tout moment — comparez et commandez vite !\n\nNopalou surveille les prix en temps réel pour vous. Activez une alerte prix pour ne plus jamais rater une promo.\n\n👉 nopalou.com\n\n#AlertePrix #VenteFlash #Dakar #Sénégal #Nopalou`,
          `🎯 OFFRE DU MOMENT !\n\n${nom}\n\n✅ Prix : ${Number(p.prix_min).toLocaleString('fr-FR')} FCFA\n✅ Disponible chez ${p.marchand}\n✅ Stock limité — commandez sans attendre\n\nSur Nopalou, créez une alerte gratuite pour être prévenu dès qu'un produit baisse de prix.\n\n👉 nopalou.com\n\n#Promo #VenteFlash #BonPlan #Dakar #Sénégal #Nopalou`,
        ];
        result = {
          message: gabarits[Math.floor(Math.random() * gabarits.length)],
          image_url: p.image_url,
          lien: `https://nopalou.com/produit/${p.produit_id}`,
        };
      }
    }

    if (!result) return res.status(404).json({ error: 'Aucun contenu trouvé pour ce type' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// GET /api/facebook-posts
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM facebook_posts ORDER BY created_at DESC LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facebook-posts — créer un brouillon
router.post('/', async (req, res) => {
  const { message, lien, image_url, publier_instagram, date_publication } = req.body;
  if (!message) return res.status(400).json({ error: 'message requis' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO facebook_posts (message, lien, image_url, publier_instagram, date_publication)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [message, lien || null, image_url || null, !!publier_instagram, date_publication || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/facebook-posts/:id — modifier
router.patch('/:id', async (req, res) => {
  const { message, lien, image_url, publier_instagram, date_publication, statut } = req.body;
  const allowed = ['brouillon', 'approuve'];
  if (statut && !allowed.includes(statut)) return res.status(400).json({ error: 'statut invalide' });
  try {
    const { rows } = await pool.query(
      `UPDATE facebook_posts
       SET message           = COALESCE($1, message),
           lien              = COALESCE($2, lien),
           image_url         = COALESCE($3, image_url),
           publier_instagram  = CASE WHEN $4::boolean IS NOT NULL THEN $4::boolean ELSE publier_instagram END,
           date_publication  = COALESCE($5, date_publication),
           statut            = COALESCE($6, statut),
           updated_at        = NOW()
       WHERE id = $7 AND statut NOT IN ('publie')
       RETURNING *`,
      [message || null, lien || null, image_url || null,
       publier_instagram !== undefined ? publier_instagram : null,
       date_publication || null, statut || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable ou déjà publié' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/facebook-posts/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM facebook_posts WHERE id = $1 AND statut != 'publie'`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facebook-posts/:id/publier — publication immédiate
router.post('/:id/publier', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`SELECT * FROM facebook_posts WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable' });
    const post = rows[0];
    if (post.statut === 'publie') return res.status(400).json({ error: 'Déjà publié' });

    const results = await publierPost(post);

    await pool.query(
      `UPDATE facebook_posts
       SET statut='publie', post_fb_id=$1, post_ig_id=$2, date_publie=NOW(),
           erreur=$3, updated_at=NOW()
       WHERE id=$4`,
      [results.fb_id || null, results.ig_id || null, results.erreur || null, id]
    );

    if (results.erreur && !results.fb_id) return res.status(502).json({ error: results.erreur });
    res.json({ ok: true, fb_id: results.fb_id, ig_id: results.ig_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Fonctions de publication ──────────────────────────────────────────────────

async function publierPost(post) {
  const results = { fb_id: null, ig_id: null, erreur: null };

  // Publication Facebook
  const fbRes = await publierFacebook(post);
  if (fbRes.id) {
    results.fb_id = fbRes.id;
  } else {
    results.erreur = `FB: ${fbRes.error?.message || 'Erreur inconnue'}`;
  }

  // Publication Instagram (si demandé et FB réussi)
  if (post.publier_instagram && process.env.IG_USER_ID) {
    const igRes = await publierInstagram(post);
    if (igRes.id) {
      results.ig_id = igRes.id;
    } else {
      const igErr = `IG: ${igRes.error?.message || 'Erreur inconnue'}`;
      results.erreur = results.erreur ? `${results.erreur} | ${igErr}` : igErr;
    }
  }

  return results;
}

async function publierFacebook(post) {
  return new Promise(async (resolve) => {
    const pageId = process.env.FB_PAGE_ID;
    const token  = await getToken();
    if (!pageId || !token) return resolve({ error: { message: 'FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN non configurés' } });

    // Post avec photo → /photos, sinon → /feed
    const endpoint = post.image_url ? 'photos' : 'feed';
    const params = { access_token: token };
    if (post.image_url) {
      params.url     = post.image_url;
      params.caption = post.message;
    } else {
      params.message = post.message;
      if (post.lien) params.link = post.lien;
    }

    const body = Buffer.from(qs.stringify(params), 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${pageId}/${endpoint}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length },
    };
    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', e => resolve({ error: { message: e.message } }));
    req.write(body);
    req.end();
  });
}

async function publierInstagram(post) {
  const igId = process.env.IG_USER_ID;
  const token = await getToken();
  if (!igId || !token) return { error: { message: 'IG_USER_ID non configuré' } };
  if (!post.image_url) return { error: { message: 'Une image est requise pour Instagram' } };

  // Étape 1 : créer le container média
  const container = await igApiCall('POST', `/${igId}/media`, {
    image_url: post.image_url,
    caption: post.message,
    access_token: token,
  });
  if (!container.id) return container;

  // Étape 2 : attendre que le container soit prêt (max 30s)
  const ready = await waitForIgContainer(container.id, token);
  if (!ready) return { error: { message: 'Instagram n\'a pas pu traiter l\'image dans le délai imparti (vérifiez que l\'URL est publique et en HTTPS)' } };

  // Étape 3 : publier le container
  return igApiCall('POST', `/${igId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
}

async function waitForIgContainer(containerId, token, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await igApiCall('GET', `/${containerId}?fields=status_code,status`, { access_token: token });
    if (status.status_code === 'FINISHED') return true;
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') return false;
  }
  return false;
}

function igApiCall(method, path, params) {
  return new Promise((resolve) => {
    const isGet = method === 'GET';
    const queryString = qs.stringify(params);
    const fullPath = isGet ? `/v19.0${path}&${queryString}` : `/v19.0${path}`;
    const body = isGet ? null : Buffer.from(queryString, 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: fullPath,
      method,
      headers: isGet ? {} : { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length },
    };
    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', e => resolve({ error: { message: e.message } }));
    if (body) req.write(body);
    req.end();
  });
}

module.exports = router;
module.exports.publierPost = publierPost;
