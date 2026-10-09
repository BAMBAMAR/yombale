// backend/routes/surga/index.js
// Routeur maître du module Surga

const express = require('express');
const router = express.Router();
const { exigerBase } = require('../../middlewares/surga-base');
const { surveillance, demarrerVeille } = require('../../services/surga/surveillance');

// SRG-A5-008 : chaque réponse est comptée par famille de routes (y compris les 503 de l'absence de base) ; au-dessus
// du seuil d'erreurs 5xx, l'administrateur est alerté.
router.use(surveillance().intergiciel);
demarrerVeille({ erreurs: true });

// Sans base, aucune route ne répond depuis un repli en mémoire (sauf météo, scores et radios, qui n'en dépendent pas).
router.use(exigerBase);

router.use('/', require('./preferences'));
router.use('/', require('./briefing'));
router.use('/', require('./notes'));
router.use('/', require('./depenses'));
router.use('/', require('./agenda'));
router.use('/', require('./sync'));
router.use('/', require('./presse'));
router.use('/', require('./kiosque'));
router.use('/', require('./audio'));
router.use('/', require('./radio'));
router.use('/', require('./trafic'));
router.use('/', require('./immo'));
router.use('/', require('./concours'));
router.use('/', require('./places'));
router.use('/', require('./abonnements'));
router.use('/', require('./donnees'));
router.use('/', require('./meteo'));
router.use('/', require('./sport'));
router.use('/', require('./videos'));
router.use('/', require('./emploi'));
router.use('/', require('./demarches'));
router.use('/', require('./assistant'));
router.use('/', require('./shopping'));

module.exports = router;


