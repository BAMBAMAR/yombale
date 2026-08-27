const router = require('express').Router();
const { pool } = require('../models/db');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── GET /api/entites/resoudre/:id — Résolveur Universel d'Entités et de Liens ──
// Permet de retrouver l'URL canonique exacte de n'importe quelle ressource
// (immo, annonce, boutique, produit marchand, commande, forfait, alias statique)
// pour éliminer toute erreur 404 sur les boutons WhatsApp Meta et la navigation.
router.get('/resoudre/:id', async (req, res) => {
  try {
    let idParam = String(req.params.id || '').trim();
    if (!idParam) {
      return res.json({ found: false, type: 'inconnu', url: '/' });
    }

    // 1. Décodage et nettoyage du paramètre
    try {
      idParam = decodeURIComponent(idParam);
    } catch {
      // conserver tel quel
    }

    // Normalisation de base
    const cleanId = idParam.replace(/^\/+/, '');
    const cleanLower = cleanId.toLowerCase();

    // 2. Mappages directs d'alias statiques connus
    const ALIAS_MAP = {
      'boutique': '/boutique?tab=commandes',
      'boutique?tab=commandes': '/boutique?tab=commandes',
      'commandes': '/boutique?tab=commandes',
      'mes-commandes': '/boutique?tab=commandes',
      'caisse': '/boutique/caisse',
      'mes-annonces': '/compte?tab=mes-annonces',
      'mes-annonces-immo': '/compte?tab=mes-annonces-immo',
      'compte': '/compte',
      'mon-compte': '/compte',
      'profil': '/compte?tab=profil',
      'favoris': '/favoris',
      'mes-favoris': '/favoris',
      'alertes': '/mes-alertes',
      'mes-alertes': '/mes-alertes',
      'telecom': '/telecom',
      'telecoms': '/telecom',
      'forfaits': '/telecom',
      'immo': '/immo',
      'immobilier': '/immo',
      'annonces': '/annonces',
      'boutiques': '/boutiques',
      'accueil': '/',
      'home': '/',
    };

    if (ALIAS_MAP[cleanLower]) {
      return res.json({ found: true, type: 'alias', url: ALIAS_MAP[cleanLower] });
    }

    // 3. Commandes boutique (par référence ou id)
    if (cleanId.startsWith('CMD-') || cleanId.startsWith('cmd_') || cleanId.startsWith('C-') || cleanId.startsWith('PAY-')) {
      const { rows: cmdRows } = await pool.query(
        'SELECT reference FROM commandes_boutique WHERE reference = $1 OR reference ILIKE $2 LIMIT 1',
        [cleanId, `%${cleanId}%`]
      );
      if (cmdRows[0]) {
        return res.json({ found: true, type: 'commande', url: `/suivi-commande?ref=${cmdRows[0].reference}` });
      }
      return res.json({ found: true, type: 'commande', url: `/suivi-commande?ref=${cleanId}` });
    }

    const isUUID = UUID_RE.test(cleanId);

    // 4. Si c'est un UUID : vérification des tables avec clés primaires UUID
    if (isUUID) {
      // 4a. Annonces immobilières
      const { rows: immoRows } = await pool.query('SELECT id FROM annonces_immo WHERE id = $1 LIMIT 1', [cleanId]);
      if (immoRows[0]) {
        return res.json({ found: true, type: 'immo', url: `/immo/${immoRows[0].id}` });
      }

      // 4b. Annonces classifiées
      const { rows: annRows } = await pool.query('SELECT id FROM annonces_classifiees WHERE id = $1 LIMIT 1', [cleanId]);
      if (annRows[0]) {
        return res.json({ found: true, type: 'annonce', url: `/annonces/${annRows[0].id}` });
      }

      // 4c. Produits de boutique marchande
      const { rows: prodRows } = await pool.query(
        `SELECT p.id, b.slug, b.id AS boutique_id 
         FROM boutique_produits p 
         JOIN boutiques b ON b.id = p.boutique_id 
         WHERE p.id = $1 LIMIT 1`,
        [cleanId]
      );
      if (prodRows[0]) {
        const bIdent = prodRows[0].slug || prodRows[0].boutique_id;
        return res.json({ found: true, type: 'boutique_produit', url: `/boutiques/${bIdent}/produits/${prodRows[0].id}` });
      }

      // 4d. Boutiques par UUID
      const { rows: bqRows } = await pool.query('SELECT id, slug FROM boutiques WHERE id = $1 LIMIT 1', [cleanId]);
      if (bqRows[0]) {
        return res.json({ found: true, type: 'boutique', url: `/boutiques/${bqRows[0].slug || bqRows[0].id}` });
      }

      // 4e. Commandes par UUID
      const { rows: cmdRows } = await pool.query('SELECT reference FROM commandes_boutique WHERE id = $1 LIMIT 1', [cleanId]);
      if (cmdRows[0]) {
        return res.json({ found: true, type: 'commande', url: `/suivi-commande?ref=${cmdRows[0].reference}` });
      }
    }

    // 5. Recherche par slug ou identifiant numérique/textuel
    // 5a. Boutiques par slug
    const { rows: bqSlugRows } = await pool.query('SELECT id, slug FROM boutiques WHERE slug = $1 LIMIT 1', [cleanLower]);
    if (bqSlugRows[0]) {
      return res.json({ found: true, type: 'boutique', url: `/boutiques/${bqSlugRows[0].slug || bqSlugRows[0].id}` });
    }

    // 5b. Produits du comparateur (id entier)
    if (/^\d+$/.test(cleanId)) {
      const { rows: pCompRows } = await pool.query('SELECT id FROM produits WHERE id = $1 LIMIT 1', [parseInt(cleanId, 10)]);
      if (pCompRows[0]) {
        return res.json({ found: true, type: 'produit', url: `/produit/${pCompRows[0].id}` });
      }

      // 5c. Forfaits télécom (id entier)
      const { rows: telRows } = await pool.query('SELECT id FROM forfaits_telecom WHERE id = $1 LIMIT 1', [parseInt(cleanId, 10)]);
      if (telRows[0]) {
        return res.json({ found: true, type: 'telecom', url: `/telecom/${telRows[0].id}` });
      }
    }

    // 6. Aucun match trouvé : renvoyer un fallback propre
    res.json({ found: false, type: 'inconnu', url: '/' });
  } catch (err) {
    console.error('[GET /api/entites/resoudre/:id]', err.message);
    res.status(500).json({ error: 'Erreur lors de la résolution de l\'entité', url: '/' });
  }
});

module.exports = router;
