// scripts/audit/scraping/test-admin-routes.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const request = require('supertest');

const scraperRouter = require(path.join(__dirname, '../../../backend/routes/scraper'));

const app = express();
app.use(express.json());
// Injecter req.user ou req.headers pour le middleware admin
app.use((req, res, next) => {
  req.headers['x-admin-secret'] = process.env.ADMIN_SECRET || 'secret';
  next();
});
app.use('/api/scraper', scraperRouter);

(async () => {
  console.log('Test route GET /api/scraper/runs...');
  const resRuns = await request(app).get('/api/scraper/runs?limite=5');
  console.log('Status runs:', resRuns.status);
  console.log('Total runs:', resRuns.body.total);
  console.log('KPIs:', resRuns.body.kpis);
  if (resRuns.body.runs && resRuns.body.runs.length > 0) {
    console.log('Dernier run:', resRuns.body.runs[0]);
  }

  console.log('\nTest route GET /api/scraper/v2/sources...');
  const resSources = await request(app).get('/api/scraper/v2/sources');
  console.log('Status sources:', resSources.status);
  console.log('Total sources V2:', resSources.body.total);
  console.table(resSources.body.sources.slice(0, 5).map(s => ({
    nom: s.nom,
    methode: s.type_methode,
    offres: s.nb_offres,
    sync: s.derniere_sync ? s.derniere_sync.slice(0, 10) : 'none',
    dernier_run: s.dernier_run ? `${s.dernier_run.statut} (${s.dernier_run.items_extraits} items)` : 'aucun'
  })));

  process.exit(0);
})();
