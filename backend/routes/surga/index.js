// backend/routes/surga/index.js
// Routeur maître du module Surga

const express = require('express');
const router = express.Router();

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

module.exports = router;


