// backend/routes/boutiques-modules/index.js — Agrégateur principal des sous-routeurs boutiques
const router = require('express').Router();

router.use(require('./boutiques-crud'));
router.use(require('./boutiques-admin'));
router.use(require('./boutiques-produits'));
router.use(require('./boutiques-commandes'));
router.use(require('./boutiques-pos'));
router.use(require('./boutiques-equipe'));
router.use(require('./boutiques-documents'));
router.use(require('./boutiques-fournisseurs'));
router.use(require('./boutiques-fidelite'));
router.use(require('./boutiques-integrations'));
router.use(require('./boutiques-abtest'));
router.use(require('./boutiques-club-vip'));
router.use(require('./credits'));
router.use(require('./entrepots'));

module.exports = router;
